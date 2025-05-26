import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';
import { PolicyDisplayData } from '../types/contracts';
import { PinInputModal } from './PinInputModal';

interface PolicyDetailsModalProps {
    visible: boolean;
    policy: PolicyDisplayData | null;
    onClose: () => void;
    onPurchase: (policyId: bigint, pin: string) => Promise<void>;
    canPurchase: boolean;
    isPurchasing: boolean;
}

export const PolicyDetailsModal: React.FC<PolicyDetailsModalProps> = ({
    visible,
    policy,
    onClose,
    onPurchase,
    canPurchase,
    isPurchasing,
}) => {
    const [showPinModal, setShowPinModal] = useState(false);

    if (!policy) return null;

    const handlePurchasePress = () => {
        setShowPinModal(true);
    };

    const handlePinConfirm = async (pin: string) => {
        try {
            await onPurchase(BigInt(policy.id), pin);
            setShowPinModal(false);
            onClose();
        } catch (error) {
            // Error is handled in the PIN modal
            throw error;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return AppTheme.successGreen;
            case 'draft':
                return AppTheme.warningYellow;
            case 'expired':
                return AppTheme.textMedium;
            case 'paused':
                return AppTheme.errorRed;
            default:
                return AppTheme.textMedium;
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={onClose}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={AppTheme.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Policy Details</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.policyHeader}>
                            <View style={styles.policyTitleRow}>
                                <Text style={styles.policyTitle}>Insurance Policy #{policy.id.toString()}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(policy.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(policy.status) }]}>
                                        {policy.status}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.policyDescription}>{policy.description}</Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Coverage Details</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Coverage Amount</Text>
                                <Text style={styles.detailValue}>${policy.coverage.toLocaleString()}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Premium Amount</Text>
                                <Text style={styles.detailValue}>${policy.premium.toLocaleString()}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Payout Amount</Text>
                                <Text style={styles.detailValue}>${policy.payout.toLocaleString()}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Term Duration</Text>
                                <Text style={styles.detailValue}>{policy.termDays} days</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Policy Information</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Created</Text>
                                <Text style={styles.detailValue}>{policy.createdAt.toLocaleDateString()}</Text>
                            </View>
                            {policy.approvedAt && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Approved</Text>
                                    <Text style={styles.detailValue}>{policy.approvedAt.toLocaleDateString()}</Text>
                                </View>
                            )}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Policy ID</Text>
                                <Text style={styles.detailValueMono}>#{policy.id}</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Trigger Conditions</Text>
                            <Text style={styles.triggerText}>{policy.triggerDescription}</Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Additional Details</Text>
                            <Text style={styles.detailsText}>{policy.description}</Text>
                        </View>

                        <View style={styles.bottomSpacing} />
                    </ScrollView>

                    {canPurchase && (
                        <View style={styles.footer}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Premium:</Text>
                                <Text style={styles.priceValue}>${policy.premium.toLocaleString()}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.purchaseButton, isPurchasing && styles.disabledButton]}
                                onPress={handlePurchasePress}
                                disabled={isPurchasing}
                            >
                                {isPurchasing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.purchaseButtonText}>Purchase Policy</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>

            <PinInputModal
                visible={showPinModal}
                title="Confirm Purchase"
                description={`You are about to purchase this policy for $${policy.premium.toLocaleString()}`}
                onConfirm={handlePinConfirm}
                onCancel={() => setShowPinModal(false)}
                isLoading={isPurchasing}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundWhite,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: AppTheme.divider,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    policyHeader: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: AppTheme.divider,
    },
    policyTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    policyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    policyDescription: {
        fontSize: 16,
        color: AppTheme.textMedium,
        lineHeight: 22,
    },
    section: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: AppTheme.divider,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: AppTheme.textMedium,
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.textDark,
        textAlign: 'right',
    },
    detailValueMono: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.textDark,
        fontFamily: 'monospace',
        textAlign: 'right',
    },
    triggerText: {
        fontSize: 14,
        color: AppTheme.textDark,
        lineHeight: 20,
        backgroundColor: AppTheme.backgroundLight,
        padding: 12,
        borderRadius: 8,
    },
    detailsText: {
        fontSize: 14,
        color: AppTheme.textDark,
        lineHeight: 20,
    },
    bottomSpacing: {
        height: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: AppTheme.divider,
        backgroundColor: AppTheme.backgroundWhite,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    priceLabel: {
        fontSize: 16,
        color: AppTheme.textMedium,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppTheme.primaryBlue,
    },
    purchaseButton: {
        backgroundColor: AppTheme.primaryBlue,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    purchaseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    disabledButton: {
        backgroundColor: AppTheme.textMedium,
    },
}); 