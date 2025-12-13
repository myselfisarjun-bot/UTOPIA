begin;

-- Extensions commonly available in Supabase
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_gender' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.profile_gender AS ENUM ('female', 'male', 'nonbinary', 'other', 'prefer_not_to_say');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.match_status AS ENUM ('active', 'blocked');
  END IF;
END $$;

-- Generic updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  bio text,
  birthdate date,
  gender public.profile_gender,
  location geography(point, 4326),
  is_discoverable boolean not null default true,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_is_discoverable_idx on public.profiles (is_discoverable) where is_discoverable;
create index profiles_last_active_at_idx on public.profiles (last_active_at desc);
create index profiles_location_gix on public.profiles using gist (location);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.tg_set_updated_at();

-- Interests are global catalog items
create table public.interests (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Many-to-many between users and interests
create table public.user_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id bigint not null references public.interests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create index user_interests_interest_id_idx on public.user_interests (interest_id);

-- Photos metadata (actual binaries stored in Supabase Storage)
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bucket_id text not null default 'profile-photos',
  storage_path text not null,
  is_primary boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, storage_path)
);

create index photos_user_id_created_at_idx on public.photos (user_id, created_at desc);
create unique index photos_one_primary_per_user_uq on public.photos (user_id) where is_primary;

create trigger photos_set_updated_at
before update on public.photos
for each row execute function public.tg_set_updated_at();

-- Likes (directed)
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  liker_id uuid not null references public.profiles(id) on delete cascade,
  liked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_no_self_like check (liker_id <> liked_id),
  constraint likes_unique_pair unique (liker_id, liked_id)
);

create index likes_liker_created_at_idx on public.likes (liker_id, created_at desc);
create index likes_liked_created_at_idx on public.likes (liked_id, created_at desc);

-- Matches are canonicalized unordered pairs (user1 < user2)
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user1 uuid not null references public.profiles(id) on delete cascade,
  user2 uuid not null references public.profiles(id) on delete cascade,
  status public.match_status not null default 'active',
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  constraint matches_canonical_pair check (user1 < user2),
  constraint matches_unique_pair unique (user1, user2)
);

create index matches_user1_idx on public.matches (user1);
create index matches_user2_idx on public.matches (user2);
create index matches_last_message_at_idx on public.matches (last_message_at desc nulls last);

-- Messages within matches
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_match_id_created_at_idx on public.messages (match_id, created_at);

-- ---------
-- Like limit enforcement
-- ---------
create or replace function public.daily_like_limit()
returns integer
language sql
immutable
as $$
  select 50;
$$;

comment on function public.daily_like_limit() is
  'Global daily like limit used by can_like(). Override by changing this function or wrapping it in a settings table.';

create or replace function public.can_like(p_liker_id uuid, p_limit integer default null)
returns boolean
language sql
stable
as $$
  with lim as (
    select coalesce(p_limit, public.daily_like_limit())::integer as v
  )
  select (
    select count(*)
    from public.likes l
    where l.liker_id = p_liker_id
      and l.created_at >= now() - interval '24 hours'
  ) < (select v from lim);
$$;

comment on function public.can_like(uuid, integer) is
  'Returns true if p_liker_id has fewer than p_limit (or daily_like_limit()) likes in the last 24 hours.';

create or replace function public.tg_enforce_like_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);

  if not public.can_like(new.liker_id, null) then
    raise exception 'daily like limit exceeded for user %', new.liker_id
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger likes_enforce_like_limit
before insert on public.likes
for each row execute function public.tg_enforce_like_limit();

-- ---------
-- Match creation on mutual like
-- ---------
create or replace function public.tg_create_match_on_mutual_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  u1 uuid;
  u2 uuid;
begin
  perform set_config('row_security', 'off', true);

  if exists (
    select 1
    from public.likes l
    where l.liker_id = new.liked_id
      and l.liked_id = new.liker_id
  ) then
    u1 := least(new.liker_id, new.liked_id);
    u2 := greatest(new.liker_id, new.liked_id);

    insert into public.matches (user1, user2)
    values (u1, u2)
    on conflict (user1, user2) do nothing;
  end if;

  return null;
end;
$$;

create trigger likes_create_match
after insert on public.likes
for each row execute function public.tg_create_match_on_mutual_like();

-- Keep matches.last_message_at current
create or replace function public.tg_bump_match_last_message_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('row_security', 'off', true);

  update public.matches
  set last_message_at = greatest(coalesce(last_message_at, 'epoch'::timestamptz), new.created_at)
  where id = new.match_id;

  return new;
end;
$$;

create trigger messages_bump_match_last_message_at
after insert on public.messages
for each row execute function public.tg_bump_match_last_message_at();

