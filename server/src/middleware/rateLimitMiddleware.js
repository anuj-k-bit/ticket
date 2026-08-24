import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 login/register requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      code: 429
    }
  }
});

export const holdLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 hold requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many seat hold requests. Please slow down.',
      code: 429
    }
  }
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests from this IP. Please try again later.',
      code: 429
    }
  }
});
