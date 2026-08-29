# Runwall MCP Public Endpoint — Implementation Guide

**Handoff document for: Antigravity**
**Prepared for: Runwall backend (`dushyantzz/Runwall`, deployed on Render, domain `mcp.runwall.in`)**
**Goal:** Expose a public, API-key-gated MCP endpoint at `https://mcp.runwall.in/mcp` with a quickstart page at `https://mcp.runwall.in/`, where access level is enforced by the user's plan (Free / Pro / Enterprise) stored in Supabase. **No request to the MCP endpoint should succeed without a valid, active API key — there is no anonymous or trial-without-key path.**

---

## 1. Current State (confirmed)

- Backend: FastAPI (async), deployed on Render as a Docker web service.
- Domain `mcp.runwall.in` is live via CNAME → `runwall.onrender.com`, SSL verified.
- `/health` route exists and returns 200. This is the **only** route that should ever respond without an API key — it must not leak any account, usage, or billing information.
- **Database is Supabase Postgres — this is the only database in use.** There is no separate personal/local database; do not create or fall back to SQLite anywhere in this work. Every table (`user_subscriptions`, `api_keys`, everything else) lives in this same Supabase project.
- `user_subscriptions` bug (missing table at runtime) must be fixed against this Supabase instance specifically — confirm the migration actually ran against Supabase and that `DATABASE_URL` on Render points at the Supabase connection string, not a local fallback.
- **`api_keys` table already exists in Supabase.** Do not recreate it — inspect its current schema first and adapt Section 3 below to match what's already there rather than issuing a conflicting migration. If its columns differ from what's listed below, extend/alter rather than replace.
- Previous deployment lived on Manufact.com (trial-based host, now expired/down). Part of this task is migrating everything that lived there — users, existing API keys, subscription records, any config/secrets — over to the Supabase + Render setup so nothing is lost or duplicated.

---

## 2. Migration From Manufact.com (do this first)

Before building anything new, account for what needs to move over:

1. **Export existing data from Manufact.com if the platform/database is still reachable at all** — user records, any existing API keys, subscription/billing state. If Manufact's own database is already gone (trial expired), check whether you have any backups, exports, or whether the data was already being written to Supabase directly (in which case there's nothing to migrate — just re-point traffic).
2. **Reconcile against what's already in Supabase.** Since `api_keys` already exists there, determine whether Manufact was writing to this same Supabase project (likely, if `api_keys` is already populated) or to its own separate store. If it's the former, this is a traffic cutover, not a data migration.
3. **Cut over DNS/traffic only** (most likely scenario): since Supabase already holds the real data, the actual "migration" is simply retiring the Manufact.com deployment and making sure `mcp.runwall.in` → Render → Supabase is the only live path. Confirm no lingering references (webhooks, redirect URLs, OAuth callback URLs, Razorpay webhook endpoints) still point at the old Manufact.com URL.
4. **Audit for orphaned or duplicate API keys** — if both Manufact and any earlier Render deployment were issuing keys against the same `api_keys` table, check for duplicates or keys tied to a now-dead deployment's hashing scheme, and revoke anything that shouldn't still be valid.

---

## 3. Target Architecture

Two distinct surfaces on the same domain:

| Route | Purpose | Auth |
|---|---|---|
| `GET https://mcp.runwall.in/` | Human-facing quickstart page (HTML) — sign-up/API key instructions, example config | None (public — this page explains how to get a key, it does not grant any access itself) |
| `POST/GET https://mcp.runwall.in/mcp` | Actual MCP transport endpoint (Streamable HTTP per MCP spec) that agents/clients connect to | **Required, no exceptions:** `Authorization: Bearer <api_key>` |
| `POST https://mcp.runwall.in/api/keys` | Issue a new API key for an authenticated dashboard user | Session/JWT (existing dashboard auth) |
| `GET https://mcp.runwall.in/api/keys` | List a user's active keys | Session/JWT |
| `DELETE https://mcp.runwall.in/api/keys/{key_id}` | Revoke a key | Session/JWT |

**Hard rule:** `/mcp` must reject every request that lacks a valid `Authorization` header before any other logic runs — no default free-tier fallback for missing keys, no "demo mode." If the header is absent or the key doesn't resolve to an active row in Supabase, the request stops at the auth layer with a 401. This should be the very first check in the request pipeline, ahead of routing to any MCP protocol logic.

Request flow for `/mcp`:

```
Client request → Extract Bearer token
             → If header missing entirely → 401 immediately, do not proceed
             → Look up api_keys row in Supabase by hashed key
             → If not found/revoked → 401
             → Join to user_subscriptions (Supabase) → get plan tier + status
             → If subscription status != 'active' → 402/403
             → Apply tier-based rate limiter
             → If within limits → forward to existing MCP handler/proxy logic
             → If over limit → 429 with Retry-After header
```

---

## 4. Data Model (Supabase — existing tables, extend not replace)

### `api_keys` (already exists in Supabase — inspect before touching)

Expected/required columns for this design to work — reconcile with what's actually there:

| Column | Type | Notes |
|---|---|---|
| `id` | UUID/int, PK | Existing model uses Integer or UUID |
| `user_id` | UUID/int, FK → users | |
| `key_hash` | text, unique | SHA-256 hash only — confirm raw keys were never stored |
| `prefix` / `key_prefix` | text | First 8 chars of raw key, for dashboard identification |
| `label` / `name` | text, nullable | e.g. "Cursor - laptop" |
| `created_at` | timestamptz | |
| `last_used_at` / `last_used` | timestamptz, nullable | Update on each successful auth |
| `revoked_at` | timestamptz, nullable | Null = active, or is_active=False |

