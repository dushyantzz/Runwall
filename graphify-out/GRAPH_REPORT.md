# Graph Report - .  (2026-06-27)

## Corpus Check
- Corpus is ~16,737 words - fits in a single context window. You may not need a graph.

## Summary
- 614 nodes · 974 edges · 44 communities (34 shown, 10 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Session Context & Protocol Management|Session Context & Protocol Management]]
- [[_COMMUNITY_Tool Manager & Tool Registry|Tool Manager & Tool Registry]]
- [[_COMMUNITY_Database Models & Entities|Database Models & Entities]]
- [[_COMMUNITY_Authentication Schemes & Schemas|Authentication Schemes & Schemas]]
- [[_COMMUNITY_Security Policies & Execution Guard|Security Policies & Execution Guard]]
- [[_COMMUNITY_Context Item Storage & Sessions|Context Item Storage & Sessions]]
- [[_COMMUNITY_REST Tool Endpoints & API Schemas|REST Tool Endpoints & API Schemas]]
- [[_COMMUNITY_MCP Protocol Message Handlers|MCP Protocol Message Handlers]]
- [[_COMMUNITY_Built-in Tool Implementations|Built-in Tool Implementations]]
- [[_COMMUNITY_Context Lifecycle & Session Cleanup|Context Lifecycle & Session Cleanup]]
- [[_COMMUNITY_Admin API & System Monitoring|Admin API & System Monitoring]]
- [[_COMMUNITY_Health Checks & Server Config|Health Checks & Server Config]]
- [[_COMMUNITY_Logging & HTTP Request Middleware|Logging & HTTP Request Middleware]]
- [[_COMMUNITY_Metrics Collection & Prometheus Registry|Metrics Collection & Prometheus Registry]]
- [[_COMMUNITY_Rate Limiting & Input Sanitization|Rate Limiting & Input Sanitization]]
- [[_COMMUNITY_Database Manager Connection Pool A|Database Manager Connection Pool A]]
- [[_COMMUNITY_Database Manager Connection Pool B|Database Manager Connection Pool B]]
- [[_COMMUNITY_Secure MCP Server Core Lifecycle|Secure MCP Server Core Lifecycle]]
- [[_COMMUNITY_Configuration & Auth Management|Configuration & Auth Management]]
- [[_COMMUNITY_Session Lifecycle Context Manager|Session Lifecycle Context Manager]]
- [[_COMMUNITY_User Authentication & Permissions Verification|User Authentication & Permissions Verification]]
- [[_COMMUNITY_Package Initializers & Monitoring Metrics|Package Initializers & Monitoring Metrics]]
- [[_COMMUNITY_CLI Tool Serving commands|CLI Tool Serving commands]]
- [[_COMMUNITY_Authentication Manager & Password Hashing|Authentication Manager & Password Hashing]]
- [[_COMMUNITY_System Alerting & Notification Engine|System Alerting & Notification Engine]]
- [[_COMMUNITY_Framework Security Layers|Framework Security Layers]]
- [[_COMMUNITY_Custom Metrics & Alert State Management|Custom Metrics & Alert State Management]]
- [[_COMMUNITY_Resource Monitoring & Health Checks|Resource Monitoring & Health Checks]]
- [[_COMMUNITY_Health Metrics REST Endpoints|Health Metrics REST Endpoints]]
- [[_COMMUNITY_Performance Monitoring Loop|Performance Monitoring Loop]]
- [[_COMMUNITY_Registered Tools List|Registered Tools List]]
- [[_COMMUNITY_Session Expiry & Security Validations|Session Expiry & Security Validations]]
- [[_COMMUNITY_Resource Cleanup & Log Retrievals|Resource Cleanup & Log Retrievals]]
- [[_COMMUNITY_Built-in Tool Initialization|Built-in Tool Initialization]]
- [[_COMMUNITY_Docker Services (Database, Cache, Server)|Docker Services (Database, Cache, Server)]]
- [[_COMMUNITY_API Route Package Initializer|API Route Package Initializer]]
- [[_COMMUNITY_Core MCP Server Components Package|Core MCP Server Components Package]]
- [[_COMMUNITY_Database Package Initializer A|Database Package Initializer A]]
- [[_COMMUNITY_Secure MCP Server Framework Package|Secure MCP Server Framework Package]]
- [[_COMMUNITY_Middleware Package Initializer|Middleware Package Initializer]]
- [[_COMMUNITY_Database Package Initializer B|Database Package Initializer B]]
- [[_COMMUNITY_Grafana Visualization Service|Grafana Visualization Service]]
- [[_COMMUNITY_Prometheus Monitoring Service|Prometheus Monitoring Service]]
- [[_COMMUNITY_FastMCP Configuration|FastMCP Configuration]]

