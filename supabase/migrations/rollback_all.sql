-- Rollback Script: rollback_all.sql
-- Description: Reverses migrations 000004 down to 000001 cleanly

set lock_timeout = '3s';

-- 1. Revert Migration 4
drop function if exists private.purge_test_data();

alter table if exists public.api_keys drop column if exists created_by;
alter table if exists public.api_keys drop column if exists revoked_by;
alter table if exists public.api_keys drop column if exists last_used_ip;
alter table if exists public.policy_bundles drop column if exists created_by;

drop policy if exists tenant_user_read on public.security_events;
drop policy if exists writer_insert on public.security_events;
drop policy if exists tenant_user_read_taint on public.taint_events;
drop policy if exists writer_insert_taint on public.taint_events;
drop policy if exists tenant_read_stats on public.security_hourly_stats;

-- 2. Revert Migration 3
drop trigger if exists trg_prohibit_events_update_delete on public.security_events;
drop function if exists private.prohibit_events_modification();
drop function if exists private.purge_events(integer);
drop function if exists private.verify_chain(varchar);
drop trigger if exists trg_compute_event_hash on public.security_events;
drop function if exists private.compute_event_hash_chain();
drop trigger if exists trg_maintain_hourly_stats on public.security_events;
drop function if exists private.maintain_hourly_stats();
drop table if exists public.security_hourly_stats cascade;

-- 3. Revert Migration 2
drop trigger if exists trg_audit_api_keys on public.api_keys;
drop trigger if exists trg_audit_tool_manifests on public.tool_manifests;
drop trigger if exists trg_audit_policy_bundles on public.policy_bundles;
drop trigger if exists trg_audit_policy_rules on public.policy_rules;
drop function if exists private.record_config_change();
drop table if exists public.config_history cascade;
drop table if exists public.taint_events cascade;

-- 4. Revert Migration 1
drop table if exists public.security_events cascade;
drop schema if exists private cascade;

-- Revert Roles: revoke all privileges first
revoke all on all sequences in schema public from event_writer;
revoke all on all tables in schema public from event_writer, dashboard_reader;
revoke all on schema public, extensions from event_writer, dashboard_reader;
drop role if exists event_writer;
drop role if exists dashboard_reader;
