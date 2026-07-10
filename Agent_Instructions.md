You are a principal engineer and product architect building a production-ready enterprise platform called an AI Agent Execution Governance Platform.

## Core product thesis
This product is NOT a generic “secure MCP server.”
It is an execution governance layer that sits between AI model reasoning and real-world tool execution.

Its purpose is to let enterprises safely allow AI agents to use tools, APIs, internal systems, and MCP servers by enforcing:
- authentication
- authorization
- policy evaluation
- runtime risk scoring
- approval workflows
- taint/untrusted-context tracking
- tool trust and provenance verification
- auditability
- rollback / compensating actions
- observability
- multi-tenant governance

The product must work first as an MCP/tool gateway, and then as a broader agent execution control plane.

## Product goals
Build a production-ready platform that:
1. intercepts all agent tool calls before execution
2. evaluates them against real policy-backed controls
3. determines allow / deny / require-approval / simulate / delay / step-up-auth
4. tracks whether the action was influenced by untrusted context
5. records a complete evidence trail for compliance and forensics
6. supports reversible or compensating workflows where possible
7. provides enterprise-grade identity, tenancy, auditing, quotas, and operational controls
8. exposes a polished UI for security teams, platform teams, and developers
9. provides a marketing website and self-serve onboarding flow

## Non-goals
Do NOT build a toy MCP demo.
Do NOT use hardcoded admin logins, in-memory auth state, mock governance, format-only API key validation, or IP-only in-memory rate limiting as production behavior.
Do NOT use placeholder data in production code paths.
Do NOT hide incomplete features behind fake success responses.

## Mandatory architectural principle
Separate the system into:
- Control Plane: configuration, policies, identity, tenancy, approvals, dashboards, audit views
- Data Plane / Enforcement Layer: low-latency runtime interception of tool calls and MCP actions
- Event Plane: append-only event/audit stream, analytics, replay, notifications, evidence

## Recommended stack
Default stack:
- Backend language: Python 3.12
- API framework: FastAPI
- Validation: Pydantic v2
- ORM: SQLAlchemy 2.x
- Migrations: Alembic
- Primary DB: PostgreSQL 16+
- Cache / distributed locks / rate limiting / token revocation: Redis 7+
- Workflow orchestration for approvals and compensating actions: Temporal
- Policy engine: OPA (Open Policy Agent) with Rego policies
- Event bus: NATS JetStream or Kafka (prefer NATS for simpler initial ops)
- Background workers: Temporal workers + async job workers
- Observability: OpenTelemetry + Prometheus + Grafana + Loki
- Audit/event storage: PostgreSQL first, optional ClickHouse for large-scale analytics
- Frontend: Next.js + TypeScript + React + Tailwind + shadcn/ui
- Auth/SSO: OIDC/SAML via WorkOS, Auth0, or Keycloak abstraction
- Relationship/permission modeling: Postgres + policy engine first; OpenFGA optional later
- Secrets: Vault or cloud secret manager abstraction
- Packaging: Docker + Helm
- Infra: Kubernetes + Terraform
- Docs: OpenAPI + developer docs site
- Testing: pytest + httpx + Playwright + contract tests + load tests
- Security scanning: SAST, dependency scanning, IaC scanning, container scanning

## Required product modules
Build these modules:

1. Identity and Access Control
2. Tenant and Organization Management
3. Tool / MCP Registry
4. Policy Engine
5. Runtime Interceptor / Gateway
6. Risk Scoring Engine
7. Taint Tracking Engine
8. Approval Workflow Engine
9. Audit / Evidence / Replay System
10. Rollback / Compensating Action Framework
11. Quotas / Budgets / Rate Limits
12. Sandboxing and Execution Profiles
13. Admin Console / Security Console / Developer Console
14. Public Marketing Website + Docs + Self-serve onboarding

## Replace all demo controls with enterprise policy-backed controls

