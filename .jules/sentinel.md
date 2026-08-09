## 2025-05-15 - [Hardcoded Database Credentials]
**Vulnerability:** Found a hardcoded PostgreSQL connection string containing a plain-text password (`Daredevil@9451856439`) for Supabase in `secure_mcp_server/config.py` default settings.
**Learning:** Hardcoding credentials in source code exposes production databases to anyone with access to the codebase. It represents a critical security risk.
**Prevention:** Always use environment variables for sensitive configuration like database URLs, API keys, and secret keys. Set safe, local defaults (e.g., `sqlite+aiosqlite:///./mcp_server.db`) for development or fallback configurations.
