import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as adminService from '../services/admin';
import { requireAdmin, requireAuth } from '../middleware/auth';

const adminRouter = new Hono();

adminRouter.use('/*', requireAuth);
adminRouter.use('/*', requireAdmin);

// List/search users
adminRouter.get('/users', async (c) => {
    try {
        const search = c.req.query('search') || '';
        const kycStatus = c.req.query('kycStatus') || '';
        const limit = c.req.query('limit') ? parseInt(c.req.query('limit') as string, 10) : 50;
        const offset = c.req.query('offset') ? parseInt(c.req.query('offset') as string, 10) : 0;
        const sortBy = c.req.query('sortBy') || 'createdAt';
        const sortOrder = c.req.query('sortOrder') as 'asc' | 'desc' || 'desc';

        const users = await adminService.listUsers({
            search,
            kycStatus,
            limit,
            offset,
            sortBy,
            sortOrder,
        });

        return c.json(users);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Get user details
adminRouter.get('/users/:userId', async (c) => {
    try {
        const userId = parseInt(c.req.param('userId'), 10);
        if (isNaN(userId)) {
            return c.json({ error: 'Invalid user ID' }, 400);
        }

        const user = await adminService.getUserDetails(userId);
        return c.json(user);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Update user KYC status
adminRouter.put(
    '/users/:userId/kyc',
    zValidator(
        'json',
        z.object({
            status: z.enum(['pending', 'approved', 'rejected']),
            verificationLevel: z.string().optional(),
            rejectionReason: z.string().optional(),
            additionalData: z.record(z.any()).optional(),
        })
    ),
    async (c) => {
        try {
            const userId = parseInt(c.req.param('userId'), 10);
            if (isNaN(userId)) {
                return c.json({ error: 'Invalid user ID' }, 400);
            }

            const body = await c.req.json();
            const result = await adminService.updateUserKycStatus(userId, body);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Get system analytics
adminRouter.get('/analytics', async (c) => {
    try {
        const analytics = await adminService.getSystemAnalytics();
        return c.json(analytics);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Send notification to user(s)
adminRouter.post(
    '/notifications',
    zValidator(
        'json',
        z.object({
            userIds: z.array(z.number()),
            notification: z.object({
                type: z.string(),
                title: z.string(),
                body: z.string(),
                data: z.record(z.any()).optional(),
            }),
        })
    ),
    async (c) => {
        try {
            const { userIds, notification } = await c.req.json();
            const result = await adminService.sendNotificationToUsers(userIds, notification);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Update system config
adminRouter.put(
    '/config',
    zValidator(
        'json',
        z.object({
            key: z.string(),
            value: z.any(),
            description: z.string().optional(),
        })
    ),
    async (c) => {
        try {
            const { key, value, description } = await c.req.json();
            const result = await adminService.updateSystemConfig(key, value, description);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Get system config
adminRouter.get('/config', async (c) => {
    try {
        const config = await adminService.getSystemConfig();
        return c.json(config);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

export default adminRouter; 