### A. Replace hardcoded demo admin login
Implement:
- organization, user, role, membership, service-account, session tables
- OIDC and SAML SSO
- local password login optional for self-hosted and dev, disabled by default in cloud prod
- password hashing via Argon2id or bcrypt with secure parameters
- MFA / step-up auth support
- SCIM provisioning
- just-in-time user provisioning
- session management with revocation
- bootstrap admin only through secure setup flow or migration-based bootstrap token, never hardcoded credentials

### B. Replace in-memory token state
Implement:
- short-lived access tokens
- rotating refresh tokens
- JTI-based token revocation
- hashed refresh token storage
- session table with device / IP / user-agent metadata
- token introspection endpoint for internal services
- Redis-backed revocation cache
- absolute and idle session expiry
- service-to-service auth using signed client credentials or workload identity
- audit events for login, logout, refresh, revoke, lockout, step-up auth

### C. Replace format-based API key validation
Implement:
- API keys with generated prefix + secret format
- one-time reveal
- hashed secret storage
- scopes per key
- tenant binding
- expiration and rotation
- last used timestamps
- optional IP allowlists
- optional environment binding
- service account ownership
- emergency revoke
- key usage anomaly alerts
- no acceptance of a key simply because it matches a string prefix

### D. Replace in-memory IP-based rate limiting
Implement distributed quotas using Redis:
- per tenant
- per user
- per service account
- per tool
- per tool category
- per MCP server
- per workflow
- burst and sustained windows
- concurrency limits
- budget limits
- token usage limits
- approval queue limits
- adaptive throttling when risk increases
- consistent behavior across multiple replicas

### E. Replace mock admin/governance
Implement real controls:
- policy CRUD with versioning
- approval policies
- evidence retention settings
- org-wide security settings
- tenant-specific connectors and secrets
- audit event explorer
- decision logs
- risk dashboard
- session explorer
- tool inventory
- trust / provenance dashboard
- incident timeline
- replay view
- approvals inbox
- maintenance mode
- revoke sessions
- quarantine a tool or connector
- emergency policy override with reason logging

## Core domain model
Design normalized schemas for:
- organizations
- tenants
- users
- memberships
- roles
- permissions
- service_accounts
- api_keys
- sessions
- token_revocations
- connectors
- tools
- tool_versions
- tool_manifests
- mcp_servers
- tool_signatures
- tool_hashes
- trust_policies
- execution_policies
- approval_policies
- runtime_requests
- runtime_decisions
- taint_sources
- taint_edges
- evidence_records
- audit_events
- approval_requests
- approval_actions
- workflow_runs
- compensation_plans
- quotas
- budget_rules
- alerts
- incidents

Each entity should include:
- id (UUID/ULID)
- tenant_id where applicable
- created_at
- updated_at
- created_by / updated_by when meaningful
- soft delete fields where needed
- version fields for optimistic locking where needed

## Runtime decision pipeline
Every tool or MCP action must go through this ordered pipeline:

1. authenticate caller
2. resolve tenant, agent identity, end-user identity, delegated identity
3. load tool metadata and trust state
4. normalize action request into a canonical execution request
5. attach context labels:
   - source of instruction
   - source of retrieved data
   - source of tool descriptions
   - source of prior tool outputs
6. taint analysis
7. policy evaluation
8. risk scoring
9. budget/quota checks
10. approval policy evaluation
11. allow / deny / require_approval / simulate / redact / step_up_auth / delay
12. execute through connector or sandbox
13. collect outputs and post-execution scan
14. write audit + evidence + decision logs
15. trigger compensating action plan if needed
16. update metrics, alerts, and replay state

## Canonical execution request format
Define a canonical internal model:
- request_id
- tenant_id
- workflow_id
- run_id
- agent_id
- user_id
- delegated_principal
- tool_id
- tool_version
- action_name
- resource_type
- resource_id
- environment
- arguments
- normalized_arguments
- source_labels
- taint_labels
- risk_features
- policy_inputs
- approval_requirement
- decision
- decision_reason
- simulation_result
- execution_result
- evidence_refs

All connectors and MCP tools must map into this canonical request.

## Mandatory differentiating features
These are strategic features and must be designed as first-class systems, not side notes:

