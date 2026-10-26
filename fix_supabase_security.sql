-- ======================================================================
-- Student Hub - Supabase Security Hardening Script
-- Resolves: 'rls_disabled_in_public' & 'sensitive_columns_exposed'
-- ======================================================================
-- Instructions:
-- 1. Go to your Supabase Dashboard.
-- 2. Open the "SQL Editor" from the left navigation sidebar.
-- 3. Click "New Query" and paste the entire contents of this file.
-- 4. Click the "Run" button to execute.
-- ======================================================================

-- 1. Enable Row-Level Security (RLS) on all user-facing tables
-- Enabling RLS prevents anonymous external access via the public 'anon' key.
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deleted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chatbot_settings ENABLE ROW LEVEL SECURITY;

-- 2. Define Security Access Policies (Optional, but recommended for extra safety)
-- Since your Flask application operates on the server-side, it is highly
-- recommended to configure it to use the "service_role" API key.
--
-- The "service_role" key completely bypasses RLS checks, meaning Flask can
-- query, insert, and update database tables as an administrator, while the
-- public "anon" API key will be blocked from accessing any rows or columns.
--
-- Keep the "service_role" API key private and store it securely in your server configuration.

-- 3. Confirming Security Status
-- After running this script:
-- - The 'rls_disabled_in_public' warning will resolve.
-- - The 'sensitive_columns_exposed' warning will resolve because table columns
--   (such as users.password) are no longer readable by anonymous public API queries.
