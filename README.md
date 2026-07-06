<h1 align="center">Runwall</h1>

<p align="center">
  <strong>The Zero-Trust Execution Governance Platform for AI Agents</strong>
</p>

<p align="center">
  An intelligent security gateway that sits between AI reasoning models and real-world tools, databases, and environments.
</p>

<p align="center">
  <a href="https://github.com/dushyantzz/Runwall"><img src="https://img.shields.io/github/stars/dushyantzz/Runwall?style=for-the-badge&color=FFDA62&logo=github" alt="Github Stars" /></a>
  <a href="https://github.com/dushyantzz/Runwall/blob/main/LICENSE"><img src="https://img.shields.io/github/license/dushyantzz/Runwall?style=for-the-badge" alt="License" /></a>
</p>

<p align="center">
  <img src="Images/ChatGPT%20Image%20Jul%205,%202026,%2002_08_18%20PM.png" width="900" alt="Runwall Architecture" />
</p>

---

## Table of Contents

1. [Why Runwall?](#-why-runwall)
2. [High-Level Architecture](#-high-level-architecture)
3. [Core Features](#-core-features)
4. [Key Workflows (Diagrams)](#-key-workflows)
5. [Quick Start](#-quick-start)
6. [Client Integration](#-client-integration)
7. [Custom Agent Integration (Python)](#-custom-agent-integration-python)
8. [REST API & Dashboard](#-rest-api--dashboard)
9. [License & Support](#-license--support)

---

## 🌟 Why Runwall?

Everyone is wiring AI agents into production systems — Jira, Salesforce, internal databases, cloud providers, shell terminals — usually via protocols like the **Model Context Protocol (MCP)**. Unprotected, these connections behave like unlocked servers:

| Risk | Description |
|---|---|
| **Infinite Loop Risk** | A minor agent logic bug can trigger thousands of API calls in minutes, burning your budget. |
| **Prompt Injection Threat** | A malicious instruction hidden in a webpage or document can hijack your agent into destructive actions (e.g. *"delete all users"*). |
| **The Trust Gap** | Binary tool permissions can't express nuance — "read one record" and "bulk export the database" look identical to a naive ACL. |

Runwall closes this gap with **intent-aware, risk-scored, policy-driven execution control.**

---

## 🏗️ High-Level Architecture

Runwall is deployed as a governance layer between your AI client (Claude Desktop, Cursor, VS Code/Cline, or a custom agent) and your actual tools/connectors.

```mermaid
flowchart TB
    subgraph Clients["🤖 AI Clients"]
        A1[Claude Desktop]
        A2[Cursor / VS Code / Cline]
        A3[Custom Agent<br/>LangChain / CrewAI / AutoGPT]
    end

    subgraph Aegis["🛡️ Runwall Gateway"]
        direction TB
        Auth[Identity & Session Mgmt<br/>JWT + API Keys]
        Policy[Intent-Aware Policy Engine]
        Rate[Distributed Quotas &<br/>Rate Limiting]
        Taint[Taint Tracking Engine]
        Trust[Tool Trust & Provenance]
        Approval[Async Approval Workflow]
        Contracts[Task Contracts]
        OPA[OPA / Rego<br/>Policy-as-Code]
        Admin[Admin & Governance<br/>Controls]
        REST[REST API Control Plane]
    end

    subgraph Tools["🔌 Connectors & Tools"]
        T1[REST API Connector]
        T2[Database Connector<br/>Postgres / MySQL]
        T3[Shell Connector<br/>sandboxed bash/powershell]
        T4[Reversible Execution<br/>Compensation Handlers]
    end

    A1 & A2 & A3 -->|MCP tool call| Auth
    Auth --> Policy
    Policy <--> OPA
    Policy --> Taint
    Policy --> Rate
    Policy --> Trust
    Policy -->|high risk| Approval
    Policy -->|multi-step job| Contracts
    Policy -->|approved| Tools
    Admin -.manages.-> Policy
    Admin -.reviews.-> Approval
    REST -.exposes.-> Admin
    Tools --> T4
```

---

## 🛠️ Core Features

### 1. Intent-Aware Execution Policy Engine
Reads the **semantic intent** of an agent's action, not just whether it has raw tool access. Actions are classified (`read`, `write`, `delete`, `export`) and scored `0.0` (safe) → `1.0` (dangerous). A single record read is auto-allowed; a bulk export triggers human approval.

### 2. Enterprise Identity & Session Management
Database-backed identity tracking per organization and user. Uses a **dual-token architecture**: short-lived JWT access tokens + long-lived refresh tokens, secured with bcrypt hashing, plus a global JTI blacklist for instant session revocation.

```
Authorization: Bearer <JWT_access_token>
```

### 3. Enterprise API Key Management
Machine-friendly credentials for service accounts, cron jobs, and event-driven agents. Keys are 32-byte tokens prefixed `mcp_`, shown once, and stored only as a SHA-256 hash. Keys can be scoped per environment and locked to CIDR IP allowlists.

```
Authorization: Bearer mcp_abc123...[secret_hash_key]
```

### 4. Distributed Quotas & Rate Limiting
Multi-dimensional limiter tracking **tenant**, **user**, and **tool**-level quotas simultaneously. **Adaptive throttling** halves the rate limit automatically when a session's risk score exceeds `0.7`. Backed by Redis for distributed clusters.

### 5. Admin & Governance Controls
Exposed as secure Admin MCP Tools / REST APIs:
- `manage_policy` — create, update, soft-delete rules
- `explore_audit_logs` — query historical tool usage
- `get_decision_logs` — inspect the exact evaluation chain behind an allow/deny decision

### 6. Taint Tracking Engine
The core defense against prompt injection. Reading tools (e.g. `fetch_webpage`) are **taint sources** — running them labels the session (e.g. `EXTERNAL_WEB`). Writing tools (e.g. `execute_sql`) are **taint sinks**. Any sink call is blocked while an untrusted taint label is active on the session.

### 7. Reversible Execution & Compensating Controls
An automated "undo" registry pairing mutating tools with rollback handlers.

```python
@tool(is_reversible=True, compensation_handler="rollback_create_user")
async def create_user(username: str):
    ...
```
Admins can later call `rollback_action(execution_id="rev-abc123")` to invoke the compensation handler with the original arguments.

### 8. Tool Trust & Provenance
Cryptographically hashes tool source code and descriptions at boot. Unauthorized code edits flip a tool's state to **QUARANTINED**, blocking execution until an admin calls `approve_tool_trust_state(tool_name)`.

### 9. Low-Friction Asynchronous Approval Workflow Engine
High-risk actions don't fail — they pause. The agent receives an `approval_id`, a human reviews it (dashboard or REST), and once approved the agent calls `execute_approved_action(approval_id)` to complete execution.

### 10. Optional Task Contracts
Upfront sandboxed boundaries for multi-step jobs, avoiding "approval fatigue." An agent declares a goal, expected tools, write limits, and a spend cap once; subsequent calls within those bounds skip individual policy checks.

```json
{
  "goal": "Refactor authentication module",
  "expected_tools": ["read_file", "write_file", "git_commit"],
  "max_writes": 12,
  "max_spend": 25.0
}
```

### 11. Connector & Tool Architecture
Point Runwall at a database URL or OpenAPI spec and it auto-generates fully governed MCP tools:
- **RestAPIConnector** — turns HTTP endpoints into tools
- **DatabaseConnector** — generates `sql_query` / `sql_execute` for Postgres/MySQL
- **ShellConnector** — sandboxed bash/powershell execution

All generated tools automatically inherit taint tracking, risk scoring, and rate limits.

### 12. OPA / Rego Policy System (Policy-as-Code)
Version-controlled, GitOps-friendly policy files written in Rego, evaluated via the OPA binary or an in-memory fallback. Supports **Simulation Mode** — dry-run new rules against live traffic without affecting agent behavior.

```rego
package execution.governance
deny[msg] {
    input.intent.intent_category == "delete"
    input.user_context.role != "admin"
    msg := "Only administrators can perform delete operations."
}
```

### 13. REST API Control Plane
A FastAPI server exposing full CRUD endpoints and Swagger docs, powering dashboards and monitoring integrations at `http://localhost:8000/docs`.

---

## 🔁 Key Workflows

### A. Standard Request Evaluation Flow

Every tool call — regardless of client — passes through the same governance pipeline.

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant Aegis as Runwall Gateway
    participant Policy as Policy Engine (+ OPA)
    participant Tool as Target Tool/Connector

    Agent->>Aegis: tools/call (name, arguments)
    Aegis->>Aegis: Authenticate (JWT / API Key)
    Aegis->>Aegis: Check quotas & rate limits
    Aegis->>Policy: Evaluate intent + risk score
    Policy->>Policy: Check taint labels on session
    alt Risk low & session clean
        Policy-->>Aegis: ALLOW
        Aegis->>Tool: Execute
        Tool-->>Agent: Result
    else Risk high or destructive
        Policy-->>Aegis: REQUIRE_APPROVAL
        Aegis-->>Agent: approval_id (paused)
    else Session tainted + sink tool
        Policy-->>Aegis: DENY (taint block)
        Aegis-->>Agent: Blocked - untrusted data in session
    end
```

### B. Taint Tracking (Prompt Injection Defense)

```mermaid
flowchart LR
    A[Agent calls fetch_webpage] -->|Taint Source| B[Session labeled: EXTERNAL_WEB]
    B --> C{Agent attempts<br/>execute_sql / send_slack_msg?}
    C -->|Yes - Taint Sink| D[🚫 BLOCKED by Policy Engine]
    C -->|No sink tool called| E[✅ Continues normally]
```

### C. Asynchronous Human Approval Workflow

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant Aegis as Runwall
    participant Admin as Human Admin

    Agent->>Aegis: Attempt high-risk action
    Aegis-->>Agent: REQUIRE_APPROVAL (approval_id)
    Aegis->>Admin: Slack/dashboard notification
    Admin->>Aegis: POST /api/v1/approvals/{id}/review (APPROVED)
    Aegis-->>Agent: Approval granted
    Agent->>Aegis: execute_approved_action(approval_id)
    Aegis-->>Agent: ✅ Execution completes
```

### D. Task Contracts (Batch Approval)

```mermaid
flowchart TB
    A[Agent proposes contract:<br/>goal, tools, max_writes, max_spend] --> B{Admin/Policy<br/>approves contract?}
    B -->|No| C[🚫 Rejected - fallback to per-call checks]
    B -->|Yes| D[contract_id issued]
    D --> E[Agent runs many tool calls<br/>tagged with contract_id]
    E --> F{Within declared tools,<br/>write limit & budget?}
    F -->|Yes| G[✅ Auto-allowed, no repeated prompts]
    F -->|No - exceeds bounds| H[🚫 Falls back to individual policy check]
```

### E. Reversible Execution (Undo)

```mermaid
flowchart LR
    A[Agent calls mutating tool<br/>e.g. create_user] --> B[Execution archived<br/>with execution_id + args]
    B --> C[Tool runs normally]
    C --> D{Mistake or<br/>unauthorized action?}
    D -->|Yes| E[Admin calls<br/>rollback_action execution_id]
    E --> F[Compensation handler invoked<br/>rollback_create_user]
    F --> G[✅ State restored]
    D -->|No| H[No action needed]
```

---

## 🚀 Quick Start

### Step 1 — Boot the Runwall Service

Run Runwall in Docker:

```bash
docker run -d -p 8000:8000 \
  -e SECRET_KEY=your-production-secret-key \
  dushyantzz/secure-mcp-server:latest
```

### Step 2 — Connect Your AI Client

Add the Runwall MCP endpoint to Cursor, VS Code (Cline), or Claude Desktop config:

```json
{
  "mcpServers": {
    "runwall": {
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

### Step 3 — (Optional) Route a Custom Agent Through Runwall

```python
import httpx

async def run_governed_tool(session_token, tool_name, arguments):
    headers = {"Authorization": f"Bearer {session_token}"}
    payload = {
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments}
    }
    response = await httpx.post("http://localhost:8000/mcp", json=payload, headers=headers)
    return response.json()
```

That's it — your agent is now authenticated, rate-limited, taint-tracked, audited, and protected against prompt injection and runaway costs.

---

## 🔗 Client Integration

| Client | Integration Method |
|---|---|
| Claude Desktop | Add `mcpServers` entry pointing to `http://localhost:8000/mcp` |
| Cursor | Add `mcpServers` entry in Cursor settings |
| VS Code (Cline) | Add `mcpServers` entry in Cline MCP config |
| Custom Agents (LangChain, CrewAI, AutoGPT, raw OpenAI API) | Route tool calls through the Runwall REST/MCP client |

---

## 🧩 Custom Agent Integration (Python)

Register a connector so Runwall auto-generates governed tools instead of hand-writing them:

```python
# Example: register a database connector
connector_config = {
    "type": "DatabaseConnector",
    "connection_string": "postgresql://user:pass@host:5432/db"
}
# Runwall auto-generates sql_query / sql_execute tools,
# each inheriting taint tracking, risk scoring, and rate limits.
```

---

## 📡 REST API & Dashboard

Runwall ships a FastAPI control plane with full Swagger documentation:

```
http://localhost:8000/docs
```

Common endpoints:
- `POST /api/v1/approvals/{id}/review` — approve/deny a pending high-risk action
- `GET  /api/v1/audit-logs` — query historical tool execution
- `GET  /api/v1/policies` — inspect/manage active policy rules
- `POST /api/v1/tools/{name}/approve-trust` — re-baseline a quarantined tool

---

## 📄 License & Support

Runwall is distributed as a Docker image (`dushyantzz/secure-mcp-server:latest`). For issues, feature requests, or policy authoring help, consult the in-app Swagger docs at `/docs` or your internal platform team.

---

*Built for the era of autonomous AI agents — because "can it access the tool" is no longer the right question.*
