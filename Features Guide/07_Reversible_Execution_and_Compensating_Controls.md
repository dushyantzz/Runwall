# Feature: Reversible Execution & Compensating Controls

## Overview
One of the hardest challenges in autonomous execution governance is the handling of "destructive" or "mutating" actions (e.g., deleting a database record, provisioning infrastructure, sending an email). 

This platform implements **Reversible Execution & Compensating Controls** (Phase 3). It explicitly pairs tools with their inverse "undo" functions, guaranteeing that if an agent executes a high-risk task that is later flagged as a violation or mistake, the action can be deterministically rolled back.

## Architecture

```text
+-----------------------+      +-----------------------+      +-----------------------+
|                       |      |                       |      |                       |
|   Agent / LLM         +----->+  ToolRegistry         +----->+  Tool Implementation  |
|   (execute tool)      |      |  (execute_tool)       |      |  (e.g., create_user)  |
|                       |      |                       |      |                       |
+-----------------------+      +-----------+-----------+      +-----------+-----------+
                                           |                              |
                                           v                              |
                               +-----------------------+                  |
                               |                       |                  |
                               |  CompensationRegistry |<-----------------+
                               |  (logs reversible     |      (Returns execution output)
                               |   execution args)     |
                               +-----------+-----------+
                                           |
                                           v
                               +-----------------------+
                               |                       |
                               | ReversibleExecutionLog|
                               | (committed to DB)     |
                               +-----------------------+
```

## How It Works

### 1. The Compensation Registry
Developers writing tools can flag them as reversible by providing metadata:
```python
tool_metadata = {
    "create_user": {
        "is_reversible": True,
        "compensation_handler": "rollback_create_user"
    }
}
```
The inverse function (`rollback_create_user`) is registered in the `CompensationRegistry`.

### 2. Execution & Logging
When the `ToolRegistry` successfully executes `create_user`, it checks the metadata. Seeing that it is reversible, it immediately takes the original input arguments and the output result of the tool and stores them in the SQLite Database as a `ReversibleExecutionLog`. 
The execution is assigned a unique `rev-` ID (e.g., `rev-a1b2c3d4e5f6`).

### 3. The Undo Path
If an incident is detected, an administrator (or another agent!) can call the Admin MCP Tool `rollback_action(execution_id="rev-a1b2c3d4e5f6")`. 
The registry fetches the log, retrieves the mapped `rollback_create_user` function, passes it the stored arguments, and executes it. Once complete, the database status is updated from `committed` to `rolled_back`.

## Advanced Use-Cases
- **Simulate & Staging:** Policies can be configured to execute tools in a sandboxed staging environment, waiting for manual approval before applying to production.
- **Outbox Pattern:** Sending emails can be queued in an outbox for 5 minutes, giving users a window to trigger the rollback before it leaves the network.
