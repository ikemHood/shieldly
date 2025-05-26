#[starknet::contract]
pub mod ShieldlyCore {
    use starknet::storage::{
        StoragePointerWriteAccess, StoragePointerReadAccess, Map, StorageMapReadAccess,
        StorageMapWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::upgrades::upgradeable::UpgradeableComponent;
    use openzeppelin::security::pausable::PausableComponent;
    use openzeppelin::security::interface::IPausable;
    use core::array::ArrayTrait;
    use core::traits::Into;

    use shieldly::types::types::{
        UserProfile, UserStatus, Policy, PolicyStatus, PolicyMetadata, UserPolicy, Claim,
        ReserveData,
    };
    use shieldly::components::policy::PolicyManagerComponent;
    use shieldly::components::reserve::ReserveManagerComponent;
    use shieldly::components::oracle::OracleComponent;
    use shieldly::interface::core::IShieldlyCore;
    use shieldly::errors::{CoreErrors};
    use core::array::Array;

    // Component setup
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: PolicyManagerComponent, storage: policy_manager, event: PolicyManagerEvent);
    component!(path: ReserveManagerComponent, storage: reserve_manager, event: ReserveManagerEvent);
    component!(path: OracleComponent, storage: oracle, event: OracleEvent);

    // Implement component interfaces
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;
    impl PolicyManagerInternalImpl = PolicyManagerComponent::InternalFunctions<ContractState>;
    impl ReserveManagerInternalImpl = ReserveManagerComponent::InternalFunctions<ContractState>;
    impl OracleImpl = OracleComponent::ExternalImpl<ContractState>;
    impl OracleInternalImpl = OracleComponent::InternalImpl<ContractState>;
    impl PolicyManagerImpl = PolicyManagerComponent::PolicyManagerImpl<ContractState>;
    impl ReserveManagerImpl = ReserveManagerComponent::ReserveManagerImpl<ContractState>;

    #[storage]
    struct Storage {
        // Component storages
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        #[substorage(v0)]
        policy_manager: PolicyManagerComponent::Storage,
        #[substorage(v0)]
        reserve_manager: ReserveManagerComponent::Storage,
        #[substorage(v0)]
        oracle: OracleComponent::Storage,
        // Additional core storage
        users: Map<ContractAddress, UserProfile>,
        user_count: u32,
        pragma_oracle_address: ContractAddress,
        kyc_manager: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        // Component events
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
        #[flat]
        PolicyManagerEvent: PolicyManagerComponent::Event,
        #[flat]
        ReserveManagerEvent: ReserveManagerComponent::Event,
        #[flat]
        OracleEvent: OracleComponent::Event,
        // Custom events
        UserRegistered: UserRegistered,
        UserStatusUpdated: UserStatusUpdated,
        UserKycUpdated: UserKycUpdated,
        PragmaOracleAddressSet: PragmaOracleAddressSet,
        KycManagerSet: KycManagerSet,
    }

    #[derive(Drop, starknet::Event)]
    struct UserRegistered {
        #[key]
        user: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct UserStatusUpdated {
        #[key]
        user: ContractAddress,
        new_status: UserStatus,
    }

