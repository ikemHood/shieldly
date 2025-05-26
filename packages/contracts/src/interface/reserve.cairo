use starknet::ContractAddress;
use shieldly::types::types::ReserveData;

#[starknet::interface]
pub trait IReserveManager<TContractState> {
    // Funder functions
    fn stake_funds(ref self: TContractState, amount: u256);

    fn unstake_funds(ref self: TContractState, amount: u256);

    fn get_funder_stake(self: @TContractState, funder: ContractAddress) -> u256;

    // Yield management
    fn distribute_yield(ref self: TContractState);

    fn claim_yield(ref self: TContractState) -> u256;

    fn get_yield_info(self: @TContractState, user: ContractAddress) -> (u256, u64);

    // Reserve info
    fn get_reserve_info(self: @TContractState) -> ReserveData;

    fn get_available_funds(self: @TContractState) -> u256;

    fn staking_token(self: @TContractState) -> ContractAddress;

    fn set_yield_rate(ref self: TContractState, rate_bps: u16);

    fn transfer_from_reserve(ref self: TContractState, to: ContractAddress, amount: u256) -> bool;

    fn transfer_to_reserve(ref self: TContractState, from: ContractAddress, amount: u256) -> bool;
}
