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
