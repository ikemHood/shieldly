import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as userService from '../services/user';
import { requireAuth } from '../middleware/auth';

const userRouter = new Hono();

userRouter.use('/*', requireAuth);

// Get current user profile
userRouter.get('/me', async (c) => {
    try {
        const userId = c.get('userId');
        const profile = await userService.getUserProfile(userId);
        return c.json(profile);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Update user profile
userRouter.put(
    '/me',
    zValidator(
        'json',
        z.object({
            fullName: z.string().optional(),
            dateOfBirth: z.string().optional(),
            address: z.string().optional(),
            preferences: z.record(z.any()).optional(),
        })
    ),
    async (c) => {
        try {
            const userId = c.get('userId');
            const body = await c.req.json();
            const profile = await userService.updateUserProfile(userId, body);
            return c.json(profile);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Get user KYC status
userRouter.get('/me/kyc', async (c) => {
    try {
        const userId = c.get('userId');
        const kycStatus = await userService.getKycStatus(userId);
        return c.json(kycStatus);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Submit KYC info
userRouter.post('/me/kyc', async (c) => {
    try {
        const userId = c.get('userId');
        const result = await userService.startKycProcess(userId);
        return c.json(result);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Create wallet
userRouter.post(
    '/me/create',
    zValidator(
        'json',
        z.object({
            walletPin: z.string().min(4).max(12),
        })
    ),
    async (c) => {
        try {
            const userId = c.get('userId');
            const { walletPin } = await c.req.json();
            const result = await userService.createWallet(userId, walletPin);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Get wallet info
userRouter.get('/me/wallet', async (c) => {
    try {
        const userId = c.get('userId');
        const wallet = await userService.getWalletInfo(userId);
        return c.json(wallet);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Get user sessions
userRouter.get('/me/sessions', async (c) => {
    try {
        const userId = c.get('userId');
        const sessions = await userService.getUserSessions(userId);
        return c.json(sessions);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Terminate session
userRouter.post('/me/sessions/:sessionId', async (c) => {
    try {
        const userId = c.get('userId');
        const sessionId = parseInt(c.req.param('sessionId'), 10);
        if (isNaN(sessionId)) {
            return c.json({ error: 'Invalid session ID' }, 400);
        }

        const result = await userService.terminateSession(userId, sessionId);
        return c.json(result);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

export default userRouter; 