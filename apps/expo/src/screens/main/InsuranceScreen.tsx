import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TextInput } from '../../components/TextInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AppTheme } from '../../constants/theme';
import { showToast } from '../../utils/toast';
import { InsuranceStackParamList } from '../../navigation/InsuranceStackNavigator';

type InsuranceScreenNavigationProp = StackNavigationProp<InsuranceStackParamList, 'InsuranceMain'>;

export const InsuranceScreen: React.FC = () => {
    const navigation = useNavigation<InsuranceScreenNavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('PolicyCatalog');
        } else {
            showToast.info('Please enter a search term', 'Search');
        }
    };

    const handleCategoryPress = (category: string) => {
        navigation.navigate('PolicyCatalog');
    };

    const handleViewMyPolicies = () => {
        navigation.navigate('MyPolicies');
    };

    const handleBrowseCatalog = () => {
        navigation.navigate('PolicyCatalog');
    };

    const categories = [
        { id: 'crop', name: 'Crop Insurance', icon: 'leaf', color: '#10B981' },
        { id: 'livestock', name: 'Livestock Insurance', icon: 'paw', color: '#F59E0B' },
        { id: 'business', name: 'Business Insurance', icon: 'business', color: '#3B82F6' },
        { id: 'health', name: 'Health Insurance', icon: 'medical', color: '#EF4444' },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Insurance</Text>
                <Text style={styles.subtitle}>Protect what matters most to you</Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity style={styles.quickActionCard} onPress={handleBrowseCatalog}>
                        <View style={[styles.quickActionIcon, { backgroundColor: AppTheme.primaryBlue + '20' }]}>
                            <Ionicons name="search" size={24} color={AppTheme.primaryBlue} />
                        </View>
                        <Text style={styles.quickActionText}>Browse Policies</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionCard} onPress={handleViewMyPolicies}>
                        <View style={[styles.quickActionIcon, { backgroundColor: AppTheme.successGreen + '20' }]}>
                            <Ionicons name="shield-checkmark" size={24} color={AppTheme.successGreen} />
                        </View>
                        <Text style={styles.quickActionText}>My Policies</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Section */}
            <View style={styles.searchSection}>
                <TextInput
                    placeholder="Search for insurance policies..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <PrimaryButton
                    title="Search"
                    onPress={handleSearch}
                    style={styles.searchButton}
                />
            </View>

            {/* Categories */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Insurance Categories</Text>
                <View style={styles.categoriesGrid}>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={styles.categoryCard}
                            onPress={() => handleCategoryPress(category.name)}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                                <Ionicons name={category.icon as any} size={32} color={category.color} />
                            </View>
                            <Text style={styles.categoryName}>{category.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Coming Soon Section */}
            <View style={styles.comingSoonSection}>
                <View style={styles.comingSoonIcon}>
                    <Ionicons name="construct" size={48} color={AppTheme.primaryBlue} />
                </View>
                <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                <Text style={styles.comingSoonDescription}>
                    We're working hard to bring you comprehensive insurance options.
                    Stay tuned for our full policy catalog with competitive rates and easy claims.
                </Text>
                <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={AppTheme.successGreen} />
                        <Text style={styles.featureText}>Instant policy quotes</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={AppTheme.successGreen} />
                        <Text style={styles.featureText}>Digital claims processing</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={AppTheme.successGreen} />
                        <Text style={styles.featureText}>Blockchain-secured policies</Text>
                    </View>
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
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: AppTheme.textMedium,
    },
    quickActionsSection: {
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: AppTheme.textDark,
        textAlign: 'center',
    },
    searchSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    searchButton: {
        paddingHorizontal: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: AppTheme.textDark,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        gap: 8,
    },
    categoryCard: {
        width: '47%',
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: AppTheme.textDark,
        textAlign: 'center',
    },
    comingSoonSection: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 32,
    },
    comingSoonIcon: {
        width: 80,
        height: 80,
        backgroundColor: AppTheme.backgroundWhite,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    comingSoonTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppTheme.textDark,
        marginBottom: 12,
    },
    comingSoonDescription: {
        fontSize: 16,
        color: AppTheme.textMedium,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    featuresList: {
        alignSelf: 'stretch',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    featureText: {
        fontSize: 16,
        color: AppTheme.textDark,
        fontWeight: '500',
    },
}); 