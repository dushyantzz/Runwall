import asyncio
import asyncpg
from secure_mcp_server.config import get_settings

migration_sql = """
ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rate_limit_requests INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS rate_limit_period VARCHAR(20) DEFAULT 'week';

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  api_key_id INTEGER,
  tier VARCHAR(20) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  razorpay_subscription_id VARCHAR(255) UNIQUE,
  razorpay_customer_id VARCHAR(255),
  razorpay_plan_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT TRUE,
  price_paid INTEGER DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limit_usage (
  id SERIAL PRIMARY KEY,
  api_key_id INTEGER,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  request_count INTEGER DEFAULT 0,
  requests_remaining INTEGER DEFAULT 15,
  last_request_at TIMESTAMP WITH TIME ZONE,
  is_exceeded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  api_key_id INTEGER,
  tier VARCHAR(20) DEFAULT 'pro',
  amount INTEGER DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50),
  razorpay_payment_id VARCHAR(255) UNIQUE,
  razorpay_order_id VARCHAR(255),
  razorpay_signature VARCHAR(512),
  payment_method VARCHAR(50),
  subscription_id VARCHAR(255),
  description TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

async def run_migration():
    settings = get_settings()
    # Extract native postgres url from sqlalchemy url
    db_url = settings.database_url
    if "postgresql+asyncpg://" in db_url:
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    print("Connecting directly to database...")
    conn = await asyncpg.connect(db_url)
    try:
        print("Running SQL migrations directly...")
        # Run entire script block
        await conn.execute(migration_sql)
        print("Database migration completed successfully!")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migration())