-- ---------
-- Deterministic matching helpers
-- ---------
create or replace function public.profile_completeness_score(p_user_id uuid)
returns numeric
language sql
stable
as $$
  with p as (
    select * from public.profiles where id = p_user_id
  ),
  ph as (
    select
      count(*) as photo_count,
      count(*) filter (where is_primary) as primary_photo_count
    from public.photos
    where user_id = p_user_id
  ),
  ui as (
    select count(*) as interest_count
    from public.user_interests
    where user_id = p_user_id
  )
  select (
    (
      (case when (select username from p) is not null then 1 else 0 end) +
      (case when coalesce(length(trim((select bio from p))), 0) > 0 then 1 else 0 end) +
      (case when (select birthdate from p) is not null then 1 else 0 end) +
      (case when (select gender from p) is not null then 1 else 0 end) +
      (case when (select location from p) is not null then 1 else 0 end) +
      (case when (select photo_count from ph) > 0 then 1 else 0 end) +
      (case when (select interest_count from ui) > 0 then 1 else 0 end)
    )::numeric / 7
  );
$$;

comment on function public.profile_completeness_score(uuid) is
  'Returns a 0..1 profile completeness score based on presence of core fields, at least one photo, and at least one interest.';

create or replace function public.interest_overlap_score(p_viewer_id uuid, p_candidate_id uuid)
returns numeric
language sql
stable
as $$
  with a as (
    select interest_id from public.user_interests where user_id = p_viewer_id
  ),
  b as (
    select interest_id from public.user_interests where user_id = p_candidate_id
  ),
  inter as (
    select count(*)::numeric as c from (
      (select interest_id from a)
      intersect
      (select interest_id from b)
    ) x
  ),
  uni as (
    select count(*)::numeric as c from (
      (select interest_id from a)
      union
      (select interest_id from b)
    ) x
  )
  select case when (select c from uni) = 0 then 0 else (select c from inter) / (select c from uni) end;
$$;

comment on function public.interest_overlap_score(uuid, uuid) is
  'Returns a 0..1 Jaccard index of interest overlap between viewer and candidate.';

create or replace function public.proximity_score(
  p_viewer_id uuid,
  p_candidate_id uuid,
  p_max_distance_km numeric default 100
)
returns numeric
language sql
stable
as $$
  with loc as (
    select pv.location as v_loc, pc.location as c_loc
    from public.profiles pv
    join public.profiles pc on pc.id = p_candidate_id
    where pv.id = p_viewer_id
  )
  select
    case
      when (select v_loc from loc) is null or (select c_loc from loc) is null then 0
      else greatest(
        0,
        1 - least(
          st_distance((select v_loc from loc), (select c_loc from loc)) / (p_max_distance_km * 1000),
          1
        )
      )
    end;
$$;

comment on function public.proximity_score(uuid, uuid, numeric) is
  'Returns a 0..1 score based on distance between users. 1 when co-located, 0 when >= p_max_distance_km or missing location.';

create or replace function public.recent_activity_score(
  p_candidate_id uuid,
  p_window interval default interval '7 days'
)
returns numeric
language sql
stable
as $$
  select
    case
      when p.last_active_at is null then 0
      else greatest(
        0,
        1 - least(
          extract(epoch from (now() - p.last_active_at)) / nullif(extract(epoch from p_window), 0),
          1
        )
      )
    end
  from public.profiles p
  where p.id = p_candidate_id;
$$;

comment on function public.recent_activity_score(uuid, interval) is
  'Returns a 0..1 score based on candidate recency within p_window (defaults to 7 days).';

create or replace function public.compute_match_score(p_viewer_id uuid, p_candidate_id uuid)
returns numeric
language sql
stable
as $$
  select round(
    0.4 * public.interest_overlap_score(p_viewer_id, p_candidate_id)
    + 0.3 * public.proximity_score(p_viewer_id, p_candidate_id, 100)
    + 0.2 * public.recent_activity_score(p_candidate_id, interval '7 days')
    + 0.1 * public.profile_completeness_score(p_candidate_id),
    6
  );
$$;

comment on function public.compute_match_score(uuid, uuid) is
  'Computes match_score = 0.4*interest_overlap + 0.3*proximity + 0.2*recent_activity + 0.1*profile_completeness.';

create or replace function public.get_match_score(p_candidate_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $get_match_score$
declare
  v_viewer uuid;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_candidate_id = v_viewer then
    return 0;
  end if;

  perform set_config('row_security', 'off', true);

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_candidate_id
      and p.is_discoverable
  ) then
    raise exception 'candidate not discoverable' using errcode = '42501';
  end if;

  return public.compute_match_score(v_viewer, p_candidate_id);
