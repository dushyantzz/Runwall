# Enterprise API Key Management

## Overview

The Enterprise API Key Management module transitions the Secure MCP Server from simple format-based API key checking to a robust, scalable, and highly secure lifecycle management system for machine-to-machine (M2M) communications and programmatic access.

## Why it is Implemented

Basic API key management (where a key is just a long string) is insufficient for enterprise compliance (e.g., SOC2, ISO 27001). Enterprises require:
1. **Granular Access Controls**: Keys must be bound to specific tenants, IPs, and environments.
2. **Blast Radius Containment**: If a key is leaked, its potential impact must be restricted by scopes, IP allowlists, and rate limits.
3. **Traceability**: Every API action must be mapped to an exact key and identity (human or service account).
4. **Lifecycle Operations**: Security teams must be able to securely issue, rotate, and emergency-revoke keys without disrupting operations.

## Why it is Unique & Production Ready

### 1. Robust Identity Binding (`ServiceAccount`)
Instead of tying all API keys to human users, this implementation introduces a dedicated `ServiceAccount` model. This allows for separation of concerns between human actions and automated workflows, ensuring that offboarding an employee does not break production systems.

### 2. Cryptographic Security (Hashed Storage & One-Time Reveal)
Raw API key secrets are **never** stored in the database. When a key is created, the system generates a secure 32-byte url-safe token and stores its **SHA-256 hash**. The raw secret is returned to the user only once. The database also stores an 8-character prefix (e.g., `mcp_abcdefgh`) to allow users to identify the key in the UI without exposing the secret.

### 3. Strict Context Bounds (IP Allowlisting & Environment Binding)
API Keys are not globally valid. When validated, the engine evaluates:
- **Environment**: A key issued for `staging` cannot be used to authenticate against the `production` environment.
- **IP Allowlists**: Using CIDR notation, keys can be locked to specific network origins (e.g., a corporate VPN or a specific AWS VPC).

### 4. Zero-Downtime Rotation
The `rotate_api_key` function generates a new secret and immediately disables the old key while inheriting all permissions, bindings, and tenant scopes. This enables automated zero-downtime rotation patterns.

### 5. Anomaly Detection Engine
A sliding-window anomaly detector in `SecurityManager` monitors key usage velocity. If a key experiences an unexpected burst in usage (e.g., >100 requests in 60 seconds), it automatically fires a high-priority `key_usage_anomaly` audit event. In the future, this can be hooked into an automated temporary block.

## Architecture

1. **Database Models (`models.py`)**:
   - `ServiceAccount`: Dedicated M2M identity.
   - `APIKey`: Enhanced with `tenant_id`, `service_account_id`, `allowed_ips` (JSON), `environment`, `prefix`, and `key_hash`.
2. **Authentication Middleware (`main.py`)**: Intercepts requests, extracts IPs (supporting proxies via `X-Forwarded-For`), and evaluates the key context dynamically against the environment settings.
3. **Auth Engine (`auth.py`)**: 
   - `validate_api_key`: Performs the cryptographic validation and enforces network bounds.
   - `revoke_api_key`: Provides instant emergency invalidation.
4. **Security Engine (`security.py`)**: Monitors the request stream in real-time for anomalous usage patterns using a 60-second sliding window mechanism.
