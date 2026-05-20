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

// Import controllers
import * as authController from './auth-controller.js';
import * as animalsController from './animals-controller.js';
import * as weightController from './weight-controller.js';

// Import middleware
import { authenticate, requireAdmin } from './auth-middleware.js';
import { testConnection } from './config-database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
app.get('/api/weight-records/:animalId', authenticate, weightController.getWeightRecords);
app.get('/api/weight-records/:animalId/adg', authenticate, weightController.calculateADG);
app.get('/api/weight-records/animals/all-adg', authenticate, weightController.getAllADG);
app.get('/api/weight-records/weight-loss-alerts', authenticate, weightController.getWeightLossAlerts);
app.post('/api/weight-records', authenticate, weightController.createWeightRecord);
app.post('/api/weight-records/bulk', authenticate, weightController.createBulkWeightRecords);

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
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('✗ Cannot start server: Database connection failed');
      process.exit(1);
    }

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
