import { db, notifications, deviceTokens } from '../db';
import { eq, desc, inArray } from 'drizzle-orm';

export async function getUserNotifications(userId: number, limit = 50, offset = 0) {
    return db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);
}

export async function markNotificationsAsRead(userId: number, notificationIds: number[]) {
    if (notificationIds.length === 0) {
        // Mark all as read if no specific IDs provided
        await db.update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.userId, userId));

        return { success: true, message: 'All notifications marked as read' };
    }

    // Mark specific notifications as read
    await db.update(notifications)
        .set({ isRead: true })
        .where(
            eq(notifications.userId, userId) &&
            inArray(notifications.id, notificationIds)
        );

    return { success: true, message: `${notificationIds.length} notifications marked as read` };
}

export async function createNotification(userId: number, notificationData: {
    type: string;
    title: string;
    body: string;
    data?: any;
}) {
    const [notification] = await db.insert(notifications).values({
        userId,
        type: notificationData.type,
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data || {},
        isRead: false,
    }).returning();

    // TODO: Send push notification if user has registered devices
    await sendPushNotificationToUser(userId, notificationData);

    return notification;
}

export async function registerDeviceToken(userId: number, data: {
    deviceId: string;
    token: string;
    platform: string;
}) {
    // Check if device already registered
    const existingDevice = await db.query.deviceTokens.findFirst({
        where: eq(deviceTokens.deviceId, data.deviceId)
    });

    if (existingDevice) {
        // Update existing token
        await db.update(deviceTokens)
            .set({
                token: data.token,
                updatedAt: new Date()
            })
            .where(eq(deviceTokens.id, existingDevice.id));

        return { success: true, message: 'Device token updated' };
    }

    // Register new device
    await db.insert(deviceTokens).values({
        userId,
        deviceId: data.deviceId,
        token: data.token,
        platform: data.platform,
    });

    return { success: true, message: 'Device registered for push notifications' };
}

export async function unregisterDeviceToken(userId: number, deviceId: string) {
    const result = await db.delete(deviceTokens)
        .where(
            eq(deviceTokens.userId, userId) &&
            eq(deviceTokens.deviceId, deviceId)
        )
        .returning();

    if (result.length === 0) {
        throw new Error('Device not found or already unregistered');
    }

    return { success: true, message: 'Device unregistered from push notifications' };
}

// Helper function to send push notifications (stubbed for hackathon)
async function sendPushNotificationToUser(userId: number, notification: {
    title: string;
    body: string;
    data?: any;
}) {
    // Get all user's device tokens
    const devices = await db.select()
        .from(deviceTokens)
        .where(eq(deviceTokens.userId, userId));

    for (const device of devices) {
        console.log(`[PUSH] Sending to ${device.platform} device ${device.deviceId}: ${notification.title}`);
        // TODO: implementation firbase push notifications
        // If using Firebase, it might look like:
        // await firebaseAdmin.messaging().send({
        //   token: device.token,
        //   notification: {
        //     title: notification.title,
        //     body: notification.body,
        //   },
        //   data: notification.data,
        // });
    }

    return { sent: devices.length };
} 