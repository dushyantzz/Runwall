# RUNWALL PAYMENT & RATE LIMITING - VISUAL QUICK REFERENCE
## Supabase + Razorpay Integration - Flow Diagrams & Checklists

---

## 1. SYSTEM ARCHITECTURE AT A GLANCE

```
┌──────────────────┐
│   USER BROWSER   │
│                  │
│  Pricing Page ───────→ "Upgrade" Button
│  Dashboard       │
│  Settings        │
└────────┬─────────┘
         │
         │ Makes API Calls
         │ with API Key
         ↓
┌──────────────────────────────────────────┐
│        YOUR BACKEND SERVER               │
│                                          │
│  ┌─ Rate Limit Middleware ──┐           │
│  │ Check: Can this key make   │           │
│  │ this request? (429 if no) │           │
│  └────────────────┬──────────┘           │
│                   ↓                       │
│  ┌─ Execute Request ─────────┐           │
│  │ Do what user asked        │           │
│  └────────────────┬──────────┘           │
│                   ↓                       │
│  ┌─ Record Usage Middleware ─┐           │
│  │ Count++ this request      │           │
│  │ remaining--               │           │
│  └────────────────┬──────────┘           │
│                   ↓                       │
│  ┌─ Handle Payments ─────────┐           │
│  │ /payment/create-order     │           │
│  │ /payment/verify           │           │
│  │ /webhooks/razorpay        │           │
│  └────────────────┬──────────┘           │
│                   ↓                       │
│  ┌─ Cron Jobs ──────────────┐            │
│  │ Check expired subs (hourly)│          │
│  │ Downgrade to free         │           │
│  │ Send reminders            │           │
│  └──────────────────────────┘            │
└──────────────────┬───────────────────────┘
                   ↓
         ┌─────────────────────┐
         │   SUPABASE (Database)│
         │                      │
         │  ├─ api_keys        │
         │  ├─ users           │
         │  ├─ user_subscriptions
         │  ├─ rate_limit_usage│
         │  └─ payment_trans.. │
         └────────────┬────────┘
                      ↓
         ┌────────────────────────┐
         │  RAZORPAY (Payments)   │
         │                        │
         │  Create Order ──────────────┐
         │  Process Payment ───────────────→ Modal opens
         │  Auto-Renew ──→ Webhook ────────→ Backend processes
         │  Webhook Retry ──→ Eventually succeeds
         └────────────────────────┘
```

---

## 2. SUPABASE TABLES STRUCTURE

```
TABLE: api_keys
┌─────────────────────────────────────────┐
│ id            (primary key)             │
│ user_id       (who owns this key)       │
│ key           (the actual API key)      │
│ is_active     (true/false)              │
│ tier ★        (NEW: 'free'/'pro'/...)   │
│ subscription_id ★ (NEW: Razorpay ID)    │
│ subscription_status ★ (NEW: active/exp) │
│ rate_limit_requests ★ (NEW: 15 or 2000) │
│ rate_limit_period ★ (NEW: 'week'/'mon') │
│ created_at                              │
│ updated_at                              │
└─────────────────────────────────────────┘

TABLE: user_subscriptions (NEW)
┌──────────────────────────────────────────┐
│ id                     (primary key)     │
│ user_id                (who has sub)     │
│ tier                   ('pro'/'enterprise)
│ status                 (active/expired)  │
│ razorpay_subscription_id                │
│ razorpay_customer_id                    │
│ current_period_start   (billing start)  │
│ current_period_end     (billing end)    │
│ auto_renew             (true/false)     │
│ price_paid             (700 paise)      │
│ currency               ('INR')          │
│ canceled_at                             │
│ created_at                              │
│ updated_at                              │
└──────────────────────────────────────────┘

TABLE: rate_limit_usage (NEW)
┌──────────────────────────────────────────┐
│ id                     (primary key)     │
│ api_key_id             (which key)       │
│ period_start           (Mon July 7)      │
│ period_end             (Sun July 14)     │
│ request_count          (7 used)          │
│ requests_remaining     (8 left)          │
│ last_request_at        (timestamp)       │
│ is_exceeded            (true/false)      │
└──────────────────────────────────────────┘

TABLE: payment_transactions (NEW)
┌──────────────────────────────────────────┐
│ id                     (primary key)     │
│ user_id                (who paid)        │
│ tier                   ('pro')           │
│ amount                 (700 paise)       │
│ status                 (completed)       │
│ razorpay_payment_id    (Razorpay ref)   │
│ razorpay_order_id                       │
│ razorpay_signature                      │
│ payment_method         (card/upi)        │
│ error_message          (if failed)       │
│ created_at                              │
│ updated_at                              │
└──────────────────────────────────────────┘
```

