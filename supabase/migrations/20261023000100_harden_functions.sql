-- Security advisor fixes: pin the trigger function's search_path and keep the
-- Supabase-provided rls_auto_enable() helper off the public REST API.
ALTER FUNCTION public.audit_logs_block_mutation() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
