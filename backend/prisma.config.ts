import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Explicitly load .env because Prisma evaluates this file via jiti (its own TS
// runtime) which does not inherit the -r dotenv/config preload from the npm script.
config({ path: resolve(process.cwd(), '.env') });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
