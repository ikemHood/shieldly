import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';
import { SessionPinInputScreen } from '../screens/auth/SessionPinInputScreen';
import { useAuth } from '../hooks/useAuth';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AppTheme } from '../constants/theme';

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    SessionPinInput: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppTheme.primaryBlue} />
        <Text style={styles.loadingText}>Loading...</Text>
    </View>
);

export const AppNavigator: React.FC = () => {
    const { state } = useAuth();

    if (state.isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {state.isAuthenticated ? (
                    <Stack.Screen name="Main" component={MainStackNavigator} />
                ) : state.requiresPinAuth ? (
                    <Stack.Screen name="SessionPinInput" component={SessionPinInputScreen} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppTheme.backgroundLight,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: AppTheme.textMedium,
    },
}); 