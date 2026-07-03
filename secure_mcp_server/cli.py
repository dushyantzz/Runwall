"""CLI commands for Secure MCP Server."""

import asyncio
import click
import structlog
from datetime import datetime, timezone

from secure_mcp_server.config import get_settings
from secure_mcp_server.database import DatabaseManager
from secure_mcp_server.database.connection import set_db_manager
from secure_mcp_server.database.models import User
from secure_mcp_server.auth import AuthManager
from sqlalchemy import select

logger = structlog.get_logger()

async def async_bootstrap(username: str, password: str, email: str):
    settings = get_settings()
    db_manager = DatabaseManager(settings.database_url)
    set_db_manager(db_manager)
    auth_manager = AuthManager(settings)
    
    # Initialize DB schema
    await db_manager.initialize()
    
    async with db_manager.get_session_context() as db_session:
        # Check if users already exist
        stmt = select(User).where(User.username == username)
        result = await db_session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            click.echo(f"User '{username}' already exists. Skipping bootstrap.")
            return

        # Create admin user
        admin = User(
            username=username,
            email=email,
            hashed_password=auth_manager.hash_password(password),
            full_name="System Admin",
            is_active=True,
            is_admin=True,
            tenant_id=settings.default_tenant,
        )
        db_session.add(admin)
        
    click.secho(f"Successfully bootstrapped admin user '{username}'", fg="green")

@click.group()
def cli():
    """Secure MCP Server CLI"""
    pass

@cli.command()
@click.option('--username', default='admin', help='Admin username to create.')
@click.option('--password', required=True, prompt=True, hide_input=True, confirmation_prompt=True, help='Admin password.')
@click.option('--email', default='admin@example.com', help='Admin email.')
def bootstrap(username, password, email):
    """Bootstrap the initial admin user in the database."""
    asyncio.run(async_bootstrap(username, password, email))

if __name__ == "__main__":
    cli()