---

## 3. TIER COMPARISON TABLE

```
┌─────────────┬──────────────┬──────────────┬───────────────┐
│   FEATURE   │     FREE     │      PRO     │  ENTERPRISE   │
├─────────────┼──────────────┼──────────────┼───────────────┤
│ Price       │      $0      │      $7/mo   │    Custom     │
│ Requests    │   15/week    │ 2000/month   │   Unlimited   │
│ RPM Limit   │      60      │     500      │   Unlimited   │
│ Period      │   Sunday     │  1st of mo   │   Custom      │
│ Reset Date  │ Every Sun    │ Every 1st    │  On dates     │
│ Support     │   Community  │    Email     │   24/7 SLA    │
│ Downgrade   │      —       │ Auto on exp  │   Auto on exp │
├─────────────┼──────────────┼──────────────┼───────────────┤
│ Limit check │   Before     │   Before     │   Before      │
│ enforcement │   execution  │   execution  │   execution   │
└─────────────┴──────────────┴──────────────┴───────────────┘

Key Points:
★ Free tier: 15 requests per WEEK (Sun-Sun)
★ Pro tier: 2000 requests per MONTH (1st-1st)
★ Both have RPM (requests per minute) limits too
★ Free: 60 RPM | Pro: 500 RPM | Enterprise: unlimited
```

---

## 4. PAYMENT FLOW SIMPLIFIED

```
SCENARIO: User clicks "Upgrade to Pro"

Step 1: Create Order
┌─────────────────────────┐
│ Frontend: "I want Pro"  │
└────────────┬────────────┘
             ↓
┌─────────────────────────────────────┐
│ Backend receives request            │
│ Looks up: Pro = 700 paise + plan ID │
│ Calls Razorpay API                  │
│ Razorpay creates order              │
│ Returns order_id, key_id            │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Frontend: Opens Razorpay modal      │
│ Shows beautiful payment form        │
│ User enters card/UPI details        │
│ User clicks "Pay Now"               │
└────────────┬────────────────────────┘

Step 2: Verify Payment
             ↓
┌─────────────────────────────────────┐
│ Razorpay processes payment          │
│ Payment succeeds                    │
│ Returns: payment_id, signature      │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Frontend sends to backend:          │
│ payment_id, order_id, signature     │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Backend: Verify signature (security)│
│ Check: Is this payment real?        │
│ If valid → Update Supabase:         │
│   • Insert user_subscriptions       │
│   • Update api_keys (tier='pro')    │
│   • Create rate_limit_usage         │
│   • Log transaction                 │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Backend sends email:                │
│ "Welcome to Pro! 2000 requests/mo"  │
│ Dashboard shows Pro tier now        │
└─────────────────────────────────────┘
```

---

## 5. RATE LIMIT CHECK FLOW (Every API Call)

