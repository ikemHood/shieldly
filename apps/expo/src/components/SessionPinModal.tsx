import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OTPInput } from './OTPInput';
import { PrimaryButton } from './PrimaryButton';
import { AppTheme } from '../constants/theme';

interface SessionPinModalProps {
    visible: boolean;
    onSubmit: (pin: string) => Promise<boolean>;
    onCancel: () => void;
}

export const SessionPinModal: React.FC<SessionPinModalProps> = ({
    visible,
    onSubmit,
    onCancel,
}) => {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (pin.length < 6) {
            setError('Please enter your complete session PIN');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const success = await onSubmit(pin);

            if (success) {
                setPin('');
                setError(null);
            } else {
                setError('Invalid session PIN. Please try again.');
                setPin('');
            }
        } catch (error) {
            setError('Authentication failed. Please try again.');
            setPin('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setPin('');
        setError(null);
        onCancel();
    };

    const handlePinComplete = (enteredPin: string) => {
        setPin(enteredPin);
        // Auto-submit when PIN is complete
        if (enteredPin.length === 6) {
            handleSubmit();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-closed" size={32} color={AppTheme.primaryBlue} />
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>
                            Enter your session PIN to continue
                        </Text>
                    </View>

                    <View style={styles.content}>
                        <OTPInput
                            length={6}
                            value={pin}
                            onChangeText={setPin}
                            onComplete={handlePinComplete}
                            autoFocus={true}
                            secureTextEntry={true}
                            disabled={isLoading}
                        />

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={16} color={AppTheme.errorRed} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <PrimaryButton
                            title={isLoading ? 'Verifying...' : 'Unlock'}
                            onPress={handleSubmit}
                            disabled={pin.length < 6 || isLoading}
                            loading={isLoading}
                            style={styles.unlockButton}
                        />

                        <TouchableOpacity
                            onPress={handleCancel}
                            style={styles.cancelButton}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        backgroundColor: AppTheme.primaryBlue + '20',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
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
    content: {
        marginBottom: 32,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        padding: 12,
        backgroundColor: AppTheme.errorRed + '10',
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: AppTheme.errorRed,
        fontWeight: '500',
    },
    actions: {
        gap: 12,
    },
    unlockButton: {
        width: '100%',
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        color: AppTheme.textMedium,
        fontWeight: '500',
    },
}); 