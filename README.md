# FeedLot Pro - Professional Beef Feedlot Management ERP System

## Project Structure

```
beeferp/
├── backend/                    # Node.js Express API
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/                   # React + Vite UI
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## Setup Instructions

### Backend Setup
1. Navigate to backend folder
2. Run `npm install`
3. Create `.env` file from `.env.example`
4. Set Supabase connection details
5. Run `npm run dev`

### Frontend Setup
1. Navigate to frontend folder
2. Run `npm install`
3. Create `.env.local` file
4. Set API URL
5. Run `npm run dev`

### Supabase Setup
1. Create account at supabase.com
2. Create new project
3. Run SQL schema (see database.sql)
4. Get connection string
5. Set in backend .env

## Deployment

**Frontend**: Cloudflare Pages
**Backend**: Cloudflare Workers or Render.com
**Database**: Supabase PostgreSQL (free tier)
