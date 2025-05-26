import {
    Account,
    CairoCustomEnum,
    CairoOption,
    CairoOptionVariant,
    CallData,
    ec,
    hash,
    num,
    RpcProvider,
    stark,
} from "starknet";
import CryptoJS from "crypto-js";
import env from '../env';

// Types
export interface WalletData {
    publicKey: string;
    encryptedPrivateKey: string;
}

export interface CreateWalletResponse {
    success: boolean;
    wallet: WalletData;
    txHash: string;
}

export interface CreateWalletParams {
    encryptKey: string;
    apiPublicKey: string;
    bearerToken: string;
    nodeUrl: string;
}

// Encryption utilities
export const encryptPrivateKey = (
    privateKey: string,
    password: string,
): string => {
    if (!privateKey || !password) {
        throw new Error("Private key and password are required");
    }

    return CryptoJS.AES.encrypt(privateKey, password).toString();
};

export const decryptPrivateKey = (
    encryptedPrivateKey: string,
    password: string,
): string | null => {
    if (!encryptedPrivateKey || !password) {
        console.error("Encrypted private key and password are required");
        return null;
    }

    try {
        const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        // Check if the decrypted string is empty
        if (!decrypted) {
            return null;
        }

        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};

// Backend URL for Chipi services
const CHIPI_BACKEND_URL = "https://chipi-back-production.up.railway.app";

export const createArgentWallet = async (
    params: CreateWalletParams
): Promise<CreateWalletResponse> => {
    console.log("create wallet Params: ", params);
    try {
        const { encryptKey, apiPublicKey, bearerToken, nodeUrl } = params;

        const provider = new RpcProvider({ nodeUrl: nodeUrl });
        // Generating the private key with Stark Curve
        const privateKeyAX = stark.randomAddress();
        const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);

        // Using Argent X Account v0.4.0 class hash
        const accountClassHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";

        // Calculate future address of the ArgentX account
        const axSigner = new CairoCustomEnum({
            Starknet: { pubkey: starkKeyPubAX },
        });
        // Set the dApp Guardian address
        const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);

        const AXConstructorCallData = CallData.compile({
            owner: axSigner,
            guardian: axGuardian,
        });

        const publicKey = hash.calculateContractAddressFromHash(
            starkKeyPubAX,
            accountClassHash,
            AXConstructorCallData,
            0
        );
        console.log("Contract address: ", publicKey);

        // Initiating Account
        const account = new Account(provider, publicKey, privateKeyAX);
        console.log("Account created");

        // Backend Call API to create the wallet
        console.log("apiPublicKey", apiPublicKey);
        const typeDataResponse = await fetch(`${CHIPI_BACKEND_URL}/chipi-wallets/prepare-creation`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`,
                'x-api-key': apiPublicKey,
            },
            body: JSON.stringify({
                publicKey,
            }),
        });

        if (!typeDataResponse.ok) {
            throw new Error(`Failed to prepare wallet creation: ${typeDataResponse.statusText}`);
        }

        const { typeData, accountClassHash: accountClassHashResponse } = await typeDataResponse.json();

        console.log("Type data: ", typeData);
        // Sign the message
        const userSignature = await account.signMessage(typeData);

        console.log("User signature: ", userSignature);
        const deploymentData = {
            class_hash: accountClassHashResponse,
            salt: starkKeyPubAX,
            unique: `${num.toHex(0)}`,
            calldata: AXConstructorCallData.map((value) => num.toHex(value)),
        };

        console.log("Deployment data: ", deploymentData);
        const encryptedPrivateKey = encryptPrivateKey(privateKeyAX, encryptKey);
        console.log("Encrypted private key created");

        // Call API to save wallet in dashboard
        const executeTransactionResponse = await fetch(`${CHIPI_BACKEND_URL}/chipi-wallets`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`,
                'x-api-key': apiPublicKey,
            },
            body: JSON.stringify({
                apiPublicKey,
                publicKey,
                userSignature: {
                    r: (userSignature as any).r.toString(),
                    s: (userSignature as any).s.toString(),
                    recovery: (userSignature as any).recovery
                },
                typeData,
                encryptedPrivateKey,
                deploymentData: {
                    ...deploymentData,
                    salt: `${deploymentData.salt}`,
                    calldata: deploymentData.calldata.map(data => `${data}`),
                }
            }),
        });

        if (!executeTransactionResponse.ok) {
            throw new Error(`Failed to execute wallet creation: ${executeTransactionResponse.statusText}`);
        }

        const executeTransaction = await executeTransactionResponse.json();
        console.log("Execute transaction: ", executeTransaction);

        if (executeTransaction.success) {
            return {
                success: true,
                txHash: executeTransaction.txHash,
                wallet: {
                    publicKey: executeTransaction.walletPublicKey,
                    encryptedPrivateKey: encryptedPrivateKey,
                } as WalletData,
            };
        } else {
            return {
                success: false,
                txHash: "",
                wallet: {
                    publicKey: "",
                    encryptedPrivateKey: "",
                } as WalletData,
            };
        }
    } catch (error: unknown) {
        console.error("Error detallado:", error);

        if (error instanceof Error && error.message.includes("SSL")) {
            throw new Error(
                "Error de conexión SSL. Intenta usando NODE_TLS_REJECT_UNAUTHORIZED=0 o verifica la URL del RPC"
            );
        }

        throw new Error(
            `Error creating Argent wallet: ${error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
};

// Simplified wallet creation for our use case
export const createWalletForUser = async (walletPin: string): Promise<WalletData> => {
    try {
        // For development, we'll create a simpler wallet without the full Chipi backend integration
        // This can be replaced with the full Chipi integration when the backend is properly configured

        const nodeUrl = env.nodeUrl || "https://starknet-mainnet.public.blastapi.io/rpc/v0_7";

        // Generate a simple wallet locally for now
        const provider = new RpcProvider({ nodeUrl });
        const privateKey = stark.randomAddress();
        const publicKey = ec.starkCurve.getStarkKey(privateKey);

        // Encrypt the private key with the wallet PIN
        const encryptedPrivateKey = encryptPrivateKey(privateKey, walletPin);

        return {
            publicKey,
            encryptedPrivateKey,
        };
    } catch (error) {
        console.error("Error creating wallet:", error);
        throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}; 