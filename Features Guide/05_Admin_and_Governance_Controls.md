# Feature: Admin & Governance Controls

## Overview
The Admin & Governance Controls feature replaces hardcoded security mocks with a dynamic, database-backed governance engine. Because this platform is delivered as an MCP server rather than a traditional REST API, administration is performed via **Admin MCP Tools**.

## Architecture

```text
+-----------------------+      +-----------------------+      +-----------------------+
|                       |      |                       |      |                       |
|   MCP Client / LLM    +----->+  FastMCP Server       +----->+  Admin Tools Module   |
|   (Admin Interface)   |      |  (request router)     |      |  (manage_policy, etc) |
|                       |      |                       |      |                       |
+-----------------------+      +-----------+-----------+      +-----------+-----------+
                                           |                              |
                                           v                              |
+-----------------------+      +-----------------------+                  |
|                       |      |                       |                  |
|   ToolRegistry        +----->+  PolicyEvaluator      |                  |
|   (intercepts tools)  |      |  (async DB evaluate)  |                  |
|                       |      |                       |                  |
+-----------------------+      +-----------+-----------+                  |
                                           |                              |
                                           v                              v
                               +------------------------------------------------------+
                               |                                                      |
                               |  DatabaseManager & SQLAlchemy Models                 |
                               |  (PolicyRule, PolicyDecisionLog, AuditLog)           |
                               |                                                      |
                               +------------------------------------------------------+
```

## Key Components

### 1. Admin MCP Tools
Instead of exposing a traditional web dashboard, governance is exposed natively via MCP tools registered in `secure_mcp_server/admin/tools.py`.
- **`manage_policy`**: Provides full CRUD operations for `PolicyRule` records, automatically bumping versions on update and supporting soft deletes.
- **`explore_audit_logs`**: Allows querying system-wide audit logs with filters for `user_id` or `event_type`.
- **`get_decision_logs`**: Fetches the immutable audit trail of every governance decision made, including the exact `evaluation_chain` for full explainability.
- **`view_tool_inventory`**: Inspects all tools currently registered on the server.

### 2. Async Database Evaluation
The `PolicyEvaluator` has been overhauled from a synchronous, hardcoded system into an `async` engine that queries the active database for policies matching the user's `tenant_id`.

### 3. Immutable Decision Logs
Every time the `PolicyEvaluator` reaches a decision, it persists a `PolicyDecisionLog` capturing:
- The `tool_name` requested.
- The `intent_category` and `risk_score`.
- The `evaluation_chain` proving *why* the decision was made.
- The final `decision` (Allow, Deny, Require Approval, Simulate).

## Security & Tenancy
All admin tools enforce strict role-based access control (RBAC), verifying that the `user_context.is_admin` flag is `True`. Furthermore, queries to the database are scoped by `tenant_id` to ensure isolation in multi-tenant environments.
