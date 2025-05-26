import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as notificationService from '../services/notification';
import { requireAuth } from '../middleware/auth';

const notificationRouter = new Hono();

// Apply auth middleware to all notification routes
notificationRouter.use('/*', requireAuth);

// List user notifications
notificationRouter.get('/me/notifications', async (c) => {
    try {
        const userId = c.get('userId');
        const limit = c.req.query('limit') ? parseInt(c.req.query('limit') as string, 10) : 50;
        const offset = c.req.query('offset') ? parseInt(c.req.query('offset') as string, 10) : 0;

        const notifications = await notificationService.getUserNotifications(userId, limit, offset);
        return c.json(notifications);
    } catch (e: any) {
        return c.json({ error: e.message }, 400);
    }
});

// Mark notifications as read
notificationRouter.post(
    '/me/notifications/read',
    zValidator(
        'json',
        z.object({
            notificationIds: z.array(z.number()).optional(),
        })
    ),
    async (c) => {
        try {
            const userId = c.get('userId');
            const { notificationIds = [] } = await c.req.json();
            const result = await notificationService.markNotificationsAsRead(userId, notificationIds);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Register device for push notifications
notificationRouter.post(
    '/me/notifications/subscribe',
    zValidator(
        'json',
        z.object({
            deviceId: z.string(),
            token: z.string(),
            platform: z.string().refine(p => ['ios', 'android', 'web'].includes(p), {
                message: 'Platform must be one of: ios, android, web',
            }),
        })
    ),
    async (c) => {
        try {
            const userId = c.get('userId');
            const body = await c.req.json();
            const result = await notificationService.registerDeviceToken(userId, body);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

// Unregister device from push notifications
notificationRouter.post(
    '/me/notifications/unsubscribe',
    zValidator(
        'json',
        z.object({
            deviceId: z.string(),
        })
    ),
    async (c) => {
        try {
            const userId = c.get('userId');
            const { deviceId } = await c.req.json();
            const result = await notificationService.unregisterDeviceToken(userId, deviceId);
            return c.json(result);
        } catch (e: any) {
            return c.json({ error: e.message }, 400);
        }
    }
);

export default notificationRouter; 