import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextInput } from '../../components/TextInput';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';

interface Claim {
    id: string;
    policyId: string;
    policyName: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    date: Date;
    description: string;
}

// Mock data
const mockProcessedClaims: Claim[] = [
    {
        id: 'CLM-001',
        policyId: '1',
        policyName: 'Crop Insurance - Drought Protection',
        amount: 80.0,
        status: 'approved',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        description: 'Crop damage due to insufficient rainfall',
    },
];

export const ClaimsScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');
    const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
    const [processedClaims, setProcessedClaims] = useState<Claim[]>(mockProcessedClaims);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [showNewClaimModal, setShowNewClaimModal] = useState(false);
    const [showClaimDetailsModal, setShowClaimDetailsModal] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [selectedPolicy, setSelectedPolicy] = useState('Crop Insurance - Drought Protection');
    const [claimAmount, setClaimAmount] = useState('');
    const [claimDescription, setClaimDescription] = useState('');

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
    };

    const handleSubmitClaim = async () => {
        if (!claimAmount.trim() || !claimDescription.trim()) {
            showToast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const newClaim: Claim = {
                id: `CLM-00${pendingClaims.length + 2}`,
                policyId: '1',
                policyName: selectedPolicy,
                amount: parseFloat(claimAmount),
                status: 'pending',
                date: new Date(),
                description: claimDescription,
            };

            setPendingClaims(prev => [newClaim, ...prev]);
            setClaimAmount('');
            setClaimDescription('');
            setShowNewClaimModal(false);
            showToast.success('Claim submitted successfully');
        } catch (error) {
            showToast.error('Failed to submit claim');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClaimPress = (claim: Claim) => {
        setSelectedClaim(claim);
        setShowClaimDetailsModal(true);
    };

    const formatDate = (date: Date) => {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return AppTheme.successGreen;
            case 'rejected':
                return AppTheme.errorRed;
            case 'pending':
                return AppTheme.warningYellow;
            default:
                return AppTheme.textMedium;
        }
    };

    const renderNewClaimModal = () => (
        <Modal
            visible={showNewClaimModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowNewClaimModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Submit New Claim</Text>
                        <TouchableOpacity
                            onPress={() => setShowNewClaimModal(false)}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color={AppTheme.textDark} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.inputLabel}>Select Policy</Text>
                        <View style={styles.dropdown}>
                            <Text style={styles.dropdownText}>{selectedPolicy}</Text>
                            <Ionicons name="chevron-down" size={20} color={AppTheme.textMedium} />
                        </View>

                        <Text style={styles.inputLabel}>Claim Amount (USDC)</Text>
                        <TextInput
                            placeholder="Enter claim amount"
                            value={claimAmount}
                            onChangeText={setClaimAmount}
                            keyboardType="numeric"
                        />

                        <Text style={styles.inputLabel}>Claim Description</Text>
                        <TextInput
                            placeholder="Describe what happened..."
                            value={claimDescription}
                            onChangeText={setClaimDescription}
                            multiline={true}
                            numberOfLines={3}
                        />

                        <Text style={styles.inputLabel}>Upload Evidence (Optional)</Text>
                        <TouchableOpacity style={styles.uploadButton}>
                            <Ionicons name="camera" size={20} color={AppTheme.primaryBlue} />
                            <Text style={styles.uploadButtonText}>Take Photo or Upload</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <PrimaryButton
                            title="Submit Claim"
                            onPress={handleSubmitClaim}
                            loading={isSubmitting}
                            style={styles.modalButton}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderClaimDetailsModal = () => {
        if (!selectedClaim) return null;

        const isApproved = selectedClaim.status === 'approved';
        const isRejected = selectedClaim.status === 'rejected';
        const isPending = selectedClaim.status === 'pending';

        return (
            <Modal
                visible={showClaimDetailsModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowClaimDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Claim Details</Text>
                            <TouchableOpacity
                                onPress={() => setShowClaimDetailsModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={AppTheme.textDark} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(selectedClaim.status) + '20' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: getStatusColor(selectedClaim.status) }
                                ]}>
                                    {selectedClaim.status.charAt(0).toUpperCase() + selectedClaim.status.slice(1)}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Claim ID</Text>
                                <Text style={styles.detailValue}>{selectedClaim.id}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Policy</Text>
                                <Text style={styles.detailValue}>{selectedClaim.policyName}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Amount</Text>
                                <Text style={styles.detailValue}>${selectedClaim.amount.toFixed(2)} USDC</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={styles.detailValue}>{formatDate(selectedClaim.date)}</Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.descriptionText}>{selectedClaim.description}</Text>

                            {isApproved && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionTitle}>Payment Details</Text>

                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Payout Amount</Text>
                                        <Text style={styles.detailValue}>${selectedClaim.amount.toFixed(2)} USDC</Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Payment Date</Text>
                                        <Text style={styles.detailValue}>{formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))}</Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Transaction ID</Text>
                                        <Text style={styles.detailValue}>TXN-{selectedClaim.id}-01</Text>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        {isPending && (
                            <View style={styles.modalFooter}>
                                <PrimaryButton
                                    title="Cancel Claim"
                                    onPress={() => {
                                        setShowClaimDetailsModal(false);
                                        showToast.info('Claim cancellation requested');
                                    }}
                                    variant="secondary"
                                    style={styles.modalButton}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    const renderClaimsList = (claims: Claim[], isPending: boolean) => {
        if (claims.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={64} color={AppTheme.textMedium} />
                    <Text style={styles.emptyStateText}>
                        {isPending ? 'No pending claims' : 'No processed claims'}
                    </Text>
                    {isPending && (
                        <View style={styles.emptyStateActions}>
                            <PrimaryButton
                                title="Submit New Claim"
                                onPress={() => setShowNewClaimModal(true)}
                                style={styles.emptyStateButton}
                            />
                        </View>
                    )}
                </View>
            );
        }

        return (
            <ScrollView
                style={styles.claimsList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[AppTheme.primaryBlue]}
                    />
                }
            >
                {claims.map((claim) => (
                    <TouchableOpacity
                        key={claim.id}
                        style={styles.claimItem}
                        onPress={() => handleClaimPress(claim)}
                    >
                        <View style={styles.claimHeader}>
                            <Text style={styles.claimId}>{claim.id}</Text>
                            <View style={[
                                styles.claimStatusBadge,
                                { backgroundColor: getStatusColor(claim.status) + '20' }
                            ]}>
                                <Text style={[
                                    styles.claimStatusText,
                                    { color: getStatusColor(claim.status) }
                                ]}>
                                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.claimPolicy}>{claim.policyName}</Text>
                        <Text style={styles.claimDescription} numberOfLines={2}>
                            {claim.description}
                        </Text>

                        <View style={styles.claimFooter}>
                            <Text style={styles.claimAmount}>
                                ${claim.amount.toFixed(2)} USDC
                            </Text>
                            <Text style={styles.claimDate}>
                                {formatDate(claim.date)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Claims</Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'pending' && styles.activeTabText
                    ]}>
                        Pending
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'processed' && styles.activeTab]}
                    onPress={() => setActiveTab('processed')}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === 'processed' && styles.activeTabText
                    ]}>
                        Processed
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContainer}>
                {activeTab === 'pending'
                    ? renderClaimsList(pendingClaims, true)
                    : renderClaimsList(processedClaims, false)
                }
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowNewClaimModal(true)}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>

            {renderNewClaimModal()}
            {renderClaimDetailsModal()}
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
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: AppTheme.backgroundWhite,
        borderBottomWidth: 1,
        borderBottomColor: AppTheme.divider,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: AppTheme.primaryBlue,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: AppTheme.textMedium,
    },
    activeTabText: {
        color: AppTheme.primaryBlue,
        fontWeight: '600',
    },
    tabContainer: {
        flex: 1,
    },
    claimsList: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 16,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    emptyStateActions: {
        width: '100%',
        paddingHorizontal: 40,
    },
    emptyStateButton: {
        width: '100%',
    },
    claimItem: {
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    claimHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    claimId: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    claimStatusBadge: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    claimStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    claimPolicy: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.primaryBlue,
        marginBottom: 4,
    },
    claimDescription: {
        fontSize: 14,
        color: AppTheme.textMedium,
        marginBottom: 12,
        lineHeight: 20,
    },
    claimFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    claimAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    claimDate: {
        fontSize: 12,
        color: AppTheme.textMedium,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: AppTheme.primaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
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
        maxHeight: '95%',
        minHeight: '60%',
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
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 0,
    },
    modalFooter: {
        padding: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: AppTheme.divider,
        backgroundColor: AppTheme.backgroundWhite,
    },
    modalButton: {
        width: '100%',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginBottom: 8,
        marginTop: 16,
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: AppTheme.backgroundLight,
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: AppTheme.divider,
    },
    dropdownText: {
        fontSize: 16,
        color: AppTheme.textDark,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AppTheme.backgroundLight,
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: AppTheme.divider,
        borderStyle: 'dashed',
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 16,
        color: AppTheme.primaryBlue,
        fontWeight: '500',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: AppTheme.divider,
        marginVertical: 16,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: AppTheme.textMedium,
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: AppTheme.textDark,
        flex: 2,
        textAlign: 'right',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: AppTheme.textMedium,
        lineHeight: 20,
    },
}); 