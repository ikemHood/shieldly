import { OAuth2Client } from 'google-auth-library';
import env from '../env';
import { db, users } from '../db';
import { eq } from 'drizzle-orm';

// Create OAuth2 client
const oauth2Client = new OAuth2Client(
    env.google.clientID,
    env.google.clientSecret,
    env.google.callbackURL
);

/**
 * Generate the Google authorization URL
 */
export function getGoogleAuthUrl(): string {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true,
    });
}

/**
 * Exchange authorization code for tokens and fetch user info
 */
export async function getGoogleUserInfo(code: string) {
    try {
        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info
        const userInfoClient = new OAuth2Client();
        userInfoClient.setCredentials(tokens);

        const response = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch user info from Google');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting Google user info:', error);
        throw error;
    }
}

/**
 * Process Google user info and return the local user
 */
export async function processGoogleUser(userInfo: any) {
    // Check if user exists by Google ID
    const existingUser = await db.query.users.findFirst({
        where: eq(users.googleId, userInfo.id)
    });

    if (existingUser) {
        // User already exists, return it
        return existingUser;
    }

    // If user has email but doesn't have googleId, update the user
    if (userInfo.email) {
        const userByEmail = await db.query.users.findFirst({
            where: eq(users.email, userInfo.email)
        });

        if (userByEmail) {
            // Update existing user with googleId
            const [updatedUser] = await db
                .update(users)
                .set({
                    googleId: userInfo.id,
                    isVerified: true, // Auto-verify users who sign in with Google
                    firstName: userInfo.given_name || userByEmail.firstName,
                    lastName: userInfo.family_name || userByEmail.lastName,
                    updatedAt: new Date()
                })
                .where(eq(users.id, userByEmail.id))
                .returning();

            return updatedUser;
        }
    }

    // Create new user
    const [newUser] = await db
        .insert(users)
        .values({
            googleId: userInfo.id,
            email: userInfo.email || null,
            firstName: userInfo.given_name || null,
            lastName: userInfo.family_name || null,
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();

    return newUser;
} 