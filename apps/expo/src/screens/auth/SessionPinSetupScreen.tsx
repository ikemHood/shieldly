import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OTPInput } from '../../components/OTPInput';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';

type SessionPinSetupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SessionPinSetup'>;

export const SessionPinSetupScreen: React.FC = () => {
    const navigation = useNavigation<SessionPinSetupScreenNavigationProp>();
    const [step, setStep] = useState<'setup' | 'confirm'>('setup');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSkipModal, setShowSkipModal] = useState(false);

    const handlePinComplete = (pinValue: string) => {
        if (step === 'setup') {
            setPin(pinValue);
        } else {
            setConfirmPin(pinValue);
        }
    };

    const processPinStep = async (pinValue: string) => {
        if (step === 'setup') {
            setPin(pinValue);
            setStep('confirm');
        } else {
            setConfirmPin(pinValue);
            if (pin === pinValue) {
                try {
                    setIsLoading(true);

                    // TODO: Implement actual PIN storage
                    await new Promise(resolve => setTimeout(resolve, 500));

                    showToast.success('Your session PIN has been created successfully!', 'PIN Set Successfully');

                    // Navigate to wallet creation
                    // navigation.navigate('WalletCreation');
                } catch (error) {
                    showToast.error('Failed to set PIN. Please try again.', 'Error');
                } finally {
                    setIsLoading(false);
                }
            } else {
                showToast.error('PINs do not match. Please try again.', 'PIN Mismatch');
                setStep('setup');
                setPin('');
                setConfirmPin('');
            }
        }
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('setup');
            setConfirmPin('');
        } else {
            navigation.goBack();
        }
    };

    const handleSkip = () => {
        setShowSkipModal(true);
    };

    const confirmSkip = () => {
        setShowSkipModal(false);
        showToast.warning('You can set up your PIN later in settings.', 'PIN Setup Skipped');
        // navigation.navigate('WalletCreation');
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
                        <Ionicons name="lock-closed" size={48} color={AppTheme.primaryBlue} />
                    </View>

                    <Text style={styles.title}>
                        {step === 'setup' ? 'Create Session PIN' : 'Confirm Your PIN'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'setup'
                            ? 'Create a 6-digit PIN for quick access to your account'
                            : 'Please enter your PIN again to confirm'
                        }
                    </Text>
                </View>

                {/* PIN Input */}
                <View style={styles.pinSection}>
                    <OTPInput
                        length={6}
                        onComplete={handlePinComplete}
                        onChangeText={step === 'setup' ? setPin : setConfirmPin}
                    />
                </View>

                {/* Progress Indicator */}
                <View style={styles.progressSection}>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressDot, styles.activeDot]} />
                        <View style={[styles.progressDot, step === 'confirm' && styles.activeDot]} />
                    </View>
                    <Text style={styles.progressText}>
                        Step {step === 'setup' ? '1' : '2'} of 2
                    </Text>
                </View>

                {/* Continue Button */}
                <PrimaryButton
                    title={step === 'setup' ? 'Continue' : 'Confirm PIN'}
                    onPress={() => {
                        if (step === 'setup') {
                            processPinStep(pin);
                        } else {
                            processPinStep(confirmPin);
                        }
                    }}
                    loading={isLoading}
                    disabled={(step === 'setup' ? pin : confirmPin).length !== 6}
                    style={styles.continueButton}
                />

                {/* Skip Option */}
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>

                {/* Info Text */}
                <Text style={styles.infoText}>
                    Your PIN will be used to quickly access your account without entering your full password.
                </Text>
            </View>

            {/* Skip Modal */}
            <Modal
                visible={showSkipModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.skipModal}>
                    <View style={styles.skipModalContent}>
                        <Text style={styles.skipModalTitle}>Skip PIN Setup?</Text>
                        <Text style={styles.skipModalMessage}>
                            You can set up a session PIN later in settings. Without a PIN, you'll need to log in with your password each time.
                        </Text>
                        <View style={styles.skipModalButtons}>
                            <PrimaryButton
                                title="Cancel"
                                onPress={() => setShowSkipModal(false)}
                                style={styles.skipModalCancelButton}
                            />
                            <PrimaryButton
                                title="Skip"
                                onPress={confirmSkip}
                                style={styles.skipModalSkipButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
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
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    pinSection: {
        marginBottom: 32,
    },
    progressSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: AppTheme.divider,
    },
    activeDot: {
        backgroundColor: AppTheme.primaryBlue,
    },
    progressText: {
        fontSize: 14,
        color: AppTheme.textMedium,
    },
    continueButton: {
        marginBottom: 16,
    },
    skipButton: {
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 24,
    },
    skipText: {
        fontSize: 16,
        color: AppTheme.textMedium,
        fontWeight: '500',
    },
    infoText: {
        fontSize: 14,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    skipModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipModalContent: {
        backgroundColor: AppTheme.backgroundWhite,
        padding: 24,
        borderRadius: 12,
        width: '80%',
        alignItems: 'center',
    },
    skipModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 12,
    },
    skipModalMessage: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    skipModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    skipModalCancelButton: {
        flex: 1,
    },
    skipModalSkipButton: {
        flex: 1,
    },
}); 