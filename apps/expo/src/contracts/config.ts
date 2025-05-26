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
            address: "", // To be filled when deployed to mainnet
            classHash: "",
        },
    },
} as const;

// ABI for ShieldlyCore contract - Policy-related functions
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
        "name": "shieldly::types::types::PolicyStatus",
        "variants": [
            {
                "name": "DRAFT",
                "type": "()"
            },
            {
                "name": "ACTIVE",
                "type": "()"
            },
            {
                "name": "EXPIRED",
                "type": "()"
            },
            {
                "name": "PAUSED",
                "type": "()"
            }
        ]
    },
    {
        "type": "enum",
        "name": "shieldly::types::types::ClaimStatus",
        "variants": [
            {
                "name": "PENDING",
                "type": "()"
            },
            {
                "name": "APPROVED",
                "type": "()"
            },
            {
                "name": "REJECTED",
                "type": "()"
            },
            {
                "name": "PAID",
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
        "name": "shieldly::types::types::PolicyMetadata",
        "members": [
            {
                "name": "coverage_amount",
                "type": "core::integer::u256"
            },
            {
                "name": "premium_amount",
                "type": "core::integer::u256"
            },
            {
                "name": "payout_amount",
                "type": "core::integer::u256"
            },
            {
                "name": "term_days",
                "type": "core::integer::u32"
            },
            {
                "name": "trigger_description",
                "type": "core::felt252"
            },
            {
                "name": "details",
                "type": "core::felt252"
            }
        ]
    },
    {
        "type": "struct",
        "name": "shieldly::types::types::Policy",
        "members": [
            {
                "name": "id",
                "type": "core::integer::u256"
            },
            {
                "name": "creator",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "metadata",
                "type": "shieldly::types::types::PolicyMetadata"
            },
            {
                "name": "status",
                "type": "shieldly::types::types::PolicyStatus"
            },
            {
                "name": "creation_time",
                "type": "core::integer::u64"
            },
            {
                "name": "approval_time",
                "type": "core::integer::u64"
            }
        ]
    },
    {
        "type": "struct",
        "name": "shieldly::types::types::UserPolicy",
        "members": [
            {
                "name": "policy_id",
                "type": "core::integer::u256"
            },
            {
                "name": "user",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "purchase_time",
                "type": "core::integer::u64"
            },
            {
                "name": "expiry_time",
                "type": "core::integer::u64"
            },
            {
                "name": "is_active",
                "type": "core::bool"
            }
        ]
    },
    {
        "type": "struct",
        "name": "shieldly::types::types::Claim",
        "members": [
            {
                "name": "id",
                "type": "core::integer::u256"
            },
            {
                "name": "policy_id",
                "type": "core::integer::u256"
            },
            {
                "name": "claimant",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "evidence_hash",
                "type": "core::felt252"
            },
            {
                "name": "status",
                "type": "shieldly::types::types::ClaimStatus"
            },
            {
                "name": "submission_time",
                "type": "core::integer::u64"
            },
            {
                "name": "processing_time",
                "type": "core::integer::u64"
            }
        ]
    },
    {
        "type": "interface",
        "name": "shieldly::interface::core::IShieldlyCore",
        "items": [
            {
                "type": "function",
                "name": "register_user",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "external"
            },
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
                "name": "get_policy",
                "inputs": [
                    {
                        "name": "policy_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "shieldly::types::types::Policy"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "list_policies",
                "inputs": [
                    {
                        "name": "status",
                        "type": "shieldly::types::types::PolicyStatus"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::array::Array::<shieldly::types::types::Policy>"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "buy_policy",
                "inputs": [
                    {
                        "name": "policy_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::bool"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "get_user_policies",
                "inputs": [
                    {
                        "name": "user",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::array::Array::<shieldly::types::types::UserPolicy>"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "submit_claim",
                "inputs": [
                    {
                        "name": "policy_id",
                        "type": "core::integer::u256"
                    },
                    {
                        "name": "evidence_hash",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "type": "function",
                "name": "get_claim",
                "inputs": [
                    {
                        "name": "claim_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "shieldly::types::types::Claim"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_claims_for_policy",
                "inputs": [
                    {
                        "name": "policy_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::array::Array::<shieldly::types::types::Claim>"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "get_user_claims",
                "inputs": [
                    {
                        "name": "user",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::array::Array::<shieldly::types::types::Claim>"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "type": "function",
                "name": "cancel_auto_renewal",
                "inputs": [
                    {
                        "name": "policy_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
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