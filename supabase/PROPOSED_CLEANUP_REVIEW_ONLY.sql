-- PROPOSED CLEANUP SCRIPT (FOR OPERATOR REVIEW ONLY — DO NOT EXECUTE AUTOMATICALLY)
-- In accordance with Ground Rule 0.6: "Never run destructive cleanup on production data."
-- This file contains proposed SQL statements for review.

-- ==============================================================================
-- 1. Revoke Unused Wildcard API Keys
-- ==============================================================================
-- Found 6 active keys with permissions `["*"]`:
--   - Key ID 8:  "Default Admin Key" (prefix: 'mcp_', allowed_ips: '0.0.0.0/0', last_used: NEVER)
--   - Key ID 9:  "Default Admin Key" (prefix: 'mcp_', allowed_ips: '0.0.0.0/0', last_used: NEVER)
--   - Key ID 10: "Claude Desktop Key" (prefix: 'mcp_YtQoZd', last_used: NEVER)
--   - Key ID 13: "LocalTestKey" (prefix: 'ERFie0OG', last_used: NEVER)
--   - Key ID 14: "TestingAuthKey" (prefix: 'WRmXBSpk', last_used: 2026-07-19)
--   - Key ID 15: "TestingASGIMiddlewareKey" (prefix: 'xKzWTDwP', last_used: 2026-07-19)

-- To safely deactivate the unused wildcard keys:
-- UPDATE public.api_keys
-- SET is_active = false, revoked_at = now()
-- WHERE id IN (8, 9, 10, 13) AND is_active = true;

-- ==============================================================================
-- 2. Delete Leftover Inactive Test Bundles
-- ==============================================================================
-- Found 4 inactive test bundles in `public.policy_bundles`:
--   - 'pb-57af8546': 'test-malicious-1.0' (is_active: false)
--   - 'pb-98b68eaf': 'v2.0-test' (is_active: false)
--   - 'pb-e874bfd5': 'v3.0-enhanced-blocking' (is_active: false)
--   - 'pb-262ba809': 'v_test_malicious_1' (is_active: false)

-- To remove these leftover test bundles:
-- DELETE FROM public.policy_bundles
-- WHERE id IN ('pb-57af8546', 'pb-98b68eaf', 'pb-e874bfd5', 'pb-262ba809')
--   AND is_active = false;

-- ==============================================================================
-- 3. Propose Default Key Expiry
-- ==============================================================================
-- Currently, all 35 API keys have `expires_at IS NULL` (infinite validity).
-- Recommendation: New keys should default to 90-day expiry unless explicitly created
-- as machine service accounts. For existing active keys without expiry:
-- UPDATE public.api_keys
-- SET expires_at = created_at + interval '180 days'
-- WHERE expires_at IS NULL AND is_active = true;