end;
$get_match_score$;

comment on function public.get_match_score(uuid) is
  'RPC helper for apps: returns compute_match_score(auth.uid(), p_candidate_id) for discoverable candidates.';

-- ---------
-- Storage: private bucket + signed URL minting
-- ---------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.photo_storage_path(
  p_user_id uuid,
  p_photo_id uuid,
  p_extension text default 'jpg'
)
returns text
language sql
immutable
as $$
  select p_user_id::text || '/' || p_photo_id::text || '.' || regexp_replace(lower(p_extension), '[^a-z0-9]+', '', 'g');
$$;

comment on function public.photo_storage_path(uuid, uuid, text) is
  'Helper to generate Storage object paths for profile-photos bucket. Recommended format: <user_id>/<photo_id>.<ext>.';

create or replace function public.storage_signed_url(
  p_bucket_id text,
  p_storage_path text,
  p_expires_in integer
)
returns text
language plpgsql
security definer
set search_path = public, storage
as $storage_signed_url$
declare
  v_url text;
begin
  perform set_config('row_security', 'off', true);

  -- Supabase has shipped different signatures/return types for create_signed_url over time.
  -- Try common forms in a deterministic order.
  begin
    execute 'select signed_url from storage.create_signed_url($1,$2,$3)'
      into v_url
      using p_bucket_id, p_storage_path, p_expires_in;
    if v_url is not null then
      return v_url;
    end if;
  exception when others then
    null;
  end;

  begin
    execute 'select (storage.create_signed_url($1,$2,$3)).signed_url'
      into v_url
      using p_bucket_id, p_storage_path, p_expires_in;
    if v_url is not null then
      return v_url;
    end if;
  exception when others then
    null;
  end;

  execute 'select storage.create_signed_url($1,$2,$3)'
    into v_url
    using p_bucket_id, p_storage_path, p_expires_in;

  return v_url;
end;
$storage_signed_url$;

comment on function public.storage_signed_url(text, text, integer) is
  'Compatibility helper that returns a signed URL for a Storage object across Supabase Postgres versions.';

create or replace function public.mint_photo_signed_url(
  p_photo_id uuid,
  p_expires_in integer default 60
)
returns text
language plpgsql
security definer
set search_path = public, storage
as $mint_photo_signed_url$
declare
  v_requester uuid;
  v_photo record;
begin
  v_requester := auth.uid();
  if v_requester is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  perform set_config('row_security', 'off', true);

  select p.id, p.user_id, p.bucket_id, p.storage_path, p.is_public, pr.is_discoverable
  into v_photo
  from public.photos p
  join public.profiles pr on pr.id = p.user_id
  where p.id = p_photo_id;

  if not found then
    raise exception 'photo not found' using errcode = 'NO_DATA_FOUND';
  end if;

  if v_photo.user_id <> v_requester
     and not (
       v_photo.is_public and v_photo.is_discoverable
     )
     and not exists (
       select 1
       from public.matches m
       where m.status = 'active'
         and (m.user1 = least(v_requester, v_photo.user_id) and m.user2 = greatest(v_requester, v_photo.user_id))
     )
  then
    raise exception 'not authorized to view this photo' using errcode = '42501';
  end if;

  return public.storage_signed_url(v_photo.bucket_id, v_photo.storage_path, greatest(p_expires_in, 1));
end;
$mint_photo_signed_url$;

comment on function public.mint_photo_signed_url(uuid, integer) is
  'Returns a short-lived signed URL for a photo if requester is owner, is matched with owner, or photo is marked is_public and profile is_discoverable.';

-- ---------
-- RPC for discovery candidates
-- ---------
create or replace function public.get_discovery_candidates(
  p_limit integer default 20,
  p_offset integer default 0,
  p_max_distance_km numeric default 100,
  p_photo_expires_in integer default 60
)
returns table (
  profile_id uuid,
  username text,
  full_name text,
  bio text,
  distance_km numeric,
  match_score numeric,
  primary_photo_signed_url text
)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_viewer uuid;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  perform set_config('row_security', 'off', true);

  return query
  with viewer as (
    select id, location
    from public.profiles
    where id = v_viewer
  ),
  candidates as (
    select
      p.id as profile_id,
      p.username,
      p.full_name,
      p.bio,
      case
        when (select location from viewer) is null or p.location is null then null
        else st_distance((select location from viewer), p.location) / 1000
      end as distance_km,
      public.compute_match_score(v_viewer, p.id) as match_score,
      ph.id as primary_photo_id
    from public.profiles p
    left join lateral (
      select id
      from public.photos
      where user_id = p.id
        and is_primary
      order by created_at desc
      limit 1
    ) ph on true
    where p.id <> v_viewer
      and p.is_discoverable
      and not exists (
        select 1
        from public.likes l
        where l.liker_id = v_viewer
          and l.liked_id = p.id
      )
      and not exists (
        select 1
        from public.matches m
        where m.user1 = least(v_viewer, p.id)
          and m.user2 = greatest(v_viewer, p.id)
      )
      and (
        (select location from viewer) is null
        or p.location is null
        or st_distance((select location from viewer), p.location) <= (p_max_distance_km * 1000)
      )
  )
  select
    c.profile_id,
    c.username,
    c.full_name,
    c.bio,
    c.distance_km,
    c.match_score,
    case when c.primary_photo_id is null then null else public.mint_photo_signed_url(c.primary_photo_id, p_photo_expires_in) end
  from candidates c
  order by c.match_score desc, c.profile_id
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
end;
$$;

