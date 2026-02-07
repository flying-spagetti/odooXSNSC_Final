# 🔌 API Examples

Complete curl examples for testing the Subscription Management Platform API.

## Setup

```bash
# Start the server
npm run dev

# In a new terminal, set base URL
export API="http://localhost:3000/api/v1"
```

## Authentication

### 1. Login as Admin

```bash
curl -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' | jq

# Save the token
export TOKEN="<paste-token-here>"
```

### 2. Signup New Portal User

```bash
curl -X POST $API/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User"
  }' | jq
```

### 3. Get Current User Profile

```bash
curl $API/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Products

### List Products

```bash
curl "$API/products?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get Product Details

```bash
curl $API/products/<product-id> \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Create Product

```bash
curl -X POST $API/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Support",
    "description": "24/7 premium support service"
  }' | jq
```

### Create Product Variant

```bash
curl -X POST $API/products/<product-id>/variants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Support - Gold",
    "sku": "SUPPORT-GOLD",
    "basePrice": 99.99,
    "description": "Gold tier support"
  }' | jq
```

## Plans

### Create Recurring Plan

```bash
curl -X POST $API/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quarterly Subscription",
    "billingPeriod": "MONTHLY",
    "intervalCount": 3,
    "description": "Billed every 3 months"
  }' | jq
```

### List Plans

```bash
curl "$API/plans?isActive=true" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Subscriptions

### Create Subscription

```bash
curl -X POST $API/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "planId": "<plan-id>",
    "notes": "Customer requested subscription"
  }' | jq

# Save the subscription ID
export SUB_ID="<paste-subscription-id>"
```

### Add Line to Subscription

```bash
curl -X POST $API/subscriptions/$SUB_ID/lines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variantId": "<variant-id>",
    "quantity": 2,
    "unitPrice": 49.99,
    "taxRateId": "<tax-rate-id>"
  }' | jq
```

### Subscription Actions

#### Quote (DRAFT → QUOTATION)

```bash
curl -X POST $API/subscriptions/$SUB_ID/actions/quote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

#### Confirm (QUOTATION → CONFIRMED)

```bash
curl -X POST $API/subscriptions/$SUB_ID/actions/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-02-07T00:00:00Z"
  }' | jq
```

#### Activate (CONFIRMED → ACTIVE)

```bash
curl -X POST $API/subscriptions/$SUB_ID/actions/activate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

#### Close (ACTIVE → CLOSED)

```bash
curl -X POST $API/subscriptions/$SUB_ID/actions/close \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endDate": "2026-12-31T23:59:59Z"
  }' | jq
```

### List Subscriptions

```bash
# All subscriptions (admin/internal)
curl "$API/subscriptions?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by status
curl "$API/subscriptions?status=ACTIVE" \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by user
curl "$API/subscriptions?userId=<user-id>" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get Subscription Details

```bash
curl $API/subscriptions/$SUB_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Invoices

### Generate Invoice (Idempotent)

```bash
# First call - creates invoice
curl -X POST "$API/subscriptions/$SUB_ID/invoices/generate?periodStart=2026-02-01T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# Save invoice ID
export INV_ID="<paste-invoice-id>"

# Second call - returns existing invoice (idempotent)
curl -X POST "$API/subscriptions/$SUB_ID/invoices/generate?periodStart=2026-02-01T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

### List Invoices

```bash
# All invoices
curl "$API/invoices?limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by status
curl "$API/invoices?status=CONFIRMED" \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by subscription
curl "$API/invoices?subscriptionId=$SUB_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Get Invoice Details

```bash
curl $API/invoices/$INV_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Invoice Actions

#### Confirm Invoice

```bash
curl -X POST $API/invoices/$INV_ID/actions/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

#### Cancel Invoice

```bash
curl -X POST $API/invoices/$INV_ID/actions/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

## Payments

### Record Payment

```bash
curl -X POST $API/invoices/$INV_ID/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 59.99,
    "paymentMethod": "BANK_TRANSFER",
    "reference": "TXN-123456",
    "notes": "Customer payment via wire transfer"
  }' | jq
```

### List Payments for Invoice

```bash
curl $API/invoices/$INV_ID/payments \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Taxes

### Create Tax Rate

```bash
curl -X POST $API/taxes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VAT 20%",
    "rate": 20,
    "description": "Standard VAT rate"
  }' | jq
```

### List Tax Rates

```bash
curl "$API/taxes?isActive=true" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Update Tax Rate

```bash
curl -X PATCH $API/taxes/<tax-id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rate": 21
  }' | jq
```

## Discounts

### Create Discount

```bash
# Percentage discount
curl -X POST $API/discounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Early Bird 15%",
    "type": "PERCENTAGE",
    "value": 15,
    "description": "15% off for early adopters"
  }' | jq

# Fixed discount
curl -X POST $API/discounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "$10 Off",
    "type": "FIXED",
    "value": 10,
    "description": "Fixed $10 discount"
  }' | jq
```

### List Discounts

```bash
curl "$API/discounts?isActive=true" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Reports

### Summary Report

