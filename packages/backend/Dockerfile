# Multi-stage Dockerfile for Shieldly Backend
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (handle missing lockfile)
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

# Copy source code
COPY . .


# Stage 2: Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S shieldly -u 1001

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --prod; else pnpm install --prod; fi

# Copy built application from builder stage
COPY --from=builder --chown=shieldly:nodejs /app/src ./src
COPY --from=builder --chown=shieldly:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=shieldly:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=shieldly:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=shieldly:nodejs /app/migrate.sh ./migrate.sh

# Install tsx for running TypeScript directly (since no build script exists)
RUN pnpm add tsx

# Install drizzle-kit for migrations and pg for connection testing
RUN pnpm add drizzle-kit pg

# Make migration script executable
RUN chmod +x ./migrate.sh

# Switch to non-root user
USER shieldly

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["pnpm", "start"] 