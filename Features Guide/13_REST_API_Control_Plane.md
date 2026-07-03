# Feature: REST API Control Plane

## Overview
While the platform exposes powerful capabilities via **FastMCP Tools**, a mature enterprise system requires an HTTP/REST Control Plane. **Phase 9** introduces a **FastAPI** web server that mounts alongside our governance engine, exposing explicit, schema-validated endpoints (OpenAPI/Swagger) for administrative functions.

This enables:
- **CI/CD Integrations**: Automatically deploy new `.rego` policies via HTTP POST.
- **Web UI Integrations**: Power the Security, Platform, and Developer web consoles.
- **Monitoring Tools**: Fetch Audit Logs and Policy Decisions programmatically.

## Architecture

```text
+-----------------------+      +-----------------------+      +-----------------------+
|  Web Dashboard (UI)   |      |  REST API (FastAPI)   |      |  Execution Engine     |
|  CI/CD Pipelines      +----->+  (Port 8000)          +----->+  (SQLite, Policies,   |
|  curl / scripts       |      |  /api/v1/...          |      |   Approvals)          |
+-----------------------+      +-----------+-----------+      +-----------------------+
                                           |
                                           v
                               +-----------------------+
                               |  OpenAPI Schema       |
                               |  (Pydantic Models)    |
                               +-----------------------+
```

## How It Works

### 1. Unified Database and Services
The FastAPI app (`secure_mcp_server/api/app.py`) imports the exact same `DatabaseManager` and SQLAlchemy `Base` used by the MCP server. This ensures that any policy deployed via the REST API is instantly picked up by the MCP `OPAPolicyEvaluator`.

### 2. Pydantic Schemas (`schemas.py`)
We enforce strict request/response contracts using Pydantic:
- `PolicyBundleDeployRequest`: Enforces inputs for `rego_content`, `is_simulation_mode`, and `rollout_percentage`.
- `AuditLogResponse`: Explicitly maps the DB columns to JSON for downstream UIs.

### 3. Dedicated Routers
- **`/api/v1/policies`**:
  - `GET /`: Lists all deployed Rego policies and their active status.
  - `POST /`: Deploys a new policy bundle and handles auto-deactivating old active policies.
- **`/api/v1/approvals`**:
  - `GET /`: Lists all pending operations (for the "Approvals Inbox" UI).
  - `POST /{id}/review`: Accepts `"APPROVED"` or `"REJECTED"`, integrating directly with the `approval_manager`.
- **`/api/v1/audit`**:
  - `GET /logs`: Fetches the `AuditLog` timeline.
  - `GET /decisions`: Fetches the `PolicyDecisionLog` (showing exact risk scores and intent logic).

### 4. Interactive Documentation
Because it uses FastAPI, launching the server automatically exposes the Swagger UI at `http://localhost:8000/docs`, allowing administrators and UI engineers to test the endpoints directly from the browser.
