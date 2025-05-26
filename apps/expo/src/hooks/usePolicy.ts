import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    PolicyHookReturn,
    PolicyData,
    PolicyActions,
    ContractPolicy,
    UserPolicy,
    ContractClaim,
    UserProfile,
    PolicyStatus,
    UserStatus,
    PolicyDisplayData,
    ClaimDisplayData,
    UserPolicyDisplayData,
} from '../types/contracts';
import {
    contractPolicyToDisplay,
    contractClaimToDisplay,
    userPolicyToDisplay,
    validatePolicyPurchase,
    validateClaimSubmission,
    generateEvidenceHash,
} from '../utils/contractHelpers';
import { walletService } from '../services/walletService';
import { contractService } from '../services/contractService';

export const usePolicy = (): PolicyHookReturn => {
    // Wallet connection state
    const [address, setAddress] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Data state
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [availablePolicies, setAvailablePolicies] = useState<ContractPolicy[]>([]);
    const [userPolicies, setUserPolicies] = useState<UserPolicy[]>([]);
    const [userClaims, setUserClaims] = useState<ContractClaim[]>([]);

    // Loading and error states
    const [error, setError] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isBuyingPolicy, setIsBuyingPolicy] = useState(false);
    const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
    const [isCancelingRenewal, setIsCancelingRenewal] = useState(false);

    // Initialize wallet connection
    useEffect(() => {
        const initializeWallet = async () => {
            try {
                const walletAddress = await walletService.getWalletAddress();
                const connected = await walletService.isWalletConnected();

                setAddress(walletAddress);
                setIsConnected(connected);

                if (walletAddress && connected) {
                    await loadUserData(walletAddress);
                }
            } catch (error) {
                console.error('Error initializing wallet:', error);
                setError('Failed to initialize wallet');
            }
        };

        initializeWallet();
    }, []);

    // Load user data from contract
    const loadUserData = useCallback(async (userAddress: string) => {
        try {
            setIsLoadingData(true);
            setError(null);

            // Load user profile
            const profile = await contractService.getUserProfile(userAddress);
            setUserProfile(profile);

            // Load available policies (active ones)
            const policies = await contractService.listPolicies(PolicyStatus.ACTIVE);
            setAvailablePolicies(policies);

            // Load user's policies
            const userPols = await contractService.getUserPolicies(userAddress);
            setUserPolicies(userPols);

            // Load user's claims
            const claims = await contractService.getUserClaims(userAddress);
            setUserClaims(claims);

        } catch (error) {
            console.error('Error loading user data:', error);
            setError('Failed to load user data');
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    // Action functions
    const registerUser = useCallback(async (walletPin: string): Promise<boolean> => {
        if (!address) {
            setError("Wallet not connected");
            return false;
        }

        try {
            setIsRegistering(true);
            setError(null);

            const success = await contractService.registerUser(walletPin);

            if (success) {
                // Reload user data after registration
                await loadUserData(address);
            }

            return success;
        } catch (err: any) {
            console.error("Error registering user:", err);
            setError(err.message || "Failed to register user");
            return false;
        } finally {
            setIsRegistering(false);
        }
    }, [address, loadUserData]);

    const buyPolicy = useCallback(async (policyId: bigint, walletPin: string): Promise<boolean> => {
        if (!address || !userProfile) {
            setError("Wallet not connected or user not registered");
            return false;
        }

        try {
            setIsBuyingPolicy(true);
            setError(null);

            // Validate purchase
            const policy = availablePolicies.find(p => p.id === policyId);
            if (!policy) {
                throw new Error("Policy not found");
            }

            const validation = validatePolicyPurchase(
                contractPolicyToDisplay(policy),
                userProfile
            );

            if (!validation.isValid) {
                throw new Error(validation.reason);
            }

            const success = await contractService.buyPolicy(policyId, walletPin);

            if (success) {
                // Reload user data after purchase
                await loadUserData(address);
            }

            return success;
        } catch (err: any) {
            console.error("Error buying policy:", err);
            setError(err.message || "Failed to buy policy");
            return false;
        } finally {
            setIsBuyingPolicy(false);
        }
    }, [address, userProfile, availablePolicies, loadUserData]);

    const submitClaim = useCallback(async (policyId: bigint, evidenceHash: string, walletPin: string): Promise<bigint> => {
        if (!address || !userProfile) {
            setError("Wallet not connected or user not registered");
            return BigInt(0);
        }

        try {
            setIsSubmittingClaim(true);
            setError(null);

            // Validate claim submission
            const userPolicy = userPolicies.find(p => p.policy_id === policyId);
            if (!userPolicy) {
                throw new Error("Policy not found in user policies");
            }

            const policy = availablePolicies.find(p => p.id === policyId);
            const displayData = userPolicyToDisplay(userPolicy, policy);

            const validation = validateClaimSubmission(displayData, evidenceHash);
            if (!validation.isValid) {
                throw new Error(validation.reason);
            }

            const claimId = await contractService.submitClaim(policyId, evidenceHash, walletPin);

            if (claimId > 0n) {
                // Reload user data after claim submission
                await loadUserData(address);
            }

            return claimId;
        } catch (err: any) {
            console.error("Error submitting claim:", err);
            setError(err.message || "Failed to submit claim");
            return BigInt(0);
        } finally {
            setIsSubmittingClaim(false);
        }
    }, [address, userProfile, userPolicies, availablePolicies, loadUserData]);

    const cancelAutoRenewal = useCallback(async (policyId: bigint, walletPin: string): Promise<void> => {
        if (!address) {
            setError("Wallet not connected");
            return;
        }

        try {
            setIsCancelingRenewal(true);
            setError(null);

            await contractService.cancelAutoRenewal(policyId, walletPin);

            // Reload user data after cancellation
            await loadUserData(address);
        } catch (err: any) {
            console.error("Error canceling auto renewal:", err);
            setError(err.message || "Failed to cancel auto renewal");
        } finally {
            setIsCancelingRenewal(false);
        }
    }, [address, loadUserData]);

    const refreshData = useCallback(async () => {
        if (address && isConnected) {
            await loadUserData(address);
        }
    }, [address, isConnected, loadUserData]);

    const actions: PolicyActions = useMemo(() => ({
        registerUser,
        buyPolicy,
        submitClaim,
        cancelAutoRenewal,
        refreshData,
    }), [registerUser, buyPolicy, submitClaim, cancelAutoRenewal, refreshData]);

    // Helper functions
    const getPolicyById = useCallback((id: bigint): ContractPolicy | undefined => {
        return availablePolicies.find(policy => policy.id === id);
    }, [availablePolicies]);

    const getUserPolicyById = useCallback((policyId: bigint): UserPolicy | undefined => {
        return userPolicies.find(policy => policy.policy_id === policyId);
    }, [userPolicies]);

    const getClaimsForPolicy = useCallback((policyId: bigint): ContractClaim[] => {
        return userClaims.filter(claim => claim.policy_id === policyId);
    }, [userClaims]);

    const isUserRegistered = useMemo(() => {
        return userProfile?.status === UserStatus.ACTIVE;
    }, [userProfile]);

    const canBuyPolicy = useCallback((policyId: bigint): boolean => {
        if (!isUserRegistered || !userProfile?.kyc_verified) return false;

        const policy = getPolicyById(policyId);
        if (!policy || policy.status !== PolicyStatus.ACTIVE) return false;

        // Check if user already has this policy
        const existingPolicy = getUserPolicyById(policyId);
        return !existingPolicy || !existingPolicy.is_active;
    }, [isUserRegistered, userProfile, getPolicyById, getUserPolicyById]);

    const canSubmitClaim = useCallback((policyId: bigint): boolean => {
        if (!isUserRegistered) return false;

        const userPolicy = getUserPolicyById(policyId);
        if (!userPolicy || !userPolicy.is_active) return false;

        // Check if policy is not expired
        const now = BigInt(Math.floor(Date.now() / 1000));
        return userPolicy.expiry_time > now;
    }, [isUserRegistered, getUserPolicyById]);

    const data: PolicyData = useMemo(() => ({
        availablePolicies,
        userPolicies,
        userClaims,
        userProfile,
    }), [availablePolicies, userPolicies, userClaims, userProfile]);

    return {
        data,
        isLoading: isLoadingData,
        isRegistering,
        isBuyingPolicy,
        isSubmittingClaim,
        isCancelingRenewal,
        actions,
        error,
        getPolicyById,
        getUserPolicyById,
        getClaimsForPolicy,
        isUserRegistered,
        canBuyPolicy,
        canSubmitClaim,
    };
};
