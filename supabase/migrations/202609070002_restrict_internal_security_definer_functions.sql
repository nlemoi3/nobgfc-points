-- Restrict internal SECURITY DEFINER functions from direct Data API access.
-- rls_auto_enable is invoked only by the ensure_rls event trigger.
-- get_current_user_role is not used by the application; role checks use
-- has_app_role(text), which remains executable by authenticated users.

revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon, authenticated;

revoke all on function public.get_current_user_role() from public;
revoke all on function public.get_current_user_role() from anon, authenticated;
