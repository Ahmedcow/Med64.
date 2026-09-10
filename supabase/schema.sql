-- Med64 secure cloud database
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  role text not null default 'student' check (role in ('admin','student')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  section text not null default 'General',
  category text not null default 'General',
  question text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index >= 0),
  explanation text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  attempts integer not null default 0,
  correct integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table if not exists public.user_mistakes (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists questions_section_idx on public.questions(section);
create index if not exists questions_category_idx on public.questions(category);
create index if not exists profiles_username_idx on public.profiles(username);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_mistakes enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "questions authenticated read" on public.questions;
create policy "questions authenticated read" on public.questions
for select to authenticated using (active = true or public.is_admin());

drop policy if exists "admin questions insert" on public.questions;
create policy "admin questions insert" on public.questions
for insert to authenticated with check (public.is_admin());

drop policy if exists "admin questions update" on public.questions;
create policy "admin questions update" on public.questions
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin questions delete" on public.questions;
create policy "admin questions delete" on public.questions
for delete to authenticated using (public.is_admin());

drop policy if exists "progress own" on public.user_progress;
create policy "progress own" on public.user_progress
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "mistakes own" on public.user_mistakes;
create policy "mistakes own" on public.user_mistakes
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Trigger to create a profile if an auth user is created directly.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- IMPORTANT: after creating your first admin through the Edge Function or manually,
-- ensure their profile has role='admin'.


insert into public.questions (id, legacy_id, section, category, question, options, correct_index, explanation, active)
values
('00000000-0000-0000-0000-000000000001','demo-cardio-1','Medicine','Cardiology','Which cardiac biomarker is most specific for myocardial injury?','["CK-MB","Troponin I","Myoglobin","LDH"]'::jsonb,1,'Cardiac troponins are highly specific for myocardial injury.',true),
('00000000-0000-0000-0000-000000000002','demo-anat-1','Basic Sciences','Anatomy','Which chamber pumps blood into the systemic circulation?','["Right atrium","Right ventricle","Left atrium","Left ventricle"]'::jsonb,3,'The left ventricle pumps oxygenated blood into the aorta.',true)
on conflict (id) do nothing;
