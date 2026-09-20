# Vallenateando Radio

## Publicación de noticias
Esta versión usa Supabase Auth + RLS. Solo un usuario autenticado puede crear, editar o eliminar noticias.

### 1. Ejecutar Supabase
En **Supabase > SQL Editor** pega y ejecuta todo `setup.sql`.

### 2. Crear el administrador
Ve a **Authentication > Users > Add user** y crea el correo y contraseña que usarás en la web.

Si el proyecto exige confirmación de correo, confirma el usuario antes de iniciar sesión.

### 3. Configuración
`config.js` contiene la URL y la clave pública (`sb_publishable_...`). Esa clave se puede usar en el navegador. **Nunca uses una service_role key en este archivo.**

### 4. GitHub + Vercel
Sube todos los archivos a la raíz del repositorio y conecta el repositorio con Vercel.

### Si no permite publicar
Entra a **Iniciar sesión**, accede con el usuario creado en Supabase y luego pulsa **+ Nueva noticia**. Si falla, la versión nueva muestra el mensaje exacto devuelto por Supabase.


## Vallenateando Radio — versión profesional

Rediseño orientado a emisora online: identidad visual consistente, portada editorial, noticias destacadas, programación del día, contacto comercial y reproductor inferior persistente. El audio usa la señal HLS configurada en `config.js`.
