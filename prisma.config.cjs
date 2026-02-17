// CommonJS Prisma config using `@prisma/config` helpers.
// This uses `defineConfig` and `env` so Prisma CLI can validate and
// resolve environment-aware values like DATABASE_URL.
// Ensure .env is loaded for env resolution when running Prisma CLI
require('dotenv').config();
const { defineConfig, env } = require('@prisma/config');

module.exports = defineConfig({
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    provider: 'postgresql',
    url: env('DATABASE_URL'),
  },
  client: {
    adapter: {
      provider: 'postgresql',
      url: env('DATABASE_URL'),
    },
  },
});
