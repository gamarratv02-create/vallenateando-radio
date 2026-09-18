
const audio=document.getElementById("radioAudio");
const playButton=document.getElementById("playButton");
const volume=document.getElementById("volumeControl");
let hls=null;

function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escapeAttr(v){return escapeHtml(v)}
function slugify(v){return String(v||"noticia").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)}
function newsUrl(n){return `index.html#/noticia/${encodeURIComponent(n.slug||slugify(n.titulo))}`}

function setPlaying(p){if(playButton)playButton.textContent=p?"❚❚":"▶"}
function initStream(){
 if(!audio)return;
 if(audio.canPlayType("application/vnd.apple.mpegurl")) audio.src=STREAM_URL;
 else if(window.Hls&&Hls.isSupported()){hls=new Hls();hls.loadSource(STREAM_URL);hls.attachMedia(audio)}
 else audio.src=STREAM_URL;
}
async function toggleAudio(){if(!audio)return;try{if(audio.paused)await audio.play();else audio.pause()}catch(e){}}
playButton?.addEventListener("click",toggleAudio);
audio?.addEventListener("play",()=>setPlaying(true));audio?.addEventListener("pause",()=>setPlaying(false));
if(volume){volume.addEventListener("input",()=>audio.volume=Number(volume.value));audio.volume=.8}
document.getElementById("menuToggle")?.addEventListener("click",()=>document.getElementById("mainNav")?.classList.toggle("open"));

function renderCard(n,small=false){
 const img=n.imagen_url?`<img src="${escapeAttr(n.imagen_url)}" alt="">`:"";
 return `<article class="news-card ${small?"small":""}">
  <a href="${newsUrl(n)}">${img}<div class="news-card-body">
   <span class="news-tag">${escapeHtml(n.categoria||"Actualidad")}</span>
   <h3>${escapeHtml(n.titulo||"Sin título")}</h3>
   <p>${escapeHtml((n.resumen||n.contenido||"").slice(0,155))}</p>
   <div class="card-meta"><span>${n.created_at?new Date(n.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}):""}</span><b>LEER NOTICIA</b><i>→</i></div>
  </div></a></article>`
}
async function getNews(limit=30){
 const {data,error}=await supabaseClient.from("noticias").select("*").order("created_at",{ascending:false}).limit(limit);
 return error?[]:(data||[]);
}
async function loadHome(){
 const featured=document.getElementById("featuredNews");if(!featured)return;
 const news=await getNews(12);
 if(!news.length){featured.innerHTML="<div class='empty-state'>Aún no hay noticias publicadas.</div>";return}
 const [a,b,c]=news;
 featured.innerHTML=`<div class="featured-main"><a href="${newsUrl(a)}">${a.imagen_url?`<img src="${escapeAttr(a.imagen_url)}" alt="">`:""}<div class="featured-overlay"><span class="news-tag">${escapeHtml(a.categoria||"Actualidad")}</span><h2>${escapeHtml(a.titulo)}</h2><p>${escapeHtml(a.resumen||"")}</p></div></a></div>
 <div class="featured-side">${[b,c].filter(Boolean).map(n=>`<article><a href="${newsUrl(n)}">${n.imagen_url?`<img src="${escapeAttr(n.imagen_url)}" alt="">`:""}<div><span class="news-tag">${escapeHtml(n.categoria||"Actualidad")}</span><h3>${escapeHtml(n.titulo)}</h3><small>${n.created_at?new Date(n.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}):""}</small></div></a></article>`).join("")}</div>`;
 document.getElementById("latestNews").innerHTML=news.slice(0,5).map(n=>renderCard(n,true)).join("");
 document.getElementById("categoryNews").innerHTML=news.slice(3,9).map(n=>renderCard(n)).join("");
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
 const article=document.getElementById("article"), route=document.getElementById("articleRoute"), home=document.getElementById("homeContent");
 if(!article||!route)return;
 const match=decodeURIComponent(location.hash).match(/^#\/noticia\/(.+)$/);
 if(!match){route.classList.add("route-hidden");if(home)home.style.display="block";return}
 route.classList.remove("route-hidden");if(home)home.style.display="none";
 const slug=match[1];
 const news=await getNews(100);
 const n=news.find(x=>(x.slug||slugify(x.titulo))===slug);
 if(!n){article.innerHTML="<div class='empty-state'>No se encontró esta noticia.</div>";return}
 document.title=`${n.titulo} | Vallenateando Radio`;
 article.innerHTML=`<div class="article-kicker">${escapeHtml(n.categoria||"Actualidad")}</div>
 <h1>${escapeHtml(n.titulo)}</h1><div class="article-date">${n.created_at?new Date(n.created_at).toLocaleDateString("es-CO",{day:"2-digit",month:"long",year:"numeric"}):""}</div>
 ${n.imagen_url?`<img class="article-image" src="${escapeAttr(n.imagen_url)}" alt="">`:""}
 ${n.resumen?`<p class="article-lead">${escapeHtml(n.resumen)}</p>`:""}
 <div class="article-body">${escapeHtml(n.contenido||"").replace(/\n/g,"<br>")}</div>
 ${n.video_url?`<div class="article-video"><a href="${escapeAttr(n.video_url)}" target="_blank" rel="noopener">▶ Ver video</a></div>`:""}
 <a class="back-news" href="noticias.html">← Volver a noticias</a>`;
}
initStream();loadHome();loadNewsPage();renderArticleFromHash();window.addEventListener("hashchange",renderArticleFromHash);
