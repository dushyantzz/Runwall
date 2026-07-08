import os
# Force test environment variables before anything else loads
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-security-checks-12345"
os.environ["ENVIRONMENT"] = "testing"
os.environ["ENABLE_INTENT_POLICY"] = "True"
os.environ["ENABLE_INPUT_SANITIZATION"] = "True"

import pytest
from secure_mcp_server.config import Settings
from secure_mcp_server.database.connection import DatabaseManager, set_db_manager

@pytest.fixture(scope="session")
def test_settings():
    return Settings()

@pytest.fixture(scope="function")
async def db_manager(test_settings):
    db = DatabaseManager(test_settings.database_url)
    await db.initialize()
    set_db_manager(db)
    yield db
    await db.cleanup()
