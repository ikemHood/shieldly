import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { AppTheme } from '../constants/theme';

interface OTPInputProps {
    length: number;
    onComplete: (otp: string) => void;
    onChangeText?: (otp: string) => void;
    value?: string;
    autoFocus?: boolean;
    secureTextEntry?: boolean;
    disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    length,
    onComplete,
    onChangeText,
    value,
    autoFocus = false,
    secureTextEntry = false,
    disabled = false,
}) => {
    // Use a function for initial state to avoid recalculation on every render
    const [otp, setOtp] = useState<string[]>(() => {
        if (value) {
            const valueArray = value.split('');
            return valueArray.concat(new Array(Math.max(0, length - valueArray.length)).fill(''));
        }
        return new Array(length).fill('');
    });
    const inputRefs = useRef<TextInput[]>([]);

    // Memoize the callback functions to prevent infinite loops
    const handleComplete = useCallback((otpString: string) => {
        onComplete(otpString);
    }, [onComplete]);

    const handleChangeText = useCallback((otpString: string) => {
        onChangeText?.(otpString);
    }, [onChangeText]);

    useEffect(() => {
        if (value !== undefined) {
            const valueArray = value.split('');
            const newOtp = valueArray.concat(new Array(Math.max(0, length - valueArray.length)).fill(''));

            // Only update if the new OTP is different from current
            setOtp(prevOtp => {
                const prevString = prevOtp.join('');
                const newString = newOtp.join('');
                return prevString !== newString ? newOtp : prevOtp;
            });
        }
    }, [value, length]);

    useEffect(() => {
        const otpString = otp.join('');

        // Only call onChangeText if it exists
        if (onChangeText) {
            handleChangeText(otpString);
        }

        // Only call onComplete when we have a complete OTP
        if (otpString.length === length && otpString.replace(/\s/g, '').length === length) {
            handleComplete(otpString);
        }
    }, [otp, length, handleComplete, handleChangeText, onChangeText]);

    const handleInputChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            {Array.from({ length }, (_, index) => (
                <TextInput
                    key={index}
                    ref={(ref) => {
                        if (ref) inputRefs.current[index] = ref;
                    }}
                    style={[
                        styles.input,
                        otp[index] ? styles.filledInput : styles.emptyInput,
                    ]}
                    value={otp[index]}
                    onChangeText={(text) => handleInputChange(text, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={autoFocus && index === 0}
                    secureTextEntry={secureTextEntry}
                    editable={!disabled}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    input: {
        flex: 1,
        height: 56,
        borderWidth: 2,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600',
        color: AppTheme.textDark,
    },
    emptyInput: {
        borderColor: AppTheme.divider,
        backgroundColor: AppTheme.backgroundWhite,
    },
    filledInput: {
        borderColor: AppTheme.primaryBlue,
        backgroundColor: AppTheme.backgroundWhite,
    },
}); 