import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import tripRoutes from './routes/tripRoutes';
import requestRoutes from './routes/requestRoutes';
import matchRoutes from './routes/matchRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import paymentRoutes from './routes/paymentRoutes';
import conversationRoutes from './routes/conversationRoutes';
import ratingRoutes from './routes/ratingRoutes';
import verificationRoutes from './routes/verificationRoutes';
import reportRoutes from './routes/reportRoutes';
import disputeRoutes from './routes/disputeRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again shortly.', code: 'RATE_LIMITED' },
  });
  app.use('/api', limiter);

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      status: 'ok',
      mode: {
        auth: env.FIREBASE_CONFIGURED ? 'firebase' : 'demo-jwt',
        payments: env.RAZORPAY_CONFIGURED ? 'razorpay' : 'demo',
        maps: env.MAPS_CONFIGURED ? env.MAPS_PROVIDER : 'demo',
        storage: env.FIREBASE_STORAGE_BUCKET ? 'firebase-storage' : 'inline-base64',
        database: env.USE_IN_MEMORY_DB ? 'in-memory' : 'atlas',
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/deliveries', deliveryRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/ratings', ratingRoutes);
  app.use('/api/verification', verificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/disputes', disputeRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/uploads', uploadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
