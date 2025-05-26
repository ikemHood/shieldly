import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/MainStackNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { WalletBalanceCard } from '../../components/WalletBalanceCard';
import { PolicyCard } from '../../components/PolicyCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';
import { PolicyDisplayData } from '../../types/contracts';
import { usePolicy } from '../../hooks/usePolicy';
import { contractPolicyToDisplay, userPolicyToDisplay } from '../../utils/contractHelpers';

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MainTabs'>;

export const HomeScreen: React.FC = () => {
    const { state } = useAuth();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const {
        actions,
        canBuyPolicy,
        isBuyingPolicy,
        data,
        isLoading
    } = usePolicy();
    const [refreshing, setRefreshing] = useState(false);
    const [walletBalance, setWalletBalance] = useState('1,234.56');
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);

    // Convert contract data to display format and get recent policies
    const availablePoliciesDisplay = data.availablePolicies.map(policy =>
        contractPolicyToDisplay(policy)
    );

    const userPoliciesDisplay = data.userPolicies.map(userPolicy => {
        const policy = data.availablePolicies.find(p => p.id === userPolicy.policy_id);
        return userPolicyToDisplay(userPolicy, policy);
    });

    // Get recent policies - prioritize user policies but convert to PolicyDisplayData
    const recentPolicies: PolicyDisplayData[] = [];

    // Add user policies first (convert from UserPolicyDisplayData to PolicyDisplayData)
    userPoliciesDisplay.slice(0, 2).forEach(userPolicy => {
        if (userPolicy.policy) {
            recentPolicies.push(userPolicy.policy);
        }
    });

    // Fill remaining slots with available policies if needed
    if (recentPolicies.length < 2) {
        const remainingSlots = 2 - recentPolicies.length;
        const additionalPolicies = availablePoliciesDisplay
            .filter(policy => !recentPolicies.some(rp => rp.id === policy.id))
            .slice(0, remainingSlots);
        recentPolicies.push(...additionalPolicies);
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await actions.refreshData();
            showToast.success('Data refreshed successfully');
        } catch (error) {
            console.error('Refresh error:', error);
            showToast.error('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    }, [actions]);

    const refreshWalletBalance = useCallback(async () => {
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
    }, []);

    const handleQuickAction = (action: string) => {
        // TODO: Implement navigation to respective screens
        showToast.comingSoon(action);
    };

    const handlePolicyPurchase = async (policyId: bigint, pin: string) => {
        try {
            const success = await actions.buyPolicy(policyId, pin);
            if (success) {
                showToast.success('Policy purchased successfully!');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            showToast.error('Failed to purchase policy');
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const userName = state.user?.name?.split(' ')[0] || 'User';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[AppTheme.primaryBlue]}
                    tintColor={AppTheme.primaryBlue}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* Header with Greeting */}
            <View style={styles.header}>
                <View style={styles.greetingContainer}>
                    <Text style={styles.greeting}>{getGreeting()},</Text>
                    <Text style={styles.userName}>{userName}!</Text>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Ionicons name="notifications-outline" size={24} color={AppTheme.textDark} />
                    <View style={styles.notificationBadge}>
                        <Text style={styles.notificationCount}>3</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Wallet Balance Card */}
            <WalletBalanceCard
                balance={walletBalance}
                isLoading={isBalanceLoading}
                onRefresh={refreshWalletBalance}
                onAddMoney={() => showToast.info('Navigate to wallet deposit')}
            />

            {/* Quick Actions */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleQuickAction('Insure')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#10B981' + '20' }]}>
                            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.actionText}>Insure</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleQuickAction('Claim')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                            <Ionicons name="document-text" size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.actionText}>Claim</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleQuickAction('Withdraw')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: AppTheme.primaryBlue + '20' }]}>
                            <Ionicons name="arrow-up" size={24} color={AppTheme.primaryBlue} />
                        </View>
                        <Text style={styles.actionText}>Withdraw</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleQuickAction('Deposit')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                            <Ionicons name="arrow-down" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={styles.actionText}>Deposit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Policies */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Policies</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                {recentPolicies.length > 0 ? (
                    recentPolicies.map((policy) => (
                        <PolicyCard
                            key={policy.id}
                            policy={policy}
                            onPurchase={handlePolicyPurchase}
                            canPurchase={canBuyPolicy(BigInt(policy.id))}
                            isPurchasing={isBuyingPolicy}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="shield-outline" size={48} color={AppTheme.textMedium} />
                        <Text style={styles.emptyStateText}>No policies yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Get started by exploring our insurance options
                        </Text>
                        <PrimaryButton
                            title="Browse Policies"
                            onPress={() => handleQuickAction('Browse Policies')}
                            style={styles.browseButton}
                        />
                    </View>
                )}
            </View>

            {/* Setup Completion */}
            <View style={styles.section}>
                <View style={styles.setupCard}>
                    <View style={styles.setupHeader}>
                        <Ionicons name="checkmark-circle" size={24} color={AppTheme.successGreen} />
                        <Text style={styles.setupTitle}>Setup Complete!</Text>
                    </View>
                    <Text style={styles.setupDescription}>
                        Your account is fully set up and ready to use. You can now purchase policies and manage claims.
                    </Text>
                    <View style={styles.setupProgress}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '100%' }]} />
                        </View>
                        <Text style={styles.progressText}>100% Complete</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundLight,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 32,
        paddingBottom: 8,
    },
    greetingContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        color: AppTheme.textMedium,
    },
    userName: {
        marginLeft: 8,
        fontSize: 18,
        fontWeight: 'bold',
        color: AppTheme.textDark,
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: AppTheme.errorRed,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationCount: {
        fontSize: 10,
        color: 'white',
        fontWeight: 'bold',
    },
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
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
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
    },
    actionButton: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        color: AppTheme.textDark,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
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
        marginBottom: 24,
    },
    browseButton: {
        paddingHorizontal: 32,
    },
    setupCard: {
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    setupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    setupTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    setupDescription: {
        fontSize: 14,
        color: AppTheme.textMedium,
        lineHeight: 20,
        marginBottom: 16,
    },
    setupProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: AppTheme.divider,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: AppTheme.successGreen,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: AppTheme.successGreen,
        fontWeight: '600',
    },
}); 