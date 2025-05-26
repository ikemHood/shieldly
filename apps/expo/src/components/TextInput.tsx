import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';

interface TextInputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    error?: string;
    disabled?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
}

export const TextInput: React.FC<TextInputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = 'default',
    error,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const inputStyle = [
        styles.input,
        isFocused && styles.focusedInput,
        error && styles.errorInput,
        disabled && styles.disabledInput,
        multiline && styles.multilineInput,
    ];

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputContainer}>
                <RNTextInput
                    style={inputStyle}
                    placeholder={placeholder}
                    placeholderTextColor={AppTheme.textMedium}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    keyboardType={keyboardType}
                    editable={!disabled}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={togglePasswordVisibility}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={20}
                            color={AppTheme.textMedium}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: AppTheme.textDark,
        marginBottom: 8,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderColor: AppTheme.divider,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: AppTheme.textDark,
        backgroundColor: AppTheme.backgroundWhite,
    },
    focusedInput: {
        borderColor: AppTheme.primaryBlue,
    },
    errorInput: {
        borderColor: AppTheme.errorRed,
    },
    disabledInput: {
        backgroundColor: AppTheme.backgroundLight,
        color: AppTheme.textMedium,
    },
    multilineInput: {
        height: 100,
        paddingTop: 16,
        textAlignVertical: 'top',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 18,
    },
    errorText: {
        fontSize: 12,
        color: AppTheme.errorRed,
        marginTop: 4,
    },
}); 