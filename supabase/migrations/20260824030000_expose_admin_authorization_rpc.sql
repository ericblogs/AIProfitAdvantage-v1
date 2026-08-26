-- Gate 3C.21: expose a narrow admin authorization RPC to the browser client.
-- The underlying admin registry remains private and is never exposed through PostgREST.

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = private, pg_catalog
as $$
  select exists (
    select 1
    from private.admin_users au
    where au.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_current_user_admin() from public, anon;
grant execute on function public.is_current_user_admin() to authenticated;
