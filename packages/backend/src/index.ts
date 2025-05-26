import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { networkInterfaces } from 'os';
import env from './env';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import notificationRouter from './routes/notification';
import adminRouter from './routes/admin';
import jwksRouter from './routes/jwks';
import { serveEmojiFavicon, onError } from 'stoker/middlewares'
import { NotFoundHandler } from 'hono'
import { requestId, requestLogger, errorLogger } from './middleware/logging';
import { logger } from './utils/logger';

const app = new Hono();

export const notFound: NotFoundHandler = (c) => {
    logger.warn('Route not found', {
        method: c.req.method,
        path: c.req.path,
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
        userAgent: c.req.header('user-agent') || 'unknown',
        requestId: c.get('requestId'),
    });

    return c.json(
        {
            message: 'Ahhh!, Lost your way? 🤔',
            Go: 'https://www.shieldly.xyz',
            requestId: c.get('requestId'),
        },
        404,
    )
}

// Add request ID to all requests
app.use('*', requestId);

// Add request logging to all requests
app.use('*', requestLogger);

// Enable CORS for mobile app requests
app.use('*', cors({
    origin: '*', // Allow all origins in development
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use(serveEmojiFavicon("🔒"));

// Use custom error logger instead of default onError
app.onError(errorLogger);
app.notFound(notFound);

app.get('/', (c) => {
    return c.json({
        message: 'Ahhh!, Lost your way? 🤔',
        Go: 'https://www.shieldly.xyz',
    })
})

app.route('/auth', authRouter);
app.route('/user', userRouter);
app.route('/notification', notificationRouter);
app.route('/admin', adminRouter);
app.route('/', jwksRouter);

// Function to get local IP address
const getLocalIPAddress = (): string[] => {
    const nets = networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(nets)) {
        const netInterface = nets[name];
        if (!netInterface) continue;

        for (const net of netInterface) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }

    return results;
};

app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() }));

// Test endpoint for mobile app connectivity
app.get('/test', (c) => {
    const localIPs = getLocalIPAddress();
    return c.json({
        message: 'Server is accessible from mobile app!',
        timestamp: new Date().toISOString(),
        userAgent: c.req.header('user-agent') || 'unknown',
        serverIPs: localIPs
    });
});

serve({
    fetch: app.fetch,
    port: Number(env.port),
    hostname: '0.0.0.0',
}, (info) => {
    const localIPs = getLocalIPAddress();

    logger.info('Server started successfully', {
        port: info.port,
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'INFO',
    });

    console.log(`🚀 Server running on http://localhost:${info.port}`);
    console.log(`🌐 Server accessible on all interfaces: http://0.0.0.0:${info.port}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Log Level: ${process.env.LOG_LEVEL || 'INFO'}`);
    console.log(`\n📱 Mobile App Connection URLs:`);
    console.log(`   • iOS Simulator: http://localhost:${info.port} \n`);

    if (localIPs.length > 0) {
        console.log(`   • Physical Devices:`);
        localIPs.forEach(ip => {
            console.log(`     - http://${ip}:${info.port}`);
        });
    }

    console.log(`\n 💚 Health check: GET /health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down server gracefully');
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down server gracefully');
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason, { promise: promise.toString() });
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});