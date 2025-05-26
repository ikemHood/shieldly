"use client";
import { useAccount, useConnect, useContract, useDisconnect, useNetwork, useReadContract, useSendTransaction } from "@starknet-react/core";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Abi } from "starknet";
import { getContractAddress, getContractAbi } from "../contracts/config";
import {
    ReserveHookReturn,
    ReserveMetrics,
    UserProfile,
    ReserveData,
    ReserveActions
} from "../types/contracts";

export const useReserve = (): ReserveHookReturn => {
    const { address, isConnected } = useAccount();
    const [error, setError] = useState<string | null>(null);
    const [isStaking, setIsStaking] = useState(false);
    const [isUnstaking, setIsUnstaking] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    // Contract configuration
    const contractAddress = getContractAddress("sepolia");
    const contractAbi = getContractAbi();

    // Contract instance for transactions
    const { contract } = useContract({
        abi: contractAbi as Abi,
        address: contractAddress,
    });

    // Read user profile
    const {
        data: userProfileData,
        isLoading: isLoadingProfile,
        error: profileError,
        refetch: refetchProfile
    } = useReadContract({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName: "get_user_profile",
        args: address ? [address] : undefined,
        watch: true,
        enabled: !!address && isConnected,
    });

    // Read reserve data
    const {
        data: reserveDataRaw,
        isLoading: isLoadingReserve,
        error: reserveError,
        refetch: refetchReserve
    } = useReadContract({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName: "get_reserve_info",
        args: [],
        watch: true,
    });

    // Read user's funder stake
    const {
        data: userStakeData,
        isLoading: isLoadingStake,
        error: stakeError,
        refetch: refetchStake
    } = useReadContract({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName: "get_funder_stake",
        args: address ? [address] : undefined,
        watch: true,
        enabled: !!address && isConnected,
    });

    // Read user's yield info
    const {
        data: yieldInfoData,
        isLoading: isLoadingYield,
        error: yieldError,
        refetch: refetchYield
    } = useReadContract({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName: "get_yield_info",
        args: address ? [address] : undefined,
        watch: true,
        enabled: !!address && isConnected,
    });

    // Read current yield rate
    const {
        data: yieldRateData,
        isLoading: isLoadingYieldRate,
        error: yieldRateError,
        refetch: refetchYieldRate
    } = useReadContract({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName: "get_current_yield_rate",
        args: [],
        watch: true,
    });

    // Read available funds
    const {
        data: availableFundsData,
        isLoading: isLoadingFunds,
        error: fundsError,
        refetch: refetchFunds
    } = useReadContract({
        abi: contractAbi as Abi,
        address: contractAddress,
        functionName: "get_available_funds",
        args: [],
        watch: true,
    });

    // Transaction hooks
    const { send: sendStake, isPending: isPendingStake, error: stakeTransactionError } = useSendTransaction({
        calls: undefined,
    });

    const { send: sendUnstake, isPending: isPendingUnstake, error: unstakeTransactionError } = useSendTransaction({
        calls: undefined,
    });

    const { send: sendClaim, isPending: isPendingClaim, error: claimTransactionError } = useSendTransaction({
        calls: undefined,
    });

    // Parse contract data
    const userProfile = useMemo((): UserProfile | null => {
        if (!userProfileData || !Array.isArray(userProfileData)) return null;

        try {
            return {
                address: userProfileData[0] as string,
                status: Number(userProfileData[1]) as any,
                kyc_verified: Boolean(userProfileData[2]),
                policies_count: Number(userProfileData[3]),
                funder_stake: BigInt(userProfileData[4]?.toString() || "0"),
                accrued_yield: BigInt(userProfileData[5]?.toString() || "0"),
                last_yield_claimed: BigInt(userProfileData[6]?.toString() || "0"),
            };
        } catch (err) {
            console.error("Error parsing user profile:", err);
            return null;
        }
    }, [userProfileData]);

    const reserveData = useMemo((): ReserveData | null => {
        if (!reserveDataRaw || !Array.isArray(reserveDataRaw)) return null;

        try {
            return {
                total_funds: BigInt(reserveDataRaw[0]?.toString() || "0"),
                total_stakers: Number(reserveDataRaw[1]),
                last_yield_distribution: BigInt(reserveDataRaw[2]?.toString() || "0"),
                yield_rate_bps: Number(reserveDataRaw[3]),
            };
        } catch (err) {
            console.error("Error parsing reserve data:", err);
            return null;
        }
    }, [reserveDataRaw]);

    const metrics = useMemo((): ReserveMetrics | null => {
        if (!reserveData) return null;

        const userStake = userStakeData ? BigInt(userStakeData.toString()) : BigInt(0);
        const availableYield = yieldInfoData && Array.isArray(yieldInfoData)
            ? BigInt(yieldInfoData[0]?.toString() || "0")
            : BigInt(0);
        const lastYieldClaimed = yieldInfoData && Array.isArray(yieldInfoData)
            ? BigInt(yieldInfoData[1]?.toString() || "0")
            : BigInt(0);
        const currentYieldRate = yieldRateData ? Number(yieldRateData) : 0;
        const availableFunds = availableFundsData ? BigInt(availableFundsData.toString()) : BigInt(0);

        const userStakePercentage = reserveData.total_funds > 0n
            ? Number((userStake * 10000n) / reserveData.total_funds) / 100
            : 0;

        return {
            totalPoolValue: reserveData.total_funds,
            userStake,
            userStakePercentage,
            availableYield,
            currentYieldRate,
            lastYieldClaimed,
            totalStakers: reserveData.total_stakers,
            availableFunds,
        };
    }, [reserveData, userStakeData, yieldInfoData, yieldRateData, availableFundsData]);

    // Action functions
    const stakeFunds = useCallback(async (amount: bigint) => {
        if (!contract || !address) {
            setError("Contract not available or wallet not connected");
            return;
        }

        try {
            setIsStaking(true);
            setError(null);

            const calls = contract.populate("stake_funds", [amount.toString()]);
            await sendStake([calls]);

            // Refetch data after successful transaction
            setTimeout(() => {
                refetchProfile();
                refetchReserve();
                refetchStake();
                refetchYield();
            }, 2000);

        } catch (err: any) {
            console.error("Error staking funds:", err);
            setError(err.message || "Failed to stake funds");
        } finally {
            setIsStaking(false);
        }
    }, [contract, address, sendStake, refetchProfile, refetchReserve, refetchStake, refetchYield]);

    const unstakeFunds = useCallback(async (amount: bigint) => {
        if (!contract || !address) {
            setError("Contract not available or wallet not connected");
            return;
        }

        try {
            setIsUnstaking(true);
            setError(null);

            const calls = contract.populate("unstake_funds", [amount.toString()]);
            await sendUnstake([calls]);

            // Refetch data after successful transaction
            setTimeout(() => {
                refetchProfile();
                refetchReserve();
                refetchStake();
                refetchYield();
            }, 2000);

        } catch (err: any) {
            console.error("Error unstaking funds:", err);
            setError(err.message || "Failed to unstake funds");
        } finally {
            setIsUnstaking(false);
        }
    }, [contract, address, sendUnstake, refetchProfile, refetchReserve, refetchStake, refetchYield]);

    const claimYield = useCallback(async () => {
        if (!contract || !address) {
            setError("Contract not available or wallet not connected");
            return;
        }

        try {
            setIsClaiming(true);
            setError(null);

            const calls = contract.populate("claim_yield", []);
            await sendClaim([calls]);

            // Refetch data after successful transaction
            setTimeout(() => {
                refetchProfile();
                refetchReserve();
                refetchYield();
            }, 2000);

        } catch (err: any) {
            console.error("Error claiming yield:", err);
            setError(err.message || "Failed to claim yield");
        } finally {
            setIsClaiming(false);
        }
    }, [contract, address, sendClaim, refetchProfile, refetchReserve, refetchYield]);

    const actions: ReserveActions = useMemo(() => ({
        stakeFunds,
        unstakeFunds,
        claimYield,
    }), [stakeFunds, unstakeFunds, claimYield]);

    // Global refetch function
    const refetch = useCallback(() => {
        refetchProfile();
        refetchReserve();
        refetchStake();
        refetchYield();
        refetchYieldRate();
        refetchFunds();
    }, [refetchProfile, refetchReserve, refetchStake, refetchYield, refetchYieldRate, refetchFunds]);

    // Determine loading state
    const isLoading = isLoadingProfile || isLoadingReserve || isLoadingStake ||
        isLoadingYield || isLoadingYieldRate || isLoadingFunds;

    // Handle errors
    useEffect(() => {
        const errors = [
            profileError,
            reserveError,
            stakeError,
            yieldError,
            yieldRateError,
            fundsError,
            stakeTransactionError,
            unstakeTransactionError,
            claimTransactionError
        ].filter(Boolean);

        if (errors.length > 0) {
            setError(errors[0]?.message || "An error occurred");
        }
    }, [
        profileError,
        reserveError,
        stakeError,
        yieldError,
        yieldRateError,
        fundsError,
        stakeTransactionError,
        unstakeTransactionError,
        claimTransactionError
    ]);

    return {
        metrics,
        userProfile,
        reserveData,
        isLoading,
        isStaking: isStaking || isPendingStake,
        isUnstaking: isUnstaking || isPendingUnstake,
        isClaiming: isClaiming || isPendingClaim,
        actions,
        error,
        refetch,
    };
};