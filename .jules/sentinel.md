## 2024-11-20 - [Hardcoded Database Credentials]
**Vulnerability:** Found a hardcoded `database_url` with plaintext credentials in `secure_mcp_server/config.py`.
**Learning:** Hardcoded database URLs with real credentials in default fields for Pydantic Settings lead to credential leakage.
**Prevention:** Do not hardcode production database connection strings with plaintext credentials (e.g., Supabase URLs) in code or Pydantic default fields. Use safe local placeholders (e.g., `postgresql+asyncpg://postgres:postgres@localhost:5432/mcp_db`) and rely on environment variables for production connections.
## 2026-08-31 - Overly Permissive CORS Regex Vulnerability
**Vulnerability:** The CORS configuration in FastAPI's `CORSMiddleware` used an `allow_origin_regex` lacking strict beginning (`^`) and end (`$`) anchors (e.g., `allow_origin_regex=r"https://.*\.vercel\.app"`).
**Learning:** In Python's `re.match` (which FastAPI uses for CORS regex matching), the pattern matches from the beginning but doesn't require matching to the end unless `$` is specified. This allows attackers to bypass CORS by registering a malicious domain that incorporates the allowed domain as a subdomain (e.g., `https://legit.vercel.app.attacker.com`) or by appending unexpected suffixes.
**Prevention:** Always use strict `^` and `$` anchors in CORS regex patterns, and be precise with wildcards (e.g., `([a-zA-Z0-9-]+\.)*` instead of `.*`) to ensure exact origin matching.
