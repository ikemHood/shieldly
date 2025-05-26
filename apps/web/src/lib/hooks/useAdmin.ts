"use client";
import { useAccount, useContract, useReadContract, useSendTransaction } from "@starknet-react/core";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Abi } from "starknet";
import { getContractAddress, getContractAbi } from "../contracts/config";
import {
    PolicyMetadata,
    Policy,
    PolicyStatus,
    Claim,
    ClaimStatus,
    AdminActions
} from "../types/contracts";

// Admin wallet address
const ADMIN_ADDRESS = "0x03037d2Ee7d240f56344A75A981c4aBAd49aa09C54cDDCFcD804E93072b4BCcf";

export interface AdminHookReturn {
    isAdmin: boolean;
    policies: Policy[] | null;
    claims: Claim[] | null;
    isLoading: boolean;
    isCreatingPolicy: boolean;
    isProcessingClaim: boolean;
    actions: AdminActions;
    error: string | null;
    refetch: () => void;
}

export const useAdmin = (): AdminHookReturn => {
    const { address, isConnected } = useAccount();
    const [error, setError] = useState<string | null>(null);
    const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
    const [isProcessingClaim, setIsProcessingClaim] = useState(false);

    // Check if connected wallet is admin
    const isAdmin = useMemo(() => {
        return !!(isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
    }, [address, isConnected]);

    // Contract configuration
    const contractAddress = getContractAddress("sepolia");
    const contractAbi = getContractAbi();

    // Contract instance for transactions
    const { contract } = useContract({
        abi: contractAbi as Abi,
        address: contractAddress,
    });

    // Read all policies (DRAFT status for admin review)
    const {
        data: draftPoliciesData,
        isLoading: isLoadingDraftPolicies,
        error: draftPoliciesError,
        refetch: refetchDraftPolicies
    } = useReadContract({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName: "list_policies",
        args: [PolicyStatus.DRAFT],
        watch: true,
        enabled: isAdmin,
    });

    // Read active policies
    const {
        data: activePoliciesData,
        isLoading: isLoadingActivePolicies,
        error: activePoliciesError,
        refetch: refetchActivePolicies
    } = useReadContract({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName: "list_policies",
        args: [PolicyStatus.ACTIVE],
        watch: true,
        enabled: isAdmin,
    });

    // Transaction hooks
    const { send: sendCreatePolicy, isPending: isPendingCreatePolicy, error: createPolicyError } = useSendTransaction({
        calls: undefined,
    });

    const { send: sendActivatePolicy, isPending: isPendingActivatePolicy, error: activatePolicyError } = useSendTransaction({
        calls: undefined,
    });

    const { send: sendProcessClaim, isPending: isPendingProcessClaim, error: processClaimError } = useSendTransaction({
        calls: undefined,
    });

    const { send: sendPayoutClaim, isPending: isPendingPayoutClaim, error: payoutClaimError } = useSendTransaction({
        calls: undefined,
    });

    // Parse policies data
    const policies = useMemo((): Policy[] | null => {
        if (!isAdmin) return null;

        const draftPolicies = draftPoliciesData && Array.isArray(draftPoliciesData) ? draftPoliciesData : [];
        const activePolicies = activePoliciesData && Array.isArray(activePoliciesData) ? activePoliciesData : [];

        const allPolicies = [...draftPolicies, ...activePolicies];

        if (allPolicies.length === 0) return [];

        try {
            return allPolicies.map((policyData: any) => ({
                id: BigInt(policyData[0]?.toString() || "0"),
                creator: policyData[1] as string,
                metadata: {
                    coverage_amount: BigInt(policyData[2][0]?.toString() || "0"),
                    premium_amount: BigInt(policyData[2][1]?.toString() || "0"),
                    payout_amount: BigInt(policyData[2][2]?.toString() || "0"),
                    term_days: Number(policyData[2][3]),
                    trigger_description: policyData[2][4] as string,
                    details: policyData[2][5] as string,
                },
                status: Number(policyData[3]) as PolicyStatus,
                creation_time: BigInt(policyData[4]?.toString() || "0"),
                approval_time: BigInt(policyData[5]?.toString() || "0"),
            }));
        } catch (err) {
            console.error("Error parsing policies:", err);
            return null;
        }
    }, [draftPoliciesData, activePoliciesData, isAdmin]);

    // For now, we'll use a placeholder for claims since we need to implement claim fetching
    const claims = useMemo((): Claim[] | null => {
        if (!isAdmin) return null;
        // TODO: Implement claim fetching when we have the contract methods
        return [];
    }, [isAdmin]);

    // Action functions
    const createPolicy = useCallback(async (metadata: PolicyMetadata): Promise<bigint> => {
        if (!contract || !isAdmin) {
            throw new Error("Contract not available or not admin");
        }

        try {
            setIsCreatingPolicy(true);
            setError(null);

            // Convert string fields to felt252 format for Cairo
            const metadataForContract = {
                coverage_amount: metadata.coverage_amount.toString(),
                premium_amount: metadata.premium_amount.toString(),
                payout_amount: metadata.payout_amount.toString(),
                term_days: metadata.term_days,
                trigger_description: metadata.trigger_description,
                details: metadata.details,
            };

            const calls = contract.populate("create_policy", [metadataForContract]);
            const result = await sendCreatePolicy([calls]);

            // Refetch data after successful transaction
            setTimeout(() => {
                refetchDraftPolicies();
                refetchActivePolicies();
            }, 2000);

            // Return policy ID (this would need to be extracted from transaction result)
            return BigInt(1); // Placeholder

        } catch (err: any) {
            console.error("Error creating policy:", err);
            setError(err.message || "Failed to create policy");
            throw err;
        } finally {
            setIsCreatingPolicy(false);
        }
    }, [contract, isAdmin, sendCreatePolicy, refetchDraftPolicies, refetchActivePolicies]);

    const activatePolicy = useCallback(async (policyId: bigint): Promise<void> => {
        if (!contract || !isAdmin) {
            throw new Error("Contract not available or not admin");
        }

        try {
            setError(null);

            const calls = contract.populate("activate_policy", [policyId.toString()]);
            await sendActivatePolicy([calls]);

            // Refetch data after successful transaction
            setTimeout(() => {
                refetchDraftPolicies();
                refetchActivePolicies();
            }, 2000);

        } catch (err: any) {
            console.error("Error activating policy:", err);
            setError(err.message || "Failed to activate policy");
            throw err;
        }
    }, [contract, isAdmin, sendActivatePolicy, refetchDraftPolicies, refetchActivePolicies]);

    const pausePolicy = useCallback(async (policyId: bigint): Promise<void> => {
        if (!contract || !isAdmin) {
            throw new Error("Contract not available or not admin");
        }

        try {
            setError(null);

            const calls = contract.populate("pause_policy", [policyId.toString()]);
            await sendActivatePolicy([calls]); // Reusing the same transaction hook

            // Refetch data after successful transaction
            setTimeout(() => {
                refetchDraftPolicies();
                refetchActivePolicies();
            }, 2000);

        } catch (err: any) {
            console.error("Error pausing policy:", err);
            setError(err.message || "Failed to pause policy");
            throw err;
        }
    }, [contract, isAdmin, sendActivatePolicy, refetchDraftPolicies, refetchActivePolicies]);

    const expirePolicy = useCallback(async (policyId: bigint): Promise<void> => {
        if (!contract || !isAdmin) {
            throw new Error("Contract not available or not admin");
        }

        try {
            setError(null);

            const calls = contract.populate("expire_policy", [policyId.toString()]);
            await sendActivatePolicy([calls]); // Reusing the same transaction hook

            // Refetch data after successful transaction
            setTimeout(() => {
                refetchDraftPolicies();
                refetchActivePolicies();
            }, 2000);

        } catch (err: any) {
            console.error("Error expiring policy:", err);
            setError(err.message || "Failed to expire policy");
            throw err;
        }
    }, [contract, isAdmin, sendActivatePolicy, refetchDraftPolicies, refetchActivePolicies]);

    const processClaim = useCallback(async (claimId: bigint, externalDataHash: string, approved: boolean): Promise<void> => {
        if (!contract || !isAdmin) {
            throw new Error("Contract not available or not admin");
        }

        try {
            setIsProcessingClaim(true);
            setError(null);

            const calls = contract.populate("process_claim", [
                claimId.toString(),
                externalDataHash,
                approved
            ]);
            await sendProcessClaim([calls]);

            // Refetch data after successful transaction
            setTimeout(() => {
                // TODO: Refetch claims when implemented
            }, 2000);

        } catch (err: any) {
            console.error("Error processing claim:", err);
            setError(err.message || "Failed to process claim");
            throw err;
        } finally {
            setIsProcessingClaim(false);
        }
    }, [contract, isAdmin, sendProcessClaim]);

    const payoutClaim = useCallback(async (claimId: bigint): Promise<void> => {
        if (!contract || !isAdmin) {
            throw new Error("Contract not available or not admin");
        }

        try {
            setError(null);

            const calls = contract.populate("pay_out_claim", [claimId.toString()]);
            await sendPayoutClaim([calls]);

            // Refetch data after successful transaction
            setTimeout(() => {
                // TODO: Refetch claims when implemented
            }, 2000);

        } catch (err: any) {
            console.error("Error paying out claim:", err);
            setError(err.message || "Failed to payout claim");
            throw err;
        }
    }, [contract, isAdmin, sendPayoutClaim]);

    const actions: AdminActions = useMemo(() => ({
        createPolicy,
        activatePolicy,
        pausePolicy,
        expirePolicy,
        processClaim,
        payoutClaim,
    }), [createPolicy, activatePolicy, pausePolicy, expirePolicy, processClaim, payoutClaim]);

    // Global refetch function
    const refetch = useCallback(() => {
        if (isAdmin) {
            refetchDraftPolicies();
            refetchActivePolicies();
            // TODO: Refetch claims when implemented
        }
    }, [isAdmin, refetchDraftPolicies, refetchActivePolicies]);

    // Determine loading state
    const isLoading = isLoadingDraftPolicies || isLoadingActivePolicies;

    // Handle errors
    useEffect(() => {
        const errors = [
            draftPoliciesError,
            activePoliciesError,
            createPolicyError,
            activatePolicyError,
            processClaimError,
            payoutClaimError
        ].filter(Boolean);

        if (errors.length > 0) {
            setError(errors[0]?.message || "An error occurred");
        }
    }, [
        draftPoliciesError,
        activePoliciesError,
        createPolicyError,
        activatePolicyError,
        processClaimError,
        payoutClaimError
    ]);

    return {
        isAdmin,
        policies,
        claims,
        isLoading,
        isCreatingPolicy: isCreatingPolicy || isPendingCreatePolicy,
        isProcessingClaim: isProcessingClaim || isPendingProcessClaim,
        actions,
        error,
        refetch,
    };
}; 