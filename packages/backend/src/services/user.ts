import { db, users, userProfiles, kycStatus, sessions } from '../db';
import { eq, desc } from 'drizzle-orm';
// import { createArgentWallet } from './walletCreation';
import env from '../env';
import { ChipiSDK, createArgentWallet } from '@chipi-pay/chipi-sdk';
import { sign } from 'jsonwebtoken';
import { jwksService } from './jwks';

// Initialize the ChipiSDK for wallet operations
const chipiSDK = new ChipiSDK({
    apiPublicKey: env.apiKey,
});

/**
 * Generate a JWT token for API calls to external services
 * This token can be verified using our JWKS endpoint
 */
function generateApiToken(userId: number, audience: string = 'chipi-api'): string {
    const currentKeyPair = jwksService.getCurrentKeyPair();
    if (!currentKeyPair) {
        throw new Error('No active key pair available for signing API token');
    }

    return sign(
        {
            userId,
            scope: 'api-access'
        },
        currentKeyPair.privateKey,
        {
            algorithm: 'RS256',
            expiresIn: '1h',
            issuer: 'shieldly-backend',
            audience: audience,
            keyid: currentKeyPair.kid
        }
    );
}

export async function getUserProfile(userId: number) {
    const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId)
    });

    if (!profile) {
        // Create an empty profile if one doesn't exist
        const [newProfile] = await db.insert(userProfiles).values({
            userId,
            preferences: {},
        }).returning();
        return newProfile;
    }

    return profile;
}

export async function updateUserProfile(userId: number, profileData: Partial<typeof userProfiles.$inferInsert>) {
    let profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId)
    });

    if (!profile) {
        // Create new profile
        const [newProfile] = await db.insert(userProfiles).values({
            userId,
            ...profileData,
            preferences: profileData.preferences || {},
        }).returning();
        return newProfile;
    }

    // Update existing profile
    const [updatedProfile] = await db.update(userProfiles)
        .set({
            ...profileData,
            updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();

    return updatedProfile;
}

export async function getKycStatus(userId: number) {
    const status = await db.query.kycStatus.findFirst({
        where: eq(kycStatus.userId, userId)
    });

    if (!status) {
        return { status: 'not_started' };
    }

    return status;
}

export async function startKycProcess(userId: number) {
    // Check if KYC has already started
    const existingKyc = await db.query.kycStatus.findFirst({
        where: eq(kycStatus.userId, userId)
    });

    if (existingKyc && existingKyc.status !== 'rejected') {
        throw new Error('KYC process already initiated');
    }

    // TODO: Implement KYC provider API call

    // For this hackathon, we'll simulate it:
    const providerReference = `KYC_${userId}_${Date.now()}`;

    const [kycEntry] = await db.insert(kycStatus).values({
        userId,
        status: 'pending',
        providerReference,
        verificationLevel: 'basic',
        submissionDate: new Date(),
        additionalData: {
            redirectUrl: `${env.kycProviderUrl}/verify/${providerReference}`
        },
    }).returning();

    return {
        kycId: kycEntry.id,
        status: kycEntry.status,
        redirectUrl: `${env.kycProviderUrl}/verify/${providerReference}`,
    };
}

export async function getUserSessions(userId: number) {
    return db.select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.createdAt));
}

export async function terminateSession(userId: number, sessionId: number) {
    const result = await db.delete(sessions)
        .where(
            eq(sessions.id, sessionId) &&
            eq(sessions.userId, userId)
        )
        .returning();

    if (result.length === 0) {
        throw new Error('Session not found or already terminated');
    }

    return { success: true, message: 'Session terminated' };
}

export async function createWallet(userId: number, walletPin: string) {
    // Retrieve the user to see if they already have a wallet
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.publicKey) {
        throw new Error('User already has a wallet');
    }

    try {
        // Generate a JWT token for the API call that can be verified using our JWKS
        const apiToken = generateApiToken(userId, 'chipi-api');

        // const wallet = await createArgentWallet({
        //     encryptKey: walletPin,
        //     apiPublicKey: env.apiKey,
        //     bearerToken: `Bearer ${apiToken}`,
        //     nodeUrl: env.nodeUrl,
        // });

        const wallet = await chipiSDK.createWallet({
            encryptKey: walletPin,
            bearerToken: `Bearer ${apiToken}`,
        });

        // Update the user record with the wallet ID
        await db.update(users)
            .set({ publicKey: wallet.wallet.publicKey, walletSecret: wallet.wallet.encryptedPrivateKey })
            .where(eq(users.id, userId));

        return { publicKey: wallet.wallet.publicKey, walletSecret: wallet.wallet.encryptedPrivateKey };
    } catch (error: any) {
        console.error('Wallet creation error:', error);
        throw new Error(`Failed to create wallet: ${error.message}`);
    }
}

export async function getWalletInfo(userId: number) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user || !user.publicKey) {
        throw new Error('User has no wallet');
    }

    try {
        return {
            publicKey: user.publicKey,
            walletSecret: user.walletSecret,
        };
    } catch (error: any) {
        throw new Error(`Failed to retrieve wallet info: ${error.message}`);
    }
} 