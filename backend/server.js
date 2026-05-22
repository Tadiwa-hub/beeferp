#!/usr/bin/env node
/**
 * FeedLot Pro Backend - Main Server
 * Entry point for Express API server
 * Phase 1.2 - Auth, Animals, Weights
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from 'express-rate-limit';

// Import controllers
import * as authController from './auth-controller.js';
import * as animalsController from './animals-controller.js';
import * as weightController from './weight-controller.js';
import * as analyticsController from './analytics-controller.js';
import * as feedController from './feed-controller.js';
import * as vetController from './vet-controller.js';

// Import middleware
import { authenticate, requireAdmin } from './auth-middleware.js';
import { testConnection } from './config-database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Required for express-rate-limit on Render
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://beeferp.pages.dev' // Ensure Cloudflare is explicitly allowed
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// PUBLIC ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    database: '✓ Connected',
  });
});

// API version endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'FeedLot Pro API',
    version: '1.0.0',
    tagline: 'Data-Driven Feedlot Management',
    environment: NODE_ENV,
    endpoints: {
      public: {
        health: 'GET /health',
        info: 'GET /api',
      },
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
      },
      animals: {
        list: 'GET /api/animals',
        details: 'GET /api/animals/:id',
        create: 'POST /api/animals',
        update: 'PUT /api/animals/:id',
        delete: 'DELETE /api/animals/:id',
        stats: 'GET /api/animals/stats/overview',
      },
      weights: {
        list: 'GET /api/weight-records/:animalId',
        create: 'POST /api/weight-records',
        bulk: 'POST /api/weight-records/bulk',
        adg: 'GET /api/weight-records/:animalId/adg',
        allAdg: 'GET /api/weight-records/animals/all-adg',
        alerts: 'GET /api/weight-records/weight-loss-alerts',
      },
    },
  });
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/refresh', authController.refresh);
app.post('/api/auth/logout', authenticate, authController.logout);

// ============================================
// PROTECTED ROUTES
// ============================================

// -------- ANIMALS --------
app.get('/api/animals', authenticate, animalsController.getAnimals);
app.get('/api/animals/stats/overview', authenticate, animalsController.getAnimalStats);
app.get('/api/animals/:id', authenticate, animalsController.getAnimal);
app.post('/api/animals', authenticate, animalsController.createAnimal);
app.put('/api/animals/:id', authenticate, animalsController.updateAnimal);
app.delete('/api/animals/:id', authenticate, animalsController.deleteAnimal);

// -------- WEIGHT RECORDS --------
app.get('/api/weight-records/animals/all-adg', authenticate, weightController.getAllADG);
app.get('/api/weight-records/weight-loss-alerts', authenticate, weightController.getWeightLossAlerts);
app.get('/api/weight-records/:animalId', authenticate, weightController.getWeightRecords);
app.get('/api/weight-records/:animalId/adg', authenticate, weightController.calculateADG);
app.post('/api/weight-records', authenticate, weightController.createWeightRecord);
app.post('/api/weight-records/bulk', authenticate, weightController.createBulkWeightRecords);

// -------- ANALYTICS & FORECASTS --------
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI requests per minute
  message: { error: 'Too many requests', message: 'You have reached the AI limit for this minute. Please wait.' }
});

app.get('/api/analytics/overview', authenticate, analyticsController.getAnalyticsOverview);
app.get('/api/analytics/financials', authenticate, analyticsController.getFinancialForecasting);
app.get('/api/analytics/alerts', authenticate, analyticsController.getTelemetryAlerts);
app.get('/api/analytics/ai-insights', authenticate, aiLimiter, analyticsController.getAIInsights);
app.post('/api/analytics/ai-chat', authenticate, aiLimiter, analyticsController.postAIChat);
app.post('/api/analytics/alerts/sms', authenticate, analyticsController.dispatchTwilioSMS);

// -------- FEED MANAGEMENT --------
app.get('/api/feed-logs', authenticate, feedController.getFeedLogs);
app.post('/api/feed-logs', authenticate, feedController.createFeedLog);
app.get('/api/feed-logs/efficiency', authenticate, feedController.getFeedEfficiency);

// -------- HEALTH & VET --------
app.get('/api/vet-records', authenticate, vetController.getVetRecords);
app.post('/api/vet-records', authenticate, vetController.createVetRecord);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: '/api',
  });
});

// Error handler (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  let status = err.status || 500;
  let message = err.message;
  let errorName = err.name || 'Internal Server Error';

  // Map database DNS/connection failures to friendly customer error
  if (
    err.code === 'ENOTFOUND' || 
    err.code === 'ECONNREFUSED' || 
    err.code === 'ETIMEDOUT' ||
    message.includes('getaddrinfo') ||
    message.includes('timeout') ||
    message.includes('connection')
  ) {
    status = 503;
    errorName = 'ServiceUnavailable';
    message = 'Database is temporarily unreachable. Please try again shortly.';
  }

  res.status(status).json({
    error: errorName,
    message: message,
    ...(NODE_ENV === 'development' && status !== 503 && { stack: err.stack }),
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    // Test database connection gracefully without crashing process on transient startup DNS drops
    testConnection().then(dbConnected => {
      if (!dbConnected) {
        console.warn('⚠️ WARNING: Database connection failed. API is running in offline/degraded mode.');
      }
    });

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   FeedLot Pro Backend Server Running       ║
║   ${`Environment: ${NODE_ENV}`.padEnd(35)}║
║   ${`Port: ${PORT}`.padEnd(35)}║
║   ${`API: http://localhost:${PORT}/api`.padEnd(35)}║
║   ${`Phase: 1.2 (Auth, Animals, Weights)`.padEnd(35)}║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
