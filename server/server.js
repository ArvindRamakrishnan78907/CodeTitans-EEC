import express from 'express';
import cors from 'cors';
import { getDb, closeDb } from './src/models/db.js';
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
    // Allow any Vercel preview deployments
    /\.vercel\.app$/
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
    if (!req.url.includes('/api/')) return;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (must be before the redirect catch-all)
app.use('/api', urlRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/analytics', analyticsRoutes);

// Redirect route (catch-all for short codes — MUST be last)
app.get('/:shortCode', redirectToOriginal);

// Start server
async function start() {
  try {
    await getDb();
    console.log('📦 Database ready');

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`\n🚀 Mission Alpha — URL Shortener`);
      console.log(`   Server running at: http://0.0.0.0:${config.port}`);
      console.log(`   API base: ${config.baseUrl}/api`);
      console.log(`   Client URL: ${config.clientUrl}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});

start();
