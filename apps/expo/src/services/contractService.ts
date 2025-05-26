import { Contract, RpcProvider } from 'starknet';
import { getContractAddress, getContractAbi } from '../contracts/config';
import { walletService } from './walletService';
import {
    ContractPolicy,
    UserPolicy,
    ContractClaim,
    UserProfile,
    PolicyStatus,
} from '../types/contracts';
import { ChipiSDK } from '@chipi-pay/chipi-sdk';



// Note: In React Native, we'll need to use a different approach for Chipi SDK
// This is a placeholder structure that would work with the Chipi SDK pattern
interface ChipiCallParams {
    encryptKey: string;
    wallet: {
        publicKey: string;
        encryptedPrivateKey: string;
    };
    contractAddress: string;
    entrypoint: string;
    calldata: any[];
}

class ContractService {
    private provider: RpcProvider;
    private contractAddress: string;
    private contractAbi: any;

    constructor() {
        // Initialize provider for Sepolia testnet
        this.provider = new RpcProvider({
            nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
        });
        this.contractAddress = getContractAddress('sepolia');
        this.contractAbi = getContractAbi();
    }

    // Get contract instance for read operations
    private getContract(): Contract {
        return new Contract(this.contractAbi, this.contractAddress, this.provider);
    }

    // Execute contract call using Chipi SDK pattern
    private async executeContractCall(
        entrypoint: string,
        calldata: any[],
        walletPin: string
    ): Promise<string> {
        try {
            const walletData = await walletService.getWalletData();
            if (!walletData) {
                throw new Error('No wallet data available');
            }

            const chipiParams: ChipiCallParams = {
                encryptKey: walletPin,
                wallet: {
                    publicKey: walletData.publicKey,
                    encryptedPrivateKey: walletData.encryptedPrivateKey,
                },
                contractAddress: this.contractAddress,
                entrypoint,
                calldata,
            };

            // TODO: implement Chipi SDK call
            // const result = await chipiSDK.callContract(chipiParams);

            // For now, return a mock transaction hash
            console.log('Contract call params:', chipiParams);
            return `0x${Date.now().toString(16)}`;
        } catch (error) {
            console.error('Error executing contract call:', error);
            throw error;
        }
    }

    // Read operations
    async getUserProfile(userAddress: string): Promise<UserProfile | null> {
        try {
            const contract = this.getContract();
            const result = await contract.call('get_user_profile', [userAddress]);

            if (!result || !Array.isArray(result)) return null;

            return {
                address: result[0] as string,
                status: Number(result[1]),
                kyc_verified: Boolean(result[2]),
                policies_count: Number(result[3]),
                funder_stake: BigInt(result[4]?.toString() || '0'),
                accrued_yield: BigInt(result[5]?.toString() || '0'),
                last_yield_claimed: BigInt(result[6]?.toString() || '0'),
            };
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    async getPolicy(policyId: bigint): Promise<ContractPolicy | null> {
        try {
            const contract = this.getContract();
            const result = await contract.call('get_policy', [policyId.toString()]);

            if (!result || !Array.isArray(result)) return null;

            return {
                id: BigInt(result[0]?.toString() || '0'),
                creator: result[1] as string,
                metadata: {
                    coverage_amount: BigInt(result[2][0]?.toString() || '0'),
                    premium_amount: BigInt(result[2][1]?.toString() || '0'),
                    payout_amount: BigInt(result[2][2]?.toString() || '0'),
                    term_days: Number(result[2][3]),
                    trigger_description: result[2][4] as string,
                    details: result[2][5] as string,
                },
                status: Number(result[3]),
                creation_time: BigInt(result[4]?.toString() || '0'),
                approval_time: BigInt(result[5]?.toString() || '0'),
            };
        } catch (error) {
            console.error('Error getting policy:', error);
            return null;
        }
    }

    async listPolicies(status: PolicyStatus): Promise<ContractPolicy[]> {
        try {
            const contract = this.getContract();
            const result = await contract.call('list_policies', [status]);

            if (!result || !Array.isArray(result)) return [];

            return result.map((policyData: any) => ({
                id: BigInt(policyData[0]?.toString() || '0'),
                creator: policyData[1] as string,
                metadata: {
                    coverage_amount: BigInt(policyData[2][0]?.toString() || '0'),
                    premium_amount: BigInt(policyData[2][1]?.toString() || '0'),
                    payout_amount: BigInt(policyData[2][2]?.toString() || '0'),
                    term_days: Number(policyData[2][3]),
                    trigger_description: policyData[2][4] as string,
                    details: policyData[2][5] as string,
                },
                status: Number(policyData[3]),
                creation_time: BigInt(policyData[4]?.toString() || '0'),
                approval_time: BigInt(policyData[5]?.toString() || '0'),
            }));
        } catch (error) {
            console.error('Error listing policies:', error);
            return [];
        }
    }

    async getUserPolicies(userAddress: string): Promise<UserPolicy[]> {
        try {
            const contract = this.getContract();
            const result = await contract.call('get_user_policies', [userAddress]);

            if (!result || !Array.isArray(result)) return [];

            return result.map((policyData: any) => ({
                policy_id: BigInt(policyData[0]?.toString() || '0'),
                user: policyData[1] as string,
                purchase_time: BigInt(policyData[2]?.toString() || '0'),
                expiry_time: BigInt(policyData[3]?.toString() || '0'),
                is_active: Boolean(policyData[4]),
            }));
        } catch (error) {
            console.error('Error getting user policies:', error);
            return [];
        }
    }

    async getUserClaims(userAddress: string): Promise<ContractClaim[]> {
        try {
            const contract = this.getContract();
            const result = await contract.call('get_user_claims', [userAddress]);

            if (!result || !Array.isArray(result)) return [];

            return result.map((claimData: any) => ({
                id: BigInt(claimData[0]?.toString() || '0'),
                policy_id: BigInt(claimData[1]?.toString() || '0'),
                claimant: claimData[2] as string,
                evidence_hash: claimData[3] as string,
                status: Number(claimData[4]),
                submission_time: BigInt(claimData[5]?.toString() || '0'),
                processing_time: BigInt(claimData[6]?.toString() || '0'),
            }));
        } catch (error) {
            console.error('Error getting user claims:', error);
            return [];
        }
    }

    // Write operations using Chipi SDK pattern
    async registerUser(walletPin: string): Promise<boolean> {
        try {
            const txHash = await this.executeContractCall('register_user', [], walletPin);
            return !!txHash;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    async buyPolicy(policyId: bigint, walletPin: string): Promise<boolean> {
        try {
            const txHash = await this.executeContractCall(
                'buy_policy',
                [policyId.toString()],
                walletPin
            );
            return !!txHash;
        } catch (error) {
            console.error('Error buying policy:', error);
            throw error;
        }
    }

    async submitClaim(policyId: bigint, evidenceHash: string, walletPin: string): Promise<bigint> {
        try {
            const txHash = await this.executeContractCall(
                'submit_claim',
                [policyId.toString(), evidenceHash],
                walletPin
            );

            // TODO: complete implementation of claim submission
            return BigInt(Date.now());
        } catch (error) {
            console.error('Error submitting claim:', error);
            throw error;
        }
    }

    async cancelAutoRenewal(policyId: bigint, walletPin: string): Promise<void> {
        try {
            await this.executeContractCall(
                'cancel_auto_renewal',
                [policyId.toString()],
                walletPin
            );
        } catch (error) {
            console.error('Error canceling auto renewal:', error);
            throw error;
        }
    }
}

export const contractService = new ContractService(); 