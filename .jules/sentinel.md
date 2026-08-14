## 2024-05-18 - Hardcoded Secrets in Configuration
**Vulnerability:** Hardcoded `secret_key` and `admin_password` defaults in `secure_mcp_server/config.py`.
**Learning:** Hardcoded defaults for sensitive Pydantic fields can lead to production vulnerabilities if environment variables are accidentally omitted.
**Prevention:** Always use a secure fallback mechanism like `default_factory=lambda: secrets.token_urlsafe(32)` instead of static strings for sensitive fields in Pydantic `BaseSettings`.

## 2026-08-14 - Command Injection in OPA Evaluator
**Vulnerability:** The `policy_file_path` derived from user input (`tenant_id`) was directly interpolated into a shell command in `asyncio.create_subprocess_shell` without sanitization in `secure_mcp_server/governance/opa_evaluator.py`.
**Learning:** Shell command construction using string formatting is highly susceptible to command injection if any part of the string contains unescaped user-controlled input.
**Prevention:** Always use `shlex.quote` to properly escape variables before interpolating them into shell commands, or avoid `shell=True`/`create_subprocess_shell` entirely and pass the command and arguments as a list to `create_subprocess_exec`.
