# 📁 Project Structure & Architecture

This document explains the architecture and organization of the Subscription Management Platform backend.

## Directory Structure

```
subs_manager/
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   └── migrations/             # Migration files
│
├── src/
│   ├── config/                 # Configuration management
│   │   └── index.ts            # Centralized config
│   │
│   ├── domain/                 # Domain layer (pure logic, no dependencies)
│   │   ├── errors.ts           # Custom error classes
│   │   ├── permissions.ts      # RBAC definitions
│   │   ├── pricing.ts          # Pricing calculation logic
│   │   └── state-machines.ts   # State transition rules
│   │
│   ├── plugins/                # Fastify plugins
│   │   ├── auth.ts             # JWT authentication & authorization
│   │   ├── error-handler.ts    # Global error handling
│   │   └── prisma.ts           # Database connection lifecycle
│   │
│   ├── routes/                 # HTTP route handlers (thin controllers)
│   │   ├── auth.routes.ts      # Authentication endpoints
│   │   ├── discounts.routes.ts # Discount management
│   │   ├── invoices.routes.ts  # Invoice management
│   │   ├── plans.routes.ts     # Recurring plan management
│   │   ├── products.routes.ts  # Product & variant management
│   │   ├── reports.routes.ts   # Analytics endpoints
│   │   ├── subscriptions.routes.ts # Subscription lifecycle
│   │   ├── taxes.routes.ts     # Tax rate management
│   │   └── users.routes.ts     # User management
│   │
│   ├── services/               # Business logic layer (transactional)
│   │   ├── audit.service.ts    # Audit logging
│   │   ├── discount.service.ts # Discount operations
│   │   ├── invoice.service.ts  # Invoice generation & actions
│   │   ├── payment.service.ts  # Payment recording
│   │   ├── plan.service.ts     # Plan operations
│   │   ├── product.service.ts  # Product operations
│   │   ├── report.service.ts   # Analytics queries
│   │   ├── subscription.service.ts # Subscription lifecycle
│   │   ├── tax.service.ts      # Tax operations
│   │   └── user.service.ts     # User & auth operations
│   │
│   ├── scripts/                # Utility scripts
│   │   ├── seed.ts             # Database seeding
│   │   └── smoke.ts            # Smoke tests
│   │
│   ├── utils/                  # Utility functions
│   │   ├── generators.ts       # ID/number generators
│   │   ├── logger.ts           # Pino logger setup
│   │   └── password.ts         # Password hashing
│   │
│   └── index.ts                # Application entry point
│
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── .prettierrc                 # Code formatting config
├── docker-compose.yml          # PostgreSQL container
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
├── README.md                   # Full documentation
├── QUICKSTART.md               # Quick setup guide
└── PROJECT_STRUCTURE.md        # This file
```

## Layer Architecture

```
┌─────────────────────────────────────────┐
│           HTTP Requests                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         ROUTES (Controllers)             │
│  - Request validation (Zod)              │
│  - Authentication/Authorization checks   │
│  - Call services                         │
│  - Return HTTP responses                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         SERVICES (Business Logic)        │
│  - Transactional operations              │
│  - State machine enforcement             │
│  - Call audit service                    │
│  - Database operations via Prisma        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         DOMAIN (Pure Logic)              │
│  - State transition rules                │
│  - Permission definitions                │
│  - Pricing calculations                  │
│  - Custom errors                         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         DATABASE (PostgreSQL)            │
│  - Prisma ORM                            │
│  - Transactions                          │
│  - Constraints & Indexes                 │
└─────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Domain-Driven Design

**Domain Layer** contains pure business logic:
- No dependencies on frameworks
- Pure functions for calculations
- Explicit state machines
- Custom error types

### 2. Service Layer Pattern

**Services** handle transactional business operations:
- Each service manages one aggregate (Subscription, Invoice, etc.)
- Uses Prisma transactions for consistency
- Calls AuditService for logging
- Returns domain objects

### 3. Thin Controllers

**Routes** are lightweight:
- Parse/validate input with Zod
- Check permissions
- Delegate to services
- Format response

### 4. Dependency Injection

Services receive PrismaClient in constructor:
```typescript
class SubscriptionService {
  constructor(private prisma: PrismaClient) {}
}
```

Routes instantiate services:
```typescript
const subscriptionService = new SubscriptionService(fastify.prisma);
```

### 5. Error Handling Strategy

```
Domain Error → Service throws → Route catches → ErrorHandler plugin → HTTP Response
```

All errors are caught by the global error handler and mapped to appropriate HTTP status codes.

## Data Flow Examples

### Example 1: Create Subscription

```
1. POST /api/v1/subscriptions
   ↓
2. subscriptions.routes.ts
   - Validate request body with Zod
   - Check 'subscriptions:create' permission
   ↓
3. SubscriptionService.create()
   - Verify user exists
   - Verify plan exists
   - Start transaction:
     - Create subscription
     - Log audit event
   - Commit transaction
   ↓
4. Return subscription object
```

### Example 2: Generate Invoice (Idempotent)

```
1. POST /api/v1/subscriptions/:id/invoices/generate?periodStart=...
   ↓
2. subscriptions.routes.ts
   - Check 'invoices:create' permission
   ↓
3. InvoiceService.generateInvoiceForPeriod()
   - Check if invoice exists (unique constraint check)
   - If exists: return existing
   - If not exists:
     - Get subscription with lines
     - Calculate line totals (domain/pricing.ts)
     - Start transaction:
       - Create invoice
       - Create invoice lines
       - Log audit event
     - Commit transaction
   ↓
