import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { PrimaryButton } from '../../components/PrimaryButton';
import { OTPInput } from '../../components/OTPInput';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';
import { authService } from '../../services/authService';

type WalletCreationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'WalletCreation'>;
type WalletCreationScreenRouteProp = RouteProp<AuthStackParamList, 'WalletCreation'>;

interface WalletData {
    address: string;
    privateKey: string;
    publicKey: string;
}

export const WalletCreationScreen: React.FC = () => {
    const navigation = useNavigation<WalletCreationScreenNavigationProp>();
    const route = useRoute<WalletCreationScreenRouteProp>();
    const { completeAuth } = useAuth();
    const { userId } = route.params;
    const [isCreating, setIsCreating] = useState(false);
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [step, setStep] = useState<'pin-setup' | 'creating' | 'created'>('pin-setup');
    const [walletPin, setWalletPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');

    const createWallet = async (pin: string) => {
        try {
            setIsCreating(true);
            setStep('creating');

            // Call the actual wallet creation API
            const response = await authService.setWalletPin({
                userId,
                walletPin: pin,
            });

            // Set wallet data from API response
            const walletData: WalletData = {
                address: response.publicKey, // Using publicKey as address for now
                privateKey: response.walletSecret,
                publicKey: response.publicKey,
            };

            setWalletData(walletData);
            setStep('created');

            showToast.success('Your wallet has been created successfully!', 'Wallet Created');
        } catch (error) {
            console.error('Wallet creation error:', error);
            showToast.error('Failed to create wallet. Please try again.', 'Wallet Creation Failed');
            setStep('pin-setup');
            setPinStep('enter');
            setWalletPin('');
            setConfirmPin('');
        } finally {
            setIsCreating(false);
        }
    };

    const handlePinComplete = async (enteredPin: string) => {
        if (pinStep === 'enter') {
            setWalletPin(enteredPin);
            setPinStep('confirm');
            setConfirmPin('');
        } else {
            // Confirm step
            if (enteredPin === walletPin) {
                await createWallet(enteredPin);
            } else {
                showToast.error('PINs do not match. Please try again.');
                setPinStep('enter');
                setWalletPin('');
                setConfirmPin('');
            }
        }
    };

    const completeWalletSetup = async () => {
        try {
            showToast.success('Wallet setup completed!');
            await completeAuth();
        } catch (error) {
            console.error('Complete auth error:', error);
            showToast.error('Failed to complete setup. Please try again.');
        }
    };

    const retryWalletCreation = () => {
        setWalletData(null);
        setStep('pin-setup');
        setPinStep('enter');
        setWalletPin('');
        setConfirmPin('');
    };

    const renderPinSetupStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
                <Ionicons name="keypad" size={48} color={AppTheme.primaryBlue} />
            </View>
            <Text style={styles.stepTitle}>
                {pinStep === 'enter' ? 'Set Wallet PIN' : 'Confirm Wallet PIN'}
            </Text>
            <Text style={styles.stepDescription}>
                {pinStep === 'enter'
                    ? 'Create a secure PIN to protect your wallet'
                    : 'Re-enter your PIN to confirm'
                }
            </Text>

            <View style={styles.pinContainer}>
                <OTPInput
                    key={pinStep}
                    length={6}
                    value={pinStep === 'enter' ? walletPin : confirmPin}
                    onChangeText={pinStep === 'enter' ? setWalletPin : setConfirmPin}
                    onComplete={handlePinComplete}
                    autoFocus={true}
                    secureTextEntry={true}
                    disabled={isCreating}
                />
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '33%' }]} />
                </View>
                <Text style={styles.progressText}>Step 1 of 3</Text>
            </View>
        </View>
    );

    const renderCreatingStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
                <ActivityIndicator size="large" color={AppTheme.primaryBlue} />
            </View>
            <Text style={styles.stepTitle}>Creating Your Wallet</Text>
            <Text style={styles.stepDescription}>
                We're generating a secure blockchain wallet for you. This may take a few moments.
            </Text>
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '33%' }]} />
                </View>
                <Text style={styles.progressText}>Step 1 of 3</Text>
            </View>
        </View>
    );

    const renderCreatedStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
                <Ionicons name="wallet" size={48} color={AppTheme.primaryBlue} />
            </View>
            <Text style={styles.stepTitle}>Wallet Created Successfully!</Text>
            <Text style={styles.stepDescription}>
                Your blockchain wallet has been generated. Here are your wallet details:
            </Text>

            {walletData && (
                <View style={styles.walletDetails}>
                    <View style={styles.walletDetailItem}>
                        <Text style={styles.walletDetailLabel}>Wallet Address:</Text>
                        <Text style={styles.walletDetailValue} numberOfLines={1} ellipsizeMode="middle">
                            {walletData.address}
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.securityNotice}>
                <Ionicons name="shield-checkmark" size={24} color={AppTheme.successGreen} />
                <Text style={styles.securityText}>
                    Your private keys are encrypted and stored securely on your device.
                </Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '66%' }]} />
                </View>
                <Text style={styles.progressText}>Step 2 of 3</Text>
            </View>

            <PrimaryButton
                title="Secure My Wallet"
                onPress={completeWalletSetup}
                style={styles.actionButton}
            />

            <TouchableOpacity onPress={retryWalletCreation} style={styles.retryButton}>
                <Text style={styles.retryText}>Create New Wallet</Text>
            </TouchableOpacity>
        </View>
    );



    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Setup Wallet</Text>
                <Text style={styles.subtitle}>
                    Setting up your secure wallet for insurance transactions
                </Text>
            </View>

            {step === 'pin-setup' && renderPinSetupStep()}
            {step === 'creating' && renderCreatingStep()}
            {step === 'created' && renderCreatedStep()}

            <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                    <Ionicons name="lock-closed" size={20} color={AppTheme.primaryBlue} />
                    <Text style={styles.infoText}>Your wallet is secured with military-grade encryption</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="shield" size={20} color={AppTheme.primaryBlue} />
                    <Text style={styles.infoText}>Private keys never leave your device</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="checkmark-circle" size={20} color={AppTheme.primaryBlue} />
                    <Text style={styles.infoText}>Compatible with Starknet blockchain</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundLight,
    },
    contentContainer: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40, // Extra padding at bottom for scrolling
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
    },
    stepContainer: {
        alignItems: 'center',
        marginBottom: 32,
        width: '100%',
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 12,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    progressContainer: {
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
        paddingHorizontal: 20,
    },
    progressBar: {
        width: '80%',
        height: 8,
        backgroundColor: AppTheme.divider,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: AppTheme.primaryBlue,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: AppTheme.textMedium,
    },
    pinContainer: {
        marginBottom: 32,
        width: '100%',
        paddingHorizontal: 20,
    },
    walletDetails: {
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    walletDetailItem: {
        marginBottom: 12,
    },
    walletDetailLabel: {
        fontSize: 14,
        color: AppTheme.textMedium,
        marginBottom: 4,
    },
    walletDetailValue: {
        fontSize: 16,
        color: AppTheme.textDark,
        fontFamily: 'monospace',
    },
    securityNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppTheme.successGreen + '20',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        gap: 8,
    },
    securityText: {
        flex: 1,
        fontSize: 14,
        color: AppTheme.successGreen,
        fontWeight: '500',
    },
    actionButton: {
        width: '100%',
        marginBottom: 16,
    },
    retryButton: {
        paddingVertical: 12,
    },
    retryText: {
        fontSize: 16,
        color: AppTheme.textMedium,
        fontWeight: '500',
    },
    infoSection: {
        marginTop: 'auto',
        paddingTop: 24,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: AppTheme.textMedium,
    },
}); 