#[starknet::component]
pub mod OracleComponent {
    use starknet::ContractAddress;
    use starknet::storage::{StoragePointerWriteAccess, StoragePointerReadAccess};
    use pragma_lib::abi::{IPragmaABIDispatcher, IPragmaABIDispatcherTrait};
    use pragma_lib::types::{AggregationMode, DataType, PragmaPricesResponse};

    // STRK/USD pair ID from Pragma documentation
    const STRK_USD_PAIR_ID: felt252 = 6004514686061859652;

    #[storage]
    pub struct Storage {
        pragma_oracle: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PragmaOracleSet: PragmaOracleSet,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PragmaOracleSet {
        previous: ContractAddress,
        new: ContractAddress,
    }

    #[generate_trait]
    pub impl ExternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of ExternalTrait<TContractState> {
        // Get the current STRK/USD price
        fn get_strk_usd_price(self: @ComponentState<TContractState>) -> u128 {
            let oracle_address = self.pragma_oracle.read();
            let oracle = IPragmaABIDispatcher { contract_address: oracle_address };

            // Use the Pragma oracle to get the STRK/USD price
            let data_type = DataType::SpotEntry(STRK_USD_PAIR_ID);
            let response: PragmaPricesResponse = oracle
                .get_data(data_type, AggregationMode::Median(()));

            response.price
        }

        // Convert USD amount to STRK (considering the decimal precision)
        fn convert_usd_to_strk(self: @ComponentState<TContractState>, usd_amount: u256) -> u256 {
            // Get STRK/USD price (with 8 decimals as per Pragma docs)
            let strk_usd_price = self.get_strk_usd_price();

            // STRK/USD price has 8 decimals, multiply by 10 to get to 18 decimals for token
            // precision Calculation: (usd_amount * 10^18) / (strk_usd_price * 10^10)
            // This gives us the equivalent STRK amount with proper decimals
            (usd_amount * 1_000_000_000_000_000_000) / (strk_usd_price.into() * 10_000_000_000)
        }
    }

    // Internal functions
    #[generate_trait]
    pub impl InternalImpl<
        TContractState, +HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        fn initializer(ref self: ComponentState<TContractState>, oracle_address: ContractAddress) {
            // Initialize with zero address, must be set later
            self.pragma_oracle.write(oracle_address);
        }

        fn set_pragma_oracle(
            ref self: ComponentState<TContractState>, new_oracle: ContractAddress,
        ) {
            // Store the previous oracle address for the event
            let previous = self.pragma_oracle.read();

            // Update the oracle address
            self.pragma_oracle.write(new_oracle);

            // Emit the event
            self.emit(PragmaOracleSet { previous, new: new_oracle });
        }
    }
}
