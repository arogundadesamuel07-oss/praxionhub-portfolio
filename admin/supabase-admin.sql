-- THIS FILE IS REQUIRED FOR THE SECURE ADMIN DASHBOARD.
-- It is intentionally separate from the public website and should be applied in Supabase SQL editor only after approval.

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Label contact and project submissions without changing existing records.
alter table public.client_requests
  add column if not exists request_type text not null default 'project';

-- Count unique browsers that visit the website. The visitor_id is generated in the browser.
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.site_visits enable row level security;

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  );
$$;

create or replace function public.record_site_visit(p_visitor_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.site_visits (visitor_id)
  values (p_visitor_id)
  on conflict (visitor_id)
  do update set last_seen_at = now();
$$;

grant execute on function public.record_site_visit(uuid) to anon, authenticated;

drop policy if exists "Admins can read site visits" on public.site_visits;
create policy "Admins can read site visits"
on public.site_visits
for select
using (public.is_admin());

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record"
on public.admin_users
for select
using (user_id = auth.uid() and is_active = true);

drop policy if exists "Admins can manage admin records" on public.admin_users;
create policy "Admins can manage admin records"
on public.admin_users
for all
using (public.is_admin())
with check (public.is_admin());

-- Make the new table available immediately through the Supabase REST API.
notify pgrst, 'reload schema';

-- Protect advertisement approval actions
drop policy if exists "Admin can read advertisements" on public.advertisements;
create policy "Admin can read advertisements"
on public.advertisements
for select
using (public.is_admin());

drop policy if exists "Admin can update advertisements" on public.advertisements;
create policy "Admin can update advertisements"
on public.advertisements
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin can delete advertisements" on public.advertisements;
create policy "Admin can delete advertisements"
on public.advertisements
for delete
using (public.is_admin());

-- Protect client request visibility
drop policy if exists "Admin can read client requests" on public.client_requests;
create policy "Admin can read client requests"
on public.client_requests
for select
using (public.is_admin());

drop policy if exists "Admin can update client requests" on public.client_requests;
create policy "Admin can update client requests"
on public.client_requests
for update
using (public.is_admin())
with check (public.is_admin());

-- Public operations remain unchanged for normal users.
-- The public website can continue using its existing insert/select logic.
-- Admins are the only users who can perform protected dashboard actions.

-- Example assignment: only a trusted database admin or authorized backend process should insert into admin_users.
-- Example:
-- insert into public.admin_users (user_id, email, is_active)
-- values (
--   'PUT_AUTH_USER_ID_HERE',
--   'admin@yourdomain.com',
--   true
-- );

-- Important: users must never be able to self-assign admin privileges from the frontend.
