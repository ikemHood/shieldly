import { Context } from 'hono';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
}

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    method?: string;
    path?: string;
    status?: number;
    duration?: number;
    ip?: string;
    userAgent?: string;
    userId?: number;
    error?: any;
    requestId?: string;
    port?: number;
    environment?: string;
    logLevel?: string;
    [key: string]: any; // Allow additional properties
}

class Logger {
    private logLevel: LogLevel;
    private isDevelopment: boolean;

    constructor() {
        this.logLevel = this.getLogLevel();
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }

    private getLogLevel(): LogLevel {
        const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        switch (level) {
            case 'ERROR': return LogLevel.ERROR;
            case 'WARN': return LogLevel.WARN;
            case 'INFO': return LogLevel.INFO;
            case 'DEBUG': return LogLevel.DEBUG;
            default: return LogLevel.INFO;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.logLevel;
    }

    private formatLog(entry: LogEntry): string {
        if (this.isDevelopment) {
            // Pretty format for development
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            let message = `[${timestamp}] ${entry.level}: ${entry.message}`;

            if (entry.method && entry.path) {
                message += ` | ${entry.method} ${entry.path}`;
            }

            if (entry.status) {
                const statusColor = entry.status >= 400 ? '🔴' : entry.status >= 300 ? '🟡' : '🟢';
                message += ` ${statusColor} ${entry.status}`;
            }

            if (entry.duration) {
                message += ` (${entry.duration}ms)`;
            }

            if (entry.error) {
                message += `\n  Error: ${entry.error.message || entry.error}`;
                if (entry.error.stack) {
                    message += `\n  Stack: ${entry.error.stack}`;
                }
            }

            return message;
        } else {
            // JSON format for production
            return JSON.stringify(entry);
        }
    }

    private log(level: LogLevel, levelName: string, message: string, meta: Partial<LogEntry> = {}): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: levelName,
            message,
            ...meta,
        };

        const formattedLog = this.formatLog(entry);

        if (level === LogLevel.ERROR) {
            console.error(formattedLog);
        } else if (level === LogLevel.WARN) {
            console.warn(formattedLog);
        } else {
            console.log(formattedLog);
        }
    }

    error(message: string, error?: any, meta: Partial<LogEntry> = {}): void {
        this.log(LogLevel.ERROR, 'ERROR', message, { ...meta, error });
    }

    warn(message: string, meta: Partial<LogEntry> = {}): void {
        this.log(LogLevel.WARN, 'WARN', message, meta);
    }

    info(message: string, meta: Partial<LogEntry> = {}): void {
        this.log(LogLevel.INFO, 'INFO', message, meta);
    }

    debug(message: string, meta: Partial<LogEntry> = {}): void {
        this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
    }

    // Special method for API requests
    apiRequest(c: Context, duration: number, status: number): void {
        const method = c.req.method;
        const path = c.req.path;
        const ip = this.getClientIP(c);
        const userAgent = c.req.header('user-agent') || 'unknown';
        const requestId = c.get('requestId');
        const userId = c.get('userId');

        this.info('API Request', {
            method,
            path,
            status,
            duration,
            ip,
            userAgent,
            requestId,
            userId,
        });
    }

    // Special method for API errors
    apiError(c: Context, error: any, status: number): void {
        const method = c.req.method;
        const path = c.req.path;
        const ip = this.getClientIP(c);
        const userAgent = c.req.header('user-agent') || 'unknown';
        const requestId = c.get('requestId');
        const userId = c.get('userId');

        this.error('API Error', error, {
            method,
            path,
            status,
            ip,
            userAgent,
            requestId,
            userId,
        });
    }

    private getClientIP(c: Context): string {
        return (
            c.req.header('x-forwarded-for') ||
            c.req.header('x-real-ip') ||
            c.req.header('cf-connecting-ip') ||
            'unknown'
        );
    }
}

export const logger = new Logger(); 