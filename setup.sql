create extension if not exists pgcrypto;

create table if not exists public.news (
 id uuid primary key default gen_random_uuid(), title text not null, slug text unique not null, category text default 'Noticias', summary text, content text not null, image_url text, video_url text, published_at timestamptz default now(), created_at timestamptz default now()
);
create table if not exists public.programs (
 id uuid primary key default gen_random_uuid(), title text not null, program_date date not null, day_name text, start_time time not null, end_time time not null, description text, image_url text, created_at timestamptz default now()
);
create table if not exists public.ads (
 id uuid primary key default gen_random_uuid(), title text, image_url text, link_url text, active boolean default true, created_at timestamptz default now()
);

alter table public.news enable row level security;
alter table public.programs enable row level security;
alter table public.ads enable row level security;

drop policy if exists "Public read news" on public.news;
create policy "Public read news" on public.news for select using (true);
drop policy if exists "Authenticated manage news" on public.news;
create policy "Authenticated manage news" on public.news for all to authenticated using (true) with check (true);

drop policy if exists "Public read programs" on public.programs;
create policy "Public read programs" on public.programs for select using (true);
drop policy if exists "Authenticated manage programs" on public.programs;
create policy "Authenticated manage programs" on public.programs for all to authenticated using (true) with check (true);

drop policy if exists "Public read ads" on public.ads;
create policy "Public read ads" on public.ads for select using (true);
drop policy if exists "Authenticated manage ads" on public.ads;
create policy "Authenticated manage ads" on public.ads for all to authenticated using (true) with check (true);

-- Después de ejecutar este SQL, crea el usuario administrador en Supabase > Authentication > Users.
