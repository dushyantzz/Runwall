"""
Intent Classifier — deterministic intent analysis for tool invocations.

Analyses ``tool_name``, ``parameters``, and optional tool-metadata
annotations to produce an :class:`IntentClassification` that captures
*what* the caller intends to do and *how broad* the impact would be.

This classifier is entirely rule-based (no LLM dependency) so it can run
at request-time with sub-millisecond latency.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Set

import structlog

from .intent_types import (
    BlastRadius,
    IntentCategory,
    IntentClassification,
    ResourceSensitivity,
)

logger = structlog.get_logger()


# ---------------------------------------------------------------------------
# Pattern registries (compiled once at import time)
# ---------------------------------------------------------------------------

_DESTRUCTIVE_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bdelete\b",
        r"\bdrop\b",
        r"\btruncate\b",
        r"\bremove\b",
        r"\bpurge\b",
        r"\bdestroy\b",
        r"\brevoke\b",
        r"\bterminate\b",
        r"\bwipe\b",
        r"\bformat\b",
    )
]

_EXPORT_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bexport\b",
        r"\bdownload\b",
        r"\bdump\b",
        r"\bbackup\b",
        r"\bextract\b",
        r"\bmigrate\b",
    )
]

_WRITE_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bupdate\b",
        r"\bset\b",
        r"\bmodify\b",
        r"\bchange\b",
        r"\bpatch\b",
        r"\bedit\b",
        r"\brename\b",
        r"\bcreate\b",
        r"\binsert\b",
        r"\badd\b",
        r"\bwrite\b",
        r"\bput\b",
        r"\bpost\b",
    )
]

_ADMIN_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\badmin\b",
        r"\bsystem\b",
        r"\bconfig(ure)?\b",
        r"\bmanage\b",
        r"\bgrant\b",
        r"\brole\b",
        r"\bpermission\b",
        r"\bprovision\b",
        r"\bdeploy\b",
        r"\bscale\b",
        r"\brestart\b",
        r"\bshutdown\b",
    )
]

# Shell / code execution patterns — detected in argument values
_EXECUTE_SHELL_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\brm\s+-rf\b",         # rm -rf
        r"\beval\s*\(",           # eval(
        r"\bexec\s*\(",           # exec(
        r"\bos\.system\s*\(",     # os.system(
        r"\bsubprocess\b",        # subprocess
        r"\b/bin/(sh|bash|zsh)\b",# shell invocation
        r"\bcurl\s+http",         # curl http
        r"\bwget\s+http",         # wget http
        r"\bchmod\s+[0-9]+",      # chmod 777
        r"\bchown\b",             # chown
        r"\bnc\s+-\w+",           # netcat reverse shell
        r"\bpython[23]?\s+-c\b",  # python -c
        r"\bnode\s+-e\b",         # node -e
    )
]

# Dangerous argument content patterns — used to upgrade risk regardless of tool name
_DANGEROUS_CONTENT_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"rm\s+-rf",
        r"DROP\s+TABLE",
        r"DROP\s+DATABASE",
        r"TRUNCATE\s+TABLE",
        r"DELETE\s+FROM",
        r"/etc/(passwd|shadow|sudoers)",
        r"/dev/(null|zero|urandom|sda)",
        r"eval\s*\(",
        r"exec\s*\(",
        r"__import__",
        r"os\.system",
        r"subprocess\.call",
        r"base64\.decode",
        r"'; DROP",               # Classic SQL injection
        r"UNION SELECT",
        r"INSERT INTO.*--",
    )
]

_READ_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bread\b",
        r"\bget\b",
        r"\bfetch\b",
        r"\blist\b",
        r"\bshow\b",
        r"\bview\b",
        r"\bquery\b",
        r"\bsearch\b",
        r"\blookup\b",
        r"\bdescribe\b",
        r"\binspect\b",
        r"\binfo\b",
        r"\bstatus\b",
        r"\bcheck\b",
    )
]

# Parameters that hint at PII / sensitive data
_PII_PARAM_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bssn\b",
        r"\bsocial.?security\b",
        r"\bcredit.?card\b",
        r"\bpassword\b",
        r"\bsecret\b",
        r"\btoken\b",
        r"\bapi.?key\b",
        r"\bprivate.?key\b",
        r"\baccount.?number\b",
        r"\bbank\b",
        r"\bsalary\b",
        r"\bphone\b",
        r"\bemail\b",
        r"\baddress\b",
        r"\bdate.?of.?birth\b",
        r"\bdob\b",
        r"\bmedical\b",
        r"\bhealth\b",
        r"\bdiagnos\b",
    )
]

# Parameters that hint at bulk / high-volume operations
_BULK_PARAM_KEYS: Set[str] = {
    "limit",
    "count",
    "batch_size",
    "page_size",
    "max_records",
    "num_records",
    "quantity",
    "offset",
    "all",
    "ids",
}

# Numeric thresholds for "bulk" detection
_BULK_THRESHOLD = 100


class IntentClassifier:
    """
    Deterministic intent classifier for tool invocations.

    The classifier inspects three sources of signal:

    1. **Tool name** — matched against category-specific regex patterns.
    2. **Parameters** — scanned for PII keys, high numeric values, wildcard
       selectors, and bulk-operation hints.
    3. **Tool metadata annotations** (optional) — when the tool registration
       includes ``sensitivity_level``, ``resource_types``, or
       ``parameter_risk_annotations``, those are authoritative and override
       the heuristic analysis.

    Usage::

        classifier = IntentClassifier()
        classification = classifier.classify(
            tool_name="export_customers",
            parameters={"limit": 50000, "format": "csv"},
            tool_metadata={"sensitivity_level": "confidential"},
        )
    """

    def classify(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        tool_metadata: Optional[Dict[str, Any]] = None,
    ) -> IntentClassification:
        """Classify the intent of a tool call.

        Parameters
        ----------
        tool_name:
            Registered name of the tool (e.g. ``"export_customers"``).
        parameters:
            Arguments the caller supplied to the tool.
        tool_metadata:
            Optional metadata dict from the tool registry that may include
            governance annotations such as ``sensitivity_level``,
            ``resource_types``, ``parameter_risk_annotations``.

        Returns
        -------
        IntentClassification
            A fully-populated classification value object.
        """
        tool_metadata = tool_metadata or {}

        # --- 1. Classify intent category -----------------------------------
        intent = self._classify_category(tool_name, parameters, tool_metadata)

        # --- 2. Detect destructive / bulk flags ----------------------------
        is_destructive = self._is_destructive(tool_name, parameters)
        is_bulk = self._is_bulk_operation(parameters, tool_metadata)

        # --- 3. Determine blast radius -------------------------------------
        blast_radius = self._compute_blast_radius(
            intent, is_destructive, is_bulk, parameters, tool_metadata,
        )

        # --- 4. Determine resource sensitivity -----------------------------
        resource_sensitivity = self._compute_resource_sensitivity(
            parameters, tool_metadata,
        )

        # --- 5. Detect affected resources and parameter flags ---------------
        affected_resources = self._detect_affected_resources(
            tool_name, parameters, tool_metadata,
        )
        parameter_flags = self._detect_parameter_flags(parameters)

        # --- 6. Build result -----------------------------------------------
        classification = IntentClassification(
            tool_name=tool_name,
            intent_category=intent,
            blast_radius=blast_radius,
            resource_sensitivity=resource_sensitivity,
            is_destructive=is_destructive,
            is_bulk_operation=is_bulk,
            affected_resource_types=affected_resources,
            parameter_flags=parameter_flags,
            confidence=self._compute_confidence(intent, tool_metadata),
        )

        logger.debug(
            "Intent classified",
            tool_name=tool_name,
            intent=intent.value,
            blast_radius=blast_radius.value,
            sensitivity=resource_sensitivity.value,
            destructive=is_destructive,
            bulk=is_bulk,
        )

        return classification

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_for_matching(tool_name: str, parameters: Dict[str, Any]) -> str:
        """Normalise tool name and parameter values into a matchable string.

        Replaces underscores, hyphens, and camelCase boundaries with spaces
        so that word-boundary regex patterns (``\\bdelete\\b``) match tool
        names like ``delete_records`` or ``deleteRecords``.
        """
        # Replace separators with spaces
        name = re.sub(r"[_\-]+", " ", tool_name)
        # Split camelCase: "deleteRecords" → "delete Records"
        name = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)
        param_str = " ".join(str(v) for v in parameters.values())
        return f"{name} {param_str}"

    def _classify_category(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        tool_metadata: Dict[str, Any],
    ) -> IntentCategory:
        """Determine the high-level intent category.

        Two-pass classification:
        1. Tool-name + structural parameter matching (original logic).
        2. Argument value content scan — upgrades the category if dangerous
           patterns are detected in any string argument, regardless of the
           tool name.  This ensures that a harmless-sounding tool like
           ``calculator(expression="rm -rf /")`` is correctly classified as
           EXECUTE/DELETE instead of READ.
        """
        # Authoritative override from tool metadata
        explicit = tool_metadata.get("intent_category")
        if explicit:
            try:
                return IntentCategory(explicit)
            except ValueError:
                pass

        combined = self._normalize_for_matching(tool_name, parameters)

        # Pass 1: match on tool name + all parameter values (original logic)
        # Order matters: check most specific/dangerous first
        if any(p.search(combined) for p in _DESTRUCTIVE_PATTERNS):
            base_category = IntentCategory.DELETE
        elif any(p.search(combined) for p in _EXPORT_PATTERNS):
            base_category = IntentCategory.EXPORT
        elif any(p.search(combined) for p in _ADMIN_PATTERNS):
            base_category = IntentCategory.ADMIN
        elif any(p.search(combined) for p in _WRITE_PATTERNS):
            base_category = IntentCategory.WRITE
        elif any(p.search(combined) for p in _READ_PATTERNS):
            base_category = IntentCategory.READ
        else:
            base_category = IntentCategory.EXECUTE

        # Pass 2: scan argument STRING VALUES for dangerous content
        # This catches cases like calculator(expression="DROP TABLE users")
        arg_str = " ".join(
            str(v) for v in parameters.values() if isinstance(v, str)
        )
        if arg_str:
            # Dangerous shell/destructive content in args -> upgrade to DELETE/EXECUTE
            if any(p.search(arg_str) for p in _DESTRUCTIVE_PATTERNS):
                if base_category not in (IntentCategory.DELETE, IntentCategory.EXECUTE):
                    return IntentCategory.DELETE
            if any(p.search(arg_str) for p in _EXECUTE_SHELL_PATTERNS):
                if base_category not in (IntentCategory.DELETE,):
                    return IntentCategory.EXECUTE
            if any(p.search(arg_str) for p in _DANGEROUS_CONTENT_PATTERNS):
                # Dangerous content found — escalate to at least EXECUTE
                _escalation_order = [
                    IntentCategory.READ,
                    IntentCategory.WRITE,
                    IntentCategory.EXPORT,
                    IntentCategory.EXECUTE,
                    IntentCategory.CONFIGURE,
                    IntentCategory.ADMIN,
                    IntentCategory.DELETE,
                ]
                if base_category in (
                    IntentCategory.READ, IntentCategory.WRITE
                ):
                    return IntentCategory.EXECUTE

        return base_category

    def _is_destructive(
        self, tool_name: str, parameters: Dict[str, Any],
    ) -> bool:
        combined = self._normalize_for_matching(tool_name, parameters)
        return any(p.search(combined) for p in _DESTRUCTIVE_PATTERNS)

    def _is_bulk_operation(
        self,
        parameters: Dict[str, Any],
        tool_metadata: Dict[str, Any],
    ) -> bool:
        # Explicit metadata flag
        if tool_metadata.get("is_bulk"):
            return True

        # Check for high numeric values in bulk-related parameters
        for key, value in parameters.items():
            if key.lower() in _BULK_PARAM_KEYS:
                try:
                    if int(value) >= _BULK_THRESHOLD:
                        return True
                except (ValueError, TypeError):
                    pass
            # Check for list parameters with many items
            if isinstance(value, list) and len(value) >= _BULK_THRESHOLD:
                return True

        # Check for wildcard / "all" selectors
        for value in parameters.values():
            if isinstance(value, str) and value.strip().lower() in ("*", "all", "any"):
                return True

        return False

    def _compute_blast_radius(
        self,
        intent: IntentCategory,
        is_destructive: bool,
        is_bulk: bool,
        parameters: Dict[str, Any],
        tool_metadata: Dict[str, Any],
    ) -> BlastRadius:
        # Authoritative override
        explicit = tool_metadata.get("blast_radius")
        if explicit:
            try:
                return BlastRadius(explicit)
            except ValueError:
                pass

        # Admin / configure actions are system-wide by nature
        if intent in (IntentCategory.ADMIN, IntentCategory.CONFIGURE):
            return BlastRadius.SYSTEM_WIDE

        # Destructive + bulk = table-level at minimum
        if is_destructive and is_bulk:
            return BlastRadius.SYSTEM_WIDE
        if is_destructive:
            return BlastRadius.TABLE_LEVEL
        if is_bulk:
            return BlastRadius.MULTI_RECORD

        # Export could affect many records
        if intent == IntentCategory.EXPORT:
            return BlastRadius.MULTI_RECORD

        # Single-record operations
        if intent in (IntentCategory.READ, IntentCategory.WRITE):
            # If there's a specific ID, it's single-record
            for key in ("id", "record_id", "item_id", "uuid", "key"):
                if key in parameters:
                    return BlastRadius.SINGLE_RECORD
            return BlastRadius.MULTI_RECORD

        return BlastRadius.NONE

    def _compute_resource_sensitivity(
        self,
        parameters: Dict[str, Any],
        tool_metadata: Dict[str, Any],
    ) -> ResourceSensitivity:
        # Authoritative override
        explicit = tool_metadata.get("sensitivity_level")
        if explicit:
            try:
                return ResourceSensitivity(explicit)
            except ValueError:
                pass

        # Scan parameter keys and values for PII hints
        param_str = " ".join(
            f"{k} {v}" for k, v in parameters.items() if isinstance(v, str)
        )
        param_keys = " ".join(parameters.keys())
        combined = f"{param_keys} {param_str}"

        pii_hits = sum(1 for p in _PII_PARAM_PATTERNS if p.search(combined))

        if pii_hits >= 3:
            return ResourceSensitivity.RESTRICTED
        if pii_hits >= 2:
            return ResourceSensitivity.CONFIDENTIAL
        if pii_hits >= 1:
            return ResourceSensitivity.INTERNAL
        return ResourceSensitivity.PUBLIC

    def _detect_affected_resources(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        tool_metadata: Dict[str, Any],
    ) -> List[str]:
        # Authoritative source
        if tool_metadata.get("resource_types"):
            return list(tool_metadata["resource_types"])

        # Heuristic: extract noun-like segments from the tool name
        resources: List[str] = []
        # Split on underscores and non-alphanumeric
        parts = re.split(r"[_\-\s]+", tool_name.lower())
        # Filter out common action verbs
        action_words = {
            "get", "set", "list", "create", "update", "delete", "export",
            "import", "read", "write", "fetch", "search", "find", "check",
            "add", "remove", "process", "execute", "run", "generate", "tool",
        }
        for part in parts:
            if part and part not in action_words and len(part) > 2:
                resources.append(part)

        return resources

    def _detect_parameter_flags(
        self, parameters: Dict[str, Any],
    ) -> Dict[str, Any]:
        flags: Dict[str, Any] = {}

        # PII presence
        param_str = " ".join(
            f"{k} {v}" for k, v in parameters.items() if isinstance(v, str)
        )
        param_keys = " ".join(parameters.keys())
        combined = f"{param_keys} {param_str}"

        if any(p.search(combined) for p in _PII_PARAM_PATTERNS):
            flags["has_pii"] = True

        # Large numeric values
        for key, value in parameters.items():
            try:
                num = float(value) if isinstance(value, (int, float, str)) else None
                if num is not None and num >= 1000:
                    flags["has_large_numeric"] = True
                    flags["largest_numeric_param"] = key
                    break
            except (ValueError, TypeError):
                pass

        # Wildcard selectors
        for key, value in parameters.items():
            if isinstance(value, str) and value.strip() in ("*", "all", "any"):
                flags["has_wildcard_selector"] = True
                flags["wildcard_param"] = key
                break

        # List with many items
        for key, value in parameters.items():
            if isinstance(value, list) and len(value) > 10:
                flags["has_large_list"] = True
                flags["large_list_param"] = key
                flags["large_list_size"] = len(value)
                break

        return flags

    def _compute_confidence(
        self,
        intent: IntentCategory,
        tool_metadata: Dict[str, Any],
    ) -> float:
        # If the tool has explicit governance annotations, confidence is 1.0
        if tool_metadata.get("intent_category") or tool_metadata.get("sensitivity_level"):
            return 1.0
        # Heuristic-only classification has slightly lower confidence
        if intent == IntentCategory.UNKNOWN:
            return 0.5
        return 0.85
