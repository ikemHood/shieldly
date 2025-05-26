import { db, users, userProfiles, kycStatus, systemConfig, notifications } from '../db';
import { eq, ilike, desc, and, asc, sql, or } from 'drizzle-orm';
import * as notificationService from './notification';

export async function listUsers(options?: {
    search?: string;
    kycStatus?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}) {
    const {
        search = '',
        kycStatus: kycFilter = '',
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options || {};

    // Create a base query - use type assertions to fix TypeScript errors
    // This doesn't affect runtime behavior
    const baseQuery = db.select()
        .from(users)
        .leftJoin(userProfiles as any, eq(users.id, userProfiles.userId))
        .leftJoin(kycStatus as any, eq(users.id, kycStatus.userId));

    // Different filter combinations
    let finalQuery;

    if (search && kycFilter) {
        // Both search and KYC filter
        finalQuery = baseQuery.where(
            and(
                or(
                    ilike(users.email, `%${search}%`),
                    ilike(users.phone, `%${search}%`),
                    ilike(userProfiles.fullName, `%${search}%`)
                ),
                eq(kycStatus.status, kycFilter)
            )
        );
    } else if (search) {
        // Only search
        finalQuery = baseQuery.where(
            or(
                ilike(users.email, `%${search}%`),
                ilike(users.phone, `%${search}%`),
                ilike(userProfiles.fullName, `%${search}%`)
            )
        );
    } else if (kycFilter) {
        // Only KYC filter
        finalQuery = baseQuery.where(eq(kycStatus.status, kycFilter));
    } else {
        // No filters
        finalQuery = baseQuery;
    }

    // Apply sorting
    const sortColumnExpr = sortBy === 'fullName' ? userProfiles.fullName :
        sortBy === 'kycStatus' ? kycStatus.status :
            users.createdAt;

    // Apply sorting, limit and offset
    if (sortOrder === 'asc') {
        return finalQuery.orderBy(asc(sortColumnExpr)).limit(limit).offset(offset);
    } else {
        return finalQuery.orderBy(desc(sortColumnExpr)).limit(limit).offset(offset);
    }
}

export async function getUserDetails(userId: number) {
    const result = await db.select()
        .from(users)
        .leftJoin(userProfiles as any, eq(users.id, userProfiles.userId))
        .leftJoin(kycStatus as any, eq(users.id, kycStatus.userId))
        .where(eq(users.id, userId));

    if (result.length === 0) {
        throw new Error('User not found');
    }

    return result[0];
}

export async function updateUserKycStatus(userId: number, data: {
    status: string;
    verificationLevel?: string;
    rejectionReason?: string;
    additionalData?: any;
}) {
    // Check if KYC record exists
    const existingKyc = await db.query.kycStatus.findFirst({
        where: eq(kycStatus.userId, userId)
    });

    let kycRecord;

    if (existingKyc) {
        // Update existing record
        const [updated] = await db.update(kycStatus)
            .set({
                status: data.status,
                verificationLevel: data.verificationLevel || existingKyc.verificationLevel,
                rejectionReason: data.rejectionReason,
                additionalData: data.additionalData || existingKyc.additionalData,
                completionDate: data.status === 'approved' || data.status === 'rejected' ? new Date() : undefined,
                updatedAt: new Date(),
            })
            .where(eq(kycStatus.userId, userId))
            .returning();

        kycRecord = updated;
    } else {
        // Create new record
        const [newRecord] = await db.insert(kycStatus)
            .values({
                userId,
                status: data.status,
                verificationLevel: data.verificationLevel || 'basic',
                rejectionReason: data.rejectionReason,
                submissionDate: new Date(),
                completionDate: data.status === 'approved' || data.status === 'rejected' ? new Date() : undefined,
                additionalData: data.additionalData || {},
            })
            .returning();

        kycRecord = newRecord;
    }

    // Create a notification for the user
    const notificationTitle = data.status === 'approved' ? 'KYC Verification Approved' :
        data.status === 'rejected' ? 'KYC Verification Rejected' :
            'KYC Status Updated';

    const notificationBody = data.status === 'approved' ? 'Your identity verification has been approved.' :
        data.status === 'rejected' ? `Your identity verification was rejected. Reason: ${data.rejectionReason || 'Not specified'}` :
            'Your identity verification status has been updated.';

    await notificationService.createNotification(userId, {
        type: `kyc_${data.status}`,
        title: notificationTitle,
        body: notificationBody,
        data: { kycStatus: data.status },
    });

    return kycRecord;
}

export async function getSystemConfig() {
    const configs = await db.select().from(systemConfig);
    // Convert to key-value object with null check
    return configs.reduce((acc: Record<string, any>, config) => {
        if (config.key !== null) {
            acc[config.key] = config.value;
        }
        return acc;
    }, {});
}

export async function updateSystemConfig(key: string, value: any, description?: string) {
    // Check if config exists
    const existingConfig = await db.query.systemConfig.findFirst({
        where: eq(systemConfig.key, key)
    });

    if (existingConfig) {
        // Update existing config
        const [updated] = await db.update(systemConfig)
            .set({
                value,
                description: description || existingConfig.description,
                updatedAt: new Date()
            })
            .where(eq(systemConfig.key, key))
            .returning();

        return updated;
    }

    // Create new config
    const [newConfig] = await db.insert(systemConfig)
        .values({
            key,
            value,
            description: description || '',
        })
        .returning();

    return newConfig;
}

export async function getSystemAnalytics() {
    // Get total user count
    const [userCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

    // Get KYC status counts
    const kycCounts = await db
        .select({
            status: kycStatus.status,
            count: sql<number>`count(*)`
        })
        .from(kycStatus)
        .groupBy(kycStatus.status);

    // Get wallet count
    const [walletCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.publicKey} is not null`);

    // Get daily user signup count for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySignups = await db
        .select({
            date: sql<string>`date_trunc('day', ${users.createdAt})`,
            count: sql<number>`count(*)`
        })
        .from(users)
        .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`)
        .groupBy(sql`date_trunc('day', ${users.createdAt})`)
        .orderBy(sql`date_trunc('day', ${users.createdAt})`);

    // Add null check when creating status counts map
    const statusCountsMap: Record<string, number> = {};
    for (const item of kycCounts) {
        if (item.status !== null) {
            statusCountsMap[item.status] = item.count;
        }
    }

    return {
        userCount: userCount.count,
        kycCounts: statusCountsMap,
        walletCount: walletCount.count,
        dailySignups,
    };
}

export async function sendNotificationToUsers(userIds: number[], notificationData: {
    type: string;
    title: string;
    body: string;
    data?: any;
}) {
    // Properly type the results array
    type NotificationResult =
        | { userId: number; notificationId: number; status: 'sent' }
        | { userId: number; status: 'failed'; error: string };

    const results: NotificationResult[] = [];

    for (const userId of userIds) {
        try {
            const notification = await notificationService.createNotification(userId, notificationData);
            results.push({ userId, notificationId: notification.id, status: 'sent' as const });
        } catch (error) {
            results.push({ userId, status: 'failed' as const, error: (error as Error).message });
        }
    }

    return {
        success: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
    };
} 