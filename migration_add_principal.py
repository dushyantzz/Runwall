"""
Standalone migration: add principal, evaluation_engine, client_ip columns
to policy_decision_logs, and reset decision_log_failure_count.

Usage:
    DATABASE_URL=postgresql+asyncpg://... python migration_add_principal.py

This script is idempotent (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
"""
import asyncio
import os
import sys


async def run_migration(database_url: str) -> None:
    import asyncpg

    # asyncpg requires the raw postgres:// scheme (no +asyncpg driver prefix)
    pg_url = database_url.replace("postgresql+asyncpg://", "postgresql://").replace(
        "postgres+asyncpg://", "postgresql://"
    )

    conn = await asyncpg.connect(pg_url)
    try:
        print("Connected. Running migration...")

        await conn.execute("""
            ALTER TABLE policy_decision_logs
                ADD COLUMN IF NOT EXISTS principal VARCHAR(255),
                ADD COLUMN IF NOT EXISTS evaluation_engine VARCHAR(20),
                ADD COLUMN IF NOT EXISTS client_ip VARCHAR(45);
        """)
        print("✓ Columns added (or already exist): principal, evaluation_engine, client_ip")

        # Add comments (idempotent in Postgres)
        await conn.execute("""
            COMMENT ON COLUMN policy_decision_logs.principal
                IS 'Raw principal string (e.g. local_admin) when user_id is not an integer FK';
        """)
        await conn.execute("""
            COMMENT ON COLUMN policy_decision_logs.evaluation_engine
                IS 'Engine that produced the decision: opa, fallback, or transport';
        """)
        await conn.execute("""
            COMMENT ON COLUMN policy_decision_logs.client_ip
                IS 'Client IP resolved from CF-Connecting-IP / X-Forwarded-For / socket';
        """)
        print("✓ Column comments applied")

        print("\nMigration complete.")
    finally:
        await conn.close()


if __name__ == "__main__":
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    asyncio.run(run_migration(db_url))
