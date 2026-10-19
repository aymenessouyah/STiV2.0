/* STI v315 — diagnostic d'installation locale complète Labo 3 */
const REPORT_KEY = "sti-labo-offline-diagnostic-v315";
const ESSENTIAL = [
  "index.html", "portail.html", "sw.js", "manifest.webmanifest",
  "assets/js/config.js", "assets/js/acces.js", "assets/js/portail.js",
  "assets/js/supabase-umd.js", "assets/js/modules/labo-device-client.js",
  "assets/js/modules/labo-offline-diagnostics.js",
  "assets/css/atelier.css", "assets/css/atelier-pages.css", "assets/css/protection.css"
];
function localOrigin() {
  const h=String(location.hostname||"").toLowerCase();
  return location.protocol==="file:"||h==="127.0.0.1"||h==="localhost"||h==="[::1]"||h==="::1";
}
function bytes(n){
  n=Number(n)||0;const u=["o","Ko","Mo","Go"];let i=0;
  while(n>=1024&&i<u.length-1){n/=1024;i++;}
  return `${n.toFixed(i?1:0)} ${u[i]}`;
}
function sessionOk(){
  try{const c=JSON.parse(localStorage.getItem("sti-session-cache")||"null");return Boolean(c&&c.email==="elevelabo3@exemple.tn"&&c.statut==="actif"&&c.portableNoLogin===true);}catch(_){return false;}
}
async function fetchWithTimeout(url, options={}, delay=5000){
  const controller=typeof AbortController==="function"?new AbortController():null;
  const timer=controller?setTimeout(()=>controller.abort(),delay):null;
  try{return await fetch(url,Object.assign({},options,controller?{signal:controller.signal}:{}));}
  finally{if(timer)clearTimeout(timer);}
}
function absolute(root,path){return new URL(String(path).split("/").map(encodeURIComponent).join("/"),root).toString();}
async function checkOne(root,entry){
  const path=typeof entry==="string"?entry:entry.path;const expected=typeof entry==="string"?0:Number(entry.bytes)||0;
  try{
    const response=await fetchWithTimeout(absolute(root,path)+`?sti_diag=${Date.now()}`,{method:"HEAD",cache:"no-store"},7000);
    if(!response.ok)return {path,ok:false,reason:`HTTP ${response.status}`};
    const actual=Number(response.headers.get("content-length"))||0;
    if(expected&&actual&&actual!==expected)return {path,ok:false,reason:`taille ${bytes(actual)} au lieu de ${bytes(expected)}`};
    return {path,ok:true,bytes:actual||expected};
  }catch(error){return {path,ok:false,reason:(error&&error.name)==="AbortError"?"délai dépassé":"introuvable"};}
}
function saveReport(report){try{localStorage.setItem(REPORT_KEY,JSON.stringify(report));}catch(_){}}
function make(tag,text,css){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(css)e.style.cssText=css;return e;}
export function startLaboOfflineDiagnostics(options={}){
  if(document.getElementById("sti-labo-offline-diagnostic-button"))return;
  const root=options.root||"./";const version=Number(options.version)||315;
  const button=make("button","🩺 Diagnostic hors ligne","position:fixed;right:12px;bottom:12px;z-index:10020;padding:9px 13px;border:2px solid #17324d;border-radius:999px;background:#e8f2ff;color:#17324d;font-weight:900;box-shadow:0 3px 14px #0003;cursor:pointer");
  button.id="sti-labo-offline-diagnostic-button";button.type="button";
  const overlay=make("div",null,"display:none;position:fixed;inset:0;z-index:31000;background:#0f172add;padding:18px;overflow:auto");
  overlay.id="sti-labo-offline-diagnostic";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
  const card=make("section",null,"max-width:760px;margin:3vh auto;background:#fffdf7;color:#20242b;border:3px solid #17324d;border-radius:18px;padding:18px;box-shadow:8px 8px 0 #0005");
  const head=make("div",null,"display:flex;justify-content:space-between;gap:10px;align-items:flex-start");
  const titles=make("div");titles.append(make("h2","🩺 Diagnostic du poste Labo 3","margin:0;color:#0f4c81"),make("p",`Installation locale · version ${version}`,"margin:4px 0;font-weight:800;color:#475569"));
  const close=make("button","Fermer","padding:7px 10px;border:1.5px solid #334155;border-radius:8px;background:#64748b;color:white;font-weight:900;cursor:pointer");close.type="button";
  head.append(titles,close);
  const summary=make("p","Diagnostic en attente…","padding:10px;border-radius:10px;background:#eef2f7;font-weight:900");
  const list=make("div",null,"display:grid;gap:7px;margin:10px 0");
  const progress=make("div",null,"height:10px;background:#dbe4ee;border-radius:99px;overflow:hidden;display:none");
  const bar=make("div",null,"height:100%;width:0;background:#177245;transition:width .2s");progress.appendChild(bar);
  const detail=make("p","","font-size:.8rem;white-space:pre-wrap;color:#475569;font-weight:750");
  const actions=make("div",null,"display:flex;gap:8px;flex-wrap:wrap;margin-top:10px");
  const quick=make("button","⚡ Diagnostic rapide","padding:9px 12px;border:2px solid #17324d;border-radius:9px;background:#0f4c81;color:white;font-weight:900;cursor:pointer");
  const full=make("button","📦 Vérifier l’installation complète","padding:9px 12px;border:2px solid #17324d;border-radius:9px;background:#177245;color:white;font-weight:900;cursor:pointer");
  quick.type=full.type="button";actions.append(quick,full);
  card.append(head,summary,list,progress,detail,actions);overlay.appendChild(card);document.body.append(button,overlay);
  const row=(ok,label,value)=>{const e=make("div",`${ok?"✅":"❌"} ${label} : ${value}`,`padding:8px 10px;border:1.5px solid ${ok?"#177245":"#b8321b"};border-radius:9px;background:${ok?"#f0fff6":"#fff0ed"};font-weight:850`);list.appendChild(e);};
  async function runQuick(){
    list.textContent="";detail.textContent="";progress.style.display="none";
    const isLocal=localOrigin();row(isLocal,"Origine locale",isLocal?location.origin||"fichier local":"ouvrez le lanceur local");
    row(sessionOk(),"Session Labo3",sessionOk()?"active sans identification":"absente");
    row(location.protocol!=="file:","Serveur local",location.protocol!=="file:"?"actif":"lancez Lancer-Labo3-Hors-Ligne.bat");
    let manifest=false;try{manifest=(await fetchWithTimeout(absolute(root,"offline-complete-manifest.json"),{cache:"no-store"},4000)).ok;}catch(_){}
    row(manifest,"Manifeste complet",manifest?"disponible":"introuvable");
    let essentials=[];for(const path of ESSENTIAL)essentials.push(await checkOne(root,path));
    const missing=essentials.filter(x=>!x.ok);row(!missing.length,"Fichiers essentiels",missing.length?`${missing.length} manquant(s)`: `${essentials.length} présents`);
    const ok=isLocal&&sessionOk()&&location.protocol!=="file:"&&manifest&&!missing.length;
    summary.textContent=ok?"✅ Poste prêt pour un fonctionnement local hors Internet":"⚠️ Installation locale incomplète";
    summary.style.background=ok?"#dcfce7":"#fff3cd";button.textContent=ok?"✅ Prêt hors ligne":"⚠️ Hors ligne incomplet";
    if(missing.length)detail.textContent="Manquants :\n"+missing.map(x=>`• ${x.path} — ${x.reason}`).join("\n");
    saveReport({version,quick:true,ready:ok,checkedAt:new Date().toISOString(),missing});return ok;
  }
  async function runFull(){
    quick.disabled=full.disabled=true;list.textContent="";detail.textContent="Chargement du manifeste…";progress.style.display="block";bar.style.width="0";
    try{
      const response=await fetchWithTimeout(absolute(root,"offline-complete-manifest.json")+`?v=${Date.now()}`,{cache:"no-store"},7000);
      if(!response.ok)throw new Error("manifeste introuvable");
      const manifest=await response.json();const entries=Array.isArray(manifest.files)?manifest.files:[];const missing=[];let done=0;const workers=Array.from({length:Math.min(10,entries.length||1)},async()=>{
        while(true){const index=done++;if(index>=entries.length)return;const result=await checkOne(root,entries[index]);if(!result.ok)missing.push(result);bar.style.width=`${Math.round(Math.min(done,entries.length)/Math.max(1,entries.length)*100)}%`;detail.textContent=`Vérification locale : ${Math.min(done,entries.length)} / ${entries.length}`;}
      });
      await Promise.all(workers);const ok=!missing.length&&localOrigin()&&sessionOk()&&location.protocol!=="file:";
      list.textContent="";row(ok,"Installation complète",ok?`${entries.length} fichiers présents · ${bytes(manifest.totalBytes)}`:`${missing.length} fichier(s) absent(s) ou différent(s)`);
      summary.textContent=ok?"✅ Installation complète prête hors Internet":"❌ Installation complète à corriger";summary.style.background=ok?"#dcfce7":"#fee2e2";button.textContent=ok?"✅ Prêt hors ligne":"❌ Fichiers manquants";
      detail.textContent=missing.length?"Premiers problèmes :\n"+missing.slice(0,30).map(x=>`• ${x.path} — ${x.reason}`).join("\n"):"Test réel local réussi. Vous pouvez conserver Internet coupé et relancer la plateforme avec le fichier BAT.";
      saveReport({version,complete:true,ready:ok,checkedAt:new Date().toISOString(),total:entries.length,totalBytes:manifest.totalBytes,missing});
    }catch(error){summary.textContent="❌ Vérification impossible";summary.style.background="#fee2e2";detail.textContent=(error&&error.message)||"erreur";button.textContent="❌ Diagnostic incomplet";}
    finally{quick.disabled=full.disabled=false;}
  }
  button.onclick=()=>{overlay.style.display="block";runQuick();};close.onclick=()=>{overlay.style.display="none";};overlay.onclick=e=>{if(e.target===overlay)overlay.style.display="none";};quick.onclick=runQuick;full.onclick=runFull;
  runQuick();
}
