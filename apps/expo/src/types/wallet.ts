export interface Wallet {
    address: string;
    balance: number;
    currency: string;
    encryptedPrivateKey: string;
    publicKey: string;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    date: Date;
    hash?: string;
    from?: string;
    to?: string;
    description?: string;
    policyName?: string;
    claimId?: string;
}

export type TransactionType =
    | 'deposit'
    | 'withdrawal'
    | 'policy_purchase'
    | 'claim_payout'
    | 'transfer';

export type TransactionStatus =
    | 'pending'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface DepositRequest {
    amount: number;
    paymentMethod: PaymentMethod;
    currency: string;
}

export interface WithdrawalRequest {
    amount: number;
    destinationAddress: string;
    currency: string;
}

export type PaymentMethod =
    | 'credit_card'
    | 'bank_transfer'
    | 'mobile_money'
    | 'crypto';

export interface PaymentMethodInfo {
    id: string;
    type: PaymentMethod;
    name: string;
    isDefault: boolean;
    details: Record<string, any>;
}

export interface WalletBalance {
    total: number;
    available: number;
    pending: number;
    currency: string;
}

// Sample transaction data
export const sampleTransactions: Transaction[] = [
    {
        id: 'TXN-001',
        type: 'deposit',
        amount: 100.0,
        currency: 'USDC',
        status: 'completed',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        description: 'Deposit via Credit Card',
    },
    {
        id: 'TXN-002',
        type: 'policy_purchase',
        amount: 10.0,
        currency: 'USDC',
        status: 'completed',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        policyName: 'Crop Insurance - Drought Protection',
        description: 'Policy Premium Payment',
    },
    {
        id: 'TXN-003',
        type: 'claim_payout',
        amount: 80.0,
        currency: 'USDC',
        status: 'completed',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        claimId: 'CLM-001',
        description: 'Insurance Claim Payout',
    },
]; 