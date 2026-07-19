# RUNWALL PAYMENT & RATE LIMITING SYSTEM
## Complete Plan & Flow Document
### Supabase + Razorpay Integration

---

## 📄 DOCUMENTS CREATED FOR YOU

### 1. **runwall_plan_and_flow_supabase.md** (Main Document - 50+ pages)
   - Complete system overview
   - Detailed database structure (5 tables with all fields)
   - All user journey flows (6 main flows)
   - Razorpay payment flow (4 steps)
   - Rate limiting logic (period-based reset)
   - Complete error scenarios
   - Data flow diagrams
   - Timeline & phases
   - Design decisions
   - Monitoring & alerts setup
   - Security considerations
   - Rollout strategy
   - Future enhancements

### 2. **runwall_visual_quick_reference.md** (Visual Guide)
   - Architecture diagrams
   - Supabase table structures
   - Tier comparison table
   - Simplified flow diagrams (all key flows)
   - Setup checklists (3 parts)
   - Testing checklist
   - Monitoring dashboard
   - API response examples
   - Environment variables template
   - Troubleshooting guide
   - Implementation order (5 weeks)

---

## 🎯 QUICK SUMMARY

### What You're Building

A **three-tier subscription system** with automatic rate limiting:

```
FREE TIER
├─ Price: $0/month
├─ Requests: 15 per week (Sunday-Sunday reset)
├─ RPM: 60 requests per minute
└─ No payment needed

PRO TIER
├─ Price: Rs. 7/month (700 paise)
├─ Requests: 2000 per month (1st-1st reset)
├─ RPM: 500 requests per minute
└─ Auto-renews monthly

ENTERPRISE
├─ Price: Custom (contact sales)
├─ Requests: Unlimited
├─ RPM: Unlimited
└─ Custom terms
```

---

## 🗄️ DATABASE: 5 SUPABASE TABLES

### Table 1: `api_keys` (Extend existing)
- Add: `tier`, `subscription_id`, `subscription_status`, `subscription_end_date`, `rate_limit_requests`, `rate_limit_period`

### Table 2: `user_subscriptions` (New)
- Stores: Razorpay subscription data, billing dates, auto-renew status

### Table 3: `rate_limit_usage` (New)
- Tracks: Request count per period, remaining requests, last used time

### Table 4: `payment_transactions` (New)
- Audit trail: All payments, amounts, status, payment methods

### Table 5: `request_logs` (Optional)
- Analytics: Every API call logged with endpoint, status, tier

---

## 🔄 6 MAIN USER FLOWS

### Flow 1: Free Tier User
User signs up → Gets free API key → Makes 15 requests/week → 16th gets 429 error → Sees "Upgrade to Pro"

### Flow 2: Free → Pro Upgrade
User clicks upgrade → Razorpay modal opens → User pays Rs. 7 → Backend verifies → Tier changes to Pro → Dashboard updates

### Flow 3: Auto-Renewal
Day 30 arrives → Razorpay auto-charges → Webhook sent → Backend updates subscription → Period resets → User gets 2000 more requests

### Flow 4: Rate Limit Check (Every API Call)
Request arrives → System checks tier → Calculates current period → Counts requests → If over limit, return 429 → Otherwise allow

### Flow 5: Auto-Downgrade on Expiry
Day 31 of expired subscription → Cron job runs → Finds expired subs → Downgrades to free → Resets rate limit to 15/week → Sends email

### Flow 6: Direct HTTPS/Raw URL
User gets direct URL with token → Authenticates via token → Rate limiting applied automatically → Works for Claude Code clients

---

## 💳 RAZORPAY PAYMENT FLOW (4 Steps)

### Step 1: Create Order
Frontend sends "upgrade" → Backend calls Razorpay → Razorpay creates order → Returns order_id + key_id

### Step 2: Checkout Modal
Frontend opens Razorpay modal → User enters card/UPI → Razorpay processes payment

### Step 3: Verify Payment
Razorpay returns payment_id → Frontend sends to backend → Backend verifies signature → Updates Supabase → Changes tier to Pro

### Step 4: Webhook (Auto-Renewal)
Every 30 days: Razorpay charges again → Sends webhook → Backend verifies signature → Updates subscription dates → Resets counter

