import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';
import { PolicyDisplayData } from '../types/contracts';
import { PolicyDetailsModal } from './PolicyDetailsModal';

interface PolicyCardProps {
    policy: PolicyDisplayData;
    onPurchase: (policyId: bigint, pin: string) => Promise<void>;
    canPurchase: boolean;
    isPurchasing: boolean;
}

export const PolicyCard: React.FC<PolicyCardProps> = ({
    policy,
    onPurchase,
    canPurchase,
    isPurchasing,
}) => {
    const [showModal, setShowModal] = useState(false);

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

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <>
            <TouchableOpacity
                style={styles.card}
                onPress={() => setShowModal(true)}
                activeOpacity={0.7}
            >
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{policy.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(policy.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(policy.status) }]}>
                                {policy.status}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.description}>
                        {truncateText(policy.description, 100)}
                    </Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Coverage</Text>
                        <Text style={styles.detailValue}>${policy.coverage.toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Premium</Text>
                        <Text style={styles.detailValue}>${policy.premium.toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Term</Text>
                        <Text style={styles.detailValue}>{policy.termDays} days</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.triggerPreview}>
                        {truncateText(policy.triggerDescription, 80)}
                    </Text>
                    <View style={styles.actionRow}>
                        <Text style={styles.tapToView}>Tap to view details</Text>
                        <Ionicons name="chevron-forward" size={16} color={AppTheme.primaryBlue} />
                    </View>
                </View>
            </TouchableOpacity>

            <PolicyDetailsModal
                visible={showModal}
                policy={policy}
                onClose={() => setShowModal(false)}
                onPurchase={onPurchase}
                canPurchase={canPurchase}
                isPurchasing={isPurchasing}
            />
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: AppTheme.cardBackground,
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
        borderWidth: 1,
        borderColor: AppTheme.divider,
    },
    header: {
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    description: {
        fontSize: 14,
        color: AppTheme.textMedium,
        lineHeight: 20,
    },
    content: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 13,
        color: AppTheme.textMedium,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '500',
        color: AppTheme.textDark,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: AppTheme.divider,
        paddingTop: 12,
    },
    triggerPreview: {
        fontSize: 12,
        color: AppTheme.textMedium,
        fontStyle: 'italic',
        marginBottom: 8,
        lineHeight: 16,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tapToView: {
        fontSize: 12,
        color: AppTheme.primaryBlue,
        fontWeight: '500',
    },
}); 