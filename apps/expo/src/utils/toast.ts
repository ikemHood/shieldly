import Toast from 'react-native-toast-message';

export const showToast = {
    success: (message: string, title?: string) => {
        Toast.show({
            type: 'success',
            text1: title || 'Success',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
        });
    },

    error: (message: string, title?: string) => {
        Toast.show({
            type: 'error',
            text1: title || 'Error',
            text2: message,
            position: 'top',
            visibilityTime: 4000,
        });
    },

    info: (message: string, title?: string) => {
        Toast.show({
            type: 'info',
            text1: title || 'Info',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
        });
    },

    warning: (message: string, title?: string) => {
        Toast.show({
            type: 'error', // Using error type for warning as react-native-toast-message doesn't have warning
            text1: title || 'Warning',
            text2: message,
            position: 'top',
            visibilityTime: 3500,
        });
    },

    comingSoon: (feature: string) => {
        Toast.show({
            type: 'info',
            text1: 'Coming Soon!',
            text2: `${feature} feature will be available soon.`,
            position: 'top',
            visibilityTime: 3000,
        });
    },
}; 