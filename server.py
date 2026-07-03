"""
FastMCP Cloud entrypoint.

This file exposes a module-level FastMCP instance (`mcp`) that FastMCP Cloud
discovers automatically.  All tools from the secure_mcp_server package are
registered directly on this instance so the server works both locally
(`fastmcp run server.py`) and when deployed to FastMCP Cloud.
"""

import hashlib
import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastmcp import FastMCP

mcp = FastMCP(
    "Secure MCP Server",
    instructions=(
        "A secure, production-ready MCP server with tools for text processing, "
        "hashing, calculations, UUID generation, and more."
    ),
)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
def echo(text: str) -> Dict[str, Any]:
    """Echo back the provided text along with its character length."""
    return {
        "echoed_text": text,
        "length": len(text),
    }


@mcp.tool()
def calculator(expression: str) -> Dict[str, Any]:
    """Evaluate a mathematical expression safely.

    Supports basic arithmetic (+, -, *, /, **), built-in functions
    (abs, round, min, max, pow) and the ``math`` module.
    """
    allowed_names: dict = {
        "__builtins__": {},
        "abs": abs,
        "round": round,
        "min": min,
        "max": max,
        "sum": sum,
        "pow": pow,
        "math": math,
    }

    safe_chars = set("0123456789+-*/.() abcdefghijklmnopqrstuvwxyz_")
    cleaned = "".join(c for c in expression.lower() if c in safe_chars)

    if not cleaned.strip():
        return {"expression": expression, "error": "Empty or invalid expression", "result": None}

    try:
        result = eval(cleaned, allowed_names, {})  # noqa: S307
        return {"expression": expression, "result": result, "result_type": type(result).__name__}
    except Exception as exc:
        return {"expression": expression, "error": str(exc), "result": None}


@mcp.tool()
def text_processor(text: str, operation: str = "uppercase") -> Dict[str, Any]:
    """Process text with a given operation.

    Supported operations: uppercase, lowercase, title_case, reverse,
    word_count, char_count, strip.
    """
    operations = {
        "uppercase": lambda t: t.upper(),
        "lowercase": lambda t: t.lower(),
        "title_case": lambda t: t.title(),
        "reverse": lambda t: t[::-1],
        "word_count": lambda t: len(t.split()),
        "char_count": lambda t: len(t),
        "strip": lambda t: t.strip(),
    }

    if operation not in operations:
        return {
            "text": text,
            "operation": operation,
            "error": f"Unknown operation: {operation}",
            "available_operations": list(operations.keys()),
        }

    result = operations[operation](text)
    return {
        "original_text": text,
        "operation": operation,
        "result": result,
        "result_type": type(result).__name__,
    }


@mcp.tool()
def secure_hash(text: str, algorithm: str = "sha256") -> Dict[str, Any]:
    """Generate a cryptographic hash of the provided text.

    Supported algorithms: md5, sha1, sha256, sha512.
    """
    algos = {
        "md5": hashlib.md5,
        "sha1": hashlib.sha1,
        "sha256": hashlib.sha256,
        "sha512": hashlib.sha512,
    }
    algorithm = algorithm.lower()

    if algorithm not in algos:
        return {
            "error": f"Unsupported algorithm: {algorithm}",
            "supported_algorithms": list(algos.keys()),
        }

    digest = algos[algorithm](text.encode("utf-8")).hexdigest()
    return {"text": text, "algorithm": algorithm, "hash": digest, "length": len(digest)}


@mcp.tool()
def uuid_generator(version: int = 4) -> Dict[str, Any]:
    """Generate a UUID (version 1 or 4)."""
    if version == 1:
        value = str(uuid.uuid1())
    elif version == 4:
        value = str(uuid.uuid4())
    else:
        return {"error": "Only UUID versions 1 and 4 are supported", "supported_versions": [1, 4]}

    return {"uuid": value, "version": version}


@mcp.tool()
def datetime_info(timezone_name: str = "UTC", format_type: str = "iso") -> Dict[str, Any]:
    """Return the current date and time.

    format_type can be: iso, readable, timestamp, date_only, time_only.
    """
    now = datetime.now(timezone.utc)

    formats = {
        "iso": now.isoformat(),
        "readable": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "timestamp": str(int(now.timestamp())),
        "date_only": now.strftime("%Y-%m-%d"),
        "time_only": now.strftime("%H:%M:%S"),
    }

    fmt = format_type if format_type in formats else "iso"
    return {
        "datetime": formats[fmt],
        "timezone": timezone_name,
        "format_type": fmt,
        "timestamp": int(now.timestamp()),
        "available_formats": list(formats.keys()),
    }


@mcp.tool()
def json_formatter(text: str, indent: int = 2) -> Dict[str, Any]:
    """Pretty-print or validate a JSON string."""
    import json

    try:
        parsed = json.loads(text)
        formatted = json.dumps(parsed, indent=indent, ensure_ascii=False)
        return {"formatted": formatted, "valid": True, "type": type(parsed).__name__}
    except json.JSONDecodeError as exc:
        return {"valid": False, "error": str(exc)}


@mcp.tool()
def base64_codec(text: str, action: str = "encode") -> Dict[str, Any]:
    """Encode or decode a string using Base64.

    action: 'encode' or 'decode'.
    """
    import base64

    if action == "encode":
        result = base64.b64encode(text.encode("utf-8")).decode("ascii")
        return {"action": "encode", "result": result}
    elif action == "decode":
        try:
            result = base64.b64decode(text).decode("utf-8")
            return {"action": "decode", "result": result}
        except Exception as exc:
            return {"action": "decode", "error": str(exc)}
    else:
        return {"error": f"Unknown action '{action}'. Use 'encode' or 'decode'."}


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------

@mcp.resource("config://server-info")
def server_info() -> str:
    """Return basic server metadata."""
    import json

    return json.dumps(
        {
            "name": "Secure MCP Server",
            "version": "1.0.0",
            "tools": [
                "echo", "calculator", "text_processor", "secure_hash",
                "uuid_generator", "datetime_info", "json_formatter", "base64_codec",
            ],
        },
        indent=2,
    )


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

@mcp.prompt()
def security_audit(time_range: str = "24h") -> str:
    """Prompt the LLM to perform a security audit analysis."""
    return (
        f"Perform a security audit for the last {time_range}. "
        "Analyze authentication attempts, rate-limit violations, and "
        "any anomalous tool usage patterns. Provide actionable recommendations."
    )


@mcp.prompt()
def performance_review() -> str:
    """Prompt the LLM to review tool performance metrics."""
    return (
        "Review the recent tool execution metrics. Identify the slowest tools, "
        "most frequent errors, and suggest optimizations to improve overall "
        "server performance."
    )
