import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

// Define common schemas
export const ErrorSchema = z.object({
    error: z.string().describe('Error message')
});

export const SuccessResponseSchema = z.object({
    message: z.string().describe('Success message')
});

// Authentication schemas
export const RegisterRequestSchema = z.object({
    email: z.string().email().optional().describe('User email address'),
    phone: z.string().min(8).optional().describe('User phone number'),
    password: z.string().min(6).describe('User password (min 6 characters)')
}).refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required'
});

export const RegisterResponseSchema = z.object({
    message: z.string().describe('Success message'),
    userId: z.number().describe('User ID')
});

export const VerifyOtpRequestSchema = z.object({
    email: z.string().email().optional().describe('User email address'),
    phone: z.string().min(8).optional().describe('User phone number'),
    otp: z.string().min(4).max(10).describe('One-time password')
}).refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required'
});

export const VerifyOtpResponseSchema = z.object({
    message: z.string().describe('Success message'),
    userId: z.number().describe('User ID')
});

export const SessionPasswordRequestSchema = z.object({
    userId: z.number().describe('User ID'),
    sessionPassword: z.string().min(6).describe('Session password (min 6 characters)'),
    deviceId: z.string().optional().describe('Device identifier')
});

export const SessionPasswordResponseSchema = z.object({
    message: z.string().describe('Success message'),
    sessionId: z.number().describe('Session ID'),
    refreshToken: z.string().describe('Refresh token for the session')
});

export const LoginRequestSchema = z.object({
    email: z.string().email().optional().describe('User email address'),
    phone: z.string().min(8).optional().describe('User phone number'),
    password: z.string().min(6).describe('User password')
}).refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required'
});

export const LoginResponseSchema = z.object({
    message: z.string().describe('Success message'),
    userId: z.number().describe('User ID')
});

export const WalletPinRequestSchema = z.object({
    userId: z.number().describe('User ID'),
    walletPin: z.string().min(4).max(12).describe('Wallet PIN (4-12 characters)'),
    transactionPin: z.string().min(4).max(12).describe('Transaction PIN (4-12 characters)')
});

export const WalletPinResponseSchema = z.object({
    message: z.string().describe('Success message'),
    publicKey: z.string().describe('Wallet public key'),
    walletSecret: z.string().describe('Wallet secret')
});

// Google OAuth response schemas
export const GoogleOAuthSuccessSchema = z.object({
    message: z.string().describe('Success message'),
    note: z.string().describe('Additional information about token extraction')
});

export const GoogleOAuthErrorSchema = z.object({
    error: z.string().describe('Error message')
});

// Create OpenAPI instance
export const openApiInstance = new OpenAPIHono();

// Set up OpenAPI document properties
export const openApiConfig = {
    openapi: '3.0.0',
    info: {
        title: 'Shieldly API',
        version: '1.0.0',
        description: 'Shieldly Backend API for authentication, wallet management, and more',
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Development server',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'User', description: 'User management endpoints' },
        { name: 'Notifications', description: 'Notification management endpoints' },
        { name: 'Admin', description: 'Admin management endpoints' },
    ]
}; 