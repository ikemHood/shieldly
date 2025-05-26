// Contract types based on Cairo structs

export interface UserProfile {
    address: string;
    status: UserStatus;
    kyc_verified: boolean;
    policies_count: number;
    funder_stake: bigint;
    accrued_yield: bigint;
    last_yield_claimed: bigint;
}

export interface ReserveData {
    total_funds: bigint;
    total_stakers: number;
    last_yield_distribution: bigint;
    yield_rate_bps: number;
}

export enum UserStatus {
    INACTIVE = 0,
    ACTIVE = 1,
    BANNED = 2,
}

export enum PolicyStatus {
    DRAFT = 0,
    ACTIVE = 1,
    EXPIRED = 2,
    PAUSED = 3,
}

export enum ClaimStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
    PAID = 3,
}

export interface PolicyMetadata {
    coverage_amount: bigint;
    premium_amount: bigint;
    payout_amount: bigint;
    term_days: number;
    trigger_description: string;
    details: string;
}

export interface Policy {
    id: bigint;
    creator: string;
    metadata: PolicyMetadata;
    status: PolicyStatus;
    creation_time: bigint;
    approval_time: bigint;
}

export interface Claim {
    id: bigint;
    policy_id: bigint;
    user: string;
    amount: bigint;
    status: ClaimStatus;
    evidence_hash: string;
    external_data_hash: string;
    submission_time: bigint;
    processing_time: bigint;
}

// Utility types for hook returns
export interface ReserveMetrics {
    totalPoolValue: bigint;
    userStake: bigint;
    userStakePercentage: number;
    availableYield: bigint;
    currentYieldRate: number;
    lastYieldClaimed: bigint;
    totalStakers: number;
    availableFunds: bigint;
}

export interface ReserveActions {
    stakeFunds: (amount: bigint) => Promise<void>;
    unstakeFunds: (amount: bigint) => Promise<void>;
    claimYield: () => Promise<void>;
}

export interface ReserveHookReturn {
    // Data
    metrics: ReserveMetrics | null;
    userProfile: UserProfile | null;
    reserveData: ReserveData | null;

    // Loading states
    isLoading: boolean;
    isStaking: boolean;
    isUnstaking: boolean;
    isClaiming: boolean;

    // Actions
    actions: ReserveActions;

    // Errors
    error: string | null;

    // Refresh function
    refetch: () => void;
}

// Admin types
export interface AdminData {
    policies: Policy[];
    claims: Claim[];
    userProfile: UserProfile | null;
}

export interface AdminActions {
    createPolicy: (metadata: PolicyMetadata) => Promise<bigint>;
    activatePolicy: (policyId: bigint) => Promise<void>;
    pausePolicy: (policyId: bigint) => Promise<void>;
    expirePolicy: (policyId: bigint) => Promise<void>;
    processClaim: (claimId: bigint, externalDataHash: string, approved: boolean) => Promise<void>;
    payoutClaim: (claimId: bigint) => Promise<void>;
}

export interface AdminHookReturn {
    // Data
    data: AdminData;

    // Loading states
    isLoading: boolean;
    isCreatingPolicy: boolean;
    isProcessingClaim: boolean;
    isPayingClaim: boolean;

    // Actions
    actions: AdminActions;

    // Errors
    error: string | null;

    // Refresh function
    refetch: () => void;

    // Admin validation
    isAdmin: boolean;
} 