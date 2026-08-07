import express from 'express';
import cors from 'cors';
import config from './src/config/index.js';

// Route imports
import urlRoutes from './src/routes/url.routes.js';
import qrRoutes from './src/routes/qr.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import { redirectToOriginal } from './src/controllers/redirect.controller.js';

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    config.clientUrl,
    /\.vercel\.app$/,
    /\.netlify\.app$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Also handle /.netlify/functions/api prefixed routes
app.get('/.netlify/functions/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes — regular paths
app.use('/api', urlRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/analytics', analyticsRoutes);

// API Routes — Netlify functions prefix paths
app.use('/.netlify/functions/api/api', urlRoutes);
app.use('/.netlify/functions/api/api/qr', qrRoutes);
app.use('/.netlify/functions/api/api/analytics', analyticsRoutes);

// Redirect route for short codes
app.get('/r/:shortCode', redirectToOriginal);
app.get('/.netlify/functions/api/r/:shortCode', redirectToOriginal);

export default app;
