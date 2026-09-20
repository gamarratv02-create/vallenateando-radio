import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const C = window.APP_CONFIG;
const sb = createClient(C.supabaseUrl, C.supabaseKey);
const app = document.querySelector('#app');
const audio = document.querySelector('#audio');
const playBtn = document.querySelector('#playBtn');
const menuToggle = document.querySelector('#menuToggle');
const nav = document.querySelector('#mainNav');
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

let hls = null;
let audioInitialized = false;

function setupAudio() {
  if (audioInitialized) return;
  audioInitialized = true;
  if (window.Hls && Hls.isSupported()) {
    hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    hls.loadSource(C.streamUrl);
    hls.attachMedia(audio);
  } else {
    audio.src = C.streamUrl;
  }
}
setupAudio();

audio.addEventListener('playing', () => {
  playBtn.textContent = '❚❚';
  document.body.classList.add('playing');
});
audio.addEventListener('pause', () => {
  playBtn.textContent = '▶';
  document.body.classList.remove('playing');
});
audio.addEventListener('error', () => console.warn('No se pudo cargar la señal de Vallenateando Radio'));

async function toggle() {
  try {
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  } catch (e) {
    alert('No fue posible iniciar la señal. Pulsa nuevamente el botón de reproducción.');
  }
}
playBtn?.addEventListener('click', toggle);
document.querySelector('.big-play')?.addEventListener('click', toggle);
document.querySelector('#volume')?.addEventListener('input', e => audio.volume = Number(e.target.value));
audio.volume = .85;

menuToggle?.addEventListener('click', () => nav?.classList.toggle('open'));
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

function esc(s = '') {
  return String(s).replace(/[&<>\'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function slugify(s='') {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function fmtDate(v) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-CO', {day:'numeric', month:'long', year:'numeric'});
}

async function getNews() {
  const { data, error } = await sb.from('news').select('*').order('published_at', { ascending:false, nullsFirst:false }).order('created_at', { ascending:false }).limit(50);
  if (error) {
    console.error('Error cargando noticias:', error);
    return { data: [], error };
  }
  return { data: data || [], error:null };
}

async function getPrograms() {
  const d = new Date();
  const localDate = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Bogota' }).format(d);
  const day = new Intl.DateTimeFormat('es-CO', { weekday:'long', timeZone:'America/Bogota' }).format(d).toLowerCase();
  const r = await sb.from('programs').select('*').eq('program_date', localDate).order('start_time');
  if (r.error) return { data:[], error:r.error };
  if (r.data?.length) return { data:r.data, error:null };
  const fallback = await sb.from('programs').select('*').eq('day_name', day).order('start_time');
  return { data:fallback.data || [], error:fallback.error || null };
}

function newsError(error) {
  return `<div class="empty error-box"><strong>No se pudieron cargar las noticias.</strong><p>${esc(error?.message || 'Revisa la conexión con Supabase y las políticas RLS de la tabla news.')}</p></div>`;
}

function newsCards(items) {
  return items.length ? `<div class="cards">${items.map(n => `
    <a class="card" href="#/noticia/${encodeURIComponent(n.slug || n.id)}">
      <div class="card-image"><img src="${esc(n.image_url || C.logoUrl)}" alt="${esc(n.title || 'Noticia')}" loading="lazy" onerror="this.src='${esc(C.logoUrl)}'"></div>
      <div class="card-body"><span class="tag">${esc(n.category || 'Noticias')}</span><h3>${esc(n.title || 'Sin título')}</h3><p>${esc(n.summary || n.content || '')}</p><small>${esc(fmtDate(n.published_at || n.created_at))}</small><span class="read-more">LEER NOTICIA →</span></div>
    </a>`).join('')}</div>` : `<div class="empty">Todavía no hay noticias publicadas.</div>`;
}

function programs(items) {
  return items.length ? `<div class="program-grid">${items.map(p => `<div class="program">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.title || 'Programa')}" loading="lazy">` : ''}<div class="date">${esc(p.program_date || 'Programación')}</div><h3>${esc(p.title || p.name || '')}</h3><p><strong>${esc(p.start_time || '')} — ${esc(p.end_time || '')}</strong></p><p>${esc(p.description || '')}</p></div>`).join('')}</div>` : `<div class="empty">No hay programación cargada para hoy.</div>`;
}

