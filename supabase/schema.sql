-- Anatomi 101 V2: run in the Supabase SQL editor before enabling the client.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  avatar_frame text not null default 'starter',
  streak integer not null default 0 check (streak >= 0),
  timezone text not null default 'Europe/Istanbul',
  last_daily_answer_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  anatomy_structure_id text not null,
  question_tr text not null,
  correct_latin text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 3),
  created_at timestamptz not null default now()
);

create table public.daily_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
  selected_latin text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique(profile_id, challenge_id)
);

create table public.profile_frames (
  id text primary key,
  title text not null,
  requirement integer not null unique check (requirement in (0, 10, 20, 50, 75, 100)),
  css_token text not null
);

insert into public.profile_frames (id, title, requirement, css_token) values
  ('starter', 'Başlangıç', 0, 'mint'),
  ('coral-10', 'Mercan Rozeti', 10, 'coral'),
  ('aqua-20', 'Aqua Atlas', 20, 'aqua'),
  ('violet-50', 'Violet Scholar', 50, 'violet'),
  ('gold-75', 'Altın Anatomi', 75, 'gold'),
  ('platinum-100', 'Platin Hekim', 100, 'platinum')
on conflict (id) do nothing;

-- Every authenticated user must have a profile before streak RPC calls run.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_display_name text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Öğrenci'
  );
  if char_length(v_display_name) < 2 then v_display_name := 'Öğrenci'; end if;

  insert into public.profiles(id, display_name)
  values(new.id, left(v_display_name, 40))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.profile_frame_unlocks (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  frame_id text not null references public.profile_frames(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (profile_id, frame_id)
);

alter table public.profiles enable row level security;
alter table public.daily_attempts enable row level security;
alter table public.profile_frame_unlocks enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.profile_frames enable row level security;

create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
create policy "read own attempts" on public.daily_attempts for select using (auth.uid() = profile_id);
create policy "read own frame unlocks" on public.profile_frame_unlocks for select using (auth.uid() = profile_id);
create policy "read challenges" on public.daily_challenges for select using (true);
create policy "read frames" on public.profile_frames for select using (true);

-- Direct profile edits may change presentation fields, but never streak state.
-- SECURITY DEFINER gamification functions run as the function owner and bypass
-- this client-role guard after validating the answer server-side.
create or replace function public.protect_profile_progress()
returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if new.streak is distinct from old.streak
      or new.last_daily_answer_on is distinct from old.last_daily_answer_on then
      raise exception 'streak fields can only be changed by the daily challenge service';
    end if;

    if new.avatar_frame is distinct from old.avatar_frame
      and not exists (
        select 1 from public.profile_frame_unlocks
        where profile_id = old.id and frame_id = new.avatar_frame
      ) then
      raise exception 'profile frame is locked';
    end if;

    if not exists (select 1 from pg_timezone_names where name = new.timezone) then
      raise exception 'invalid timezone';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists protect_profile_progress on public.profiles;
create trigger protect_profile_progress
  before update on public.profiles
  for each row execute procedure public.protect_profile_progress();

-- Use this SECURITY DEFINER RPC for the first answer of a day. It prevents
-- client-side streak manipulation and awards every reached frame atomically.
create or replace function public.submit_daily_answer(p_challenge_id uuid, p_selected_latin text)
returns table(streak integer, is_correct boolean, unlocked_frames text[])
language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles%rowtype;
  v_challenge public.daily_challenges%rowtype;
  v_correct boolean;
  v_next_streak integer;
  v_today date := (now() at time zone 'Europe/Istanbul')::date;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into v_profile from public.profiles where id = auth.uid() for update;
  if v_profile.id is null then raise exception 'profile unavailable'; end if;
  v_today := (now() at time zone coalesce(v_profile.timezone, 'Europe/Istanbul'))::date;
  select * into v_challenge from public.daily_challenges where id = p_challenge_id and challenge_date = v_today;
  if v_challenge.id is null then raise exception 'daily challenge unavailable'; end if;
  if exists(select 1 from public.daily_attempts where profile_id = auth.uid() and challenge_id = p_challenge_id) then raise exception 'challenge already answered'; end if;
  v_correct := p_selected_latin = v_challenge.correct_latin;
  v_next_streak := case when v_correct and v_profile.last_daily_answer_on = v_today - 1 then v_profile.streak + 1 when v_correct then 1 else 0 end;
  insert into public.daily_attempts(profile_id, challenge_id, selected_latin, is_correct) values(auth.uid(), p_challenge_id, p_selected_latin, v_correct);
  update public.profiles set streak = v_next_streak, last_daily_answer_on = v_today, updated_at = now() where id = auth.uid();
  insert into public.profile_frame_unlocks(profile_id, frame_id)
    select auth.uid(), id from public.profile_frames where requirement <= v_next_streak on conflict do nothing;
  return query
    select v_next_streak, v_correct, coalesce(array_agg(unlocks.frame_id), array[]::text[])
    from public.profile_frame_unlocks as unlocks
    where unlocks.profile_id = auth.uid();
end $$;

revoke all on function public.submit_daily_answer(uuid, text) from public;
grant execute on function public.submit_daily_answer(uuid, text) to authenticated;
