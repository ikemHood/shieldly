import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PolicyCard } from '../../components/PolicyCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';
import { PolicyDisplayData, UserPolicyDisplayData } from '../../types/contracts';
import { usePolicy } from '../../hooks/usePolicy';
import { userPolicyToDisplay } from '../../utils/contractHelpers';

type PolicyStatus = 'active' | 'pending' | 'expired';

export const MyPoliciesScreen: React.FC = () => {
    const { actions, canBuyPolicy, isBuyingPolicy, data, isLoading } = usePolicy();
    const [selectedStatus, setSelectedStatus] = useState<PolicyStatus | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    // Convert user policies to display format
    const userPoliciesDisplay = data.userPolicies.map(userPolicy => {
        const policy = data.availablePolicies.find(p => p.id === userPolicy.policy_id);
        return userPolicyToDisplay(userPolicy, policy);
    });

    // Extract policies for filtering (only those with policy data)
    const policies: PolicyDisplayData[] = userPoliciesDisplay
        .filter(up => up.policy)
        .map(up => up.policy!);

    const statusFilters = [
        { id: 'all' as const, name: 'All', count: policies.length },
        { id: 'active' as const, name: 'Active', count: policies.filter(p => p.status === 'active').length },
        { id: 'pending' as const, name: 'Pending', count: policies.filter(p => p.status === 'pending').length },
        { id: 'expired' as const, name: 'Expired', count: policies.filter(p => p.status === 'expired').length },
    ];

    const filteredPolicies = selectedStatus === 'all'
        ? policies
        : policies.filter(policy => policy.status === selectedStatus);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await actions.refreshData();
            showToast.success('Policies updated');
        } catch (error) {
            console.error('Refresh error:', error);
            showToast.error('Failed to refresh policies');
        } finally {
            setRefreshing(false);
        }
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

    const handleRenewPolicy = (policy: PolicyDisplayData) => {
        showToast.comingSoon(`Renew ${policy.title}`);
    };

    const handleMakeClaim = (policy: PolicyDisplayData) => {
        showToast.comingSoon(`Make claim for ${policy.title}`);
    };

    const handleBrowsePolicies = () => {
        showToast.comingSoon('Browse policy catalog');
    };

    const renderPolicyActions = (policy: PolicyDisplayData) => {
        return (
            <View style={styles.policyActions}>
                {policy.status === 'active' && (
                    <>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.claimButton]}
                            onPress={() => handleMakeClaim(policy)}
                        >
                            <Ionicons name="document-text" size={16} color="white" />
                            <Text style={styles.actionButtonText}>Make Claim</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.renewButton]}
                            onPress={() => handleRenewPolicy(policy)}
                        >
                            <Ionicons name="refresh" size={16} color={AppTheme.primaryBlue} />
                            <Text style={[styles.actionButtonText, { color: AppTheme.primaryBlue }]}>Renew</Text>
                        </TouchableOpacity>
                    </>
                )}
                {policy.status === 'expired' && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.renewButton]}
                        onPress={() => handleRenewPolicy(policy)}
                    >
                        <Ionicons name="refresh" size={16} color={AppTheme.primaryBlue} />
                        <Text style={[styles.actionButtonText, { color: AppTheme.primaryBlue }]}>Renew Policy</Text>
                    </TouchableOpacity>
                )}
                {policy.status === 'pending' && (
                    <View style={styles.pendingInfo}>
                        <Ionicons name="time" size={16} color={AppTheme.warningYellow} />
                        <Text style={styles.pendingText}>Awaiting approval</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderEmptyState = () => {
        const isFiltered = selectedStatus !== 'all';

        return (
            <View style={styles.emptyState}>
                <Ionicons
                    name={isFiltered ? "filter" : "shield-outline"}
                    size={48}
                    color={AppTheme.textMedium}
                />
                <Text style={styles.emptyStateText}>
                    {isFiltered ? `No ${selectedStatus} policies` : 'No policies yet'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                    {isFiltered
                        ? `You don't have any ${selectedStatus} policies at the moment.`
                        : 'Start protecting what matters most to you by browsing our policy catalog.'
                    }
                </Text>
                {!isFiltered && (
                    <PrimaryButton
                        title="Browse Policies"
                        onPress={handleBrowsePolicies}
                        style={styles.browseButton}
                    />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>My Policies</Text>
                <Text style={styles.subtitle}>Manage your insurance coverage</Text>
            </View>

            {/* Status Filters */}
            <View style={styles.filtersSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                    {statusFilters.map((filter) => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                selectedStatus === filter.id && styles.selectedFilterChip
                            ]}
                            onPress={() => setSelectedStatus(filter.id)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedStatus === filter.id && styles.selectedFilterChipText
                            ]}>
                                {filter.name} ({filter.count})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Policies List */}
            <ScrollView
                style={styles.policiesSection}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[AppTheme.primaryBlue]}
                    />
                }
            >
                {filteredPolicies.length > 0 ? (
                    <>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsText}>
                                {filteredPolicies.length} {filteredPolicies.length === 1 ? 'policy' : 'policies'}
                            </Text>
                        </View>

                        {filteredPolicies.map((policy) => (
                            <View key={policy.id} style={styles.policyContainer}>
                                <PolicyCard
                                    policy={policy}
                                    onPurchase={handlePolicyPurchase}
                                    canPurchase={canBuyPolicy(BigInt(policy.id))}
                                    isPurchasing={isBuyingPolicy}
                                />
                                {renderPolicyActions(policy)}
                            </View>
                        ))}
                    </>
                ) : (
                    renderEmptyState()
                )}
            </ScrollView>

            {/* Quick Actions */}
            {policies.length > 0 && (
                <View style={styles.quickActions}>
                    <PrimaryButton
                        title="Browse More Policies"
                        onPress={handleBrowsePolicies}
                        variant="secondary"
                        style={styles.quickActionButton}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundLight,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
    },
    filtersSection: {
        marginTop: 16,
        marginBottom: 16,
    },
    filtersScroll: {
        paddingHorizontal: 16,
    },
    filterChip: {
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: AppTheme.divider,
    },
    selectedFilterChip: {
        backgroundColor: AppTheme.primaryBlue,
        borderColor: AppTheme.primaryBlue,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.textDark,
    },
    selectedFilterChipText: {
        color: 'white',
    },
    policiesSection: {
        flex: 1,
    },
    resultsHeader: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    resultsText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    policyContainer: {
        marginBottom: 8,
    },
    policyActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    claimButton: {
        backgroundColor: AppTheme.primaryBlue,
    },
    renewButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: AppTheme.primaryBlue,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'white',
    },
    pendingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pendingText: {
        fontSize: 14,
        color: AppTheme.warningYellow,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    browseButton: {
        paddingHorizontal: 32,
    },
    quickActions: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: AppTheme.divider,
        backgroundColor: AppTheme.backgroundWhite,
    },
    quickActionButton: {
        width: '100%',
    },
}); 