```
User makes API call with their API key
        ↓
Backend middleware: checkRateLimit
        ↓
┌─────────────────────────────────────────────┐
│ Step 1: Get API Key                         │
│ Extract from Authorization header           │
│ Query Supabase: Find this key               │
│ Get: tier, rate_limit_requests              │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Step 2: Calculate Current Period            │
│                                             │
│ IF tier = 'free':                          │
│   period_start = last Sunday                │
│   period_end = next Sunday                  │
│                                             │
│ IF tier = 'pro':                           │
│   period_start = 1st of this month          │
│   period_end = 1st of next month            │
│                                             │
│ IF tier = 'enterprise':                    │
│   period_start = sub.current_period_start   │
│   period_end = sub.current_period_end       │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Step 3: Get Current Usage                   │
│ Query rate_limit_usage table                │
│ Find: This key + This period                │
│ Get: request_count (how many used)          │
└────────────────┬────────────────────────────┘
                 ↓
        ┌────────┴────────┐
        ↓                 ↓
   ┌─────────┐      ┌──────────┐
   │ Period  │      │ Usage    │
   │ ended?  │      │ >= limit?│
   └────┬────┘      └────┬─────┘
        │                │
     YES│               YES│
        ↓                ↓
  ┌──────────────┐  ┌──────────────────┐
  │ Create new   │  │ Return HTTP 429  │
  │ rate_limit   │  │ "Rate limit      │
  │ record for   │  │  exceeded!"      │
  │ new period   │  │ Show: used/limit │
  │ Start at: 0  │  │ Show: reset date │
  │ Remaining:   │  │ BLOCK REQUEST    │
  │ full_limit   │  └──────────────────┘
  └────┬─────────┘
       ↓
   ┌──────────────┐
   │ Allow request│
   │ to continue  │
   └────┬─────────┘
        ↓
   After success:
   recordUsage middleware:
   • request_count++
   • requests_remaining--
   • last_request_at = now
```

---

## 6. SUBSCRIPTION RENEWAL FLOW

```
Day 30 of Pro Subscription Arrives
        ↓
Razorpay automatically charges user
        ↓
Razorpay sends webhook:
  Event: "subscription.charged"
  Payment: 700 paise successful
        ↓
┌──────────────────────────────────────┐
│ Backend receives webhook             │
│ Verifies signature (security check)  │
│ If invalid → Reject & ignore         │
└────────────┬───────────────────────────┘
             ↓
┌──────────────────────────────────────┐
│ Update Supabase:                     │
│                                      │
│ 1. user_subscriptions table:         │
│    current_period_start = today      │
│    current_period_end = today + 30   │
│    status = 'active'                 │
│                                      │
│ 2. Create NEW rate_limit_usage:      │
│    period_start = today              │
│    period_end = today + 30           │
│    request_count = 0 (RESET!)        │
│    requests_remaining = 2000         │
│                                      │
│ 3. Log in payment_transactions       │
│    For audit trail                   │
└────────────┬───────────────────────────┘
             ↓
┌──────────────────────────────────────┐
│ Send email to user:                  │
│ "Subscription renewed!"              │
│ "Active until August 17"             │
│ "2000 requests/month"                │
└──────────────────────────────────────┘
        ↓
User continues with Pro tier
```

---

## 7. AUTO-DOWNGRADE ON EXPIRY

```
Day 31 of Subscription (expired)
        ↓
Cron job runs (every hour)
        ↓
┌─────────────────────────────────────┐
│ Query Supabase:                     │
│ Find subscriptions WHERE:           │
│   current_period_end < NOW()        │
│   AND status = 'active'             │
│   AND auto_renew = false            │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ For each expired subscription:      │
│                                     │
│ 1. Update user_subscriptions:       │
│    status = 'expired'               │
│    canceled_at = now                │
│                                     │
│ 2. Update api_keys:                 │
│    tier = 'free' ← DOWNGRADE!       │
│    subscription_id = NULL           │
│    rate_limit_requests = 15         │
│    rate_limit_period = 'week'       │
│                                     │
│ 3. Create NEW rate_limit_usage:     │
│    For free tier (weekly)           │
│    request_count = 0                │
│    requests_remaining = 15          │
│                                     │
│ 4. Send email:                      │
│    "Subscription expired"           │
│    "Downgraded to Free"             │
│    "15 requests/week"               │
└─────────────────────────────────────┘
        ↓
User next API call will fail if > 15/week
```