### `user_subscriptions` (fix the existing runtime bug against Supabase)

Minimum columns needed for gating: `user_id`, `tier` (`free` | `pro` | `enterprise`), `status` (`active` | `past_due` | `canceled`), `current_period_end`. Confirm the migration that creates this table has actually been applied to the live Supabase project.

---

## 5. Plan Tiers — Full Definitions

Each tier below should be treated as production configuration, not a placeholder — defined once, centrally, and referenced everywhere (rate limiter, dashboard UI, quickstart docs, billing) so they can never drift out of sync with each other.

```python
# secure_mcp_server/config/plan_limits.py
PLAN_LIMITS = {
    "free": {
        "requests_per_minute": 10,
        "max_tool_calls_per_day": 200,
        "max_api_keys": 1,
        "concurrent_connections": 1,
        "policy_engine_features": "basic",   # OPA default policies only
        "semantic_risk_scoring": False,       # LLM-based risk scoring disabled
        "support": "community (GitHub issues only)",
        "sla": None,
    },
    "pro": {
        "requests_per_minute": 60,
        "max_tool_calls_per_day": 10_000,
        "max_api_keys": 5,
        "concurrent_connections": 5,
        "policy_engine_features": "custom OPA policies",
        "semantic_risk_scoring": True,
        "support": "email, target 24h response",
        "sla": None,
    },
    "enterprise": {
        "requests_per_minute": None,          # negotiated / effectively unmetered, still guarded by abuse limits
        "max_tool_calls_per_day": None,        # negotiated per contract
        "max_api_keys": None,                  # unlimited, managed by org admin
        "concurrent_connections": None,
        "policy_engine_features": "custom OPA policies + multi-tenant isolation",
        "semantic_risk_scoring": True,
        "support": "dedicated channel / priority response",
        "sla": "custom, per contract",
    },
}
```

**Why each tier is shaped this way:**

- **Free** exists to let a developer evaluate Runwall with zero friction once they have a key — it is deliberately capped tightly (10 req/min, 200 calls/day, 1 key) so it's useful for testing an integration but not viable as a production dependency. Semantic risk scoring (the LLM-based layer) is Pro+ only since it costs real inference spend per call.
- **Pro** is the default paid tier for a single developer or small team running Runwall in production against their own agent stack. Limits are generous enough for real usage (10k tool calls/day covers most individual or small-team workloads) while still bounding infra cost predictably. Multiple keys (5) support using Runwall across several projects/environments without needing Enterprise.
- **Enterprise** removes hard numeric caps in favor of contractual/negotiated limits, because these customers need guarantees (SLA, dedicated support, multi-tenant isolation). Treat "unlimited" as "not rate-limited by the same mechanism as Free/Pro" with an abuse ceiling.

**Enforcement notes:**
- `max_api_keys` should be checked at key-creation time (`POST /api/keys`), not just at request time — reject creating extra keys beyond the tier limit with a clear error `key_limit_reached`.
- `requests_per_minute: None` and `max_tool_calls_per_day: None` for Enterprise should be interpreted in code as "skip this specific check".

---

## 6. Plan-Tier Enforcement Logic

Keep each responsibility as a separate, testable unit:

1. `resolve_api_key(raw_key: str) -> ApiKeyRecord | None` — hashes input, looks up the `api_keys` table. Pure lookup, updates `last_used`. Returns `None` on not-found/revoked.
2. `resolve_plan(user_id: Any, api_key: Any, db: AsyncSession) -> PlanContext` — fetches `user_subscriptions` row from DB, returns tier + status. **Fails loudly** (raises typed exception `SubscriptionRecordMissing`, not a silent fallback) if key belongs to user without subscription row.
3. `enforce_rate_limit(plan: PlanContext, key_id: Any) -> None` — raises typed `RateLimitExceeded` if over threshold, using numbers straight from `PLAN_LIMITS`. Skip check entirely for tiers where limit is `None`. Sliding-window or bucket counter with memory/redis fallback.
4. Fast ASGI/FastAPI layer composing these three, guarding `/mcp`, `/sse`, `/messages` and short-circuiting at the very first failure before any tool/protocol code.

---

## 7. Error Contract

| Condition | Status | Body |
|---|---|---|
| Missing/malformed `Authorization` header | 401 | `{"error": "missing_api_key"}` |
| Key not found or revoked | 401 | `{"error": "invalid_api_key"}` |
| Valid key, but no matching subscription row (data bug) | 500 | `{"error": "subscription_record_missing"}` |
| Subscription not active (lapsed/canceled) | 402 | `{"error": "subscription_inactive"}` |
| Rate limit exceeded | 429 | `{"error": "rate_limit_exceeded", "retry_after": <seconds>}` + `Retry-After` header |
| Daily tool-call cap hit | 429 | `{"error": "daily_limit_exceeded"}` |
| Max API keys reached on `POST /api/keys` | 400 | `{"error": "key_limit_reached", "limit": <n>}` |

---

## 8. Quickstart Page Content (`GET /`) — and Documentation Update

- Update root `GET /` to serve a modern, premium HTML page.
- Explain Runwall MCP endpoint, upfront statement on required API key, plan tiers, copyable client config, curl tests.
- Scrub any stale references to `manufact.com` across the codebase and docs.

---

## 9. Security Checklist

- CORS on `/mcp` and `/api/keys` restricted.
- Raw API keys never logged anywhere.
- `/mcp` rejects any unauthenticated request without executing MCP logic.
- Rate limiting runs before expensive logic.
- `/api/keys` endpoints require dashboard session auth (JWT).
- Key revocation takes effect immediately.
- `.env` and `.git` non-servable.
