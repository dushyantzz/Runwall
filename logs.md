INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Waiting for application startup.
INFO:     Started server process [676]
INFO:     172.16.21.2:64122 - "POST /mcp HTTP/1.1" 500 Internal Server Error
    raise exc
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/h11_impl.py", line 416, in run_asgi
    await self.app(scope, receive, _send)
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 660, in __call__
    return await mcp_http_app(request.scope, request.receive, request.send)
  File "/app/secure_mcp_server/main.py", line 452, in mcp_streamable_route
    await app(scope, receive, sender)
    await self.middleware_stack(scope, receive, send)
AttributeError: 'Request' object has no attribute 'send'
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 136, in app
    await route.handle(scope, receive, send)
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
    raw_response = await run_endpoint_function(
               ^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 90, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 150, in app
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 1266, in handle
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 88, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 344, in run_endpoint_function
    result = await app(  # type: ignore[func-returns-value]
    return await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 2683, in app
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
Traceback (most recent call last):
    await super().handle(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                              ^^^^^^^^^^^^
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1163, in __call__
ERROR:    Exception in ASGI application
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 276, in handle
    await super().__call__(scope, receive, send)
    response = await f(request)
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 690, in app
    return await dependant.call(**values)
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
INFO:     172.16.21.2:43738 - "POST /mcp HTTP/1.1" 500 Internal Server Error
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
    result = await app(  # type: ignore[func-returns-value]
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 1266, in handle
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 150, in app
                                                              ^^^^^^^^^^^^
    response = await f(request)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    return await mcp_http_app(request.scope, request.receive, request.send)
    await route.handle(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
AttributeError: 'Request' object has no attribute 'send'
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 660, in __call__
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 90, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 2683, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 136, in app
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/h11_impl.py", line 416, in run_asgi
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 88, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 276, in handle
Traceback (most recent call last):
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 344, in run_endpoint_function
ERROR:    Exception in ASGI application
    raise exc
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 690, in app
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1163, in __call__
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    raw_response = await run_endpoint_function(
  File "/app/secure_mcp_server/main.py", line 452, in mcp_streamable_route
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
    return await dependant.call(**values)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
    await self.app(scope, receive, _send)
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
    await self.middleware_stack(scope, receive, send)
    await super().handle(scope, receive, send)
    return await self.app(scope, receive, send)
    await super().__call__(scope, receive, send)
    await app(scope, receive, sender)
               ^^^^^^^^^^^^^^^^
INFO:     172.16.21.2:43748 - "POST /mcp HTTP/1.1" 500 Internal Server Error
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 88, in __call__
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 2683, in app
    await self.app(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
               ^^^^^^^^^^^^^^^^
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    response = await f(request)
    return await mcp_http_app(request.scope, request.receive, request.send)
                                                              ^^^^^^^^^^^^
    await self.middleware_stack(scope, receive, send)
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 136, in app
Traceback (most recent call last):
ERROR:    Exception in ASGI application
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    raw_response = await run_endpoint_function(
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 660, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 1266, in handle
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 690, in app
    await app(scope, receive, sender)
    return await dependant.call(**values)
    await super().handle(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 90, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 344, in run_endpoint_function
    result = await app(  # type: ignore[func-returns-value]
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1163, in __call__
    raise exc
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 150, in app
    await self.app(scope, receive, _send)
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 63, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
AttributeError: 'Request' object has no attribute 'send'
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/h11_impl.py", line 416, in run_asgi
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 276, in handle
    await super().__call__(scope, receive, send)
    await route.handle(scope, receive, send)
  File "/app/secure_mcp_server/main.py", line 452, in mcp_streamable_route
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
INFO:     172.16.21.2:42074 - "POST /mcp HTTP/1.1" 500 Internal Server Error
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    await route.handle(scope, receive, send)
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 660, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 136, in app
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 1266, in handle
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 53, in wrapped_app
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/cors.py", line 88, in __call__
    raise exc
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
    await self.middleware_stack(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/uvicorn/protocols/http/h11_impl.py", line 416, in run_asgi
  File "/usr/local/lib/python3.11/site-packages/starlette/_exception_handler.py", line 42, in wrapped_app
  File "/usr/local/lib/python3.11/site-packages/uvicorn/middleware/proxy_headers.py", line 63, in __call__
    await super().handle(scope, receive, send)
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 690, in app
Traceback (most recent call last):
ERROR:    Exception in ASGI application
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 186, in __call__
  File "/usr/local/lib/python3.11/site-packages/fastapi/applications.py", line 1163, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/exceptions.py", line 63, in __call__
    return await self.app(scope, receive, send)
    raw_response = await run_endpoint_function(
  File "/app/secure_mcp_server/main.py", line 452, in mcp_streamable_route
    await self.app(scope, receive, send)
    await app(scope, receive, sender)
    result = await app(  # type: ignore[func-returns-value]
               ^^^^^^^^^^^^^^^^
                                                              ^^^^^^^^^^^^
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 2683, in app
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 276, in handle
AttributeError: 'Request' object has no attribute 'send'
  File "/usr/local/lib/python3.11/site-packages/fastapi/middleware/asyncexitstack.py", line 18, in __call__
    return await dependant.call(**values)
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 150, in app
    await self.app(scope, receive, _send)
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    await super().__call__(scope, receive, send)
    return await mcp_http_app(request.scope, request.receive, request.send)
  File "/usr/local/lib/python3.11/site-packages/starlette/middleware/errors.py", line 164, in __call__
  File "/usr/local/lib/python3.11/site-packages/starlette/applications.py", line 90, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
    response = await f(request)
  File "/usr/local/lib/python3.11/site-packages/fastapi/routing.py", line 344, in run_endpoint_function
[32m INFO[0m Sending signal SIGINT to main child process w/ PID 667
[32m INFO[0m Sending signal SIGTERM to main child process w/ PID 667
[32m INFO[0m Main child exited with signal (with signal 'SIGTERM', core dumped? false)
[   48.919827] reboot: Restarting system