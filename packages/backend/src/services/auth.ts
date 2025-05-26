import { db, users, sessions } from '../db';
import { eq, and, or } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { jwksService } from './jwks';
import { sendVerificationEmail } from './email';

const verificationTokens = new Map<string, { userId: number; expiresAt: Date }>();

// Cleanup expired tokens every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hash(str: string) {
    return bcrypt.hash(str, 10);
}

function generateVerificationToken(userId: number): string {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    verificationTokens.set(token, { userId, expiresAt });

    // Clean up expired tokens
    cleanupExpiredTokens();

    return token;
}

// alidate and consume verification token
function validateAndConsumeVerificationToken(token: string, userId: number): boolean {
    const tokenData = verificationTokens.get(token);

    if (!tokenData) {
        console.warn(`Security: Invalid verification token attempted for user ${userId}`);
        return false;
    }
    if (tokenData.userId !== userId) {
        console.warn(`Security: Verification token mismatch - token for user ${tokenData.userId} used by user ${userId}`);
        return false;
    }
    if (tokenData.expiresAt < new Date()) {
        verificationTokens.delete(token);
        console.warn(`Security: Expired verification token attempted for user ${userId}`);
        return false;
    }

    // single use
    verificationTokens.delete(token);
    console.log(`Security: Verification token successfully validated and consumed for user ${userId}`);
    return true;
}

// cleanup expired tokens
function cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of verificationTokens.entries()) {
        if (data.expiresAt < now) {
            verificationTokens.delete(token);
        }
    }
}

export async function registerUser({ name, email, phone, password }: { name: string; email?: string; phone?: string; password: string }) {
    // Check if user exists
    const existing = await db.select().from(users).where(
        or(
            email ? eq(users.email, email) : undefined,
            phone ? eq(users.phone, phone) : undefined
        )
    );

    if (existing.length > 0) {
        const existingUser = existing[0];

        // If user already exists and is verified, return error
        if (existingUser.isVerified) {
            throw new Error('User already exists and is verified');
        }

        // If user exists but not verified, resend OTP
        const otp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        const hashedPassword = await hash(password);

        // Update existing user with new OTP and potentially new password
        const [updatedUser] = await db.update(users).set({
            otp,
            otpExpiresAt,
        }).where(eq(users.id, existingUser.id)).returning();

        console.log('Resent OTP for existing unverified user:', updatedUser);
        console.log('OTP:', otp);
        if (email) {
            sendVerificationEmail(email, otp);
        }
        return { user: updatedUser, isResend: true };
    }

    // Create new user
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const hashedPassword = await hash(password);
    const [user] = await db.insert(users).values({
        name,
        email,
        phone,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        isVerified: false,
    }).returning();

    console.log('Created new user:', user);
    console.log('OTP:', otp);
    if (email) {
        sendVerificationEmail(email, otp);
    }
    return { user, isResend: false };
}

export async function verifyOtp({ email, phone, otp }: { email?: string; phone?: string; otp: string }) {
    const user = await db.query.users.findFirst({
        where: and(
            email ? eq(users.email, email) : undefined,
            phone ? eq(users.phone, phone) : undefined,
            eq(users.otp, otp)
        )
    });

    if (!user) throw new Error('Invalid OTP');
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) throw new Error('OTP expired');

    await db.update(users).set({
        isVerified: true,
        otp: null,
        otpExpiresAt: null
    }).where(eq(users.id, user.id));

    const hasWallet = !!(user.publicKey && user.walletSecret);

    const verificationToken = generateVerificationToken(user.id);

    console.log(`OTP verified for user ${user.id}, hasWallet: ${hasWallet}, verificationToken: ${verificationToken}`);

    return {
        ...user,
        hasWallet,
        verificationToken
    };
}

export async function resendOtp({ email, phone }: { email?: string; phone?: string }) {
    // Find user by email or phone
    const user = await db.query.users.findFirst({
        where: and(
            or(
                email ? eq(users.email, email) : undefined,
                phone ? eq(users.phone, phone) : undefined
            )
        )
    });

    if (!user) throw new Error('User not found');
    // if (user.isVerified) throw new Error('User already verified');

    // Generate new OTP
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Update user with new OTP
    await db.update(users).set({
        otp,
        otpExpiresAt
    }).where(eq(users.id, user.id));

    console.log(`Resent OTP for user ${user.id}: ${otp}`);
    if (email) {
        sendVerificationEmail(email, otp);
    }

    return { message: 'OTP resent successfully' };
}