---

## 8. SETUP CHECKLIST

### Razorpay Setup
```
□ Create Razorpay account (razorpay.com)
□ Get API keys:
  □ Key ID (public, safe to expose)
  □ Key Secret (keep in .env, NEVER expose)
□ Create Plan in Razorpay dashboard:
  □ Plan Name: "Runwall Pro Monthly"
  □ Amount: 700 paise (Rs. 7)
  □ Period: Monthly
  □ Copy Plan ID
□ Set Webhook in Razorpay:
  □ URL: https://yourdomain.com/api/v1/webhooks/razorpay
  □ Events: payment.authorized, subscription.charged
  □ Copy Webhook Secret
□ Save all secrets in .env file:
  □ RAZORPAY_KEY_ID=xxx
  □ RAZORPAY_KEY_SECRET=xxx
  □ RAZORPAY_WEBHOOK_SECRET=xxx
```

### Supabase Setup
```
□ Create/open Supabase project
□ Create new tables:
  □ user_subscriptions
  □ rate_limit_usage
  □ payment_transactions
□ Add columns to api_keys:
  □ tier
  □ subscription_id
  □ subscription_status
  □ subscription_end_date
  □ rate_limit_requests
  □ rate_limit_period
□ Set up Row-Level Security (RLS):
  □ Users can only see their own data
  □ Backend can see all (with service key)
□ Create indexes for performance:
  □ api_keys.tier
  □ rate_limit_usage.api_key_id
  □ user_subscriptions.user_id
□ Enable Realtime (optional)
□ Test backup restore
```

### Backend Setup
```
□ Install Razorpay SDK
□ Create middleware: checkRateLimit
  □ Extract API key
  □ Query api_keys table
  □ Calculate current period
  □ Check against limit
  □ Return 429 if over
□ Create middleware: recordUsage
  □ Increment request_count
  □ Update requests_remaining
□ Create API endpoints:
  □ POST /api/v1/payment/create-order
  □ POST /api/v1/payment/verify
  □ GET /api/v1/subscription/current
  □ POST /api/v1/subscription/upgrade
  □ POST /api/v1/subscription/cancel
  □ GET /api/v1/subscription/usage
  □ GET /api/v1/rate-limit/status
  □ POST /api/v1/webhooks/razorpay
□ Set up cron job (every hour):
  □ Check for expired subscriptions
  □ Downgrade users to free
  □ Send emails
□ Add error handling & logging
```

### Frontend Setup
```
□ Create PaymentModal component
  □ Call /payment/create-order
  □ Open Razorpay checkout
  □ Handle success/error
□ Create ApiKeyDisplay component
  □ Show API key
  □ Show tier
  □ Show rate limit progress
  □ Show reset date
□ Update pricing page:
  □ Free: "Go to Dashboard" button
  □ Pro: "Upgrade to Pro" button
  □ Enterprise: "Contact Us" button
□ Create subscription settings page:
  □ View current tier
  □ Cancel/downgrade
  □ View payment history
□ Add RawUrlIntegration docs:
  □ Show direct HTTPS URL option
  □ Explain usage
```

---

## 9. TESTING CHECKLIST

