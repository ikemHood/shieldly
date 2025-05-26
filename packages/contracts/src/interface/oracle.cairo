#[starknet::interface]
pub trait IOracleManager<TContractState> {
    fn get_strk_usd_price(self: @TContractState) -> u128;
    fn convert_usd_to_strk(self: @TContractState, usd_amount: u256) -> u256;
}
