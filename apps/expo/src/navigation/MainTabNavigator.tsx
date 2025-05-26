import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../constants/theme';
import { HomeScreen } from '../screens/main/HomeScreen';
import { InsuranceStackNavigator } from './InsuranceStackNavigator';
import { ClaimsScreen } from '../screens/main/ClaimsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

export type MainTabParamList = {
    Home: undefined;
    Insure: undefined;
    Claim: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface CustomTabBarIconProps {
    focused: boolean;
    color: string;
    size: number;
    iconName: keyof typeof Ionicons.glyphMap;
    label: string;
}

const CustomTabBarIcon: React.FC<CustomTabBarIconProps> = ({
    focused,
    color,
    size,
    iconName,
    label
}) => {
    const scaleValue = React.useRef(new Animated.Value(focused ? 1 : 0.8)).current;
    const opacityValue = React.useRef(new Animated.Value(focused ? 1 : 0.6)).current;
    const backgroundScale = React.useRef(new Animated.Value(focused ? 1 : 0)).current;
    const textOpacity = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: focused ? 1 : 0.8,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }),
            Animated.timing(opacityValue, {
                toValue: focused ? 1 : 0.6,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(backgroundScale, {
                toValue: focused ? 1 : 0,
                useNativeDriver: true,
                tension: 200,
                friction: 8,
            }),
            Animated.timing(textOpacity, {
                toValue: focused ? 1 : 0,
                duration: focused ? 300 : 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, [focused, scaleValue, opacityValue, backgroundScale, textOpacity]);

    if (focused) {
        return (
            <Animated.View
                style={[
                    styles.activeTabContainer,
                    {
                        transform: [
                            { scale: scaleValue },
                            { scaleX: backgroundScale }
                        ],
                        opacity: opacityValue,
                    }
                ]}
            >
                <Ionicons name={iconName} size={size} color={color} />
                <Animated.Text
                    style={[
                        styles.activeTabText,
                        {
                            color,
                            opacity: textOpacity,
                            transform: [{ scale: textOpacity }]
                        }
                    ]}
                >
                    {label}
                </Animated.Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
            }}
        >
            <Ionicons name={iconName} size={size} color={color} />
        </Animated.View>
    );
};

export const MainTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;
                    let label: string;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            label = 'Home';
                            break;
                        case 'Insure':
                            iconName = focused ? 'shield' : 'shield-outline';
                            label = 'Insure';
                            break;
                        case 'Claim':
                            iconName = focused ? 'document-text' : 'document-text-outline';
                            label = 'Claim';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            label = 'Profile';
                            break;
                        default:
                            iconName = 'ellipse';
                            label = '';
                    }

                    return (
                        <CustomTabBarIcon
                            focused={focused}
                            color={color}
                            size={size}
                            iconName={iconName}
                            label={label}
                        />
                    );
                },
                tabBarActiveTintColor: AppTheme.primaryBlue,
                tabBarInactiveTintColor: AppTheme.textMedium,
                tabBarStyle: {
                    backgroundColor: AppTheme.backgroundWhite,
                    borderTopColor: AppTheme.divider,
                    borderTopWidth: 0.5,
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 50,
                    paddingHorizontal: 16,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: -2,
                    },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 10,
                },
                tabBarShowLabel: false, // Hide default labels since we're using custom ones
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Insure" component={InsuranceStackNavigator} />
            <Tab.Screen name="Claim" component={ClaimsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    activeTabContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppTheme.primaryBlue + '15',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
        minWidth: 80,
        height: 40,
        shadowColor: AppTheme.primaryBlue,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    activeTabText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 2,
    },
}); 