async function home(){
  const [nr, pr] = await Promise.all([getNews(), getPrograms()]);
  const items = nr.data || [];
  const featured = items[0];
  const secondary = items.slice(1,5);
  const newsHtml = nr.error ? newsError(nr.error) : (featured ? `
    <div class="news-showcase">
      <a class="featured-news" href="#/noticia/${encodeURIComponent(featured.slug || featured.id)}">
        <div class="featured-media"><img src="${esc(featured.image_url || C.logoUrl)}" alt="${esc(featured.title || 'Noticia destacada')}" loading="eager" onerror="this.src='${esc(C.logoUrl)}'"></div>
        <div class="featured-overlay"></div>
        <div class="featured-content"><span class="tag">${esc(featured.category || 'Noticias')}</span><h3>${esc(featured.title || 'Sin título')}</h3><p>${esc(featured.summary || featured.content || '')}</p><small>${esc(fmtDate(featured.published_at || featured.created_at))}</small></div>
      </a>
      <div class="secondary-news">${secondary.map(n=>`<a class="secondary-card" href="#/noticia/${encodeURIComponent(n.slug || n.id)}"><div class="secondary-media"><img src="${esc(n.image_url || C.logoUrl)}" alt="${esc(n.title || 'Noticia')}" loading="lazy" onerror="this.src='${esc(C.logoUrl)}'"></div><div class="secondary-body"><span class="tag">${esc(n.category || 'Noticias')}</span><h3>${esc(n.title || 'Sin título')}</h3><small>${esc(fmtDate(n.published_at || n.created_at))}</small></div></a>`).join('')}</div>
    </div>` : `<div class="empty">Todavía no hay noticias publicadas.</div>`);
  app.innerHTML = `<section class="hero"><div class="container hero-grid"><div class="hero-copy"><div class="hero-status"><span class="hero-live-dot"></span> TRANSMISIÓN EN VIVO · 24/7</div><h1>Vallenateando<br><em>Radio</em></h1><p>El sonido del vallenato, la música que nos conecta y la información que necesitas. Escúchanos en vivo desde cualquier lugar.</p><div class="hero-actions"><button class="btn btn-primary" id="heroPlay"><span>▶</span> Escuchar en vivo</button><a class="btn btn-ghost" href="#programacion">Ver programación <span>→</span></a></div><div class="hero-trust"><span>● Señal online</span><span>● Música 24/7</span><span>● Noticias</span></div></div><div class="hero-art"><div class="hero-art-glow"></div><img src="${esc(C.logoUrl)}" alt="Vallenateando Radio"><div class="hero-art-label"><span>ON AIR</span><strong>VALLENATEANDO</strong></div></div></div></section>
  <section class="quick-bar"><div class="container quick-grid"><a href="#en-vivo"><span class="quick-icon">▶</span><span><b>Escucha en vivo</b><small>Señal 24/7</small></span></a><a href="#programacion"><span class="quick-icon">◷</span><span><b>Programación</b><small>Consulta la agenda de hoy</small></span></a><a href="#noticias"><span class="quick-icon">✦</span><span><b>Últimas noticias</b><small>Información y actualidad</small></span></a><a href="#contacto"><span class="quick-icon">✆</span><span><b>Contáctanos</b><small>Publicidad y alianzas</small></span></a></div></section>
  <section class="section live-section"><div class="container"><div class="live-card premium-live"><div class="live-card-copy"><span class="live-badge">EN DIRECTO AHORA</span><h2>Vallenateando Radio</h2><p>Activa el reproductor inferior y continúa escuchando mientras recorres todas las páginas.</p><div class="signal-pills"><span>● Señal estable</span><span>24 horas</span><span>7 días</span></div></div><button class="big-play" id="heroBigPlay" aria-label="Escuchar en vivo">▶</button></div></div></section>
  <section class="section news-section"><div class="container"><div class="section-head"><div><p>ACTUALIDAD</p><h2>Lo último de Vallenateando</h2></div><a class="btn btn-outline" href="#noticias">Ver todas las noticias <span>→</span></a></div>${newsHtml}</div></section>
  <section class="section schedule-section"><div class="container"><div class="section-head"><div><p>HOY EN LA EMISORA</p><h2>Programación de hoy</h2></div><a class="btn btn-outline" href="#programacion">Ver agenda completa <span>→</span></a></div>${programs(pr.data)}</div></section>
  <section class="section contact-section"><div class="container"><div class="contact-box premium-contact"><div><span class="kicker">Hablemos</span><h2>¿Quieres anunciarte en Vallenateando Radio?</h2><p>Contáctanos para publicidad, alianzas, contenidos y propuestas comerciales.</p></div><div class="contact-actions"><a class="contact-item" href="https://wa.me/573013799517" target="_blank" rel="noopener"><span>📱</span><div><small>WhatsApp / Teléfono</small><strong>${esc(C.contactPhone)}</strong></div></a><a class="contact-item" href="mailto:${esc(C.contactEmail)}"><span>✉</span><div><small>Correo electrónico</small><strong>${esc(C.contactEmail)}</strong></div></a></div></div></div></section>`;
  document.querySelector('#heroPlay')?.addEventListener('click', toggle);
  document.querySelector('#heroBigPlay')?.addEventListener('click', toggle);
}

