-- ===========================================================
--  Lourdes College SHS Department — Supabase schema
--  Run this once in the Supabase SQL editor (Project > SQL Editor)
-- ===========================================================

-- 1. TEACHERS TABLE ------------------------------------------------
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  position text,
  subject text,
  advisory_class text,
  email text,
  phone text,
  bio text,
  photo_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 2. ADMINS TABLE ----------------------------------------------------
-- A row here means that auth user is an administrator.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp default now()
);

-- Helper function: is the current logged-in user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- 3. KEEP updated_at CURRENT ------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_teachers_updated_at on public.teachers;
create trigger trg_teachers_updated_at
  before update on public.teachers
  for each row execute procedure public.set_updated_at();

-- 4. ROW LEVEL SECURITY -----------------------------------------------
alter table public.teachers enable row level security;
alter table public.admins enable row level security;

-- Anyone (including anonymous website visitors) can read the faculty list
create policy "Public can view teachers"
  on public.teachers for select
  using (true);

-- Teachers can update only their own record
create policy "Teachers can update own record"
  on public.teachers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can insert / update / delete any teacher record
create policy "Admins can insert teachers"
  on public.teachers for insert
  with check (public.is_admin());

create policy "Admins can update any teacher"
  on public.teachers for update
  using (public.is_admin());

create policy "Admins can delete teachers"
  on public.teachers for delete
  using (public.is_admin());

-- Only admins may read the admins table
create policy "Admins can view admins table"
  on public.admins for select
  using (public.is_admin());

-- 5. STORAGE BUCKET FOR PROFILE PHOTOS ---------------------------------
insert into storage.buckets (id, name, public)
values ('faculty-images', 'faculty-images', true)
on conflict (id) do nothing;

-- Anyone can view images (bucket is public)
create policy "Public can view faculty images"
  on storage.objects for select
  using (bucket_id = 'faculty-images');

-- Authenticated users can upload files into a folder named after their own uid
create policy "Users can upload their own faculty image"
  on storage.objects for insert
  with check (
    bucket_id = 'faculty-images'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own faculty image"
  on storage.objects for update
  using (
    bucket_id = 'faculty-images'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Admins can manage all faculty images"
  on storage.objects for all
  using (bucket_id = 'faculty-images' and public.is_admin());

-- ===========================================================
--  To create your first administrator:
--  1. Sign the person up normally through Supabase Auth
--     (e.g. via the login.html "forgot password" flow, or
--     Authentication > Users > Add user in the dashboard).
--  2. Then run:
--     insert into public.admins (user_id)
--     values ('THE-USER-UUID-HERE');
-- ===========================================================
