use starknet::ContractAddress;
use shieldly::types::types::{
    UserProfile, UserStatus, Policy, PolicyStatus, PolicyMetadata, UserPolicy, Claim, ReserveData,
};
use core::array::Array;

#[starknet::interface]
pub trait IShieldlyCore<TContractState> {
    // User management
    fn register_user(ref self: TContractState) -> bool;

    fn get_user_profile(self: @TContractState, user: ContractAddress) -> UserProfile;

    fn update_user_status(ref self: TContractState, user: ContractAddress, status: UserStatus);

    // KYC management
    fn verify_user_kyc(ref self: TContractState, user: ContractAddress, kyc_verified: bool);

    fn set_kyc_manager(ref self: TContractState, kyc_manager: ContractAddress);

    fn get_kyc_manager(self: @TContractState) -> ContractAddress;

    // Admin functions
    fn set_admin(ref self: TContractState, admin: ContractAddress);

    fn get_admin(self: @TContractState) -> ContractAddress;

    fn pause_contract(ref self: TContractState);

    fn unpause_contract(ref self: TContractState);

    fn is_paused(self: @TContractState) -> bool;

    // Upgradability
    fn upgrade(ref self: TContractState, new_implementation: felt252);

    // Oracle-related methods
    fn set_pragma_oracle(ref self: TContractState, pragma_oracle_address: ContractAddress);

    fn get_pragma_oracle(self: @TContractState) -> ContractAddress;

    fn convert_usd_to_strk(self: @TContractState, usd_amount: u256) -> u256;

    // Token management
    fn set_staking_token(ref self: TContractState, token: ContractAddress);

    fn set_premium_token(ref self: TContractState, token: ContractAddress);

    fn get_staking_token(self: @TContractState) -> ContractAddress;

    // Policy management functions
    fn create_policy(ref self: TContractState, metadata: PolicyMetadata) -> u256;

    fn get_policy(self: @TContractState, policy_id: u256) -> Policy;

    fn list_policies(self: @TContractState, status: PolicyStatus) -> Array<Policy>;

    fn activate_policy(ref self: TContractState, policy_id: u256);

    fn expire_policy(ref self: TContractState, policy_id: u256);

    fn pause_policy(ref self: TContractState, policy_id: u256);

    fn buy_policy(ref self: TContractState, policy_id: u256) -> bool;

    fn get_user_policies(self: @TContractState, user: ContractAddress) -> Array<UserPolicy>;

    // Claim management functions
    fn submit_claim(ref self: TContractState, policy_id: u256, evidence_hash: felt252) -> u256;

    fn process_claim(
        ref self: TContractState, claim_id: u256, external_data_hash: felt252, approved: bool,
    );

    fn pay_out_claim(ref self: TContractState, claim_id: u256);

    fn get_claim(self: @TContractState, claim_id: u256) -> Claim;

    fn get_claims_for_policy(self: @TContractState, policy_id: u256) -> Array<Claim>;

    fn get_user_claims(self: @TContractState, user: ContractAddress) -> Array<Claim>;

    // Auto-renewal functions
    fn get_policy_renewals(self: @TContractState, user: ContractAddress, policy_id: u256) -> u256;

    fn get_last_renewal(self: @TContractState, user: ContractAddress, policy_id: u256) -> u64;

    fn is_whitelisted_renewer(self: @TContractState, renewer: ContractAddress) -> bool;

    fn cancel_auto_renewal(ref self: TContractState, policy_id: u256);

    fn auto_renew_policy(ref self: TContractState, user: ContractAddress, policy_id: u256) -> bool;

    fn get_renewal_interval(self: @TContractState, user: ContractAddress, policy_id: u256) -> u256;

    fn set_whitelisted_renewers(
        ref self: TContractState, renewers: Array<ContractAddress>, status: bool,
    );

    // Reserve management functions
    fn stake_funds(ref self: TContractState, amount: u256);

    fn unstake_funds(ref self: TContractState, amount: u256);

    fn get_funder_stake(self: @TContractState, funder: ContractAddress) -> u256;

    fn distribute_yield(ref self: TContractState);

    fn claim_yield(ref self: TContractState) -> u256;

    fn get_yield_info(self: @TContractState, user: ContractAddress) -> (u256, u64);

    fn get_reserve_info(self: @TContractState) -> ReserveData;

    fn get_available_funds(self: @TContractState) -> u256;

    fn get_weekly_activity_metrics(self: @TContractState) -> (u256, u256);

    fn get_last_week_activity_metrics(self: @TContractState) -> (u256, u256);

    fn get_total_activity_metrics(self: @TContractState) -> (u256, u256);

    fn get_current_dynamic_yield_rate(self: @TContractState) -> u16;

    fn get_current_yield_rate(self: @TContractState) -> u16;

    // Sustainability metrics functions
    fn get_weekly_claims_metrics(self: @TContractState) -> (u256, u256);

    fn get_last_week_claims_metrics(self: @TContractState) -> (u256, u256);

    fn get_loss_ratio(self: @TContractState) -> u16;

    fn get_yield_rate_stability_info(self: @TContractState) -> (u32, u64);
}