## God Nodes (most connected - your core abstractions)
1. `ToolManager` - 31 edges
2. `SecurityManager` - 28 edges
3. `ContextManager` - 27 edges
4. `AuthManager` - 24 edges
5. `SecurityManager` - 24 edges
6. `MetricsCollector` - 23 edges
7. `ToolRegistry` - 23 edges
8. `MCPProtocolHandler` - 22 edges
9. `Settings` - 22 edges
10. `ContextManager` - 21 edges

## Surprising Connections (you probably didn't know these)
- `FastMCP Runtime Config` --conceptually_related_to--> `Secure MCP Server Framework`  [INFERRED]
  fastmcp.yaml → README.md
- `Settings` --uses--> `Settings`  [INFERRED]
  secure_mcp_server/auth.py → secure_mcp_server/config.py
- `Settings` --uses--> `Settings`  [INFERRED]
  secure_mcp_server/security.py → secure_mcp_server/config.py
- `MCPProtocolHandler` --uses--> `ContextManager`  [INFERRED]
  mcp_server/core/mcp_protocol.py → mcp_server/core/context_manager.py
- `Any` --uses--> `ContextManager`  [INFERRED]
  mcp_server/core/mcp_protocol.py → mcp_server/core/context_manager.py

## Import Cycles
- 1-file cycle: `mcp_server/main.py -> mcp_server/main.py`
- 2-file cycle: `mcp_server/api/health.py -> mcp_server/main.py -> mcp_server/api/health.py`
- 2-file cycle: `mcp_server/api/tools.py -> mcp_server/main.py -> mcp_server/api/tools.py`
- 2-file cycle: `mcp_server/api/admin.py -> mcp_server/main.py -> mcp_server/api/admin.py`
- 2-file cycle: `mcp_server/api/auth.py -> mcp_server/main.py -> mcp_server/api/auth.py`
- 3-file cycle: `mcp_server/api/auth.py -> mcp_server/main.py -> mcp_server/api/tools.py -> mcp_server/api/auth.py`
- 3-file cycle: `mcp_server/api/admin.py -> mcp_server/api/auth.py -> mcp_server/main.py -> mcp_server/api/admin.py`

## Communities (44 total, 10 thin omitted)

### Community 0 - "Session Context & Protocol Management"
Cohesion: 0.08
Nodes (20): ContextManager, Manages context and token usage for MCP sessions., Cleanup the context manager., MCPError, MCPMessage, MCP Protocol handler implementation., Base MCP message structure., Generate a new API key for a user. (+12 more)

### Community 1 - "Tool Manager & Tool Registry"
Cohesion: 0.10
Nodes (15): Load custom tools from plugins directory., Execute a tool with given arguments., Get tool execution statistics., Validate input data against JSON schema., Check if tool execution is within rate limits., Manages tools and their execution., Record tool execution statistics., Echo tool implementation. (+7 more)

### Community 2 - "Database Models & Entities"
Cohesion: 0.11
Nodes (27): Base, APIKey, AuditLog, ContextItem, Database models for MCP Server., Tool execution model., User permission model., Tenant model for multi-tenancy. (+19 more)

### Community 3 - "Authentication Schemes & Schemas"
Cohesion: 0.11
Nodes (26): APIKeyCreate, APIKeyResponse, create_api_key(), get_current_user(), get_security_manager(), get_user_info(), login(), logout() (+18 more)

### Community 4 - "Security Policies & Execution Guard"
Cohesion: 0.11
Nodes (16): Settings, Settings, Manages security policies, input validation, and threat detection., SecurityManager, Any, Execute a tool with security and monitoring., Registry for managing and executing MCP tools., Echo tool implementation. (+8 more)

### Community 5 - "Context Item Storage & Sessions"
Cohesion: 0.09
Nodes (15): ContextItem, Get session context by ID., Add an item to session context., Get a specific context item., Represents a context item in a session., Remove a context item., Get a summary of the session context., Load relevant context items for a query. (+7 more)

