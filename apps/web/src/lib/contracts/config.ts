import { Abi } from "starknet";

// Contract addresses by network
export const CONTRACTS = {
    sepolia: {
        ShieldlyCore: {
            address: "0x22ede75b164f12f10b2d365e6bdaf96aa7f750e15a8979e12686ed984127c5a",
            classHash: "0x3b93bda4dbb10a643ad10fa4ad22b24ee7423571d168780e51be3df162bebc",
        },
    },
    mainnet: {
        ShieldlyCore: {
            address: "",
            classHash: "",
        },
    },
} as const;

// ABI for ShieldlyCore contract
export const SHIELDLY_CORE_ABI = [
    {
        "type": "impl",
        "name": "ShieldlyCoreImpl",
        "interface_name": "shieldly::interface::core::IShieldlyCore"
    },
    {
        "type": "enum",
        "name": "core::bool",
        "variants": [
            {
                "name": "False",
                "type": "()"
            },
            {
                "name": "True",
                "type": "()"
            }
        ]
    },
    {
        "type": "enum",
        "name": "shieldly::types::types::UserStatus",
        "variants": [
            {
                "name": "INACTIVE",
                "type": "()"
            },
            {
                "name": "ACTIVE",
                "type": "()"
            },
            {
                "name": "BANNED",
                "type": "()"
            }
        ]
    },
    {
        "type": "struct",
        "name": "core::integer::u256",
        "members": [
            {
                "name": "low",
                "type": "core::integer::u128"
            },
            {
                "name": "high",
                "type": "core::integer::u128"
            }
        ]
    },
    {
        "type": "struct",
        "name": "shieldly::types::types::UserProfile",
        "members": [
            {
                "name": "address",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "status",
                "type": "shieldly::types::types::UserStatus"
            },
            {
                "name": "kyc_verified",
                "type": "core::bool"
            },
            {
                "name": "policies_count",
                "type": "core::integer::u32"
            },
            {
                "name": "funder_stake",
                "type": "core::integer::u256"
            },
            {
                "name": "accrued_yield",
                "type": "core::integer::u256"
            },
            {
                "name": "last_yield_claimed",
                "type": "core::integer::u64"
            }
        ]
    },
    {
        "type": "struct",
        "name": "shieldly::types::types::ReserveData",
        "members": [
            {
                "name": "total_funds",
                "type": "core::integer::u256"
            },
            {
                "name": "total_stakers",
                "type": "core::integer::u32"
            },
            {
                "name": "last_yield_distribution",
                "type": "core::integer::u64"
            },
            {
                "name": "yield_rate_bps",
                "type": "core::integer::u16"
            }
        ]
    },
    {
        "type": "interface",
        "name": "shieldly::interface::core::IShieldlyCore",
        "items": [
            {
                "type": "function",
                "name": "get_user_profile",
                "inputs": [
                    {
                        "name": "user",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "shieldly::types::types::UserProfile"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_staking_token",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "stake_funds",
                "inputs": [
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "unstake_funds",
                "inputs": [
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "get_funder_stake",
                "inputs": [
                    {
                        "name": "funder",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "claim_yield",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "get_yield_info",
                "inputs": [
                    {
                        "name": "user",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "(core::integer::u256, core::integer::u64)"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_reserve_info",
                "inputs": [],
                "outputs": [
                    {
                        "type": "shieldly::types::types::ReserveData"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_available_funds",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_current_yield_rate",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u16"
                    }
                ],
                "state_mutability": "view"
            }
        ]
    }
] as const satisfies Abi;

// Helper function to get contract address for current network
export const getContractAddress = (network: "sepolia" | "mainnet" = "sepolia"): `0x${string}` => {
    const address = CONTRACTS[network].ShieldlyCore.address;
    if (!address) {
        throw new Error(`Contract address not configured for network: ${network}`);
    }
    return address as `0x${string}`;
};

// Helper function to get contract ABI
export const getContractAbi = () => {
    return SHIELDLY_CORE_ABI;
}; 