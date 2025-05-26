import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WalletBalanceCard } from '../../components/WalletBalanceCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdraw' | 'premium' | 'claim';
    amount: string;
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
}

// Mock transaction data
const mockTransactions: Transaction[] = [
    {
        id: '1',
        type: 'deposit',
        amount: '100.00',
        description: 'Mobile Money Deposit',
        date: '2024-01-15',
        status: 'completed',
    },
    {
        id: '2',
        type: 'premium',
        amount: '25.00',
        description: 'Crop Insurance Premium',
        date: '2024-01-14',
        status: 'completed',
    },
    {
        id: '3',
        type: 'claim',
        amount: '500.00',
        description: 'Weather Damage Claim',
        date: '2024-01-10',
        status: 'pending',
    },
];

export const WalletScreen: React.FC = () => {
    const [walletBalance, setWalletBalance] = useState('1,234.56');
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

    const refreshWalletBalance = async () => {
        setIsBalanceLoading(true);
        try {
            // TODO: Implement actual wallet balance refresh
            await new Promise(resolve => setTimeout(resolve, 500));
            showToast.success('Wallet balance updated');
        } catch (error) {
            console.error('Wallet refresh error:', error);
            showToast.error('Failed to refresh wallet balance');
        } finally {
            setIsBalanceLoading(false);
        }
    };

    const handleDeposit = () => {
        showToast.comingSoon('Deposit');
    };

    const handleWithdraw = () => {
        showToast.comingSoon('Withdraw');
    };

    const handleQRCode = () => {
        showToast.comingSoon('QR Code generation');
    };

    const handleTransactionPress = (transaction: Transaction) => {
        showToast.info(`Transaction: ${transaction.description}`, 'Transaction Details');
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return 'arrow-down';
            case 'withdraw':
                return 'arrow-up';
            case 'premium':
                return 'shield';
            case 'claim':
                return 'document-text';
            default:
                return 'swap-horizontal';
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'deposit':
            case 'claim':
                return AppTheme.successGreen;
            case 'withdraw':
            case 'premium':
                return AppTheme.errorRed;
            default:
                return AppTheme.textMedium;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return AppTheme.successGreen;
            case 'pending':
                return AppTheme.warningYellow;
            case 'failed':
                return AppTheme.errorRed;
            default:
                return AppTheme.textMedium;
        }
    };

    const formatAmount = (amount: string, type: string) => {
        const prefix = type === 'deposit' || type === 'claim' ? '+' : '-';
        return `${prefix}$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Wallet</Text>
                <TouchableOpacity onPress={handleQRCode} style={styles.qrButton}>
                    <Ionicons name="qr-code" size={24} color={AppTheme.primaryBlue} />
                </TouchableOpacity>
            </View>

            {/* Wallet Balance Card */}
            <WalletBalanceCard
                balance={walletBalance}
                isLoading={isBalanceLoading}
                onRefresh={refreshWalletBalance}
            />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <PrimaryButton
                    title="Deposit"
                    onPress={handleDeposit}
                    style={styles.actionButton}
                />
                <PrimaryButton
                    title="Withdraw"
                    onPress={handleWithdraw}
                    variant="secondary"
                    style={styles.actionButton}
                />
            </View>

            {/* Transaction History */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.transactionList}>
                    {transactions.map((transaction) => (
                        <TouchableOpacity
                            key={transaction.id}
                            style={styles.transactionItem}
                            onPress={() => handleTransactionPress(transaction)}
                        >
                            <View style={styles.transactionLeft}>
                                <View style={[
                                    styles.transactionIcon,
                                    { backgroundColor: getTransactionColor(transaction.type) + '20' }
                                ]}>
                                    <Ionicons
                                        name={getTransactionIcon(transaction.type)}
                                        size={20}
                                        color={getTransactionColor(transaction.type)}
                                    />
                                </View>
                                <View style={styles.transactionDetails}>
                                    <Text style={styles.transactionDescription}>
                                        {transaction.description}
                                    </Text>
                                    <Text style={styles.transactionDate}>
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.transactionRight}>
                                <Text style={[
                                    styles.transactionAmount,
                                    { color: getTransactionColor(transaction.type) }
                                ]}>
                                    {formatAmount(transaction.amount, transaction.type)}
                                </Text>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(transaction.status) + '20' }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: getStatusColor(transaction.status) }
                                    ]}>
                                        {transaction.status}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {transactions.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={AppTheme.textMedium} />
                        <Text style={styles.emptyStateText}>No transactions yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Your transaction history will appear here
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.textDark,
    },
    qrButton: {
        padding: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
    },
    section: {
        marginTop: 32,
        paddingBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    seeAllText: {
        fontSize: 14,
        color: AppTheme.primaryBlue,
        fontWeight: '500',
    },
    transactionList: {
        paddingHorizontal: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.textDark,
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        color: AppTheme.textMedium,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 16,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: AppTheme.textMedium,
        textAlign: 'center',
    },
}); 