### Community 6 - "REST Tool Endpoints & API Schemas"
Cohesion: 0.13
Nodes (24): execute_tool(), get_tool(), get_tool_categories(), get_tool_manager(), get_tool_stat(), get_tool_stats(), list_tools(), Tool management endpoints. (+16 more)

### Community 7 - "MCP Protocol Message Handlers"
Cohesion: 0.12
Nodes (14): MCPProtocolHandler, Handle MCP initialize request., Handle tools/list request., Handle tools/call request., Handle resources/list request., Handle resources/read request., Handle prompts/list request., Handle prompts/get request. (+6 more)

### Community 8 - "Built-in Tool Implementations"
Cohesion: 0.10
Nodes (24): base64_codec(), calculator(), datetime_info(), echo(), json_formatter(), performance_review(), Any, FastMCP Cloud entrypoint.  This file exposes a module-level FastMCP instance ( (+16 more)

### Community 9 - "Context Lifecycle & Session Cleanup"
Cohesion: 0.09
Nodes (13): Clean up a session context., Periodically clean up expired sessions and items., Initialize the context manager., Validate an API key and return user info., Sanitize user input to prevent injection attacks., Log security-relevant events for auditing., Create a new access token., Create a new refresh token. (+5 more)

### Community 10 - "Admin API & System Monitoring"
Cohesion: 0.10
Nodes (22): AlertResponse, enter_maintenance_mode(), exit_maintenance_mode(), get_alerts(), get_system_stats(), list_sessions(), list_tenants(), Terminate a specific session. (+14 more)

### Community 11 - "Health Checks & Server Config"
Cohesion: 0.15
Nodes (16): Health check endpoints., Context management for MCP Server sessions., Monitoring and metrics collection for MCP Server., Security management for MCP Server., Tool management for MCP Server., FastAPI, get_settings(), Configuration management for MCP Server. (+8 more)

### Community 12 - "Logging & HTTP Request Middleware"
Cohesion: 0.09
Nodes (16): BaseHTTPMiddleware, Request, Response, Request, Response, Request, Response, LoggingMiddleware (+8 more)

### Community 13 - "Metrics Collection & Prometheus Registry"
Cohesion: 0.10
Nodes (11): CollectorRegistry, MetricsCollector, Record a request metric., Record a tool execution metric., Update active sessions gauge., Record session duration., Update context metrics for a session., Record authentication attempt. (+3 more)

### Community 14 - "Rate Limiting & Input Sanitization"
Cohesion: 0.10
Nodes (11): Any, Validate if user can access a specific tool., Create a sandboxed execution context for tools., Record a security event for auditing., Get audit events for security analysis., Detect security anomalies in recent events., Calculate overall security score., Get security recommendations based on score. (+3 more)

### Community 15 - "Database Manager Connection Pool A"
Cohesion: 0.14
Nodes (13): AsyncSession, DatabaseManager, get_db_manager(), get_db_session(), Database connection and session management., Dependency for getting database session in FastAPI routes., Manages database connections and sessions., Initialize database connection and create tables. (+5 more)

### Community 16 - "Database Manager Connection Pool B"
Cohesion: 0.14
Nodes (13): AsyncSession, DatabaseManager, get_db_manager(), get_db_session(), Database connection and session management., Dependency for getting database session in FastAPI routes., Manages database connections and sessions., Initialize database connection and create tables. (+5 more)

### Community 17 - "Secure MCP Server Core Lifecycle"
Cohesion: 0.14
Nodes (12): amain(), main(), Register all available tools., Register MCP resources., Register MCP prompts., Initialize all server components., Cleanup server resources., Async entry point for the secure MCP server. (+4 more)

### Community 18 - "Configuration & Auth Management"
Cohesion: 0.21
Nodes (12): BaseSettings, Authentication and authorization management for MCP server., get_settings(), Configuration management for the Secure MCP Server., Application settings with environment variable support., Get application settings (singleton pattern)., Reload settings (useful for testing)., reload_settings() (+4 more)

### Community 19 - "Session Lifecycle Context Manager"
Cohesion: 0.20
Nodes (6): ContextItem, ContextManager, Any, Context management for Secure MCP Server., Manages session contexts, token budgets, and eviction., SessionContext

### Community 20 - "User Authentication & Permissions Verification"
Cohesion: 0.14
Nodes (7): Any, Authenticate user with username and password., Validate an API key and return user info., Extract user context from MCP request., Check if user has a specific permission., Verify a password against its hash., Verify and decode a JWT token.

### Community 21 - "Package Initializers & Monitoring Metrics"
Cohesion: 0.18
Nodes (5): Package init for secure_mcp_server., MetricsCollector, Any, Monitoring and metrics collection for Secure MCP Server., Lightweight metrics and health tracker (no external server needed).

### Community 22 - "CLI Tool Serving commands"
Cohesion: 0.15
Nodes (11): init_db(), list_tools(), main(), Command-line interface for MCP Server., Show server status and configuration., Main CLI entry point., Start the MCP server., Initialize the database. (+3 more)

### Community 23 - "Authentication Manager & Password Hashing"
Cohesion: 0.21
Nodes (8): AuthManager, MetricsCollector, AuthManager, Settings, Create a new API key for a user., Manages authentication and user context for MCP requests., Hash a password using bcrypt., SecurityManager

### Community 24 - "System Alerting & Notification Engine"
Cohesion: 0.24
Nodes (5): AlertManager, Manages alerts and notifications., Evaluate all alert rules against current metrics., Send alert notification., Send alert resolution notification.

### Community 25 - "Framework Security Layers"
Cohesion: 0.22
Nodes (9): FastMCP Runtime Config, Audit Logging, Authentication Security Layer, Authorization Security Role-based Access, Input Validation & Sanitization, Rate Limiting Layer, Tool Sandboxing, Secure MCP Server Framework (+1 more)

### Community 26 - "Custom Metrics & Alert State Management"
Cohesion: 0.25
Nodes (4): Get a custom metric value., Set a custom metric value., Get list of active alerts., Any

### Community 27 - "Resource Monitoring & Health Checks"
Cohesion: 0.25
Nodes (4): Update memory usage metric., Detect anomalies in metrics data., Get overall health status., Main monitoring loop.

### Community 28 - "Health Metrics REST Endpoints"
Cohesion: 0.33
Nodes (7): detailed_health_check(), health_check(), health_metrics(), Basic health check endpoint., Detailed health check with component status., Health metrics endpoint., Any

### Community 29 - "Performance Monitoring Loop"
Cohesion: 0.29
Nodes (4): PerformanceMonitor, Monitors system performance and resource usage., Start performance monitoring., Stop performance monitoring.

### Community 30 - "Registered Tools List"
Cohesion: 0.29
Nodes (4): Represents a tool that can be executed., Get list of available tools for a user/tenant., List all registered tools., Tool

### Community 31 - "Session Expiry & Security Validations"
Cohesion: 0.33
Nodes (3): Validate message security and permissions., Clean up expired session., Clean up all expired sessions.

### Community 32 - "Resource Cleanup & Log Retrievals"
Cohesion: 0.40
Nodes (5): cleanup_resources(), get_recent_logs(), Cleanup expired resources., Get recent system logs., Any

### Community 34 - "Docker Services (Database, Cache, Server)"
Cohesion: 0.67
Nodes (3): PostgreSQL Database Service, MCP Server Service, Redis Cache Service

## Knowledge Gaps
- **24 isolated node(s):** `OAuth2PasswordRequestForm`, `Settings`, `CollectorRegistry`, `Settings`, `Settings` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Settings` connect `Configuration & Auth Management` to `Security Policies & Execution Guard`, `Rate Limiting & Input Sanitization`, `Secure MCP Server Core Lifecycle`, `User Authentication & Permissions Verification`, `Authentication Manager & Password Hashing`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `Settings` connect `Health Checks & Server Config` to `Configuration & Auth Management`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Why does `SecurityManager` connect `Session Context & Protocol Management` to `Authentication Schemes & Schemas`, `REST Tool Endpoints & API Schemas`, `MCP Protocol Message Handlers`, `Context Lifecycle & Session Cleanup`, `Health Checks & Server Config`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `ToolManager` (e.g. with `MCPError` and `MCPMessage`) actually correct?**
  _`ToolManager` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `SecurityManager` (e.g. with `MCPError` and `MCPMessage`) actually correct?**
  _`SecurityManager` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `ContextManager` (e.g. with `MCPError` and `MCPMessage`) actually correct?**
  _`ContextManager` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `AuthManager` (e.g. with `AuthManager` and `MetricsCollector`) actually correct?**
  _`AuthManager` has 8 INFERRED edges - model-reasoned connections that need verification._