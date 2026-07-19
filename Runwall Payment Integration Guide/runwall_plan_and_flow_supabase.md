# RUNWALL PAYMENT + RATE LIMITING - COMPREHENSIVE PLAN & FLOW
## (Supabase Database) - NO CODE

---

## SECTION 1: SYSTEM OVERVIEW

### What You're Building

A three-tier payment system with automatic rate limiting:
- **Free Tier:** $0/month, 15 requests/week
- **Pro Tier:** $7/month, 2000 requests/month  
- **Enterprise:** Custom pricing, unlimited requests

Users get an API key. Each request is checked against their tier limits before execution.

### Key Participants

1. **User** - Signs up, views pricing, upgrades to Pro
2. **Runwall Backend API** - Your server handling requests
3. **Razorpay** - Payment processor (handles all payments)
4. **Supabase** - Database storing everything
5. **Rate Limiter** - Middleware checking request limits

---

## SECTION 2: DATABASE STRUCTURE (SUPABASE TABLES)

### Table 1: `api_keys` (Extended)

**Existing columns you have:**
- id
- user_id
- key (the API key itself)
- is_active

**New columns to add:**
- tier (text: 'free', 'pro', 'enterprise')
- subscription_id (text: Razorpay subscription ID)
- subscription_status (text: 'active', 'expired', 'canceled')
- subscription_end_date (timestamp: when it expires)
- rate_limit_requests (number: max requests allowed)
- rate_limit_period (text: 'week' or 'month')
- created_at
- updated_at

**Example data:**
```
id: key_123
user_id: user_456
key: runwall_abc123xyz789
tier: pro
subscription_id: sub_razorpay_123
subscription_status: active
rate_limit_requests: 2000
rate_limit_period: month
```

---

### Table 2: `user_subscriptions` (New)

**Stores subscription information from Razorpay:**
- id (primary key)
- user_id (links to users table)
- tier (text: 'free', 'pro', 'enterprise')
- status (text: 'active', 'trial', 'expired', 'canceled')
- razorpay_subscription_id (Razorpay ID)
- razorpay_customer_id (Razorpay customer ID)
- razorpay_plan_id (Razorpay plan ID)
- current_period_start (timestamp: billing period start)
- current_period_end (timestamp: billing period end)
- auto_renew (boolean: auto-renew next month?)
- price_paid (number: amount in paise, e.g., 700 for Rs. 7)
- currency (text: 'INR')
- canceled_at (timestamp: when canceled, null if active)
- created_at
- updated_at

**Example data:**
```
id: sub_123
user_id: user_456
tier: pro
status: active
razorpay_subscription_id: sub_razorpay_xyz
current_period_start: 2024-07-17
current_period_end: 2024-08-17
auto_renew: true
price_paid: 700
```

---

### Table 3: `rate_limit_usage` (New)

**Tracks how many requests each API key has used in current period:**
- id (primary key)
- api_key_id (links to api_keys table)
- period_start (timestamp: start of current counting period)
- period_end (timestamp: end of current counting period)
- request_count (number: how many requests made this period)
- requests_remaining (number: how many left)
- last_request_at (timestamp: last time this key was used)
- is_exceeded (boolean: did they go over limit?)

**Example data:**
```
id: usage_123
api_key_id: key_123
period_start: 2024-07-17
period_end: 2024-08-17
request_count: 145
requests_remaining: 1855
last_request_at: 2024-07-18 14:30:00
is_exceeded: false
```

---

### Table 4: `payment_transactions` (New)

