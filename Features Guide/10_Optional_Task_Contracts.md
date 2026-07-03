# Feature: Optional Task Contracts

## Overview
Traditional execution governance evaluates risk on a per-action basis. For multi-step autonomous workflows (e.g., an LLM agent scanning a repository, analyzing 10 files, and committing changes), this per-action evaluation can generate excessive friction (e.g., triggering the Approval Engine multiple times).

**Phase 6** introduces **Optional Task Contracts**. An agent can propose a complete bounded sandbox for its workflow upfront. Once the platform approves this contract, the agent can execute as many individual steps as it wants—bypassing individual `REQUIRE_APPROVAL` barriers—provided it does not exceed the contract's strict cryptographic boundaries.

## Architecture

```text
+-----------------------+      +-----------------------+      +-----------------------+
|                       |      |                       |      |                       |
|   Agent / LLM         +----->+  ContractManager      +----->+  TaskContract (DB)    |
|   (propose contract)  |      |  (evaluates goal)     |      |  (APPROVED state)     |
|                       |      |                       |      |                       |
+-----------------------+      +-----------------------+      +-----------+-----------+
            ^                                                             |
            | (returns contract_id)                                       |
            +-------------------------------------------------------------+

[LATER]
+-----------------------+      +-----------------------+      +-----------------------+
|                       |      |                       |      |                       |
|   Agent / LLM         +----->+  ToolRegistry         +----->+  ContractManager      |
|   (execute_tool w/    |      |  (bypasses approvals) |      |  (enforces bounds)    |
|    contract_id)       |      |                       |      |                       |
+-----------------------+      +-----------------------+      +-----------------------+
```

## How It Works

### 1. Proposal
Before starting a long workflow, the agent calls the built-in MCP Tool `propose_task_contract`. It explicitly declares:
- `goal`: What it's trying to achieve.
- `expected_tools`: The exact whitelist of tools it needs (e.g., `["read_file", "write_file", "git_commit"]`).
- `max_writes`: The maximum number of mutating actions it anticipates.
- `max_spend`: The maximum financial budget it anticipates.

If the request is reasonable (e.g., `max_writes <= 10`), the `ContractManager` auto-approves it and returns a `contract_id`. (If it's too large, it routes to the `ApprovalManager` for human sign-off).

### 2. Execution & Enforcement
The agent proceeds to work, passing `contract_id="tc-123..."` inside the arguments of every tool it calls.
Inside the `ToolRegistry`, before evaluating policies, the `ContractManager` intercepts the request:
- **Tool Whitelist**: If the agent attempts to call a tool not in `expected_tools`, the execution is instantly blocked and the entire contract is marked as `VIOLATED`.
- **Write Counter**: If the intent is `WRITE`, `DELETE`, or `ADMIN`, the manager increments `current_writes`. If it exceeds `max_writes`, execution is blocked and marked as `EXHAUSTED`.
- **Budget**: Enforces `max_spend`.

### 3. Policy Bypass
If the execution is perfectly valid within the contract boundaries, the `ToolRegistry` temporarily disables any `REQUIRE_APPROVAL` policies for that single action. The reasoning is that the human/platform already approved the *entire workflow boundary* during the Proposal phase, eliminating the need to micromanage individual steps.
