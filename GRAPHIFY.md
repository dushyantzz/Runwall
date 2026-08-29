# Runwall Repository Knowledge Graph

## Overview

**Runwall** is the Zero-Trust Execution Governance Platform for AI Agents - an intelligent security gateway that sits between AI reasoning models and real-world tools, databases, and environments.

**Repository Type:** Full-stack AI governance platform  
**Primary Language:** Python (backend) + TypeScript/React (frontend)  
**Architecture:** Monorepo with backend and frontend components

---

## Repository Structure

```
Runwall/
├── secure_mcp_server/       # Main Python backend (FastAPI + FastMCP)
│   ├── main.py             # Server entry point, SecureMCPServer class
│   ├── tools.py            # ToolRegistry - core tool execution with governance
│   ├── auth.py             # Authentication (JWT, API Keys)
│   ├── security.py         # Security manager (input sanitization, rate limiting)
│   ├── config.py           # Pydantic Settings configuration
│   ├── context.py          # Context management for sessions
│   ├── monitoring.py       # Metrics collection
│   ├── database/           # SQLAlchemy models
│   │   └── models.py       # All database schemas
│   ├── governance/         # Core governance engine
│   │   ├── __init__.py     # Exports all governance components
│   │   ├── intent_classifier.py  # Deterministic intent analysis
│   │   ├── risk_scorer.py       # Risk scoring across 7 factors
│   │   ├── policy_evaluator.py  # Base policy evaluator
│   │   ├── opa_evaluator.py     # OPA/Rego policy evaluation
│   │   ├── taint.py             # Taint tracking for prompt injection defense
│   │   ├── quota_manager.py     # Rate limiting & quotas
│   │   ├── approvals.py         # Async approval workflow
│   │   ├── contracts.py         # Task contracts
│   │   ├── compensation.py      # Reversible execution
│   │   ├── trust.py             # Tool trust & provenance
│   │   └── intent_types.py      # Type definitions (IntentCategory, RiskLevel, etc.)
│   ├── api/                # REST API routes
│   │   ├── app.py          # FastAPI app with auth middleware
│   │   ├── schemas.py      # Request/response schemas
│   │   └── routes/         # CRUD endpoints
│   │       ├── audit.py        # Audit logs
│   │       ├── policies.py     # Policy management
│   │       ├── approvals.py    # Approval workflow
│   │       ├── dashboard.py    # Metrics & monitoring
│   │       └── payment.py      # Billing integration
│   ├── connectors/         # Tool connectors
│   │   ├── base.py          # Base connector class
│   │   ├── registry.py      # Connector registry
│   │   ├── database.py      # Database connector
│   │   ├── rest_api.py      # REST API connector
│   │   ├── shell.py         # Shell connector (sandboxed)
│   │   └── __init__.py
│   ├── admin/              # Admin tools
│   │   └── tools.py
│   ├── billing/            # Billing system
│   │   ├── rate_limiter.py # Rate limiting with tier tracking
│   │   └── cron.py        # Subscription cron jobs
│   └── policies/           # Default policy files (Rego)
├── mcp-package/            # MCP stdio bridge package
│   └── index.js           # Node.js bridge for Claude Desktop
├── frontend/               # React/TypeScript frontend dashboard
│   ├── src/
│   │   ├── App.tsx          # Main app with BrowserRouter
│   │   ├── main.tsx         # Entry point
│   │   ├── components/      # UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── FeaturePageTemplate.tsx
│   │   │   ├── PlaygroundConsole.tsx
│   │   │   └── SubscriptionCard.tsx
│   │   ├── pages/           # Route pages
│   │   │   └── features/   # Feature documentation pages
│   │   ├── hooks/           # React hooks
│   │   └── layout/         # App layout
│   └── package.json
├── tests/                  # Test suite
│   ├── conftest.py
│   └── test_runwall_features.py
├── docker-compose.yml      # Docker compose for dev
├── Dockerfile             # Container definition
├── requirements.txt       # Python dependencies
├── fastmcp.yaml          # MCP server config
├── .env                  # Environment variables
└── README.md             # Project documentation
```

---

## Core Components

### 1. Governance Engine (`secure_mcp_server/governance/`)

The heart of Runwall - an intent-aware execution policy engine.

**Key Modules:**

