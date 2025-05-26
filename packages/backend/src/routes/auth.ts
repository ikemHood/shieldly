import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as authService from '../services/auth';
import * as userService from '../services/user';
import * as googleAuthService from '../services/googleAuth';
import { requireAuth } from '../middleware/auth';

const authRouter = new Hono();

// Google OAuth routes
authRouter.get('/google', async (c) => {
    // Generate Google OAuth URL and redirect to it
    const authUrl = googleAuthService.getGoogleAuthUrl();
    return new Response(null, {
        status: 302,
        headers: { 'Location': authUrl }
    });
});

authRouter.get('/google/callback', async (c) => {
    try {
        // Get authorization code from query parameters
        const code = c.req.query('code');
        if (!code) {
            throw new Error('Authorization code is missing');
        }

        // Exchange code for tokens and get user info
        const userInfo = await googleAuthService.getGoogleUserInfo(code);

        // Process Google user (find existing or create new)
        const user = await googleAuthService.processGoogleUser(userInfo);

        // Create a session for the user
        const userAgent = c.req.header('user-agent') || '';
        const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.header('cf-connecting-ip') || '';

        // Generate a random session password for OAuth users
        const sessionPassword = Math.random().toString(36).substring(2, 15);

        const session = await authService.createOAuthSession({
            userId: user.id,
            sessionPassword,
            userAgent,
            ip,
        });

        // Redirect with tokens as query parameters
        // Create the base URL (e.g., http://localhost:3000/auth/success)
        const reqUrl = c.req.url;
        const urlParts = reqUrl.split('/');
        const baseUrl = urlParts.slice(0, urlParts.length - 2).join('/') + '/auth/success';
        const redirectUrl = `${baseUrl}?sessionId=${session.id.toString()}&refreshToken=${session.refreshToken}&accessToken=${encodeURIComponent(session.accessToken)}`;

        return new Response(null, {
            status: 302,
            headers: { 'Location': redirectUrl }
        });
    } catch (error: any) {
        console.error('Google OAuth error:', error);

        // Create the base URL (e.g., http://localhost:3000/auth/error)
        const reqUrl = c.req.url;
        const urlParts = reqUrl.split('/');
        const baseUrl = urlParts.slice(0, urlParts.length - 2).join('/') + '/auth/error';
        const errorMessage = error && typeof error.message === 'string' ? error.message : 'Unknown error';
        const redirectUrl = `${baseUrl}?error=${encodeURIComponent(errorMessage)}`;

        return new Response(null, {
            status: 302,
            headers: { 'Location': redirectUrl }
        });
    }
});

// Step 1: Register (email/phone + password)
authRouter.post(
    '/register',
    zValidator(
        'json',
        z.object({
            name: z.string().min(2),
            email: z.string().email().optional(),
            phone: z.string().min(8).optional(),
            password: z.string().min(6),
        }).refine((data) => data.email || data.phone, {
            message: 'Either email or phone is required',
        })
    ),
    async (c) => {
        try {
            const body = await c.req.json();
            const result = await authService.registerUser(body);

            const message = result.isResend
                ? 'OTP resent to existing account'
                : 'Registration successful, OTP sent';

            return c.json({
                message,
                userId: result.user.id,
                isResend: result.isResend
            });
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Step 2: Verify OTP
authRouter.post(
    '/verify-otp',
    zValidator(
        'json',
        z.object({
            email: z.string().email().optional(),
            phone: z.string().min(8).optional(),
            otp: z.string().min(4).max(10),
        }).refine((data) => data.email || data.phone, {
            message: 'Either email or phone is required',
        })
    ),
    async (c) => {
        try {
            const body = await c.req.json();
            const user = await authService.verifyOtp(body);
            return c.json({
                message: 'OTP verified',
                userId: user.id,
                hasWallet: user.hasWallet,
                verificationToken: user.verificationToken
            });
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Resend OTP
authRouter.post(
    '/resend-otp',
    zValidator(
        'json',
        z.object({
            email: z.string().email().optional(),
            phone: z.string().min(8).optional(),
        }).refine((data) => data.email || data.phone, {
            message: 'Either email or phone is required',
        })
    ),
    async (c) => {
        try {
            const body = await c.req.json();
            const result = await authService.resendOtp(body);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Step 3: Set session password (creates session)
authRouter.post(
    '/set-session-password',
    zValidator(
        'json',
        z.object({
            userId: z.number(),
            sessionPassword: z.string().min(6),
            verificationToken: z.string(),
            deviceId: z.string().optional(),
        })
    ),
    async (c) => {
        try {
            const body = await c.req.json();
            const userAgent = c.req.header('user-agent');
            const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.header('cf-connecting-ip');
            const session = await authService.createSession({
                ...body,
                userAgent,
                ip,
            });
            return c.json({
                message: 'Session created',
                sessionId: session.id,
                refreshToken: session.refreshToken,
                accessToken: session.accessToken
            });
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Step 4: Set wallet/transaction pin and create wallet
// ///TODO: add auth middleware
authRouter.post(
    '/set-wallet-pin',
    zValidator(
        'json',
        z.object({
            userId: z.number(),
            walletPin: z.string().min(4).max(12)
        })
    ),
    requireAuth,
    async (c) => {
        try {
            const body = await c.req.json();
            const result = await userService.createWallet(body.userId, body.walletPin);
            return c.json({ message: 'Wallet created', publicKey: result.publicKey, walletSecret: result.walletSecret });
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Login
authRouter.post(
    '/login',
    zValidator(
        'json',
        z.object({
            email: z.string().email().optional(),
            phone: z.string().min(8).optional(),
            password: z.string().min(6),
        }).refine((data) => data.email || data.phone, {
            message: 'Either email or phone is required',
        })
    ),
    async (c) => {
        try {
            const body = await c.req.json();
            const user = await authService.loginUser(body);
            return c.json({
                message: 'Login successful, OTP sent',
                userId: user.id,
                hasWallet: user.hasWallet
            });
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Logout endpoint
authRouter.post(
    '/logout',
    zValidator(
        'json',
        z.object({
            refreshToken: z.string(),
        })
    ),
    async (c) => {
        try {
            const { refreshToken } = await c.req.json();
            await authService.logoutSession(refreshToken);
            return c.json({ message: 'Logged out successfully' });
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Refresh token endpoint
authRouter.post(
    '/refresh',
    zValidator(
        'json',
        z.object({
            refreshToken: z.string(),
            sessionPassword: z.string(),
        })
    ),
    async (c) => {
        try {
            const { refreshToken, sessionPassword } = await c.req.json();
            const tokens = await authService.refreshSession(refreshToken, sessionPassword);
            return c.json(tokens);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

export default authRouter; 