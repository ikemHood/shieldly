#!/bin/sh
set -e

echo "=== Database Migration Script ==="
echo "DB_URL: $DB_URL"
echo "NODE_ENV: $NODE_ENV"

# Test database connection
echo "Testing database connection..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "Waiting for database to be ready..."
  sleep 2
done

echo "Database is ready!"

# Wait a bit more to ensure database is fully initialized
sleep 5

# Run migrations with verbose output
echo "Running Drizzle migrations..."
pnpm exec drizzle-kit migrate

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi 