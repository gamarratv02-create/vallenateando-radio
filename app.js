const STREAM_URL = "https://djp.sytes.net/hls/vallenateandoradio/live.m3u8";
const supabaseReady = !SUPABASE_URL.includes("TU-PROYECTO") && !SUPABASE_PUBLISHABLE_KEY.includes("TU_SUPABASE");
const db = supabaseReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

const $ = s => document.querySelector(s);
const audio = $("#radioAudio");
let hls = null;

function setupAudio(){
  audio.volume = 1;
  if(audio.canPlayType("application/vnd.apple.mpegurl")) audio.src = STREAM_URL;
  else if(window.Hls && Hls.isSupported()){ hls = new Hls({enableWorker:true}); hls.loadSource(STREAM_URL); hls.attachMedia(audio); }
  else audio.src = STREAM_URL;
}
async function playRadio(){
  try{ await audio.play(); $("#playBtn").textContent="❚❚"; $("#heroPlay").textContent="❚❚ Pausar"; }
  catch(e){ alert("El navegador bloqueó la reproducción automática. Pulsa nuevamente Escuchar en vivo."); }
}
function pauseRadio(){audio.pause();$("#playBtn").textContent="▶";$("#heroPlay").textContent="▶ Escuchar en vivo";}
$("#playBtn").onclick=()=>audio.paused?playRadio():pauseRadio();
$("#heroPlay").onclick=()=>audio.paused?playRadio():pauseRadio();
$("#volume").oninput=e=>audio.volume=Number(e.target.value);
$("#muteBtn").onclick=()=>{audio.muted=!audio.muted;$("#muteBtn").textContent=audio.muted?"🔇":"⋮"};
$("#menuBtn").onclick=()=>$("#mainNav").classList.toggle("open");
$("#year").textContent=new Date().getFullYear();

function localDate(){const d=new Date();return d.toLocaleDateString("en-CA",{timeZone:"America/Bogota"});}
function formatTime(t){return t?.slice(0,5)||"";}
function formatDate(d){return new Date(d+"T12:00:00").toLocaleDateString("es-CO",{day:"2-digit",month:"long",year:"numeric"});}

async function loadSchedule(date){
  const box=$("#scheduleList"); box.innerHTML='<div class="empty">Cargando programación...</div>';
  if(!db){box.innerHTML='<div class="empty">Configura Supabase en app.js para activar la programación.</div>';return;}
  const {data,error}=await db.from("programacion").select("*").eq("fecha",date).order("hora_inicio",{ascending:true});
  if(error){box.innerHTML='<div class="empty">No se pudo cargar la programación.</div>';console.error(error);return;}
  if(!data?.length){box.innerHTML='<div class="empty">No hay programación registrada para esta fecha.</div>';$("#nowProgram").textContent="Vallenateando Radio";return;}
  box.innerHTML=data.map(p=>`<article class="schedule-item"><div class="schedule-time">${formatTime(p.hora_inicio)} – ${formatTime(p.hora_fin)}</div><div><div class="schedule-title">${escapeHtml(p.nombre_programa)}</div><div class="schedule-desc">${escapeHtml(p.descripcion||"")}</div></div>${p.imagen_url?`<img src="${safeUrl(p.imagen_url)}" alt="">`:""}</article>`).join("");
  updateCurrentProgram(data);
}
function updateCurrentProgram(items){
  const now=new Date();
  const mins=now.getHours()*60+now.getMinutes();
  const current=items.find(p=>toMin(p.hora_inicio)<=mins && mins<toMin(p.hora_fin));
  $("#nowProgram").textContent=current?.nombre_programa||"Vallenateando Radio";
}
function toMin(t){const [h,m]=t.split(":").map(Number);return h*60+m;}

async function loadNews(){
  const box=$("#newsGrid");
  if(!db){box.innerHTML='<div class="empty">Configura Supabase para mostrar noticias.</div>';return;}
  const {data,error}=await db.from("noticias").select("*").eq("publicado",true).order("fecha_publicacion",{ascending:false}).limit(6);
  if(error){box.innerHTML='<div class="empty">No se pudieron cargar las noticias.</div>';return;}
  if(!data?.length){box.innerHTML='<div class="empty">Aún no hay noticias publicadas.</div>';return;}
  box.innerHTML=data.map(n=>`<article class="news-card">${n.imagen_url?`<img src="${safeUrl(n.imagen_url)}" alt="">`:""}<div class="news-body"><div class="news-date">${n.fecha_publicacion?formatDate(n.fecha_publicacion.slice(0,10)):""}</div><h3>${escapeHtml(n.titulo)}</h3><p>${escapeHtml(n.resumen||"")}</p>${n.video_url?`<a href="${safeUrl(n.video_url)}" target="_blank" rel="noopener">▶ Ver video</a>`:""}</div></article>`).join("");
}
async function loadAds(){
  const box=$("#adsGrid");
  if(!db){box.innerHTML='<div class="empty">Configura Supabase para mostrar publicidad.</div>';return;}
  const {data,error}=await db.from("publicidad").select("*").eq("activo",true).order("orden",{ascending:true});
  if(error||!data?.length){box.innerHTML='<div class="empty">Espacio disponible para anunciantes.</div>';return;}
  box.innerHTML=data.map(a=>`<div class="ad-card">${a.enlace_url?`<a href="${safeUrl(a.enlace_url)}" target="_blank" rel="noopener">`:""}<img src="${safeUrl(a.imagen_url)}" alt="${escapeHtml(a.titulo||"Publicidad")}">${a.enlace_url?"</a>":""}</div>`).join("");
}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function safeUrl(v=""){try{const u=new URL(v,location.href);return ["http:","https:"].includes(u.protocol)?u.href:"#"}catch{return "#"}}

const sd=$("#scheduleDate"); sd.value=localDate(); sd.addEventListener("change",e=>loadSchedule(e.target.value));
setupAudio(); loadSchedule(sd.value); loadNews(); loadAds();
setInterval(()=>{if(sd.value===localDate()&&db)loadSchedule(sd.value)},60000);
