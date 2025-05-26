export const AppTheme = {
    // Primary colors
    primaryBlue: '#2C6BED',
    primaryDarkBlue: '#2C6BED',

    // Neutral colors
    backgroundLight: '#F9FAFB',
    backgroundWhite: '#FFFFFF',
    textMedium: '#6B7280',
    textDark: '#111827',

    // Accent/Status colors
    warningYellow: '#F59E0B',
    errorRed: '#EF4444',
    successGreen: '#10B981',

    // Other UI colors
    cardBackground: '#FFFFFF',
    divider: '#E5E7EB',
} as const;

export const Typography = {
    displayLarge: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        color: AppTheme.textDark,
    },
    displayMedium: {
        fontSize: 18,
        fontWeight: 'bold' as const,
        color: AppTheme.textDark,
    },
    displaySmall: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: AppTheme.textDark,
    },
    bodyLarge: {
        fontSize: 16,
        color: AppTheme.textDark,
    },
    bodyMedium: {
        fontSize: 14,
        color: AppTheme.textDark,
    },
    bodySmall: {
        fontSize: 12,
        color: AppTheme.textMedium,
    },
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
} as const; 