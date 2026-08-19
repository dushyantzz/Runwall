## 2024-05-18 - Hardcoded Secrets in Configuration
**Vulnerability:** Hardcoded `secret_key` and `admin_password` defaults in `secure_mcp_server/config.py`.
**Learning:** Hardcoded defaults for sensitive Pydantic fields can lead to production vulnerabilities if environment variables are accidentally omitted.
**Prevention:** Always use a secure fallback mechanism like `default_factory=lambda: secrets.token_urlsafe(32)` instead of static strings for sensitive fields in Pydantic `BaseSettings`.

## 2026-08-14 - Command Injection in OPA Evaluator
**Vulnerability:** The `policy_file_path` derived from user input (`tenant_id`) was directly interpolated into a shell command in `asyncio.create_subprocess_shell` without sanitization in `secure_mcp_server/governance/opa_evaluator.py`.
**Learning:** Shell command construction using string formatting is highly susceptible to command injection if any part of the string contains unescaped user-controlled input.
**Prevention:** Always use `shlex.quote` to properly escape variables before interpolating them into shell commands, or avoid `shell=True`/`create_subprocess_shell` entirely and pass the command and arguments as a list to `create_subprocess_exec`.

## 2026-08-18 - Command Injection Vulnerability in ShellConnector
**Vulnerability:** The `ShellConnector` in `secure_mcp_server/connectors/shell.py` used `asyncio.create_subprocess_shell` with unsanitized user input (`command`), leading to a critical command injection risk.
**Learning:** Using `shell=True` (or `create_subprocess_shell`) with user-provided arguments evaluates shell metacharacters, allowing attackers to execute arbitrary commands (e.g., using `;` or `&&`).
**Prevention:** Always use `asyncio.create_subprocess_exec` (or `subprocess.run` without `shell=True`) and parse arguments securely using `shlex.split()`.
## 2024-05-18 - Command Injection Risk in OPA Evaluator
**Vulnerability:** `asyncio.create_subprocess_shell` was used with a path containing a tenant ID, presenting a risk of command injection, despite `shlex.quote`.
**Learning:** Even with escaping, using `shell=True` or `create_subprocess_shell` is risky when dealing with dynamic inputs. Passing arguments as an array to `create_subprocess_exec` is a much stronger defense as it bypasses shell interpretation entirely.
**Prevention:** Always use `asyncio.create_subprocess_exec` with an explicit list of arguments rather than interpolating strings for shell commands.
