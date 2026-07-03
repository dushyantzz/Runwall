# Feature: Taint Tracking Engine

## Overview
The **Taint Tracking Engine** ensures that an agent's exposure to untrusted data is explicitly tracked and factored into execution governance decisions.

A typical LLM agent often reads data from untrusted sources (e.g., retrieving web pages, reading user-submitted emails, or scanning attachments) and then later performs sensitive actions (e.g., writing to a database or executing a shell command). If the agent was compromised via prompt injection during the "read" step, the subsequent "write" step poses a catastrophic risk.

The Taint Tracking Engine mitigates this by maintaining a permanent **Taint State** for the duration of the session. 

## Architecture

```text
+-----------------------+      +-----------------------+      +-----------------------+
|                       |      |                       |      |                       |
|   MCP Client / LLM    +----->+  FastMCP Server       +----->+  ToolRegistry         |
|   (Agent Session)     |      |  (request router)     |      |  (execute_tool)       |
|                       |      |                       |      |                       |
+-----------------------+      +-----------+-----------+      +-----------+-----------+
                                           |                              |
                                           |                              |
                                           v                              v
                               +-----------------------+      +-----------------------+
                               |                       |      |                       |
                               |  TaintManager         |      |  PolicyEvaluator      |
                               |  (marks session       +----->+  (evaluates intent    |
                               |   as tainted)         |      |   with taint labels)  |
                               +-----------------------+      +-----------------------+
```

## How It Works

### 1. Taint Sources (The "Infection")
Certain read-only tools are designated as **Taint Sources**. Examples include `fetch_webpage`, `read_email`, or `download_attachment`.
When an agent successfully executes one of these tools, the `ToolRegistry` notifies the `TaintManager`, which appends a specific `TaintLabel` (e.g., `EXTERNAL_WEB`, `USER_UPLOAD`) to the active `Session` in the database.

### 2. Taint Propagation (The "Incubation")
Because the LLM's context window contains the result of that untrusted execution, the entire `Session` is now considered tainted. Any subsequent tool calls originating from this session will implicitly carry this taint.

### 3. Taint Sinks (The "Policy Enforcement")
When the agent attempts to execute a subsequent action (e.g., `execute_sql` or `export_contacts`), the `ToolRegistry` fetches the session's active taints and attaches them to the `IntentClassification`.

The `PolicyEvaluator` evaluates rules against these taints. For example, an administrator can configure a Zero Trust policy rule:
* **IF** `intent = WRITE` **AND** `taint = EXTERNAL_WEB` **THEN** `REQUIRE_APPROVAL`

## Database & Auditability
Taints are permanently persisted in the `Session` database model as a JSON array. 
Furthermore, the `PolicyDecisionLog` captures the exact `taint_labels` present at the moment of evaluation, ensuring that incident responders can definitively trace why a prompt-injected LLM was blocked from destroying a database.
