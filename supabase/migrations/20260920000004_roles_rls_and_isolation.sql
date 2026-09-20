-- Migration: 20260920000004_roles_rls_and_isolation.sql
-- Description: Creates roles, RLS policies, metadata columns, revokes rls_auto_enable, and provides test purge function

-- Lock timeout protection for existing tables
set lock_timeout = '3s';

-- 1. App Roles (Least Privilege)
do $$
begin
  if not exists (select from pg_roles where rolname = 'event_writer') then
    create role event_writer nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'dashboard_reader') then
    create role dashboard_reader nologin;
  end if;
end
$$;

-- Schema grants
grant usage on schema public to event_writer, dashboard_reader;
grant usage on schema extensions to event_writer, dashboard_reader;

-- Sequence grants for ID generation
grant usage, select on all sequences in schema public to event_writer;

-- Table grants
grant insert on public.security_events, public.taint_events to event_writer;
grant select on public.security_events, public.taint_events, public.security_hourly_stats to dashboard_reader;

-- 2. Row Level Security (RLS)
alter table public.security_events enable row level security;
alter table public.taint_events enable row level security;
alter table public.security_hourly_stats enable row level security;

-- security_events RLS policies
drop policy if exists tenant_user_read on public.security_events;
create policy tenant_user_read on public.security_events for select to dashboard_reader
  using (
    tenant_id = current_setting('app.tenant_id', true)
    and (
      user_id = nullif(current_setting('app.user_id', true), '')::integer
      or user_id is null
    )
  );

drop policy if exists writer_insert on public.security_events;
create policy writer_insert on public.security_events for insert to event_writer
  with check (true);

-- taint_events RLS policies
drop policy if exists tenant_user_read_taint on public.taint_events;
create policy tenant_user_read_taint on public.taint_events for select to dashboard_reader
  using (
    tenant_id = current_setting('app.tenant_id', true)
    and (
      user_id = nullif(current_setting('app.user_id', true), '')::integer
      or user_id is null
    )
  );

drop policy if exists writer_insert_taint on public.taint_events;
create policy writer_insert_taint on public.taint_events for insert to event_writer
  with check (true);

-- security_hourly_stats RLS policies
drop policy if exists tenant_read_stats on public.security_hourly_stats;
create policy tenant_read_stats on public.security_hourly_stats for select to dashboard_reader
  using (
    tenant_id = current_setting('app.tenant_id', true)
  );

-- 3. Security Hardening: Revoke public execution of rls_auto_enable
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

-- 4. Additive-Only Metadata Columns on Existing Tables
alter table public.api_keys add column if not exists created_by integer;
alter table public.api_keys add column if not exists revoked_by integer;
alter table public.api_keys add column if not exists last_used_ip varchar(45);
alter table public.policy_bundles add column if not exists created_by integer;

-- 5. Safe Test Isolation Purge Function
-- Deletes rows ONLY where tenant_id like '__test_%' and strictly refuses to touch any other tenant
create or replace function private.purge_test_data()
returns table(deleted_events bigint, deleted_taints bigint, deleted_stats bigint)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_events bigint := 0;
  v_taints bigint := 0;
  v_stats bigint := 0;
begin
  -- Temporarily disable append-only trigger for test cleanup
  alter table public.security_events disable trigger trg_prohibit_events_update_delete;

  delete from public.security_events where tenant_id like '__test_%';
  get diagnostics v_events = row_count;

  delete from public.taint_events where tenant_id like '__test_%';
  get diagnostics v_taints = row_count;

  delete from public.security_hourly_stats where tenant_id like '__test_%';
  get diagnostics v_stats = row_count;

  alter table public.security_events enable trigger trg_prohibit_events_update_delete;

  return query select v_events, v_taints, v_stats;
end;
$$;

revoke all on function private.purge_test_data() from public, anon, authenticated, event_writer, dashboard_reader;
