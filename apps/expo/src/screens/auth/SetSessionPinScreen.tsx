import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OTPInput } from '../../components/OTPInput';
import { AppTheme } from '../../constants/theme';
import { authService } from '../../services/authService';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';

type SetSessionPinScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SetSessionPin'>;
type SetSessionPinScreenRouteProp = RouteProp<AuthStackParamList, 'SetSessionPin'>;

export const SetSessionPinScreen: React.FC = () => {
    const navigation = useNavigation<SetSessionPinScreenNavigationProp>();
    const route = useRoute<SetSessionPinScreenRouteProp>();
    const { userId, hasWallet } = route.params;
    const { completeAuth } = useAuth();

    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [isLoading, setIsLoading] = useState(false);

    const handlePinComplete = async (enteredPin: string) => {
        if (step === 'enter') {
            setPin(enteredPin);
            setStep('confirm');
            setConfirmPin('');
        } else {
            // Confirm step
            if (enteredPin === pin) {
                await handleSetSessionPin(enteredPin);
            } else {
                showToast.error('PINs do not match. Please try again.');
                setStep('enter');
                setPin('');
                setConfirmPin('');
            }
        }
    };

    const handleSetSessionPin = async (sessionPin: string) => {
        setIsLoading(true);
        try {
            await authService.setSessionPassword({
                userId,
                sessionPassword: sessionPin,
            });

            showToast.success('Session PIN set successfully!');

            if (hasWallet) {
                await completeAuth();
            } else {
                navigation.navigate('WalletCreation', { userId });
            }
        } catch (error) {
            console.error('Set session PIN error:', error);
            showToast.error('Failed to set session PIN. Please try again.');
            setStep('enter');
            setPin('');
            setConfirmPin('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('enter');
            setConfirmPin('');
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={AppTheme.textDark} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-closed" size={48} color={AppTheme.primaryBlue} />
                </View>

                {/* Title and Description */}
                <Text style={styles.title}>
                    {step === 'enter' ? 'Set Session PIN' : 'Confirm Session PIN'}
                </Text>
                <Text style={styles.subtitle}>
                    {step === 'enter'
                        ? 'Create a 6-digit PIN to secure your app sessions'
                        : 'Re-enter your PIN to confirm'
                    }
                </Text>

                {/* PIN Input */}
                <View style={styles.pinContainer}>
                    <OTPInput
                        key={step} // Force remount when step changes
                        length={6}
                        value={step === 'enter' ? pin : confirmPin}
                        onChangeText={step === 'enter' ? setPin : setConfirmPin}
                        onComplete={handlePinComplete}
                        autoFocus={true}
                        secureTextEntry={true}
                        disabled={isLoading}
                    />
                </View>

                {/* Instructions */}
                <View style={styles.instructions}>
                    <Text style={styles.instructionText}>
                        • Use this PIN to unlock the app when you return
                    </Text>
                    <Text style={styles.instructionText}>
                        • Choose a PIN that's easy to remember but hard to guess
                    </Text>
                    <Text style={styles.instructionText}>
                        • You can change this PIN later in settings
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <PrimaryButton
                    title={step === 'enter' ? 'Continue' : 'Confirm PIN'}
                    onPress={() => {
                        if (step === 'enter' && pin.length === 6) {
                            setStep('confirm');
                            setConfirmPin('');
                        } else if (step === 'confirm' && confirmPin.length === 6) {
                            handlePinComplete(confirmPin);
                        }
                    }}
                    disabled={
                        isLoading ||
                        (step === 'enter' && pin.length !== 6) ||
                        (step === 'confirm' && confirmPin.length !== 6)
                    }
                    loading={isLoading}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    backButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: AppTheme.primaryBlue + '20',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 48,
    },
    pinContainer: {
        marginBottom: 32,
    },
    instructions: {
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        padding: 16,
        marginBottom: 32,
    },
    instructionText: {
        fontSize: 14,
        color: AppTheme.textMedium,
        lineHeight: 20,
        marginBottom: 8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
}); 