    #[derive(Drop, starknet::Event)]
    struct UserKycUpdated {
        #[key]
        user: ContractAddress,
        kyc_verified: bool,
        updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct PragmaOracleAddressSet {
        address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct KycManagerSet {
        address: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, owner: ContractAddress, pragma_oracle_address: ContractAddress,
    ) {
        // Initialize components
        self.ownable.initializer(owner);
        self.policy_manager.initializer();
        self.reserve_manager.initializer();
        self.oracle.initializer(pragma_oracle_address);

        // Initialize contract state
        self.user_count.write(0);
    }

    #[abi(embed_v0)]
    impl ShieldlyCoreImpl of IShieldlyCore<ContractState> {
        fn register_user(ref self: ContractState) -> bool {
            // Ensure contract is not paused
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            let caller = get_caller_address();
            let now = get_block_timestamp();

            // Check if user already exists
            let user_status = self.users.read(caller).status;
            if user_status != UserStatus::INACTIVE {
                return false; // User already registered
            }

            let user_profile = UserProfile {
                address: caller,
                status: UserStatus::ACTIVE,
                kyc_verified: false,
                policies_count: 0,
                funder_stake: 0,
                accrued_yield: 0,
                last_yield_claimed: now,
            };

            // Save user profile
            self.users.write(caller, user_profile);
            self.user_count.write(self.user_count.read() + 1);

            // Emit event
            self.emit(UserRegistered { user: caller });

            true
        }

        fn get_user_profile(self: @ContractState, user: ContractAddress) -> UserProfile {
            self.users.read(user)
        }

        fn update_user_status(ref self: ContractState, user: ContractAddress, status: UserStatus) {
            // Only admin can update user status
            self.ownable.assert_only_owner();

            // Update user status
            let mut user_profile = self.users.read(user);
            user_profile.status = status.clone();
            self.users.write(user, user_profile);

            // Emit event
            self.emit(UserStatusUpdated { user: user, new_status: status });
        }

        fn verify_user_kyc(ref self: ContractState, user: ContractAddress, kyc_verified: bool) {
            // Only KYC manager can verify users
            let caller = get_caller_address();
            let kyc_manager = self.kyc_manager.read();
            assert(kyc_manager == caller, CoreErrors::NotKycManager);

            // Check if user exists
            let user_profile = self.users.read(user);
            assert(user_profile.status != UserStatus::INACTIVE, CoreErrors::UserNotFound);

            // Update KYC status
            let mut updated_profile = user_profile;
            updated_profile.kyc_verified = kyc_verified;
            self.users.write(user, updated_profile);

            // Emit event
            self
                .emit(
                    UserKycUpdated { user: user, kyc_verified: kyc_verified, updated_by: caller },
                );
        }

        fn set_kyc_manager(ref self: ContractState, kyc_manager: ContractAddress) {
            // Only admin can set KYC manager
            self.ownable.assert_only_owner();

            // Set KYC manager
            self.kyc_manager.write(kyc_manager);

            // Emit event
            self.emit(KycManagerSet { address: kyc_manager });
        }

        fn get_kyc_manager(self: @ContractState) -> ContractAddress {
            self.kyc_manager.read()
        }

        fn set_admin(ref self: ContractState, admin: ContractAddress) {
            // Only current admin can set a new admin
            self.ownable.assert_only_owner();
            self.ownable.transfer_ownership(admin);
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.ownable.owner()
        }

        fn pause_contract(ref self: ContractState) {
            // Only admin can pause the contract
            self.ownable.assert_only_owner();
            self.pausable.pause();
        }

        fn unpause_contract(ref self: ContractState) {
            // Only admin can unpause the contract
            self.ownable.assert_only_owner();
            self.pausable.unpause();
        }

        fn is_paused(self: @ContractState) -> bool {
            self.pausable.is_paused()
        }

        fn upgrade(ref self: ContractState, new_implementation: felt252) {
            // Only admin can upgrade the contract
            self.ownable.assert_only_owner();

            // Upgrade contract
            self
                .upgradeable
                .upgrade(new_implementation.try_into().expect(CoreErrors::InvalidClassHash));
        }

        fn set_pragma_oracle(ref self: ContractState, pragma_oracle_address: ContractAddress) {
            // Only admin can set the oracle address
            self.ownable.assert_only_owner();

            // Set oracle address in component
            self.oracle.set_pragma_oracle(pragma_oracle_address);

            // Store address in core contract state
            self.pragma_oracle_address.write(pragma_oracle_address);

            // Emit event
            self.emit(PragmaOracleAddressSet { address: pragma_oracle_address });
        }

        fn get_pragma_oracle(self: @ContractState) -> ContractAddress {
            self.pragma_oracle_address.read()
        }

        fn convert_usd_to_strk(self: @ContractState, usd_amount: u256) -> u256 {
            self.oracle.convert_usd_to_strk(usd_amount)
        }

        fn buy_policy(ref self: ContractState, policy_id: u256) -> bool {
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            let caller = get_caller_address();

            // Check user registration and KYC
            let user_profile = self.users.read(caller);
            assert(user_profile.status == UserStatus::ACTIVE, CoreErrors::UserNotActive);
            assert(user_profile.kyc_verified, CoreErrors::KycNotVerified);

            // Call component function
            self.policy_manager.purchase_policy(policy_id)
        }

        // Token management functions
        fn set_staking_token(ref self: ContractState, token: ContractAddress) {
            // Only admin can set the staking token
            self.ownable.assert_only_owner();
            self.reserve_manager.set_staking_token(token);
        }

        fn set_premium_token(ref self: ContractState, token: ContractAddress) {
            // Only admin can set the premium token
            self.ownable.assert_only_owner();
            self.policy_manager.set_premium_token(token);
        }

        fn get_staking_token(self: @ContractState) -> ContractAddress {
            self.reserve_manager.staking_token()
        }

        // Policy management functions
        fn create_policy(ref self: ContractState, metadata: PolicyMetadata) -> u256 {
            // Only admin can create policies
            self.ownable.assert_only_owner();
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.policy_manager.create_policy(metadata)
        }

        fn get_policy(self: @ContractState, policy_id: u256) -> Policy {
            self.policy_manager.get_policy(policy_id)
        }

        fn list_policies(self: @ContractState, status: PolicyStatus) -> Array<Policy> {
            self.policy_manager.list_policies(status)
        }

        fn activate_policy(ref self: ContractState, policy_id: u256) {
            // Only admin can activate policies
            self.ownable.assert_only_owner();
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.policy_manager.activate_policy(policy_id)
        }

        fn expire_policy(ref self: ContractState, policy_id: u256) {
            // Only admin can expire policies
            self.ownable.assert_only_owner();
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.policy_manager.expire_policy(policy_id)
        }

        fn pause_policy(ref self: ContractState, policy_id: u256) {
            // Only admin can pause policies
            self.ownable.assert_only_owner();
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.policy_manager.pause_policy(policy_id)
        }

        fn get_user_policies(self: @ContractState, user: ContractAddress) -> Array<UserPolicy> {
            self.policy_manager.get_user_policies(user)
        }

        // Claim management functions
        fn submit_claim(ref self: ContractState, policy_id: u256, evidence_hash: felt252) -> u256 {
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            let caller = get_caller_address();
            // Check user registration and KYC
            let user_profile = self.users.read(caller);
            assert(user_profile.status == UserStatus::ACTIVE, CoreErrors::UserNotActive);
            assert(user_profile.kyc_verified, CoreErrors::KycNotVerified);

            self.policy_manager.submit_claim(policy_id, evidence_hash)
        }

        fn process_claim(
            ref self: ContractState, claim_id: u256, external_data_hash: felt252, approved: bool,
        ) {
            // Only admin can process claims
            self.ownable.assert_only_owner();
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.policy_manager.process_claim(claim_id, external_data_hash, approved)
        }

        fn pay_out_claim(ref self: ContractState, claim_id: u256) {
            // Only admin can pay out claims
            self.ownable.assert_only_owner();
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.policy_manager.pay_out_claim(claim_id)
        }

        fn get_claim(self: @ContractState, claim_id: u256) -> Claim {
            self.policy_manager.get_claim(claim_id)
        }

        fn get_claims_for_policy(self: @ContractState, policy_id: u256) -> Array<Claim> {
            self.policy_manager.get_claims_for_policy(policy_id)
        }

        fn get_user_claims(self: @ContractState, user: ContractAddress) -> Array<Claim> {
            self.policy_manager.get_user_claims(user)
        }

        // Auto-renewal functions
        fn get_policy_renewals(
            self: @ContractState, user: ContractAddress, policy_id: u256,
        ) -> u256 {
            self.policy_manager.get_policy_renewals(user, policy_id)
        }

        fn get_last_renewal(self: @ContractState, user: ContractAddress, policy_id: u256) -> u64 {
            self.policy_manager.get_last_renewal(user, policy_id)
        }

        fn is_whitelisted_renewer(self: @ContractState, renewer: ContractAddress) -> bool {
            self.policy_manager.is_whitelisted_renewer(renewer)
        }

        fn cancel_auto_renewal(ref self: ContractState, policy_id: u256) {
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            let caller = get_caller_address();
            // Check user registration and KYC
            let user_profile = self.users.read(caller);
            assert(user_profile.status == UserStatus::ACTIVE, CoreErrors::UserNotActive);

            self.policy_manager.cancel_auto_renewal(policy_id)
        }

        fn auto_renew_policy(
            ref self: ContractState, user: ContractAddress, policy_id: u256,
        ) -> bool {
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.policy_manager.auto_renew_policy(user, policy_id)
        }

        fn get_renewal_interval(
            self: @ContractState, user: ContractAddress, policy_id: u256,
        ) -> u256 {
            self.policy_manager.get_renewal_interval(user, policy_id)
        }

        fn set_whitelisted_renewers(
            ref self: ContractState, renewers: Array<ContractAddress>, status: bool,
        ) {
            // Only admin can set whitelisted renewers
            self.ownable.assert_only_owner();
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.policy_manager.set_whitelisted_renewers(renewers, status)
        }

        // Reserve management functions
        fn stake_funds(ref self: ContractState, amount: u256) {
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            let caller = get_caller_address();
            // Check user registration and KYC
            let user_profile = self.users.read(caller);
            assert(user_profile.status == UserStatus::ACTIVE, CoreErrors::UserNotActive);
            assert(user_profile.kyc_verified, CoreErrors::KycNotVerified);

            self.reserve_manager.stake_funds(amount)
        }

        fn unstake_funds(ref self: ContractState, amount: u256) {
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            let caller = get_caller_address();
            // Check user registration and KYC
            let user_profile = self.users.read(caller);
            assert(user_profile.status == UserStatus::ACTIVE, CoreErrors::UserNotActive);

            self.reserve_manager.unstake_funds(amount)
        }

        fn get_funder_stake(self: @ContractState, funder: ContractAddress) -> u256 {
            self.reserve_manager.get_funder_stake(funder)
        }

        fn distribute_yield(ref self: ContractState) {
            // Only admin can manually distribute yield
            self.ownable.assert_only_owner();
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            self.reserve_manager.distribute_yield()
        }

        fn claim_yield(ref self: ContractState) -> u256 {
            assert(!self.pausable.is_paused(), CoreErrors::Paused);

            let caller = get_caller_address();
            // Check user registration and KYC
            let user_profile = self.users.read(caller);
            assert(user_profile.status == UserStatus::ACTIVE, CoreErrors::UserNotActive);

            self.reserve_manager.claim_yield()
        }

        fn get_yield_info(self: @ContractState, user: ContractAddress) -> (u256, u64) {
            self.reserve_manager.get_yield_info(user)
        }

        fn get_reserve_info(self: @ContractState) -> ReserveData {
            self.reserve_manager.get_reserve_info()
        }

        fn get_available_funds(self: @ContractState) -> u256 {
            self.reserve_manager.get_available_funds()
        }

        fn get_weekly_activity_metrics(self: @ContractState) -> (u256, u256) {
            self.policy_manager.get_weekly_activity_metrics()
        }

        fn get_last_week_activity_metrics(self: @ContractState) -> (u256, u256) {
            self.policy_manager.get_last_week_activity_metrics()
        }

        fn get_total_activity_metrics(self: @ContractState) -> (u256, u256) {
            self.policy_manager.get_total_activity_metrics()
        }

        fn get_current_dynamic_yield_rate(self: @ContractState) -> u16 {
            self.policy_manager.get_current_dynamic_yield_rate()
        }

        fn get_current_yield_rate(self: @ContractState) -> u16 {
            let reserve_data = self.reserve_manager.get_reserve_info();
            reserve_data.yield_rate_bps
        }

        fn get_weekly_claims_metrics(self: @ContractState) -> (u256, u256) {
            self.policy_manager.get_weekly_claims_metrics()
        }

        fn get_last_week_claims_metrics(self: @ContractState) -> (u256, u256) {
            self.policy_manager.get_last_week_claims_metrics()
        }

        fn get_loss_ratio(self: @ContractState) -> u16 {
            self.policy_manager.get_loss_ratio()
        }

        fn get_yield_rate_stability_info(self: @ContractState) -> (u32, u64) {
            self.policy_manager.get_yield_rate_stability_info()
        }
    }
}
