import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextInput } from '../../components/TextInput';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface ForgotPasswordFormData {
    email: string;
}

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
    const [isLoading, setIsLoading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            setIsLoading(true);

            // TODO: Implement actual forgot password API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            showToast.success(
                `We've sent a reset code to ${data.email}. Please check your email and follow the instructions.`,
                'Reset Code Sent'
            );

            // Navigate to OTP verification
            navigation.navigate('OTPVerification', {
                email: data.email,
                type: 'password_reset',
            });
        } catch (error) {
            showToast.error('Failed to send reset code. Please try again.', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
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

                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.description}>
                        No worries! Enter your email address and we'll send you a reset code.
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Controller
                        control={control}
                        name="email"
                        rules={{
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address',
                            },
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label="Email"
                                placeholder="Enter your email address"
                                value={value}
                                onChangeText={onChange}
                                keyboardType="email-address"
                                error={errors.email?.message}
                            />
                        )}
                    />

                    <PrimaryButton
                        title="Send Reset Code"
                        onPress={handleSubmit(onSubmit)}
                        loading={isLoading}
                        style={styles.submitButton}
                    />
                </View>

                {/* Back to Login */}
                <View style={styles.loginSection}>
                    <Text style={styles.loginText}>Remember your password? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>

                {/* Help Text */}
                <View style={styles.helpSection}>
                    <Ionicons name="information-circle-outline" size={16} color={AppTheme.textMedium} />
                    <Text style={styles.helpText}>
                        If you don't receive an email, check your spam folder or contact support
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
        marginTop: 60,
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
        paddingHorizontal: 20,
    },
    form: {
        marginBottom: 32,
    },
    submitButton: {
        marginTop: 8,
    },
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    loginText: {
        fontSize: 16,
        color: AppTheme.textMedium,
    },
    loginLink: {
        fontSize: 16,
        color: AppTheme.primaryBlue,
        fontWeight: '600',
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