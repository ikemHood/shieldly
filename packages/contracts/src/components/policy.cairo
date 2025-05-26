#[starknet::component]
pub mod PolicyManagerComponent {
    use OracleComponent::ExternalTrait;
    use starknet::storage::{
        StoragePointerWriteAccess, StoragePointerReadAccess, Map, StorageMapReadAccess,
        StorageMapWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use openzeppelin::access::ownable::OwnableComponent;
    use core::array::ArrayTrait;
    use core::traits::Into;
    use shieldly::types::types::{
        Policy, PolicyStatus, PolicyMetadata, UserPolicy, Claim, ClaimStatus,
    };
    use shieldly::interface::policy::IPolicyManager;
    use shieldly::components::oracle::OracleComponent;
    use shieldly::components::reserve::ReserveManagerComponent;
    use shieldly::interface::reserve::IReserveManager;
    use shieldly::errors::PolicyErrors;

    // Constants
    const SECONDS_PER_WEEK: u64 = 604800;

    #[storage]
    pub struct Storage {
        // Policy management
        policies: Map<u256, Policy>,
        policy_count: u256,
        // User policy management
        user_policies: Map<(ContractAddress, u256), UserPolicy>,
        // Arrays in storage need special handling
        user_policy_ids: Map<
            (ContractAddress, u32), u256,
        >, // Store array elements individually with an index
        user_policy_counts: Map<ContractAddress, u32>, // Track count of policies per user
        // Claim management
        claims: Map<u256, Claim>,
        claim_count: u256,
        // Arrays in storage need special handling
        policy_claim_ids: Map<(u256, u32), u256>, // Store array elements individually with an index
        policy_claim_counts: Map<u256, u32>, // Track count of claims per policy
        user_claim_ids: Map<
            (ContractAddress, u32), u256,
        >, // Store array elements individually with an index
        user_claim_counts: Map<ContractAddress, u32>, // Track count of claims per user
        // Weekly premium tracker for yield calculation
        weekly_premium_total: u256,
        last_premium_distribution: u64,
        premium_token: ContractAddress,
        // Auto-renewal tracking
        policy_renewals: Map<
            (ContractAddress, u256), u256,
        >, // Map (user, policy_id) => remaining renewals
        policy_last_renewal: Map<
            (ContractAddress, u256), u64,
        >, // Map (user, policy_id) => last renewal timestamp
        whitelisted_renewers: Map<
            ContractAddress, bool,
        >, // Authorized addresses that can trigger renewal
        policy_renewal_interval: Map<
            (ContractAddress, u256), u64,
        >, // Map (user, policy_id) => renewal interval in seconds
        // Dynamic yield rate tracking
        weekly_policy_purchases: u256, // Number of policies purchased this week
        weekly_premium_volume: u256, // Total premium volume this week
        last_week_policy_purchases: u256, // Previous week's policy purchases
        last_week_premium_volume: u256, // Previous week's premium volume
        yield_calculation_timestamp: u64, // Last time yield rate was calculated
        total_policies_purchased: u256, // Total policies purchased since inception
        total_premium_volume: u256, // Total premium volume since inception
        // Sustainability tracking
        weekly_claims_paid: u256, // Total claims paid this week
        weekly_claims_volume: u256, // Total claim payout volume this week
        last_week_claims_paid: u256, // Previous week's claims paid
        last_week_claims_volume: u256, // Previous week's claim volume
        yield_rate_history: Map<u64, u16>, // Historical yield rates for smoothing
        yield_rate_change_count: u32 // Number of yield rate changes for stability tracking
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PolicyCreated: PolicyCreated,
        PolicyStatusChanged: PolicyStatusChanged,
        PolicyPurchased: PolicyPurchased,
        ClaimSubmitted: ClaimSubmitted,
        ClaimProcessed: ClaimProcessed,
        ClaimPaid: ClaimPaid,
        PremiumSentToReserve: PremiumSentToReserve,
        WeeklyPremiumDistributed: WeeklyPremiumDistributed,
        PolicyRenewed: PolicyRenewed,
        AutoRenewalCancelled: AutoRenewalCancelled,
        RenewerStatusUpdated: RenewerStatusUpdated,
        DynamicYieldRateUpdated: DynamicYieldRateUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PolicyCreated {
        #[key]
        policy_id: u256,
        creator: ContractAddress,
        coverage_amount: u256,
        premium_amount: u256,
        payout_amount: u256,
        term_days: u32,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PolicyStatusChanged {
        #[key]
        policy_id: u256,
        new_status: PolicyStatus,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PolicyPurchased {
        #[key]
        policy_id: u256,
        user: ContractAddress,
        purchase_time: u64,
        expiry_time: u64,
        premium_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ClaimSubmitted {
        #[key]
        claim_id: u256,
        #[key]
        policy_id: u256,
        claimant: ContractAddress,
        submission_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ClaimProcessed {
        #[key]
        claim_id: u256,
        status: ClaimStatus,
        processing_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ClaimPaid {
        #[key]
        claim_id: u256,
        #[key]
        policy_id: u256,
        claimant: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PremiumSentToReserve {
        policy_id: u256,
        user: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct WeeklyPremiumDistributed {
        amount: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PolicyRenewed {
        #[key]
        policy_id: u256,
        user: ContractAddress,
        renewal_time: u64,
        premium_amount: u256,
        remaining_renewals: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AutoRenewalCancelled {
        #[key]
        policy_id: u256,
        user: ContractAddress,
        cancellation_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RenewerStatusUpdated {
        renewer: ContractAddress,
        is_whitelisted: bool,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DynamicYieldRateUpdated {
        new_yield_rate_bps: u16,
        weekly_policy_count: u256,
        weekly_premium_volume: u256,
        calculation_timestamp: u64,
    }

    #[embeddable_as(PolicyManagerImpl)]
    pub impl PolicyManager<
        TContractState,
        +HasComponent<TContractState>,
        +Drop<TContractState>,
        impl Ownable: OwnableComponent::HasComponent<TContractState>,
        impl Oracle: OracleComponent::HasComponent<TContractState>,
        impl Reserve: ReserveManagerComponent::HasComponent<TContractState>,
    > of IPolicyManager<ComponentState<TContractState>> {
        fn create_policy(
            ref self: ComponentState<TContractState>, metadata: PolicyMetadata,
        ) -> u256 {
            // Validate policy data
            assert(metadata.coverage_amount > 0, PolicyErrors::CoverageInvalid);
            assert(metadata.premium_amount > 0, PolicyErrors::PremiumInvalid);
            assert(metadata.payout_amount > 0, PolicyErrors::PayoutInvalid);
            assert(metadata.term_days > 0, PolicyErrors::TermInvalid);
            assert(
                metadata.coverage_amount >= metadata.payout_amount,
                PolicyErrors::PayoutExceedsCoverage,
            );

            // Get new policy ID
            let policy_id = self.policy_count.read() + 1;
            self.policy_count.write(policy_id);

            // Create and store policy
            let now = get_block_timestamp();
            let caller = get_caller_address();

            // Store metadata values before moving the struct
            let coverage_amount = metadata.coverage_amount;
            let premium_amount = metadata.premium_amount;
            let payout_amount = metadata.payout_amount;
            let term_days = metadata.term_days;

            let policy = Policy {
                id: policy_id,
                creator: caller,
                metadata: metadata,
                status: PolicyStatus::DRAFT,
                creation_time: now,
                approval_time: 0,
            };
            self.policies.write(policy_id, policy);

            // Emit event
            self
                .emit(
                    PolicyCreated {
                        policy_id: policy_id,
                        creator: caller,
                        coverage_amount: coverage_amount,
                        premium_amount: premium_amount,
                        payout_amount: payout_amount,
                        term_days: term_days,
                    },
                );

            policy_id
        }

        fn get_policy(self: @ComponentState<TContractState>, policy_id: u256) -> Policy {
            assert(policy_id <= self.policy_count.read(), PolicyErrors::PolicyNotFound);
            self.policies.read(policy_id)
        }

        fn list_policies(
            self: @ComponentState<TContractState>, status: PolicyStatus,
        ) -> Array<Policy> {
            let mut result = ArrayTrait::<Policy>::new();
            let policy_count = self.policy_count.read();

            let mut i: u256 = 1;
            while i <= policy_count {
                let policy = self.policies.read(i);
                // Compare policy status with requested status
                if policy.status == status {
                    result.append(policy);
                }
                i += 1;
            };

            result
        }

        fn activate_policy(ref self: ComponentState<TContractState>, policy_id: u256) {
            // Validate policy exists
            assert(policy_id <= self.policy_count.read(), PolicyErrors::PolicyNotFound);
            let mut policy = self.policies.read(policy_id);

            // Update status and approval time
            policy.status = PolicyStatus::ACTIVE;
            policy.approval_time = get_block_timestamp();
            self.policies.write(policy_id, policy);

            // Emit event
            self
                .emit(
                    PolicyStatusChanged { policy_id: policy_id, new_status: PolicyStatus::ACTIVE },
                );
        }

        fn expire_policy(ref self: ComponentState<TContractState>, policy_id: u256) {
            // Validate policy exists
            assert(policy_id <= self.policy_count.read(), PolicyErrors::PolicyNotFound);
            let mut policy = self.policies.read(policy_id);

            // Update status
            policy.status = PolicyStatus::EXPIRED;
            self.policies.write(policy_id, policy);

            // Emit event
            self
                .emit(
                    PolicyStatusChanged { policy_id: policy_id, new_status: PolicyStatus::EXPIRED },
                );
        }

        fn pause_policy(ref self: ComponentState<TContractState>, policy_id: u256) {
            // Validate policy exists
            assert(policy_id <= self.policy_count.read(), PolicyErrors::PolicyNotFound);
            let mut policy = self.policies.read(policy_id);

            // Update status
            policy.status = PolicyStatus::PAUSED;
            self.policies.write(policy_id, policy);

            // Emit event
            self
                .emit(
                    PolicyStatusChanged { policy_id: policy_id, new_status: PolicyStatus::PAUSED },
                );
        }

        fn purchase_policy(ref self: ComponentState<TContractState>, policy_id: u256) -> bool {
            // Validate policy exists and is active
            assert(policy_id <= self.policy_count.read(), PolicyErrors::PolicyNotFound);
            let policy = self.policies.read(policy_id);
            assert(policy.status == PolicyStatus::ACTIVE, PolicyErrors::PolicyNotActive);

            let caller = get_caller_address();
            let now = get_block_timestamp();

            // Calculate expiry time (term_days converted to seconds)
            let term_seconds = policy.metadata.term_days * 86400_u32;
            let expiry_time = now + term_seconds.into();

            // Create user policy
            let user_policy = UserPolicy {
                policy_id: policy_id,
                user: caller,
                purchase_time: now,
                expiry_time: expiry_time,
                is_active: true,
            };

            // Save user policy
            self.user_policies.write((caller, policy_id), user_policy);

            let policy_count = self.user_policy_counts.read(caller);
            let new_index = policy_count;
            self.user_policy_ids.write((caller, new_index), policy_id);
            self.user_policy_counts.write(caller, policy_count + 1);

            // Get the premium amount from policy
            let premium_amount = policy.metadata.premium_amount;

            // Add to weekly premium total
            let current_premium_total = self.weekly_premium_total.read();
            self.weekly_premium_total.write(current_premium_total + premium_amount);

            // Track policy purchase metrics for dynamic yield rate
            let current_weekly_purchases = self.weekly_policy_purchases.read();
            self.weekly_policy_purchases.write(current_weekly_purchases + 1);

            let current_weekly_volume = self.weekly_premium_volume.read();
            self.weekly_premium_volume.write(current_weekly_volume + premium_amount);

            let total_purchases = self.total_policies_purchased.read();
            self.total_policies_purchased.write(total_purchases + 1);

            let total_volume = self.total_premium_volume.read();
            self.total_premium_volume.write(total_volume + premium_amount);

            // Check if we need to distribute premiums (once per week)
            self.check_premium_distribution();

            // Transfer premium from user to reserve using direct component call
            let mut reserve_comp = get_dep_component_mut!(ref self, Reserve);
            let transfer_result = reserve_comp.transfer_to_reserve(caller, premium_amount);
            assert(transfer_result, PolicyErrors::TransferFailed);

            // Set auto-renewal based on policy duration
            let term_days = policy.metadata.term_days;
            let renewal_interval = term_days * 86400_u32; // days to seconds
            let renewals_per_year = 365_u32 / term_days;
            self.policy_renewals.write((caller, policy_id), renewals_per_year.into());
            self.policy_last_renewal.write((caller, policy_id), now);
            self.policy_renewal_interval.write((caller, policy_id), renewal_interval.into());

            // Emit premium event
            self
                .emit(
                    PremiumSentToReserve {
                        policy_id: policy_id, user: caller, amount: premium_amount,
                    },
                );

            // Emit policy purchase event
            self
                .emit(
                    PolicyPurchased {
                        policy_id: policy_id,
                        user: caller,
                        purchase_time: now,
                        expiry_time: expiry_time,
                        premium_amount: premium_amount,
                    },
                );

            true
        }

        fn get_user_policies(
            self: @ComponentState<TContractState>, user: ContractAddress,
        ) -> Array<UserPolicy> {
            let policy_count = self.user_policy_counts.read(user);
            let mut result = ArrayTrait::<UserPolicy>::new();

            let mut i: u32 = 0;
            while i < policy_count {
                let policy_id = self.user_policy_ids.read((user, i));
                let user_policy = self.user_policies.read((user, policy_id));
                result.append(user_policy);
                i += 1;
            };

            result
        }

        fn submit_claim(
            ref self: ComponentState<TContractState>, policy_id: u256, evidence_hash: felt252,
        ) -> u256 {
            let caller = get_caller_address();
            let now = get_block_timestamp();

            // Verify user owns this policy
            let user_policy = self.user_policies.read((caller, policy_id));
            assert(user_policy.policy_id == policy_id, PolicyErrors::UserDoesNotOwnPolicy);
            assert(user_policy.is_active, PolicyErrors::PolicyNotActive);
            assert(now <= user_policy.expiry_time, PolicyErrors::PolicyExpired);

            // Generate claim ID
            let claim_id = self.claim_count.read() + 1;
            self.claim_count.write(claim_id);

            // Create claim
            let claim = Claim {
                id: claim_id,
                policy_id: policy_id,
                claimant: caller,
                evidence_hash: evidence_hash,
                status: ClaimStatus::PENDING,
                submission_time: now,
                processing_time: 0,
            };

            // Save claim
            self.claims.write(claim_id, claim);

            // Add to policy claims list
            let policy_claim_count = self.policy_claim_counts.read(policy_id);
            self.policy_claim_ids.write((policy_id, policy_claim_count), claim_id);
            self.policy_claim_counts.write(policy_id, policy_claim_count + 1);

            // Add to user claims list
            let user_claim_count = self.user_claim_counts.read(caller);
            self.user_claim_ids.write((caller, user_claim_count), claim_id);
            self.user_claim_counts.write(caller, user_claim_count + 1);

            // Emit event
            self
                .emit(
                    ClaimSubmitted {
                        claim_id: claim_id,
                        policy_id: policy_id,
                        claimant: caller,
                        submission_time: now,
                    },
                );

            claim_id
        }

        fn process_claim(
            ref self: ComponentState<TContractState>,
            claim_id: u256,
            external_data_hash: felt252,
            approved: bool,
        ) {
            // Validate claim exists
            assert(claim_id <= self.claim_count.read(), PolicyErrors::ClaimNotFound);
            let mut claim = self.claims.read(claim_id);

            // Validate claim is in pending state
            assert(claim.status == ClaimStatus::PENDING, PolicyErrors::ClaimNotPending);

            // Update claim status based on approval
            if approved {
                claim.status = ClaimStatus::APPROVED;
            } else {
                claim.status = ClaimStatus::REJECTED;
            }

            claim.processing_time = get_block_timestamp();

            // Store values before moving the struct
            let claim_status = claim.status.clone();
            let processing_time = claim.processing_time;

            self.claims.write(claim_id, claim);

            // Emit event
            self
                .emit(
                    ClaimProcessed {
                        claim_id: claim_id, status: claim_status, processing_time: processing_time,
                    },
                );
        }

        fn pay_out_claim(ref self: ComponentState<TContractState>, claim_id: u256) {
            // Validate claim exists
            assert(claim_id <= self.claim_count.read(), PolicyErrors::ClaimNotFound);
            let mut claim = self.claims.read(claim_id);

            // Validate claim is approved
            assert(claim.status == ClaimStatus::APPROVED, PolicyErrors::ClaimNotApproved);

            // Get policy and payout amount in USD
            let policy_id = claim.policy_id;
            let policy = self.policies.read(policy_id);
            let payout_amount_usd = policy.metadata.payout_amount;

            // Store claimant before moving the struct
            let claimant = claim.claimant;

            // Update claim status
            claim.status = ClaimStatus::PAID;
            self.claims.write(claim_id, claim);

            // Get the Oracle component to convert USD to STRK
            let oracle_comp = get_dep_component!(@self, Oracle);
            // Convert USD payout amount to equivalent STRK
            let payout_amount_strk = oracle_comp.convert_usd_to_strk(payout_amount_usd);

            // Transfer funds in STRK to claimant from reserve using direct component call
            let mut reserve_comp = get_dep_component_mut!(ref self, Reserve);
            let transfer_result = reserve_comp.transfer_from_reserve(claimant, payout_amount_strk);
            assert(transfer_result, PolicyErrors::TransferFailed);

            // Track claim metrics for sustainable yield rate calculation
            let current_weekly_claims = self.weekly_claims_paid.read();
            self.weekly_claims_paid.write(current_weekly_claims + 1);

            let current_weekly_volume = self.weekly_claims_volume.read();
            self.weekly_claims_volume.write(current_weekly_volume + payout_amount_strk);

            // Emit event
            self
                .emit(
                    ClaimPaid {
                        claim_id: claim_id,
                        policy_id: policy_id,
                        claimant: claimant,
                        amount: payout_amount_strk,
                    },
                );
        }

        fn get_claim(self: @ComponentState<TContractState>, claim_id: u256) -> Claim {
            assert(claim_id <= self.claim_count.read(), PolicyErrors::ClaimNotFound);
            self.claims.read(claim_id)
        }

        fn get_claims_for_policy(
            self: @ComponentState<TContractState>, policy_id: u256,
        ) -> Array<Claim> {
            assert(policy_id <= self.policy_count.read(), PolicyErrors::PolicyNotFound);

            let claim_count = self.policy_claim_counts.read(policy_id);
            let mut result = ArrayTrait::<Claim>::new();

            let mut i: u32 = 0;
            while i < claim_count {
                let claim_id = self.policy_claim_ids.read((policy_id, i));
                let claim = self.claims.read(claim_id);
                result.append(claim);
                i += 1;
            };

            result
        }

        fn get_user_claims(
            self: @ComponentState<TContractState>, user: ContractAddress,
        ) -> Array<Claim> {
            let claim_count = self.user_claim_counts.read(user);
            let mut result = ArrayTrait::<Claim>::new();

            let mut i: u32 = 0;
            while i < claim_count {
                let claim_id = self.user_claim_ids.read((user, i));
                let claim = self.claims.read(claim_id);
                result.append(claim);
                i += 1;
            };

            result
        }

        // New method to query remaining renewals
        fn get_policy_renewals(
            self: @ComponentState<TContractState>, user: ContractAddress, policy_id: u256,
        ) -> u256 {
            self.policy_renewals.read((user, policy_id))
        }

        // New method to query last renewal timestamp
        fn get_last_renewal(
            self: @ComponentState<TContractState>, user: ContractAddress, policy_id: u256,
        ) -> u64 {
            self.policy_last_renewal.read((user, policy_id))
        }

        // New method to check if an address is a whitelisted renewer
        fn is_whitelisted_renewer(
            self: @ComponentState<TContractState>, renewer: ContractAddress,
        ) -> bool {
            self.whitelisted_renewers.read(renewer)
        }

        // New method to cancel auto-renewal for a policy
        fn cancel_auto_renewal(ref self: ComponentState<TContractState>, policy_id: u256) {
            let caller = get_caller_address();
            let now = get_block_timestamp();

            // Verify user owns the policy
            let user_policy = self.user_policies.read((caller, policy_id));
            assert(user_policy.policy_id == policy_id, PolicyErrors::UserDoesNotOwnPolicy);

            // Set remaining renewals to 0
            self.policy_renewals.write((caller, policy_id), 0);

            // Emit cancellation event
            self
                .emit(
                    AutoRenewalCancelled {
                        policy_id: policy_id, user: caller, cancellation_time: now,
                    },
                );
        }

        // New method to auto-renew a policy
        fn auto_renew_policy(
            ref self: ComponentState<TContractState>, user: ContractAddress, policy_id: u256,
        ) -> bool {
            // Check if caller is authorized to trigger renewals
            let caller = get_caller_address();
            assert(self.whitelisted_renewers.read(caller), PolicyErrors::NotAuthorizedRenewer);

            let now = get_block_timestamp();

            // Verify the policy exists and belongs to the user
            let user_policy = self.user_policies.read((user, policy_id));
            assert(user_policy.policy_id == policy_id, PolicyErrors::PolicyNotFound);
            assert(user_policy.user == user, PolicyErrors::UserDoesNotOwnPolicy);
            assert(user_policy.is_active, PolicyErrors::PolicyNotActive);

            // Check remaining renewals
            let remaining_renewals = self.policy_renewals.read((user, policy_id));
            assert(remaining_renewals > 0, PolicyErrors::NoRenewalsRemaining);

            // Check if it's time for renewal (at least one week since last renewal)
            let last_renewal = self.policy_last_renewal.read((user, policy_id));
            let renewal_interval = self.policy_renewal_interval.read((user, policy_id));
            assert(now >= last_renewal + renewal_interval, PolicyErrors::TooEarlyForRenewal);

            // Get policy details
            let policy = self.policies.read(policy_id);
            let premium_amount = policy.metadata.premium_amount;

            // Transfer premium from user to reserve using direct component call
            let mut reserve_comp = get_dep_component_mut!(ref self, Reserve);
            let transfer_result = reserve_comp.transfer_to_reserve(user, premium_amount);
            assert(transfer_result, PolicyErrors::TransferFailed);

            // Update premium pool
            let current_premium_total = self.weekly_premium_total.read();
            self.weekly_premium_total.write(current_premium_total + premium_amount);

            // Track renewal metrics for dynamic yield rate
            let current_weekly_purchases = self.weekly_policy_purchases.read();
            self.weekly_policy_purchases.write(current_weekly_purchases + 1);

            let current_weekly_volume = self.weekly_premium_volume.read();
            self.weekly_premium_volume.write(current_weekly_volume + premium_amount);

            let total_purchases = self.total_policies_purchased.read();
            self.total_policies_purchased.write(total_purchases + 1);

            let total_volume = self.total_premium_volume.read();
            self.total_premium_volume.write(total_volume + premium_amount);

            // Check premium distribution
            self.check_premium_distribution();

            // Update user policy by extending expiry
            let new_expiry = user_policy.expiry_time + SECONDS_PER_WEEK;
            let updated_policy = UserPolicy {
                policy_id: policy_id,
                user: user,
                purchase_time: user_policy.purchase_time,
                expiry_time: new_expiry,
                is_active: true,
            };
            self.user_policies.write((user, policy_id), updated_policy);

            // Update renewal tracking
            let new_remaining = remaining_renewals - 1;
            self.policy_renewals.write((user, policy_id), new_remaining);
            self.policy_last_renewal.write((user, policy_id), now);

            // Emit renewal event
            self
                .emit(
                    PolicyRenewed {
                        policy_id: policy_id,
                        user: user,
                        renewal_time: now,
                        premium_amount: premium_amount,
                        remaining_renewals: new_remaining,
                    },
                );

            // Emit premium event
            self
                .emit(
                    PremiumSentToReserve {
                        policy_id: policy_id, user: user, amount: premium_amount,
                    },
                );

            true
        }

        // New method to get renewal interval
        fn get_renewal_interval(
            self: @ComponentState<TContractState>, user: ContractAddress, policy_id: u256,
        ) -> u256 {
            self.policy_renewal_interval.read((user, policy_id)).into()
        }

        // Dynamic yield rate metrics functions
        fn get_weekly_activity_metrics(self: @ComponentState<TContractState>) -> (u256, u256) {
            let purchases = self.weekly_policy_purchases.read();
            let volume = self.weekly_premium_volume.read();
            (purchases, volume)
        }

        fn get_last_week_activity_metrics(self: @ComponentState<TContractState>) -> (u256, u256) {
            let purchases = self.last_week_policy_purchases.read();
            let volume = self.last_week_premium_volume.read();
            (purchases, volume)
        }

        fn get_total_activity_metrics(self: @ComponentState<TContractState>) -> (u256, u256) {
            let purchases = self.total_policies_purchased.read();
            let volume = self.total_premium_volume.read();
            (purchases, volume)
        }

        fn get_current_dynamic_yield_rate(self: @ComponentState<TContractState>) -> u16 {
            let weekly_purchases = self.weekly_policy_purchases.read();
            let weekly_volume = self.weekly_premium_volume.read();
            self.compute_yield_rate_from_activity(weekly_purchases, weekly_volume)
        }

        // Sustainability metrics functions
        fn get_weekly_claims_metrics(self: @ComponentState<TContractState>) -> (u256, u256) {
            let claims_count = self.weekly_claims_paid.read();
            let claims_volume = self.weekly_claims_volume.read();
            (claims_count, claims_volume)
        }

        fn get_last_week_claims_metrics(self: @ComponentState<TContractState>) -> (u256, u256) {
            let claims_count = self.last_week_claims_paid.read();
            let claims_volume = self.last_week_claims_volume.read();
            (claims_count, claims_volume)
        }

        fn get_loss_ratio(self: @ComponentState<TContractState>) -> u16 {
            let weekly_volume = self.weekly_premium_volume.read();
            let weekly_claim_volume = self.weekly_claims_volume.read();

            if weekly_volume > 0 {
                ((weekly_claim_volume * 10000) / weekly_volume).try_into().unwrap_or(0)
            } else {
                0
            }
        }

        fn get_yield_rate_stability_info(self: @ComponentState<TContractState>) -> (u32, u64) {
            let change_count = self.yield_rate_change_count.read();
            let last_calculation = self.yield_calculation_timestamp.read();
            (change_count, last_calculation)
        }
    }

    // Internal functions that are not exposed via the interface
    #[generate_trait]
    pub impl InternalFunctions<
        TContractState,
        +HasComponent<TContractState>,
        +Drop<TContractState>,
        impl Ownable: OwnableComponent::HasComponent<TContractState>,
        impl Reserve: ReserveManagerComponent::HasComponent<TContractState>,
    > of InternalFunctionsTrait<TContractState> {
        fn initializer(ref self: ComponentState<TContractState>) {
            self.policy_count.write(0);
            self.claim_count.write(0);
            self.weekly_premium_total.write(0);
            self.last_premium_distribution.write(0);
            // Initialize dynamic yield rate tracking
            self.weekly_policy_purchases.write(0);
            self.weekly_premium_volume.write(0);
            self.last_week_policy_purchases.write(0);
            self.last_week_premium_volume.write(0);
            self.yield_calculation_timestamp.write(0);
            self.total_policies_purchased.write(0);
            self.total_premium_volume.write(0);
            // Initialize sustainability tracking
            self.weekly_claims_paid.write(0);
            self.weekly_claims_volume.write(0);
            self.last_week_claims_paid.write(0);
            self.last_week_claims_volume.write(0);
            self.yield_rate_change_count.write(0);
        }

        fn set_premium_token(
            ref self: ComponentState<TContractState>, token_address: ContractAddress,
        ) {
            // Set the premium token
            self.premium_token.write(token_address);
        }

        // New method to set whitelisted renewers
        fn set_whitelisted_renewers(
            ref self: ComponentState<TContractState>,
            renewers: Array<ContractAddress>,
            status: bool,
        ) {
            // Set status for each renewer
            let mut i: u32 = 0;
            while i < renewers.len() {
                let renewer = *renewers.at(i);
                self.whitelisted_renewers.write(renewer, status);

                // Emit event for each status change
                self.emit(RenewerStatusUpdated { renewer: renewer, is_whitelisted: status });

                i += 1;
            };
        }

        // New method to set number of renewals for a policy
        fn set_policy_renewals(
            ref self: ComponentState<TContractState>,
            user: ContractAddress,
            policy_id: u256,
            renewals: u256,
        ) {
            // Verify policy exists
            let user_policy = self.user_policies.read((user, policy_id));
            assert(user_policy.policy_id == policy_id, PolicyErrors::PolicyNotFound);

            // Update renewals
            self.policy_renewals.write((user, policy_id), renewals);
        }

        fn check_premium_distribution(ref self: ComponentState<TContractState>) {
            let now = get_block_timestamp();
            let last_distribution = self.last_premium_distribution.read();

            // If first distribution or a week has passed
            if last_distribution == 0 || (now - last_distribution) >= SECONDS_PER_WEEK {
                let weekly_total = self.weekly_premium_total.read();

                // Calculate and update dynamic yield rate
                self.calculate_dynamic_yield_rate();

                // Only distribute if there are premiums
                if weekly_total > 0 {
                    // Call reserve manager to distribute yield using direct component call
                    let mut reserve_comp = get_dep_component_mut!(ref self, Reserve);
                    reserve_comp.distribute_yield();

                    // Reset weekly premium total
                    self.weekly_premium_total.write(0);

                    // Emit event
                    self.emit(WeeklyPremiumDistributed { amount: weekly_total, timestamp: now });
                }

                // Update last distribution time
                self.last_premium_distribution.write(now);
            }
        }

        fn calculate_dynamic_yield_rate(ref self: ComponentState<TContractState>) {
            let now = get_block_timestamp();
            let last_calculation = self.yield_calculation_timestamp.read();

            // Only calculate if a week has passed or first time
            if last_calculation == 0 || (now - last_calculation) >= SECONDS_PER_WEEK {
                // Get current week's metrics
                let weekly_purchases = self.weekly_policy_purchases.read();
                let weekly_volume = self.weekly_premium_volume.read();

                // Calculate dynamic yield rate based on activity and sustainability
                let new_yield_rate = self
                    .compute_yield_rate_from_activity(weekly_purchases, weekly_volume);

                // Get current yield rate for comparison
                let mut reserve_comp = get_dep_component_mut!(ref self, Reserve);
                let current_reserve_data = reserve_comp.get_reserve_info();
                let old_yield_rate = current_reserve_data.yield_rate_bps;

                // Only update if rate changed significantly (>0.1% change) to reduce volatility
                let rate_change = if new_yield_rate > old_yield_rate {
                    new_yield_rate - old_yield_rate
                } else {
                    old_yield_rate - new_yield_rate
                };

                if rate_change >= 10 { // 0.1% minimum change threshold
                    // Store historical rate
                    self.yield_rate_history.write(now, old_yield_rate);

                    // Update reserve component with new yield rate
                    reserve_comp.set_yield_rate(new_yield_rate);

                    // Increment change counter
                    let change_count = self.yield_rate_change_count.read();
                    self.yield_rate_change_count.write(change_count + 1);
                }

                // Store last week's data for trend analysis
                self.last_week_policy_purchases.write(weekly_purchases);
                self.last_week_premium_volume.write(weekly_volume);
                self.last_week_claims_paid.write(self.weekly_claims_paid.read());
                self.last_week_claims_volume.write(self.weekly_claims_volume.read());

                // Reset current week's counters
                self.weekly_policy_purchases.write(0);
                self.weekly_premium_volume.write(0);
                self.weekly_claims_paid.write(0);
                self.weekly_claims_volume.write(0);

                // Update calculation timestamp
                self.yield_calculation_timestamp.write(now);

                // Emit event (always emit for transparency, even if rate didn't change)
                self
                    .emit(
                        DynamicYieldRateUpdated {
                            new_yield_rate_bps: new_yield_rate,
                            weekly_policy_count: weekly_purchases,
                            weekly_premium_volume: weekly_volume,
                            calculation_timestamp: now,
                        },
                    );
            }
        }

        fn compute_yield_rate_from_activity(
            self: @ComponentState<TContractState>, weekly_purchases: u256, weekly_volume: u256,
        ) -> u16 {
            // Base yield rate (3%)
            let base_rate: u16 = 300;

            // Maximum yield rate (12%) - reduced for sustainability
            let max_rate: u16 = 1200;

            // Minimum yield rate (0.5%) - reduced for bear markets
            let min_rate: u16 = 50;

            // Get claim metrics for sustainability calculation
            let weekly_claim_volume = self.weekly_claims_volume.read();

            // Calculate loss ratio (claims/premiums) - key sustainability metric
            let loss_ratio = if weekly_volume > 0 {
                (weekly_claim_volume * 10000) / weekly_volume // In basis points
            } else {
                0
            };

            // Get reserve health from reserve component
            let reserve_comp = get_dep_component!(self, Reserve);
            let reserve_data = reserve_comp.get_reserve_info();
            let available_funds = reserve_comp.get_available_funds();

            // Calculate reserve utilization ratio
            let utilization_ratio = if reserve_data.total_funds > 0 {
                ((reserve_data.total_funds - available_funds) * 10000) / reserve_data.total_funds
            } else {
                0
            };

            // Sustainability adjustments
            let mut sustainability_factor: i32 = 0;

            // 1. Loss ratio adjustment (most important)
            if loss_ratio > 8000 { // >80% loss ratio - very bad
                sustainability_factor -= 400; // -4% penalty
            } else if loss_ratio > 6000 { // >60% loss ratio - bad
                sustainability_factor -= 200; // -2% penalty
            } else if loss_ratio > 4000 { // >40% loss ratio - concerning
                sustainability_factor -= 100; // -1% penalty
            } else if loss_ratio < 2000 { // <20% loss ratio - very good
                sustainability_factor += 100; // +1% bonus
            } else if loss_ratio < 3000 { // <30% loss ratio - good
                sustainability_factor += 50; // +0.5% bonus
            }

            // 2. Reserve utilization adjustment
            if utilization_ratio > 7000 { // >70% utilization - dangerous
                sustainability_factor -= 300; // -3% penalty
            } else if utilization_ratio > 5000 { // >50% utilization - high
                sustainability_factor -= 150; // -1.5% penalty
            } else if utilization_ratio < 2000 { // <20% utilization - very safe
                sustainability_factor += 100; // +1% bonus
            } else if utilization_ratio < 3000 { // <30% utilization - safe
                sustainability_factor += 50; // +0.5% bonus
            }

            // 3. Activity level adjustment (reduced impact for sustainability)
            let activity_factor = if weekly_purchases == 0 || weekly_volume == 0 {
                -100 // -1% for no activity
            } else if weekly_purchases >= 50 {
                100 // +1% for high activity
            } else if weekly_purchases >= 20 {
                50 // +0.5% for medium activity
            } else if weekly_purchases >= 10 {
                25 // +0.25% for low activity
            } else {
                0 // No bonus for very low activity
            };

            // 4. Volume stability adjustment
            let volume_factor = if weekly_volume >= 500000 { // 500K tokens
                100 // +1% for high volume
            } else if weekly_volume >= 100000 { // 100K tokens
                50 // +0.5% for medium volume
            } else if weekly_volume >= 50000 { // 50K tokens
                25 // +0.25% for low volume
            } else {
                0 // No bonus for very low volume
            };

            let last_week_purchases = self.last_week_policy_purchases.read();

            // Calculate week-over-week change
            let purchase_change = if last_week_purchases > 0 {
                if weekly_purchases > last_week_purchases {
                    ((weekly_purchases - last_week_purchases) * 100) / last_week_purchases
                } else {
                    ((last_week_purchases - weekly_purchases) * 100) / last_week_purchases
                }
            } else {
                0
            };

            // Stability penalty for excessive volatility
            let stability_penalty = if purchase_change > 200 {
                -50 // -0.5% for extreme volatility
            } else if purchase_change > 100 {
                -25 // -0.25% for high volatility
            } else {
                0
            };

            // Calculate final rate
            let total_adjustment = sustainability_factor
                + activity_factor
                + volume_factor
                + stability_penalty;
            let calculated_rate = if total_adjustment >= 0 {
                base_rate + total_adjustment.try_into().unwrap_or(0)
            } else {
                let penalty: u16 = (-total_adjustment).try_into().unwrap_or(0);
                if base_rate > penalty {
                    base_rate - penalty
                } else {
                    min_rate
                }
            };

            // Ensure rate is within bounds
            if calculated_rate > max_rate {
                max_rate
            } else if calculated_rate < min_rate {
                min_rate
            } else {
                calculated_rate
            }
        }
    }
}
