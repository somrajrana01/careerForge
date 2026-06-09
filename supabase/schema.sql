create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('STUDENT', 'TRAINER', 'PLACEMENT_OFFICER', 'ADMIN')),
  created_at timestamptz not null default now()
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  branch text not null,
  semester integer not null check (semester between 1 and 12),
  cgpa numeric(4, 2) not null check (cgpa between 0 and 10),
  github_url text,
  linkedin_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  category text not null check (category in ('SKILL', 'APTITUDE')),
  difficulty text not null default 'EASY',
  created_at timestamptz not null default now(),
  unique (title, category)
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_type text not null check (assessment_type in ('SKILL', 'APTITUDE')),
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions >= 0),
  percentage numeric(5, 2) not null check (percentage between 0 and 100),
  attempt_date timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'STUDENT');

  if requested_role not in ('STUDENT', 'TRAINER', 'PLACEMENT_OFFICER', 'ADMIN') then
    requested_role := 'STUDENT';
  end if;

  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    requested_role
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.questions enable row level security;
alter table public.assessment_attempts enable row level security;

drop policy if exists "Profiles are visible to signed-in users" on public.profiles;
create policy "Profiles are visible to signed-in users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can insert their profile" on public.profiles;
create policy "Users can insert their profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Students manage their own profile" on public.student_profiles;
create policy "Students manage their own profile"
on public.student_profiles for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Students manage their own resumes" on public.resumes;
create policy "Students manage their own resumes"
on public.resumes for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Signed-in users can read questions" on public.questions;
create policy "Signed-in users can read questions"
on public.questions for select
to authenticated
using (true);

drop policy if exists "Admins manage questions" on public.questions;
create policy "Admins manage questions"
on public.questions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Students manage their own attempts" on public.assessment_attempts;
create policy "Students manage their own attempts"
on public.assessment_attempts for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into public.questions (title, option_a, option_b, option_c, option_d, correct_answer, category, difficulty)
values
  ('Which data structure follows FIFO order?', 'Stack', 'Queue', 'Tree', 'Graph', 'B', 'SKILL', 'EASY'),
  ('What does HTTP status 201 indicate?', 'Bad request', 'Unauthorized', 'Created', 'Server error', 'C', 'SKILL', 'EASY'),
  ('Which SQL clause filters grouped rows?', 'WHERE', 'ORDER BY', 'HAVING', 'LIMIT', 'C', 'SKILL', 'MEDIUM'),
  ('What is the time complexity of binary search on a sorted array?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'B', 'SKILL', 'EASY'),
  ('Which React hook is used for local component state?', 'useMemo', 'useState', 'useRoute', 'useFetch', 'B', 'SKILL', 'EASY'),
  ('If 5 workers finish a task in 12 days, how many days will 10 workers take?', '3', '6', '12', '24', 'B', 'APTITUDE', 'EASY'),
  ('Find the next number: 2, 6, 12, 20, 30, ?', '36', '40', '42', '44', 'C', 'APTITUDE', 'MEDIUM'),
  ('A train travels 180 km in 3 hours. What is its speed?', '45 km/h', '50 km/h', '60 km/h', '75 km/h', 'C', 'APTITUDE', 'EASY'),
  ('What is 15% of 240?', '24', '30', '36', '42', 'C', 'APTITUDE', 'EASY'),
  ('If A is taller than B and B is taller than C, who is shortest?', 'A', 'B', 'C', 'Cannot say', 'C', 'APTITUDE', 'EASY')
on conflict do nothing;