```
RATE LIMITING TESTS
□ Free tier: Make 15 requests → all succeed
□ Free tier: 16th request → 429 error
□ Free tier: Reset on Sunday → counter resets
□ Pro tier: Make 2000 requests → all succeed
□ Pro tier: 2001st request → 429 error
□ Pro tier: Reset on 1st of month → counter resets
□ RPM limits: Free 60 requests/min → 61st blocked
□ RPM limits: Pro 500 requests/min → 501st blocked

PAYMENT TESTS
□ Free→Pro upgrade: Complete payment flow works
□ Razorpay modal: Opens correctly
□ Test card: 4111111111111111 → success
□ Test card: 4000000000000002 → failure
□ Signature verification: Valid signature passes
□ Signature verification: Invalid signature rejected
□ After payment: Tier changes to 'pro'
□ After payment: rate_limit_requests = 2000
□ Dashboard updates: Shows Pro tier immediately

WEBHOOK TESTS
□ Webhook received: Subscription.charged event
□ Webhook verified: Signature valid
□ Webhook processed: Database updated
□ Auto-renewal: Charges every 30 days
□ Auto-renewal: Period resets
□ Webhook retry: Works if first attempt fails

EXPIRY TESTS
□ Cron job runs: Every hour
□ Cron detects: Expired subscriptions
□ Cron downgrades: tier='free'
□ Email sent: Notification to user
□ Rate limit reset: Now 15/week

ERROR SCENARIOS
□ Rate limit hit: Clear error message
□ Payment failed: Can retry
□ Webhook delayed: Cron catches it up
□ Missing period: Creates new one automatically
□ Invalid signature: Webhook rejected safely
```

---

## 10. MONITORING DASHBOARD

```
What to Monitor Daily:

PAYMENTS
├─ Success rate (target: >95%)
├─ Failed payments (investigate if >5%)
├─ Webhook delivery (target: <5 sec)
├─ Subscription renewals (should match expected)
└─ Refunds (track manual refunds)

RATE LIMITING
├─ Users hitting limits (per tier)
├─ False positives (users complaining)
├─ Usage patterns (when do users make requests?)
├─ Upgrade rate (% free→pro conversion)
└─ Downgrade rate (% pro→free)

SYSTEM HEALTH
├─ Database queries (should be <100ms)
├─ API response time (should be <100ms)
├─ Error rates (watch for spikes)
├─ Disk space (Supabase usage)
└─ Backup status (ensure recent backup)

ALERTS
├─ Payment failures > 10% → Investigate
├─ Webhook failures > 1% → Check webhook URL
├─ API errors > 1% → Something broken
├─ Database slow queries → Optimize
└─ Disk space < 20% → Clean up
```

---

## 11. QUICK REFERENCE: API RESPONSES

```
SUCCESSFUL REQUEST (Rate limit OK)
┌────────────────────────────────────┐
│ HTTP 200                           │
│ {                                  │
│   "success": true,                 │
│   "data": {...},                   │
│   "rateLimit": {                   │
│     "remaining": 1899,             │
│     "limit": 2000,                 │
│     "reset": "2024-08-17T00:00Z"   │
│   }                                │
│ }                                  │
└────────────────────────────────────┘

RATE LIMIT EXCEEDED
┌────────────────────────────────────┐
│ HTTP 429                           │
│ {                                  │
│   "error": "Rate limit exceeded",  │
│   "tier": "free",                  │
│   "limit": 15,                     │
│   "used": 15,                      │
│   "period": "week",                │
│   "resetDate": "2024-07-21T00:00Z",│
│   "message": "Upgrade to Pro"      │
│ }                                  │
└────────────────────────────────────┘

PAYMENT SUCCESS
┌────────────────────────────────────┐
│ HTTP 200                           │
│ {                                  │
│   "success": true,                 │
│   "tier": "pro",                   │
│   "apiKey": "runwall_...",         │
│   "rateLimit": {                   │
│     "requests": 2000,              │
│     "period": "month"              │
│   }                                │
│ }                                  │
└────────────────────────────────────┘

PAYMENT FAILED
┌────────────────────────────────────┐
│ HTTP 400                           │
│ {                                  │
│   "error": "Payment failed",       │
│   "reason": "Insufficient funds",  │
│   "retryable": true                │
│ }                                  │
└────────────────────────────────────┘
```

---

## 12. ENVIRONMENT VARIABLES TEMPLATE

