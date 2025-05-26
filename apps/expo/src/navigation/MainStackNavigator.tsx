import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabNavigator } from './MainTabNavigator';
import { NotificationScreen } from '../screens/main/NotificationScreen';
import { AppTheme } from '../constants/theme';

export type MainStackParamList = {
    MainTabs: undefined;
    Notifications: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export const MainStackNavigator: React.FC = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationScreen}
                options={({ navigation }) => ({
                    title: '',
                    headerStyle: {
                        backgroundColor: AppTheme.backgroundLight,
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 0,
                    },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ marginLeft: 16, padding: 8 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={AppTheme.textDark} />
                        </TouchableOpacity>
                    ),
                })}
            />
        </Stack.Navigator>
    );
}; 