**Audit trail of all payments (for compliance/debugging):**
- id (primary key)
- user_id (links to users table)
- tier (text: what tier they bought)
- amount (number: in paise)
- currency (text: 'INR')
- status (text: 'pending', 'completed', 'failed', 'refunded')
- razorpay_payment_id (Razorpay's payment ID)
- razorpay_order_id (Razorpay's order ID)
- razorpay_signature (for verification)
- payment_method (text: 'card', 'upi', 'netbanking')
- subscription_id (text: if part of subscription)
- description (text: why this payment)
- error_message (text: if failed, what went wrong)
- created_at
- updated_at

**Example data:**
```
id: txn_123
user_id: user_456
tier: pro
amount: 700
status: completed
razorpay_payment_id: pay_razorpay_123
razorpay_order_id: order_razorpay_456
payment_method: card
```

---

### Table 5: `request_logs` (Optional - for analytics)

**Log every API request for analytics/debugging:**
- id
- api_key_id
- tier (what tier at time of request)
- endpoint (which endpoint was called)
- status_code (200, 429, 500, etc.)
- timestamp

---

## SECTION 3: USER JOURNEY FLOWS

### Flow 1: Free Tier User

```
User signs up
    ↓
System creates user in Supabase
    ↓
System generates FREE tier API key
    ↓
System creates rate_limit_usage record
    - period: Sunday to Sunday
    - limit: 15 requests
    ↓
User sees dashboard:
  - API key displayed
  - "15 requests per week"
  - "Upgrade to Pro" button
    ↓
User tries to call API (1st request)
    ↓
Backend checks rate limit (see Flow 4)
    ↓
User successfully makes 15 requests
    ↓
16th request hits limit
    ↓
System returns 429 error with message:
  "You've used 15/15 requests this week"
  "Upgrade to Pro for 2000/month"
  "Reset date: Sunday July 21"
```

---

### Flow 2: Free to Pro Upgrade

```
Free tier user on pricing page
    ↓
Clicks "Upgrade to Pro" button
    ↓
Frontend calls API: POST /api/v1/payment/create-order
    ↓
Backend creates Razorpay order:
  - Amount: 700 paise (Rs. 7)
  - Plan: Pro monthly subscription
  - Returns: Order ID, Razorpay Key
    ↓
Frontend opens Razorpay checkout modal
    ↓
User enters payment details:
  - Card number
  - CVV
  - Expiry date
    ↓
Razorpay processes payment
    ↓
Payment succeeds
    ↓
Razorpay sends webhook to backend:
  Event: "payment.authorized"
  Details: payment_id, order_id, signature
    ↓
Backend verifies webhook signature (security check)
    ↓
Backend creates subscription in Supabase:
  - Insert into user_subscriptions table
  - tier: 'pro'
  - status: 'active'
  - current_period_end: 30 days from now
    ↓
Backend updates API key:
  - Update api_keys table
  - tier: 'pro' (was 'free')
  - subscription_id: razorpay_sub_id
  - rate_limit_requests: 2000
    ↓
Backend creates payment transaction record:
  - Insert into payment_transactions
  - status: 'completed'
  - For audit trail
    ↓
Frontend receives success notification
    ↓
Dashboard updates:
  - API key now shows "Pro tier"
  - Shows "2000 requests per month"
  - Shows "Reset on August 17"
    ↓
Backend sends email to user:
  "Welcome to Runwall Pro!"
  "You now have 2000 requests/month"
```

---

### Flow 3: Subscription Auto-Renewal

```
Day 1 to Day 29 of Pro subscription
    ↓
User continues using API
    ↓
Day 30 arrives (current_period_end date)
    ↓
Razorpay automatically charges user again
    ↓
Razorpay sends webhook: "subscription.charged"
    ↓
Backend verifies signature
    ↓
Backend updates Supabase:
  - Updates user_subscriptions table
  - current_period_start: Today
  - current_period_end: Today + 30 days
  - status: 'active' (still active)
    ↓
Backend creates new rate_limit_usage record:
  - New period_start and period_end
  - request_count: 0 (reset)
  - requests_remaining: 2000 (full again)
    ↓
Backend creates payment_transaction:
  - For the renewal charge
  - For audit trail
    ↓
Backend sends email:
  "Subscription renewed!"
  "Your Pro tier is active for another month"
    ↓
User can continue making 2000 requests
```

---

### Flow 4: Rate Limiting Check (Every API Call)

```
User makes API request with their API key
    ↓
Request hits your backend
    ↓
Middleware: checkRateLimit runs:
    ↓
Step 1: Extract API key from request header
    ↓
Step 2: Query Supabase api_keys table:
  - Find: WHERE key = user's_key AND is_active = true
  - Get: tier, rate_limit_requests, rate_limit_period
    ↓
Step 3: Determine current period based on tier:
  
  IF tier = 'free':
    - Period resets every Sunday at 00:00 UTC
    - Calculate: period_start = last Sunday
    - Calculate: period_end = next Sunday
  
  IF tier = 'pro':
    - Period resets on 1st of each month at 00:00 UTC
    - Calculate: period_start = 1st of this month
    - Calculate: period_end = 1st of next month
  
  IF tier = 'enterprise':
    - Use dates from user_subscriptions table
    - current_period_start and current_period_end
    ↓
Step 4: Query rate_limit_usage table:
  - Find: WHERE api_key_id = this_key
  - AND period_start = calculated_start
  - AND period_end = calculated_end
  - Get: request_count, requests_remaining
    ↓
Step 5: Check if period expired:
  
  IF period_end < NOW():
    - Old period has ended
    - Create NEW rate_limit_usage record
    - request_count: 0
    - requests_remaining: tier_limit
  
  ELSE:
    - Use existing record
    ↓
Step 6: Check if limit reached:
  
  IF request_count >= rate_limit_requests:
    - User has exhausted their limit
    - Return HTTP 429 error
    - Message: "Rate limit exceeded"
    - Include: used, limit, reset_date
    - STOP - Don't execute request
  
  ELSE:
    - User has requests remaining
    - Allow request to continue
    - Call next()
    ↓
Step 7: User's request executes normally
    ↓
Step 8: After request succeeds:
  
  recordUsage middleware runs:
    - Increment request_count by 1
    - Decrement requests_remaining by 1
    - Update last_request_at timestamp
    - Insert into request_logs (optional)
    ↓
Response sent to user
    ↓
User sees successful response
```

---

### Flow 5: Subscription Expiry & Auto-Downgrade

```
User has Pro subscription set to expire on August 17
    ↓
August 17 arrives at 00:00 UTC
    ↓
Subscription expires (current_period_end < NOW)
    ↓
Backend runs daily/hourly cron job:
  
  Query Supabase:
    - Find expired subscriptions
    - WHERE current_period_end < NOW()
    - AND status = 'active'
    ↓
For each expired subscription:
  
  Step 1: Update user_subscriptions table:
    - status: 'expired' (was 'active')
    - canceled_at: current timestamp
  
  Step 2: Update api_keys table:
    - tier: 'free' (downgrade from 'pro')
    - subscription_id: NULL
    - rate_limit_requests: 15
    - rate_limit_period: 'week'
  
  Step 3: Create new rate_limit_usage:
    - For free tier (weekly)
    - request_count: 0
    - requests_remaining: 15
  
  Step 4: Send email to user:
    "Your Pro subscription has expired"
    "You've been downgraded to Free tier"
    "15 requests per week starting Sunday"
    ↓
User tries to make API call
    ↓
Rate limit check happens (Flow 4)
    ↓
User's API key now has tier: 'free'
    ↓
User limited to 15 requests per week
```

---

### Flow 6: Direct HTTPS/Raw URL Access (for Claude Code)

```
User gets API key: runwall_abc123xyz789
    ↓
User in Claude Code needs raw HTTPS link
    ↓
Instead of JSON config, they use direct URL:
    
  https://api.runwall.vercel.app/mcp?token=runwall_abc123xyz789
    ↓
Backend receives request
    ↓
Extract token from URL query parameter
    ↓
Perform same rate limit check (Flow 4)
    ↓
If allowed: Execute request normally
    ↓
If denied: Return 429 error
    ↓
Rate limiting applied automatically
    ↓
User doesn't need special setup
```

---

## SECTION 4: RAZORPAY PAYMENT FLOW

### Step 1: Payment Initiation

```
User clicks "Upgrade to Pro"
    ↓
Frontend calls: POST /api/v1/payment/create-order
    
Body:
{
  "tier": "pro",
  "recurring": true,
  "paymentMethod": "card"
}
    ↓
Backend receives request
    ↓
Backend authenticates user (JWT token check)
    ↓
Backend queries pricing config:
  - Pro tier = 700 paise (Rs. 7)
  - Plan ID from Razorpay = plan_pro_monthly
    ↓
Backend calls Razorpay API:
  
  Create Razorpay subscription request:
  - customer_id: user's Razorpay ID (or create new)
  - plan_id: plan_pro_monthly
  - recurring: true
  - quantity: 1
  - total_count: null (infinite renewals)
    ↓
Razorpay creates order
    ↓
Razorpay returns:
  - order_id: order_12345
  - amount: 700
  - currency: INR
  - key_id: your_razorpay_key (public)
    ↓
Backend returns to frontend:
{
  "orderId": "order_12345",
  "amount": 700,
  "keyId": "rzp_live_xxxxx",
  "tier": "pro",
  "description": "Runwall Pro - Monthly Subscription"
}
    ↓
Frontend receives response
```

---

### Step 2: Checkout Modal

```
Frontend has order details
    ↓
Frontend loads Razorpay checkout script:
  - <script src="checkout.razorpay.com/v1/checkout.js">
    ↓
Frontend opens Razorpay checkout modal with:
  - order_id
  - amount
  - key_id
  - user's email and name (prefill)
  - callback handlers
    ↓
User sees beautiful Razorpay modal
    ↓
User selects payment method:
  - Card (Visa/Mastercard/Amex)
  - UPI (GooglePay, PhonePe, etc.)
  - Netbanking (all major banks)
    ↓
User enters payment details
    ↓
Razorpay processes payment
```

---

### Step 3: Payment Verification

```
Razorpay processes the payment:
    ↓
Two outcomes:
  
  A) Payment succeeds:
    - Razorpay generates payment_id
    - Razorpay generates signature
    
  B) Payment fails:
    - Razorpay returns error
    - Modal closes with error message
    - User can retry
    ↓
IF Payment Succeeds:
    
  Razorpay returns to frontend:
  {
    "razorpay_payment_id": "pay_12345",
    "razorpay_order_id": "order_12345",
    "razorpay_signature": "signature_xyz"
  }
    ↓
Frontend receives in callback handler
    ↓
Frontend calls: POST /api/v1/payment/verify
  
  Body:
  {
    "razorpayPaymentId": "pay_12345",
    "razorpayOrderId": "order_12345",
    "razorpaySignature": "signature_xyz"
  }
    ↓
Backend receives verification request
    ↓
Backend verifies signature (security check):
  
  1. Combine: order_id + "|" + payment_id
  2. HMAC-SHA256 with RAZORPAY_WEBHOOK_SECRET
  3. Compare result with received signature
  4. If match: Signature valid
  5. If no match: Someone tampering, reject
    ↓
IF Signature Valid:
  
  Backend queries Razorpay API:
    - Get subscription details using payment_id
    - Confirm: amount matches, currency is INR
    ↓
  Backend creates Supabase records:
  
  1. Insert into user_subscriptions:
     - user_id
     - tier: 'pro'
     - status: 'active'
     - razorpay_subscription_id
     - current_period_start: today
     - current_period_end: today + 30 days
  
  2. Update api_keys:
     - tier: 'pro'
     - rate_limit_requests: 2000
     - subscription_id: razorpay_sub_id
  
  3. Insert into payment_transactions:
     - For audit trail
     - status: 'completed'
    ↓
  Backend sends success response to frontend:
  {
    "success": true,
    "tier": "pro",
    "apiKey": "runwall_xyz...",
    "rateLimit": {
      "requests": 2000,
      "period": "month"
    }
  }
    ↓
  Frontend receives success
    ↓
  Frontend updates UI:
    - Hide payment modal
    - Show success message
    - Display new API key
    - Show "2000 requests/month"
    - Update dashboard
    ↓
  Backend sends email to user:
    "Welcome to Pro!"
    "Your subscription is active"
    "2000 requests per month"

IF Signature Invalid:
  
  Backend returns error:
  {
    "success": false,
    "error": "Payment verification failed"
  }
    ↓
  Frontend shows error to user
    ↓
  User can retry
```

---

### Step 4: Webhook (Automatic Renewal)

```
30 days pass
    ↓
Razorpay automatically charges user again
    ↓
Razorpay sends webhook to your backend:
  
  POST /api/v1/webhooks/razorpay
  
  Header: X-Razorpay-Signature: signature_value
  
  Body:
  {
    "event": "subscription.charged",
    "payload": {
      "subscription": {
        "id": "sub_razorpay_123",
        "customer_id": "cust_123",
        "plan_id": "plan_pro_monthly",
        "status": "active",
        "current_period_start": 1724025000,
        "current_period_end": 1726703400
      },
      "payment": {
        "id": "pay_renewal_456",
        "amount": 700
      }
    }
  }
    ↓
Backend receives webhook
    ↓
Backend verifies signature:
  1. Same HMAC-SHA256 verification
  2. Using RAZORPAY_WEBHOOK_SECRET
  3. If invalid: Reject webhook (don't process)
    ↓
IF Signature Valid:
  
  Backend processes event:
  
  Step 1: Find subscription in Supabase:
    - WHERE razorpay_subscription_id = sub_razorpay_123
  
  Step 2: Update user_subscriptions:
    - current_period_start: new start
    - current_period_end: new end
    - status: 'active'
  
  Step 3: Create new rate_limit_usage:
    - New period with 2000 requests
  
  Step 4: Insert payment transaction:
    - For the renewal
  
  Step 5: Send email:
    "Your subscription renewed!"
    ↓
Everything works automatically
    ↓
User continues with 2000 requests/month
```

---

## SECTION 5: RATE LIMIT LOGIC SUMMARY

### How the Period Works

```
FREE TIER (15 requests/week):
  Sunday 00:00 → Sunday 23:59
  Resets every Sunday
  Example: Sun July 14 to Sun July 21
  
  User can make:
  - Monday: 2 requests
  - Tuesday: 3 requests
  - Wednesday: 1 request
  - Thursday: 4 requests
  - Friday: 2 requests
  - Saturday: 3 requests
  - Total: 15 requests ✓
  
  - Sunday comes: Counter resets to 0
  - Monday: 2 more requests ✓

PRO TIER (2000 requests/month):
  1st of month 00:00 → 1st of next month 23:59
  Resets monthly
  Example: July 1 to August 1
  
  User can make:
  - First week: 400 requests ✓
  - Second week: 500 requests ✓
  - Third week: 600 requests ✓
  - Fourth week: 500 requests ✓
  - Total: 2000 requests ✓
  
  - August 1 comes: Counter resets to 0
  - More 2000 requests available ✓

ENTERPRISE (Custom):
  Based on subscription period dates
  Could be any custom dates
  Example: July 15 to August 15
  Reset happens on those exact dates
```

---

### How the Check Works

```
User makes API call
    ↓
System identifies user's API key
    ↓
System looks up in Supabase:
  - What tier is this key?
  - What are their limits?
    ↓
System calculates:
  - When does their current period end?
    ↓
System looks up usage:
  - How many requests have they made this period?
    ↓
System compares:
  - Have they used their limit?
    ↓
Decision Tree:

  IF (requests_used >= limit):
    → Reject request
    → Return HTTP 429 (Too Many Requests)
    → Show: "15/15 used. Reset Sunday."
  
  ELSE IF (requests_used < limit):
    → Allow request to proceed
    → After success: increment counter
    → Update: requests_remaining
    
  ELSE IF (period has ended):
    → Create new period counter
    → Start at 0
    → Allow new requests
```

---

## SECTION 6: SUPABASE CONFIGURATION

### What You Do in Supabase Console

1. **Create Tables** (not write SQL, just create structure):
   - Create `user_subscriptions` table
   - Create `rate_limit_usage` table
   - Create `payment_transactions` table
   - Add columns to `api_keys` table

2. **Set Up Row-Level Security (RLS)**:
   - Users can only see their own data
   - Nobody can directly edit subscription status (backend only)
   - Nobody can directly edit rate limit (backend only)

3. **Create Indexes** (for performance):
   - Index on `api_keys.tier` (lookup speed)
   - Index on `rate_limit_usage.api_key_id` (lookup speed)
   - Index on `user_subscriptions.user_id` (lookup speed)

4. **Enable Realtime** (optional):
   - If you want dashboard updates in real-time
   - Not required for basic functionality

5. **Set Up Backups**:
   - Supabase does this automatically
   - Payments are critical - ensure backups work

---

## SECTION 7: BACKEND COMPONENTS

### What Your Backend Needs to Do

**Authentication:**
- Verify API key is valid
- Get user from api_keys table
- Get subscription from user_subscriptions table

**Rate Limiting:**
- Check period (Sunday for free, 1st for pro)
- Count requests this period
- Reject if over limit

**Payments:**
- Call Razorpay to create order
- Call Razorpay to verify payment
- Update Supabase on success

**Webhooks:**
- Receive events from Razorpay
- Verify signature
- Update Supabase subscription
- Reset rate limit counter on renewal

**Cron Jobs:**
- Check for expired subscriptions (hourly)
- Downgrade expired users to free
- Send reminder emails

---

## SECTION 8: FRONTEND COMPONENTS

### What Your Frontend Needs to Do

**Pricing Page:**
- Show three tiers: Free, Pro, Enterprise
- Free: "Go to Dashboard" button
- Pro: "Upgrade to Pro" button (Rs. 7/month)
- Enterprise: "Contact Us" button

**Payment Modal:**
- Open when user clicks "Upgrade"
- Load Razorpay checkout
- Show payment form
- Handle success/error

**Dashboard:**
- Show current tier
- Show API key (with copy button)
- Show rate limit info:
  - Requests used this period
  - Requests remaining
  - When it resets
- Show raw URL option

**Settings Page:**
- Manage subscription
- Cancel subscription (downgrade to free)
- View payment history
- Change payment method

---

## SECTION 9: EXTERNAL INTEGRATIONS

### Razorpay

**What Razorpay Does:**
- Processes card payments
- Handles UPI payments
- Manages subscriptions
- Auto-charges every month
- Sends webhooks on events

**What You Don't Need to Do:**
- Don't build payment form
- Don't handle PCI compliance
- Don't store credit card details
- Don't manage billing cycles

**What You Must Do:**
- Create plans in Razorpay dashboard
- Set up webhook URL
- Keep secrets safe (.env file)
- Verify signatures on webhooks

### Supabase

**What Supabase Does:**
- Stores all data
- Provides API access
- Handles authentication
- Manages backups
- Provides admin dashboard

**What You Don't Need to Do:**
- Don't set up database server
- Don't manage database backups
- Don't handle scaling

**What You Must Do:**
- Create tables
- Set up Row-Level Security
- Create indexes for performance
- Monitor usage (it's metered)

---

## SECTION 10: ERROR SCENARIOS

### User Hits Rate Limit

```
User makes 16th request (free tier, limit is 15)
    ↓
System returns HTTP 429
    ↓
Error message:
{
  "error": "Rate limit exceeded",
  "tier": "free",
  "limit": 15,
  "period": "week",
  "used": 15,
  "remaining": 0,
  "resetDate": "2024-07-21T00:00:00Z",
  "upgradeUrl": "/pricing#pro"
}
    ↓
User sees in code/app:
"You've used 15/15 requests this week"
"Upgrade to Pro for 2000/month"
"Resets Sunday July 21"
    ↓
Clear, helpful message
```

---

### Payment Fails

```
User tries to pay
    ↓
Payment fails (insufficient funds, etc.)
    ↓
Razorpay returns error
    ↓
Modal closes
    ↓
Frontend shows:
"Payment failed: [reason]"
"Try another card or method"
    ↓
Backend inserts transaction:
- status: 'failed'
- error_message: exact reason
    ↓
User can try again
```

---

### Webhook Fails/Delays

```
Razorpay sends webhook
    ↓
Backend is down, doesn't receive it
    ↓
Razorpay retries (3 times total)
    ↓
If still no success:
- Subscription not updated
- User not charged
- User still has access (old period)
    ↓
Solution: Cron job runs every hour
    ↓
Cron checks Razorpay:
- Are there any updated subscriptions?
- That we haven't synced to Supabase?
    ↓
Cron updates Supabase
    ↓
Sync complete, even if webhook failed
```

---

## SECTION 11: DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│  Pricing Page ─→ Upgrade Button ─→ Razorpay Modal (Payment)    │
│       ↓                                          ↓               │
│   Dashboard                                  Dashboard           │
│   (shows API key)                            (Pro tier now)      │
└─────────────────────────────────────────────────────────────────┘
              ↓                                    ↑
              │                                    │
              v                                    │
┌─────────────────────────────────────────────────────────────────┐
│                   YOUR BACKEND API                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Check Rate Limit (Middleware)                              │
│     ↓                                                            │
│     Get API key from request                                   │
│     Query Supabase: api_keys → get tier                        │
│     Query Supabase: user_subscriptions → get dates             │
│     Query Supabase: rate_limit_usage → count requests          │
│     ↓                                                            │
│     If over limit → Return 429                                 │
│     If OK → Continue to step 2                                 │
│                                                                  │
│  2. Execute User's Request                                     │
│                                                                  │
│  3. Record Usage (Middleware)                                  │
│     ↓                                                            │
│     Update Supabase: rate_limit_usage                          │
│     Increment request_count                                    │
│     Log request in request_logs                                │
│                                                                  │
│  4. Handle Payments (When user upgrades)                       │
│     ↓                                                            │
│     POST /payment/create-order                                 │
│     Call Razorpay API → Get order_id                           │
│     Return to frontend                                         │
│                                                                  │
│  5. Verify Payment (After checkout)                            │
│     ↓                                                            │
│     POST /payment/verify                                       │
│     Verify signature (security)                                │
│     Update Supabase: user_subscriptions ← insert new sub       │
│     Update Supabase: api_keys ← update tier to 'pro'           │
│     Update Supabase: rate_limit_usage ← create new period      │
│     Insert payment transaction                                 │
│                                                                  │
│  6. Handle Webhooks (From Razorpay)                            │
│     ↓                                                            │
│     POST /webhooks/razorpay                                    │
│     Verify signature (security)                                │
│     If renewal: Update Supabase: user_subscriptions            │
│     If renewal: Create new rate_limit_usage                    │
│     If renewal: Send email                                     │
│                                                                  │
│  7. Cron Jobs (Run periodically)                               │
│     ↓                                                            │
│     Every hour: Check for expired subscriptions                │
│     Downgrade expired users to free                            │
│     Reset rate limits to free tier                             │
│     Send notification emails                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
              ↓                                    ↑
              │                                    │
              v                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tables:                                                         │
│  ├─ api_keys          (with tier, subscription_id)             │
│  ├─ user_subscriptions (subscription data)                     │
│  ├─ rate_limit_usage  (request counting)                       │
│  ├─ payment_transactions (audit trail)                         │
│  └─ request_logs      (optional analytics)                     │
│                                                                  │
│  All queries READ & WRITE from backend                         │
│  (Never directly from frontend)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
              ↓
              │ (For payment processing)
              v
┌─────────────────────────────────────────────────────────────────┐
│                    RAZORPAY PAYMENTS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks Upgrade                                         │
│     Backend → Razorpay: Create Order                           │
│     Razorpay → Frontend: order_id, keyId                       │
│                                                                  │
│  2. User completes payment                                      │
│     Razorpay → Frontend: payment_id, signature                 │
│     Frontend → Backend: Verify                                 │
│     Backend → Razorpay: Verify signature                       │
│                                                                  │
│  3. Monthly auto-renewal                                        │
│     Razorpay → Backend: Webhook                                │
│     Backend: Verify and process                                │
│                                                                  │
│  Razorpay handles:                                              │
│  - Credit card processing                                       │
│  - UPI payments                                                 │
│  - Subscription management                                      │
│  - Auto-charging                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## SECTION 12: TIMELINE & PHASES

### Phase 1: Preparation (1-2 hours)
- Sign up for Razorpay (if not done)
- Get Razorpay API keys
- Create Razorpay plan for Pro tier
- Set up webhook URL in Razorpay
- Create Supabase tables
- Add columns to api_keys table

### Phase 2: Backend Implementation (8-12 hours)
- Set up Supabase client in backend
- Create middleware: checkRateLimit
- Create middleware: recordUsage
- Create API endpoints:
  - POST /payment/create-order
  - POST /payment/verify
  - GET /subscription/current
  - POST /subscription/upgrade
  - POST /subscription/cancel
  - GET /subscription/usage
  - GET /rate-limit/status
  - POST /webhooks/razorpay
- Set up cron job for subscription checks
- Add error handling throughout

### Phase 3: Frontend Implementation (6-8 hours)
- Create PaymentModal component
- Integrate Razorpay checkout
- Create ApiKeyDisplay component
- Create RawUrlIntegration documentation
- Create subscription management page
- Update pricing page with payment buttons

### Phase 4: Integration & Testing (6-10 hours)
- Test free tier limiting (15/week)
- Test pro tier limiting (2000/month)
- Test payment flow end-to-end
- Test subscription renewal (simulate)
- Test webhook handling
- Test period reset logic
- Test error scenarios

### Phase 5: Deployment (2-4 hours)
- Deploy backend
- Deploy frontend
- Set up monitoring/alerts
- Test in production
- Document for support

**Total: 25-40 hours** (spread over 2-3 weeks)

---

## SECTION 13: KEY DESIGN DECISIONS

### Why This Architecture?

1. **Supabase for Database:**
   - Managed PostgreSQL
   - Built-in auth
   - Row-level security
   - Real-time capabilities
   - No server management

2. **Razorpay for Payments:**
   - Indian payment processor (you'll need Indian bank account)
   - Handles subscriptions
   - Automatic renewal
   - Webhook notifications
   - PCI compliance handled by them

3. **Rate Limiting in Backend:**
   - Check BEFORE execution (fail-fast)
   - Record AFTER success
   - Using Supabase for truth
   - Can't be bypassed by client

4. **Period-Based Resets:**
   - Free: Sunday (standardized)
   - Pro: 1st of month (simple, aligned with billing)
   - Enterprise: Custom (flexibility)

5. **Webhook + Cron Redundancy:**
   - Webhook for real-time updates
   - Cron job for backup/recovery
   - Ensures reliability

---

## SECTION 14: MONITORING & ALERTS

### What to Monitor

**Payment Health:**
- Payment success rate (should be >95%)
- Failed payments (investigate if >5%)
- Webhook latency (should be <5 seconds)
- Webhook success rate (should be 99%+)

**Rate Limiting:**
- False positives (users hitting limits incorrectly)
- Usage patterns (most users in first/last days?)
- Upgrade rate (% free→pro conversion)

**System Health:**
- Database query performance (track slow queries)
- API response time (should be <100ms)
- Error rates (watch for spikes)

### Alerts to Set Up

- Payment failure rate > 10%
- Webhook failures > 1% (webhook dead)
- Database query > 1 second (performance issue)
- API error rate > 1% (something broken)
- Low disk space on Supabase

---

## SECTION 15: SECURITY CONSIDERATIONS

### What to Keep Secure

1. **Razorpay Secrets:**
   - KEY_ID: Can be in code (public)
   - KEY_SECRET: MUST be in .env (never expose)
   - WEBHOOK_SECRET: MUST be in .env (never expose)

2. **API Keys:**
   - Hash them in database (don't store plain)
   - Treat like passwords
   - User never shares them

3. **Supabase JWT Tokens:**
   - Store in secure cookies (HttpOnly, Secure flags)
   - Include in Authorization headers
   - Don't log them

4. **Signature Verification:**
   - Always verify Razorpay signatures
   - Don't trust webhook data without verification
   - Never skip this step

5. **Database Access:**
   - Use Row-Level Security (RLS) in Supabase
   - Users can only see their own data
   - Backend uses service key (can see all)

---

## SECTION 16: ROLLOUT STRATEGY

### Week 1: Internal Testing
- Deploy to staging environment
- Test with fake Razorpay payments
- Test rate limiting thoroughly
- Find bugs and fix them

### Week 2: Beta Users
- Invite 5-10 beta users
- Use real payments (small amounts)
- Monitor for issues
- Gather feedback

### Week 3: Public Launch
- Deploy to production
- Announce on social media
- Monitor heavily first week
- Respond to support requests quickly

### Ongoing: Operations
- Monitor metrics daily
- Handle support tickets
- Respond to billing issues
- Update documentation

---

## SECTION 17: FUTURE ENHANCEMENTS

### Easy Additions (Later)

1. **Usage Analytics Dashboard:**
   - Show graphs of usage over time
   - Top endpoints used
   - Peak usage times
   - Cost breakdown

2. **Team/Organization Accounts:**
   - Multiple users under one payment
   - Shared rate limits
   - Admin controls

3. **Custom Rate Limits:**
   - For enterprise customers
   - Negotiated per customer
   - Separate tier

4. **Advanced Billing:**
   - Usage-based pricing (pay per request)
   - Multiple billing options
   - Discounts for annual

5. **Integrations:**
   - Slack notifications on upgrades
   - Discord webhooks for events
   - Zapier support

---

**This is your complete plan. No code, just the architecture and flow.**

Everything is ready to build! 🚀

