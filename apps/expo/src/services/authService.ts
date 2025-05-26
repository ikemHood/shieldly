import { apiService, handleApiError, ApiError } from './api';
import * as SecureStore from 'expo-secure-store';

export interface RegisterRequest {
    name: string;
    email?: string;
    phone?: string;
    password: string;
}

export interface RegisterResponse {
    message: string;
    userId: number;
    isResend?: boolean;
}

export interface VerifyOtpRequest {
    email?: string;
    phone?: string;
    otp: string;
}

export interface VerifyOtpResponse {
    message: string;
    userId: number;
    hasWallet: boolean;
    verificationToken: string;
}

export interface SetSessionPasswordRequest {
    userId: number;
    sessionPassword: string;
    deviceId?: string;
}

export interface SetSessionPasswordResponse {
    message: string;
    sessionId: number;
    refreshToken: string;
    accessToken: string;
}

export interface SetWalletPinRequest {
    userId: number;
    walletPin: string;
}

export interface SetWalletPinResponse {
    message: string;
    publicKey: string;
    walletSecret: string;
}

export interface LoginRequest {
    email?: string;
    phone?: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    userId: number;
    hasWallet: boolean;
}

export interface RefreshTokenRequest {
    refreshToken: string;
    sessionPassword: string;
}

export interface RefreshTokenResponse {
    userId: number;
    accessToken: string;
    refreshToken: string;
}

export interface LogoutRequest {
    refreshToken: string;
}

const STORAGE_KEYS = {
    USER_ID: 'user_id',
    SESSION_ID: 'session_id',
    REFRESH_TOKEN: 'refresh_token',
    SESSION_PASSWORD: 'session_password',
    ACCESS_TOKEN: 'access_token',
    WALLET_PUBLIC_KEY: 'wallet_public_key',
    WALLET_SECRET: 'wallet_secret',
    USER_EMAIL: 'user_email',
    USER_PHONE: 'user_phone',
    USER_NAME: 'user_name',
    VERIFICATION_TOKEN: 'verification_token',
} as const;

