# Feature: Tool Trust & Provenance

## Overview
Because the Execution Governance Platform acts as the gateway between the LLM agent and sensitive infrastructure tools, the tools themselves must be treated as security principals. 

If an attacker manages to modify a tool's description (to introduce prompt poisoning instructions to the agent) or alters the tool's underlying Python code (supply chain attack), the agent could be manipulated into executing malicious actions. **Phase 4** introduces a cryptographic **Tool Trust & Provenance** engine to prevent this.

## Architecture

```text
+-----------------------+      +-----------------------+      +-----------------------+
|                       |      |                       |      |                       |
|   Agent / LLM         +----->+  ToolRegistry         +----->+  ToolTrustManager     |
|   (execute tool)      |      |  (execute_tool)       |      |  (computes hashes)    |
|                       |      |                       |      |                       |
+-----------------------+      +-----------+-----------+      +-----------+-----------+
                                           |                              |
                                           |                              v
                                           |                  +-----------------------+
                                           |                  |                       |
                                           +<-----------------+  ToolManifest (DB)    |
                                      (Quarantine/Allow)      |  (trusted baseline)   |
                                                              +-----------------------+
```

## How It Works

### 1. Baseline Establishment
When the server starts or a new tool is invoked for the very first time, the `ToolTrustManager` extracts the raw Python source code (`inspect.getsource`) and the tool's textual description. It computes SHA-256 hashes for both strings and stores them in the `ToolManifest` table in SQLite, setting the `trust_status` to `TRUSTED`.

### 2. Execution-Time Verification
Every time the agent requests to execute a tool, the `ToolRegistry` halts the pipeline and invokes `verify_tool()`.
The engine dynamically re-hashes the live function code and description, comparing them against the database baseline.

### 3. Drift Detection & Quarantine
If there is a mismatch (e.g., someone edited `tools.py` directly to change the logic of a tool), the engine detects the drift:
- The tool's `trust_status` is immediately updated to `QUARANTINED`.
- The execution is aborted with a severe security warning logged.
- The tool will completely refuse to execute for *any* user until an administrator intervenes.

### 4. Administrative Approval
If the modification was intentional (e.g., a legitimate developer updated the tool's code), an administrator can use the Admin MCP Tool `approve_tool_trust_state(tool_name)`. 
This tool recomputes the new hashes, updates the baseline in the database, bumps the manifest `version`, and sets the status back to `TRUSTED`.
