# Feature: OPA / Rego Policy System

## Overview
As organizations scale, managing execution governance via Python code or SQL-based UI rules becomes inflexible. Advanced DevSecOps teams expect "Policy-as-Code" stored in Git (GitOps) using industry standards.

**Phase 8** migrates the core policy engine to the **Open Policy Agent (OPA)** using **Rego**. This allows security teams to write deterministic, version-controlled policies that govern exact LLM agent behavior (e.g., blocking tainted data, enforcing quotas, and requiring human approval based on specific context triggers).

## Architecture

```text
+-----------------------+      +-----------------------+      +-----------------------+
|                       |      |                       |      |                       |
|   LLM Agent Request   +----->+  OPAPolicyEvaluator   +----->+  governance.rego      |
|   (tool arguments)    |      |  (Generates JSON)     |      |  (Decision Engine)    |
|                       |      |                       |      |                       |
+-----------------------+      +-----------+-----------+      +-----------+-----------+
                                           |                              ^
                                           |                              |
                                           v                              |
+-----------------------+      +-----------------------+      +-----------------------+
|   Simulation Mode     |      |                       |      |   PolicyBundle (DB)   |
|   (Bypasses Deny if   +<-----+  ToolRegistry         |<-----+   - version           |
|    enabled for test)  |      |                       |      |   - rollout %         |
+-----------------------+      +-----------------------+      +-----------------------+
```

## How It Works

### 1. The Rego File
The core rules are defined in `secure_mcp_server/policies/governance.rego`. The evaluator constructs a dense JSON `input` object that contains:
- `intent`: (e.g., "read", "write", "delete")
- `risk`: (e.g., score: 0.82)
- `taints`: (e.g., `["external_api", "pii"]`)
- `user_context` & `tool_metadata`

The Rego code applies logic such as:
```rego
deny[msg] {
    input.intent.intent_category == "write"
    count(input.taints) > 0
    msg := "Mutating actions are not allowed when session is tainted"
}
```

### 2. OPA Policy Evaluator
The `OPAPolicyEvaluator` replaces the previous Python implementation. 
- It attempts to invoke the actual `opa eval` binary via the shell. 
- If OPA is not installed on the host, it gracefully degrades to a strict, equivalent native Python implementation for the demo environment, preventing runtime crashes.

### 3. Policy Management & Staged Rollouts
We introduced the `PolicyBundle` database model to store versioned Rego content.
- **GitOps Ready**: Admin tools like `deploy_policy_version` allow a CI/CD pipeline to push a new Rego file to the database.
- **Rollout Percentage**: A new policy can be deployed to a subset of tenant traffic.
- **Simulation Mode**: A critical enterprise feature. If `is_simulation_mode=True`, the evaluator will run the OPA policy, log the fact that it *would have been blocked*, but ultimately return `ALLOW`. This allows security teams to test new strict policies against production LLM traffic without immediately breaking agent workflows.

### 4. Admin Simulation Tools
An administrator can use the new MCP tool `run_policy_simulation` to dry-run an intended action (e.g., running `sql_execute` with specific taints) to see exactly how OPA will score and judge it, complete with the "why allowed/denied" explanation generated directly from the Rego evaluation.
