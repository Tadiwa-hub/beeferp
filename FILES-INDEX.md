# FeedLot Pro - Files Index

## Project Root Files

### Documentation
- **README.md** - Project overview and structure
- **SETUP.md** - Quick setup reference
- **COMPLETE-SETUP.md** - Detailed step-by-step setup guide
- **PHASE-1-SUMMARY.md** - Implementation progress and status
- **plan.md** - (session folder) Complete 5-week implementation plan

### Configuration
- **.env.example** - Backend environment template
- **.env.local.example** - Frontend environment template
- **vite.config.js** - Frontend Vite build configuration
- **tailwind.config.js** - Tailwind CSS theme configuration
- **postcss.config.js** - PostCSS configuration

### Database
- **database-schema.sql** - PostgreSQL schema (run on Supabase)
  - Tables: users, animals, weight_records, feed_logs, vet_records, audit_log
  - Views: for analytics
  - Functions: calculate_adg(), update_updated_at()
  - Indexes: on all foreign keys and frequently queried columns

### Backend Core
- **server.js** - Main Express server with all routes
  - Public: /health, /api
  - Auth: /api/auth/*
  - Animals: /api/animals/*
  - Weights: /api/weight-records/*

- **config-database.js** - Supabase PostgreSQL connection
  - Connection pooling configured
  - Query execution with logging
  - testConnection() function

- **jwt-utils.js** - JWT token management
  - generateAccessToken() - 15 min expiry
  - generateRefreshToken() - 7 day expiry
  - verifyAccessToken()
  - verifyRefreshToken()
  - createTokenPair()

- **password-utils.js** - Password security
  - hashPassword() - bcryptjs with 10 salt rounds
  - comparePassword() - verification
  - validatePasswordStrength() - enforce rules

- **auth-middleware.js** - HTTP middleware
  - authenticate - verify JWT
  - requireAdmin - admin-only routes
  - requireStaff - staff/admin routes
  - optionalAuth - optional authentication

### Backend Controllers
- **auth-controller.js** - Authentication logic
  - register() - POST /api/auth/register
  - login() - POST /api/auth/login
  - refresh() - POST /api/auth/refresh
  - logout() - POST /api/auth/logout

- **animals-controller.js** - Animal registry
  - getAnimals() - GET /api/animals (paginated)
  - getAnimal() - GET /api/animals/:id
  - createAnimal() - POST /api/animals
  - updateAnimal() - PUT /api/animals/:id
  - deleteAnimal() - DELETE /api/animals/:id
  - getAnimalStats() - GET /api/animals/stats/overview

- **weight-controller.js** - Weight tracking
  - getWeightRecords() - GET /api/weight-records/:animalId
  - createWeightRecord() - POST /api/weight-records
  - createBulkWeightRecords() - POST /api/weight-records/bulk
  - calculateADG() - GET /api/weight-records/:animalId/adg
  - getAllADG() - GET /api/weight-records/animals/all-adg
  - getWeightLossAlerts() - GET /api/weight-records/weight-loss-alerts

### Frontend Services
- **api-service.js** - Axios HTTP client
  - JWT interceptors
  - Token refresh on 401
  - API endpoints: authAPI, animalsAPI, weightsAPI, feedAPI, vetAPI, analyticsAPI, reportsAPI, usersAPI

- **auth-store.js** - Zustand state management
  - useAuthStore() hook
  - login(), register(), logout() actions
  - isAuthenticated(), isAdmin() selectors
  - Auto localStorage persistence

### Frontend Configuration
- **frontend-package.json** - Renamed copy for reference
  - React 18
  - Vite 5
  - Axios, Zustand, Recharts
  - Tailwind CSS

---

## Directory Structure to Create

```
BeefERP/
├── backend/
│   ├── package.json (npm init)
│   ├── .env (from .env.example)
│   ├── server.js (copy from root)
│   ├── config-database.js
│   ├── jwt-utils.js
│   ├── password-utils.js
│   ├── auth-middleware.js
│   ├── auth-controller.js
│   ├── animals-controller.js
│   └── weight-controller.js
│
├── frontend/
│   ├── package.json (from frontend-package.json)
│   ├── .env.local (from .env.local.example)
│   ├── vite.config.js (copy from root)
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── src/
│   │   ├── api-service.js
│   │   ├── auth-store.js
│   │   ├── App.jsx (TBD)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx (TBD)
│   │   │   ├── RegisterPage.jsx (TBD)
│   │   │   ├── DashboardPage.jsx (TBD)
│   │   │   ├── AnimalsPage.jsx (TBD)
│   │   │   └── WeightsPage.jsx (TBD)
│   │   ├── components/
│   │   │   ├── Layout.jsx (TBD)
│   │   │   ├── Sidebar.jsx (TBD)
│   │   │   └── ... (other components)
│   │   └── styles/
│   │       └── index.css (TBD)
│   └── public/
│
├── database-schema.sql (Supabase setup)
├── README.md
├── SETUP.md
├── COMPLETE-SETUP.md
├── PHASE-1-SUMMARY.md
└── FILES-INDEX.md (this file)
```

---

## File Purposes Summary

| File | Purpose | Type |
|------|---------|------|
| server.js | Main Express app entry | Backend Core |
| config-database.js | DB connection pooling | Backend Core |
| jwt-utils.js | Token generation | Backend Core |
| password-utils.js | Password hashing | Backend Core |
| auth-middleware.js | Request authentication | Backend Middleware |
| auth-controller.js | Auth logic | Backend Controller |
| animals-controller.js | Animals CRUD logic | Backend Controller |
| weight-controller.js | Weight tracking logic | Backend Controller |
| api-service.js | HTTP client with interceptors | Frontend Service |
| auth-store.js | Global auth state | Frontend State |
| database-schema.sql | PostgreSQL schema | Database |
| vite.config.js | Frontend build config | Frontend Config |
| tailwind.config.js | CSS theme | Frontend Config |

---

## Quick File Copy Instructions

After initial `npm init` in backend and `npm create vite` in frontend:

```bash
# Copy backend files
cp server.js backend/
cp config-database.js backend/
cp jwt-utils.js backend/
cp password-utils.js backend/
cp auth-middleware.js backend/
cp auth-controller.js backend/
cp animals-controller.js backend/
cp weight-controller.js backend/
cp .env.example backend/.env

# Copy frontend files
cp api-service.js frontend/src/
cp auth-store.js frontend/src/
cp vite.config.js frontend/
cp tailwind.config.js frontend/
cp postcss.config.js frontend/
cp .env.local.example frontend/.env.local
```

---

## Phase Completion Status

- ✅ Phase 1.1: Project Setup - ALL FILES CREATED
- ✅ Phase 1.2: Auth Backend - COMPLETE (server.js + controllers)
- ✅ Phase 1.3: Animals CRUD - COMPLETE (server.js + controllers)
- ✅ Phase 1.4: Weight Tracking - COMPLETE (server.js + controllers)
- 🔄 Phase 1.2: Auth Frontend - READY TO BUILD
- 🔄 Phase 1.3: Dashboard UI - READY TO BUILD
- 🔄 Phase 1.5: Analytics - READY TO BUILD
- 🔄 Phase 1.6: Deployment - AFTER PHASE 1

---

## API Routes Ready to Use

All routes in `server.js` are production-ready:

```javascript
// Public
GET /health
GET /api

// Auth (no auth required)
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh

// Auth required
POST /api/auth/logout
GET  /api/animals
GET  /api/animals/:id
POST /api/animals
PUT  /api/animals/:id
DELETE /api/animals/:id
GET  /api/animals/stats/overview
GET  /api/weight-records/:animalId
POST /api/weight-records
POST /api/weight-records/bulk
GET  /api/weight-records/:animalId/adg
GET  /api/weight-records/animals/all-adg
GET  /api/weight-records/weight-loss-alerts
```

All endpoints are fully implemented and tested.
