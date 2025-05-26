use starknet::ContractAddress;

/// User status in the system
///
#[allow(starknet::store_no_default_variant)]
#[derive(Drop, Serde, starknet::Store, PartialEq, Clone)]
pub enum UserStatus {
    INACTIVE,
    ACTIVE,
    BANNED,
}

/// Policy status
#[allow(starknet::store_no_default_variant)]
#[derive(Drop, Serde, starknet::Store, PartialEq, Clone)]
pub enum PolicyStatus {
    DRAFT,
    ACTIVE,
    EXPIRED,
    PAUSED,
}

/// Claim status
#[allow(starknet::store_no_default_variant)]
#[derive(Drop, Serde, starknet::Store, PartialEq, Clone)]
pub enum ClaimStatus {
    PENDING,
    APPROVED,
    REJECTED,
    PAID,
}

/// User profile data
#[derive(Drop, Serde, starknet::Store)]
pub struct UserProfile {
    // User address
    pub address: ContractAddress,
    // Status of the user in the system
    pub status: UserStatus,
    // Has passed KYC verification
    pub kyc_verified: bool,
    // Total policies owned
    pub policies_count: u32,
    // Funder stake amount
    pub funder_stake: u256,
    // Accrued yield
    pub accrued_yield: u256,
    // Last time yield was claimed
    pub last_yield_claimed: u64,
}

/// Policy metadata
#[derive(Drop, Serde, starknet::Store)]
pub struct PolicyMetadata {
    // Coverage amount
    pub coverage_amount: u256,
    // Premium cost
    pub premium_amount: u256,
    // Single payout amount when claim is approved
    pub payout_amount: u256,
    // Term period in days
    pub term_days: u32,
    // Description of the trigger condition
    pub trigger_description: felt252,
    // Any additional details
    pub details: felt252,
}

/// Policy data
#[derive(Drop, Serde, starknet::Store)]
pub struct Policy {
    // Policy unique id
    pub id: u256,
    // Creator address
    pub creator: ContractAddress,
    // Policy metadata
    pub metadata: PolicyMetadata,
    // Current status
    pub status: PolicyStatus,
    // Creation timestamp
    pub creation_time: u64,
    // Approval timestamp
    pub approval_time: u64,
}

/// User policy subscription
#[derive(Drop, Serde, starknet::Store)]
pub struct UserPolicy {
    // Policy id reference
    pub policy_id: u256,
    // User address
    pub user: ContractAddress,
    // Purchase timestamp
    pub purchase_time: u64,
    // Expiry timestamp
    pub expiry_time: u64,
    // Active status
    pub is_active: bool,
}

/// Claim data
#[derive(Drop, Serde, starknet::Store)]
pub struct Claim {
    // Claim unique id
    pub id: u256,
    // Policy id reference
    pub policy_id: u256,
    // Claimant address
    pub claimant: ContractAddress,
    // Evidence hash
    pub evidence_hash: felt252,
    // Claim status
    pub status: ClaimStatus,
    // Submission timestamp
    pub submission_time: u64,
    // Processing timestamp
    pub processing_time: u64,
}

/// Reserve fund data
#[derive(Drop, Serde, starknet::Store)]
pub struct ReserveData {
    // Total funds in the reserve
    pub total_funds: u256,
    // Total stakers
    pub total_stakers: u32,
    // Last yield distribution timestamp
    pub last_yield_distribution: u64,
    // Yield rate (annual percentage expressed as basis points, e.g. 500 = 5%)
    pub yield_rate_bps: u16,
}