async function live(){
  app.innerHTML=`<section class="page"><div class="container"><span class="kicker">Señal en vivo</span><h1 class="page-title">Vallenateando Radio en vivo</h1><p class="muted">Escucha nuestra señal online mientras navegas por el sitio.</p><div class="live-card" style="margin-top:24px"><div><span class="live-badge">EN DIRECTO</span><h2>Vallenateando Radio</h2><p>Lo mejor del vallenato, siempre contigo.</p></div><button class="big-play" id="livePlay">▶</button></div></div></section>`;
  document.querySelector('#livePlay')?.addEventListener('click', toggle);
}

async function schedule(){
  const r=await getPrograms();
  app.innerHTML=`<section class="page"><div class="container"><span class="kicker">Agenda</span><h1 class="page-title">Programación de hoy</h1><p class="muted">La agenda se muestra según la fecha actual y puede ser administrada desde “Iniciar sesión”.</p><div style="margin-top:24px">${programs(r.data)}</div></div></section>`;
}

async function news(){
  const r=await getNews();
  app.innerHTML=`<section class="page"><div class="container"><span class="kicker">Actualidad</span><h1 class="page-title">Noticias</h1><p class="muted">Información y contenidos de Vallenateando Radio.</p><div style="margin-top:24px">${r.error ? newsError(r.error) : newsCards(r.data)}</div></div></section>`;
}

async function article(slug){
  let q=await sb.from('news').select('*').eq('slug',slug).maybeSingle();
  let n=q.data;
  if(!n){ const r=await sb.from('news').select('*').eq('id',slug).maybeSingle(); n=r.data; }
  if(!n){ app.innerHTML=`<section class="page"><div class="container"><div class="empty">No encontramos esta noticia.</div></div></section>`; return; }
  const title=esc(n.title||'Noticias'), category=esc(n.category||'Noticias'), image=esc(n.image_url||C.logoUrl), date=fmtDate(n.published_at||n.created_at), summary=esc(n.summary||'');
  const raw=String(n.content||n.summary||'');
  const paragraphs=raw.split(/\n\s*\n|\r?\n/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
  const url=location.href;
  app.innerHTML=`<section class="article-page"><div class="container article-shell"><div class="article-back"><a href="#noticias">← Volver a noticias</a> <span class="tag">${category}</span></div><article class="article article-modern"><div class="article-body"><span class="article-kicker">Vallenateando Radio · Noticias</span><h1>${title}</h1>${summary?`<p class="article-lead">${summary}</p>`:''}${date?`<div class="article-meta">Publicado el ${date}</div>`:''}</div><figure class="article-cover"><img src="${image}" alt="${title}" loading="eager" onerror="this.src='${esc(C.logoUrl)}'"></figure><div class="article-body article-copy"><div class="share-row"><button class="share-btn" id="shareNews">↗ Compartir noticia</button><button class="share-btn light" id="copyNews">⧉ Copiar enlace</button></div><div class="content">${paragraphs||'<p>Consulta la información completa de esta noticia.</p>'}</div>${n.video_url?`<div class="article-video"><video controls playsinline preload="metadata" src="${esc(n.video_url)}"></video></div>`:''}<div class="article-end"><a class="btn btn-primary" href="#noticias">← Ver más noticias</a></div></div></article></div></section>`;
  document.querySelector('#shareNews')?.addEventListener('click',async()=>{try{if(navigator.share) await navigator.share({title:n.title||'Vallenateando Radio',text:n.summary||n.title||'',url});else{await navigator.clipboard.writeText(url);alert('Enlace copiado.')}}catch(e){}});
  document.querySelector('#copyNews')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(url);const b=document.querySelector('#copyNews');const old=b.textContent;b.textContent='✓ Enlace copiado';setTimeout(()=>b.textContent=old,1800)}catch(e){alert('No fue posible copiar el enlace.')}});
}

