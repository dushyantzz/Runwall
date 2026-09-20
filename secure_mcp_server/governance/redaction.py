"""
Secret Redaction & Argument Hashing Module.

Recursively scrubs credentials, tokens, private keys, connection strings,
and oversized payloads from logged arguments before database ingestion.
"""

import hmac
import hashlib
import json
import os
import re
from typing import Any, Dict, List, Optional, Union

# Sensitive key names (case-insensitive substring match)
SENSITIVE_KEY_PATTERNS = re.compile(
    r'(password|passwd|secret|token|api_?key|auth|bearer|private_?key|credential|connection_?string)',
    re.IGNORECASE
)

# Sensitive value patterns
BEARER_TOKEN_RE = re.compile(r'Bearer\s+[A-Za-z0-9\-._~+/]+=*', re.IGNORECASE)
BASIC_AUTH_RE = re.compile(r'Basic\s+[A-Za-z0-9+/]+=*', re.IGNORECASE)
OPENAI_KEY_RE = re.compile(r'sk-[A-Za-z0-9]{20,}')
AWS_KEY_RE = re.compile(r'(AKIA|ASIA)[A-Z0-9]{16}')
JWT_RE = re.compile(r'eyJ[A-Za-z0-9\-_=]+\.eyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+')
PEM_BLOCK_RE = re.compile(r'-----BEGIN\s+[A-Z0-9_-]+\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+[A-Z0-9_-]+\s+PRIVATE\s+KEY-----', re.IGNORECASE)
CONN_STRING_RE = re.compile(r'(postgres|mysql|mongodb|redis)(ql)?://[^:]+:[^@]+@[^/]+/[^\s]*', re.IGNORECASE)
CREDIT_CARD_RE = re.compile(r'\b(?:\d[ -]*?){13,16}\b')

MAX_VALUE_LEN = 2048   # 2 KB per value
MAX_TOTAL_LEN = 16384  # 16 KB total JSON representation


def redact_string(val: str, max_len: int = MAX_VALUE_LEN) -> str:
    """Mask known credential formats in string and truncate if too long."""
    if not val:
        return val

    # Length cap
    if len(val) > max_len:
        val = val[:max_len] + "...[TRUNCATED]"

    # Pattern replacements
    val = PEM_BLOCK_RE.sub("[REDACTED_PRIVATE_KEY]", val)
    val = BEARER_TOKEN_RE.sub("Bearer [REDACTED]", val)
    val = BASIC_AUTH_RE.sub("Basic [REDACTED]", val)
    val = OPENAI_KEY_RE.sub("[REDACTED_OPENAI_KEY]", val)
    val = AWS_KEY_RE.sub("[REDACTED_AWS_KEY]", val)
    val = JWT_RE.sub("[REDACTED_JWT]", val)
    val = CONN_STRING_RE.sub(r"\1://[REDACTED_CREDENTIALS]@[HOST]", val)
    
    # Redact suspected credit cards (13-16 digits)
    if CREDIT_CARD_RE.search(val) and not val.strip().startswith("http"):
        val = CREDIT_CARD_RE.sub("[REDACTED_PAYMENT_CARD]", val)

    return val


def redact(
    obj: Any, 
    max_value_len: int = MAX_VALUE_LEN, 
    max_total_len: int = MAX_TOTAL_LEN
) -> Any:
    """
    Recursively redact sensitive keys and values from dicts, lists, and primitives.
    Enforces per-value and total payload size bounds.
    """
    def _redact_inner(item: Any, depth: int = 0) -> Any:
        if depth > 20:  # Prevent infinite recursion in circular structures
            return "...[DEPTH_EXCEEDED]"

        if isinstance(item, dict):
            cleaned = {}
            for k, v in item.items():
                k_str = str(k)
                if SENSITIVE_KEY_PATTERNS.search(k_str):
                    cleaned[k_str] = "***REDACTED***"
                else:
                    cleaned[k_str] = _redact_inner(v, depth + 1)
            return cleaned

        elif isinstance(item, list):
            return [_redact_inner(elem, depth + 1) for elem in item]

        elif isinstance(item, str):
            return redact_string(item, max_value_len)

        elif isinstance(item, (int, float, bool)) or item is None:
            return item

        else:
            return redact_string(str(item), max_value_len)

    cleaned_obj = _redact_inner(obj)

    # Check total payload size
    try:
        raw_json = json.dumps(cleaned_obj)
        if len(raw_json) > max_total_len:
            return {"_payload_truncated": True, "preview": raw_json[:max_total_len] + "...[OVERSIZED_PAYLOAD_TRUNCATED]"}
    except Exception:
        pass

    return cleaned_obj


def compute_args_hash(args: Any, server_key: Optional[str] = None) -> str:
    """
    Compute stable HMAC-SHA256 of the arguments payload using the server-side secret key.
    Ensures verifiable integrity without leaking raw argument contents.
    """
    if server_key is None:
        server_key = os.environ.get("EVENT_HASH_KEY", "runwall_default_hmac_key_2026")

    try:
        canonical_str = json.dumps(args, sort_keys=True, separators=(',', ':'), default=str)
    except Exception:
        canonical_str = str(args)

    h = hmac.new(server_key.encode('utf-8'), canonical_str.encode('utf-8'), hashlib.sha256)
    return h.hexdigest()
