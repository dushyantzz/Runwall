import asyncio
import os
import sys

# Add project root to python path
sys.path.insert(0, "C:/Users/Shubham/Desktop/Runwall")

from secure_mcp_server.main import SecureMCPServer
from secure_mcp_server.config import Settings

async def test():
    # Setup test env variables to avoid validation errors
    os.environ["SECRET_KEY"] = "test-secret-key-12345"
    os.environ["ENVIRONMENT"] = "testing"
    
    server = SecureMCPServer(Settings())
    await server.initialize()
    
    tools = await server.mcp.get_tools()
    if tools:
        first_tool_name = list(tools.keys())[0]
        tool = tools[first_tool_name]
        print(f"Tool name: {first_tool_name}")
        print(f"Tool class: {type(tool)}")
        print(f"Tool dir: {dir(tool)}")
        print(f"Tool name attribute: {getattr(tool, 'name', None)}")
        print(f"Tool description attribute: {getattr(tool, 'description', None)}")
        print(f"Tool parameters attribute: {getattr(tool, 'parameters', None)}")
        
    await server.stop()

if __name__ == "__main__":
    asyncio.run(test())