async function contact(){
  app.innerHTML=`<section class="page"><div class="container"><span class="kicker">Estamos para escucharte</span><h1 class="page-title">Contacto</h1><div class="contact-box" style="margin-top:24px"><div><h2>Vallenateando Radio</h2><p>Comunícate con nosotros para información, publicidad, alianzas y contenidos.</p></div><div><div class="contact-item">📱 <strong>WhatsApp / Teléfono</strong><br><a href="https://wa.me/573013799517" target="_blank">${esc(C.contactPhone)}</a></div><div class="contact-item" style="margin-top:12px">✉️ <strong>Correo electrónico</strong><br><a href="mailto:${esc(C.contactEmail)}">${esc(C.contactEmail)}</a></div></div></div></div></section>`;
}

async function currentSession(){
  const { data, error } = await sb.auth.getSession();
  if (error) { console.error('Supabase auth:', error); return null; }
  return data.session || null;
}

function friendlyAuthError(error){
  const m = String(error?.message || 'Error desconocido');
  if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos. Verifica el usuario en Supabase > Authentication > Users.';
  if (/email not confirmed/i.test(m)) return 'El correo del administrador no está confirmado. En Supabase > Authentication > Users abre el usuario y confirma el correo, o desactiva la confirmación de email para las pruebas.';
  if (/failed to fetch|network/i.test(m)) return 'No se pudo conectar con Supabase. Revisa la URL y la clave pública en config.js y la configuración de Vercel.';
  return m;
}

async function saveNews(payload){
  const session = await currentSession();
  if(!session) return { error: { message: 'Tu sesión de administrador no está activa. Vuelve a Iniciar sesión.' } };
  return await sb.from('news').insert(payload).select().single();
}

