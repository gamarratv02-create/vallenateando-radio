const sb=supabaseClient;
const loginBox=document.getElementById("loginBox"),panel=document.getElementById("panel"),loginMsg=document.getElementById("loginMsg");
const $=id=>document.getElementById(id);

async function check(){
  const {data}=await sb.auth.getSession();
  if(data.session){loginBox.classList.add("hidden");panel.classList.remove("hidden");loadAll();}
  else{loginBox.classList.remove("hidden");panel.classList.add("hidden");}
}

$("loginForm")?.addEventListener("submit",async e=>{
  e.preventDefault(); loginMsg.textContent="Ingresando...";
  const {error}=await sb.auth.signInWithPassword({email:$('email').value,password:$('password').value});
  loginMsg.textContent=error?error.message:""; if(!error)check();
});
$("logout")?.addEventListener("click",async()=>{await sb.auth.signOut();check()});

function localToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
$("pFecha").value=localToday();

$("programForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const {error}=await sb.from("programacion").insert({fecha:$('pFecha').value,titulo:$('pTitulo').value,hora_inicio:$('pInicio').value,hora_fin:$('pFin').value,descripcion:$('pDesc').value});
  alert(error?error.message:"Programa guardado."); if(!error){e.target.reset();$('pFecha').value=localToday();loadPrograms()}
});

async function uploadNewsImage(file){
  if(!file)return null;
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");
  const path=`news/${Date.now()}-${safe}`;
  const {error}=await sb.storage.from("media").upload(path,file,{upsert:false,contentType:file.type});
  if(error)throw error;
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

$("nImagenFile")?.addEventListener("change",e=>{
  const file=e.target.files[0],preview=$("newsPreview");
  if(!file){preview.style.display="none";return}
  preview.src=URL.createObjectURL(file);preview.style.display="block";
});

$("newsForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const msg=$("newsMsg"), button=$("newsSubmit");
  msg.textContent="Publicando noticia...";button.disabled=true;
  try{
    const id=$("nId").value;
    let imageUrl=$("nImagen").value||null;
    const file=$("nImagenFile").files[0];
    if(file) imageUrl=await uploadNewsImage(file);
    const payload={titulo:$('nTitulo').value.trim(),categoria:$('nCategoria').value.trim(),resumen:$('nResumen').value.trim(),contenido:$('nContenido').value.trim(),imagen_url:imageUrl,video_url:$('nVideo').value.trim()||null};
    const result=id?await sb.from("noticias").update(payload).eq("id",id):await sb.from("noticias").insert(payload);
    if(result.error)throw result.error;
    msg.textContent=id?"Noticia actualizada correctamente.":"¡Noticia publicada correctamente!";
    resetNewsForm();loadNewsAdmin();
  }catch(error){msg.textContent="Error: "+error.message}
  finally{button.disabled=false}
});

$("newsCancel")?.addEventListener("click",resetNewsForm);
function resetNewsForm(){
  $("newsForm").reset();$("nId").value="";$("nImagen").value="";$("newsPreview").style.display="none";$("newsSubmit").textContent="📰 Publicar noticia";$("newsCancel").classList.add("hidden");
}
function editNews(n){
  $("nId").value=n.id;$("nTitulo").value=n.titulo||"";$("nCategoria").value=n.categoria||"";$("nResumen").value=n.resumen||"";$("nContenido").value=n.contenido||"";$("nVideo").value=n.video_url||"";$("nImagen").value=n.imagen_url||"";
  if(n.imagen_url){$("newsPreview").src=n.imagen_url;$("newsPreview").style.display="block"}
  $("newsSubmit").textContent="💾 Guardar cambios";$("newsCancel").classList.remove("hidden");window.scrollTo({top:document.getElementById("newsForm").offsetTop-100,behavior:"smooth"});
}
window.editNews=editNews;

async function loadPrograms(){const {data}=await sb.from("programacion").select("*").order("fecha",{ascending:false}).order("hora_inicio");$("programList").innerHTML=(data||[]).map(x=>`<div class="admin-row"><span><b>${x.fecha}</b> · ${x.hora_inicio}-${x.hora_fin} · ${escapeHtml(x.titulo)}</span><button class="admin-btn danger" onclick="del('programacion','${x.id}',loadPrograms)">Eliminar</button></div>`).join("")}
async function loadNewsAdmin(){
  const {data,error}=await sb.from("noticias").select("*").order("created_at",{ascending:false});
  if(error){$("newsList").innerHTML=`<div class="empty-state">${escapeHtml(error.message)}</div>`;return}
  $("newsList").innerHTML=(data||[]).map(x=>`<div class="admin-row admin-news-row"><img src="${escapeAttr(x.imagen_url||'')}" alt=""><div><b>${escapeHtml(x.titulo)}</b><br><small>${escapeHtml(x.categoria||"Actualidad")}</small></div><div class="admin-actions"><button class="admin-btn secondary" onclick='editNews(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Editar</button><button class="admin-btn danger" onclick="del('noticias','${x.id}',loadNewsAdmin)">Eliminar</button></div></div>`).join("")||'<div class="empty-state">Aún no hay noticias.</div>';
}
async function loadAdsAdmin(){const {data}=await sb.from("publicidad").select("*").order("created_at",{ascending:false});$("adList").innerHTML=(data||[]).map(x=>`<div class="admin-row"><span><b>${escapeHtml(x.titulo)}</b></span><button class="admin-btn danger" onclick="del('publicidad','${x.id}',loadAdsAdmin)">Eliminar</button></div>`).join("")}
async function del(table,id,cb){if(confirm("¿Eliminar este elemento?")){const {error}=await sb.from(table).delete().eq("id",id);if(error)alert(error.message);else cb()}}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escapeAttr(v){return escapeHtml(v)}
function loadAll(){loadPrograms();loadNewsAdmin();loadAdsAdmin()}
check();
