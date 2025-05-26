export interface Policy {
    id: string;
    title: string;
    description: string;
    premium: number;
    coverage: number;
    termDays: number;
    policyType: PolicyType;
    isActive: boolean;
    trigger?: string;
    createdAt?: Date;
    expiresAt?: Date;
}

export type PolicyType = 'crop' | 'livestock' | 'business' | 'health';

export interface PolicyCategory {
    id: string;
    name: string;
    type: PolicyType | 'all';
}

export interface PolicyPurchaseRequest {
    policyId: string;
    userAddress: string;
    premium: number;
}

export interface Claim {
    id: string;
    policyId: string;
    amount: number;
    status: ClaimStatus;
    description: string;
    evidence?: string[];
    submittedAt: Date;
    processedAt?: Date;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'processing';

// Sample data
export const samplePolicies: Policy[] = [
    {
        id: '1',
        title: 'Crop Insurance - Drought Protection',
        description: 'Protects against crop loss due to drought conditions',
        premium: 10,
        coverage: 100,
        termDays: 90,
        policyType: 'crop',
        isActive: true,
        trigger: 'Rainfall below 50mm in 30-day period',
    },
    {
        id: '2',
        title: 'Livestock Insurance - Disease Coverage',
        description: 'Coverage for livestock loss due to disease outbreaks',
        premium: 25,
        coverage: 500,
        termDays: 180,
        policyType: 'livestock',
        isActive: true,
        trigger: 'Veterinary confirmation of covered disease',
    },
    {
        id: '3',
        title: 'Business Interruption Insurance',
        description: 'Protects against business income loss',
        premium: 50,
        coverage: 1000,
        termDays: 365,
        policyType: 'business',
        isActive: false,
        trigger: 'Government-mandated business closure',
    },
];

export const policyCategories: PolicyCategory[] = [
    { id: 'all', name: 'All', type: 'all' },
    { id: 'crop', name: 'Crop', type: 'crop' },
    { id: 'livestock', name: 'Livestock', type: 'livestock' },
    { id: 'business', name: 'Business', type: 'business' },
    { id: 'health', name: 'Health', type: 'health' },
]; 