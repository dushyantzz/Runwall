## 2025-02-23 - Bounds Checking in AST Pow Evaluation
**Vulnerability:** A Denial of Service (DoS) vulnerability existed in `secure_mcp_server/tools.py` because the custom AST evaluator for math operations (`ast.Pow`) only validated the magnitude of the exponent (right-hand side) and failed to validate the base (left-hand side). This allowed for potentially evaluating extremely large base expressions.
**Learning:** Checking only the exponent for powers is insufficient to prevent DoS attacks. Very large bases can also cause the python interpreter to consume large amounts of CPU and memory, crashing the application.
**Prevention:** Always perform strict bounds-checking on both the base and exponent for mathematical power evaluations in custom AST walkers.
## 2025-02-27 - Remove Auto-provisioning of UserSubscriptions

**Vulnerability:** Auto-provisioning logic allowed assigning the `api_key.tier` directly to the `tier` attribute of a newly created `UserSubscription` without verification.
**Learning:** Implicitly trusting mutable object attributes (like `api_key.tier`) when auto-provisioning subscriptions creates a risk of privilege escalation.
**Prevention:** If a subscription record doesn't exist, fail securely rather than attempting to infer or implicitly grant a tier. If auto-provisioning is strictly required, always hardcode the default to the lowest tier (e.g., "free").
## 2025-02-27 - Bounds Checking in AST Pow Evaluation (Update)
**Vulnerability:** A Denial of Service (DoS) vulnerability existed in `secure_mcp_server/tools.py` because the custom AST evaluator for math operations (`ast.Pow`) only validated the magnitude of the exponent (right-hand side) and failed to validate the base (left-hand side). This allowed for potentially evaluating extremely large base expressions.
**Learning:** Checking only the exponent for powers is insufficient to prevent DoS attacks. Very large bases can also cause the python interpreter to consume large amounts of CPU and memory, crashing the application.
**Prevention:** Always perform strict bounds-checking on both the base and exponent for mathematical power evaluations in custom AST walkers.
## 2025-02-27 - Missing Bounds Checking in ast.Call pow()
**Vulnerability:** A Denial of Service (DoS) vulnerability existed in `secure_mcp_server/tools.py` because the custom AST evaluator for math operations evaluated `ast.Call` nodes for the built-in `pow()` and `math.pow()` functions without validating the magnitudes of the base and exponent.
**Learning:** Even if `ast.Pow` is bounded, attackers can bypass it if `pow()` function calls via `ast.Call` are not also strictly bounds-checked. Large base or exponent evaluations can lead to CPU/memory exhaustion and crash the application.
**Prevention:** Always enforce strict bounds-checking on both the base and exponent for all mathematical power evaluation pathways in custom AST walkers, including `ast.Call` nodes.

## 2023-10-15 - [Regex Path Boundaries for Security]
**Vulnerability:** Path blocking regexes that lack strict bounds (like `/?(proc|dev|sys)/` or `/?etc/passwd`) fail to block absolute sensitive device file access (e.g. `/dev/sda`) properly, while simultaneously risking false positives on legitimate directories like `/home/mydev/` if `/?` matches anywhere.
**Learning:** `/?` matches zero or one slashes *anywhere* in the string during a `re.search()`, making it practically useless as an anchor, creating both bypasses and false positives simultaneously.
**Prevention:** Always use strict path boundary anchors `(^|/)` to explicitly match directories either at the root or directly inside a subfolder, instead of loose substring patterns.
## 2025-02-27 - Overly Permissive CORS with Credentials
**Vulnerability:** The CORS configuration in FastAPI used `allow_origin_regex` to match `*.vercel.app` while simultaneously setting `allow_credentials=True`. This permitted any third-party Vercel application to bypass CORS policies and potentially make authenticated cross-origin requests.
**Learning:** Shared application hosting domains like `vercel.app`, `herokuapp.com`, or `github.io` should never be allowed via wildcard regex when credentials are enabled, as attackers can easily register subdomains on these platforms.
**Prevention:** Explicitly list required third-party subdomains (e.g., `runwall.vercel.app`) in the `allow_origins` array instead of using a wildcard regex, and only use wildcard matching for organizational root domains that you strictly control.
