-- This file is intended to be executed in a Supabase Postgres instance after running migrations.
-- It performs lightweight verification that required RLS policies and helper objects exist.

begin;

do $$
declare
  v_missing text;
begin
  -- Tables should have RLS enabled
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('profiles','interests','user_interests','photos','likes','matches','messages')
      and c.relrowsecurity is distinct from true
  ) then
    raise exception 'Expected RLS to be enabled on all core tables';
  end if;

  -- Policies should exist (names are stable for acceptance tests)
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_own') then
    raise exception 'Missing policy: public.profiles profiles_select_own';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_discoverable') then
    raise exception 'Missing policy: public.profiles profiles_select_discoverable';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='likes' and policyname='likes_insert_own') then
    raise exception 'Missing policy: public.likes likes_insert_own';
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public'
      and c.relname='likes'
      and t.tgname='likes_create_match'
      and not t.tgisinternal
  ) then
    raise exception 'Missing trigger: public.likes likes_create_match';
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='get_discovery_candidates'
  ) then
    raise exception 'Missing function: public.get_discovery_candidates';
  end if;
end
$$;

rollback;