1. Intent-aware execution policy
2. Taint tracking for agent actions
3. Reversible execution / compensating controls
4. Tool trust and provenance
5. Low-friction approval workflows
6. Optional task contract planning before execution

## Intent-aware execution policy
The platform must understand not only who is calling which tool, but what the action means.
Examples:
- reading a ticket is low risk
- exporting 50k CRM contacts is high risk
- deleting a production branch is high risk
- changing billing settings is critical risk
- sending 1 email is low risk; sending 5,000 external emails is high risk

Build:
- policy conditions on tool + action + argument patterns + resource sensitivity + blast radius + time + user role + taint + destination
- policy outcomes: allow, deny, require_approval, simulate, redact, require_step_up, require_secondary_confirmation
- support dry-run decision evaluation for debugging

## Taint tracking engine
Track whether an action was influenced by untrusted context.
Untrusted sources include:
- web pages
- emails
- Slack messages
- uploaded documents
- retrieved RAG chunks
- MCP tool descriptions from third parties
- prior tool outputs from untrusted tools

Requirements:
- label all inbound data with provenance and trust level
- propagate taint through prompts, summaries, plans, and tool arguments
- allow policies like:
  - if tainted context influences write action on critical system, require approval
  - if tainted context influences credential access, block
  - if tainted context influences data export, require two-person approval

## Reversible execution / compensating controls
Whenever possible, actions should be:
- simulated before commit
- staged
- queued
- reversible
- or paired with compensating actions

Implement:
- action classes: read, write, delete, export, send, execute, mutate-config
- reversibility metadata per tool/action
- compensation handler registry
- approval before irreversible actions
- rollback window configuration
- pre-execution snapshot where feasible
- outbox pattern for external side effects

## Tool trust and provenance
Treat tools and MCP servers as security principals.
Implement:
- tool registry
- manifest hashing
- signature verification
- version pinning
- description hashing
- tool description drift detection
- approval required for trust-state changes
- risk scoring for tools
- quarantine mode
- change history
- provenance labels for every execution

Detect:
- tool poisoning
- tool shadowing
- unauthorized manifest changes
- environment drift
- trust downgrade events

## Low-friction approvals
Avoid “approve every action.”
Implement risk-based approval:
- low risk: auto-allow
- medium risk: single click approval
- high risk: step-up auth + approver
- critical risk: two-person rule + reason + expiry

Approval requests must include:
- plain-language summary
- affected systems
- affected records or estimated blast radius
- why this is risky
- whether tainted inputs influenced it
- rollback availability
- links to evidence and prior similar approvals

Support:
- Slack/email/web approvals later via adapters
- delegated approvers
- policy-based approver routing
- expiring approvals
- approval bundles for repetitive low-variance actions

## Optional task contract
Before a multi-step workflow runs, the agent can submit a task contract:
- intended goal
- expected tools
- expected resource classes
- expected max write count
- max spend
- rollback capability
- confidence
- taint expectations

The system can pre-approve the contract, then enforce within its boundaries.

## Connector and tool architecture
Create an abstraction for:
- MCP tools
- REST APIs
- databases
- SaaS apps
- shell/CLI tasks in sandbox
- web automation adapters

Each connector must expose:
- action schema
- resource schema
- sensitivity metadata
- reversibility metadata
- sandbox requirements
- approval hints
- compensation hooks
- audit rendering templates

## Policy system
Use OPA/Rego and define policy bundles for:
- authz
- risk thresholds
- approvals
- taint rules
- quotas
- tool trust
- environment segmentation
- retention rules

Provide:
- policy versioning
- staged rollout
- simulation mode
- test fixtures
- “why allowed/denied” explanation
- UI editing for common rules
- GitOps sync for advanced teams

## API design
Expose APIs for:
- auth
- organizations and tenants
- users and service accounts
- API keys and sessions
- connectors and tools
- policy management
- runtime execution interception
- approval requests and actions
- audit search
- risk events
- trust events
- quotas and budgets
- incidents
- replays
- exports

