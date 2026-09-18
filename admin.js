const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY";
const ready=!SUPABASE_URL.includes("TU-PROYECTO")&&!SUPABASE_ANON_KEY.includes("TU_SUPABASE");
const db=ready?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
const $=s=>document.querySelector(s);
const msg=(t,err=false)=>{const x=$("#authMsg");x.textContent=t;x.classList.remove("hidden");x.style.background=err?"#ffe9e9":"#f0ebf7"};
function requireDb(){if(!db){msg("Primero configura SUPABASE_URL y SUPABASE_ANON_KEY en admin.js.",true);return false}return true}

$("#loginForm").onsubmit=async e=>{e.preventDefault();if(!requireDb())return;const {error}=await db.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});if(error)msg(error.message,true);else init()};
$("#logoutBtn").onclick=()=>db.auth.signOut();
db?.auth.onAuthStateChange((event,session)=>{if(session)init();else showAuth()});

function showAuth(){$("#authView").classList.remove("hidden");$("#adminView").classList.add("hidden")}
async function init(){if(!db)return;const {data:{session}}=await db.auth.getSession();if(!session)return showAuth();$("#authView").classList.add("hidden");$("#adminView").classList.remove("hidden");$("#pFecha").value=today();$("#filterDate").value=today();await refreshAll()}
function today(){return new Date().toLocaleDateString("en-CA",{timeZone:"America/Bogota"})}
async function uploadImage(file){if(!file)return null;const ext=file.name.split(".").pop().toLowerCase();const path=`${crypto.randomUUID()}.${ext}`;const {error}=await db.storage.from("media").upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;return db.storage.from("media").getPublicUrl(path).data.publicUrl}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function editData(id,type){return window.__data[type].find(x=>x.id===id)}

$("#programForm").onsubmit=async e=>{e.preventDefault();try{let image=$("#pImagenUrl").value.trim()||null;if($("#pImagen").files[0])image=await uploadImage($("#pImagen").files[0]);const row={fecha:$("#pFecha").value,hora_inicio:$("#pInicio").value,hora_fin:$("#pFin").value,nombre_programa:$("#pNombre").value,descripcion:$("#pDesc").value,imagen_url:image};const id=$("#programId").value;const q=id?db.from("programacion").update(row).eq("id",id):db.from("programacion").insert(row);const {error}=await q;if(error)throw error;resetProgram();await loadPrograms()}catch(e){alert(e.message)}};
$("#cancelProgram").onclick=resetProgram;
function resetProgram(){$("#programForm").reset();$("#programId").value="";$("#pFecha").value=today()}
$("#filterDate").onchange=loadPrograms;
async function loadPrograms(){const date=$("#filterDate").value;const {data,error}=await db.from("programacion").select("*").eq("fecha",date).order("hora_inicio");if(error)return alert(error.message);window.__data={...(window.__data||{}),programs:data||[]};$("#programTable").innerHTML=(data||[]).map(p=>`<tr><td>${p.hora_inicio.slice(0,5)} – ${p.hora_fin.slice(0,5)}</td><td><strong>${esc(p.nombre_programa)}</strong></td><td>${esc(p.descripcion||"")}</td><td class="actions"><button class="btn secondary" onclick="editProgram('${p.id}')">Editar</button><button class="btn danger" onclick="deleteProgram('${p.id}')">Eliminar</button></td></tr>`).join("")||'<tr><td colspan="4">No hay programas.</td></tr>'}
window.editProgram=id=>{const p=editData(id,"programs");$("#programId").value=p.id;$("#pFecha").value=p.fecha;$("#pInicio").value=p.hora_inicio;$("#pFin").value=p.hora_fin;$("#pNombre").value=p.nombre_programa;$("#pDesc").value=p.descripcion||"";$("#pImagenUrl").value=p.imagen_url||"";scrollTo(0,0)}
window.deleteProgram=async id=>{if(!confirm("¿Eliminar este programa?"))return;const {error}=await db.from("programacion").delete().eq("id",id);if(error)alert(error.message);else loadPrograms()}

