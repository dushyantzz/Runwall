## 2024-05-18 - Hardcoded Secrets in Configuration
**Vulnerability:** Hardcoded `secret_key` and `admin_password` defaults in `secure_mcp_server/config.py`.
**Learning:** Hardcoded defaults for sensitive Pydantic fields can lead to production vulnerabilities if environment variables are accidentally omitted.
**Prevention:** Always use a secure fallback mechanism like `default_factory=lambda: secrets.token_urlsafe(32)` instead of static strings for sensitive fields in Pydantic `BaseSettings`.