async function admin(){
  const session=await currentSession();
  if(!session){
    app.innerHTML=`<section class="page"><div class="container"><div class="form-card"><span class="kicker">Administración</span><h1>Iniciar sesión</h1><p class="muted">Ingresa con el usuario administrador creado en Supabase.</p><form id="login"><label>Correo</label><input id="email" type="email" required><label>Contraseña</label><input id="pass" type="password" required><div class="form-actions"><button class="btn btn-primary">Entrar</button></div><p id="loginMsg" class="muted"></p></form></div></div></section>`;
    document.querySelector('#login').onsubmit=async e=>{
      e.preventDefault();
      const msg=document.querySelector('#loginMsg');
      const button=document.querySelector('#login button');
      const email=document.querySelector('#email').value.trim();
      const pass=document.querySelector('#pass').value;
      button.disabled=true; msg.textContent='Verificando acceso…';
      const r=await sb.auth.signInWithPassword({email,password:pass});
      button.disabled=false;
      if(r.error){ msg.textContent=friendlyAuthError(r.error); return; }
      location.hash='#admin';
      await admin();
    };
    return;
  }
  const r=await getNews();
  const p=await getPrograms();
  const newsList=r.error ? `<div class="empty error-box">${esc(r.error.message)}</div>` : (r.data.length ? `<div class="admin-list">${r.data.map(n=>`<div class="admin-item"><div class="admin-thumb">${n.image_url?`<img src="${esc(n.image_url)}" alt="">`:'📰'}</div><div class="admin-info"><span class="tag">${esc(n.category||'Noticias')}</span><h3>${esc(n.title)}</h3><p>${esc(fmtDate(n.published_at||n.created_at))}</p><small>#/${esc(n.slug)}</small></div><div class="admin-actions"><a class="btn small" href="#/noticia/${encodeURIComponent(n.slug||n.id)}">Ver</a><button class="btn small" data-edit-news="${esc(n.id)}">Editar</button><button class="btn small danger" data-delete-news="${esc(n.id)}">Eliminar</button></div></div>`).join('')}</div>` : `<div class="empty">No hay noticias publicadas todavía.</div>`);
  const programList=p.data?.length ? `<div class="admin-list">${p.data.map(x=>`<div class="admin-item"><div class="admin-info"><span class="tag">Programación</span><h3>${esc(x.title||x.name)}</h3><p>${esc(x.program_date)} · ${esc(x.start_time)} — ${esc(x.end_time)}</p></div><div class="admin-actions"><button class="btn small" data-edit-program="${esc(x.id)}">Editar</button><button class="btn small danger" data-delete-program="${esc(x.id)}">Eliminar</button></div></div>`).join('')}</div>` : `<div class="empty">No hay programación para hoy.</div>`;
  app.innerHTML=`<section class="page"><div class="container admin-dashboard"><div class="section-head"><div><span class="kicker">Panel privado</span><h1 class="page-title">Administrador</h1><p class="muted">Aquí aparecen las noticias publicadas y la programación. Puedes editarlas o eliminarlas sin tocar el código. Si una operación falla, el mensaje de Supabase se mostrará aquí.</p></div><button class="btn" id="logout">Cerrar sesión</button></div><div class="admin-toolbar"><a class="btn btn-primary" href="#admin-noticia">+ Nueva noticia</a><a class="btn" href="#admin-programa">+ Nueva programación</a></div><section class="admin-section"><div class="section-head"><div><span class="kicker">Publicadas</span><h2>Noticias publicadas <span class="count">${r.error?'—':r.data.length}</span></h2></div><button class="btn" id="refreshNews">↻ Actualizar</button></div>${newsList}</section><section class="admin-section"><div class="section-head"><div><span class="kicker">Agenda</span><h2>Programación de hoy</h2></div></div>${programList}</section></div></section>`;
  document.querySelector('#logout').onclick=()=>sb.auth.signOut().then(admin);
  document.querySelector('#refreshNews').onclick=admin;
  document.querySelectorAll('[data-delete-news]').forEach(b=>b.onclick=()=>deleteNews(b.dataset.deleteNews));
  document.querySelectorAll('[data-edit-news]').forEach(b=>b.onclick=()=>editNews(b.dataset.editNews));
  document.querySelectorAll('[data-delete-program]').forEach(b=>b.onclick=()=>deleteProgram(b.dataset.deleteProgram));
  document.querySelectorAll('[data-edit-program]').forEach(b=>b.onclick=()=>editProgram(b.dataset.editProgram));
}

async function deleteNews(id){
  if(!confirm('¿Eliminar esta noticia? Esta acción no se puede deshacer.')) return;
  const r=await sb.from('news').delete().eq('id',id);
  if(r.error) alert('No se pudo eliminar: '+r.error.message); else admin();
}
async function deleteProgram(id){
  if(!confirm('¿Eliminar esta programación?')) return;
  const r=await sb.from('programs').delete().eq('id',id);
  if(r.error) alert('No se pudo eliminar: '+r.error.message); else admin();
}

async function editNews(id){
  const r=await sb.from('news').select('*').eq('id',id).maybeSingle();
  if(r.error||!r.data){alert(r.error?.message||'No se encontró la noticia.');return;}
  const n=r.data;
  app.innerHTML=`<section class="page"><div class="container"><div class="form-card"><span class="kicker">Administrador</span><h1>Editar noticia</h1><form id="newsEditForm"><label>Título</label><input id="nt" value="${esc(n.title)}" required><label>Slug (URL)</label><input id="ns" value="${esc(n.slug||'')}"><label>Categoría</label><input id="nc" value="${esc(n.category||'Noticias')}"><label>Resumen</label><textarea id="nr">${esc(n.summary||'')}</textarea><label>Contenido</label><textarea id="nco" required>${esc(n.content||'')}</textarea><label>URL de imagen</label><input id="ni" type="url" value="${esc(n.image_url||'')}"><label>URL de video (opcional)</label><input id="nv" type="url" value="${esc(n.video_url||'')}"><div class="form-actions"><button class="btn btn-primary">Guardar cambios</button><a class="btn" href="#admin">Cancelar</a></div><p id="msg" class="muted"></p></form></div></div></section>`;
  document.querySelector('#newsEditForm').onsubmit=async e=>{e.preventDefault();const slug=document.querySelector('#ns').value.trim()||slugify(document.querySelector('#nt').value);const u={title:document.querySelector('#nt').value,slug,category:document.querySelector('#nc').value,summary:document.querySelector('#nr').value,content:document.querySelector('#nco').value,image_url:document.querySelector('#ni').value,video_url:document.querySelector('#nv').value};const x=await sb.from('news').update(u).eq('id',id);document.querySelector('#msg').textContent=x.error?x.error.message:'Cambios guardados correctamente.';if(!x.error)setTimeout(admin,600);};
}

async function adminNews(){
  if(!(await currentSession())) return admin();
  app.innerHTML=`<section class="page"><div class="container"><div class="form-card"><span class="kicker">Administrador</span><h1>Publicar noticia</h1><form id="newsForm"><label>Título</label><input id="nt" required><label>Slug (URL)</label><input id="ns" placeholder="mi-noticia"><label>Categoría</label><input id="nc" value="Noticias"><label>Resumen</label><textarea id="nr"></textarea><label>Contenido</label><textarea id="nco" required></textarea><label>URL de imagen</label><input id="ni" type="url"><label>URL de video (opcional)</label><input id="nv" type="url"><div class="form-actions"><button class="btn btn-primary">Publicar</button><a class="btn" href="#admin">Volver al administrador</a></div><p id="msg" class="muted"></p></form></div></div></section>`;
  document.querySelector('#newsForm').onsubmit=async e=>{e.preventDefault();const title=document.querySelector('#nt').value.trim();const slug=document.querySelector('#ns').value.trim()||slugify(title);const r=await saveNews({title,slug,category:document.querySelector('#nc').value.trim()||'Noticias',summary:document.querySelector('#nr').value.trim(),content:document.querySelector('#nco').value.trim(),image_url:document.querySelector('#ni').value.trim()||null,video_url:document.querySelector('#nv').value.trim()||null,published_at:new Date().toISOString()});
    document.querySelector('#msg').textContent=r.error?('No se pudo publicar: '+friendlyAuthError(r.error)):'✅ Noticia publicada correctamente. Ya aparece en Noticias y en el administrador.';
    if(!r.error) setTimeout(admin,900);};
}

async function editProgram(id){
  const r=await sb.from('programs').select('*').eq('id',id).maybeSingle();
  if(r.error||!r.data){alert(r.error?.message||'No se encontró el programa.');return;}
  const p=r.data;
  app.innerHTML=`<section class="page"><div class="container"><div class="form-card"><span class="kicker">Administrador</span><h1>Editar programación</h1><form id="pf"><label>Programa</label><input id="pt" value="${esc(p.title||'')}" required><label>Fecha</label><input id="pd" type="date" value="${esc(p.program_date||'')}" required><label>Hora de inicio</label><input id="ps" type="time" value="${esc(p.start_time||'')}" required><label>Hora de finalización</label><input id="pe" type="time" value="${esc(p.end_time||'')}" required><label>Descripción</label><textarea id="px">${esc(p.description||'')}</textarea><label>Imagen (URL opcional)</label><input id="pi" type="url" value="${esc(p.image_url||'')}"><div class="form-actions"><button class="btn btn-primary">Guardar cambios</button><a class="btn" href="#admin">Cancelar</a></div><p id="pm" class="muted"></p></form></div></div></section>`;
  document.querySelector('#pf').onsubmit=async e=>{e.preventDefault();const pd=document.querySelector('#pd').value;const x=await sb.from('programs').update({title:document.querySelector('#pt').value,program_date:pd,start_time:document.querySelector('#ps').value,end_time:document.querySelector('#pe').value,description:document.querySelector('#px').value,image_url:document.querySelector('#pi').value,day_name:new Date(pd+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long'})}).eq('id',id);document.querySelector('#pm').textContent=x.error?x.error.message:'Cambios guardados correctamente.';if(!x.error)setTimeout(admin,600);};
}

async function adminProgram(){
  if(!(await currentSession())) return admin();
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota'}).format(new Date());
  app.innerHTML=`<section class="page"><div class="container"><div class="form-card"><span class="kicker">Administrador</span><h1>Agregar programación</h1><form id="pf"><label>Programa</label><input id="pt" required><label>Fecha</label><input id="pd" type="date" value="${today}" required><label>Hora de inicio</label><input id="ps" type="time" required><label>Hora de finalización</label><input id="pe" type="time" required><label>Descripción</label><textarea id="px"></textarea><label>Imagen (URL opcional)</label><input id="pi" type="url"><div class="form-actions"><button class="btn btn-primary">Guardar programación</button><a class="btn" href="#admin">Volver al administrador</a></div><p id="pm" class="muted"></p></form></div></div></section>`;
  document.querySelector('#pf').onsubmit=async e=>{e.preventDefault();const pd=document.querySelector('#pd').value;const r=await sb.from('programs').insert({title:document.querySelector('#pt').value,program_date:pd,start_time:document.querySelector('#ps').value,end_time:document.querySelector('#pe').value,description:document.querySelector('#px').value,image_url:document.querySelector('#pi').value,day_name:new Date(pd+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long'})});document.querySelector('#pm').textContent=r.error?r.error.message:'Programación guardada correctamente.';if(!r.error)setTimeout(admin,700);};
}

async function updatePlayerProgram(){
  const el=document.querySelector('#playerProgram');
  if(!el) return;
  try{
    const r=await getPrograms();
    const rows=r.data||[];
    const now=new Date();
    const mins=now.getHours()*60+now.getMinutes();
    const current=rows.find(p=>{
      const [sh,sm]=String(p.start_time||'00:00').slice(0,5).split(':').map(Number);
      const [eh,em]=String(p.end_time||'23:59').slice(0,5).split(':').map(Number);
      return mins >= sh*60+sm && mins < eh*60+em;
    });
    el.textContent=current ? `${current.start_time?.slice(0,5)||''} — ${current.end_time?.slice(0,5)||''} · ${current.title||'En vivo'}` : 'Señal en directo · 24/7';
  }catch(e){ el.textContent='Señal en directo · 24/7'; }
}
updatePlayerProgram();
setInterval(updatePlayerProgram,60000);

async function route(){
  const h=location.hash||'#inicio';
  if(h.startsWith('#/noticia/')) return article(decodeURIComponent(h.split('/noticia/')[1]));
  if(h==='#inicio'||h==='#/') return home();
  if(h==='#en-vivo') return live();
  if(h==='#programacion') return schedule();
  if(h==='#noticias') return news();
  if(h==='#contacto') return contact();
  if(h==='#admin') return admin();
  if(h==='#admin-noticia') return adminNews();
  if(h==='#admin-programa') return adminProgram();
  return home();
}
window.addEventListener('hashchange', route);
route();

// Controles visuales del reproductor inferior.
const player = document.querySelector('#player');
const expandPlayer = document.querySelector('#expandPlayer');
expandPlayer?.addEventListener('click', () => {
  player?.classList.toggle('expanded');
  const expanded = player?.classList.contains('expanded');
  expandPlayer.textContent = expanded ? '⌄' : '⌃';
  expandPlayer.setAttribute('aria-label', expanded ? 'Reducir reproductor' : 'Ampliar reproductor');
  expandPlayer.title = expanded ? 'Reducir reproductor' : 'Ampliar reproductor';
});
