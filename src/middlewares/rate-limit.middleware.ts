import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 100 requests per minute per IP.
 * Applied to all /api/v1/* routes.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 100,                   // 100 requests per window
  standardHeaders: true,      // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,       // Disable X-RateLimit-* headers
  message: { message: 'Too many requests, please try again later.' },
});

/**
 * Strict rate limiter for auth endpoints — 10 requests per 15 minutes per IP.
 * Protects login, register, token refresh from brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' },
});
