# 🚀 Quick Start Guide

Get the Subscription Management Platform running in under 5 minutes.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- npm/pnpm/yarn

## Step-by-Step Setup

### 1. Start PostgreSQL Database

```bash
docker-compose up -d
```

Wait 10 seconds for PostgreSQL to be ready.

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database Schema

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run seed
```

You should see:
```
✅ Users created: admin@example.com, internal@example.com, customer@example.com
✅ Tax rate created: VAT 18%
✅ Discount created: 10% Off
✅ Products created: Cloud Storage, API Access
✅ Variants created: CLOUD-100GB, CLOUD-1TB, API-BASIC
✅ Plan created: Monthly Subscription
✅ Subscription created: SUB-20260207-00001
🎉 Seed completed successfully!

📝 Login credentials:
  Admin: admin@example.com / admin123
  Internal: internal@example.com / internal123
  Customer: customer@example.com / portal123
```

### 4. Start Development Server

```bash
npm run dev
```

Server starts on `http://localhost:3000`

### 5. Test the API

#### Login as Admin

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Save the returned `token`.

#### List Subscriptions

```bash
curl http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Health Check

```bash
curl http://localhost:3000/health
```

### 6. Run Smoke Tests (Optional)

In a new terminal:

```bash
npm run smoke
```

You should see all tests pass:
```
✅ Health endpoint returns 200
✅ Admin can login
✅ Internal user can login
✅ Portal user can login
✅ Can list products
✅ Internal user can list subscriptions
✅ Can transition to QUOTATION
✅ Can transition to CONFIRMED
✅ Can transition to ACTIVE
✅ Can generate invoice
✅ Second generation succeeds (idempotent)
✅ Can confirm invoice
✅ Can record payment
✅ Invoice automatically marked as PAID
✅ Can generate summary report
✅ Portal user cannot create subscriptions
🎉 All smoke tests passed!
```

## 🎯 Next Steps

1. **Explore API**: Use the credentials above to test different endpoints
2. **Check Prisma Studio**: Run `npm run prisma:studio` to see data in a GUI
3. **Read README.md**: Full API documentation and design details
4. **Customize**: Modify the code to fit your needs

## 🛑 Stop Everything

```bash
# Stop the server (Ctrl+C)

# Stop PostgreSQL
docker-compose down

# Stop and remove data
docker-compose down -v
```

## 📚 Key Files to Explore

- `src/routes/` - API endpoints
- `src/services/` - Business logic
- `src/domain/` - State machines, permissions, pricing
- `prisma/schema.prisma` - Database schema
- `src/scripts/seed.ts` - Seed data

## 🐛 Troubleshooting

**PostgreSQL Connection Error?**
- Check Docker is running: `docker ps`
- Check PostgreSQL is ready: `docker logs subs_manager_db`
- Verify DATABASE_URL in `.env.example` matches your setup

**Prisma Client Error?**
- Run `npm run prisma:generate` again
- Delete `node_modules/.prisma` and regenerate

**Port 3000 Already In Use?**
- Change `PORT=3001` in `.env.example`
- Or kill the process: `lsof -ti:3000 | xargs kill`

---

**Happy Hacking! 🚀**
