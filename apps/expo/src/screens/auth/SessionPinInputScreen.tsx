import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../hooks/useAuth';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OTPInput } from '../../components/OTPInput';
import { AppTheme } from '../../constants/theme';

type SessionPinInputScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SessionPinInput'>;

export const SessionPinInputScreen: React.FC = () => {
    const navigation = useNavigation<SessionPinInputScreenNavigationProp>();
    const { refreshAuth } = useAuth();
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    useEffect(() => {
        if (lockoutTime > 0) {
            const timer = setTimeout(() => setLockoutTime(lockoutTime - 1), 1000);
            return () => clearTimeout(timer);
        } else if (isLocked) {
            setIsLocked(false);
            setAttempts(0);
        }
    }, [lockoutTime, isLocked]);

    const checkBiometricAvailability = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(hasHardware && isEnrolled);
        } catch (error) {
            console.error('Error checking biometric availability:', error);
        }
    };

    const handlePinComplete = async (pinValue: string) => {
        setPin(pinValue);
        await verifyPin(pinValue);
    };

    const verifyPin = async (pinValue: string) => {
        if (isLocked) {
            Alert.alert('Account Locked', `Please wait ${lockoutTime} seconds before trying again.`);
            return;
        }

        try {
            setIsLoading(true);

            const storedPin = await SecureStore.getItemAsync('session_pin');

            if (storedPin === pinValue) {
                // PIN is correct, refresh auth and navigate to main app
                await refreshAuth();
                setAttempts(0);
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= 5) {
                    // Lock account for 5 minutes after 5 failed attempts
                    setIsLocked(true);
                    setLockoutTime(300); // 5 minutes
                    Alert.alert(
                        'Too Many Attempts',
                        'Your account has been locked for 5 minutes due to too many failed PIN attempts.'
                    );
                } else {
                    Alert.alert(
                        'Incorrect PIN',
                        `Incorrect PIN. ${5 - newAttempts} attempts remaining.`
                    );
                }
                setPin('');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to verify PIN. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricAuth = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access your account',
                fallbackLabel: 'Use PIN',
            });

            if (result.success) {
                await refreshAuth();
            }
        } catch (error) {
            console.error('Biometric authentication error:', error);
        }
    };

    const handleForgotPin = () => {
        Alert.alert(
            'Forgot PIN?',
            'You will need to log in with your email and password to reset your PIN.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Login with Password',
                    onPress: () => navigation.navigate('Login'),
                },
            ]
        );
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={48} color={AppTheme.primaryBlue} />
                    </View>

                    <Text style={styles.title}>Enter Your PIN</Text>
                    <Text style={styles.subtitle}>
                        Enter your 6-digit PIN to access your account
                    </Text>
                </View>

                {/* PIN Input */}
                <View style={styles.pinSection}>
                    <OTPInput
                        length={6}
                        onComplete={handlePinComplete}
                        onChangeText={setPin}
                    />
                </View>

                {/* Lockout Message */}
                {isLocked && (
                    <View style={styles.lockoutSection}>
                        <Text style={styles.lockoutText}>
                            Account locked for {formatTime(lockoutTime)}
                        </Text>
                    </View>
                )}

                {/* Attempts Warning */}
                {attempts > 0 && !isLocked && (
                    <View style={styles.warningSection}>
                        <Text style={styles.warningText}>
                            {5 - attempts} attempts remaining
                        </Text>
                    </View>
                )}

                {/* Verify Button */}
                <PrimaryButton
                    title="Verify PIN"
                    onPress={() => verifyPin(pin)}
                    loading={isLoading}
                    disabled={pin.length !== 6 || isLocked}
                    style={styles.verifyButton}
                />

                {/* Biometric Option */}
                {biometricAvailable && !isLocked && (
                    <TouchableOpacity
                        onPress={handleBiometricAuth}
                        style={styles.biometricButton}
                    >
                        <Ionicons name="finger-print" size={24} color={AppTheme.primaryBlue} />
                        <Text style={styles.biometricText}>Use Biometric</Text>
                    </TouchableOpacity>
                )}

                {/* Forgot PIN */}
                <TouchableOpacity onPress={handleForgotPin} style={styles.forgotButton}>
                    <Text style={styles.forgotText}>Forgot PIN?</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundLight,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
    },
    pinSection: {
        marginBottom: 32,
    },
    lockoutSection: {
        alignItems: 'center',
        marginBottom: 24,
        padding: 16,
        backgroundColor: AppTheme.errorRed + '20',
        borderRadius: 12,
    },
    lockoutText: {
        fontSize: 16,
        color: AppTheme.errorRed,
        fontWeight: '600',
    },
    warningSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    warningText: {
        fontSize: 14,
        color: AppTheme.warningYellow,
        fontWeight: '500',
    },
    verifyButton: {
        marginBottom: 24,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginBottom: 16,
        gap: 8,
    },
    biometricText: {
        fontSize: 16,
        color: AppTheme.primaryBlue,
        fontWeight: '500',
    },
    forgotButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    forgotText: {
        fontSize: 16,
        color: AppTheme.textMedium,
        fontWeight: '500',
    },
}); 