---

## ⏱️ RATE LIMITING LOGIC

### For FREE TIER (15 requests/week)
```
Period: Sunday 00:00 → Sunday 23:59
Every week resets on Sunday
User can make 15 requests
16th request returns 429 error
Clear message: "You've used 15/15. Reset Sunday July 21"
```

### For PRO TIER (2000 requests/month)
```
Period: 1st of month 00:00 → 1st of next month 23:59
Every month resets on 1st
User can make 2000 requests
2001st request returns 429 error
Clear message: "You've used 2000/2000. Reset August 1"
```

### For ENTERPRISE
```
Custom period dates from subscription
User can make unlimited requests
No 429 errors
Custom SLA
```

### How Rate Check Works
1. User makes API call with API key
2. System extracts key from header
3. System queries api_keys table → gets tier
4. System calculates current period based on tier
5. System queries rate_limit_usage → gets request count
6. System compares: count >= limit?
7. If YES → Return 429 (block request)
8. If NO → Allow request → After success, increment counter

---

## 🔧 BACKEND COMPONENTS (8 Things to Build)

### 1. Middleware: checkRateLimit
- Runs BEFORE every API call
- Checks: Is this user over their limit?
- Returns: 429 if yes, allows if no

### 2. Middleware: recordUsage
- Runs AFTER every successful API call
- Increments: request_count++
- Decrements: requests_remaining--

### 3. POST /api/v1/payment/create-order
- Input: tier (pro/enterprise)
- Calls Razorpay API
- Returns: order_id, amount, key_id
- Frontend uses this to open checkout

### 4. POST /api/v1/payment/verify
- Input: payment_id, order_id, signature
- Verifies signature (security)
- Updates Supabase: Creates subscription + Updates tier
- Returns: Success + new API key

### 5. GET /api/v1/subscription/current
- Returns: Current tier, period dates, remaining requests

### 6. POST /api/v1/subscription/upgrade
- Initiates upgrade from free to pro
- Returns: Order to complete payment

### 7. POST /api/v1/subscription/cancel
- Downgrades user to free
- Cancels subscription

### 8. POST /api/v1/webhooks/razorpay
- Receives events from Razorpay
- Verifies signature
- Updates database on renewal

### 9. Cron Job (hourly)
- Checks for expired subscriptions
- Downgrades expired users to free
- Sends notification emails

---

## 🎨 FRONTEND COMPONENTS (3 Things to Build)

### 1. PaymentModal
- Opens when user clicks "Upgrade to Pro"
- Loads Razorpay checkout
- Handles payment success/failure

### 2. ApiKeyDisplay
- Shows API key (masked, copy button)
- Shows current tier
- Shows rate limit progress bar
- Shows requests used / remaining
- Shows reset date

### 3. SubscriptionSettings
- View current subscription
- Cancel subscription (downgrade to free)
- View payment history
- Update payment method

---

## 📋 SETUP CHECKLIST (3 Parts)

### Part 1: Razorpay
- [ ] Create Razorpay account
- [ ] Get Key ID and Key Secret
- [ ] Create Pro plan: 700 paise, monthly
- [ ] Set webhook URL: /api/v1/webhooks/razorpay
- [ ] Get Webhook Secret
- [ ] Save all to .env file

### Part 2: Supabase
- [ ] Create user_subscriptions table
- [ ] Create rate_limit_usage table
- [ ] Create payment_transactions table
- [ ] Add 6 columns to api_keys table
- [ ] Set up Row-Level Security (RLS)
- [ ] Create indexes for performance

### Part 3: Backend
- [ ] Install Razorpay SDK
- [ ] Create checkRateLimit middleware
- [ ] Create recordUsage middleware
- [ ] Create 8 API endpoints
- [ ] Create webhook handler
- [ ] Create cron job
- [ ] Add error handling

---

## 🧪 TESTING CHECKLIST (3 Categories)

### Rate Limiting Tests
- [ ] Free tier: 15 requests work, 16th blocked
- [ ] Pro tier: 2000 requests work, 2001st blocked
- [ ] Free resets every Sunday
- [ ] Pro resets on 1st of month
- [ ] RPM limits working (60 for free, 500 for pro)

