import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter.
 * @param maxAttempts Max requests allowed in the window.
 * @param windowMs Time window in milliseconds.
 */
export function rateLimiter(maxAttempts: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.ip ?? '') + ':' + (req.body?.phone ?? req.path);
    const now = Date.now();
    const entry = store.get(key);

    if (entry && now < entry.resetAt) {
      if (entry.count >= maxAttempts) {
        res.status(429).json({ error: 'Too many attempts. Please try again later.' });
        return;
      }
      entry.count++;
    } else {
      store.set(key, { count: 1, resetAt: now + windowMs });
    }

    next();
  };
}