```
# .env file (Never commit this!)

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx (KEEP SECRET)
RAZORPAY_WEBHOOK_SECRET=xxxxx (KEEP SECRET)

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx (Safe to expose)
SUPABASE_SERVICE_ROLE_KEY=xxxxx (KEEP SECRET)

# Database
DATABASE_URL=postgresql://...

# Redis (if using)
REDIS_URL=redis://...

# API Configuration
API_BASE_URL=https://api.runwall.vercel.app
API_DOMAIN=https://api.runwall.vercel.app

# Cron Jobs
CRON_SECRET=xxxxx (Verify cron requests)
```

---

## 13. TROUBLESHOOTING QUICK GUIDE

```
PROBLEM: Rate limit exceeded but user didn't use all requests
SOLUTION:
  □ Check period calculation (free=Sunday, pro=1st)
  □ Check timezone (using UTC?)
  □ Check request_count increment logic
  □ Verify period_start and period_end dates

PROBLEM: Razorpay webhook not triggering
SOLUTION:
  □ Check webhook URL is public (not localhost)
  □ Check webhook URL is correct in Razorpay dashboard
  □ Check webhook secret in .env file
  □ Test webhook manually in Razorpay dashboard
  □ Check server logs for webhook receipt

PROBLEM: Payment succeeds but tier doesn't update
SOLUTION:
  □ Check signature verification logic
  □ Verify Razorpay API response parsed correctly
  □ Check Supabase INSERT/UPDATE queries
  □ Check user_subscriptions table has data
  □ Check api_keys table tier column updated

PROBLEM: "Invalid signature" on every webhook
SOLUTION:
  □ Verify using WEBHOOK_SECRET not KEY_SECRET
  □ Check calculation: order_id + "|" + payment_id
  □ Check HMAC-SHA256 implementation
  □ Test with known signature in Razorpay docs

PROBLEM: User still has access after tier expires
SOLUTION:
  □ Check cron job is running
  □ Check subscription has auto_renew = false
  □ Check current_period_end < NOW()
  □ Check update query in cron job
  □ Verify tier updated to 'free'

PROBLEM: Database queries too slow
SOLUTION:
  □ Add indexes to api_keys.tier
  □ Add indexes to rate_limit_usage.api_key_id
  □ Add indexes to user_subscriptions.user_id
  □ Check query plans in Supabase dashboard
  □ Consider caching frequent queries
```

---

## 14. FINAL IMPLEMENTATION ORDER

```
WEEK 1: DATABASE & RAZORPAY
  □ Monday: Razorpay account setup & keys
  □ Tuesday: Create Supabase tables
  □ Wednesday: Razorpay plan & webhook
  □ Thursday: Database indexes & RLS
  □ Friday: Testing database structure

WEEK 2: BACKEND CORE
  □ Monday: Rate limit middleware (checkRateLimit)
  □ Tuesday: Usage recording middleware (recordUsage)
  □ Wednesday: Payment endpoints (create-order, verify)
  □ Thursday: Webhook handler
  □ Friday: Cron job for expiry

WEEK 3: REMAINING ENDPOINTS
  □ Monday: GET subscription/current
  □ Tuesday: POST subscription/upgrade
  □ Wednesday: POST subscription/cancel
  □ Thursday: GET subscription/usage
  □ Friday: GET rate-limit/status

WEEK 4: FRONTEND
  □ Monday: PaymentModal component
  □ Tuesday: Razorpay checkout integration
  □ Wednesday: ApiKeyDisplay component
  □ Thursday: Subscription settings page
  □ Friday: Update pricing page

WEEK 5: TESTING & DEPLOYMENT
  □ Monday-Wednesday: Integration testing
  □ Thursday: Staging deployment
  □ Friday: Production deployment & monitoring

TOTAL: 5 weeks (25-30 days)
```

---

This is your complete visual and reference guide. Everything is mapped out! 🎯

