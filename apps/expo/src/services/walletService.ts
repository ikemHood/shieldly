import * as SecureStore from 'expo-secure-store';
import { apiService } from './api';

const STORAGE_KEYS = {
    WALLET_PUBLIC_KEY: 'wallet_public_key',
    WALLET_SECRET: 'wallet_secret',
} as const;

interface WalletInfo {
    publicKey: string;
    encryptedPrivateKey: string;
    address: string;
}

class WalletService {
    // Get the user's wallet info from API
    async getWalletInfo(): Promise<WalletInfo | null> {
        try {
            const response = await apiService.get<WalletInfo>('/user/me/wallet');
            return response;
        } catch (error) {
            console.error('Error getting wallet info from API:', error);
            // Fallback to local storage
            return this.getLocalWalletInfo();
        }
    }

    // Get wallet info from local storage (fallback)
    private async getLocalWalletInfo(): Promise<WalletInfo | null> {
        try {
            const [publicKey, encryptedPrivateKey] = await Promise.all([
                SecureStore.getItemAsync(STORAGE_KEYS.WALLET_PUBLIC_KEY),
                SecureStore.getItemAsync(STORAGE_KEYS.WALLET_SECRET),
            ]);

            if (publicKey && encryptedPrivateKey) {
                return {
                    publicKey,
                    encryptedPrivateKey,
                    address: publicKey, // Using publicKey as address for now
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting local wallet info:', error);
            return null;
        }
    }

    // Get the user's wallet address
    async getWalletAddress(): Promise<string | null> {
        try {
            const walletInfo = await this.getWalletInfo();
            return walletInfo?.address || walletInfo?.publicKey || null;
        } catch (error) {
            console.error('Error getting wallet address:', error);
            return null;
        }
    }

    // Check if user has a wallet
    async hasWallet(): Promise<boolean> {
        try {
            const walletInfo = await this.getWalletInfo();
            return !!walletInfo;
        } catch (error) {
            return false;
        }
    }

    // Get wallet secret (encrypted private key)
    async getWalletSecret(): Promise<string | null> {
        try {
            const walletInfo = await this.getWalletInfo();
            return walletInfo?.encryptedPrivateKey || null;
        } catch (error) {
            console.error('Error getting wallet secret:', error);
            return null;
        }
    }

    // Check if wallet is connected (has both public key and encrypted private key)
    async isWalletConnected(): Promise<boolean> {
        try {
            const walletInfo = await this.getWalletInfo();
            return !!(walletInfo?.publicKey && walletInfo?.encryptedPrivateKey);
        } catch (error) {
            return false;
        }
    }

    // Get wallet data for Chipi SDK
    async getWalletData(): Promise<{ publicKey: string; encryptedPrivateKey: string } | null> {
        try {
            const walletInfo = await this.getWalletInfo();
            if (walletInfo?.publicKey && walletInfo?.encryptedPrivateKey) {
                return {
                    publicKey: walletInfo.publicKey,
                    encryptedPrivateKey: walletInfo.encryptedPrivateKey,
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting wallet data:', error);
            return null;
        }
    }

    // Store wallet data locally (for caching)
    async storeWalletData(publicKey: string, encryptedPrivateKey: string): Promise<void> {
        try {
            await Promise.all([
                SecureStore.setItemAsync(STORAGE_KEYS.WALLET_PUBLIC_KEY, publicKey),
                SecureStore.setItemAsync(STORAGE_KEYS.WALLET_SECRET, encryptedPrivateKey),
            ]);
        } catch (error) {
            console.error('Error storing wallet data:', error);
        }
    }
}

export const walletService = new WalletService(); 