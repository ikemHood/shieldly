import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';

interface PinInputModalProps {
    visible: boolean;
    title: string;
    description: string;
    onConfirm: (pin: string) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const PinInputModal: React.FC<PinInputModalProps> = ({
    visible,
    title,
    description,
    onConfirm,
    onCancel,
    isLoading = false,
}) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        try {
            setError('');
            await onConfirm(pin);
            setPin('');
        } catch (err: any) {
            setError(err.message || 'Transaction failed');
        }
    };

    const handleCancel = () => {
        setPin('');
        setError('');
        onCancel();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-closed" size={24} color={AppTheme.primaryBlue} />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.label}>Enter your wallet PIN</Text>
                        <TextInput
                            style={[styles.pinInput, error ? styles.pinInputError : null]}
                            value={pin}
                            onChangeText={setPin}
                            placeholder="••••••"
                            secureTextEntry
                            keyboardType="numeric"
                            maxLength={12}
                            autoFocus
                            editable={!isLoading}
                        />
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton, isLoading && styles.disabledButton]}
                            onPress={handleConfirm}
                            disabled={isLoading || pin.length < 4}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                            )}
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
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: AppTheme.primaryBlue + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 20,
    },
    content: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.textDark,
        marginBottom: 8,
    },
    pinInput: {
        borderWidth: 1,
        borderColor: AppTheme.divider,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        textAlign: 'center',
        letterSpacing: 4,
        backgroundColor: AppTheme.backgroundLight,
    },
    pinInputError: {
        borderColor: AppTheme.errorRed,
    },
    errorText: {
        fontSize: 12,
        color: AppTheme.errorRed,
        marginTop: 4,
        textAlign: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    cancelButton: {
        backgroundColor: AppTheme.backgroundLight,
        borderWidth: 1,
        borderColor: AppTheme.divider,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: AppTheme.textMedium,
    },
    confirmButton: {
        backgroundColor: AppTheme.primaryBlue,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: 'white',
    },
    disabledButton: {
        backgroundColor: AppTheme.textMedium,
    },
}); 