import type { NavigatorScreenParams } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack
export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    OTPVerification: { email: string };
    ForgotPassword: undefined;
    SessionPin: undefined;
    SetSessionPin: { userId: number; hasWallet: boolean };
    WalletCreation: { userId: number };
};

// Main Tab Navigator
export type MainTabParamList = {
    Home: undefined;
    Insure: NavigatorScreenParams<InsuranceStackParamList>;
    Claim: undefined;
    Profile: undefined;
};

// Insurance Stack
export type InsuranceStackParamList = {
    InsuranceList: undefined;
    PolicyDetails: { policyId: string };
};

// Main Stack (for modals and other screens)
export type MainStackParamList = {
    MainTabs: NavigatorScreenParams<MainTabParamList>;
    Notifications: undefined;
};

// Root Stack
export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainStackParamList>;
};

// Screen props types
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
    AuthStackParamList,
    T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
    MainTabParamList,
    T
>;

export type InsuranceStackScreenProps<T extends keyof InsuranceStackParamList> = StackScreenProps<
    InsuranceStackParamList,
    T
>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = StackScreenProps<
    MainStackParamList,
    T
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
    RootStackParamList,
    T
>; 