comment on function public.get_discovery_candidates(integer, integer, numeric, integer) is
  $c$
Returns ranked discovery candidates for the current user.

Example (Supabase RPC):
  select * from public.get_discovery_candidates(p_limit := 20);

Ordering is deterministic: match_score DESC, profile_id ASC.
$c$;

-- ---------
-- RLS
-- ---------
alter table public.profiles enable row level security;
alter table public.interests enable row level security;
alter table public.user_interests enable row level security;
alter table public.photos enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

alter table public.profiles force row level security;
alter table public.interests force row level security;
alter table public.user_interests force row level security;
alter table public.photos force row level security;
alter table public.likes force row level security;
alter table public.matches force row level security;
alter table public.messages force row level security;

-- profiles
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy profiles_select_discoverable
  on public.profiles
  for select
  to authenticated
  using (is_discoverable and id <> auth.uid());

create policy profiles_insert_self
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- interests (read-only for authenticated)
create policy interests_select_all
  on public.interests
  for select
  to authenticated
  using (true);

-- user_interests
create policy user_interests_select_own
  on public.user_interests
  for select
  to authenticated
  using (user_id = auth.uid());

create policy user_interests_insert_own
  on public.user_interests
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy user_interests_delete_own
  on public.user_interests
  for delete
  to authenticated
  using (user_id = auth.uid());

-- photos
create policy photos_select_own
  on public.photos
  for select
  to authenticated
  using (user_id = auth.uid());

create policy photos_insert_own
  on public.photos
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy photos_update_own
  on public.photos
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy photos_delete_own
  on public.photos
  for delete
  to authenticated
  using (user_id = auth.uid());

-- likes
create policy likes_select_involving_user
  on public.likes
  for select
  to authenticated
  using (liker_id = auth.uid() or liked_id = auth.uid());

create policy likes_insert_own
  on public.likes
  for insert
  to authenticated
  with check (
    liker_id = auth.uid()
    and liked_id <> auth.uid()
    and public.can_like(auth.uid(), null)
    and exists (
      select 1
      from public.profiles p
      where p.id = liked_id
        and p.is_discoverable
    )
  );

create policy likes_delete_own
  on public.likes
  for delete
  to authenticated
  using (liker_id = auth.uid());

-- matches
create policy matches_select_participants
  on public.matches
  for select
  to authenticated
  using (auth.uid() = user1 or auth.uid() = user2);

-- messages
create policy messages_select_participants
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = messages.match_id
        and m.status = 'active'
        and (auth.uid() = m.user1 or auth.uid() = m.user2)
    )
  );

create policy messages_insert_sender_is_participant
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and m.status = 'active'
        and (auth.uid() = m.user1 or auth.uid() = m.user2)
    )
  );

-- ---------
-- Storage RLS policies (private bucket)
-- ---------
alter table storage.objects enable row level security;

create policy storage_profile_photos_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_profile_photos_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_profile_photos_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_profile_photos_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------
-- Grants (RLS still applies)
-- ---------
grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.interests to authenticated;
grant select, insert, delete on public.user_interests to authenticated;
grant select, insert, update, delete on public.photos to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select on public.matches to authenticated;
grant select, insert on public.messages to authenticated;

grant execute on function public.can_like(uuid, integer) to authenticated;
grant execute on function public.compute_match_score(uuid, uuid) to authenticated;
grant execute on function public.get_match_score(uuid) to authenticated;
grant execute on function public.get_discovery_candidates(integer, integer, numeric, integer) to authenticated;
grant execute on function public.mint_photo_signed_url(uuid, integer) to authenticated;
grant execute on function public.profile_completeness_score(uuid) to authenticated;

commit;
