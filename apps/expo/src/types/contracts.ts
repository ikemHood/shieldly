// Contract types based on Cairo structs for policy management

export interface UserProfile {
    address: string;
    status: UserStatus;
    kyc_verified: boolean;
    policies_count: number;
    funder_stake: bigint;
    accrued_yield: bigint;
    last_yield_claimed: bigint;
}

export interface PolicyMetadata {
    coverage_amount: bigint;
    premium_amount: bigint;
    payout_amount: bigint;
    term_days: number;
    trigger_description: string;
    details: string;
}

export interface ContractPolicy {
    id: bigint;
    creator: string;
    metadata: PolicyMetadata;
    status: PolicyStatus;
    creation_time: bigint;
    approval_time: bigint;
}

export interface UserPolicy {
    policy_id: bigint;
    user: string;
    purchase_time: bigint;
    expiry_time: bigint;
    is_active: boolean;
}

export interface ContractClaim {
    id: bigint;
    policy_id: bigint;
    claimant: string;
    evidence_hash: string;
    status: ClaimStatus;
    submission_time: bigint;
    processing_time: bigint;
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

// Utility types for hook returns
export interface PolicyData {
    availablePolicies: ContractPolicy[];
    userPolicies: UserPolicy[];
    userClaims: ContractClaim[];
    userProfile: UserProfile | null;
}

export interface PolicyActions {
    registerUser: (walletPin: string) => Promise<boolean>;
    buyPolicy: (policyId: bigint, walletPin: string) => Promise<boolean>;
    submitClaim: (policyId: bigint, evidenceHash: string, walletPin: string) => Promise<bigint>;
    cancelAutoRenewal: (policyId: bigint, walletPin: string) => Promise<void>;
    refreshData: () => void;
}

export interface PolicyHookReturn {
    // Data
    data: PolicyData;

    // Loading states
    isLoading: boolean;
    isRegistering: boolean;
    isBuyingPolicy: boolean;
    isSubmittingClaim: boolean;
    isCancelingRenewal: boolean;

    // Actions
    actions: PolicyActions;

    // Errors
    error: string | null;

    // Helper functions
    getPolicyById: (id: bigint) => ContractPolicy | undefined;
    getUserPolicyById: (policyId: bigint) => UserPolicy | undefined;
    getClaimsForPolicy: (policyId: bigint) => ContractClaim[];
    isUserRegistered: boolean;
    canBuyPolicy: (policyId: bigint) => boolean;
    canSubmitClaim: (policyId: bigint) => boolean;
}

// Utility functions for converting between contract and UI types
export interface PolicyDisplayData {
    id: string;
    title: string;
    description: string;
    premium: number;
    coverage: number;
    payout: number;
    termDays: number;
    status: string;
    isActive: boolean;
    createdAt: Date;
    approvedAt?: Date;
    triggerDescription: string;
}

export interface ClaimDisplayData {
    id: string;
    policyId: string;
    amount: number;
    status: string;
    description: string;
    submittedAt: Date;
    processedAt?: Date;
    evidenceHash: string;
}

export interface UserPolicyDisplayData {
    policyId: string;
    purchaseDate: Date;
    expiryDate: Date;
    isActive: boolean;
    policy?: PolicyDisplayData;
} 