4. Return invoice object
```

### Example 3: Record Payment

```
1. POST /api/v1/invoices/:id/payments
   ↓
2. invoices.routes.ts
   - Validate payment data
   - Check 'payments:create' permission
   ↓
3. PaymentService.recordPayment()
   - Get invoice
   - Validate payment amount
   - Start transaction:
     - Create payment record
     - Update invoice.paidAmount
     - If fully paid: call InvoiceService.markPaid()
     - Log audit event
   - Commit transaction
   ↓
4. Return payment object
```

## State Machines

### Subscription State Machine

```
DRAFT ──quote──→ QUOTATION ──confirm──→ CONFIRMED ──activate──→ ACTIVE ──close──→ CLOSED
  ↑                  │                        │
  └──────────────────┘                        │
                                              └──close──→ CLOSED
```

### Invoice State Machine

```
DRAFT ──confirm──→ CONFIRMED ──mark_paid──→ PAID
  │                    │
  └──cancel────────────┴──cancel──→ CANCELED
```

## Database Schema Highlights

### Critical Constraints

```prisma
// Prevent duplicate invoices for same period
@@unique([subscriptionId, periodStart])

// Unique identifiers
User: @@unique([email])
Subscription: @@unique([subscriptionNumber])
Invoice: @@unique([invoiceNumber])
ProductVariant: @@unique([sku])
```

### Performance Indexes

```prisma
// Fast subscription queries
@@index([status, updatedAt])
@@index([userId])
@@index([nextBillingDate])

// Fast invoice queries
@@index([status, createdAt])
@@index([subscriptionId])
@@index([dueDate])

// Fast audit log queries
@@index([entityType, entityId, createdAt])
@@index([userId])
```

## Security Architecture

### Authentication Flow

```
1. User calls POST /auth/login with email/password
2. UserService.authenticate() verifies credentials
3. Server signs JWT with userId, email, role
4. JWT returned to client
5. Client includes JWT in Authorization header
6. Auth plugin verifies JWT and extracts payload
7. request.user populated with user data
```

### Authorization Flow

```
1. Route declares required permission
   onRequest: [authenticate, authorize('subscriptions:create')]
2. Authenticate plugin verifies JWT
3. Authorize plugin checks RolePermissions map
4. If user.role has permission: proceed
5. If not: throw ForbiddenError (403)
```

### Resource Access Control

```typescript
// PORTAL users can only access their own resources
if (request.user.role === 'PORTAL') {
  if (subscription.userId !== request.user.userId) {
    throw new ForbiddenError(...)
  }
}
```

## Testing Strategy

### Smoke Tests (scripts/smoke.ts)

End-to-end tests covering:
1. Authentication
2. State transitions
3. Idempotency
4. Transactionality
5. RBAC enforcement

Run with: `npm run smoke`

### Future: Unit Tests

Recommended structure:
```
tests/
├── unit/
│   ├── domain/
│   │   ├── pricing.test.ts
│   │   └── state-machines.test.ts
│   └── services/
│       ├── subscription.service.test.ts
│       └── invoice.service.test.ts
└── integration/
    └── routes/
        ├── subscriptions.test.ts
        └── invoices.test.ts
```

## Performance Considerations

### Query Optimization

- All list endpoints use pagination (limit/offset)
- Indexes on frequently queried fields
- Selective field loading with Prisma `select`/`include`

### Transaction Boundaries

- Keep transactions short
- Only multi-step operations use transactions
- Read-only operations avoid transactions

### Caching Opportunities (Future)

- Tax rates (rarely change)
- Product catalog (infrequent updates)
- User permissions (static per session)

## Deployment Architecture

### Development

```
Local Machine
├── Node.js (tsx watch)
├── PostgreSQL (Docker)
└── Prisma Studio (optional)
```

### Production

```
Load Balancer
      ↓
Application Servers (N instances)
      ↓
PostgreSQL (managed service)
      ↓
Monitoring & Logging
```

## Extending the System

### Adding a New Resource

1. **Define schema** in `prisma/schema.prisma`
2. **Create service** in `src/services/[resource].service.ts`
3. **Create routes** in `src/routes/[resource].routes.ts`
4. **Add permissions** in `src/domain/permissions.ts`
5. **Register routes** in `src/index.ts`
6. **Run migration** `npm run prisma:migrate`

### Adding Business Logic

- **Pure calculations** → `src/domain/`
- **Database operations** → `src/services/`
- **HTTP endpoints** → `src/routes/`

### Adding Background Jobs (Future)

Recommended: BullMQ with Redis

```typescript
// Example: Auto-generate invoices
async function processScheduledInvoices() {
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      nextBillingDate: { lte: new Date() }
    }
  });
  
  for (const sub of dueSubscriptions) {
    await invoiceService.generateInvoiceForPeriod(
      sub.id,
      sub.nextBillingDate,
      'system'
    );
  }
}
```

## Monitoring & Observability

### Current Logging

- Pino structured JSON logs
- Request/response logging
- Error logging with stack traces

### Future Enhancements

- **Metrics**: Prometheus/StatsD
- **Tracing**: OpenTelemetry
- **APM**: DataDog, New Relic
- **Health checks**: Readiness/liveness probes

---

**Questions?** Check `README.md` for full API documentation or `QUICKSTART.md` for setup instructions.