### Payment Tests
- [ ] Upgrade flow works end-to-end
- [ ] Test card 4111111111111111 → success
- [ ] Test card 4000000000000002 → failure
- [ ] Signature verification validates
- [ ] Tier updates after payment
- [ ] Email sent on success

### Webhook Tests
- [ ] Webhook received and verified
- [ ] Auto-renewal works
- [ ] Period dates update
- [ ] Counter resets
- [ ] Retry logic works if failed

---

## 📊 MONITORING (What to Watch)

### Daily Metrics
- Payment success rate (target: >95%)
- Webhook delivery time (target: <5 seconds)
- API response time (target: <100ms)
- Database query time (target: <100ms)
- Error rate (target: <1%)

### Monthly Metrics
- Free→Pro conversion rate
- Subscription retention rate
- Customer lifetime value
- Revenue per user
- Churn rate

### Alerts to Set
- Payment failures > 10%
- Webhooks failing > 1%
- API errors > 1%
- Database slow queries
- Low disk space

---

## 🛡️ SECURITY (What to Keep Secret)

### 🔐 MUST Keep in .env (Never expose)
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET
- SUPABASE_SERVICE_ROLE_KEY

### ✅ Safe to Expose in Code
- RAZORPAY_KEY_ID (public)
- SUPABASE_ANON_KEY (public)

### 🔒 Security Practices
- Always verify Razorpay signatures
- Hash API keys in database
- Use HTTPS only for raw URLs
- Implement Row-Level Security in Supabase
- Log all payments for audit trail

---

## 📈 IMPLEMENTATION TIMELINE

### Week 1: Database & Razorpay
- Razorpay account setup & keys
- Supabase table creation
- Razorpay plan & webhook setup
- Database indexes & security

### Week 2: Backend Core
- Rate limit middleware
- Usage recording
- Payment endpoints
- Webhook handler
- Cron job

### Week 3: Remaining Backend
- Subscription endpoints (GET current, POST upgrade, POST cancel, GET usage)
- Rate limit status endpoint

### Week 4: Frontend
- PaymentModal component
- Razorpay checkout integration
- ApiKeyDisplay component
- Subscription settings page

### Week 5: Testing & Launch
- Integration testing
- Staging deployment
- Production deployment
- Monitoring setup

**Total: 25-30 days**

---

## 💡 KEY DESIGN DECISIONS

### Why Supabase?
- Managed PostgreSQL (no server management)
- Built-in authentication
- Row-Level Security for data isolation
- Real-time capabilities
- Automatic backups

### Why Razorpay?
- Indian payment processor (you need Indian bank account)
- Handles subscriptions automatically
- Auto-renewal built-in
- Webhook notifications
- PCI compliance handled by them

### Why Backend Rate Limiting?
- Can't be bypassed by client
- Check BEFORE execution (fail-fast)
- Record AFTER success
- Single source of truth

### Why Period-Based Reset?
- Free: Sunday (standardized, easy to understand)
- Pro: 1st of month (aligns with billing cycle)
- Enterprise: Custom (flexibility)

### Why Webhook + Cron?
- Webhook for real-time updates
- Cron job as backup/recovery
- If webhook fails, cron catches it
- Ensures reliability

---

## 🚀 SUCCESS INDICATORS

You'll know it's working when:

✅ Free user can make 15 API calls, 16th returns 429  
✅ Pro upgrade button works → Razorpay opens → Payment succeeds → Tier changes  
✅ Pro user can make 2000 calls, 2001st returns 429  
✅ Rate limits reset on correct dates (Sunday for free, 1st for pro)  
✅ Dashboard shows tier and remaining requests  
✅ Subscription auto-renews every 30 days  
✅ Expired subscription auto-downgrades to free  
✅ Webhook events logged and processed  
✅ Email notifications sent on subscription events  
✅ Error messages are clear and helpful  

---

## 📚 DOCUMENT STRUCTURE