Use:
- REST for control plane
- websocket or SSE for live dashboards
- internal event stream for analytics
- OpenAPI with explicit schemas and error contracts

## UI requirements
Build 3 main app surfaces:

### 1. Security Console
For CISOs / security engineers:
- risk dashboard
- policy dashboard
- incident timeline
- audit explorer
- taint and provenance explorer
- tool trust state
- approval statistics
- high-risk action feed

### 2. Platform Console
For platform / infra teams:
- connector inventory
- environment separation
- quotas and budgets
- reliability metrics
- workflow control
- sandbox policies
- deployment and key status
- rollback registry

### 3. Developer Console
For developers:
- tool registration
- MCP server onboarding
- policy simulation
- request traces
- test playground
- SDK tokens
- connector docs
- audit trace for a specific action

## Public website requirements
Build a marketing site with these pages:
- Homepage
- Platform overview
- MCP security / agent execution governance page
- Product features
- Integrations
- Security / Trust Center
- Docs
- Pricing
- Demo / Contact Sales
- Open source / GitHub page
- Blog / research
- Case study template

Website messaging:
Headline:
“Control what AI agents can do, not just what they can say.”

Subheadline:
“Runtime governance for AI agents, MCP tools, and enterprise actions — with policy enforcement, approvals, provenance tracking, and audit-ready evidence.”

CTAs:
- Start free
- Book demo
- Read docs
- Deploy open source proxy

## UX principles
- plain language before raw JSON
- every deny/approval must explain why
- every action should show provenance and blast radius
- every risk badge must be traceable
- security workflows should be fast, not bureaucratic
- developer onboarding should take minutes, not weeks

## Production readiness requirements
Enforce:
- structured errors
- idempotency keys
- optimistic locking where needed
- distributed locking for sensitive workflows
- retry policies with dead-letter handling
- secure secret handling
- zero trust between services
- least privilege everywhere
- tenant isolation
- encryption in transit and at rest
- PII minimization in logs
- signed audit records or tamper-evident chain option
- backup and restore strategy
- disaster recovery planning
- SLOs and error budgets
- feature flags
- canary policy rollout
- audit retention policies

## Testing requirements
Build:
- unit tests
- integration tests
- end-to-end tests
- property-based tests for policy edge cases
- replay tests for audit/event consistency
- taint propagation tests
- approval workflow tests
- compensation / rollback tests
- load tests for interception path
- chaos tests for Redis / DB / workflow outages
- migration tests
- contract tests for connectors
- security tests including auth bypass, scope escalation, injection, replay, race conditions

## Step-by-step implementation phases

### Phase 1: Foundations
- clean architecture
- config system
- DB schema
- migrations
- auth
- tenancy
- service accounts
- API keys
- sessions
- Redis
- OTel
- audit event model

### Phase 2: Tool and MCP Gateway
- tool registry
- MCP onboarding
- canonical execution request
- interceptor
- basic policy engine
- per-tool authz
- distributed quotas
- real audit logs

### Phase 3: Risk and Approvals
- risk scoring
- approval engine
- approval inbox UI
- simulated execution
- task contracts
- budget controls

### Phase 4: Taint and Provenance
- provenance labels
- taint graph
- taint-aware policy rules
- trust registry
- manifest hashing
- description drift detection
- quarantine workflow

### Phase 5: Reversibility and Enterprise Ops
- compensation registry
- rollback windows
- evidence bundles
- incident views
- trust center
- pricing/billing hooks
- self-serve onboarding

### Phase 6: Hardening
- scale testing
- multi-region readiness
- HA plans
- DR drills
- formal security review
- compliance mapping
- docs polish
- upgrade paths

## Output format for your work
When implementing:
1. propose architecture
2. define schema
3. generate code module by module
4. generate migrations
5. generate tests
6. generate docs
7. explain tradeoffs
8. never skip production hardening notes
9. if a feature is incomplete, mark it clearly and do not fake readiness

## Final instruction
Build this like a real enterprise product that could be sold to companies and reviewed by security teams, not a hackathon project.
