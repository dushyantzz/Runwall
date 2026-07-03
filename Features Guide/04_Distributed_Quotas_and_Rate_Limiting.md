# Distributed Quotas & Rate Limiting

## Overview

The Distributed Quotas and Rate Limiting module replaces rudimentary, memory-only IP-based rate limiting with a multi-dimensional, scalable quota engine designed for enterprise readiness.

## Why it is Implemented

Uncapped API execution, especially within an LLM or AI-agent context, can rapidly exhaust API budgets or overwhelm internal backend systems.
Traditional IP rate limits are easily bypassed via proxies. This system enforces limits on:
1. **Tenants**: Hard limits on usage per organization.
2. **Users & Service Accounts**: Prevents individual noisy neighbors from exhausting a tenant's overall pool.
3. **Tools**: Specialized limits per tool (e.g., highly sensitive internal APIs vs. public data lookups).

## Why it is Unique & Production Ready

### 1. Abstract Storage Layer (Redis-Ready)
The `QuotaManager` is designed with an interface that supports connecting directly to a distributed Redis backend for cluster-wide quota synchronization (using commands like `ZREMRANGEBYSCORE` and `ZADD`). It includes an asynchronous in-memory fallback mechanism to ensure seamless execution in single-instance deployments or local development.

### 2. Multi-Dimensional Tracking
A single request correctly decrements quotas across multiple independent limits simultaneously (Tenant, User/ServiceAccount, and Tool dimensions). This allows a tenant to be allocated 10,000 requests/hour while capping each user within that tenant to 1,000 requests/hour.

### 3. Adaptive Throttling (Risk-Aware)
Unlike standard API gateways, this quota manager integrates directly with the platform's execution Governance Engine (`RiskScorer`). If the Governance Engine classifies a request's risk context as `HIGH` (score >= 0.70), the quota manager dynamically and instantly throttles the actor, multiplying their maximum capacity limits by `0.5` (halving them) to contain potential blast radius.

### 4. Zero-Downtime Sliding Window
Traditional fixed windows create bursts at the top of the minute. This uses a sub-second precision sliding window algorithm that tracks individual request timestamps over the trailing N seconds.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Governance Engine (tools.py)                │
│  ├── Classifies Intent                                      │
│  ├── Computes Risk Score (e.g. 0.8 / High)                  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  QuotaManager (quota_manager.py)                            │
│  ├── check_quotas(tenant, user, tool, risk)                 │
│  ├── Applies adaptive throttle multiplier (e.g. x0.5)       │
│  └── Decrements multi-dimensional sliding windows           │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Storage Backend                                            │
│  ├── [Production] Redis Sorted Sets (ZADD/ZREMRANGEBYSCORE) │
│  └── [Development] Async Thread-Safe In-Memory Arrays       │
└─────────────────────────────────────────────────────────────┘
```

1. **Configuration (`config.py`)**: Defines baseline limits for `default_tenant_rpm`, `default_user_rpm`, `default_service_account_rpm`, and `default_tool_rpm`.
2. **QuotaManager (`quota_manager.py`)**: Evaluates limits against the state, raising `QuotaExceededError` on violations.
3. **Integration (`tools.py`)**: Intercepts executions *before* execution but *after* intent/risk evaluation to feed risk data into the throttling module.
