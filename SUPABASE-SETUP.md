# 🚀 FeedLot Pro - SUPABASE SETUP & DEPLOYMENT GUIDE

## ✅ YOUR CONNECTION DETAILS

**Supabase Project**: `jlevzblbzfcpjubztyws`  
**URL**: https://jlevzblbzfcpjubztyws.supabase.co  
**Database**: PostgreSQL  
**Host**: db.jlevzblbzfcpjubztyws.supabase.co:5432

---

## 📋 STEP 1: Deploy Database Schema

### In Supabase Dashboard:

1. Go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy entire contents from `database-schema.sql` (in your BeefERP folder)
4. Paste into the SQL editor
5. Click **Run** (top right)
6. Wait for completion ✓

### What gets created:
- ✅ 6 tables (users, animals, weight_records, feed_logs, vet_records, audit_log)
- ✅ 4 analytical views
- ✅ 2 database functions
- ✅ Optimized indexes
- ✅ Sample login credentials:
  - Email: `admin@feedlotpro.com`
  - Password: `Admin@123`

---

## 🔧 STEP 2: Set Up Backend

### Create folder structure:
```bash
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

### Copy backend files:
```bash
# From BeefERP root folder to backend folder:
cp ../server.js .
cp ../config-database.js .
cp ../jwt-utils.js .
cp ../password-utils.js .
cp ../auth-middleware.js .
cp ../auth-controller.js .
cp ../animals-controller.js .
cp ../weight-controller.js .

# Copy environment file
cp ../.env.backend .env
```

### Test backend connection:
```bash
npm run dev
```

**Expected output:**
```
✓ Database pool connected
✓ Database connection successful
╔════════════════════════════════════════════╗
║   FeedLot Pro Backend Server Running       ║
║   Environment: development                 ║
║   Port: 5000                               ║
║   API: http://localhost:5000/api           ║
║   Phase: 1.2 (Auth, Animals, Weights)      ║
╚════════════════════════════════════════════╝
```

If you see this, **backend is working!** ✓

---

## 🎨 STEP 3: Set Up Frontend

### Create frontend folder:
```bash
cd BeefERP
mkdir frontend
cd frontend

# Create React + Vite project
npm create vite@latest . -- --template react

# Install dependencies
npm install axios zustand react-router-dom recharts date-fns
npm install -D tailwindcss postcss autoprefixer
```

### Initialize Tailwind:
```bash
npx tailwindcss init -p
```

### Copy frontend files:
```bash
# From BeefERP root to frontend folder:
cp ../vite.config.js .
cp ../tailwind.config.js .
cp ../postcss.config.js .
cp ../api-service.js src/
cp ../auth-store.js src/
cp ../.env.frontend .env.local
```

### Test frontend:
```bash
npm run dev
```

**Visit**: http://localhost:5173

---

## ✅ STEP 4: Verify Everything Works

### Terminal 1: Backend
```bash
cd BeefERP/backend
npm run dev
# Should show: ✓ Database pool connected
```

### Terminal 2: Frontend
```bash
cd BeefERP/frontend
npm run dev
# Should show: Local: http://localhost:5173
```

### Terminal 3: Test the API
```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"OK","environment":"development","timestamp":"...","database":"✓ Connected"}
```

---

## 🧪 STEP 5: Test Authentication Flow

### Test Registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@1234"
  }'

# Expected: { user, accessToken, refreshToken }
```

### Test Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@feedlotpro.com",
    "password": "Admin@123"
  }'

# Expected: { user, accessToken, refreshToken }
```

### Test Protected Route (Animals):
```bash
# Get your token from login response, then:
curl -X GET http://localhost:5000/api/animals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: List of animals (empty initially)
```

---

## 📊 STEP 6: Verify Database

### In Supabase SQL Editor, run:
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show: users, animals, weight_records, feed_logs, vet_records, audit_log

-- Check sample user
SELECT * FROM users;

-- Should show: admin@feedlotpro.com user
```

---

## 🔑 Your Credentials

**Admin Account (auto-created):**
- Email: `admin@feedlotpro.com`
- Password: `Admin@123`
- Role: `admin`

**Database:**
- Host: `db.jlevzblbzfcpjubztyws.supabase.co`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: `Tadiwa12#12`

---

## 🚀 QUICK START (After Setup)

### Terminal 1:
```bash
cd BeefERP/backend
npm run dev
```

### Terminal 2:
```bash
cd BeefERP/frontend
npm run dev
```

### Browser:
Visit http://localhost:5173

---

## 📱 FIRST TEST FLOW

1. **Backend running** on port 5000 ✓
2. **Frontend running** on port 5173 ✓
3. **Database connected** in Supabase ✓
4. **Next: Build Auth Frontend Pages**

---

## 🔍 TROUBLESHOOTING

### "Cannot connect to database"
```
✗ Check: SUPABASE_URL in .env is correct
✗ Check: Password in connection string (no special chars escaped)
✗ Check: Supabase project is active
✗ Try: Restart backend
```

### "Query syntax error"
```
✗ Check: database-schema.sql was fully deployed
✗ Check: All tables exist in Supabase SQL Editor
✗ Check: No SQL errors during deployment
```

### "Port already in use"
```bash
# If port 5000 in use:
PORT=5001 npm run dev

# If port 5173 in use:
npm run dev -- --port 5174
```

### "CORS error in frontend"
```
✗ Check: VITE_API_URL in .env.local is correct
✗ Check: CORS_ORIGIN in backend .env matches frontend URL
✗ Check: Both servers running
```

---

## 📈 NEXT STEPS

Once verified:

1. ✅ Backend running
2. ✅ Frontend running
3. ✅ Database connected
4. 🔄 **Build Auth Frontend Pages** (NEXT - see FRONTEND-BUILD-GUIDE.md)
5. 🔄 Build Dashboard
6. 🔄 Build Animals & Weights pages
7. 🔄 Deploy to Cloudflare

---

## 📚 REFERENCE FILES

| File | Purpose |
|------|---------|
| `database-schema.sql` | Run in Supabase SQL Editor |
| `server.js` | Copy to backend/ |
| `*-controller.js` | Copy to backend/ |
| `*-utils.js` | Copy to backend/ |
| `api-service.js` | Copy to frontend/src/ |
| `auth-store.js` | Copy to frontend/src/ |
| `vite.config.js` | Copy to frontend/ |
| `tailwind.config.js` | Copy to frontend/ |

---

## ✨ SUCCESS CHECKLIST

- [ ] Backend folder created
- [ ] Frontend folder created
- [ ] npm install completed for both
- [ ] .env and .env.local files created
- [ ] database-schema.sql deployed to Supabase
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5173)
- [ ] Database connection works
- [ ] Can login with admin@feedlotpro.com / Admin@123
- [ ] API returns data when authenticated

---

**Status: Ready to Build Frontend** 🚀

Follow `FRONTEND-BUILD-GUIDE.md` for the next phases.
