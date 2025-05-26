import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { OTPInput } from '../../components/OTPInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppTheme } from '../../constants/theme';
import { authService } from '../../services/authService';
import { showToast } from '../../utils/toast';

type OTPVerificationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'OTPVerification'>;
type OTPVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

export const OTPVerificationScreen: React.FC = () => {
    const navigation = useNavigation<OTPVerificationScreenNavigationProp>();
    const route = useRoute<OTPVerificationScreenRouteProp>();
    const { email } = route.params;

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleOTPComplete = (otpValue: string) => {
        setOtp(otpValue);
    };

    const verifyOTP = async (otpValue: string) => {
        if (otpValue.length !== 6) {
            showToast.error('Please enter a valid 6-digit OTP.', 'Invalid OTP');
            return;
        }

        try {
            setIsLoading(true);

            const response = await authService.verifyOtp({
                email,
                otp: otpValue,
            });

            showToast.success('OTP verified successfully!');

            // Always go to session pin setup first, then handle wallet creation from there
            navigation.navigate('SetSessionPin', {
                userId: response.userId,
                hasWallet: response.hasWallet
            });
        } catch (error) {
            showToast.error('Please try again.', 'Verification Failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        try {
            setIsLoading(true);

            await authService.resendOtp(email);

            showToast.success(`Verification code sent to ${email}`, 'Code Sent');

            // Reset countdown
            setCountdown(60);
            setCanResend(false);
        } catch (error) {
            showToast.error('Please try again.', 'Failed to Resend');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const getIcon = (): keyof typeof Ionicons.glyphMap => {
        return 'mail-outline';
    };

    const getTitle = () => {
        return 'Verify Your Email';
    };

    const getDescription = () => {
        return `We've sent a verification code to your email ${email}. Enter the code below to verify your account.`;
    };

    const getButtonText = () => {
        return 'Verify Email';
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={AppTheme.textDark} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Ionicons name={getIcon()} size={48} color={AppTheme.primaryBlue} />
                    </View>

                    <Text style={styles.title}>{getTitle()}</Text>
                    <Text style={styles.description}>
                        {getDescription()}
                    </Text>
                </View>

                {/* OTP Input */}
                <View style={styles.otpSection}>
                    <OTPInput
                        length={6}
                        onComplete={handleOTPComplete}
                        onChangeText={setOtp}
                    />
                </View>

                {/* Verify Button */}
                <PrimaryButton
                    title={getButtonText()}
                    onPress={() => verifyOTP(otp)}
                    loading={isLoading}
                    disabled={otp.length !== 6}
                    style={styles.verifyButton}
                />

                {/* Resend Section */}
                <View style={styles.resendSection}>
                    <Text style={styles.resendText}>
                        Didn't receive the code?{' '}
                    </Text>
                    {canResend ? (
                        <TouchableOpacity onPress={handleResendOTP}>
                            <Text style={styles.resendLink}>Resend Code</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.countdownText}>
                            Resend in {countdown}s
                        </Text>
                    )}
                </View>

                {/* Help Text */}
                <View style={styles.helpSection}>
                    <Ionicons name="information-circle-outline" size={16} color={AppTheme.textMedium} />
                    <Text style={styles.helpText}>
                        Check your spam folder if you don't see the email
                    </Text>
                </View>
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
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 40,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        padding: 8,
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
    description: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
    },
    otpSection: {
        marginBottom: 32,
    },
    resendSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    resendText: {
        fontSize: 16,
        color: AppTheme.textMedium,
    },
    resendLink: {
        color: AppTheme.primaryBlue,
        fontWeight: '600',
    },
    countdownText: {
        fontSize: 16,
        color: AppTheme.textMedium,
    },
    verifyButton: {
        marginBottom: 24,
    },
    helpSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
    },
    helpText: {
        fontSize: 14,
        color: AppTheme.textMedium,
        marginLeft: 8,
    },
}); 