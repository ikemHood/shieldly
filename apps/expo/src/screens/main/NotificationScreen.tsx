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
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';

interface Notification {
    id: string;
    type: 'policy' | 'claim' | 'payment' | 'system';
    title: string;
    message: string;
    date: Date;
    isRead: boolean;
    actionRequired?: boolean;
}

// Mock notifications data
const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'claim',
        title: 'Claim Approved',
        message: 'Your claim CLM-001 for Crop Insurance has been approved. Payment of $80.00 USDC will be processed within 24 hours.',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        actionRequired: false,
    },
    {
        id: '2',
        type: 'policy',
        title: 'Policy Renewal Reminder',
        message: 'Your Crop Insurance policy expires in 7 days. Renew now to maintain continuous coverage.',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isRead: false,
        actionRequired: true,
    },
    {
        id: '3',
        type: 'payment',
        title: 'Payment Received',
        message: 'We have received your premium payment of $25.00 USDC for Crop Insurance policy.',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        isRead: true,
        actionRequired: false,
    },
    {
        id: '4',
        type: 'system',
        title: 'Welcome to Shieldly',
        message: 'Thank you for joining Shieldly! Your account has been successfully created and verified.',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        isRead: true,
        actionRequired: false,
    },
];

export const NotificationScreen: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
        showToast.success('Notifications refreshed');
    };

    const handleNotificationPress = (notification: Notification) => {
        // Mark as read
        setNotifications(prev =>
            prev.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            )
        );

        if (notification.actionRequired) {
            showToast.info('Action required for this notification');
        } else {
            showToast.info('Notification details viewed');
        }
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true }))
        );
        showToast.success('All notifications marked as read');
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        showToast.success('All notifications cleared');
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'policy':
                return 'shield-checkmark';
            case 'claim':
                return 'document-text';
            case 'payment':
                return 'card';
            case 'system':
                return 'information-circle';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'policy':
                return AppTheme.primaryBlue;
            case 'claim':
                return AppTheme.successGreen;
            case 'payment':
                return '#8B5CF6';
            case 'system':
                return AppTheme.warningYellow;
            default:
                return AppTheme.textMedium;
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{unreadCount}</Text>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            {notifications.length > 0 && (
                <View style={styles.actionButtons}>
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={markAllAsRead}
                        >
                            <Ionicons name="checkmark-done" size={16} color={AppTheme.primaryBlue} />
                            <Text style={styles.actionButtonText}>Mark all read</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={clearAllNotifications}
                    >
                        <Ionicons name="trash-outline" size={16} color={AppTheme.errorRed} />
                        <Text style={[styles.actionButtonText, { color: AppTheme.errorRed }]}>
                            Clear all
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="notifications-outline" size={64} color={AppTheme.textMedium} />
                    <Text style={styles.emptyStateText}>No notifications</Text>
                    <Text style={styles.emptyStateSubtext}>
                        You're all caught up! New notifications will appear here.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.notificationsList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[AppTheme.primaryBlue]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {notifications.map((notification) => (
                        <TouchableOpacity
                            key={notification.id}
                            style={[
                                styles.notificationItem,
                                !notification.isRead && styles.unreadNotification
                            ]}
                            onPress={() => handleNotificationPress(notification)}
                        >
                            <View style={styles.notificationContent}>
                                <View style={[
                                    styles.notificationIcon,
                                    { backgroundColor: getNotificationColor(notification.type) + '20' }
                                ]}>
                                    <Ionicons
                                        name={getNotificationIcon(notification.type)}
                                        size={20}
                                        color={getNotificationColor(notification.type)}
                                    />
                                </View>

                                <View style={styles.notificationDetails}>
                                    <View style={styles.notificationHeader}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            !notification.isRead && styles.unreadTitle
                                        ]}>
                                            {notification.title}
                                        </Text>
                                        {notification.actionRequired && (
                                            <View style={styles.actionRequiredBadge}>
                                                <Text style={styles.actionRequiredText}>Action</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.notificationMessage} numberOfLines={2}>
                                        {notification.message}
                                    </Text>

                                    <Text style={styles.notificationDate}>
                                        {formatDate(notification.date)}
                                    </Text>
                                </View>

                                {!notification.isRead && (
                                    <View style={styles.unreadDot} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: AppTheme.errorRed,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    unreadCount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.primaryBlue,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
    },
    notificationsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    notificationItem: {
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    unreadNotification: {
        borderLeftWidth: 4,
        borderLeftColor: AppTheme.primaryBlue,
    },
    notificationContent: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationDetails: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: AppTheme.textDark,
        flex: 1,
    },
    unreadTitle: {
        fontWeight: '600',
    },
    actionRequiredBadge: {
        backgroundColor: AppTheme.warningYellow + '20',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    actionRequiredText: {
        fontSize: 10,
        fontWeight: '600',
        color: AppTheme.warningYellow,
    },
    notificationMessage: {
        fontSize: 14,
        color: AppTheme.textMedium,
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationDate: {
        fontSize: 12,
        color: AppTheme.textMedium,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: AppTheme.primaryBlue,
        marginLeft: 8,
        marginTop: 4,
    },
}); 