-- VALLENATEANDO RADIO - CONFIGURACIÓN INICIAL SUPABASE
-- Ejecuta este script en Supabase > SQL Editor.
-- Luego crea un usuario desde Authentication > Users.

create extension if not exists pgcrypto;

create table if not exists public.programacion (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  nombre_programa text not null,
  descripcion text,
  imagen_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.noticias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  resumen text,
  contenido text not null,
  categoria text,
  imagen_url text,
  video_url text,
  publicado boolean not null default false,
  fecha_publicacion timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.publicidad (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  imagen_url text not null,
  enlace_url text,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.programacion enable row level security;
alter table public.noticias enable row level security;
alter table public.publicidad enable row level security;

-- Lectura pública
create policy "programacion_public_read" on public.programacion for select using (true);
create policy "noticias_public_read" on public.noticias for select using (publicado = true);
create policy "publicidad_public_read" on public.publicidad for select using (activo = true);

-- Administración: cualquier usuario autenticado
create policy "programacion_auth_all" on public.programacion for all to authenticated using (true) with check (true);
create policy "noticias_auth_all" on public.noticias for all to authenticated using (true) with check (true);
create policy "publicidad_auth_all" on public.publicidad for all to authenticated using (true) with check (true);

-- Bucket para imágenes.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_public_read" on storage.objects for select using (bucket_id = 'media');
create policy "media_auth_insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media_auth_update" on storage.objects for update to authenticated using (bucket_id = 'media') with check (bucket_id = 'media');
create policy "media_auth_delete" on storage.objects for delete to authenticated using (bucket_id = 'media');
