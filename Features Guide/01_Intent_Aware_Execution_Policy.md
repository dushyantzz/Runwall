# Feature: Intent-Aware Execution Policy Engine

> **Status:** Implemented  
> **Version:** 1.0.0  
> **Module:** `secure_mcp_server.governance`

---

## Why This Feature Exists

### The Problem

Most AI agent security systems today operate on a simple question:

> "Can this user call this tool?"  → Yes / No

This is **Role-Based Access Control (RBAC)** — a binary gate. It treats every tool invocation the same regardless of what the caller actually intends to do with it. Consider these three requests from the same authenticated user:

| Request | Tool | Parameters | Actual Risk |
|---------|------|------------|-------------|
| "Read a Jira issue" | `jira_api` | `{"action": "get", "issue_id": "PROJ-42"}` | **Low** — read-only, single record |
| "Change a Salesforce discount from 10% to 60%" | `salesforce_api` | `{"action": "update", "field": "discount", "value": 60}` | **Medium** — write operation, financial data |
| "Export 20,000 customer records" | `customer_db` | `{"action": "export", "limit": 20000, "format": "csv"}` | **Critical** — bulk export, PII data |

A traditional RBAC system either allows all three or blocks all three. There is no middle ground. In a world where AI agents operate autonomously, this creates an impossible choice:

- **Too permissive:** The agent can do anything, including catastrophic bulk operations.
- **Too restrictive:** The agent can't do its job.

### The Solution

The **Intent-Aware Execution Policy Engine** reasons over the *full context* of every tool invocation:

```
intent + tool + parameters + user identity + resource sensitivity + blast radius
```

Instead of a binary allow/deny, it produces **six different outcomes** based on the risk profile:

| Decision | When Applied | Example |
|----------|-------------|---------|
| **ALLOW** | Low risk, trusted user | Read a Jira issue |
| **LOG_ONLY** | Medium risk, needs audit trail | Modify a configuration value |
| **SIMULATE** | High risk, preview first | Update pricing across 500 products |
| **REQUIRE_APPROVAL** | High risk, needs human sign-off | Export 20,000 customer records |
| **QUARANTINE** | System-wide destructive action | Drop a database table |
| **DENY** | Policy violation | Anonymous user attempting deletion |

---

## What Makes This Unique

### 1. Intent Classification — Not Just Tool Names

Most governance systems match on `tool_name == "dangerous_tool"`. Our engine analyses the **semantic intent** by inspecting:

- **Tool name patterns** — detects verbs like `delete`, `export`, `update`
- **Parameter analysis** — detects PII fields (`ssn`, `email`), wildcard selectors (`*`), large numeric values (`limit: 50000`)
- **Blast radius computation** — classifies impact from `SINGLE_RECORD` to `SYSTEM_WIDE`
- **Resource sensitivity detection** — scans for sensitive data patterns in parameter keys and values

This means the *same tool* can receive different governance decisions depending on *how* it's being used.

### 2. Seven-Factor Risk Scoring

Risk isn't one-dimensional. The engine computes a composite score (0.0 – 1.0) from seven independent factors:

| Factor | Weight | What It Measures |
|--------|--------|------------------|
| Tool sensitivity | 20% | How sensitive the tool itself is (from metadata) |
| Parameter risk | 15% | PII presence, wildcards, large batch sizes |
| User trust | 15% | Role, session age, admin status |
| Resource sensitivity | 20% | Classification of target data |
| Blast radius | 15% | How many records/systems are affected |
| Temporal risk | 5% | Off-hours, weekend access patterns |
| Behavioral anomaly | 10% | Deviation from user's normal patterns |

Weights are **configurable per organization** via environment variables or database settings.

### 3. Firewall-Style Rule Engine

Policy rules follow a **first-match-wins** model (like iptables or AWS Security Groups):

- Rules are priority-ordered (lower number = higher priority)
- Each rule has **conditions** (intent category, risk level, tool pattern, user role, tenant, etc.)
- Each rule maps to a **decision** (allow, deny, require_approval, simulate, log_only, quarantine)
- A **catch-all deny** at the bottom implements Zero Trust

Organizations can add their own rules at any priority level to override defaults.

