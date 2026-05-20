# Backend Setup

Complete this manually or run:

```bash
# Create backend structure
mkdir -p backend/config backend/routes backend/controllers backend/middleware backend/services backend/utils
mkdir -p frontend/src/components frontend/src/pages frontend/src/hooks frontend/src/services

# Install backend dependencies
cd backend
npm install express cors dotenv pg bcryptjs jsonwebtoken express-validator nodemon

# Install frontend dependencies  
cd ../frontend
npm create vite@latest . -- --template react
npm install axios recharts zustand tailwindcss
npm install -D postcss autoprefixer

# Create .env files
cp .env.example .env
```

Then start with Phase 1.1 setup files.
