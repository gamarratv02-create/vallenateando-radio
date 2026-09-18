import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const C=window.APP_CONFIG; const sb=createClient(C.supabaseUrl,C.supabaseKey); const app=document.querySelector('#app'); const audio=document.querySelector('#audio'); const playBtn=document.querySelector('#playBtn'); const menuToggle=document.querySelector('#menuToggle'); const nav=document.querySelector('#mainNav'); document.querySelector('#year').textContent=new Date().getFullYear();
let hls=null;
let audioInitialized=false;
function setupAudio(){ if(audioInitialized) return; audioInitialized=true; if(Hls&&Hls.isSupported()){hls=new Hls({enableWorker:true});hls.loadSource(C.streamUrl);hls.attachMedia(audio);}else{audio.src=C.streamUrl;} }
setupAudio();
async function toggle(){try{if(audio.paused){await audio.play();playBtn.textContent='❚❚';document.body.classList.add('playing')}else{audio.pause();playBtn.textContent='▶';document.body.classList.remove('playing')}}catch(e){alert('No fue posible iniciar la señal. Pulsa nuevamente el botón de reproducción.');}}
playBtn.onclick=toggle; document.querySelector('.big-play')?.addEventListener('click',toggle); document.querySelector('#volume').oninput=e=>audio.volume=Number(e.target.value); audio.volume=.85;
menuToggle.onclick=()=>nav.classList.toggle('open'); nav.querySelectorAll('a').forEach(a=>a.onclick=()=>nav.classList.remove('open'));
function esc(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function getNews(){let {data}=await sb.from('news').select('*').order('published_at',{ascending:false}).limit(9);return data||[]}
async function getPrograms(){let d=new Date();let day=d.toLocaleDateString('es-CO',{weekday:'long'});let {data}=await sb.from('programs').select('*').eq('program_date',d.toISOString().slice(0,10)).order('start_time');if(!data?.length){let r=await sb.from('programs').select('*').eq('day_name',day).order('start_time');data=r.data||[]}return data||[]}
function newsCards(items){return items.length?`<div class="cards">${items.map(n=>`<a class="card" href="#/noticia/${encodeURIComponent(n.slug||n.id)}"><img src="${esc(n.image_url||C.logoUrl)}" alt=""><div class="card-body"><span class="tag">${esc(n.category||'Noticias')}</span><h3>${esc(n.title)}</h3><p>${esc(n.summary||n.content||'')}</p></div></a>`).join('')}</div>`:`<div class="empty">Próximamente publicaremos noticias.</div>`}
function programs(items){return items.length?`<div class="program-grid">${items.map(p=>`<div class="program"><div class="date">${esc(p.program_date||'Programación')}</div><h3>${esc(p.title||p.name)}</h3><p>${esc((p.start_time||'')+' — '+(p.end_time||''))}</p><p>${esc(p.description||'')}</p></div>`).join('')}</div>`:`<div class="empty">No hay programación cargada para hoy.</div>`}
async function home(){let [news,progs]=await Promise.all([getNews(),getPrograms()]);app.innerHTML=`<section class="hero"><div class="container hero-grid"><div><span class="kicker">Emisora online · 24/7</span><h1>Vallenateando Radio</h1><p>Conéctate a nuestra señal en vivo y disfruta lo mejor del vallenato, acompañado de información, cultura y contenidos para nuestra audiencia.</p><div class="hero-actions"><button class="btn btn-primary" onclick="document.querySelector('#playBtn').click()">▶ Escuchar en vivo</button><a class="btn" href="#programacion">Ver programación</a></div></div><div class="hero-art"><img src="${C.logoUrl}" alt="Vallenateando Radio"></div></div></section><section class="section"><div class="container"><div class="live-card"><div><span class="live-badge">SEÑAL EN VIVO</span><h2>Ahora estás escuchando Vallenateando Radio</h2><p>Activa el reproductor inferior para escuchar la emisora mientras navegas por la página.</p></div><button class="big-play" onclick="document.querySelector('#playBtn').click()">▶</button></div></div></section><section class="section"><div class="container"><div class="section-head"><div><p>Lo más reciente</p><h2>Noticias</h2></div><a class="btn" href="#noticias">Ver todas</a></div>${newsCards(news)}</div></section><section class="section"><div class="container"><div class="section-head"><div><p>Hoy</p><h2>Programación</h2></div><a class="btn" href="#programacion">Ver agenda</a></div>${programs(progs)}</div></section>`}
async function live(){app.innerHTML=`<section class="page"><div class="container"><span class="kicker">Señal en vivo</span><h1 class="page-title">Vallenateando Radio en vivo</h1><p class="muted">Escucha nuestra señal online mientras navegas por el sitio.</p><div class="live-card" style="margin-top:24px"><div><span class="live-badge">EN DIRECTO</span><h2>Vallenateando Radio</h2><p>Lo mejor del vallenato, siempre contigo.</p></div><button class="big-play" onclick="document.querySelector('#playBtn').click()">▶</button></div></div></section>`}
async function schedule(){let p=await getPrograms();app.innerHTML=`<section class="page"><div class="container"><span class="kicker">Agenda</span><h1 class="page-title">Programación de hoy</h1><p class="muted">La agenda se muestra según la fecha actual y puede ser administrada desde “Iniciar sesión”.</p><div style="margin-top:24px">${programs(p)}</div></div></section>`}
async function news(){let n=await getNews();app.innerHTML=`<section class="page"><div class="container"><span class="kicker">Actualidad</span><h1 class="page-title">Noticias</h1><p class="muted">Información y contenidos de Vallenateando Radio.</p><div style="margin-top:24px">${newsCards(n)}</div></div></section>`}
async function article(slug){
  let q=await sb.from('news').select('*').eq('slug',slug).maybeSingle();
  let n=q.data;
  if(!n){let r=await sb.from('news').select('*').eq('id',slug).maybeSingle();n=r.data}
  if(!n){
    app.innerHTML=`<section class="page"><div class="container"><div class="empty">No encontramos esta noticia.</div></div></section>`;
    return;
  }
  const title=esc(n.title||'Noticias');
  const category=esc(n.category||'Noticias');
  const image=esc(n.image_url||C.logoUrl);
  const date=n.published_at?new Date(n.published_at).toLocaleDateString('es-CO',{dateStyle:'long'}):'';
  const summary=esc(n.summary||'');
  const raw=String(n.content||n.summary||'');
  const paragraphs=raw.split(/\\n\\s*\\n|\\r?\\n/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
  const url=location.href;
  app.innerHTML=`
    <section class="article-page">
      <div class="container article-shell">
        <div class="article-back"><a href="#noticias">← Volver a noticias</a> <span class="tag">${category}</span></div>
        <article class="article article-modern">
          <div class="article-body">
            <span class="article-kicker">Vallenateando Radio · Noticias</span>
            <h1>${title}</h1>
            ${summary?`<p class="article-lead">${summary}</p>`:''}
            ${date?`<div class="article-meta">Publicado el ${date}</div>`:''}
          </div>
          <figure class="article-cover"><img src="${image}" alt="${title}" loading="eager"></figure>
          <div class="article-body article-copy">
            <div class="share-row">
              <button class="share-btn" id="shareNews">↗ Compartir noticia</button>
              <button class="share-btn light" id="copyNews">⧉ Copiar enlace</button>
            </div>
            <div class="content">${paragraphs||'<p>Consulta la información completa de esta noticia.</p>'}</div>
            ${n.video_url?`<div class="article-video"><video controls playsinline preload="metadata" src="${esc(n.video_url)}"></video></div>`:''}
            <div class="article-end"><a class="btn btn-primary" href="#noticias">← Ver más noticias</a></div>
          </div>
        </article>
      </div>
    </section>`;

  document.querySelector('#shareNews')?.addEventListener('click',async()=>{
    try{
      if(navigator.share) await navigator.share({title:n.title||'Vallenateando Radio',text:n.summary||n.title||'',url});
      else {await navigator.clipboard.writeText(url); alert('Enlace copiado.');}
    }catch(e){}
  });
  document.querySelector('#copyNews')?.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(url); const b=document.querySelector('#copyNews'); const old=b.textContent; b.textContent='✓ Enlace copiado'; setTimeout(()=>b.textContent=old,1800)}catch(e){alert('No fue posible copiar el enlace.');}
  });
}
async function contact(){app.innerHTML=`<section class="page"><div class="container"><span class="kicker">Estamos para escucharte</span><h1 class="page-title">Contacto</h1><div class="contact-box" style="margin-top:24px"><div><h2>Vallenateando Radio</h2><p>Comunícate con nosotros para información, publicidad, alianzas y contenidos.</p></div><div><div class="contact-item">📱 <strong>WhatsApp / Teléfono</strong><br><a href="https://wa.me/573013799517" target="_blank">${C.contactPhone}</a></div><div class="contact-item" style="margin-top:12px">✉️ <strong>Correo electrónico</strong><br><a href="mailto:${C.contactEmail}">${C.contactEmail}</a></div></div></div></div></section>`}
async function admin(){let {data:{session}}=await sb.auth.getSession(); if(!session){app.innerHTML=`<section class="page"><div class="container"><div class="form-card"><span class="kicker">Administración</span><h1>Iniciar sesión</h1><p class="muted">Ingresa con el usuario administrador creado en Supabase.</p><form id="login"><label>Correo</label><input id="email" type="email" required><label>Contraseña</label><input id="pass" type="password" required><div class="form-actions"><button class="btn btn-primary">Entrar</button></div><p id="loginMsg" class="muted"></p></form></div></div></section>`;document.querySelector('#login').onsubmit=async e=>{e.preventDefault();let r=await sb.auth.signInWithPassword({email:email.value,password:pass.value});if(r.error)loginMsg.textContent=r.error.message;else admin()};return}app.innerHTML=`<section class="page"><div class="container"><div class="section-head"><div><span class="kicker">Panel privado</span><h1 class="page-title">Administrador</h1><p class="muted">Publica noticias y administra la programación sin editar el código.</p></div><button class="btn" id="logout">Cerrar sesión</button></div><div class="cards"><a class="card" href="#admin-noticia"><div class="card-body"><span class="tag">Contenido</span><h3>Nueva noticia</h3><p>Publica título, categoría, resumen, imagen y video.</p></div></a><a class="card" href="#admin-programa"><div class="card-body"><span class="tag">Agenda</span><h3>Nueva programación</h3><p>Asigna fecha y horario a cada programa.</p></div></a></div></div></section>`;document.querySelector('#logout').onclick=()=>sb.auth.signOut().then(admin)}
async function adminNews(){if(!(await sb.auth.getSession()).data.session)return admin();app.innerHTML=`<section class="page"><div class="container"><div class="form-card"><span class="kicker">Administrador</span><h1>Publicar noticia</h1><form id="newsForm"><label>Título</label><input id="nt" required><label>Slug (URL)</label><input id="ns" placeholder="mi-noticia"><label>Categoría</label><input id="nc" value="Noticias"><label>Resumen</label><textarea id="nr"></textarea><label>Contenido</label><textarea id="nco" required></textarea><label>URL de imagen</label><input id="ni" type="url"><label>URL de video (opcional)</label><input id="nv" type="url"><div class="form-actions"><button class="btn btn-primary">Publicar</button><a class="btn" href="#admin">Volver</a></div><p id="msg" class="muted"></p></form></div></div></section>`;document.querySelector('#newsForm').onsubmit=async e=>{e.preventDefault();let slug=ns.value.trim()||nt.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');let r=await sb.from('news').insert({title:nt.value,slug,category:nc.value,summary:nr.value,content:nco.value,image_url:ni.value,video_url:nv.value,published_at:new Date().toISOString()});msg.textContent=r.error?r.error.message:'Noticia publicada correctamente.';if(!r.error)e.target.reset()}}
async function adminProgram(){if(!(await sb.auth.getSession()).data.session)return admin();app.innerHTML=`<section class="page"><div class="container"><div class="form-card"><span class="kicker">Administrador</span><h1>Agregar programación</h1><form id="pf"><label>Programa</label><input id="pt" required><label>Fecha</label><input id="pd" type="date" required><label>Hora de inicio</label><input id="ps" type="time" required><label>Hora de finalización</label><input id="pe" type="time" required><label>Descripción</label><textarea id="px"></textarea><label>Imagen (URL opcional)</label><input id="pi" type="url"><div class="form-actions"><button class="btn btn-primary">Guardar programación</button><a class="btn" href="#admin">Volver</a></div><p id="pm" class="muted"></p></form></div></div></section>`;document.querySelector('#pf').onsubmit=async e=>{e.preventDefault();let r=await sb.from('programs').insert({title:pt.value,program_date:pd.value,start_time:ps.value,end_time:pe.value,description:px.value,image_url:pi.value,day_name:new Date(pd.value+'T12:00:00').toLocaleDateString('es-CO',{weekday:'long'})});pm.textContent=r.error?r.error.message:'Programación guardada correctamente.';if(!r.error)e.target.reset()}}
async function route(){let h=location.hash||'#inicio';if(h.startsWith('#/noticia/'))return article(decodeURIComponent(h.split('/noticia/')[1]));if(h==='#inicio'||h==='#/')return home();if(h==='#en-vivo')return live();if(h==='#programacion')return schedule();if(h==='#noticias')return news();if(h==='#contacto')return contact();if(h==='#admin')return admin();if(h==='#admin-noticia')return adminNews();if(h==='#admin-programa')return adminProgram();return home()}window.addEventListener('hashchange',route);route();