### 4. Full Explainability

Every single policy decision produces a complete audit trail:

```json
{
  "decision": "require_approval",
  "intent_category": "export",
  "risk_score": 0.78,
  "risk_level": "high",
  "matched_rule": "default-003",
  "explanation": "Rule 'Require approval for bulk exports' (priority 30) matched: Bulk export operations with high or critical risk require manager approval.",
  "evaluation_chain": [
    {"rule_id": "default-001", "matched": false, "reason": "Destructive flag mismatch"},
    {"rule_id": "default-002", "matched": false, "reason": "Risk level 'high' not in {'critical'}"},
    {"rule_id": "default-003", "matched": true, "reason": "All conditions matched"}
  ]
}
```

This means every decision can be **audited, debugged, and explained** to compliance teams — a hard requirement for enterprise deployment.

### 5. Zero Dependencies, Sub-Millisecond Latency

The intent classifier is entirely **deterministic and rule-based** — no LLM calls, no external API dependencies. It runs in the request hot path with sub-millisecond overhead, making it suitable for high-throughput production workloads.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Tool Execution Request                    │
│  (tool_name, parameters, user_context)                      │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  IntentClassifier                                           │
│  ├── Categorizes: READ / WRITE / DELETE / EXPORT / ADMIN    │
│  ├── Detects: destructive, bulk, PII, wildcards             │
│  ├── Computes: blast radius, resource sensitivity           │
│  └── Output: IntentClassification                           │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  RiskScorer                                                 │
│  ├── 7 independent factors × configurable weights           │
│  ├── Weighted arithmetic mean → composite score (0.0–1.0)   │
│  └── Output: RiskScore + RiskLevel                          │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  PolicyEvaluator                                            │
│  ├── Priority-sorted rules (first-match-wins)               │
│  ├── 10 default rules (Zero Trust baseline)                 │
│  ├── Explainability chain for every evaluation              │
│  └── Output: PolicyEvaluationResult                         │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────┐
│  ALLOW  │  DENY  │  APPROVE  │  SIMULATE   │
└──────────────────────────────────────────────┘
```

---

## Files

| File | Purpose |
|------|---------|
| `governance/__init__.py` | Package exports |
| `governance/intent_types.py` | Domain enums and Pydantic value objects |
| `governance/intent_classifier.py` | Deterministic intent classification |
| `governance/risk_scorer.py` | Multi-factor risk computation |
| `governance/policy_evaluator.py` | Rule-based decision engine with defaults |
| `database/models.py` | `PolicyRule` + `PolicyDecisionLog` tables |
| `config.py` | Governance-related settings |
| `tools.py` | Governance pipeline integrated into execution |
| `main.py` | Component initialization |

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `ENABLE_INTENT_POLICY` | `true` | Enable/disable the governance pipeline |
| `DEFAULT_POLICY_ACTION` | `deny` | Decision when no rule matches (Zero Trust) |
| `HIGH_RISK_THRESHOLD` | `0.70` | Score >= this is classified HIGH |
| `CRITICAL_RISK_THRESHOLD` | `0.90` | Score >= this is classified CRITICAL |
| `RISK_SCORE_WEIGHTS` | `null` | Custom factor weights (JSON dict) |

---

## Default Policy Rules

| Priority | Rule | Decision |
|----------|------|----------|
| 10 | Block anonymous destructive actions | DENY |
| 20 | Critical risk → require security approval | REQUIRE_APPROVAL |
| 30 | Bulk exports with high risk → require manager approval | REQUIRE_APPROVAL |
| 40 | System-wide destructive actions → quarantine | QUARANTINE |
| 50 | High-risk writes → simulate first | SIMULATE |
| 60 | Medium-risk actions → enhanced logging | LOG_ONLY |
| 70 | Read operations → allow | ALLOW |
| 80 | Low/negligible risk → allow | ALLOW |
| 90 | Admin users → allow (if not caught above) | ALLOW |
| 1000 | Catch-all → deny (Zero Trust) | DENY |

---

*This feature transforms the Secure MCP Server from a simple tool gateway into a true **Execution Governance Platform** — exactly the market differentiation described in the project blueprint.*
