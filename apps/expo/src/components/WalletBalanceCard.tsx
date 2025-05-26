import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../constants/theme';

interface WalletBalanceCardProps {
    balance: string;
    currency?: string;
    isLoading?: boolean;
    onRefresh?: () => void;
    onAddMoney?: () => void;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
    balance,
    currency = 'USDC',
    isLoading = false,
    onRefresh,
    onAddMoney,
}) => {
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);

    const toggleBalanceVisibility = () => {
        setIsBalanceVisible(!isBalanceVisible);
    };

    const formatBalance = (amount: string) => {
        if (!isBalanceVisible) return '••••••';
        return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    };

    return (
        <LinearGradient
            colors={['#6B47ED', '#8055ED', '#9061F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={styles.title}>MY SAVINGS</Text>
                <TouchableOpacity onPress={toggleBalanceVisibility} style={styles.visibilityButton}>
                    <Ionicons
                        name={isBalanceVisible ? 'eye' : 'eye-off'}
                        size={18}
                        color="white"
                    />
                </TouchableOpacity>
                {onAddMoney && (
                    <TouchableOpacity onPress={onAddMoney} style={styles.addButton}>
                        <Ionicons name="add" size={14} color={AppTheme.primaryBlue} />
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.balanceContainer}>
                <View style={styles.balanceRow}>
                    <Text style={styles.dollarSign}>$</Text>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : (
                        <Text style={styles.balance}>
                            {formatBalance(balance)}
                        </Text>
                    )}
                    <View style={styles.currencyBadge}>
                        <View style={styles.currencyIcon}>
                            <Text style={styles.currencyIconText}>$</Text>
                        </View>
                        <Text style={styles.currencyText}>{currency}</Text>
                        <Ionicons name="chevron-down" size={14} color="white" />
                    </View>
                </View>
            </View>

            {onRefresh && (
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={16} color="white" />
                </TouchableOpacity>
            )}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
    },
    visibilityButton: {
        padding: 4,
        marginRight: 8,
    },
    addButton: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        minWidth: 110,
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: AppTheme.primaryBlue,
    },
    balanceContainer: {
        alignItems: 'flex-start',
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        width: '100%',
    },
    dollarSign: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.7)',
        marginRight: 4,
    },
    balance: {
        fontSize: 42,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    loadingText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    currencyBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    currencyIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#14B8A6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencyIconText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    currencyText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    refreshButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
}); 