| Module | Purpose | Key Classes |
|--------|---------|-------------|
| `intent_classifier.py` | Deterministic intent analysis | `IntentClassifier`, pattern registries |
| `risk_scorer.py` | Risk scoring across 7 factors | `RiskScorer`, `RiskScore`, `RiskLevel` |
| `policy_evaluator.py` | Base policy evaluation | `PolicyEvaluator`, `PolicyDecisionType` |
| `opa_evaluator.py` | Rego/OPA policy evaluation | `OPAPolicyEvaluator`, `OPAPolicyResult` |
| `taint.py` | Taint tracking for prompt injection | `TaintManager`, `TaintLabel` |
| `quota_manager.py` | Rate limiting & quotas | `QuotaManager`, `QuotaExceededError` |
| `approvals.py` | Async approval workflow | `ApprovalManager` |
| `contracts.py` | Task contracts | `ContractManager` |
| `compensation.py` | Reversible execution | `CompensationRegistry` |
| `trust.py` | Tool trust verification | `ToolTrustManager` |
| `intent_types.py` | Type definitions | `IntentCategory`, `BlastRadius`, `ResourceSensitivity`, etc. |

**Intent Categories:**
- `READ` - Data retrieval operations
- `WRITE` - Data modification operations
- `DELETE` - Destructive operations
- `EXPORT` - Data export operations
- `EXECUTE` - Code/shell execution
- `ADMIN` - Administrative operations
- `CONFIGURE` - Configuration changes

**Risk Levels:**
- `negligible` (0.0-0.3)
- `low` (0.3-0.5)
- `medium` (0.5-0.7)
- `high` (0.7-0.9)
- `critical` (0.9-1.0)

### 2. Tool Execution Pipeline (`tools.py`)

`ToolRegistry` class handles the complete tool execution pipeline:

```
validate_tool_exists → check_permissions → rate_limit → sanitize
→ classify_intent → score_risk → evaluate_policy
→ [execute | block | queue_for_approval]
```

Each execution generates a "Runwall Shield" markdown card showing:
- Identity Verification
- Multi-tenant Routing
- Tool Trust Verification
- Rate Limits & Quotas
- Taint Analysis
- Risk Scoring
- OPA Policy Evaluation

### 3. Authentication (`auth.py`)

**Dual Token Architecture:**
- Short-lived JWT access tokens (default 30 min)
- Long-lived refresh tokens (default 7 days)

**API Key Format:** `mcp_abc123...` (SHA-256 hashed in database)

**Key Features:**
- Session management with JTIs (JSON Token IDs)
- Global blacklist for instant revocation
- IP address tracking
- MFA support

### 4. Database Models (`database/models.py`)

**Core Models:**

| Model | Purpose |
|-------|---------|
| `User` | User accounts with RBAC |
| `Session` | Active sessions with taint labels |
| `TokenRevocation` | JWT token revocation |
| `ContextItem` | Session context storage |
| `Tool` | Tool definitions with permissions |
| `ToolExecution` | Execution history audit logs |
| `ServiceAccount` | Machine-to-machine identities |
| `APIKey` | API keys with tier/subscription |
| `UserPermission` | Fine-grained permissions |
| `AuditLog` | Immutable audit trail |
| `PolicyRule` | Versioned policy rules |
| `PolicyDecisionLog` | Policy decision history |
| `Tenant` | Multi-tenancy support |
| `ReversibleExecutionLog` | Compensating action logs |
| `ToolManifest` | Tool code signature hashes |
| `ApprovalRequest` | Async approval workflow |
| `TaskContract` | Mini-sandbox for batch operations |
| `PolicyBundle` | OPA/Rego policy bundles |
| `UserSubscription` | Razorpay subscription data |
| `RateLimitUsage` | Billing period tracking |
| `PaymentTransaction` | Audit trail of payments |

### 5. Connectors (`connectors/`)

**Available Connectors:**
- `DatabaseConnector` - Postgres/MySQL SQL tools (auto-generated `sql_query`, `sql_execute`)
- `RestAPIConnector` - HTTP endpoint tools (auto-generated from OpenAPI spec)
- `ShellConnector` - Sandboxed bash/powershell execution

All connectors inherit taint tracking, risk scoring, and rate limits automatically.

### 6. REST API (`api/`)

**Endpoints (all require authentication):**

| Prefix | Routes | Purpose |
|--------|--------|---------|
| `/api/v1/policies` | CRUD | Policy management |
| `/api/v1/approvals` | CRUD | Approval workflow |
| `/api/v1/audit` | GET/POST | Audit logs |
| `/api/v1/dashboard` | GET | Metrics & monitoring |
| `/api/v1` | Various | Billing, subscriptions |

