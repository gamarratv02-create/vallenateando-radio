# Vallenateando Radio

Proyecto estático para Vercel + Supabase.

## Archivos
- index.html: página pública.
- styles.css: diseño responsive.
- app.js: reproductor, programación, noticias y publicidad.
- admin.html / admin.js: panel administrativo.
- config.js: conexión de Supabase y señal.
- supabase.js: cliente Supabase.
- setup.sql: tablas, políticas y almacenamiento.

## Instalación
1. Sube todos los archivos al repositorio de GitHub.
2. En Supabase abre SQL Editor y ejecuta `setup.sql`.
3. En Authentication > Users crea el usuario administrador.
4. En Vercel importa el repositorio.
5. Configura el dominio `vallenateandoradio.com`.

La clave incluida en `config.js` es una clave publicable de Supabase. Nunca reemplazarla por una `service_role` o clave secreta.

## Noticias desde el administrador
El panel permite crear, editar y eliminar noticias. La imagen puede subirse directamente desde el computador al bucket público `media` de Supabase.

## Páginas
El menú está separado en páginas independientes: Inicio, En vivo, Programación, Noticias, Publicidad y Contacto. El botón "Escuchar en vivo" de Inicio activa la emisora con un clic. En las demás páginas el reproductor inferior permite activarla.

## Enlaces individuales de noticias
Cada noticia publicada abre en `noticia.html?id=ID`, por lo que cada noticia tiene su propio enlace para compartir.
