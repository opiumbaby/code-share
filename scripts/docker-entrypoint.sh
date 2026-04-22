#!/bin/sh
set -e

echo "Waiting for database and applying schema..."
npm run db:push

echo "Applying Better Auth schema..."
npm run auth:migrate

echo "Seeding database..."
npm run db:seed

echo "Starting Next.js on 0.0.0.0:${PORT:-3000}..."
npm run start -- -H 0.0.0.0 -p "${PORT:-3000}"
