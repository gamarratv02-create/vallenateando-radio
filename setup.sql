create extension if not exists pgcrypto;

create table if not exists public.programacion (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  titulo text not null,
  descripcion text,
  imagen_url text,
  created_at timestamptz default now()
);

create table if not exists public.noticias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text,
  resumen text,
  contenido text,
  imagen_url text,
  video_url text,
  created_at timestamptz default now()
);

create table if not exists public.publicidad (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  imagen_url text,
  enlace text,
  created_at timestamptz default now()
);

alter table public.programacion enable row level security;
alter table public.noticias enable row level security;
alter table public.publicidad enable row level security;

drop policy if exists "programacion_public_read" on public.programacion;
create policy "programacion_public_read" on public.programacion for select using (true);

drop policy if exists "programacion_auth_all" on public.programacion;
create policy "programacion_auth_all" on public.programacion for all to authenticated using (true) with check (true);

drop policy if exists "noticias_public_read" on public.noticias;
create policy "noticias_public_read" on public.noticias for select using (true);

drop policy if exists "noticias_auth_all" on public.noticias;
create policy "noticias_auth_all" on public.noticias for all to authenticated using (true) with check (true);

drop policy if exists "publicidad_public_read" on public.publicidad;
create policy "publicidad_public_read" on public.publicidad for select using (true);

drop policy if exists "publicidad_auth_all" on public.publicidad;
create policy "publicidad_auth_all" on public.publicidad for all to authenticated using (true) with check (true);

insert into storage.buckets (id,name,public)
values ('media','media',true)
on conflict (id) do update set public=true;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects for select using (bucket_id='media');

drop policy if exists "media_auth_insert" on storage.objects;
create policy "media_auth_insert" on storage.objects for insert to authenticated with check (bucket_id='media');

drop policy if exists "media_auth_update" on storage.objects;
create policy "media_auth_update" on storage.objects for update to authenticated using (bucket_id='media') with check (bucket_id='media');

drop policy if exists "media_auth_delete" on storage.objects;
create policy "media_auth_delete" on storage.objects for delete to authenticated using (bucket_id='media');
