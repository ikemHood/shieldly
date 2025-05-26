import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from '../../components/TextInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PolicyCard } from '../../components/PolicyCard';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';
import { PolicyDisplayData } from '../../types/contracts';
import { usePolicy } from '../../hooks/usePolicy';
import { contractPolicyToDisplay } from '../../utils/contractHelpers';

type PolicyCategory = 'all' | 'crop' | 'livestock' | 'business' | 'health';

interface PolicyFilter {
    category: PolicyCategory;
    minCoverage?: number;
    maxPremium?: number;
}

export const PolicyCatalogScreen: React.FC = () => {
    const { actions, canBuyPolicy, isBuyingPolicy, data, isLoading } = usePolicy();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<PolicyCategory>('all');
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyDisplayData | null>(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);

    // Convert contract policies to display format
    const availablePolicies = data.availablePolicies.map(policy =>
        contractPolicyToDisplay(policy)
    );

    const [filteredPolicies, setFilteredPolicies] = useState<PolicyDisplayData[]>(availablePolicies);

    // Update filtered policies when available policies change
    React.useEffect(() => {
        setFilteredPolicies(availablePolicies);
    }, [availablePolicies]);

    const categories = [
        { id: 'all' as PolicyCategory, name: 'All', icon: 'grid', count: availablePolicies.length },
        { id: 'crop' as PolicyCategory, name: 'Crop', icon: 'leaf', count: availablePolicies.filter((p: PolicyDisplayData) => p.title.toLowerCase().includes('crop')).length },
        { id: 'livestock' as PolicyCategory, name: 'Livestock', icon: 'paw', count: availablePolicies.filter((p: PolicyDisplayData) => p.title.toLowerCase().includes('livestock')).length },
        { id: 'business' as PolicyCategory, name: 'Business', icon: 'business', count: availablePolicies.filter((p: PolicyDisplayData) => p.title.toLowerCase().includes('business')).length },
        { id: 'health' as PolicyCategory, name: 'Health', icon: 'medical', count: availablePolicies.filter((p: PolicyDisplayData) => p.title.toLowerCase().includes('health')).length },
    ];

    const handleSearch = () => {
        let filtered = availablePolicies;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter((policy: PolicyDisplayData) => policy.title.toLowerCase().includes(selectedCategory));
        }

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter((policy: PolicyDisplayData) =>
                policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (policy.description && policy.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredPolicies(filtered);
    };

    const handleCategorySelect = (category: PolicyCategory) => {
        setSelectedCategory(category);
        // Auto-trigger search when category changes
        setTimeout(() => handleSearch(), 100);
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

    const handlePolicyPress = (policy: PolicyDisplayData) => {
        setSelectedPolicy(policy);
        setShowPolicyModal(true);
    };

    const handlePurchasePolicy = (policy: PolicyDisplayData) => {
        setShowPolicyModal(false);
        showToast.comingSoon(`Purchase ${policy.title}`);
    };

    const renderPolicyModal = () => {
        if (!selectedPolicy) return null;

        return (
            <Modal
                visible={showPolicyModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPolicyModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedPolicy.title}</Text>
                            <TouchableOpacity
                                onPress={() => setShowPolicyModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={AppTheme.textDark} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.policyHeader}>
                                <View style={styles.policyTypeIcon}>
                                    <Ionicons
                                        name={selectedPolicy.title.toLowerCase().includes('crop') ? 'leaf' :
                                            selectedPolicy.title.toLowerCase().includes('livestock') ? 'paw' :
                                                selectedPolicy.title.toLowerCase().includes('business') ? 'business' : 'medical'}
                                        size={32}
                                        color={AppTheme.primaryBlue}
                                    />
                                </View>
                                <Text style={styles.policyDescription}>{selectedPolicy.description}</Text>
                            </View>

                            <View style={styles.policyDetails}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Premium</Text>
                                    <Text style={styles.detailValue}>${selectedPolicy.premium}/month</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Coverage</Text>
                                    <Text style={styles.detailValue}>${selectedPolicy.coverage}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Duration</Text>
                                    <Text style={styles.detailValue}>{selectedPolicy.termDays} days</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Type</Text>
                                    <Text style={styles.detailValue}>{selectedPolicy.title.split(' ').slice(-1)[0]}</Text>
                                </View>
                            </View>

                            <View style={styles.featuresSection}>
                                <Text style={styles.featuresTitle}>What's Covered</Text>
                                <View style={styles.featuresList}>
                                    <View style={styles.featureItem}>
                                        <Ionicons name="checkmark-circle" size={20} color={AppTheme.successGreen} />
                                        <Text style={styles.featureText}>24/7 claim support</Text>
                                    </View>
                                    <View style={styles.featureItem}>
                                        <Ionicons name="checkmark-circle" size={20} color={AppTheme.successGreen} />
                                        <Text style={styles.featureText}>Fast claim processing</Text>
                                    </View>
                                    <View style={styles.featureItem}>
                                        <Ionicons name="checkmark-circle" size={20} color={AppTheme.successGreen} />
                                        <Text style={styles.featureText}>Blockchain verification</Text>
                                    </View>
                                    <View style={styles.featureItem}>
                                        <Ionicons name="checkmark-circle" size={20} color={AppTheme.successGreen} />
                                        <Text style={styles.featureText}>No hidden fees</Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <PrimaryButton
                                title={`Purchase for $${selectedPolicy.premium}/month`}
                                onPress={() => handlePurchasePolicy(selectedPolicy)}
                                style={styles.purchaseButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Policy Catalog</Text>
                <Text style={styles.subtitle}>Find the perfect insurance for your needs</Text>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <TextInput
                    placeholder="Search policies..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <PrimaryButton
                    title="Search"
                    onPress={handleSearch}
                    style={styles.searchButton}
                />
            </View>

            {/* Categories */}
            <View style={styles.categoriesSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryChip,
                                selectedCategory === category.id && styles.selectedCategoryChip
                            ]}
                            onPress={() => handleCategorySelect(category.id)}
                        >
                            <Ionicons
                                name={category.icon as any}
                                size={16}
                                color={selectedCategory === category.id ? 'white' : AppTheme.primaryBlue}
                            />
                            <Text style={[
                                styles.categoryChipText,
                                selectedCategory === category.id && styles.selectedCategoryChipText
                            ]}>
                                {category.name} ({category.count})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Policies List */}
            <ScrollView style={styles.policiesSection} showsVerticalScrollIndicator={false}>
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsText}>
                        {filteredPolicies.length} policies found
                    </Text>
                </View>

                {filteredPolicies.map((policy) => (
                    <PolicyCard
                        key={policy.id}
                        policy={policy}
                        onPurchase={handlePolicyPurchase}
                        canPurchase={canBuyPolicy(BigInt(policy.id))}
                        isPurchasing={isBuyingPolicy}
                    />
                ))}

                {filteredPolicies.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search" size={48} color={AppTheme.textMedium} />
                        <Text style={styles.emptyStateText}>No policies found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Try adjusting your search or category filter
                        </Text>
                    </View>
                )}
            </ScrollView>

            {renderPolicyModal()}
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
    searchSection: {
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 16,
    },
    searchButton: {
        paddingHorizontal: 32,
    },
    categoriesSection: {
        marginBottom: 16,
    },
    categoriesScroll: {
        paddingHorizontal: 16,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: AppTheme.primaryBlue,
        gap: 6,
    },
    selectedCategoryChip: {
        backgroundColor: AppTheme.primaryBlue,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.primaryBlue,
    },
    selectedCategoryChipText: {
        color: 'white',
    },
    policiesSection: {
        flex: 1,
        paddingHorizontal: 16,
    },
    resultsHeader: {
        marginBottom: 16,
    },
    resultsText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: AppTheme.backgroundWhite,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: AppTheme.divider,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        flex: 1,
        padding: 20,
    },
    policyHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    policyTypeIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: AppTheme.primaryBlue + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    policyDescription: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
    },
    policyDetails: {
        backgroundColor: AppTheme.backgroundLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: AppTheme.textMedium,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    featuresSection: {
        marginBottom: 24,
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginBottom: 16,
    },
    featuresList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 16,
        color: AppTheme.textDark,
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: AppTheme.divider,
    },
    purchaseButton: {
        width: '100%',
    },
}); 