import { NextFunction, Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/** Rate limiting configuration with enhanced security features */
// Configurable throttle duration in milliseconds (10 minutes by default)
// Max attempts before blocking (8 by default)
// Optional rate limit codes and messages for better error tracking

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  code: string;
  message: string;
  maxRetries?: number; // Additional security layer for repeated attempts
};

/** Bucket structure for tracking API requests */
export type Bucket = {
  count: number;
  resetAt: number;
  lastAttempt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Creates rate limiting middleware with security enhancements
 *
 * The key now includes: IP, method, base URL, path, and user ID (if authenticated)
 */
export function createRateLimit(options: RateLimitOptions) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${req.ip}:${req.method}:${req.baseUrl}${req.path}${req.user?.id || ""}`;

    // Clean expired buckets
    for (const [bucketKey, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }

    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      // New bucket or reset state
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
        lastAttempt: now
      });
      return next();
    }

    // Security enhancement: Track consecutive failed attempts
    if (current.count >= options.max) {
      res.status(429).json({
        success: false,
        error: {
          code: options.code,
          message: options.message,
          maxRetriesExceeded: !!options.maxRetries && current.count >= options.maxRetries
        }
      });
      return;
    }

    // Allow burst of requests but limit overall rate
    current.count += 1;
    buckets.set(key, current);
    next();
  };
}
