const audio=document.getElementById("radioAudio");
const playButtons=[document.getElementById("playButton"),document.getElementById("mainPlayButton")].filter(Boolean);
const volume=document.getElementById("volumeControl");
const statusEls=[document.getElementById("liveStatus")].filter(Boolean);
let hls=null;

function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escapeAttr(v){return escapeHtml(v)}
function slugify(v){return String(v||"noticia").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)}
function newsUrl(n){return `index.html#/noticia/${encodeURIComponent(n.slug||slugify(n.titulo))}`}
function setStatus(t){statusEls.forEach(e=>e.textContent=t)}
function setPlaying(p){
  playButtons.forEach(b=>{b.textContent=p?"❚❚":"▶ Escuchar en vivo";if(b.id==="playButton")b.textContent=p?"❚❚":"▶"});
  setStatus(p?"● Señal en vivo reproduciéndose.":"● Señal disponible · Presiona reproducir para escuchar");
}
function initStream(){
 if(!audio)return;
 if(audio.canPlayType("application/vnd.apple.mpegurl")) audio.src=STREAM_URL;
 else if(window.Hls&&Hls.isSupported()){
   hls=new Hls({enableWorker:true,lowLatencyMode:true});
   hls.loadSource(STREAM_URL);hls.attachMedia(audio);
   hls.on(Hls.Events.ERROR,(_,data)=>{
     if(data.fatal)setStatus("No fue posible cargar la señal. Presiona reproducir nuevamente.");
   });
 }else audio.src=STREAM_URL;
}
async function toggleAudio(){
 if(!audio)return;
 try{
   if(audio.paused){await audio.play();setPlaying(true)}
   else{audio.pause();setPlaying(false)}
 }catch(e){setStatus("El navegador bloqueó la reproducción. Presiona el botón nuevamente.")}
}
playButtons.forEach(b=>b.addEventListener("click",toggleAudio));
audio?.addEventListener("play",()=>setPlaying(true));
audio?.addEventListener("pause",()=>setPlaying(false));
audio?.addEventListener("error",()=>setStatus("La señal no está disponible en este momento."));
if(volume){volume.addEventListener("input",()=>audio.volume=Number(volume.value));audio.volume=.8}
document.getElementById("menuToggle")?.addEventListener("click",()=>document.getElementById("mainNav")?.classList.toggle("open"));