class AuthService {
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        try {
            const response = await apiService.post<RegisterResponse>('/auth/register', data);

            // Store user identifier for OTP verification
            if (data.email) {
                await SecureStore.setItemAsync(STORAGE_KEYS.USER_EMAIL, data.email);
            }
            if (data.phone) {
                await SecureStore.setItemAsync(STORAGE_KEYS.USER_PHONE, data.phone);
            }
            if (data.name) {
                await SecureStore.setItemAsync(STORAGE_KEYS.USER_NAME, data.name);
            }

            return response;
        } catch (error) {
            throw handleApiError(error as ApiError);
        }
    }

    async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        try {
            const response = await apiService.post<VerifyOtpResponse>('/auth/verify-otp', data);

            await Promise.all([
                SecureStore.setItemAsync(STORAGE_KEYS.USER_ID, response.userId.toString()),
                SecureStore.setItemAsync(STORAGE_KEYS.VERIFICATION_TOKEN, response.verificationToken),
            ]);

            return response;
        } catch (error) {
            throw handleApiError(error as ApiError);
        }
    }

    async setSessionPassword(data: SetSessionPasswordRequest): Promise<SetSessionPasswordResponse> {
        try {
            // Get verification token from storage
            const verificationToken = await SecureStore.getItemAsync(STORAGE_KEYS.VERIFICATION_TOKEN);
            if (!verificationToken) {
                throw new Error('No verification token found');
            }

            const response = await apiService.post<SetSessionPasswordResponse>('/auth/set-session-password', {
                ...data,
                verificationToken,
            });

            // Store session data securely
            await Promise.all([
                SecureStore.setItemAsync(STORAGE_KEYS.SESSION_ID, response.sessionId.toString()),
                SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken),
                SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken),
                SecureStore.setItemAsync(STORAGE_KEYS.SESSION_PASSWORD, data.sessionPassword),
                SecureStore.deleteItemAsync(STORAGE_KEYS.VERIFICATION_TOKEN), // Clear used token
            ]);

            // Set auth token for future requests
            apiService.setAuthToken(response.accessToken);

            return response;
        } catch (error) {
            throw handleApiError(error as ApiError);
        }
    }

    async setWalletPin(data: SetWalletPinRequest): Promise<SetWalletPinResponse> {
        try {
            // Ensure we have a valid access token
            const hasValidToken = await this.ensureValidToken();
            if (!hasValidToken) {
                throw new Error('Unable to authenticate request');
            }

            const response = await apiService.post<SetWalletPinResponse>('/auth/set-wallet-pin', data);

            // Store wallet data securely
            await Promise.all([
                SecureStore.setItemAsync(STORAGE_KEYS.WALLET_PUBLIC_KEY, response.publicKey),
                SecureStore.setItemAsync(STORAGE_KEYS.WALLET_SECRET, response.walletSecret),
            ]);

            return response;
        } catch (error) {
            throw handleApiError(error as ApiError);
        }
    }

    // Login user
    async login(data: LoginRequest): Promise<LoginResponse> {
        try {
            const response = await apiService.post<LoginResponse>('/auth/login', data);

            // Store user ID and identifier for session creation
            await SecureStore.setItemAsync(STORAGE_KEYS.USER_ID, response.userId.toString());
            if (data.email) {
                await SecureStore.setItemAsync(STORAGE_KEYS.USER_EMAIL, data.email);
            }
            if (data.phone) {
                await SecureStore.setItemAsync(STORAGE_KEYS.USER_PHONE, data.phone);
            }

            return response;
        } catch (error) {
            throw handleApiError(error as ApiError);
        }
    }

    // Refresh session tokens
    async refreshSession(): Promise<RefreshTokenResponse> {
        try {
            const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
            const sessionPassword = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION_PASSWORD);

            if (!refreshToken || !sessionPassword) {
                throw new Error('No valid session found');
            }

            const response = await apiService.post<RefreshTokenResponse>('/auth/refresh', {
                refreshToken,
                sessionPassword,
            });

            // Update stored tokens
            await Promise.all([
                SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken),
                SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken),
            ]);

            // Set auth token for future requests
            apiService.setAuthToken(response.accessToken);

            return response;
        } catch (error) {
            throw handleApiError(error as ApiError);
        }
    }

    // Logout user
    async logout(): Promise<void> {
        try {
            const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

            if (refreshToken) {
                await apiService.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
            // Continue with local cleanup even if API call fails
        } finally {
            // Clear all stored data
            await this.clearStoredData();
            apiService.removeAuthToken();
        }
    }

    // Check if user is authenticated
    async isAuthenticated(): Promise<boolean> {
        try {
            const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
            const sessionPassword = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION_PASSWORD);

            return !!(refreshToken && sessionPassword);
        } catch (error) {
            return false;
        }
    }

    // Check if user has completed wallet setup
    async hasWallet(): Promise<boolean> {
        try {
            const publicKey = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET_PUBLIC_KEY);
            return !!publicKey;
        } catch (error) {
            return false;
        }
    }

    // Get stored user data
    async getStoredUserData() {
        try {
            const [userId, email, phone, name, publicKey] = await Promise.all([
                SecureStore.getItemAsync(STORAGE_KEYS.USER_ID),
                SecureStore.getItemAsync(STORAGE_KEYS.USER_EMAIL),
                SecureStore.getItemAsync(STORAGE_KEYS.USER_PHONE),
                SecureStore.getItemAsync(STORAGE_KEYS.USER_NAME),
                SecureStore.getItemAsync(STORAGE_KEYS.WALLET_PUBLIC_KEY),
            ]);

            return {
                userId: userId ? parseInt(userId) : null,
                email,
                phone,
                name,
                publicKey,
            };
        } catch (error) {
            return {
                userId: null,
                email: null,
                phone: null,
                name: null,
                publicKey: null,
            };
        }
    }

    // Verify session password (for app unlock)
    async verifySessionPassword(inputPassword: string): Promise<boolean> {
        try {
            const storedPassword = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION_PASSWORD);
            return storedPassword === inputPassword;
        } catch (error) {
            return false;
        }
    }

    // Initialize auth state (call on app start)
    async initializeAuth(): Promise<boolean> {
        try {
            const isAuth = await this.isAuthenticated();

            if (isAuth) {
                // Try to refresh tokens
                await this.refreshSession();
                return true;
            }

            return false;
        } catch (error) {
            console.warn('Auth initialization failed:', error);
            // Clear potentially corrupted data
            await this.clearStoredData();
            return false;
        }
    }

    // Handle app resume - refresh tokens with session PIN
    async handleAppResume(sessionPin: string): Promise<boolean> {
        try {
            // Verify session password first
            const isValidPin = await this.verifySessionPassword(sessionPin);
            if (!isValidPin) {
                throw new Error('Invalid session PIN');
            }

            // Refresh tokens
            await this.refreshSession();
            return true;
        } catch (error) {
            console.warn('App resume auth failed:', error);
            return false;
        }
    }

    // Auto-refresh tokens if needed (call before making authenticated requests)
    async ensureValidToken(): Promise<boolean> {
        try {
            const accessToken = await this.getAccessToken();

            if (!accessToken) {
                // No access token, try to refresh
                await this.refreshSession();
                return true;
            }

            // Set the token for API requests
            apiService.setAuthToken(accessToken);
            return true;
        } catch (error) {
            console.warn('Token refresh failed:', error);
            return false;
        }
    }

    // Clear all stored authentication data
    private async clearStoredData(): Promise<void> {
        const keys = Object.values(STORAGE_KEYS);
        await Promise.all(
            keys.map(key =>
                SecureStore.deleteItemAsync(key).catch(() => {
                    // Ignore errors when deleting non-existent keys
                })
            )
        );
    }

    // Get current access token
    async getAccessToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        } catch (error) {
            return null;
        }
    }

    // Resend OTP (for both register and login flows)
    async resendOtp(email?: string, phone?: string): Promise<{ message: string }> {
        try {
            // Use stored email/phone if not provided
            const userEmail = email || await SecureStore.getItemAsync(STORAGE_KEYS.USER_EMAIL);
            const userPhone = phone || await SecureStore.getItemAsync(STORAGE_KEYS.USER_PHONE);

            if (!userEmail && !userPhone) {
                throw new Error('No email or phone found for OTP resend');
            }

            const response = await apiService.post<{ message: string }>('/auth/resend-otp', {
                email: userEmail || undefined,
                phone: userPhone || undefined,
            });

            return response;
        } catch (error) {
            throw handleApiError(error as ApiError);
        }
    }
}

export const authService = new AuthService(); 