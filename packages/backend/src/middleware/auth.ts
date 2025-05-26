import { Context, Next } from 'hono';
import { verify, decode } from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { jwksService } from '../services/jwks';

// Add type declaration to augment Hono's Context
declare module 'hono' {
    interface ContextVariableMap {
        userId: number;
    }
}

export const requireAuth = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized - Missing or invalid token format' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        // First decode the token to get the kid from header
        const decodedHeader = decode(token, { complete: true });
        if (!decodedHeader || typeof decodedHeader === 'string') {
            return c.json({ error: 'Unauthorized - Invalid token format' }, 401);
        }

        const kid = decodedHeader.header.kid;
        if (!kid) {
            return c.json({ error: 'Unauthorized - Token missing key ID' }, 401);
        }

        // Get the key pair for this kid
        const keyPair = jwksService.getKeyPair(kid);
        if (!keyPair) {
            return c.json({ error: 'Unauthorized - Key not found' }, 401);
        }

        // Verify the token using the public key
        const decoded = verify(token, keyPair.publicKey, {
            algorithms: ['RS256'],
            issuer: 'shieldly-backend',
            audience: 'shieldly-app'
        }) as { userId: number };

        c.set('userId', decoded.userId);
        await next();
    } catch (error) {
        return c.json({ error: 'Unauthorized - Invalid or expired token' }, 401);
    }
};

export const requireAdmin = async (c: Context, next: Next) => {
    const userId = c.get('userId');
    if (!userId) {
        return c.json({ error: 'Unauthorized - Missing or invalid token' }, 401);
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user || !user.isAdmin) {
        return c.json({ error: 'Unauthorized - User is not an admin' }, 401);
    }

    await next();
};