**API App Features:**
- ASGI middleware for API key authentication
- CORS support
- OpenAPI/Swagger docs at `/docs` (admin only)
- Health check at `/health`

### 7. Frontend (`frontend/`)

**Tech Stack:** React, TypeScript, Vite, React Router

**Key Pages:**
- Dashboard with metrics visualization
- Policy management UI
- Approval workflow interface
- Audit logs viewer

**MCP Bridge (`mcp-package/index.js`):**
Node.js stdio bridge that forwards Claude Desktop requests to remote Runwall endpoint via Streamable HTTP transport.

---

## Configuration

**Environment Variables (`.env`):**

| Variable | Purpose | Default |
|----------|---------|---------|
| `SECRET_KEY` | JWT signing | (change in production) |
| `DATABASE_URL` | PostgreSQL connection | Supabase connection |
| `REDIS_URL` | Redis for distributed quotas | optional |
| `ADMIN_USERNAME` | Admin login | "admin" |
| `ADMIN_PASSWORD` | Admin password | "admin123" |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry | 30 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiry | 7 |
| `ENABLE_INTENT_POLICY` | Enable governance | true |
| `HIGH_RISK_THRESHOLD` | High risk score | 0.70 |
| `CRITICAL_RISK_THRESHOLD` | Critical risk score | 0.90 |
| `RAZORPAY_*` | Payment integration | for billing |

---

## Key Files

### Backend Entry Points
- `secure_mcp_server/main.py` - `SecureMCPServer` class, server startup
- `secure_mcp_server/tools.py` - `ToolRegistry`, execution pipeline
- `secure_mcp_server/auth.py` - `AuthManager`, JWT/API key auth
- `secure_mcp_server/api/app.py` - FastAPI app factory

### Governance Core
- `secure_mcp_server/governance/intent_classifier.py` - Pattern-based intent analysis
- `secure_mcp_server/governance/risk_scorer.py` - 7-factor risk scoring
- `secure_mcp_server/governance/taint.py` - Prompt injection defense
- `secure_mcp_server/governance/opa_evaluator.py` - Rego policy evaluation

### Database
- `secure_mcp_server/database/models.py` - All SQLAlchemy models

### Connectors
- `secure_mcp_server/connectors/database.py` - SQL connector
- `secure_mcp_server/connectors/rest_api.py` - HTTP connector
- `secure_mcp_server/connectors/shell.py` - Sandboxed shell

---

## Data Flow

1. **Tool Request** → Auth middleware validates API key/JWT
2. **Rate Limiting** → Quota manager checks tenant/user/tool limits
3. **Intent Classification** → Pattern matching on tool name + parameters
4. **Risk Scoring** → 7-factor analysis (tool, parameter, user, resource, blast radius, temporal, behavioral)
5. **Taint Check** → Block if tainted session + sink tool
6. **Policy Evaluation** → OPA/Rego rules, possibly require approval
7. **Execution** → Run tool, log results
8. **Post-Execution** → Update taints, log reversible actions

---

## Important Relationships

- `Tool` → `ToolExecution` (one-to-many)
- `Session` → `ToolExecution` (one-to-many)
- `PolicyRule` → `PolicyDecisionLog` (one-to-many)
- `ApprovalRequest` → `TaskContract` (one-to-many)
- `APIKey` → `RateLimitUsage` (one-to-many)
- `ToolManifest` → Tool trust verification

---

## Development

**Python Dependencies (requirements.txt):**
- fastapi, fastmcp, uvicorn, sqlalchemy, pydantic
- httpx (MCP client), structlog, psutil

**Node.js Dependencies (frontend/package.json):**
- react, react-router-dom, vite
- Various UI libraries

**Docker Deployment:**
```bash
docker run -d -p 8000:8000 \
  -e SECRET_KEY=... \
  -e DATABASE_URL=... \
  dushyantzz/secure-mcp-server:latest
```

---

## External References

- **Hosted Endpoint:** `https://mcp.runwall.in/mcp`
- **Quickstart:** `https://mcp.runwall.in/`
- **NPM Package:** `npx -y @runwall/mcp` (MCP stdio bridge)
- **Admin Docs:** `https://mcp.runwall.in/docs` (Admin credentials required)