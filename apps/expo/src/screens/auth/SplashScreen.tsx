import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AppTheme } from '../../constants/theme';

type SplashScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
    const navigation = useNavigation<SplashScreenNavigationProp>();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>S</Text>
                </View>

                {/* App Name */}
                <Text style={styles.appName}>Shieldly</Text>

                {/* Tagline */}
                <Text style={styles.tagline}>
                    Micro-Insurance Platform for Emerging Markets
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 96,
        height: 96,
        backgroundColor: AppTheme.primaryBlue,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    appName: {
        fontSize: 30,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
}); 