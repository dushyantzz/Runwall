# 🛡️ Runwall Core Governance Code Map

This document maps the **12 core security and governance features** of the Runwall platform to the exact source code files and logic that implement them.

---

## 1. 👤 Identity & Access Control
* **Primary Code**: [auth.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/auth.py)
* **Under the Hood**:
  * The `AuthManager` class manages user sessions, registration, and credential validation.
  * API Keys (prefixed with `mcp_`) are hashed using SHA-256 and matched against key records stored in the database.
  * Extracted client information is converted into a structured `user_context` (containing `role`, `tenant_id`, and permissions) passed alongside every tool request.
* **Key Components**:
  * `AuthManager.get_user_context()`: Verifies API keys.
  * `AuthManager.authenticate_user()`: Validates password hashes (bcrypt via `passlib`).

---

## 2. 🏢 Tenant & Org Management
* **Primary Code**: [context.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/context.py)
* **Under the Hood**:
  * Implemented using the `ContextManager` class.
  * It isolates logs, execution limits, and policies per organization.
  * Request contexts map user IDs and access levels to specific tenant partitions (`tenant_id`), preventing cross-tenant data leakage.
* **Key Components**:
  * `ContextManager.get_session_context()`: Manages session variables.
  * Database Models: [database/models.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/database/models.py) exposes the `tenant_id` columns on user and key schemas.

---

## 3. 🔌 Tool / MCP Registry
* **Primary Code**: [tools.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/tools.py) & [connectors/registry.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/connectors/registry.py)
* **Under the Hood**:
  * The `ToolRegistry` class stores the schemas and execution references for all active tools.
  * The `ConnectorRegistry` allows building plug-and-play integrations (like Database, REST API, or shell). Registered connectors automatically compile their functions and schemas into the unified tool registry.
* **Key Components**:
  * `ToolRegistry._register_builtin_tools()`: Registers built-in tools like calculations.
  * `ConnectorRegistry.register_connector()`: Mounts custom tool connectors.

---

## 4. ⚖️ Policy Engine (OPA)
* **Primary Code**: [governance/policy_evaluator.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/governance/policy_evaluator.py) & [governance/opa_evaluator.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/governance/opa_evaluator.py)
* **Under the Hood**:
  * Integrates Open Policy Agent (OPA) policy-as-code.
  * The `PolicyEvaluator` class matches request contexts against custom rules, while `OPAPolicyEvaluator` loads declarative rules written in Rego language (.rego files) and evaluates permissions at runtime.
* **Key Components**:
  * `PolicyEvaluator.evaluate_policy()`: Combines rule evaluations to output `ALLOW`, `DENY`, or `REQUIRE_APPROVAL`.
  * `OPAPolicyEvaluator.evaluate_rego()`: Direct compilation and evaluation of Rego policies.

---

## 5. 🔄 Runtime Interceptor
* **Primary Code**: `execute_tool()` in [tools.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/tools.py)
* **Under the Hood**:
  * The main gateway controller that intercepts the execution path of the Model Context Protocol (MCP).
  * When a tool call is requested, `execute_tool` pauses execution, runs all check classes in order, blocks violations, and wraps results inside a visual Markdown Process Card before returning them to the agent.
* **Key Components**:
  * `ToolRegistry.execute_tool()`: Intercepts and orchestrates checks.
  * `_generate_markdown_process_card()`: Renders the Runwall Shield Report table.

---

## 6. 📊 Risk Scoring Engine
* **Primary Code**: [governance/risk_scorer.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/governance/risk_scorer.py)
* **Under the Hood**:
  * Implemented by the `RiskScorer` class.
  * Dynamically computes a risk score from `0.0` to `1.0` based on execution context. It scores tool sensitivity, blast radius, anomaly indicators, user trust modifiers, and temporal contexts.
* **Key Components**:
  * `RiskScorer.calculate_score()`: Aggregates risk factors into a unified float score.

---

## 7. 🩸 Taint Tracking Engine
* **Primary Code**: [governance/taint.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/governance/taint.py)
* **Under the Hood**:
  * Core defense against indirect prompt injections.
  * The `TaintManager` tracks untrusted data paths. Tools that read external sources (like websites) are labeled as "taint sources" and mark the session as contaminated. If the agent subsequently calls a "taint sink" tool (like database writes or shell commands), the transaction is blocked.
* **Key Components**:
  * `TaintManager.add_taint()`: Appends a taint label to the active session.
  * `TaintManager.check_execution_safety()`: Blocks tool sinks if session is tainted.

---

## 8. ⏳ Approval Workflow Engine
* **Primary Code**: [governance/approvals.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/governance/approvals.py) & [api/routes/approvals.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/api/routes/approvals.py)
* **Under the Hood**:
  * Enables human-in-the-loop validation for high-risk actions.
  * The `ApprovalManager` intercepts high-risk calls, registers a `PENDING` request in the database, and returns an `approval_id`. Once a human reviews and approves the request, the agent completes the execution by calling the approved action.
* **Key Components**:
  * `ApprovalManager.create_approval_request()`: Stages the action execution context.
  * `execute_approved_action()`: Expose tool to execute the staging block after approval.

---

## 9. 📝 Audit / Evidence / Replay
* **Primary Code**: `AuditLog` in [database/models.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/database/models.py) & [monitoring.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/monitoring.py)
* **Under the Hood**:
  * Records detailed evidence of every single action processed by the gateway.
  * The metrics collector logs timestamps, inputs, outputs, user credentials, policy decisions, and execution times, exposing them via the API for dashboard visualization.
* **Key Components**:
  * `MetricsCollector.record_tool_execution()`: Registers tool statistics.
  * `AuditLog` database model: Stores the persistent audit trail.

---

## 10. 🔄 Rollback & Compensation
* **Primary Code**: [governance/compensation.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/governance/compensation.py)
* **Under the Hood**:
  * Implemented by the `CompensationRegistry` class.
  * Maps mutating actions (like file writes or database inserts) to corresponding rollback actions (compensation handlers). If a transaction fails or requires reversion, the engine executes the compensating task with the original arguments.
* **Key Components**:
  * `CompensationRegistry.register_compensation()`: Binds a rollback handler to a tool.
  * `CompensationRegistry.execute_rollback()`: Invokes the rollback function.

---

## 11. ⏱️ Quotas / Budgets / Limits
* **Primary Code**: [governance/quota_manager.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/governance/quota_manager.py)
* **Under the Hood**:
  * Manages token-bucket rate limiting at multiple levels (tenant, user, and tool limits).
  * Exposes an adaptive throttling mechanism that automatically decreases rate limits when threat risk levels spike above configured limits.
* **Key Components**:
  * `QuotaManager.check_quota()`: Checks if rate limit remains.
  * `QuotaManager.get_adaptive_limit()`: Computes dynamic limits based on threat scores.

---

## 12. 📦 Sandboxing & Exec Profiles
* **Primary Code**: [security.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/security.py) & [connectors/shell.py](file:///c:/Users/Shubham/Desktop/Runwall/secure_mcp_server/connectors/shell.py)
* **Under the Hood**:
  * Restricts and sandboxes the runtime capability of external tools.
  * The `SecurityManager` enforces sanitization on input parameters (preventing command/SQL injection) and constructs isolated command execution environments with strict CPU/memory boundaries and timeouts.
* **Key Components**:
  * `SecurityManager.sanitize_input()`: Input parameter sanitization.
  * `ShellConnector._run_command_tool()`: Sandboxed terminal shell executions.
