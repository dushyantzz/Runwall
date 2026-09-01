## 2025-02-23 - Bounds Checking in AST Pow Evaluation
**Vulnerability:** A Denial of Service (DoS) vulnerability existed in `secure_mcp_server/tools.py` because the custom AST evaluator for math operations (`ast.Pow`) only validated the magnitude of the exponent (right-hand side) and failed to validate the base (left-hand side). This allowed for potentially evaluating extremely large base expressions.
**Learning:** Checking only the exponent for powers is insufficient to prevent DoS attacks. Very large bases can also cause the python interpreter to consume large amounts of CPU and memory, crashing the application.
**Prevention:** Always perform strict bounds-checking on both the base and exponent for mathematical power evaluations in custom AST walkers.
