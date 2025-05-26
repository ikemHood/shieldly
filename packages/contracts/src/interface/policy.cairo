use starknet::ContractAddress;
use core::array::Array;
use shieldly::types::types::{Policy, PolicyStatus, PolicyMetadata, UserPolicy, Claim};

#[starknet::interface]
pub trait IPolicyManager<TContractState> {
    // Policy creation and management
    fn create_policy(ref self: TContractState, metadata: PolicyMetadata) -> u256;

    fn get_policy(self: @TContractState, policy_id: u256) -> Policy;

    fn list_policies(self: @TContractState, status: PolicyStatus) -> Array<Policy>;

    fn activate_policy(ref self: TContractState, policy_id: u256);

    fn expire_policy(ref self: TContractState, policy_id: u256);

    fn pause_policy(ref self: TContractState, policy_id: u256);

    // User policy functions
    fn purchase_policy(ref self: TContractState, policy_id: u256) -> bool;

    fn get_user_policies(self: @TContractState, user: ContractAddress) -> Array<UserPolicy>;

    // Claim management
    fn submit_claim(ref self: TContractState, policy_id: u256, evidence_hash: felt252) -> u256;

    fn process_claim(
        ref self: TContractState, claim_id: u256, external_data_hash: felt252, approved: bool,
    );

    fn get_renewal_interval(self: @TContractState, user: ContractAddress, policy_id: u256) -> u256;

    fn pay_out_claim(ref self: TContractState, claim_id: u256);

    fn get_claim(self: @TContractState, claim_id: u256) -> Claim;

    fn get_claims_for_policy(self: @TContractState, policy_id: u256) -> Array<Claim>;

    fn get_user_claims(self: @TContractState, user: ContractAddress) -> Array<Claim>;

    fn get_policy_renewals(self: @TContractState, user: ContractAddress, policy_id: u256) -> u256;

    fn get_last_renewal(self: @TContractState, user: ContractAddress, policy_id: u256) -> u64;

    fn is_whitelisted_renewer(self: @TContractState, renewer: ContractAddress) -> bool;

    fn cancel_auto_renewal(ref self: TContractState, policy_id: u256);

    fn auto_renew_policy(ref self: TContractState, user: ContractAddress, policy_id: u256) -> bool;

    fn get_weekly_activity_metrics(self: @TContractState) -> (u256, u256); // (purchases, volume)

    fn get_last_week_activity_metrics(self: @TContractState) -> (u256, u256); // (purchases, volume)

    fn get_total_activity_metrics(
        self: @TContractState,
    ) -> (u256, u256); // (total_purchases, total_volume)

    fn get_current_dynamic_yield_rate(
        self: @TContractState,
    ) -> u16; // Current calculated yield rate

    fn get_weekly_claims_metrics(
        self: @TContractState,
    ) -> (u256, u256); // (claims_count, claims_volume)

    fn get_last_week_claims_metrics(
        self: @TContractState,
    ) -> (u256, u256); // (claims_count, claims_volume)

    fn get_loss_ratio(self: @TContractState) -> u16; // Loss ratio in basis points

    fn get_yield_rate_stability_info(
        self: @TContractState,
    ) -> (u32, u64); // (change_count, last_calculation)
}
