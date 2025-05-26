import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OTPInput } from '../../components/OTPInput';
import { AppTheme } from '../../constants/theme';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../utils/toast';

type SessionPinScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SessionPin'>;

export const SessionPinScreen: React.FC = () => {
    const navigation = useNavigation<SessionPinScreenNavigationProp>();
    const { dispatch } = useAuth();
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    const maxAttempts = 3;

    const handlePinComplete = async (enteredPin: string) => {
        if (enteredPin.length !== 6) return;

        setIsLoading(true);
        try {
            const isValid = await authService.verifySessionPassword(enteredPin);

            if (isValid) {
                // Refresh session and navigate to main app
                await authService.refreshSession();
                const userData = await authService.getStoredUserData();

                dispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: {
                        user: {
                            id: userData.userId!.toString(),
                            email: userData.email || '',
                            phoneNumber: userData.phone || undefined,
                            name: userData.name || 'User',
                            isEmailVerified: true,
                            isPhoneVerified: false,
                            createdAt: new Date(),
                        },
                        token: await authService.getAccessToken() || '',
                    },
                });

                showToast.success('Welcome back!');
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= maxAttempts) {
                    Alert.alert(
                        'Too Many Attempts',
                        'You have exceeded the maximum number of attempts. Please login again.',
                        [
                            {
                                text: 'Login Again',
                                onPress: handleLogout,
                            },
                        ]
                    );
                } else {
                    shakePin();
                    showToast.error(`Incorrect PIN. ${maxAttempts - newAttempts} attempts remaining.`);
                    setPin('');
                }
            }
        } catch (error) {
            console.error('Session PIN verification error:', error);
            showToast.error('Failed to verify PIN. Please try again.');
            setPin('');
        } finally {
            setIsLoading(false);
        }
    };

    const shakePin = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, {
                toValue: 10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: -10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: 10,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            dispatch({ type: 'LOGOUT' });
        } catch (error) {
            console.error('Logout error:', error);
            dispatch({ type: 'LOGOUT' }); // Force logout even if API call fails
        }
    };

    const handleForgotPin = () => {
        Alert.alert(
            'Forgot PIN?',
            'To reset your session PIN, you will need to login again with your email and password.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Login Again',
                    onPress: handleLogout,
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={48} color={AppTheme.primaryBlue} />
                    </View>
                    <Text style={styles.title}>Enter Session PIN</Text>
                    <Text style={styles.subtitle}>
                        Enter your 6-digit session PIN to unlock the app
                    </Text>
                </View>

                {/* PIN Input */}
                <Animated.View
                    style={[
                        styles.pinContainer,
                        {
                            transform: [{ translateX: shakeAnimation }],
                        },
                    ]}
                >
                    <OTPInput
                        length={6}
                        value={pin}
                        onChangeText={setPin}
                        onComplete={handlePinComplete}
                        autoFocus={true}
                        secureTextEntry={true}
                        disabled={isLoading}
                    />
                </Animated.View>

                {/* Attempts Warning */}
                {attempts > 0 && (
                    <View style={styles.warningContainer}>
                        <Ionicons name="warning" size={16} color={AppTheme.errorRed} />
                        <Text style={styles.warningText}>
                            {maxAttempts - attempts} attempts remaining
                        </Text>
                    </View>
                )}

                {/* Forgot PIN */}
                <TouchableOpacity
                    style={styles.forgotPinButton}
                    onPress={handleForgotPin}
                    disabled={isLoading}
                >
                    <Text style={styles.forgotPinText}>Forgot PIN?</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <PrimaryButton
                    title="Login with Different Account"
                    onPress={handleLogout}
                    variant="secondary"
                    disabled={isLoading}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundLight,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AppTheme.primaryBlue + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
    },
    pinContainer: {
        marginBottom: 32,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: AppTheme.errorRed + '10',
        borderRadius: 8,
        alignSelf: 'center',
    },
    warningText: {
        fontSize: 14,
        color: AppTheme.errorRed,
        marginLeft: 8,
        fontWeight: '500',
    },
    forgotPinButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    forgotPinText: {
        fontSize: 16,
        color: AppTheme.primaryBlue,
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
}); 