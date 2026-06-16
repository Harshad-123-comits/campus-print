# Supabase Setup

This project now uses Supabase for:

- `Auth` for shopkeeper login
- `Postgres` for print job records
- `Postgres` for dynamic shop records
- `Storage` for uploaded files

## 1. Add your project keys

Open [supabase.js](/c:/Users/admin/Desktop/Mini%20Pro/supabase.js) and replace:

- `https://YOUR_PROJECT_ID.supabase.co`
- `YOUR_SUPABASE_ANON_KEY`

with your real Supabase project URL and anon key from:

- `Supabase Dashboard -> Project Settings -> API`

## 2. Enable email/password auth

In Supabase Dashboard:

1. Open `Authentication`.
2. Make sure `Email` sign-in is enabled.
3. Create one auth user for each shopkeeper from `Authentication -> Users`.

## 3. Create the shops table

Run this SQL in the Supabase SQL editor:

```sql
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  location text,
  description text,
  accent text default 'blue',
  shopkeeper_email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

Add a row for each shopkeeper. Example:

```sql
insert into public.shops (slug, name, location, description, accent, shopkeeper_email)
values
  ('north-campus-print', 'North Campus Print', 'Library Block', 'Fast document printing near the main reading hall.', 'blue', 'north@campusprint.com'),
  ('central-copy-hub', 'Central Copy Hub', 'Student Center', 'Handles color work, assignments, and project packets.', 'gold', 'central@campusprint.com'),
  ('south-gate-prints', 'South Gate Prints', 'South Entrance', 'Quick pickup point for last-minute print jobs.', 'emerald', 'south@campusprint.com');
```

When you add a new row in `public.shops`, it will appear automatically on the choose page.

## 4. Create the jobs table

Run this SQL in the Supabase SQL editor:

```sql
create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text not null,
  file_url text not null,
  shop_slug text not null,
  shop_name text not null,
  shopkeeper_email text not null,
  copies integer not null check (copies > 0),
  print_type text not null,
  payment_method text not null,
  status text not null default 'Pending',
  submitted_at timestamptz not null default now()
);
```

If you already created the `jobs` table earlier, add the new columns with:

```sql
alter table public.jobs add column if not exists shop_slug text;
alter table public.jobs add column if not exists shop_name text;
alter table public.jobs add column if not exists shopkeeper_email text;
```

Then backfill any old rows if needed before making them `not null`.

## 5. Create the storage bucket

Create a public bucket named:

- `print-files`

## 6. Add policies

Run this SQL in the Supabase SQL editor:

```sql
alter table public.shops enable row level security;
alter table public.jobs enable row level security;

create policy "Anyone can read active shops"
on public.shops
for select
to anon, authenticated
using (is_active = true);

create policy "Anyone can insert jobs"
on public.jobs
for insert
to anon, authenticated
with check (true);

create policy "Authenticated users can read jobs"
on public.jobs
for select
to authenticated
using (true);

create policy "Authenticated users can update jobs"
on public.jobs
for update
to authenticated
using (true)
with check (true);
```

Then create Storage policies for bucket `print-files`:

```sql
create policy "Anyone can upload print files"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'print-files');

create policy "Anyone can read print files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'print-files');
```

## 7. Local testing

Run the site through a local server:

```powershell
python -m http.server 5500
```

Then open:

```txt
http://localhost:5500/index.html
```
