import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import waitlistRoutes from './routes/waitlistRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

import { globalErrorHandler } from './middleware/errorMiddleware.js';
import { generalLimiter } from './middleware/rateLimitMiddleware.js';

dotenv.config({ path: '../.env' });

const app = express();

// Requirement 8: Security Headers with Helmet (cross-origin resource policy permissive for images/sockets)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Requirement 8: Sanitize incoming request data against NoSQL Injection attacks
app.use(mongoSanitize());

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10kb' }));

// Requirement 4: General API rate limiting
app.use('/api', generalLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Ticket Booking API Server is running.', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: `Route ${req.originalUrl} not found`, code: 404 } });
});

// Requirement 7: Centralized Error-Handling Middleware
app.use(globalErrorHandler);

export default app;
