import { pgTable, serial, varchar, boolean, timestamp, integer, text, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    password: varchar('password', { length: 255 }), // hashed
    googleId: varchar('google_id', { length: 255 }),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    otp: varchar('otp', { length: 10 }),
    otpExpiresAt: timestamp('otp_expires_at'),
    isVerified: boolean('is_verified').default(false),
    walletPin: varchar('wallet_pin', { length: 255 }), // hashed
    transactionPin: varchar('transaction_pin', { length: 255 }), // hashed
    publicKey: varchar('public_key', { length: 255 }),
    walletSecret: varchar('wallet_secret', { length: 255 }),
    isAdmin: boolean('is_admin').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    refreshToken: varchar('refresh_token', { length: 255 }),
    sessionPassword: varchar('session_password', { length: 255 }), // hashed
    deviceId: varchar('device_id', { length: 255 }),
    userAgent: varchar('user_agent', { length: 512 }),
    ip: varchar('ip', { length: 64 }),
    createdAt: timestamp('created_at').defaultNow(),
    expiresAt: timestamp('expires_at'),
});

export const userProfiles = pgTable('user_profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).unique(),
    fullName: varchar('full_name', { length: 255 }),
    dateOfBirth: varchar('date_of_birth', { length: 20 }),
    address: text('address'),
    preferences: jsonb('preferences'), // For any user preferences as JSON
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const kycStatus = pgTable('kyc_status', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).unique(),
    status: varchar('status', { length: 20 }), // pending, approved, rejected
    providerReference: varchar('provider_reference', { length: 255 }), // Reference ID from KYC provider
    verificationLevel: varchar('verification_level', { length: 20 }),
    submissionDate: timestamp('submission_date').defaultNow(),
    completionDate: timestamp('completion_date'),
    rejectionReason: text('rejection_reason'),
    additionalData: jsonb('additional_data'), // Store any additional KYC data as JSON
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    type: varchar('type', { length: 50 }), // e.g., kyc_approved, wallet_created, etc.
    title: varchar('title', { length: 255 }),
    body: text('body'),
    isRead: boolean('is_read').default(false),
    data: jsonb('data'), // Additional data related to the notification
    createdAt: timestamp('created_at').defaultNow(),
});

export const deviceTokens = pgTable('device_tokens', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    deviceId: varchar('device_id', { length: 255 }),
    token: varchar('token', { length: 512 }),
    platform: varchar('platform', { length: 20 }), // ios, android, web
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const systemConfig = pgTable('system_config', {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 100 }).unique(),
    value: jsonb('value'),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}); 