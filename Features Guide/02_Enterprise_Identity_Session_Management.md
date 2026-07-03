# Enterprise Identity & Session Management

## Overview

The Enterprise Identity and Session Management feature transitions the Secure MCP Server from a hardcoded, in-memory authentication mechanism to a robust, database-backed enterprise identity system. This aligns the platform with production-grade requirements akin to those found in systems like Okta, HashiCorp Vault, and Kubernetes.

## Why it is Implemented

Enterprise systems require resilient, scalable, and secure methods to identify who or what is interacting with the platform. Storing credentials in memory or using hardcoded tokens is unacceptable for production. 
This feature was implemented to:
1. **Ensure Persistence & Durability**: Identity state (users, active sessions, revoked tokens) must survive server restarts.
2. **Enable Auditability**: Every action needs to be tied to a cryptographically verified identity for compliance.
3. **Mitigate Identity Risks**: Features like automated account lockout and JTI-based token revocation are required to neutralize compromised credentials instantly.

## Why it is Unique & Production Ready

This implementation is unique because it combines several enterprise patterns into a lightweight, high-performance module designed specifically for the Model Context Protocol (MCP) ecosystem:

### 1. Robust Password Security
Instead of basic hashing, it uses **bcrypt** with randomly generated salts per user. This drastically increases the computational cost for attackers attempting rainbow table or brute-force attacks against the database.

### 2. Dual-Token Architecture (Access & Refresh)
The system issues short-lived Access Tokens (JWTs) and long-lived Refresh Tokens. This limits the blast radius of a stolen access token to mere minutes while maintaining a seamless user experience.

### 3. JTI-Based Stateless Revocation
Traditional JWTs cannot be easily revoked before they expire because they are stateless. This system implements a JTI (JWT ID) claim and a high-speed database revocation list (`TokenRevocation`). When a user logs out or a breach is detected, the JTI is blacklisted, immediately invalidating the token globally.

### 4. Automated Account Lockout
To prevent credential stuffing and brute-force attacks, the `AuthManager` tracks `failed_login_attempts`. If a threshold is reached (e.g., 5 attempts), the account is locked for a specific duration (`locked_until`), neutralizing the attack vector.

### 5. SSO / OIDC Just-In-Time (JIT) Provisioning
The architecture includes stubs for Single Sign-On (SSO) abstractions. It supports JIT provisioning, meaning users authenticating via a trusted external Identity Provider (IdP) are automatically provisioned in the local database with a secure, random local password, enabling seamless onboarding.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   MCP Request (FastMCP)                     │
│  Headers: Authorization: Bearer <token>                     │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Auth Middleware (main.py)                                  │
│  ├── Intercepts Request                                     │
│  └── Calls AuthManager.get_user_context()                   │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthManager Engine (auth.py)                               │
│  ├── Validates JWT or API Key                               │
│  ├── Checks TokenRevocation blacklist                       │
│  ├── Checks User Lockout (locked_until)                     │
│  └── Retrieves User Identity Context                        │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Governance & Execution Pipeline                            │
│  (Proceeds with validated User Context)                     │
└─────────────────────────────────────────────────────────────┘
```

1. **Database Models**: 
   - `User`: Stores identity data, `auth_provider`, `failed_login_attempts`, and `locked_until`.
   - `Session`: Tracks active sessions, binding them to network metadata (IP, User Agent).
   - `TokenRevocation`: A blacklist for revoked JWTs.
2. **AuthManager**: An asynchronous, stateless service that handles password verification, JWT generation, revocation checks, and JIT provisioning.
3. **CLI Bootstrap**: Provides an offline mechanism to provision the initial `admin` user securely, ensuring the system cannot be hijacked on first boot.
4. **Middleware Integration**: The `AuthManager` is tightly coupled with the FastMCP request pipeline, extracting context from headers and enriching every request with a validated `user_context` before it reaches the Governance Engine.
