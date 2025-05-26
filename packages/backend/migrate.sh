#!/bin/sh

echo "Starting database migration..."
echo "DB_URL: $DB_URL"

# Wait for database to be ready
echo "Waiting for database to be ready..."
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DB_URL });
client.connect()
  .then(() => {
    console.log('Database connection successful');
    client.end();
    process.exit(0);
  })
  .catch(err => {
    console.log('Database not ready:', err.message);
    process.exit(1);
  });
"; do
  echo "Database not ready, waiting 2 seconds..."
  sleep 2
done

echo "Database is ready, running migrations..."

# Run migrations with detailed output
pnpm exec drizzle-kit migrate --verbose

if [ $? -eq 0 ]; then
  echo "Migrations completed successfully!"
else
  echo "Migration failed with exit code $?"
  exit 1
fi 