import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AppTheme } from '../constants/theme';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary';
    style?: any;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    variant = 'primary',
    style,
}) => {
    const buttonStyle = [
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton,
        style,
    ];

    const textStyle = [
        styles.text,
        variant === 'primary' ? styles.primaryText : styles.secondaryText,
        disabled && styles.disabledText,
    ];

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? 'white' : AppTheme.primaryBlue}
                    size="small"
                />
            ) : (
                <Text style={textStyle}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    primaryButton: {
        backgroundColor: AppTheme.primaryBlue,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: AppTheme.primaryBlue,
    },
    disabledButton: {
        backgroundColor: AppTheme.textMedium,
        borderColor: AppTheme.textMedium,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: 'white',
    },
    secondaryText: {
        color: AppTheme.primaryBlue,
    },
    disabledText: {
        color: 'white',
    },
}); 