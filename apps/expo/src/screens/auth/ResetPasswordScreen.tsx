import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextInput } from '../../components/TextInput';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';

type ResetPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}

export const ResetPasswordScreen: React.FC = () => {
    const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
    const route = useRoute<ResetPasswordScreenRouteProp>();
    const { email, token } = route.params;
    const [isLoading, setIsLoading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<ResetPasswordFormData>({
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const password = watch('password');

    const onSubmit = async (data: ResetPasswordFormData) => {
        try {
            setIsLoading(true);

            // TODO: Implement actual password reset API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            showToast.success(
                'Your password has been reset successfully. You can now sign in with your new password.',
                'Password Reset Complete'
            );

            // Navigate back to login
            navigation.navigate('Login');
        } catch (error) {
            showToast.error('Failed to reset password. Please try again.', 'Error');
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
                        <Ionicons name="key" size={48} color={AppTheme.primaryBlue} />
                    </View>

                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Create a new password for your account
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Controller
                        control={control}
                        name="password"
                        rules={{
                            required: 'Password is required',
                            minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters',
                            },
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Password must contain uppercase, lowercase, and number',
                            },
                        }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label="New Password"
                                placeholder="Create a strong password"
                                value={value}
                                onChangeText={onChange}
                                secureTextEntry
                                error={errors.password?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="confirmPassword"
                        rules={{
                            required: 'Please confirm your password',
                            validate: (value) =>
                                value === password || 'Passwords do not match',
                        }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                label="Confirm New Password"
                                placeholder="Confirm your password"
                                value={value}
                                onChangeText={onChange}
                                secureTextEntry
                                error={errors.confirmPassword?.message}
                            />
                        )}
                    />

                    {/* Password Requirements */}
                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementsTitle}>Password must contain:</Text>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"}
                                size={16}
                                color={password.length >= 8 ? AppTheme.successGreen : AppTheme.textMedium}
                            />
                            <Text style={[styles.requirementText, password.length >= 8 && styles.requirementMet]}>
                                At least 8 characters
                            </Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                                size={16}
                                color={/[A-Z]/.test(password) ? AppTheme.successGreen : AppTheme.textMedium}
                            />
                            <Text style={[styles.requirementText, /[A-Z]/.test(password) && styles.requirementMet]}>
                                One uppercase letter
                            </Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={/[a-z]/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                                size={16}
                                color={/[a-z]/.test(password) ? AppTheme.successGreen : AppTheme.textMedium}
                            />
                            <Text style={[styles.requirementText, /[a-z]/.test(password) && styles.requirementMet]}>
                                One lowercase letter
                            </Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={/\d/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                                size={16}
                                color={/\d/.test(password) ? AppTheme.successGreen : AppTheme.textMedium}
                            />
                            <Text style={[styles.requirementText, /\d/.test(password) && styles.requirementMet]}>
                                One number
                            </Text>
                        </View>
                    </View>

                    <PrimaryButton
                        title="Reset Password"
                        onPress={handleSubmit(onSubmit)}
                        loading={isLoading}
                        style={styles.submitButton}
                    />
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
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        flex: 1,
    },
    requirementsContainer: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppTheme.divider,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: AppTheme.textDark,
        marginBottom: 12,
    },
    requirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    requirementText: {
        fontSize: 14,
        color: AppTheme.textMedium,
    },
    requirementMet: {
        color: AppTheme.successGreen,
    },
    submitButton: {
        marginTop: 'auto',
        marginBottom: 24,
    },
}); 