export async function createSession({ userId, sessionPassword, verificationToken, deviceId, userAgent, ip }: { userId: number; sessionPassword: string; verificationToken: string; deviceId?: string; userAgent?: string; ip?: string }) {
    // Validate verification token
    if (!validateAndConsumeVerificationToken(verificationToken, userId)) {
        throw new Error('Invalid or expired verification token');
    }

    const hashedSessionPassword = await hash(sessionPassword);

    const refreshToken = randomBytes(32).toString('hex');
    const [session] = await db.insert(sessions).values({
        userId,
        sessionPassword: hashedSessionPassword,
        deviceId,
        userAgent,
        ip,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }).returning();

    // Generate access token (JWT) using RSA key
    const currentKeyPair = jwksService.getCurrentKeyPair();
    if (!currentKeyPair) {
        throw new Error('No active key pair available for signing JWT');
    }
    const accessToken = sign({ userId }, currentKeyPair.privateKey, {
        algorithm: 'RS256',
        expiresIn: '15m',
        issuer: 'shieldly-backend',
        audience: 'shieldly-app',
        keyid: currentKeyPair.kid
    });

    return {
        ...session,
        accessToken
    };
}

// OAuth session creation (bypasses verification token requirement)
export async function createOAuthSession({ userId, sessionPassword, deviceId, userAgent, ip }: { userId: number; sessionPassword: string; deviceId?: string; userAgent?: string; ip?: string }) {
    const hashedSessionPassword = await hash(sessionPassword);

    const refreshToken = randomBytes(32).toString('hex');
    const [session] = await db.insert(sessions).values({
        userId,
        sessionPassword: hashedSessionPassword,
        deviceId,
        userAgent,
        ip,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }).returning();

    // Generate access token (JWT) using RSA key
    const currentKeyPair = jwksService.getCurrentKeyPair();
    if (!currentKeyPair) {
        throw new Error('No active key pair available for signing JWT');
    }
    const accessToken = sign({ userId }, currentKeyPair.privateKey, {
        algorithm: 'RS256',
        expiresIn: '15m',
        issuer: 'shieldly-backend',
        audience: 'shieldly-app',
        keyid: currentKeyPair.kid
    });

    return {
        ...session,
        accessToken
    };
}

export async function loginUser({ email, phone, password }: { email?: string; phone?: string; password: string }) {
    const user = await db.query.users.findFirst({
        where: and(
            email ? eq(users.email, email) : undefined,
            phone ? eq(users.phone, phone) : undefined
        )
    });
    if (!user) throw new Error('User not found');
    if (!user.isVerified) throw new Error('User not verified');
    const valid = await bcrypt.compare(password, user.password!);
    if (!valid) throw new Error('Invalid password');

    // Generate OTP for login verification
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Update user with new OTP for login verification
    await db.update(users).set({
        otp,
        otpExpiresAt,
    }).where(eq(users.id, user.id));

    // Check if user has a wallet (publicKey indicates wallet exists)
    const hasWallet = !!(user.publicKey && user.walletSecret);

    console.log(`Login credentials verified for user ${user.id}, OTP sent: ${otp}, hasWallet: ${hasWallet}`);
    if (email) {
        sendVerificationEmail(email, otp);
    }

    return {
        ...user,
        hasWallet
    };
}

export async function logoutSession(refreshToken: string) {
    const deleted = await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
    return deleted;
}

export async function refreshSession(refreshToken: string, sessionPassword: string) {
    // Find the session by refresh token
    const session = await db.query.sessions.findFirst({
        where: eq(sessions.refreshToken, refreshToken)
    });
    if (!session) throw new Error('Invalid refresh token');
    if (session.expiresAt && session.expiresAt < new Date()) throw new Error('Refresh token expired');
    if (session.userId == null) throw new Error('Session missing userId');

    // Verify session password
    const valid = await bcrypt.compare(sessionPassword, session.sessionPassword!);
    if (!valid) throw new Error('Invalid session password');

    // Find the user
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId as number)
    });
    if (!user) throw new Error('User not found');

    // Issue a new access token (JWT) using RSA key
    const currentKeyPair = jwksService.getCurrentKeyPair();
    if (!currentKeyPair) {
        throw new Error('No active key pair available for signing JWT');
    }
    const accessToken = sign({ userId: user.id }, currentKeyPair.privateKey, {
        algorithm: 'RS256',
        expiresIn: '15m',
        issuer: 'shieldly-backend',
        audience: 'shieldly-app',
        keyid: currentKeyPair.kid
    });

    return {
        userId: user.id,
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
} 