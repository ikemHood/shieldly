import { Context, Next } from 'hono';
import { logger } from '../utils/logger';
import { randomBytes } from 'crypto';

// Middleware to add request ID to context
export const requestId = async (c: Context, next: Next) => {
    const requestId = randomBytes(8).toString('hex');
    c.set('requestId', requestId);
    c.header('X-Request-ID', requestId);
    await next();
};

// Middleware to log all API requests and responses
export const requestLogger = async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const requestId = c.get('requestId');

    // Log incoming request
    logger.debug('Incoming request', {
        method,
        path,
        requestId,
        ip: getClientIP(c),
        userAgent: c.req.header('user-agent') || 'unknown',
    });

    try {
        await next();

        const duration = Date.now() - start;
        const status = c.res.status;

        // Log successful response
        logger.apiRequest(c, duration, status);

    } catch (error: any) {
        const duration = Date.now() - start;
        const status = error.status || 500;

        // Log error response
        logger.apiError(c, error, status);

        // Re-throw the error so it can be handled by error middleware
        throw error;
    }
};

// Enhanced error handler that logs errors
export const errorLogger = (error: Error, c: Context) => {
    const status = (error as any).status || 500;

    // Log the error
    logger.apiError(c, error, status);

    // Return error response
    return c.json(
        {
            error: error.message || 'Internal Server Error',
            requestId: c.get('requestId'),
            timestamp: new Date().toISOString(),
        },
        status
    );
};

// Helper function to get client IP
function getClientIP(c: Context): string {
    return (
        c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        c.req.header('cf-connecting-ip') ||
        'unknown'
    );
} 