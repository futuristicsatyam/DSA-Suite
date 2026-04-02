#!/bin/bash

echo "🔄 Waiting for database to wake up..."

MAX_RETRIES=15
DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i/$MAX_RETRIES: Connecting to database..."
  npx prisma migrate deploy --schema prisma/schema.prisma 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Database migration successful!"
    break
  fi
  if [ $i -eq $MAX_RETRIES ]; then
    echo "❌ Could not connect after $MAX_RETRIES attempts. Starting server anyway..."
    break
  fi
  echo "⏳ Retrying in ${DELAY}s..."
  sleep $DELAY
done

echo "🌱 Seeding database..."
npx ts-node --compiler-options '{"module":"commonJS"}' prisma/seed.ts 2>&1 || echo "⚠️ Seeding skipped (may already be seeded)"

echo "🚀 Starting API server..."
node dist/src/main