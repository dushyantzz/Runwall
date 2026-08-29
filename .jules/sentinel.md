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

## 2026-08-21 - Path Traversal in OPA Evaluator
**Vulnerability:** The `tenant_id` was directly interpolated into the `policy_file_path` without sanitization in `secure_mcp_server/governance/opa_evaluator.py`, leading to a path traversal vulnerability.
**Learning:** User-provided inputs, even implicit ones like `tenant_id`, must be sanitized before being used in file system operations like `os.path.join`.
**Prevention:** Always sanitize inputs meant for file paths by removing unsafe characters (e.g., using `re.sub(r"[^a-zA-Z0-9_-]", "", input)`).

## 2024-05-18 - Replacing Insecure Python eval()
**Vulnerability:** A `_calculator_tool` implementation used Python's native `eval()` function with an allowed-characters regex filter. However, `eval()` is notoriously difficult to sandbox and often leads to arbitrary code execution (RCE) and trivial Denial of Service (DoS, e.g. via `9**9**9` or sequence multiplication `[1]*10**9`).
**Learning:** Even with strict character limits, `eval()` presents critical security risks in Python, and simple regular expressions or disabled namespaces (`__builtins__: {}`) cannot reliably stop DoS or edge-case bypasses. Furthermore, using AST-based parsers naively may still permit memory exhaustion if you permit `ast.List` alongside multiplication, allowing `[1] * large_num`.
**Prevention:** Eliminate `eval()`. Use the `ast` module to construct a rigid Abstract Syntax Tree (AST) node visitor (`ast.NodeVisitor` or custom walker). Whitelist strictly safe mathematical operators (`ast.Add`, `ast.Sub`, etc.), explicitly reject unneeded types like `ast.List`, and strictly cap memory-intensive operations (e.g. `ast.Pow` right-side values should be limited).
## 2024-05-18 - Overly Permissive CORS Configuration
**Vulnerability:** FastAPI's `CORSMiddleware` was configured with `allow_origins=["*"]` and `allow_credentials=True`.
**Learning:** Using a wildcard for allowed origins along with allowing credentials is a security risk as it permits any website to make authenticated requests to the API on behalf of the user, leading to cross-origin attacks (like CSRF). Moreover, modern browsers and FastAPI block this specific combination.
**Prevention:** Always specify an explicit list of allowed origins in CORS configuration. Ensure this list is manageable via environment variables for different environments instead of hardcoding `*`.
## 2025-02-28 - Restrict CORS Configuration
**Vulnerability:** FastAPIs CORSMiddleware configuration was pulling `allow_origins` directly from the environment variables while hardcoding `allow_credentials=True`.
**Learning:** If the environment supplies `['*']` as the allowed origin when credentials are permitted, it violates the CORS specification and exposes the system to CSRF vulnerabilities and data exfiltration.
**Prevention:** Filter out wildcard characters `*` from `allowed_origins` before configuring CORS middleware when `allow_credentials` is `True`. Implement a safe fallback, like localhost, if the filtered list ends up empty.
