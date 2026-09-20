-- Migration: 20260920000003_rollups_and_tamper_evidence.sql
-- Description: Creates hourly rollup table, hash-chain tamper-evidence, append-only trigger, and verification function

-- 1. Fast Dashboard Aggregates (Hourly Rollup)
create table if not exists public.security_hourly_stats (
  tenant_id  varchar not null,
  hour       timestamptz not null,
  event_type varchar not null,
  decision   varchar not null default '',
  stage      varchar not null default '',
  tool_name  varchar not null default '',
  rule_id    varchar not null default '',
  mode       varchar not null default 'enforce',
  cnt        bigint not null default 0,
  primary key (tenant_id, hour, event_type, decision, stage, tool_name, rule_id, mode)
);

create index if not exists idx_sec_hourly_tenant_hour on public.security_hourly_stats (tenant_id, hour desc);

-- 2. AFTER INSERT trigger on security_events to maintain hourly stats
create or replace function private.maintain_hourly_stats()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_hour timestamptz;
begin
  v_hour := date_trunc('hour', NEW.ts);

  insert into public.security_hourly_stats (
    tenant_id, hour, event_type, decision, stage, tool_name, rule_id, mode, cnt
  ) values (
    NEW.tenant_id,
    v_hour,
    NEW.event_type,
    coalesce(NEW.decision, ''),
    coalesce(NEW.stage, ''),
    coalesce(NEW.tool_name, ''),
    coalesce(NEW.rule_id, ''),
    coalesce(NEW.mode, 'enforce'),
    1
  )
  on conflict (tenant_id, hour, event_type, decision, stage, tool_name, rule_id, mode)
  do update set cnt = public.security_hourly_stats.cnt + 1;

  return NEW;
end;
$$;

drop trigger if exists trg_maintain_hourly_stats on public.security_events;
create trigger trg_maintain_hourly_stats
  after insert on public.security_events
  for each row execute function private.maintain_hourly_stats();

-- 3. Hash Chain (Tamper Evidence) Trigger
-- Serializes inserts per tenant using an advisory transaction lock and computes cryptographic row chain
create or replace function private.compute_event_hash_chain()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_prev_hash char(64);
  v_canonical text;
begin
  -- Acquire advisory transaction lock for this tenant to serialize chain computation
  perform pg_advisory_xact_lock(hashtextextended(NEW.tenant_id, 0));

  -- Read latest row_hash for this tenant
  select row_hash into v_prev_hash
  from public.security_events
  where tenant_id = NEW.tenant_id
  order by id desc
  limit 1;

  -- Default to genesis hash for first row of tenant
  NEW.prev_hash := coalesce(v_prev_hash, repeat('0', 64));

  -- Canonical fields for cryptographic digest
  v_canonical := NEW.prev_hash
    || coalesce(NEW.request_id::text, '')
    || NEW.tenant_id
    || coalesce(NEW.user_id::text, '')
    || coalesce(NEW.event_type, '')
    || coalesce(NEW.decision, '')
    || coalesce(NEW.stage, '')
    || coalesce(NEW.tool_name, '')
    || coalesce(NEW.args_hash, '')
    || coalesce(NEW.ts::text, '');

  NEW.row_hash := encode(digest(v_canonical, 'sha256'), 'hex');

  return NEW;
end;
$$;

drop trigger if exists trg_compute_event_hash on public.security_events;
create trigger trg_compute_event_hash
  before insert on public.security_events
  for each row execute function private.compute_event_hash_chain();

-- 4. Hash Chain Verification Function
create or replace function private.verify_chain(p_tenant_id varchar)
returns table(is_valid boolean, broken_id bigint, details text)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  r record;
  v_expected_prev char(64) := repeat('0', 64);
  v_computed_hash char(64);
  v_canonical text;
begin
  for r in (
    select id, request_id, tenant_id, user_id, event_type, decision, stage, tool_name,
           args_hash, ts, prev_hash, row_hash
    from public.security_events
    where tenant_id = p_tenant_id
    order by id asc
  ) loop
    -- Check 1: prev_hash must match the previous row's row_hash
    if r.prev_hash <> v_expected_prev then
      return query select false, r.id, format('prev_hash mismatch: expected %s, found %s', v_expected_prev, r.prev_hash);
      return;
    end if;

    -- Check 2: row_hash must match computed sha256
    v_canonical := r.prev_hash
      || coalesce(r.request_id::text, '')
      || r.tenant_id
      || coalesce(r.user_id::text, '')
      || coalesce(r.event_type, '')
      || coalesce(r.decision, '')
      || coalesce(r.stage, '')
      || coalesce(r.tool_name, '')
      || coalesce(r.args_hash, '')
      || coalesce(r.ts::text, '');

    v_computed_hash := encode(digest(v_canonical, 'sha256'), 'hex');
    if r.row_hash <> v_computed_hash then
      return query select false, r.id, format('row_hash corrupted: expected %s, found %s', v_computed_hash, r.row_hash);
      return;
    end if;

    v_expected_prev := r.row_hash;
  end loop;

  return query select true, null::bigint, 'Chain is intact and valid'::text;
end;
$$;

-- 5. Append-Only Trigger: Prohibit UPDATE or DELETE by any app role
create or replace function private.prohibit_events_modification()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  raise exception 'security_events is append-only: % operations are prohibited', TG_OP;
end;
$$;

drop trigger if exists trg_prohibit_events_update_delete on public.security_events;
create trigger trg_prohibit_events_update_delete
  before update or delete on public.security_events
  for each row execute function private.prohibit_events_modification();

-- 6. Retention purge function (callable only by table owner/superuser)
create or replace function private.purge_events(days integer)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_deleted bigint;
begin
  if days is null or days < 7 then
    raise exception 'Retention days must be at least 7';
  end if;

  -- Temporarily drop the update/delete trigger inside this transaction to purge aged logs
  alter table public.security_events disable trigger trg_prohibit_events_update_delete;
  delete from public.security_events where ts < now() - (days || ' days')::interval;
  get diagnostics v_deleted = row_count;
  alter table public.security_events enable trigger trg_prohibit_events_update_delete;

  return v_deleted;
end;
$$;

-- Lock out Supabase REST API roles from stats
revoke all on public.security_hourly_stats from anon, authenticated;
