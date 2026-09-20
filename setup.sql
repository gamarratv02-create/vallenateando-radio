-- VALLENATEANDO RADIO - SUPABASE
-- Ejecuta TODO este archivo en Supabase > SQL Editor > Run.

create extension if not exists pgcrypto;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text default 'Noticias',
  summary text,
  content text not null,
  image_url text,
  video_url text,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Si la tabla ya existía de una versión anterior, agrega las columnas que falten.
alter table public.news add column if not exists title text;
alter table public.news add column if not exists slug text;
alter table public.news add column if not exists category text;
alter table public.news add column if not exists summary text;
alter table public.news add column if not exists content text;
alter table public.news add column if not exists image_url text;
alter table public.news add column if not exists video_url text;
alter table public.news add column if not exists published_at timestamptz;
alter table public.news add column if not exists created_at timestamptz;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  program_date date not null,
  day_name text,
  start_time time not null,
  end_time time not null,
  description text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text,
  link_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Valores por defecto para registros existentes.
update public.news set category='Noticias' where category is null;
update public.news set published_at=coalesce(published_at, created_at, now()) where published_at is null;
update public.news set created_at=coalesce(created_at, now()) where created_at is null;

alter table public.news enable row level security;
alter table public.programs enable row level security;
alter table public.ads enable row level security;

-- Permisos PostgREST.
grant select on public.news to anon;
grant select, insert, update, delete on public.news to authenticated;
grant select on public.programs to anon;
grant select, insert, update, delete on public.programs to authenticated;
grant select on public.ads to anon;
grant select, insert, update, delete on public.ads to authenticated;

-- Políticas de noticias.
drop policy if exists "Public read news" on public.news;
create policy "Public read news" on public.news
  for select to anon, authenticated using (true);

drop policy if exists "Authenticated manage news" on public.news;
create policy "Authenticated manage news" on public.news
  for all to authenticated
  using (true)
  with check (true);

-- Políticas de programación.
drop policy if exists "Public read programs" on public.programs;
create policy "Public read programs" on public.programs
  for select to anon, authenticated using (true);

drop policy if exists "Authenticated manage programs" on public.programs;
create policy "Authenticated manage programs" on public.programs
  for all to authenticated
  using (true)
  with check (true);

-- Políticas de publicidad.
drop policy if exists "Public read ads" on public.ads;
create policy "Public read ads" on public.ads
  for select to anon, authenticated using (true);

drop policy if exists "Authenticated manage ads" on public.ads;
create policy "Authenticated manage ads" on public.ads
  for all to authenticated
  using (true)
  with check (true);

-- Índices útiles.
create index if not exists news_published_at_idx on public.news (published_at desc);
create index if not exists news_created_at_idx on public.news (created_at desc);
create index if not exists programs_date_start_idx on public.programs (program_date, start_time);

-- IMPORTANTE:
-- 1. En Supabase > Authentication > Users crea el usuario administrador.
-- 2. Usa ese correo y contraseña en "Iniciar sesión" de la web.
-- 3. Si aparece "Email not confirmed", confirma el usuario en Authentication > Users.
-- 4. NO pongas una service_role key en config.js.
