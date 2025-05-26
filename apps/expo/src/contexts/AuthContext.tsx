import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState } from 'react-native';
import { AuthState, User, LoginCredentials, SignupCredentials } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
    state: AuthState;
    dispatch: React.Dispatch<AuthAction>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
    completeAuth: () => Promise<void>;
    handleAppResume: (sessionPin: string) => Promise<boolean>;
}

type AuthAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_USER'; payload: User | null }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_AUTHENTICATED'; payload: boolean }
    | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
    | { type: 'LOGOUT' };

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_AUTHENTICATED':
            return { ...state, isAuthenticated: action.payload };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        default:
            return state;
    }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const checkAuthState = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const isAuthenticated = await authService.initializeAuth();

            if (isAuthenticated) {
                const userData = await authService.getStoredUserData();
                if (userData.userId) {
                    const user: User = {
                        id: userData.userId.toString(),
                        email: userData.email || '',
                        name: userData.name || '',
                        isEmailVerified: true,
                        isPhoneVerified: !!userData.phone,
                        createdAt: new Date(),
                    };
                    dispatch({ type: 'SET_USER', payload: user });
                    dispatch({ type: 'SET_AUTHENTICATED', payload: true });
                } else {
                    dispatch({ type: 'SET_AUTHENTICATED', payload: false });
                }
            } else {
                dispatch({ type: 'SET_AUTHENTICATED', payload: false });
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to check authentication state' });
            dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        checkAuthState();

        // Handle app state changes for token refresh
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'active' && state.isAuthenticated) {
                // App came to foreground, refresh auth state
                checkAuthState();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [state.isAuthenticated]);

    const logout = async () => {
        try {
            await authService.logout();
            dispatch({ type: 'SET_USER', payload: null });
            dispatch({ type: 'SET_AUTHENTICATED', payload: false });
            dispatch({ type: 'SET_ERROR', payload: null });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const refreshAuth = async () => {
        await checkAuthState();
    };

    const completeAuth = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            // Refresh auth state after completing setup
            await checkAuthState();
        } catch (error) {
            console.error('Error completing authentication:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to complete authentication' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleAppResume = async (sessionPin: string): Promise<boolean> => {
        try {
            const success = await authService.handleAppResume(sessionPin);
            if (success) {
                await checkAuthState();
            }
            return success;
        } catch (error) {
            console.error('Error handling app resume:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                state,
                dispatch,
                logout,
                refreshAuth,
                completeAuth,
                handleAppResume,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 