$("#newsForm").onsubmit=async e=>{e.preventDefault();try{let image=$("#nImagenUrl").value.trim()||null;if($("#nImagen").files[0])image=await uploadImage($("#nImagen").files[0]);const row={titulo:$("#nTitulo").value,resumen:$("#nResumen").value,contenido:$("#nContenido").value,categoria:$("#nCategoria").value,imagen_url:image,video_url:$("#nVideo").value||null,publicado:$("#nPublicado").value==="true",fecha_publicacion:new Date().toISOString()};const id=$("#newsId").value;const q=id?db.from("noticias").update(row).eq("id",id):db.from("noticias").insert(row);const {error}=await q;if(error)throw error;resetNews();loadNews()}catch(e){alert(e.message)}};
$("#cancelNews").onclick=resetNews;function resetNews(){$("#newsForm").reset();$("#newsId").value=""}
async function loadNews(){const {data,error}=await db.from("noticias").select("*").order("fecha_publicacion",{ascending:false});if(error)return alert(error.message);window.__data={...(window.__data||{}),news:data||[]};$("#newsTable").innerHTML=(data||[]).map(n=>`<tr><td>${new Date(n.fecha_publicacion).toLocaleDateString("es-CO")}</td><td><strong>${esc(n.titulo)}</strong></td><td>${esc(n.categoria||"")}</td><td>${n.publicado?"Publicado":"Borrador"}</td><td class="actions"><button class="btn secondary" onclick="editNews('${n.id}')">Editar</button><button class="btn danger" onclick="deleteNews('${n.id}')">Eliminar</button></td></tr>`).join("")||'<tr><td colspan="5">No hay noticias.</td></tr>'}
window.editNews=id=>{const n=editData(id,"news");$("#newsId").value=n.id;$("#nTitulo").value=n.titulo;$("#nResumen").value=n.resumen||"";$("#nContenido").value=n.contenido;$("#nCategoria").value=n.categoria||"";$("#nImagenUrl").value=n.imagen_url||"";$("#nVideo").value=n.video_url||"";$("#nPublicado").value=String(n.publicado);scrollTo(0,400)}
window.deleteNews=async id=>{if(!confirm("¿Eliminar esta noticia?"))return;const {error}=await db.from("noticias").delete().eq("id",id);if(error)alert(error.message);else loadNews()}

$("#adForm").onsubmit=async e=>{e.preventDefault();try{let image=$("#aImagenUrl").value.trim()||null;if($("#aImagen").files[0])image=await uploadImage($("#aImagen").files[0]);if(!image)throw new Error("Debes subir una imagen o colocar una URL.");const row={titulo:$("#aTitulo").value,imagen_url:image,enlace_url:$("#aEnlace").value||null,orden:Number($("#aOrden").value)||0,activo:$("#aActivo").value==="true"};const id=$("#adId").value;const q=id?db.from("publicidad").update(row).eq("id",id):db.from("publicidad").insert(row);const {error}=await q;if(error)throw error;resetAd();loadAds()}catch(e){alert(e.message)}};
$("#cancelAd").onclick=resetAd;function resetAd(){$("#adForm").reset();$("#adId").value="";$("#aOrden").value=0}
async function loadAds(){const {data,error}=await db.from("publicidad").select("*").order("orden");if(error)return alert(error.message);window.__data={...(window.__data||{}),ads:data||[]};$("#adTable").innerHTML=(data||[]).map(a=>`<tr><td><img src="${esc(a.imagen_url)}" style="width:100px;height:55px;object-fit:cover;border-radius:7px"></td><td>${esc(a.titulo||"")}</td><td>${a.orden}</td><td>${a.activo?"Activo":"Inactivo"}</td><td class="actions"><button class="btn secondary" onclick="editAd('${a.id}')">Editar</button><button class="btn danger" onclick="deleteAd('${a.id}')">Eliminar</button></td></tr>`).join("")||'<tr><td colspan="5">No hay publicidad.</td></tr>'}
window.editAd=id=>{const a=editData(id,"ads");$("#adId").value=a.id;$("#aTitulo").value=a.titulo||"";$("#aImagenUrl").value=a.imagen_url||"";$("#aEnlace").value=a.enlace_url||"";$("#aOrden").value=a.orden||0;$("#aActivo").value=String(a.activo);scrollTo(0,900)}
window.deleteAd=async id=>{if(!confirm("¿Eliminar esta publicidad?"))return;const {error}=await db.from("publicidad").delete().eq("id",id);if(error)alert(error.message);else loadAds()}
async function refreshAll(){await loadPrograms();await loadNews();await loadAds()}
showAuth();
