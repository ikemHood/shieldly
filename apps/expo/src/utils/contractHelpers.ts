// Contract helper functions for the expo app
import {
    ContractPolicy,
    UserPolicy,
    ContractClaim,
    PolicyDisplayData,
    ClaimDisplayData,
    UserPolicyDisplayData,
    PolicyStatus,
    ClaimStatus,
} from '../types/contracts';
import {
    formatUSD,
    formatDate,
    formatDateTime,
    formatPolicyStatus,
    formatClaimStatus,
    felt252ToString,
    getDaysUntilExpiry,
    formatTimeRemaining,
} from './format';

/**
 * Convert contract policy data to display format
 */
export function contractPolicyToDisplay(policy: ContractPolicy): PolicyDisplayData {
    return {
        id: policy.id.toString(),
        title: policy.metadata.details || `Policy #${policy.id}`,
        description: policy.metadata.trigger_description || 'Insurance policy',
        premium: Number(policy.metadata.premium_amount) / 1e6, // Assuming 6 decimals for USDC
        coverage: Number(policy.metadata.coverage_amount) / 1e6,
        payout: Number(policy.metadata.payout_amount) / 1e6,
        termDays: policy.metadata.term_days,
        status: formatPolicyStatus(policy.status),
        isActive: policy.status === PolicyStatus.ACTIVE,
        createdAt: new Date(Number(policy.creation_time) * 1000),
        approvedAt: policy.approval_time > 0n ? new Date(Number(policy.approval_time) * 1000) : undefined,
        triggerDescription: policy.metadata.trigger_description,
    };
}

/**
 * Convert contract claim data to display format
 */
export function contractClaimToDisplay(claim: ContractClaim): ClaimDisplayData {
    return {
        id: claim.id.toString(),
        policyId: claim.policy_id.toString(),
        amount: 0, // This would need to be fetched from policy data
        status: formatClaimStatus(claim.status),
        description: 'Insurance claim',
        submittedAt: new Date(Number(claim.submission_time) * 1000),
        processedAt: claim.processing_time > 0n ? new Date(Number(claim.processing_time) * 1000) : undefined,
        evidenceHash: claim.evidence_hash,
    };
}

/**
 * Convert user policy data to display format
 */
export function userPolicyToDisplay(
    userPolicy: UserPolicy,
    contractPolicy?: ContractPolicy
): UserPolicyDisplayData {
    return {
        policyId: userPolicy.policy_id.toString(),
        purchaseDate: new Date(Number(userPolicy.purchase_time) * 1000),
        expiryDate: new Date(Number(userPolicy.expiry_time) * 1000),
        isActive: userPolicy.is_active,
        policy: contractPolicy ? contractPolicyToDisplay(contractPolicy) : undefined,
    };
}

/**
 * Get policy categories for filtering
 */
export function getPolicyCategories() {
    return [
        { id: 'all', name: 'All Policies', type: 'all' },
        { id: 'crop', name: 'Crop Insurance', type: 'crop' },
        { id: 'livestock', name: 'Livestock Insurance', type: 'livestock' },
        { id: 'business', name: 'Business Insurance', type: 'business' },
        { id: 'health', name: 'Health Insurance', type: 'health' },
    ];
}

/**
 * Filter policies by category
 */
export function filterPoliciesByCategory(
    policies: PolicyDisplayData[],
    category: string
): PolicyDisplayData[] {
    if (category === 'all') return policies;

    return policies.filter(policy => {
        const text = `${policy.title} ${policy.description}`.toLowerCase();
        return text.includes(category.toLowerCase());
    });
}

/**
 * Sort policies by different criteria
 */
export function sortPolicies(
    policies: PolicyDisplayData[],
    sortBy: 'premium' | 'coverage' | 'termDays' | 'createdAt'
): PolicyDisplayData[] {
    return [...policies].sort((a, b) => {
        switch (sortBy) {
            case 'premium':
                return a.premium - b.premium;
            case 'coverage':
                return b.coverage - a.coverage;
            case 'termDays':
                return a.termDays - b.termDays;
            case 'createdAt':
                return b.createdAt.getTime() - a.createdAt.getTime();
            default:
                return 0;
        }
    });
}

/**
 * Get policy status color for UI
 */
export function getPolicyStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'active':
            return '#10B981'; // green
        case 'expired':
            return '#EF4444'; // red
        case 'paused':
            return '#F59E0B'; // yellow
        case 'draft':
            return '#6B7280'; // gray
        default:
            return '#6B7280';
    }
}

/**
 * Get claim status color for UI
 */
export function getClaimStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case 'approved':
        case 'paid':
            return '#10B981'; // green
        case 'rejected':
            return '#EF4444'; // red
        case 'pending':
            return '#F59E0B'; // yellow
        default:
            return '#6B7280';
    }
}

/**
 * Calculate policy premium with any applicable discounts
 */
export function calculatePolicyPremium(
    basePremium: number,
    userDiscountPercentage: number = 0
): number {
    const discount = basePremium * (userDiscountPercentage / 100);
    return Math.max(0, basePremium - discount);
}

/**
 * Check if a policy is about to expire (within 7 days)
 */
export function isPolicyExpiringSoon(expiryTimestamp: bigint): boolean {
    const daysUntilExpiry = getDaysUntilExpiry(expiryTimestamp);
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

/**
 * Generate a hash for evidence (placeholder implementation)
 */
export function generateEvidenceHash(evidenceData: string): string {
    let hash = 0;
    for (let i = 0; i < evidenceData.length; i++) {
        const char = evidenceData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Validate policy purchase requirements
 */
export function validatePolicyPurchase(
    policy: PolicyDisplayData,
    userProfile: any
): { isValid: boolean; reason?: string } {
    if (!policy.isActive) {
        return { isValid: false, reason: 'Policy is not active' };
    }

    if (!userProfile) {
        return { isValid: false, reason: 'User profile not found' };
    }

    if (!userProfile.kyc_verified) {
        return { isValid: false, reason: 'KYC verification required' };
    }

    return { isValid: true };
}

/**
 * Validate claim submission requirements
 */
export function validateClaimSubmission(
    userPolicy: UserPolicyDisplayData,
    evidenceData: string
): { isValid: boolean; reason?: string } {
    if (!userPolicy.isActive) {
        return { isValid: false, reason: 'Policy is not active' };
    }

    const now = new Date();
    if (userPolicy.expiryDate < now) {
        return { isValid: false, reason: 'Policy has expired' };
    }

    if (!evidenceData || evidenceData.trim().length === 0) {
        return { isValid: false, reason: 'Evidence is required' };
    }

    return { isValid: true };
} 