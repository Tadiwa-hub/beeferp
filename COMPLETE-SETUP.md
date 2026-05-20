# FeedLot Pro - Complete Setup Guide

## Prerequisites

- Node.js 18+ (download from nodejs.org)
- npm or yarn
- PostgreSQL client (optional, for testing database)
- Git (optional, for version control)

## Step 1: Create Supabase Account & Database

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Create a new organization
4. Create new project:
   - Project name: `FeedLot Pro`
   - Password: Create secure password
   - Region: Choose closest to your location
   - Pricing: Free tier
5. Wait for project to initialize (2-3 minutes)

### 1.2 Set Up Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Create new query
3. Copy entire contents of `database-schema.sql`
4. Paste into SQL editor
5. Click "Run"
6. Verify tables created (check Tables view in left sidebar)

### 1.3 Get Connection String
1. Go to "Settings" → "Database" → "Connection string"
2. Copy the PostgreSQL connection string
3. Keep this safe - you'll need it for .env

## Step 2: Backend Setup

### 2.1 Create Backend Directory & Install Dependencies
```bash
# Navigate to project
cd BeefERP

# Create backend folder
mkdir backend
cd backend

# Initialize Node project
npm init -y

# Install dependencies
npm install express cors dotenv pg bcryptjs jsonwebtoken express-validator
npm install --save-dev nodemon
```

### 2.2 Create Backend Files
Copy these files from root into `backend/` folder:
- `server.js` → Backend entry point
- `config-database.js` → Database connection
- `jwt-utils.js` → Token generation
- `password-utils.js` → Password hashing
- `auth-middleware.js` → Auth verification

### 2.3 Create .env File
1. In `backend/` folder, create file named `.env`
2. Copy contents from `.env.example`
3. Fill in values:
   - `SUPABASE_URL=` - Your PostgreSQL connection string
   - `JWT_SECRET=` - Generate random string: `openssl rand -hex 32` (or random 32 chars)
   - `JWT_REFRESH_SECRET=` - Another random string
   - `CORS_ORIGIN=http://localhost:5173` (for local dev)

### 2.4 Test Backend
```bash
cd backend
npm run dev
```

Expected output:
```
╔════════════════════════════════════════╗
║   FeedLot Pro Backend Server Running   ║
║   Environment: development             ║
║   Port: 5000                           ║
║   API: http://localhost:5000/api       ║
╚════════════════════════════════════════╝
```

Visit http://localhost:5000/health - should return `{ status: 'OK', ... }`

## Step 3: Frontend Setup

### 3.1 Create Frontend Directory & Install Dependencies
```bash
# In BeefERP directory
mkdir frontend
cd frontend

# Create React + Vite project
npm create vite@latest . -- --template react

# Install dependencies
npm install axios zustand react-router-dom recharts date-fns
npm install -D tailwindcss postcss autoprefixer
```

### 3.2 Initialize Tailwind
```bash
cd frontend
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`

### 3.3 Create .env.local File
1. In `frontend/` folder, create file named `.env.local`
2. Copy contents from `../.env.local.example`
3. Set: `VITE_API_URL=http://localhost:5000`

### 3.4 Copy Configuration Files
Copy these to `frontend/` folder:
- `tailwind.config.js` (replace generated one)
- `postcss.config.js` (replace generated one)
- `api-service.js` → into `src/` folder
- `auth-store.js` → into `src/` folder

### 3.5 Test Frontend
```bash
cd frontend
npm run dev
```

Visit http://localhost:5173 - should see Vite + React welcome page

## Step 4: Verify Everything Works

### Test Database Connection
1. Backend running: `npm run dev` in backend folder
2. Check logs for "✓ Database connection successful"
3. If error: verify SUPABASE_URL in .env is correct

### Test API
1. Backend running on http://localhost:5000
2. Visit http://localhost:5000/api - should see endpoints list
3. Visit http://localhost:5000/health - should see status

### Test Frontend
1. Frontend running on http://localhost:5173
2. Should see React default page
3. Open browser console (F12) - no errors

## Project Structure

```
BeefERP/
├── backend/
│   ├── package.json
│   ├── .env
│   └── server.js (and other files copied)
├── frontend/
│   ├── package.json
│   ├── .env.local
│   ├── src/
│   │   ├── api-service.js
│   │   ├── auth-store.js
│   │   └── (React components will go here)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── database-schema.sql
├── server.js
├── .env.example
└── README.md
```

## Running the Full Stack

### Terminal 1: Backend
```bash
cd BeefERP/backend
npm run dev
```

### Terminal 2: Frontend
```bash
cd BeefERP/frontend
npm run dev
```

### Terminal 3: Browser
Visit http://localhost:5173

---

## Troubleshooting

### "Cannot find module 'express'"
- Run `npm install` in backend folder
- Run `npm install` in frontend folder

### "SUPABASE_URL is undefined"
- Check .env file exists in backend folder
- Verify connection string is set
- Restart backend: `npm run dev`

### "Connection refused" when connecting to database
- Verify Supabase project is active
- Check connection string format (should start with `postgresql://`)
- Verify IP is whitelisted (Supabase allows all by default)

### Frontend can't reach backend
- Verify backend is running on port 5000
- Check VITE_API_URL in frontend .env.local
- Check CORS_ORIGIN in backend .env matches frontend URL

### "Invalid token" errors
- Clear browser localStorage: Open DevTools → Application → Local Storage → Clear All
- Log out and log back in
- Restart both servers

---

## Next Steps

1. ✅ Backend running with database
2. ✅ Frontend running with Vite
3. 🚀 **Start Phase 1.2: Auth System**
   - Build login/register API endpoints
   - Create frontend auth pages
   - Test login flow

---

## Deployment Checklist

When ready to deploy:

### Cloudflare Pages (Frontend)
- [ ] Connect GitHub repo or upload dist folder
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Set env var: `VITE_API_URL` to production backend URL

### Cloudflare Workers or Render (Backend)  
- [ ] Set up environment secrets
- [ ] Deploy backend code
- [ ] Update database connection pool size

### Supabase (Database)
- [ ] Upgrade to paid tier if exceeding 500MB
- [ ] Enable automated backups
- [ ] Test connection strings from production

---

## Support

For detailed documentation, see:
- plan.md - Full implementation plan
- README.md - Project overview
