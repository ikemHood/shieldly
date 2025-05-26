import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';
import { InsuranceScreen } from '../screens/main/InsuranceScreen';
import { PolicyCatalogScreen } from '../screens/main/PolicyCatalogScreen';
import { MyPoliciesScreen } from '../screens/main/MyPoliciesScreen';

export type InsuranceStackParamList = {
    InsuranceMain: undefined;
    PolicyCatalog: undefined;
    MyPolicies: undefined;
};

const Stack = createStackNavigator<InsuranceStackParamList>();

export const InsuranceStackNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={({ navigation }) => ({
                headerStyle: {
                    backgroundColor: AppTheme.backgroundWhite,
                    shadowColor: 'transparent',
                    elevation: 0,
                },
                headerTitleStyle: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: AppTheme.textDark,
                },
                headerTintColor: AppTheme.primaryBlue,
                headerBackTitleVisible: false,
                headerLeftContainerStyle: {
                    paddingLeft: 16,
                },
                headerRightContainerStyle: {
                    paddingRight: 16,
                },
            })}
        >
            <Stack.Screen
                name="InsuranceMain"
                component={InsuranceScreen}
                options={({ navigation }) => ({
                    title: 'Insurance',
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('MyPolicies')}
                            style={{ padding: 4 }}
                        >
                            <Ionicons name="list" size={24} color={AppTheme.primaryBlue} />
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen
                name="PolicyCatalog"
                component={PolicyCatalogScreen}
                options={{
                    title: 'Policy Catalog',
                }}
            />
            <Stack.Screen
                name="MyPolicies"
                component={MyPoliciesScreen}
                options={{
                    title: 'My Policies',
                }}
            />
        </Stack.Navigator>
    );
}; 