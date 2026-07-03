# Feature: Low-Friction Approval Workflow Engine

## Overview
Traditional security platforms often implement binary policies: actions are either completely allowed or permanently blocked. 

**Phase 5** introduces an asynchronous **Approval Workflow Engine**. This engine acts as a "Staging Area." If an agent attempts an action that violates a medium-to-high risk policy (e.g., spending more than $50 on cloud infrastructure), the engine pauses the execution, stages it securely in the database, and returns a tracking ID to the agent while alerting human administrators. 

## Architecture

```text
+-----------------------+      +-----------------------+      +-----------------------+
|                       |      |                       |      |                       |
|   Agent / LLM         +----->+  ToolRegistry         +----->+  ApprovalManager      |
|   (execute tool)      |      |  (REQUIRE_APPROVAL)   |      |  (creates req in DB)  |
|                       |      |                       |      |                       |
+-----------------------+      +-----------+-----------+      +-----------+-----------+
            ^                              |                              |
            | (returns approval_id)        |                              v
            +------------------------------+                  +-----------------------+
                                                              |                       |
+-----------------------+      +-----------------------+      |  ApprovalRequest      |
|   Admin (Human)       +----->+  Admin Tools          +----->+  (PENDING status)     |
|   (review_approval)   |      |                       |      |                       |
+-----------------------+      +-----------------------+      +-----------------------+
```

## How It Works

### 1. Interception & Staging
During execution, if the `PolicyEvaluator` returns `REQUIRE_APPROVAL`, the `ToolRegistry` prevents the actual tool logic from running.
Instead, it packages the tool name, arguments, and a rich "Context Snapshot" (containing the calculated risk score, intent category, taint labels, and reversibility status) and sends it to the `ApprovalManager`. The manager writes this to the SQLite database with a `PENDING` status.

### 2. Administrator Review
An administrator can query the pending queue using the Admin MCP tool `get_pending_approvals`. 
The context snapshot provides exactly why the system flagged the action (e.g., "Tainted session + Destructive Intent + High Risk = 0.82").
The admin can then call `review_approval(approval_id, decision, reason)`, officially moving the status to `APPROVED` or `REJECTED`.

### 3. Execution
If approved, the LLM agent (or a separate pipeline) can resume the flow by calling the built-in system tool `execute_approved_action(approval_id)`. 
This tool fetches the exact original arguments from the database, temporarily bypasses the policy evaluator (since it was explicitly approved by a human), and executes the tool. It also generates the standard metrics and taint/reversibility tracking.

## Compliance
This pattern guarantees that high-risk automations require a physical human's explicit sign-off in the audit log before sensitive mutations occur.
