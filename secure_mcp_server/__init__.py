"""Package init for secure_mcp_server."""

import contextvars
from fastmcp import FastMCP

# Thread and async-safe request context tracking
_current_request_var = contextvars.ContextVar("current_request", default=None)

@property
def _current_request_prop(self):
    return _current_request_var.get()

@_current_request_prop.setter
def _current_request_prop(self, value):
    _current_request_var.set(value)

# Dynamically bind current_request property to FastMCP class
FastMCP.current_request = _current_request_prop

# Ensure submodules are available for imports
from .monitoring import MetricsCollector  # noqa: F401
