# Vallenateando Radio

Sitio web estático para Vallenateando Radio, preparado para GitHub + Vercel.

## Archivos
- `index.html`: estructura del sitio.
- `styles.css`: diseño responsive.
- `app.js`: navegación, reproductor, noticias, programación y login.
- `config.js`: señal, logo, Supabase y contacto.
- `setup.sql`: tablas y políticas de Supabase.
- `.env.example`: referencia de variables si después migras a un build con variables de entorno.

## Publicar
Sube todos los archivos a la raíz del repositorio de GitHub y conecta el repositorio a Vercel.

## Supabase
Ejecuta `setup.sql` en SQL Editor. Luego crea el usuario administrador en Authentication > Users. No pongas una `service_role` key en el frontend.
