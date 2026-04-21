import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/products/products.routes';
import categoryRoutes from './modules/categories/categories.routes';
import brandRoutes from './modules/brands/brands.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/orders/orders.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import aiRoutes from './modules/ai/ai.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many requests' }));
app.use('/api/ai', rateLimit({ windowMs: 60 * 1000, max: 30, message: 'AI rate limit exceeded' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 200 }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Error handler
app.use(errorHandler);

export default app;