```bash
# All time
curl $API/reports/summary \
  -H "Authorization: Bearer $TOKEN" | jq

# Date range
curl "$API/reports/summary?from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Subscription Metrics

```bash
curl $API/reports/subscriptions/metrics \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Admin

### Create Internal User

```bash
curl -X POST $API/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@example.com",
    "password": "secure123",
    "name": "Staff Member",
    "role": "INTERNAL"
  }' | jq
```

### List Users

```bash
curl "$API/admin/users?limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by role
curl "$API/admin/users?role=INTERNAL" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Complete Workflow Example

### End-to-End: Create Subscription → Generate Invoice → Record Payment

```bash
# 1. Login as internal user
curl -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "internal@example.com", "password": "internal123"}' \
  | jq -r '.token' > /tmp/token.txt

export TOKEN=$(cat /tmp/token.txt)

# 2. List available products and plans
curl "$API/products" -H "Authorization: Bearer $TOKEN" | jq '.items[] | {id, name}'
curl "$API/plans" -H "Authorization: Bearer $TOKEN" | jq '.items[] | {id, name}'

# 3. Get customer user ID
curl "$API/admin/users?role=PORTAL" -H "Authorization: Bearer $TOKEN" \
  | jq -r '.items[0].id' > /tmp/user_id.txt

export USER_ID=$(cat /tmp/user_id.txt)
export PLAN_ID="<paste-plan-id>"
export VARIANT_ID="<paste-variant-id>"
export TAX_ID="<paste-tax-id>"

# 4. Create subscription
curl -X POST $API/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"planId\": \"$PLAN_ID\"}" \
  | jq -r '.subscription.id' > /tmp/sub_id.txt

export SUB_ID=$(cat /tmp/sub_id.txt)

# 5. Add line item
curl -X POST $API/subscriptions/$SUB_ID/lines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"variantId\": \"$VARIANT_ID\",
    \"quantity\": 1,
    \"unitPrice\": 49.99,
    \"taxRateId\": \"$TAX_ID\"
  }" | jq

# 6. Transition through states
curl -X POST $API/subscriptions/$SUB_ID/actions/quote \
  -H "Authorization: Bearer $TOKEN" -d '{}' | jq '.subscription.status'

curl -X POST $API/subscriptions/$SUB_ID/actions/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"startDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  | jq '.subscription.status'

curl -X POST $API/subscriptions/$SUB_ID/actions/activate \
  -H "Authorization: Bearer $TOKEN" -d '{}' | jq '.subscription.status'

# 7. Generate invoice
curl -X POST "$API/subscriptions/$SUB_ID/invoices/generate?periodStart=$(date -u +%Y-%m-01T00:00:00Z)" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.invoice.id' > /tmp/inv_id.txt

export INV_ID=$(cat /tmp/inv_id.txt)

# 8. Confirm invoice
curl -X POST $API/invoices/$INV_ID/actions/confirm \
  -H "Authorization: Bearer $TOKEN" -d '{}' | jq '.invoice.status'

# 9. Get invoice total
curl $API/invoices/$INV_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.invoice.total' > /tmp/total.txt

export TOTAL=$(cat /tmp/total.txt)

# 10. Record payment
curl -X POST $API/invoices/$INV_ID/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": $TOTAL,
    \"paymentMethod\": \"BANK_TRANSFER\",
    \"reference\": \"TEST-$(date +%s)\"
  }" | jq

# 11. Verify invoice is paid
curl $API/invoices/$INV_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.invoice | {status, total, paidAmount}'

# 12. Check reports
curl $API/reports/summary -H "Authorization: Bearer $TOKEN" | jq
```

## Error Examples

### Validation Error (400)

```bash
curl -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "password": "123"}' | jq
```

### Unauthorized (401)

```bash
curl $API/subscriptions | jq
```

### Forbidden (403)

```bash
# Login as portal user, try to create internal user
curl -X POST $API/admin/users \
  -H "Authorization: Bearer $PORTAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test", "name": "Test", "role": "INTERNAL"}' | jq
```

### Not Found (404)

```bash
curl $API/subscriptions/invalid-id \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Invalid Transition (409)

```bash
# Try to activate a DRAFT subscription
curl -X POST $API/subscriptions/$SUB_ID/actions/activate \
  -H "Authorization: Bearer $TOKEN" -d '{}' | jq
```

## Tips

### Pretty Print JSON

```bash
# Install jq
brew install jq  # macOS
sudo apt install jq  # Ubuntu

# Use with curl
curl $API/... | jq
```

### Save Responses

```bash
curl $API/subscriptions -H "Authorization: Bearer $TOKEN" > subscriptions.json
```

### Debug with Verbose Output

```bash
curl -v $API/... -H "Authorization: Bearer $TOKEN"
```

### Use Environment Variables

```bash
# .env.local
export API="http://localhost:3000/api/v1"
export TOKEN="your-token-here"
export SUB_ID="sub-id-here"

# Source it
source .env.local
```

---

**Need help?** Check `README.md` for full API documentation or run `npm run smoke` for automated testing.
