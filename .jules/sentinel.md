## 2024-11-20 - [Hardcoded Database Credentials]
**Vulnerability:** Found a hardcoded `database_url` with plaintext credentials in `secure_mcp_server/config.py`.
**Learning:** Hardcoded database URLs with real credentials in default fields for Pydantic Settings lead to credential leakage.
**Prevention:** Do not hardcode production database connection strings with plaintext credentials (e.g., Supabase URLs) in code or Pydantic default fields. Use safe local placeholders (e.g., `postgresql+asyncpg://postgres:postgres@localhost:5432/mcp_db`) and rely on environment variables for production connections.
