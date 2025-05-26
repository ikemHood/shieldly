import { Platform } from 'react-native';
import { showToast } from '../utils/toast';

// API Configuration
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works fine
// For physical devices, use your computer's IP address
const getApiBaseUrl = () => {
    if (__DEV__) {
        const HOST_IP = '192.168.1.46'//'192.168.0.108';

        if (Platform.OS === 'android' || Platform.OS === 'ios') {
            return `http://${HOST_IP}:9000`;
        }

        return 'http://localhost:3000';
    }
    return 'https://api.shieldly.xyz';
};

const API_BASE_URL = getApiBaseUrl();

// Debug log the API URL in development
if (__DEV__) {
    console.log(`🔧 API Base URL: ${API_BASE_URL}`);
}

export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    error?: string;
}

export interface ApiError {
    message: string;
    status: number;
}

class ApiService {
    private baseURL: string;
    private defaultHeaders: Record<string, string>;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
            },
        };

        // Debug logging in development
        if (__DEV__) {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
            if (options.body) {
                console.log('📤 Request Body:', options.body);
            }
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // Debug logging in development
            if (__DEV__) {
                console.log(`📥 API Response: ${response.status} ${response.statusText}`);
                console.log('📄 Response Data:', data);
            }

            if (!response.ok) {
                throw {
                    message: data.error || 'An error occurred',
                    status: response.status,
                } as ApiError;
            }

            return data;
        } catch (error) {
            // Debug logging in development
            if (__DEV__) {
                console.error('❌ API Error:', error);
                console.error('🔗 Request URL:', url);
                console.error('⚙️ Request Config:', config);
            }

            if (error instanceof TypeError) {
                // Network error
                throw {
                    message: 'Network error. Please check your connection.',
                    status: 0,
                } as ApiError;
            }
            throw error;
        }
    }

    async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'GET',
            headers,
        });
    }

    async post<T>(
        endpoint: string,
        body?: any,
        headers?: Record<string, string>
    ): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
            headers,
        });
    }

    async put<T>(
        endpoint: string,
        body?: any,
        headers?: Record<string, string>
    ): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
            headers,
        });
    }

    async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            headers,
        });
    }

    setAuthToken(token: string) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    removeAuthToken() {
        delete this.defaultHeaders['Authorization'];
    }
}

export const apiService = new ApiService(API_BASE_URL);

// Helper function to handle API errors consistently
export const handleApiError = (error: ApiError) => {
    console.error('API Error:', error);

    if (error.status === 0) {
        showToast.error('Network error. Please check your connection.');
    } else if (error.status === 401) {
        showToast.error('Authentication failed. Please login again.');
    } else if (error.status === 403) {
        showToast.error('Access denied.');
    } else if (error.status === 404) {
        showToast.error('Resource not found.');
    } else if (error.status >= 500) {
        showToast.error('Server error. Please try again later.');
    } else {
        showToast.error(error.message || 'An unexpected error occurred.');
    }

    return error;
}; 