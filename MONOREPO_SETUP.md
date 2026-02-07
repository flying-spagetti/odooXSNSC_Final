# 🎯 Clean Monorepo Setup - Complete!

## ✅ What We Did

Successfully reorganized into a **clean monorepo** structure with proper separation:

```
subs_manager/
├── src/
│   ├── client/              # 🎨 Frontend (React + TypeScript)
│   │   ├── components/
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── Layout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── lib/
│   │   │   ├── api.ts      # API client with types
│   │   │   └── utils.ts    # Helper functions
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── store/
│   │   │   └── authStore.ts # Zustand auth state
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css       # Tailwind + theme
│   │
│   └── server/              # 🔧 Backend (Fastify + Prisma)
│       ├── config/
│       ├── domain/
│       ├── plugins/
│       ├── routes/
│       ├── scripts/
│       ├── services/
│       ├── utils/
│       └── index.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
├── index.html              # Frontend entry point
├── vite.config.ts          # Frontend build (points to src/client)
├── tailwind.config.js      # Tailwind config
├── tsconfig.json           # Frontend TypeScript config
├── tsconfig.backend.json   # Backend TypeScript config
├── package.json            # Unified dependencies
└── .env                    # Environment variables
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

This installs everything needed for both frontend and backend.

### Step 2: Setup Backend

```bash
# Start PostgreSQL
docker-compose up -d

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data
npm run seed
```

### Step 3: Start Both Servers

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```
Backend runs on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

---

## 🎯 Available Scripts

### Frontend
```bash
npm run dev           # Start frontend dev server (Vite)
npm run build         # Build frontend for production
npm run preview       # Preview production build
```

### Backend
```bash
npm run dev:backend   # Start backend dev server (tsx watch)
npm run backend:build # Build backend TypeScript
npm run backend:start # Start production backend
```

### Database
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open database GUI
npm run seed             # Seed demo data
npm run smoke            # Run backend smoke tests
```

---

## 📡 How It Works

### API Proxy
Vite proxies `/api` requests to the backend:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- API calls: `fetch('/api/v1/auth/login')` → proxied to backend

### Path Aliases
Frontend uses `@/` for clean imports:
```typescript
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
```

Configured in `vite.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src/client'),
  },
}
```

### TypeScript Configs
- `tsconfig.json` - Frontend (includes `src/client/`)
- `tsconfig.backend.json` - Backend (includes `src/server/`)

---

## 🧪 Test the Setup

### 1. Test Backend
```bash
# Start backend
npm run dev:backend

# In another terminal, test endpoint
curl http://localhost:3000/health

# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

### 2. Test Frontend
```bash
# Start frontend
npm run dev

# Open http://localhost:5173
# Should see login page
```

### 3. Test Integration
1. Open `http://localhost:5173`
2. Login with: `admin@example.com` / `admin123`
3. Should redirect to dashboard
4. Check browser Network tab - API calls to `/api/v1/...` should work

---

## 🎨 Frontend Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite 5
- **Routing**: React Router v6
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **HTTP**: Axios
- **UI**: Chakra UI + shadcn/ui + Tailwind CSS
- **Icons**: Lucide React

## 🔧 Backend Stack

- **Framework**: Fastify
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (@fastify/jwt)
- **Validation**: Zod
- **Logging**: Pino
- **Language**: TypeScript

---

## 📂 Project Structure Explained

### Frontend (`src/client/`)
```
client/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── Layout.tsx       # Main layout with nav
│   └── ProtectedRoute.tsx # Auth wrapper
├── lib/
│   ├── api.ts           # API client + types
│   └── utils.ts         # Helpers (format, cn)
├── pages/
│   ├── Login.tsx        # Login page
│   └── Dashboard.tsx    # Dashboard
├── store/
│   └── authStore.ts     # Global auth state
├── App.tsx              # Main app with routing
├── main.tsx             # Entry point
└── index.css            # Global CSS + Tailwind
```

### Backend (`src/server/`)
```
server/
├── config/         # Configuration
├── domain/         # Business logic (state machines, permissions, pricing)
├── plugins/        # Fastify plugins (auth, prisma, error handler)
├── routes/         # API routes (thin controllers)
├── scripts/        # Seed, smoke tests
├── services/       # Business logic (transactional)
├── utils/          # Helpers (generators, logger, password)
└── index.ts        # Server bootstrap
```

---

## 🔑 Demo Accounts

```
Admin:
  Email: admin@example.com
  Password: admin123
  Access: Full system access

Internal:
  Email: internal@example.com
  Password: internal123
  Access: Manage subscriptions & invoices

Customer:
  Email: customer@example.com
  Password: portal123
  Access: View own subscriptions only
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if PostgreSQL is running
docker ps

# Check if port 3000 is available
netstat -ano | findstr :3000

# Regenerate Prisma client
npm run prisma:generate
```

### Frontend won't start
```bash
# Check if port 5173 is available
netstat -ano | findstr :5173

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API calls failing
- Make sure backend is running on port 3000
- Check browser console for errors
- Verify `.env` file exists with VITE_API_URL
- Check Vite proxy configuration in `vite.config.ts`

### TypeScript errors
```bash
# Frontend
npx tsc --noEmit

# Backend
npx tsc -p tsconfig.backend.json --noEmit
```

---

## 🚀 Next Steps

### Add More Pages
Create new pages in `src/client/pages/`:
- `Subscriptions.tsx` - List subscriptions
- `SubscriptionDetail.tsx` - View/edit subscription
- `Invoices.tsx` - List invoices
- `InvoiceDetail.tsx` - View invoice + payments

### Expand API
Add more endpoints in `src/server/routes/`:
- Product management
- User administration
- Reports and analytics

### Deploy

**Frontend (Vercel/Netlify):**
```bash
npm run build
# Deploy dist/ folder
```

**Backend (Railway/Render/Fly.io):**
```bash
npm run backend:build
# Deploy with Dockerfile or buildpack
```

---

## ✅ Benefits of This Structure

1. **Clear Separation** - Frontend and backend code are isolated
2. **Shared Dependencies** - One `package.json`, one `node_modules`
3. **Type Safety** - Shared types between frontend/backend possible
4. **Easy Development** - Two terminals, both with hot reload
5. **Simple Deployment** - Can deploy separately or together
6. **Scalable** - Easy to extract into microservices later

---

## 📚 Documentation

- **Backend API**: See `API_EXAMPLES.md` and `README.md`
- **Frontend Components**: Check `src/client/components/ui/`
- **Database Schema**: See `prisma/schema.prisma`
- **State Machines**: See `src/server/domain/state-machines.ts`

---

**You're all set! Happy coding! 🎉**

Open `http://localhost:5173` and start building!
