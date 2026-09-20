-- Migration: 20260920000002_taint_and_config_history.sql
-- Description: Creates taint_events and config_history tables with secret-redacting audit triggers

-- 1. Taint Provenance Table ("what was blocked FROM")
create table if not exists public.taint_events (
  id           bigint generated always as identity primary key,
  ts           timestamptz not null default now(),
  tenant_id    varchar not null,
  user_id      integer,
  api_key_id   integer,
  session_id   varchar,
  request_id   uuid,
  label        varchar not null,      -- e.g. EXTERNAL_WEB, PII, SHELL_INJECTION
  source_type  varchar,               -- web | email | file | tool | user
  source_ref   text,                  -- URL / tool name, redacted + length-capped
  tool_name    varchar
);

create index if not exists idx_taint_events_tenant_ts on public.taint_events (tenant_id, ts desc);
create index if not exists idx_taint_events_session_id on public.taint_events (session_id);

-- 2. Config Change History (who changed what, excluding secrets)
create table if not exists public.config_history (
  id            bigint generated always as identity primary key,
  ts            timestamptz not null default now(),
  tenant_id     varchar,
  actor_user_id integer,
  actor         varchar,
  table_name    varchar not null,
  row_pk        varchar not null,
  action        varchar not null check (action in ('insert','update','delete')),
  old_values    jsonb,
  new_values    jsonb
);

create index if not exists idx_config_history_table_ts on public.config_history (table_name, ts desc);
create index if not exists idx_config_history_tenant_ts on public.config_history (tenant_id, ts desc);

-- 3. Trigger function in schema private (SECURITY DEFINER) to record config changes safely
create or replace function private.record_config_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_actor_user_id integer;
  v_actor text;
  v_tenant_id text;
  v_row_pk text;
  v_old jsonb;
  v_new jsonb;
begin
  -- Resolve actor
  v_actor := nullif(current_setting('app.actor', true), '');
  begin
    v_actor_user_id := nullif(current_setting('app.user_id', true), '')::integer;
  exception when others then
    v_actor_user_id := null;
  end;

  if TG_OP = 'DELETE' then
    v_old := to_jsonb(OLD);
    v_new := null;
    v_tenant_id := v_old->>'tenant_id';
    v_row_pk := coalesce(v_old->>'id', v_old->>'tool_name', 'unknown');
  elsif TG_OP = 'INSERT' then
    v_old := null;
    v_new := to_jsonb(NEW);
    v_tenant_id := v_new->>'tenant_id';
    v_row_pk := coalesce(v_new->>'id', v_new->>'tool_name', 'unknown');
  elsif TG_OP = 'UPDATE' then
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_tenant_id := coalesce(v_new->>'tenant_id', v_old->>'tenant_id');
    v_row_pk := coalesce(v_new->>'id', v_new->>'tool_name', v_old->>'id', 'unknown');
  end if;

  -- Strictly redact secrets from audit records
  if TG_TABLE_NAME = 'api_keys' then
    if v_old is not null then v_old := v_old - 'key_hash'; end if;
    if v_new is not null then v_new := v_new - 'key_hash'; end if;
  elsif TG_TABLE_NAME = 'users' then
    if v_old is not null then v_old := v_old - 'hashed_password'; end if;
    if v_new is not null then v_new := v_new - 'hashed_password'; end if;
  elsif TG_TABLE_NAME = 'policy_bundles' then
    if v_old is not null and v_old ? 'rego_content' then
      v_old := (v_old - 'rego_content') || jsonb_build_object(
        'rego_md5', md5(v_old->>'rego_content'),
        'rego_len', length(v_old->>'rego_content')
      );
    end if;
    if v_new is not null and v_new ? 'rego_content' then
      v_new := (v_new - 'rego_content') || jsonb_build_object(
        'rego_md5', md5(v_new->>'rego_content'),
        'rego_len', length(v_new->>'rego_content')
      );
    end if;
  end if;

  insert into public.config_history (
    tenant_id, actor_user_id, actor, table_name, row_pk, action, old_values, new_values
  ) values (
    v_tenant_id, v_actor_user_id, v_actor, TG_TABLE_NAME, v_row_pk, lower(TG_OP), v_old, v_new
  );

  return coalesce(NEW, OLD);
end;
$$;

-- 4. Attach triggers to config tables
drop trigger if exists trg_audit_policy_rules on public.policy_rules;
create trigger trg_audit_policy_rules
  after insert or update or delete on public.policy_rules
  for each row execute function private.record_config_change();

drop trigger if exists trg_audit_policy_bundles on public.policy_bundles;
create trigger trg_audit_policy_bundles
  after insert or update or delete on public.policy_bundles
  for each row execute function private.record_config_change();

drop trigger if exists trg_audit_tool_manifests on public.tool_manifests;
create trigger trg_audit_tool_manifests
  after insert or update or delete on public.tool_manifests
  for each row execute function private.record_config_change();

drop trigger if exists trg_audit_api_keys on public.api_keys;
create trigger trg_audit_api_keys
  after insert or update or delete on public.api_keys
  for each row execute function private.record_config_change();

-- 5. Lock out Supabase REST API roles completely
revoke all on public.taint_events, public.config_history from anon, authenticated;
