# Shieldly Backend - Docker Deployment Guide

This guide covers how to deploy the Shieldly backend application using Docker
and Docker Compose.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- At least 5GB disk space

## 🚀 Quick Start (Development)

1. **Clone and setup environment**:
   ```bash
   git clone <repository-url>
   cd shieldly/packages/backend
   cp env.example .env
   ```

2. **Edit environment variables**:
   ```bash
   nano .env
   # Update the required API keys and secrets
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**:
   ```bash
   docker-compose exec backend pnpm migrate
   ```

5. **Verify deployment**:
   ```bash
   curl http://localhost:3000/health
   ```

## 🏗️ Architecture

The Docker setup includes:

- **Backend Service**: Node.js application running on port 3000
- **PostgreSQL Database**: Database server with persistent storage
- **Migration Service**: One-time database migration runner
- **Nginx** (Production): Reverse proxy with SSL termination

## 📁 File Structure

```
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Development configuration
├── docker-compose.prod.yml    # Production configuration
├── .dockerignore              # Docker build exclusions
├── nginx.conf                 # Nginx reverse proxy config
├── init-db.sql               # Database initialization
└── env.example               # Environment variables template
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Required for production
API_KEY=your-chipi-api-key
SECRET_KEY=your-secret-key
JWT_SECRET=your-long-random-jwt-secret
POSTGRES_PASSWORD=your-secure-db-password

# Optional (with defaults)
PORT=3000
NODE_ENV=production
DB_URL=postgresql://postgres:password@postgres:5432/shieldly
```

### Database Configuration

The PostgreSQL database is configured with:

- Database: `shieldly`
- User: `postgres`
- Password: Set via `POSTGRES_PASSWORD` environment variable
- Persistent volume: `postgres_data`

## 🚀 Deployment Options

### Development Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d

# With custom environment file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### SSL/HTTPS Setup (Production)

1. **Obtain SSL certificates**:
   ```bash
   mkdir ssl
   # Copy your SSL certificate files:
   # ssl/cert.pem (certificate)
   # ssl/key.pem (private key)
   ```

2. **Enable Nginx service**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d nginx
   ```

## 🔍 Monitoring & Maintenance

### Health Checks

All services include health checks:

```bash
# Check service status
docker-compose ps

# Backend health endpoint
curl http://localhost:3000/health

# JWKS endpoint
curl http://localhost:3000/.well-known/jwks.json
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow backend logs
docker-compose logs -f backend

# View database logs
docker-compose logs postgres
```

### Database Management

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d shieldly

# Backup database
docker-compose exec postgres pg_dump -U postgres shieldly > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres shieldly < backup.sql
```

### Updates and Maintenance

```bash
# Update application
git pull
docker-compose build --no-cache backend
docker-compose up -d backend

# Run new migrations
docker-compose exec backend pnpm migrate

# Clean up old images
docker image prune -f
```

## 🔒 Security Considerations

### Production Security

1. **Environment Variables**: Never commit `.env` files
2. **Database**: Use strong passwords and limit access
3. **SSL**: Always use HTTPS in production
4. **Firewall**: Restrict access to necessary ports only
5. **Updates**: Keep Docker images updated

### Network Security

```bash
# The application uses an isolated Docker network
# Only exposed ports are accessible from outside

# Development: 3000 (backend), 5432 (database)
# Production: 80, 443 (nginx), 3000 (backend)
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using port 3000
   lsof -i :3000

   # Use different port
   PORT=3001 docker-compose up -d
   ```

2. **Database connection issues**:
   ```bash
   # Check database status
   docker-compose exec postgres pg_isready -U postgres

   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

3. **Permission issues**:
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Memory issues**:
   ```bash
   # Check Docker resource usage
   docker stats

   # Increase Docker memory limit in Docker Desktop
   ```

### Debug Mode

```bash
# Run with debug logging
LOG_LEVEL=DEBUG docker-compose up -d

# Run backend in development mode
docker-compose exec backend pnpm dev
```

## 📊 Performance Tuning

### Resource Limits

Production configuration includes resource limits:

```yaml
deploy:
    resources:
        limits:
            cpus: "1.0"
            memory: 1G
        reservations:
            cpus: "0.5"
            memory: 512M
```

### Database Optimization

```sql
-- Connect to database and run:
-- Check database performance
SELECT * FROM pg_stat_activity;

-- Optimize queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3

            - name: Deploy to server
              run: |
                  docker-compose -f docker-compose.prod.yml pull
                  docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Support

For issues and questions:

1. Check the logs: `docker-compose logs`
2. Verify health endpoints: `curl http://localhost:3000/health`
3. Review environment variables
4. Check Docker resource usage: `docker stats`

## 🔗 Useful Commands

```bash
# Complete reset (removes all data)
docker-compose down -v --remove-orphans
docker system prune -a

# Scale backend service
docker-compose up -d --scale backend=3

# Execute commands in running container
docker-compose exec backend sh

# Copy files from container
docker-compose cp backend:/app/logs ./logs
```
