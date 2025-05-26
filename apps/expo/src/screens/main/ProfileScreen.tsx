import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';

interface MenuItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true
}) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
            <View style={styles.menuItemIcon}>
                <Ionicons name={icon as any} size={20} color={AppTheme.primaryBlue} />
            </View>
            <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        {showChevron && (
            <Ionicons name="chevron-forward" size={20} color={AppTheme.textMedium} />
        )}
    </TouchableOpacity>
);

export const ProfileScreen: React.FC = () => {
    const { state, logout } = useAuth();

    const handleEditProfile = () => {
        showToast.comingSoon('Edit profile');
    };

    const handleSecuritySettings = () => {
        showToast.comingSoon('Security settings');
    };

    const handleNotificationSettings = () => {
        showToast.comingSoon('Notification settings');
    };

    const handleWalletSettings = () => {
        showToast.comingSoon('Wallet settings');
    };

    const handleSupport = () => {
        showToast.comingSoon('Customer support');
    };

    const handleAbout = () => {
        showToast.comingSoon('About Shieldly');
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            showToast.success('Logged out successfully');
                        } catch (error) {
                            showToast.error('Failed to logout');
                        }
                    },
                },
            ]
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            {/* User Info */}
            <View style={styles.userSection}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {state.user?.name ? getInitials(state.user.name) : 'U'}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{state.user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{state.user?.email || 'user@example.com'}</Text>
                    <View style={styles.verificationStatus}>
                        <View style={styles.statusItem}>
                            <Ionicons
                                name={state.user?.isEmailVerified ? "checkmark-circle" : "ellipse-outline"}
                                size={16}
                                color={state.user?.isEmailVerified ? AppTheme.successGreen : AppTheme.textMedium}
                            />
                            <Text style={styles.statusText}>Email verified</Text>
                        </View>
                        <View style={styles.statusItem}>
                            <Ionicons
                                name={state.user?.isPhoneVerified ? "checkmark-circle" : "ellipse-outline"}
                                size={16}
                                color={state.user?.isPhoneVerified ? AppTheme.successGreen : AppTheme.textMedium}
                            />
                            <Text style={styles.statusText}>Phone verified</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                    <Ionicons name="pencil" size={20} color={AppTheme.primaryBlue} />
                </TouchableOpacity>
            </View>

            {/* Menu Sections */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.menuContainer}>
                    <MenuItem
                        icon="person"
                        title="Edit Profile"
                        subtitle="Update your personal information"
                        onPress={handleEditProfile}
                    />
                    <MenuItem
                        icon="shield-checkmark"
                        title="Security"
                        subtitle="Password, PIN, and biometric settings"
                        onPress={handleSecuritySettings}
                    />
                    <MenuItem
                        icon="notifications"
                        title="Notifications"
                        subtitle="Manage your notification preferences"
                        onPress={handleNotificationSettings}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Wallet & Payments</Text>
                <View style={styles.menuContainer}>
                    <MenuItem
                        icon="wallet"
                        title="Wallet Settings"
                        subtitle="Manage your blockchain wallet"
                        onPress={handleWalletSettings}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.menuContainer}>
                    <MenuItem
                        icon="help-circle"
                        title="Help & Support"
                        subtitle="Get help with your account"
                        onPress={handleSupport}
                    />
                    <MenuItem
                        icon="information-circle"
                        title="About"
                        subtitle="App version and legal information"
                        onPress={handleAbout}
                    />
                </View>
            </View>

            {/* Logout Button */}
            <View style={styles.logoutSection}>
                <PrimaryButton
                    title="Logout"
                    onPress={handleLogout}
                    variant="secondary"
                    style={styles.logoutButton}
                />
            </View>

            {/* App Version */}
            <View style={styles.versionSection}>
                <Text style={styles.versionText}>Shieldly v1.0.0</Text>
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.textDark,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppTheme.backgroundWhite,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: AppTheme.primaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: AppTheme.textMedium,
        marginBottom: 8,
    },
    verificationStatus: {
        flexDirection: 'row',
        gap: 16,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        color: AppTheme.textMedium,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: AppTheme.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.textDark,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    menuContainer: {
        backgroundColor: AppTheme.backgroundWhite,
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: AppTheme.divider,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: AppTheme.primaryBlue + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: AppTheme.textDark,
        marginBottom: 2,
    },
    menuItemSubtitle: {
        fontSize: 14,
        color: AppTheme.textMedium,
    },
    logoutSection: {
        paddingHorizontal: 16,
        marginTop: 32,
        marginBottom: 24,
    },
    logoutButton: {
        backgroundColor: AppTheme.errorRed,
    },
    versionSection: {
        alignItems: 'center',
        paddingBottom: 32,
    },
    versionText: {
        fontSize: 14,
        color: AppTheme.textMedium,
    },
}); 