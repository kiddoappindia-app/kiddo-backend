import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().default('kiddo-bf68d'),
});

export const env = envSchema.parse(process.env);

/**
 * Parse CLIENT_ORIGIN as a comma-separated list of allowed origins.
 * Supports exact strings and wildcard patterns (e.g., `exp://*`).
 */
export const allowedOrigins: string[] = env.CLIENT_ORIGIN
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * CORS origin checker that supports wildcards in the allowed list.
 * Returns true if the request origin is allowed.
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  return allowedOrigins.some((allowed) => {
    if (allowed.includes('*')) {
      // Escape RegExp special characters (like . ? + etc) and then replace * with .*
      const escaped = allowed
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape all regex chars except *
        .replace(/\*/g, '.*');               // convert wildcard * to .*
      const regex = new RegExp('^' + escaped + '$');
      return regex.test(origin);
    }
    return allowed === origin;
  });
}
