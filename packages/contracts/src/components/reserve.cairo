#[starknet::component]
pub mod ReserveManagerComponent {
    use core::num::traits::CheckedMul;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{
        StoragePointerWriteAccess, StoragePointerReadAccess, Map, StorageMapReadAccess,
        StorageMapWriteAccess,
    };
    use core::array::ArrayTrait;
    use core::traits::Into;
    use shieldly::types::types::ReserveData;
    use shieldly::interface::reserve::IReserveManager;
    use shieldly::errors::ReserveErrors;

    // Constants
    const BASIS_POINTS_DENOMINATOR: u16 = 10000; // 100% in basis points
    const DEFAULT_YIELD_RATE_BPS: u16 = 500; // 5% annual yield
    const SECONDS_PER_YEAR: u64 = 31536000; // 365 days in seconds
    const PREMIUM_YIELD_PERCENTAGE: u8 = 65; // 65% of premiums go to yield

    #[storage]
    pub struct Storage {
        // Reserve data
        reserve_data: ReserveData,
        // User balances and yield
        funder_stakes: Map<ContractAddress, u256>,
        accrued_yields: Map<ContractAddress, u256>,
        last_yield_claimed: Map<ContractAddress, u64>,
        // Token configuration
        staking_token: ContractAddress,
        // Premium tracking for yield calculation
        weekly_premium_pool: u256,
        reserve_premium_distribution: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        FundsStaked: FundsStaked,
        FundsUnstaked: FundsUnstaked,
        YieldDistributed: YieldDistributed,
        YieldClaimed: YieldClaimed,
        YieldRateUpdated: YieldRateUpdated,
        FundsTransferred: FundsTransferred,
        StakingTokenSet: StakingTokenSet,
        PremiumReceived: PremiumReceived,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FundsStaked {
        #[key]
        funder: ContractAddress,
        amount: u256,
        total_stake: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FundsUnstaked {
        #[key]
        funder: ContractAddress,
        amount: u256,
        remaining_stake: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct YieldDistributed {
        total_yield: u256,
        timestamp: u64,
        from_premiums: bool,
    }

    #[derive(Drop, starknet::Event)]
    pub struct YieldClaimed {
        #[key]
        user: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct YieldRateUpdated {
        previous_rate_bps: u16,
        new_rate_bps: u16,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FundsTransferred {
        from: ContractAddress,
        to: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct StakingTokenSet {
        token: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PremiumReceived {
        amount: u256,
        current_pool: u256,
    }

    #[embeddable_as(ReserveManagerImpl)]
    pub impl ReserveManager<
        TContractState,
        +HasComponent<TContractState>,
        impl Ownable: OwnableComponent::HasComponent<TContractState>,
    > of IReserveManager<ComponentState<TContractState>> {
        fn stake_funds(ref self: ComponentState<TContractState>, amount: u256) {
            // Validate amount
            assert(amount > 0, ReserveErrors::InvalidAmount);

            let caller = get_caller_address();
            let token_address = self.staking_token.read();

            // Update user stake
            let current_stake = self.funder_stakes.read(caller);
            let new_stake = current_stake + amount;
            self.funder_stakes.write(caller, new_stake);

            // Update reserve data
            let mut reserve_data = self.reserve_data.read();
            if current_stake == 0 {
                reserve_data.total_stakers += 1;
            }
            reserve_data.total_funds += amount;
            self.reserve_data.write(reserve_data);

            // Set last_yield_claimed if first time staking
            if self.last_yield_claimed.read(caller) == 0 {
                self.last_yield_claimed.write(caller, get_block_timestamp());
            }

            // Transfer funds from user to contract using ERC20
            let token = IERC20Dispatcher { contract_address: token_address };
            let result = token.transfer_from(caller, get_contract_address(), amount);
            assert(result, ReserveErrors::TokenTransferFailed);

            // Emit event
            self.emit(FundsStaked { funder: caller, amount: amount, total_stake: new_stake });
        }

        fn unstake_funds(ref self: ComponentState<TContractState>, amount: u256) {
            let caller = get_caller_address();
            let current_stake = self.funder_stakes.read(caller);
            let token_address = self.staking_token.read();

            // Validate amount
            assert(amount > 0, ReserveErrors::InvalidAmount);
            assert(current_stake >= amount, ReserveErrors::InsufficientFunds);

            // Claim any pending yield first
            self.claim_yield();

            // Update user stake
            let new_stake = current_stake - amount;
            self.funder_stakes.write(caller, new_stake);

            // Update reserve data
            let mut reserve_data = self.reserve_data.read();
            if new_stake == 0 {
                reserve_data.total_stakers -= 1;
            }
            reserve_data.total_funds -= amount;
            self.reserve_data.write(reserve_data);

            // Transfer funds from contract to user using ERC20
            let token = IERC20Dispatcher { contract_address: token_address };
            let result = token.transfer(caller, amount);
            assert(result, ReserveErrors::TokenTransferFailed);

            // Emit event
            self.emit(FundsUnstaked { funder: caller, amount: amount, remaining_stake: new_stake });
        }

        fn get_funder_stake(
            self: @ComponentState<TContractState>, funder: ContractAddress,
        ) -> u256 {
            self.funder_stakes.read(funder)
        }

        fn distribute_yield(ref self: ComponentState<TContractState>) {
            // Get reserve data
            let mut reserve_data = self.reserve_data.read();
            let now = get_block_timestamp();
            let total_funds = reserve_data.total_funds;

            // Don't distribute if no stakers
            if reserve_data.total_stakers == 0 || total_funds == 0 {
                return;
            }

            // Calculate time elapsed since last distribution
            let last_distribution = reserve_data.last_yield_distribution;
            if last_distribution == 0 {
                // First distribution, just update timestamp
                reserve_data.last_yield_distribution = now;
                self.reserve_data.write(reserve_data);
                return;
            }

            // Check weekly premium pool first (takes priority over time-based yield)
            let premium_pool = self.weekly_premium_pool.read();
            if premium_pool > 0 {
                // Distribute 65% of premium pool as yield
                let yield_amount = (premium_pool * PREMIUM_YIELD_PERCENTAGE.into()) / 100;

                // Reset the premium pool
                self.weekly_premium_pool.write(0);

                // Update last distribution timestamp
                reserve_data.last_yield_distribution = now;
                self.reserve_premium_distribution.write(now);
                self.reserve_data.write(reserve_data);

                // Emit event for premium-based yield
                self
                    .emit(
                        YieldDistributed {
                            total_yield: yield_amount, timestamp: now, from_premiums: true,
                        },
                    );

                return;
            }

            // Fallback to time-based yield if no premiums
            let elapsed_seconds = now - last_distribution;
            if elapsed_seconds == 0 {
                return;
            }

            // Calculate yield rate for the period
            // (annual_rate_bps / 10000) * (elapsed_seconds / seconds_per_year) * total_funds
            let rate_bps = reserve_data.yield_rate_bps;

            // Safe multiplication with overflow check
            let numerator = match elapsed_seconds.checked_mul(rate_bps.into()) {
                Option::Some(value) => value,
                Option::None => { return; } // Exit function if overflow occurred
            };

            let denominator = match SECONDS_PER_YEAR.checked_mul(BASIS_POINTS_DENOMINATOR.into()) {
                Option::Some(value) => value,
                Option::None => { return; } // Exit function if overflow occurred
            };

            let yield_fraction = numerator / denominator;

            let total_yield = (reserve_data.total_funds * yield_fraction.into())
                / 1000000000000000000; // Scaling

            // Update last distribution timestamp
            reserve_data.last_yield_distribution = now;
            self.reserve_data.write(reserve_data);

            // Emit event for time-based yield
            self
                .emit(
                    YieldDistributed {
                        total_yield: total_yield, timestamp: now, from_premiums: false,
                    },
                );
        }

        fn claim_yield(ref self: ComponentState<TContractState>) -> u256 {
            let caller = get_caller_address();
            let stake = self.funder_stakes.read(caller);
            let token_address = self.staking_token.read();

            // Check if user has any stake
            assert(stake > 0, ReserveErrors::NoStake);

            // Calculate yield
            let reserve_data = self.reserve_data.read();
            let now = get_block_timestamp();
            let last_claimed = self.last_yield_claimed.read(caller);

            // Calculate time elapsed since last claim
            let elapsed_seconds = now - last_claimed;
            if elapsed_seconds == 0 {
                return 0; // No yield to claim
            }

            // Calculate yield for the user
            // (annual_rate_bps / 10000) * (elapsed_seconds / seconds_per_year) * user_stake
            let rate_bps = reserve_data.yield_rate_bps;

            // Safe multiplication with overflow check
            let numerator = match elapsed_seconds.checked_mul(rate_bps.into()) {
                Option::Some(value) => value,
                Option::None => { return 0; } // Return 0 if overflow occurred
            };

            let denominator = match SECONDS_PER_YEAR.checked_mul(BASIS_POINTS_DENOMINATOR.into()) {
                Option::Some(value) => value,
                Option::None => { return 0; } // Return 0 if overflow occurred
            };

            let yield_fraction = numerator / denominator;

            let user_yield = (stake * yield_fraction.into()) / 1000000000000000000; // Scaling

            // Add any previously accrued yield
            let total_yield = self.accrued_yields.read(caller) + user_yield;
            if total_yield == 0 {
                return 0;
            }

            // Reset accrued yield and update last claim time
            self.accrued_yields.write(caller, 0);
            self.last_yield_claimed.write(caller, now);

            // Transfer yield to user using ERC20
            let token = IERC20Dispatcher { contract_address: token_address };
            let result = token.transfer(caller, total_yield);
            assert(result, ReserveErrors::TokenTransferFailed);

            // Emit event
            self.emit(YieldClaimed { user: caller, amount: total_yield });

            total_yield
        }

        fn get_yield_info(
            self: @ComponentState<TContractState>, user: ContractAddress,
        ) -> (u256, u64) {
            let accrued_yield = self.accrued_yields.read(user);
            let last_claimed = self.last_yield_claimed.read(user);
            (accrued_yield, last_claimed)
        }

        fn get_reserve_info(self: @ComponentState<TContractState>) -> ReserveData {
            self.reserve_data.read()
        }

        fn get_available_funds(self: @ComponentState<TContractState>) -> u256 {
            let reserve_data = self.reserve_data.read();
            (reserve_data.total_funds * 80) / 100
        }

        fn set_yield_rate(ref self: ComponentState<TContractState>, rate_bps: u16) {
            // Validate rate
            assert(rate_bps <= 5000, ReserveErrors::RateExceedsMax); // Reasonable maximum

            // Distribute yield with old rate before changing
            self.distribute_yield();

            // Update rate
            let mut reserve_data = self.reserve_data.read();
            let previous_rate = reserve_data.yield_rate_bps;
            reserve_data.yield_rate_bps = rate_bps;
            self.reserve_data.write(reserve_data);

            // Emit event
            self
                .emit(
                    YieldRateUpdated { previous_rate_bps: previous_rate, new_rate_bps: rate_bps },
                );
        }

        fn transfer_from_reserve(
            ref self: ComponentState<TContractState>, to: ContractAddress, amount: u256,
        ) -> bool {
            // Validate amount
            assert(amount > 0, ReserveErrors::InvalidAmount);

            // Check if reserve has enough funds
            let mut reserve_data = self.reserve_data.read();
            let available = self.get_available_funds();
            assert(available >= amount, ReserveErrors::InsufficientFunds);

            // Update reserve data
            reserve_data.total_funds -= amount;
            self.reserve_data.write(reserve_data);

            // Transfer funds from contract to recipient using ERC20
            let token_address = self.staking_token.read();

            let token = IERC20Dispatcher { contract_address: token_address };
            let result = token.transfer(to, amount);
            assert(result, ReserveErrors::TokenTransferFailed);

            // Emit event
            self.emit(FundsTransferred { from: get_contract_address(), to: to, amount: amount });

            true
        }

        fn transfer_to_reserve(
            ref self: ComponentState<TContractState>, from: ContractAddress, amount: u256,
        ) -> bool {
            // Validate amount
            assert(amount > 0, ReserveErrors::InvalidAmount);

            // Update reserve data
            let mut reserve_data = self.reserve_data.read();
            reserve_data.total_funds += amount;
            self.reserve_data.write(reserve_data);

            // Add to weekly premium pool for yield calculation
            let current_pool = self.weekly_premium_pool.read();
            let new_pool = current_pool + amount;
            self.weekly_premium_pool.write(new_pool);

            // Emit premium received event
            self.emit(PremiumReceived { amount: amount, current_pool: new_pool });

            // Transfer funds from sender to contract
            let token_address = self.staking_token.read();

            // For direct transfers from user to contract
            let contract_addr = get_contract_address();
            let token = IERC20Dispatcher { contract_address: token_address };
            let result = token.transfer_from(from, contract_addr, amount);
            assert(result, ReserveErrors::TokenTransferFailed);

            // Emit event
            self.emit(FundsTransferred { from: from, to: contract_addr, amount: amount });

            true
        }

        fn staking_token(self: @ComponentState<TContractState>) -> ContractAddress {
            self.staking_token.read()
        }
    }

    // Internal functions that are not exposed via the interface
    #[generate_trait]
    pub impl InternalFunctions<
        TContractState,
        +HasComponent<TContractState>,
        impl Ownable: OwnableComponent::HasComponent<TContractState>,
    > of InternalFunctionsTrait<TContractState> {
        fn initializer(ref self: ComponentState<TContractState>) {
            self.weekly_premium_pool.write(0);
            self.reserve_premium_distribution.write(0);
            let reserve_data = ReserveData {
                total_funds: 0,
                total_stakers: 0,
                last_yield_distribution: 0,
                yield_rate_bps: DEFAULT_YIELD_RATE_BPS,
            };
            self.reserve_data.write(reserve_data);
        }

        fn calculate_user_yield(
            self: @ComponentState<TContractState>, user: ContractAddress,
        ) -> u256 {
            // Calculate pending yield for a user
            let stake = self.funder_stakes.read(user);
            if stake == 0 {
                return 0;
            }

            let reserve_data = self.reserve_data.read();
            let now = get_block_timestamp();
            let last_claimed = self.last_yield_claimed.read(user);

            // Calculate time elapsed since last claim
            let elapsed_seconds = now - last_claimed;
            if elapsed_seconds == 0 {
                return 0;
            }

            // Calculate yield
            let rate_bps = reserve_data.yield_rate_bps;

            // Safe multiplication with overflow check
            let numerator = match elapsed_seconds.checked_mul(rate_bps.into()) {
                Option::Some(value) => value,
                Option::None => { return 0; } // Return 0 if overflow occurred
            };

            let denominator = match SECONDS_PER_YEAR.checked_mul(BASIS_POINTS_DENOMINATOR.into()) {
                Option::Some(value) => value,
                Option::None => { return 0; } // Return 0 if overflow occurred
            };

            let yield_fraction = numerator / denominator;

            (stake * yield_fraction.into()) / 1000000000000000000 // Scaling
        }

        fn set_staking_token(ref self: ComponentState<TContractState>, token: ContractAddress) {
            // Set the token
            self.staking_token.write(token);

            // Emit event
            self.emit(StakingTokenSet { token: token });
        }
    }
}