```
All documents are in: /mnt/user-data/outputs/

1. runwall_plan_and_flow_supabase.md
   └─ Main comprehensive plan (17 sections, 50+ pages)
   
2. runwall_visual_quick_reference.md
   └─ Visual guide with diagrams (14 sections)
   
3. RUNWALL_PAYMENT_SYSTEM_COMPLETE_SUMMARY.md
   └─ This file (quick overview)
```

---

## 🎯 NEXT STEPS

### Immediate (Today)
1. Read both documents
2. Set up Razorpay account
3. Get Razorpay API keys
4. Create Razorpay plan (700 paise, monthly)

### This Week
1. Create Supabase tables
2. Set Razorpay webhook
3. Create indexes in Supabase
4. Set up .env file

### Next Week
1. Build backend components (middleware, endpoints, cron)
2. Test each component individually
3. Test end-to-end flow

### Week After
1. Build frontend components
2. Integrate everything
3. Comprehensive testing
4. Deploy to production

---

## ❓ FAQ

### Q: Do I need PostgreSQL separately?
A: No, Supabase includes PostgreSQL

### Q: Do I need to handle PCI compliance?
A: No, Razorpay handles it

### Q: What if user's payment fails?
A: They stay on free tier, can retry

### Q: What if webhook fails?
A: Cron job runs every hour and catches up

### Q: Can users bypass rate limits?
A: No, checking happens in backend before execution

### Q: What if user downgrades during a period?
A: They get new rate limit, old period discarded

### Q: How do I handle failed renewals?
A: Webhook will retry 3 times, cron catches any gaps

### Q: Can I have different pricing?
A: Yes, modify TIER_CONFIG and Razorpay plans

### Q: How do I handle refunds?
A: Razorpay dashboard or API, manually update Supabase

### Q: Can users have multiple API keys?
A: Yes, each key has its own tier and usage tracking

---

## 🎓 WHAT YOU HAVE

### ✅ Complete Architecture Design
- 5 Supabase tables fully specified
- All fields documented
- Relationships explained

### ✅ Detailed User Flows
- 6 main flows with step-by-step breakdown
- Payment flow with all decision points
- Rate limit check logic
- Auto-renewal and expiry flows

### ✅ Implementation Guidance
- 9 backend components to build
- 3 frontend components to build
- 1 cron job to create
- Complete checklist for setup

### ✅ Testing Plan
- Rate limiting tests
- Payment tests
- Webhook tests
- Error scenario tests

### ✅ Monitoring Setup
- Metrics to track
- Alerts to set
- Dashboard metrics

### ✅ Security Practices
- What to keep secret
- Signature verification
- Row-level security
- Data isolation

### ✅ Timeline & Phases
- 5-week implementation plan
- Clear milestones
- Realistic time estimates

---

## 🔗 HOW EVERYTHING CONNECTS

```
User Browser
    ↓
Pricing Page (Free/Pro/Enterprise)
    ↓
Click "Upgrade to Pro"
    ↓
PaymentModal Opens
    ↓
Razorpay Checkout (User enters payment)
    ↓
Payment Succeeds/Fails
    ↓
Backend Verifies Signature
    ↓
Supabase Updated (tier=pro, subscription created)
    ↓
Email Sent to User
    ↓
Dashboard Shows Pro Tier
    ↓
User Makes API Calls
    ↓
Rate Limit Middleware Checks (2000/month)
    ↓
Usage Recorded in Supabase
    ↓
Day 30 Arrives
    ↓
Razorpay Auto-Charges
    ↓
Webhook Sent to Backend
    ↓
Backend Verifies & Updates
    ↓
Period Resets (0/2000)
    ↓
User Continues with Full Quota
```

---

## ✨ YOU'RE READY

Everything is documented:
- ✅ Database design (no ambiguity)
- ✅ User flows (no confusion)
- ✅ Backend logic (clear requirements)
- ✅ Frontend components (straightforward)
- ✅ Testing procedures (comprehensive)
- ✅ Deployment steps (actionable)
- ✅ Monitoring setup (metrics defined)

**No code. Just the plan. Ready to build.** 🚀

---

**Created:** July 19, 2026
**Status:** Complete Plan & Flow Documentation
**Tech Stack:** Supabase + Razorpay + Your Choice of Backend/Frontend

