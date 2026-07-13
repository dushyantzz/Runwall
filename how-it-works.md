# Runwall MCP Gateway: How It Works & Under-the-Hood Governance

This guide explains the connection between the **visible tools** in your AI client (Claude Desktop, Cursor, Cline, etc.) and the **12 core governance features** running under the hood in the Runwall Dashboard.

---

## 💡 The Core Concept: Visible Tools vs. Invisible Shield

When you integrate Runwall into an AI client, it works as a two-layer system:

```
┌─────────────────────────────────────────────────────────┐
│              🤖 AI CLIENT (Claude Desktop)              │
│  Calls visible tools: Calculator, Secure Hash, etc.     │
└───────────────────────────┬─────────────────────────────┘
                            │ (Intercepted & Inspected)
                            ▼
┌─────────────────────────────────────────────────────────┐
│             🛡️ RUNWALL GATEWAY (Under the Hood)         │
│  Runs 12 Core Features: Policy, Risk, Taint, Audit...   │
└─────────────────────────────────────────────────────────┘
```

The AI agent only sees standard utility and integration tools, while you gain full control, security policies, audit trails, and human-in-the-loop approvals for every single action they take.

---

## 1. 🔌 What Users See in Their Connectors (Visible Tools)

By default, the following tools are exposed to the AI client:

| Tool Name | Purpose | Example Parameters |
|:---|:---|:---|
| **Echo** | Echoes back input text (used to verify connection). | `{"text": "hello"}` |
| **Calculator** | Evaluates mathematical expressions safely. | `{"expression": "56 * 78"}` |
| **Text Processor** | Performs operations like reverse, reverse, word count, case changes. | `{"text": "hello", "operation": "reverse"}` |
| **Secure Hash** | Generates md5, sha1, sha256, or sha512 hashes. | `{"text": "hello", "algorithm": "sha256"}` |
| **Uuid Generator** | Generates secure UUID v1 or v4 identifiers. | `{"version": 4}` |
| **Datetime Info** | Returns current system date and time in various formats. | `{"timezone": "UTC"}` |
| **Json Formatter** | Pretty-prints or validates JSON strings. | `{"text": "{}"}` |
| **Base64 Codec** | Encodes or decodes text to/from Base64 format. | `{"text": "hello", "action": "encode"}` |

*Note: Once you deploy database, REST API, or shell connectors, those will auto-generate new tools (like `sql_query`, `fetch_endpoint`, etc.) which are also governed by the same shield.*

---

## 2. 🛡️ What Works Under the Hood (The 12 Core Features)

Every time an AI client calls one of the tools above, Runwall runs the call through a pipeline containing these 12 core modules:

### 1. Identity & Access Control
- **What it does**: Verifies the client's API Key (`mcp_...`) or JWT token.
- **Under the hood**: Hashes the token prefix with SHA-256 to authorize the session, ensuring only verified agents can access your tools.

### 2. Tenant & Org Management
- **What it does**: Silos configurations, keys, and logs by organization.
- **Under the hood**: Routes the request to the correct tenant space, preventing data leakages between different parts of your company.

### 3. Tool / MCP Registry
- **What it does**: Manages available tools and their cryptographic signatures.
- **Under the hood**: Verifies that the tool code hasn't been maliciously altered (Tool Trust & Provenance) before executing it.

### 4. Policy Engine
- **What it does**: The central brain executing policy rules (e.g., OPA Rego rules).
- **Under the hood**: Compares the request against active rules to determine if the call is **ALLOWED**, **DENIED**, or **PAUSED** for approval.

### 5. Runtime Interceptor
- **What it does**: Sanitizes parameters and monitors connection states.
- **Under the hood**: Strips out dangerous injection vectors or malicious code parameters before passing them to the tool runner.

### 6. Risk Scoring Engine
- **What it does**: Dynamically scores the risk of a tool execution from `0.0` (safe) to `1.0` (critical).
- **Under the hood**: Arithmetic operations get low risk scores (`0.02`), while data deletions or bulk exports get high risk scores (`0.85+`).

### 7. Taint Tracking Engine
- **What it does**: Tracks the lineage of data inside an agent's memory.
- **Under the hood**: If the agent reads from an untrusted public source (e.g., `fetch_webpage`), the session is flagged as "tainted". Any subsequent call to write tools (e.g. `execute_sql`) is automatically blocked to prevent prompt injection attacks.

### 8. Approval Workflow Engine
- **What it does**: Implements "human-in-the-loop" verification for high-risk tools.
- **Under the hood**: If the Risk Engine scores a tool above your threshold, Runwall suspends the call, alerts you, and waits. Once you click **Approve** in the dashboard, the tool resumes.

### 9. Audit / Evidence / Replay
- **What it does**: Records a tamper-proof ledger of all events.
- **Under the hood**: Captures the exact inputs, outputs, matched policies, and execution times, allowing admins to replay agent execution step-by-step.

### 10. Rollback / Compensating
- **What it does**: Provides an "undo" mechanism for tool executions.
- **Under the hood**: Mutating tools are registered with reverse actions. If an agent deletes a file or creates a record in error, the admin can trigger a compensation handler to restore the state.

### 11. Quotas / Budgets / Limits
- **What it does**: Enforces system and cost protections.
- **Under the hood**: Tracks rate limits (requests per minute) and tokens used. It dynamically throttles the agent if the session risk score starts rising.

### 12. Sandboxing / Exec Profiles
- **What it does**: Runs commands in secure, isolated containers.
- **Under the hood**: Code execution or terminal shell tools run inside ephemeral sandboxes, keeping your main servers safe from malicious agent commands.

---

## 3. 🔄 Step-by-Step Request Lifecycle

Here is the exact path of a tool call when Claude asks to evaluate an equation:

```
[1] Claude Desktop (Calls Calculator)
     │
     ▼ (Piped through index.js)
[2] Vercel Proxy (https://runwall.vercel.app/mcp)
     │
     ▼ (Secure HTTPS forward)
[3] AWS ECS Fargate Backend (Secure MCP Server)
     ├─► [4] Auth check (hashes API key, checks DB)
     ├─► [5] Quota check (evaluates rate limits in Redis)
     ├─► [6] Policy check (evaluates OPA Rego rules)
     ├─► [7] Risk scoring (scores: negligible 0.0225)
     ├─► [8] Interceptor (checks for execution sanitization)
     ▼ (All clear)
[9] Tool Execution (calculates result)
     │
     ▼
[10] Audit Log Written (recorded in Supabase)
     │
     ▼
[11] Result sent back (Vercel Proxy ──► index.js ──► Claude UI)
```

---

## 📊 How to Verify and Monitor Your Tools

To see this system in action:

1. Open **Claude Desktop** and ask it to run a tool:
   > *"Generate a UUID using the runwall tool"*
2. Open your web browser and navigate to **`https://runwall.vercel.app`**.
3. Log into your dashboard and click the **Audit / Evidence / Replay** tab.
4. You will see the event log representing the UUID generation, complete with:
   - Match policy ID (`default-008`)
   - Calculated risk score (`0.0225`)
   - Complete input and output JSON payloads
