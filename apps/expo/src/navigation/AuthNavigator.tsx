import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
// import { SessionPinSetupScreen } from '../screens/auth/SessionPinSetupScreen';
import { SessionPinInputScreen } from '../screens/auth/SessionPinInputScreen';
import { SetSessionPinScreen } from '../screens/auth/SetSessionPinScreen';
import { WalletCreationScreen } from '../screens/auth/WalletCreationScreen';

export type AuthStackParamList = {
    Splash: undefined;
    Login: undefined;
    Signup: undefined;
    OTPVerification: { email?: string; phoneNumber?: string; type?: 'signup' | 'password_reset' };
    ForgotPassword: undefined;
    ResetPassword: { email: string; token: string };
    SessionPinSetup: undefined;
    SessionPinInput: undefined;
    SetSessionPin: { userId: number };
    WalletCreation: { userId: number };
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            {/* <Stack.Screen name="SessionPinSetup" component={SessionPinSetupScreen} /> */}
            <Stack.Screen name="SessionPinInput" component={SessionPinInputScreen} />
            <Stack.Screen name="SetSessionPin" component={SetSessionPinScreen} />
            <Stack.Screen name="WalletCreation" component={WalletCreationScreen} />
        </Stack.Navigator>
    );
}; 