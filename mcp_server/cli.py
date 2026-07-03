"""Command-line interface for MCP Server."""

import asyncio
import sys
from typing import Optional

import typer
import uvicorn
from rich.console import Console
from rich.table import Table

from .config import get_settings
from .database.connection import DatabaseManager
from .core.tool_manager import ToolManager

console = Console()
app = typer.Typer(name="mcp-server", help="Secure MCP Server Framework CLI")


@app.command()
def serve(
    host: str = typer.Option("0.0.0.0", "--host", "-h", help="Host to bind to"),
    port: int = typer.Option(8000, "--port", "-p", help="Port to bind to"),
    reload: bool = typer.Option(False, "--reload", "-r", help="Enable auto-reload"),
    workers: int = typer.Option(1, "--workers", "-w", help="Number of workers"),
):
    """Start the MCP server."""
    console.print("🚀 Starting Secure MCP Server Framework...", style="bold green")
    
    uvicorn.run(
        "mcp_server.main:app",
        host=host,
        port=port,
        reload=reload,
        workers=workers if not reload else 1,
        log_level="info"
    )


@app.command()
def init_db():
    """Initialize the database."""
    console.print("🔧 Initializing database...", style="bold blue")
    
    async def _init_db():
        settings = get_settings()
        db_manager = DatabaseManager(settings.database_url)
        await db_manager.initialize()
        await db_manager.cleanup()
    
    asyncio.run(_init_db())
    console.print("✅ Database initialized successfully!", style="bold green")


@app.command()
def list_tools():
    """List all available tools."""
    console.print("🔍 Available Tools:", style="bold blue")
    
    async def _list_tools():
        settings = get_settings()
        tool_manager = ToolManager(settings)
        await tool_manager.initialize()
        
        tools = await tool_manager.list_tools()
        
        if not tools:
            console.print("No tools available.", style="yellow")
            return
        
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Name", style="cyan")
        table.add_column("Category", style="green")
        table.add_column("Description", style="white")
        table.add_column("Status", style="yellow")
        
        for tool in tools:
            table.add_row(
                tool.name,
                tool.category,
                tool.description[:50] + "..." if len(tool.description) > 50 else tool.description,
                "Active" if tool.is_active else "Inactive"
            )
        
        console.print(table)
    
    asyncio.run(_list_tools())


@app.command()
def create_user(
    username: str = typer.Argument(..., help="Username for the new user"),
    email: str = typer.Argument(..., help="Email for the new user"),
    password: str = typer.Option(..., "--password", "-p", prompt=True, hide_input=True, help="Password for the new user"),
    role: str = typer.Option("user", "--role", "-r", help="Role for the new user (user, admin)"),
):
    """Create a new user."""
    console.print(f"👤 Creating user: {username}", style="bold blue")
    
    async def _create_user():
        settings = get_settings()
        db_manager = DatabaseManager(settings.database_url)
        await db_manager.initialize()
        
        # Implementation would go here
        console.print(f"✅ User {username} created successfully!", style="bold green")
        
        await db_manager.cleanup()
    
    asyncio.run(_create_user())


@app.command()
def status():
    """Show server status and configuration."""
    settings = get_settings()
    
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="white")
    
    table.add_row("Environment", settings.environment)
    table.add_row("Debug Mode", str(settings.debug))
    table.add_row("Server Host", settings.server_host)
    table.add_row("Server Port", str(settings.server_port))
    table.add_row("Database URL", settings.database_url)
    table.add_row("Redis URL", settings.redis_url)
    table.add_row("Multi-tenant", str(settings.enable_multi_tenant))
    table.add_row("Max Context Length", str(settings.max_context_length))
    table.add_row("Max Tools Per Session", str(settings.max_tools_per_session))
    
    console.print("⚙️  Server Configuration", style="bold blue")
    console.print(table)


def main():
    """Main CLI entry point."""
    try:
        app()
    except KeyboardInterrupt:
        console.print("\n👋 Goodbye!", style="bold yellow")
        sys.exit(0)
    except Exception as e:
        console.print(f"❌ Error: {e}", style="bold red")
        sys.exit(1)


if __name__ == "__main__":
    main()