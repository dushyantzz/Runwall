INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
INFO:     Started server process [678]
INFO:     Waiting for application startup.
                    ╭─────────── Traceback (most recent call last) ────────────╮
                    RuntimeError: Task group is not initialized. Make sure to
INFO:     172.16.4.154:35492 - "POST /mcp HTTP/1.1" 500 Internal Server Error
                    use run().
                    initialized. Make sure to use run().
                    │ /usr/local/lib/python3.11/site-packages/fastmcp/server/h │
                    │ ttp.py:87 in __call__                                    │
[07/16/26 06:58:02] Original RuntimeError from mcp library: Task group is not
                    ╰──────────────────────────────────────────────────────────╯
    result = await app(  # type: ignore[func-returns-value]
  File "/usr/local/lib/python3.11/site-packages/fastmcp/server/http.py", line 87, in __call__
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    await self.app(scope, receive, send)
    return await self.app(scope, receive, send)
RuntimeError: Task group is not initialized. Make sure to use run().
    await self.middleware_stack(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 90, in __call__
    await super().__call__(scope, receive, send)
ERROR:    Exception in ASGI application
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 276, in handle
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 2683, in app
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 660, in __call__
    await route.handle(scope, receive, send)
    await app(scope, receive, sender)
    raise RuntimeError(
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
The above exception was the direct cause of the following exception:
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/h11_impl.py", line 416, in run_asgi
    raise exc
RuntimeError: FastMCP's StreamableHTTPSessionManager task group was not initialized. This commonly occurs when the FastMCP application's lifespan is not passed to the parent ASGI application (e.g., FastAPI or Starlette). Please ensure you are setting `lifespan=mcp_app.lifespan` in your parent app's constructor, where `mcp_app` is the application instance returned by `fastmcp_instance.http_app()`. \nFor more details, see the FastMCP ASGI integration documentation: https://gofastmcp.com/deployment/asgi\nOriginal error: Task group is not initialized. Make sure to use run().
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Traceback (most recent call last):
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
  File "/usr/local/lib/python3.11/site-packages/fastmcp/server/http.py", line 108, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 88, in __call__
    await self.app(scope, receive, _send)
    raise RuntimeError(f"{new_error_message}\\nOriginal error: {e}") from e
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1163, in __call__
                    │ ttp.py:87 in __call__                                    │
                    │ /usr/local/lib/python3.11/site-packages/fastmcp/server/h │
                    initialized. Make sure to use run().
                    ╰──────────────────────────────────────────────────────────╯
[07/16/26 06:58:08] Original RuntimeError from mcp library: Task group is not
                    use run().
INFO:     172.16.4.154:49798 - "POST /mcp HTTP/1.1" 500 Internal Server Error
                    RuntimeError: Task group is not initialized. Make sure to
                    ╭─────────── Traceback (most recent call last) ────────────╮
    await super().__call__(scope, receive, send)
    await self.middleware_stack(scope, receive, send)
    raise exc
ERROR:    Exception in ASGI application
Traceback (most recent call last):
The above exception was the direct cause of the following exception:
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1163, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastmcp/server/http.py", line 108, in __call__
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/h11_impl.py", line 416, in run_asgi
    return await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 276, in handle
  File "/usr/local/lib/python3.11/site-packages/fastmcp/server/http.py", line 87, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 88, in __call__
    result = await app(  # type: ignore[func-returns-value]
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 90, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
RuntimeError: Task group is not initialized. Make sure to use run().
    await app(scope, receive, sender)
    await route.handle(scope, receive, send)
RuntimeError: FastMCP's StreamableHTTPSessionManager task group was not initialized. This commonly occurs when the FastMCP application's lifespan is not passed to the parent ASGI application (e.g., FastAPI or Starlette). Please ensure you are setting `lifespan=mcp_app.lifespan` in your parent app's constructor, where `mcp_app` is the application instance returned by `fastmcp_instance.http_app()`. \nFor more details, see the FastMCP ASGI integration documentation: https://gofastmcp.com/deployment/asgi\nOriginal error: Task group is not initialized. Make sure to use run().
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 2683, in app
    raise RuntimeError(
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    await self.app(scope, receive, _send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 660, in __call__
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 63, in __call__
    raise RuntimeError(f"{new_error_message}\\nOriginal error: {e}") from e
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                    initialized. Make sure to use run().
                    │ /usr/local/lib/python3.11/site-packages/fastmcp/server/h │
[07/16/26 06:58:13] Original RuntimeError from mcp library: Task group is not
                    use run().
                    │ ttp.py:87 in __call__                                    │
                    ╭─────────── Traceback (most recent call last) ────────────╮
INFO:     172.16.4.154:49802 - "POST /mcp HTTP/1.1" 500 Internal Server Error
                    RuntimeError: Task group is not initialized. Make sure to
                    ╰──────────────────────────────────────────────────────────╯
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 2683, in app
RuntimeError: FastMCP's StreamableHTTPSessionManager task group was not initialized. This commonly occurs when the FastMCP application's lifespan is not passed to the parent ASGI application (e.g., FastAPI or Starlette). Please ensure you are setting `lifespan=mcp_app.lifespan` in your parent app's constructor, where `mcp_app` is the application instance returned by `fastmcp_instance.http_app()`. \nFor more details, see the FastMCP ASGI integration documentation: https://gofastmcp.com/deployment/asgi\nOriginal error: Task group is not initialized. Make sure to use run().
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 90, in __call__
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/h11_impl.py", line 416, in run_asgi
    await app(scope, receive, sender)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
ERROR:    Exception in ASGI application
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
Traceback (most recent call last):
    await self.app(scope, receive, send)
    raise RuntimeError(
    raise exc
    await route.handle(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/fastmcp/server/http.py", line 108, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1163, in __call__
    result = await app(  # type: ignore[func-returns-value]
    raise RuntimeError(f"{new_error_message}\\nOriginal error: {e}") from e
  File "/usr/local/lib/python3.11/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 276, in handle
    await super().__call__(scope, receive, send)
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    await self.app(scope, receive, _send)
The above exception was the direct cause of the following exception:
    return await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
RuntimeError: Task group is not initialized. Make sure to use run().
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 88, in __call__
    await self.middleware_stack(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastmcp/server/http.py", line 87, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 660, in __call__
                    │ /usr/local/lib/python3.11/site-packages/fastmcp/server/h │
                    initialized. Make sure to use run().
INFO:     172.16.4.154:46322 - "POST /mcp HTTP/1.1" 500 Internal Server Error
[07/16/26 06:58:19] Original RuntimeError from mcp library: Task group is not
                    ╭─────────── Traceback (most recent call last) ────────────╮
                    │ ttp.py:87 in __call__                                    │
                    use run().
                    ╰──────────────────────────────────────────────────────────╯
                    RuntimeError: Task group is not initialized. Make sure to
  File "/usr/local/lib/python3.11/site-packages/fastmcp/server/http.py", line 87, in __call__
    return await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 88, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/h11_impl.py", line 416, in run_asgi
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1163, in __call__
    raise exc
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 276, in handle
    raise RuntimeError(f"{new_error_message}\\nOriginal error: {e}") from e
  File "/usr/local/lib/python3.11/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
    raise RuntimeError(
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 660, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 90, in __call__
    await super().__call__(scope, receive, send)
RuntimeError: FastMCP's StreamableHTTPSessionManager task group was not initialized. This commonly occurs when the FastMCP application's lifespan is not passed to the parent ASGI application (e.g., FastAPI or Starlette). Please ensure you are setting `lifespan=mcp_app.lifespan` in your parent app's constructor, where `mcp_app` is the application instance returned by `fastmcp_instance.http_app()`. \nFor more details, see the FastMCP ASGI integration documentation: https://gofastmcp.com/deployment/asgi\nOriginal error: Task group is not initialized. Make sure to use run().
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 63, in __call__
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastmcp/server/http.py", line 108, in __call__
    await self.app(scope, receive, _send)
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 2683, in app
RuntimeError: Task group is not initialized. Make sure to use run().
    await self.middleware_stack(scope, receive, send)
    await self.app(scope, receive, send)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
    await route.handle(scope, receive, send)
Traceback (most recent call last):
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
ERROR:    Exception in ASGI application
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    result = await app(  # type: ignore[func-returns-value]
The above exception was the direct cause of the following exception:
[32m INFO[0m Sending signal SIGINT to main child process w/ PID 670
[32m INFO[0m Sending signal SIGTERM to main child process w/ PID 670
[32m INFO[0m Main child exited with signal (with signal 'SIGTERM', core dumped? false)
[   56.975405] reboot: Restarting system