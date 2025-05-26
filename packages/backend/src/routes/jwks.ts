import { Hono } from 'hono';
import { jwksService } from '../services/jwks';
import { requireAdmin } from '../middleware/auth';
import { sign, verify, decode } from 'jsonwebtoken';

const jwksRouter = new Hono();

/**
 * JWKS endpoint - exposes public keys for JWT verification
 * This endpoint is typically used by clients to verify JWT signatures
 */
jwksRouter.get('/.well-known/jwks.json', async (c) => {
    try {
        const jwks = jwksService.getJWKS();

        // Set appropriate cache headers
        c.header('Cache-Control', 'public, max-age=3600');
        c.header('Content-Type', 'application/json');

        return c.json(jwks);
    } catch (error: any) {
        console.error('Error serving JWKS:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * Alternative JWKS endpoint (some systems expect this path)
 */
jwksRouter.get('/jwks.json', async (c) => {
    try {
        const jwks = jwksService.getJWKS();

        // Set appropriate cache headers
        c.header('Cache-Control', 'public, max-age=3600');
        c.header('Content-Type', 'application/json');

        return c.json(jwks);
    } catch (error: any) {
        console.error('Error serving JWKS:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * Admin endpoint to rotate keys (protected)
 */
jwksRouter.post('/admin/rotate-keys', requireAdmin, async (c) => {
    try {
        const newKid = jwksService.rotateKeys();

        return c.json({
            message: 'Keys rotated successfully',
            newKeyId: newKid
        });
    } catch (error: any) {
        console.error('Error rotating keys:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * Admin endpoint to clean up old keys (protected)
 */
jwksRouter.post('/admin/cleanup-keys', requireAdmin, async (c) => {
    try {
        const maxAgeDays = parseInt(c.req.query('maxAgeDays') || '30');
        jwksService.cleanupOldKeys(maxAgeDays);

        return c.json({
            message: `Cleaned up keys older than ${maxAgeDays} days`
        });
    } catch (error: any) {
        console.error('Error cleaning up keys:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * Health check endpoint for JWKS service
 */
jwksRouter.get('/health', async (c) => {
    try {
        const currentKeyPair = jwksService.getCurrentKeyPair();
        const jwks = jwksService.getJWKS();

        return c.json({
            status: 'healthy',
            currentKeyId: currentKeyPair?.kid || null,
            totalKeys: jwks.keys.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('JWKS health check failed:', error);
        return c.json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        }, 500);
    }
});

/**
 * Test endpoint to generate and verify a JWT token
 */
jwksRouter.get('/test-token', async (c) => {
    try {
        // Get current key pair
        const currentKeyPair = jwksService.getCurrentKeyPair();
        if (!currentKeyPair) {
            return c.json({ error: 'No active key pair available' }, 500);
        }

        // Generate a test token
        const testPayload = {
            userId: 123,
            scope: 'test'
        };

        const token = sign(testPayload, currentKeyPair.privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h',
            issuer: 'shieldly-backend',
            audience: 'test-audience',
            keyid: currentKeyPair.kid
        });

        // Verify the token using the public key
        const verified = verify(token, currentKeyPair.publicKey, {
            algorithms: ['RS256'],
            issuer: 'shieldly-backend',
            audience: 'test-audience'
        });

        // Decode the token to show header info
        const decoded = decode(token, { complete: true });

        return c.json({
            message: 'JWT token test successful',
            token,
            verified,
            header: decoded?.header,
            jwksUrl: `${c.req.url.split('/test-token')[0]}/.well-known/jwks.json`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('JWT test failed:', error);
        return c.json({
            error: 'JWT test failed',
            message: error.message,
            timestamp: new Date().toISOString()
        }, 500);
    }
});

export default jwksRouter; 