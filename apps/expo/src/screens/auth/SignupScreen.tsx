import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { AuthStackParamList } from '../../types/navigation';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextInput } from '../../components/TextInput';
import { AppTheme } from '../../constants/theme';
import { authService } from '../../services/authService';
import { showToast } from '../../utils/toast';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

interface SignupFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}

export const SignupScreen: React.FC = () => {
    const navigation = useNavigation<SignupScreenNavigationProp>();
    const [isLoading, setIsLoading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<SignupFormData>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            acceptTerms: false,
        },
    });

    const password = watch('password');
    const confirmPassword = watch('confirmPassword');

    const onSubmit = async (data: SignupFormData) => {
        if (!acceptTerms) {
            showToast.warning('Please accept the terms and conditions to continue.', 'Terms Required');
            return;
        }

        try {
            setIsLoading(true);
            await authService.register({
                name: data.name,
                email: data.email,
                password: data.password,
            });

            showToast.success('Account created! Please verify your email.');
            navigation.navigate('OTPVerification', { email: data.email });
        } catch (error) {
            showToast.error('Please try again.', 'Signup Failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    const handleSocialSignup = (provider: 'google' | 'apple') => {
        // TODO: Implement social signup
        showToast.comingSoon(`${provider} signup`);
    };

    const validatePassword = (value: string) => {
        if (value.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/(?=.*[a-z])/.test(value)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(value)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(value)) {
            return 'Password must contain at least one number';
        }
        return true;
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={AppTheme.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join Shieldly and protect what matters</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Controller
                        control={control}
                        name="name"
                        rules={{
                            required: 'Full name is required',
                            minLength: {
                                value: 2,
                                message: 'Name must be at least 2 characters',
                            },
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label="Full Name"
                                placeholder="Enter your full name"
                                value={value}
                                onChangeText={onChange}
                                error={errors.name?.message}
                            />
                        )}
                    />

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
                                placeholder="Enter your email"
                                value={value}
                                onChangeText={onChange}
                                keyboardType="email-address"
                                error={errors.email?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="password"
                        rules={{
                            required: 'Password is required',
                            validate: validatePassword,
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label="Password"
                                placeholder="Create a strong password"
                                value={value}
                                onChangeText={(text) => {
                                    onChange(text);
                                    if (text.length > 0) {
                                        setShowPasswordRequirements(true);
                                    }
                                }}
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
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                value={value}
                                onChangeText={(text) => {
                                    onChange(text);
                                    if (text.length > 0) {
                                        setShowPasswordRequirements(false);
                                    }
                                }}
                                secureTextEntry
                                error={errors.confirmPassword?.message}
                            />
                        )}
                    />

                    {/* Password Requirements */}
                    {showPasswordRequirements && password && (
                        <View style={styles.passwordRequirements}>
                            <Text style={styles.requirementsTitle}>Password must contain:</Text>
                            <View style={styles.requirement}>
                                <Ionicons
                                    name={password && password.length >= 8 ? "checkmark-circle" : "ellipse-outline"}
                                    size={16}
                                    color={password && password.length >= 8 ? AppTheme.successGreen : AppTheme.textMedium}
                                />
                                <Text style={[styles.requirementText, password && password.length >= 8 && styles.requirementMet]}>
                                    At least 8 characters
                                </Text>
                            </View>
                            <View style={styles.requirement}>
                                <Ionicons
                                    name={password && /(?=.*[a-z])/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                                    size={16}
                                    color={password && /(?=.*[a-z])/.test(password) ? AppTheme.successGreen : AppTheme.textMedium}
                                />
                                <Text style={[styles.requirementText, password && /(?=.*[a-z])/.test(password) && styles.requirementMet]}>
                                    One lowercase letter
                                </Text>
                            </View>
                            <View style={styles.requirement}>
                                <Ionicons
                                    name={password && /(?=.*[A-Z])/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                                    size={16}
                                    color={password && /(?=.*[A-Z])/.test(password) ? AppTheme.successGreen : AppTheme.textMedium}
                                />
                                <Text style={[styles.requirementText, password && /(?=.*[A-Z])/.test(password) && styles.requirementMet]}>
                                    One uppercase letter
                                </Text>
                            </View>
                            <View style={styles.requirement}>
                                <Ionicons
                                    name={password && /(?=.*\d)/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                                    size={16}
                                    color={password && /(?=.*\d)/.test(password) ? AppTheme.successGreen : AppTheme.textMedium}
                                />
                                <Text style={[styles.requirementText, password && /(?=.*\d)/.test(password) && styles.requirementMet]}>
                                    One number
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Terms and Conditions */}
                    <TouchableOpacity
                        style={styles.termsContainer}
                        onPress={() => setAcceptTerms(!acceptTerms)}
                    >
                        <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                            {acceptTerms && (
                                <Ionicons name="checkmark" size={16} color="white" />
                            )}
                        </View>
                        <Text style={styles.termsText}>
                            I agree to the{' '}
                            <Text style={styles.termsLink}>Terms of Service</Text>
                            {' '}and{' '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>
                    </TouchableOpacity>

                    <PrimaryButton
                        title="Create Account"
                        onPress={handleSubmit(onSubmit)}
                        loading={isLoading}
                        style={styles.signupButton}
                    />
                </View>

                {/* Social Signup */}
                <View style={styles.socialSection}>
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>Or sign up with</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialButtons}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialSignup('google')}
                        >
                            <Ionicons name="logo-google" size={20} color="#DB4437" />
                            <Text style={styles.socialButtonText}>Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialSignup('apple')}
                        >
                            <Ionicons name="logo-apple" size={20} color="#000" />
                            <Text style={styles.socialButtonText}>Apple</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Login Link */}
                <View style={styles.loginSection}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={handleLogin}>
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundLight,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    backButton: {
        position: 'absolute',
        left: 24,
        top: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: AppTheme.primaryBlue,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
    },
    form: {
        marginBottom: 32,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: AppTheme.divider,
        borderRadius: 4,
        marginRight: 12,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: AppTheme.primaryBlue,
        borderColor: AppTheme.primaryBlue,
    },
    termsText: {
        flex: 1,
        fontSize: 14,
        color: AppTheme.textMedium,
        lineHeight: 20,
    },
    termsLink: {
        color: AppTheme.primaryBlue,
        fontWeight: '500',
    },
    signupButton: {
        marginBottom: 16,
    },
    socialSection: {
        marginBottom: 32,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: AppTheme.divider,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: AppTheme.textMedium,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppTheme.divider,
        gap: 8,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: AppTheme.textDark,
    },
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
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
    passwordRequirements: {
        marginBottom: 24,
    },
    requirementsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 8,
    },
    requirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requirementText: {
        flex: 1,
        fontSize: 14,
        color: AppTheme.textMedium,
    },
    requirementMet: {
        fontWeight: 'bold',
        color: AppTheme.successGreen,
    },
}); 