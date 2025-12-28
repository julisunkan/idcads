import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

export function createRateLimiter(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    
    const entry = store.get(key);
    
    if (!entry || entry.resetTime < now) {
      // New window
      store.set(key, { count: 1, resetTime: now + windowMs });
      next();
    } else if (entry.count < maxRequests) {
      // Within limit
      entry.count++;
      next();
    } else {
      // Rate limit exceeded
      res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }
  };
}

// Cleanup old entries every hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  store.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => store.delete(key));
}, 60 * 60 * 1000);
