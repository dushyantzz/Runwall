-- Migration: 20260920000001_security_events.sql
-- Description: Creates private schema, extensions, and core security_events table

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create extension if not exists pgcrypto with schema extensions;

-- Core security events table (append-only)
create table if not exists public.security_events (
  id              bigint generated always as identity primary key,
  ts              timestamptz not null default now(),
  request_id      uuid not null,
  tenant_id       varchar not null,
  user_id         integer,            -- actor / owner of API key; no FK on purpose so logs outlive users
  api_key_id      integer,            -- no FK on purpose
  principal       varchar,
  agent_name      varchar,
  client_ip       inet,
  user_agent      text,
  session_id      varchar,
  event_type      varchar not null check (event_type in ('tool_call','auth','approval','taint','config','access')),
  action          varchar,            -- e.g. login_failed, key_revoked, approval_approved, export_csv
  stage           varchar check (stage in ('auth','tenant','trust','rate_limit','taint','risk','policy','approval','system')),
  tool_name       varchar,
  intent_category varchar,
  risk_score      real,
  risk_level      varchar,
  decision        varchar check (decision in ('allow','deny','require_approval','quarantine','log_only','simulate')),
  rule_id         varchar,
  rule_snapshot   jsonb,              -- rule name + conditions as evaluated at decision time
  bundle_version  varchar,
  engine          varchar check (engine in ('opa','fallback','db_rules','transport','none')),
  mode            varchar not null default 'enforce' check (mode in ('enforce','shadow','simulation')),
  reason          text,               -- plain-English explanation
  args_redacted   jsonb,
  args_hash       char(64),           -- HMAC-SHA256 of raw args (server-side key)
  taint_labels    jsonb not null default '[]'::jsonb,
  latency_ms      integer,
  prev_hash       char(64),
  row_hash        char(64)
);

-- Performance and range query indexes
create index if not exists idx_sec_events_tenant_ts on public.security_events (tenant_id, ts desc);
create index if not exists idx_sec_events_tenant_user_ts on public.security_events (tenant_id, user_id, ts desc);
create index if not exists idx_sec_events_tenant_dec_ts on public.security_events (tenant_id, decision, ts desc);
create index if not exists idx_sec_events_tenant_tool_ts on public.security_events (tenant_id, tool_name, ts desc);
create index if not exists idx_sec_events_tenant_key_ts on public.security_events (tenant_id, api_key_id, ts desc);
create index if not exists idx_sec_events_request_id on public.security_events (request_id);
create index if not exists idx_sec_events_session_id on public.security_events (session_id);

-- Lock out Supabase REST API roles completely
revoke all on public.security_events from anon, authenticated;
