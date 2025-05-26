export interface User {
    id: string;
    email: string;
    name?: string;
    phoneNumber?: string;
    walletAddress?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: Date;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    requiresPinAuth?: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    name: string;
    email: string;
    password: string;
    acceptTerms: boolean;
}

export interface PhoneLoginRequest {
    phoneNumber: string;
    countryCode: string;
}

export interface OTPVerificationRequest {
    phoneNumber?: string;
    email?: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    token: string;
    newPassword: string;
}

export interface SessionPinRequest {
    pin: string;
}

export interface BiometricAuthRequest {
    promptMessage: string;
}

export type AuthMethod = 'email' | 'phone' | 'google' | 'apple';

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
}

export interface WalletCreationData {
    address: string;
    encryptedPrivateKey: string;
    publicKey: string;
} 