function localToday(){
 const d=new Date();
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
async function loadCurrentProgram(){
 const bottom=document.getElementById("bottomProgram"),hero=document.getElementById("heroProgram"),desc=document.getElementById("heroProgramDesc");
 if(!bottom&&!hero)return;
 const date=localToday(), now=new Date();
 const {data}=await supabaseClient.from("programacion").select("*").eq("fecha",date).order("hora_inicio",{ascending:true});
 let current=null;
 (data||[]).forEach(p=>{
   const start=new Date(`${p.fecha}T${p.hora_inicio}`);
   const end=new Date(`${p.fecha}T${p.hora_fin}`);
   if(now>=start&&now<=end)current=p;
 });
 const title=current?.titulo||"Vallenateando Radio";
 if(bottom)bottom.textContent=title;
 if(hero)hero.textContent=title;
 if(desc)desc.textContent=current?.descripcion||"Señal de audio en vivo";
}
function renderCard(n,small=false){
 const img=n.imagen_url?`<img src="${escapeAttr(n.imagen_url)}" alt="">`:"";
 return `<article class="news-card ${small?"small":""}"><a href="${newsUrl(n)}">${img}<div class="news-card-body"><span class="news-tag">${escapeHtml(n.categoria||"Actualidad")}</span><h3>${escapeHtml(n.titulo||"Sin título")}</h3><p>${escapeHtml((n.resumen||n.contenido||"").slice(0,155))}</p><div class="card-meta"><span>${n.created_at?new Date(n.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}):""}</span><b>LEER NOTICIA</b><i>→</i></div></div></a></article>`;
}
async function getNews(limit=30){
 const {data,error}=await supabaseClient.from("noticias").select("*").order("created_at",{ascending:false}).limit(limit);
 return error?[]:(data||[]);
}
async function loadHome(){
 const featured=document.getElementById("featuredNews"),latest=document.getElementById("latestNews");
 if(!featured&&!latest)return;
 const news=await getNews(12);
 if(!news.length){
   if(featured)featured.innerHTML="<div class='empty-state'>Aún no hay noticias publicadas.</div>";
   if(latest)latest.innerHTML="";
   return;
 }
 const [a,b,c]=news;
 if(featured){
   featured.innerHTML=`<div class="featured-main"><a href="${newsUrl(a)}">${a.imagen_url?`<img src="${escapeAttr(a.imagen_url)}" alt="">`:""}<div class="featured-overlay"><span class="news-tag">${escapeHtml(a.categoria||"Actualidad")}</span><h2>${escapeHtml(a.titulo)}</h2><p>${escapeHtml(a.resumen||"")}</p></div></a></div><div class="featured-side">${[b,c].filter(Boolean).map(n=>`<article><a href="${newsUrl(n)}">${n.imagen_url?`<img src="${escapeAttr(n.imagen_url)}" alt="">`:""}<div><span class="news-tag">${escapeHtml(n.categoria||"Actualidad")}</span><h3>${escapeHtml(n.titulo)}</h3><small>${n.created_at?new Date(n.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}):""}</small></div></a></article>`).join("")}</div>`;
 }
 if(latest)latest.innerHTML=news.slice(0,8).map(n=>renderCard(n,true)).join("");
 const ticker=document.getElementById("tickerText");if(ticker)ticker.textContent=a.titulo;
}
let allNews=[];
function renderAllNews(){
 const grid=document.getElementById("allNewsGrid");if(!grid)return;
 const q=(document.getElementById("newsSearch")?.value||"").toLowerCase().trim();
 const cat=document.getElementById("newsCategory")?.value||"";
 const filtered=allNews.filter(n=>(!cat||n.categoria===cat)&&(!q||`${n.titulo} ${n.resumen} ${n.contenido} ${n.categoria}`.toLowerCase().includes(q)));
 grid.innerHTML=filtered.length?filtered.map(n=>renderCard(n)).join(""):"<div class='empty-state'>No encontramos noticias con esos filtros.</div>";
}
async function loadNewsPage(){
 if(!document.getElementById("allNewsGrid"))return;
 allNews=await getNews(100);renderAllNews();
 document.getElementById("newsSearch")?.addEventListener("input",renderAllNews);
 document.getElementById("newsCategory")?.addEventListener("change",renderAllNews);
 document.querySelectorAll(".category-pills button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".category-pills button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById("newsCategory").value=b.dataset.cat;renderAllNews()}));
}
async function renderArticleFromHash(){
 const article=document.getElementById("article"),route=document.getElementById("articleRoute"),home=document.getElementById("homeContent");
 if(!article||!route)return;
 const match=decodeURIComponent(location.hash).match(/^#\/noticia\/(.+)$/);
 if(!match){route.classList.add("route-hidden");if(home)home.style.display="block";return}
 route.classList.remove("route-hidden");if(home)home.style.display="none";
 const slug=match[1];
 const news=await getNews(100);
 const n=news.find(x=>(x.slug||slugify(x.titulo))===slug);
 if(!n){article.innerHTML="<div class='empty-state'>No se encontró esta noticia.</div>";return}
 document.title=`${n.titulo} | Vallenateando Radio`;
 article.innerHTML=`<div class="article-kicker">${escapeHtml(n.categoria||"Actualidad")}</div><h1>${escapeHtml(n.titulo)}</h1><div class="article-date">${n.created_at?new Date(n.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"long",year:"numeric"}):""}</div>${n.imagen_url?`<img class="article-image" src="${escapeAttr(n.imagen_url)}" alt="">`:""}${n.resumen?`<p class="article-lead">${escapeHtml(n.resumen)}</p>`:""}<div class="article-body">${escapeHtml(n.contenido||"").replace(/\n/g,"<br>")}</div>${n.video_url?`<div class="article-video"><a href="${escapeAttr(n.video_url)}" target="_blank" rel="noopener">▶ Ver video</a></div>`:""}<a class="back-news" href="noticias.html">← Volver a noticias</a>`;
}
initStream();loadCurrentProgram();loadHome();loadNewsPage();renderArticleFromHash();window.addEventListener("hashchange",renderArticleFromHash);
