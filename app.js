const audio = document.getElementById("radioAudio");
const playButtons = [document.getElementById("playButton"), document.getElementById("mainPlayButton")];
const statusEl = document.getElementById("liveStatus");
const volume = document.getElementById("volumeControl");
let hls = null;

function setButtons(playing){
  playButtons.forEach(b => { if(b) b.textContent = playing ? "❚❚" : "▶"; });
  if(statusEl) statusEl.textContent = playing ? "🔴 Señal en vivo reproduciéndose." : "Presiona reproducir para escuchar.";
}
function initStream(){
  if(audio.canPlayType("application/vnd.apple.mpegurl")){
    audio.src = STREAM_URL;
  } else if(window.Hls && Hls.isSupported()){
    hls = new Hls({enableWorker:true});
    hls.loadSource(STREAM_URL);
    hls.attachMedia(audio);
    hls.on(Hls.Events.ERROR,(_,data)=>{
      if(data.fatal && statusEl) statusEl.textContent="No fue posible cargar la señal. Intenta nuevamente.";
    });
  } else audio.src = STREAM_URL;
}
async function toggleAudio(){
  try{
    if(audio.paused){ await audio.play(); setButtons(true); }
    else { audio.pause(); setButtons(false); }
  }catch(e){
    if(statusEl) statusEl.textContent="El navegador bloqueó la reproducción. Presiona nuevamente.";
  }
}
playButtons.forEach(b=>b&&b.addEventListener("click",toggleAudio));
audio.addEventListener("play",()=>setButtons(true));
audio.addEventListener("pause",()=>setButtons(false));
if(volume){ volume.addEventListener("input",()=>audio.volume=Number(volume.value)); audio.volume=.8; }

const menuToggle=document.getElementById("menuToggle"), nav=document.getElementById("mainNav");
menuToggle?.addEventListener("click",()=>nav.classList.toggle("open"));
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

function today(){
  const now=new Date();
  const y=now.getFullYear();
  const m=String(now.getMonth()+1).padStart(2,"0");
  const d=String(now.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
const dateInput=document.getElementById("scheduleDate");
if(dateInput){dateInput.value=today();dateInput.addEventListener("change",loadSchedule)}

async function loadSchedule(){
  const list=document.getElementById("scheduleList"), current=document.getElementById("currentProgram");
  if(!list)return;
  list.innerHTML="<div class='empty-state'>Cargando programación...</div>";
  const date=dateInput?.value||today();
  const {data,error}=await supabaseClient.from("programacion").select("*").eq("fecha",date).order("hora_inicio");
  if(error){list.innerHTML="<div class='empty-state'>No se pudo cargar la programación.</div>";return}
  if(!data?.length){current.textContent="No hay programación publicada para esta fecha.";list.innerHTML="<div class='empty-state'>Agrega programas desde el panel administrativo.</div>";return}
  const now=new Date();
  let active=null;
  list.innerHTML=data.map(p=>{
    const s=`${p.fecha}T${p.hora_inicio}`, e=`${p.fecha}T${p.hora_fin}`;
    if(date===today() && now>=new Date(s) && now<=new Date(e)) active=p;
    return `<article class="schedule-item"><div class="schedule-time">${p.hora_inicio} – ${p.hora_fin}</div><div><strong>${escapeHtml(p.titulo||"Programa")}</strong><div class="schedule-desc">${escapeHtml(p.descripcion||"")}</div></div></article>`;
  }).join("");
  current.textContent=active?`AHORA: ${active.titulo}`:"Programación del día";
  const bottom=document.getElementById("bottomProgram"), main=document.getElementById("mainPlayerText");
  if(active){if(bottom)bottom.textContent=active.titulo;if(main)main.textContent=active.titulo;}
}
async function loadNews(){
  const grid=document.getElementById("newsGrid"); if(!grid)return;
  const {data,error}=await supabaseClient.from("noticias").select("*").order("created_at",{ascending:false}).limit(9);
  if(error||!data?.length){grid.innerHTML="<div class='empty-state'>Aún no hay noticias publicadas.</div>";return}
  grid.innerHTML=data.map(n=>`<article class="news-card">${n.imagen_url?`<img src="${escapeAttr(n.imagen_url)}" alt="">`:""}<div class="news-card-body"><span class="news-tag">${escapeHtml(n.categoria||"Actualidad")}</span><h3>${escapeHtml(n.titulo||"Sin título")}</h3><p>${escapeHtml((n.resumen||n.contenido||"").slice(0,180))}</p></div></article>`).join("");
}
async function loadAds(){
  const grid=document.getElementById("adsGrid"); if(!grid)return;
  const {data,error}=await supabaseClient.from("publicidad").select("*").order("created_at",{ascending:false}).limit(8);
  if(error||!data?.length){grid.innerHTML="<div class='empty-state'>Aún no hay espacios publicitarios publicados.</div>";return}
  grid.innerHTML=data.map(a=>`<article class="ad-card">${a.imagen_url?`<img src="${escapeAttr(a.imagen_url)}" alt="">`:""}<div class="ad-body"><strong>${escapeHtml(a.titulo||"Publicidad")}</strong><p>${escapeHtml(a.descripcion||"")}</p></div></article>`).join("");
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escapeAttr(v){return escapeHtml(v)}
initStream(); loadSchedule(); loadNews(); loadAds();
