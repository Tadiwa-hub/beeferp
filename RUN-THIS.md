# 🚀 RUN THIS TO FINISH SETUP

## You've Done:
✅ Deployed database schema to Supabase  
✅ Setup backend folder with npm

## Now Run ONE of These:

### **Option A: Windows Batch Script (Easiest)**
```
Just double-click: setup.bat
```

It will:
- ✅ Copy all backend files
- ✅ Create frontend folder
- ✅ Install all dependencies
- ✅ Copy all frontend files
- ✅ Initialize Tailwind

Then tell you next steps.

---

### **Option B: PowerShell Script**
```powershell
# Right-click PowerShell → Run as Administrator
# Then run:
.\setup.ps1
```

Same as Option A but in PowerShell.

---

### **Option C: Manual (If scripts don't work)**

```bash
# Copy backend files
cd backend
copy ..\server.js .
copy ..\config-database.js .
copy ..\jwt-utils.js .
copy ..\password-utils.js .
copy ..\auth-middleware.js .
copy ..\auth-controller.js .
copy ..\animals-controller.js .
copy ..\weight-controller.js .
copy ..\.*  .env

# Go back to root
cd ..

# Create frontend
npm create vite@latest frontend -- --template react

# Install frontend deps
cd frontend
npm install
npm install axios zustand react-router-dom recharts date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Copy frontend files
mkdir src
copy ..\api-service.js src\
copy ..\auth-store.js src\
copy ..\vite.config.js .
copy ..\tailwind.config.js .
copy ..\postcss.config.js .
copy ..\.*  .env.local
```

---

## ✅ After Setup Complete

You'll have:
- ✅ backend/ folder with all files
- ✅ frontend/ folder with all files
- ✅ All npm dependencies installed
- ✅ Ready to run

---

## 🎯 Then Run:

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

**Browser:**
Visit http://localhost:5173

---

**Try the setup.bat script first - it's the easiest!** 🚀
