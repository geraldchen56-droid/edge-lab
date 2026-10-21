/* Edge Lab shell: lobby tabs + 3D previews, page transitions, one-time briefing, full screen */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover=matchMedia("(hover: hover)").matches;
const body=document.body;

/* ---------- keep content clear of the (wrapping) top bar ---------- */
const tb=document.querySelector(".topbar");
const setTb=()=>{if(tb)document.documentElement.style.setProperty("--tb",tb.offsetHeight+"px")};
setTb();addEventListener("resize",setTb);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(setTb);

/* ---------- page transitions ---------- */
function leave(href){
  if(reduce){location.href=href;return}
  body.classList.add("leaving");try{window.EL3D&&window.EL3D.dive()}catch(e){}
  setTimeout(()=>{location.href=href},460)}
document.addEventListener("click",e=>{
  const a=e.target.closest("a[data-nav], .floor a");if(!a)return;
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0||a.target==="_blank")return;
  e.preventDefault();leave(a.href)});
addEventListener("pageshow",e=>{if(e.persisted)body.classList.remove("leaving")});

/* ---------- lobby ---------- */
const tabs=[...document.querySelectorAll(".tab")];
if(tabs.length){
  const show=k=>{tabs.forEach(t=>{const on=t.dataset.tab===k;t.setAttribute("aria-selected",on);t.tabIndex=on?0:-1;$("floor-"+t.dataset.tab).hidden=!on});store.set("edgelab-room",k)};
  tabs.forEach((t,i)=>{t.addEventListener("click",()=>show(t.dataset.tab));
    t.addEventListener("keydown",e=>{const d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(!d)return;const n=tabs[(i+d+tabs.length)%tabs.length];n.focus();show(n.dataset.tab)})});
  const saved=store.get("edgelab-room");show(tabs.some(t=>t.dataset.tab===saved)?saved:tabs[0].dataset.tab);
  /* hovering a table previews it on the 3D felt */
  let tmr=0;const go=n=>{clearTimeout(tmr);tmr=setTimeout(()=>{try{window.EL3D&&window.EL3D.go(n)}catch(e){}},n==="fan"?650:150)};
  document.querySelectorAll(".floor a").forEach(a=>{
    if(canHover)a.addEventListener("mouseenter",()=>go(a.dataset.preview));
    a.addEventListener("focus",()=>go(a.dataset.preview))});
  document.querySelectorAll(".floor").forEach(f=>{f.addEventListener("mouseleave",()=>go("fan"));f.addEventListener("focusout",e=>{if(!f.contains(e.relatedTarget))go("fan")})});
}

/* ---------- briefing: shown once per game, reopen any time ---------- */
const tut=$("tut"),game=body.dataset.game;
if(tut&&game){
  const key="edgelab-brief-"+game;
  const open=()=>{if(tut.open)return;if(tut.showModal)tut.showModal();else tut.setAttribute("open","")};
  const close=()=>{if(tut.close)tut.close();else tut.removeAttribute("open")};
  tut.addEventListener("close",()=>store.set(key,"1"));
  $("tutBtn").addEventListener("click",open);
  $("tutGo").addEventListener("click",close);
  tut.addEventListener("click",e=>{if(e.target===tut)close()});
  addEventListener("keydown",e=>{if(e.key==="?"&&!/input|textarea|select/i.test(e.target.tagName)){e.preventDefault();open()}});
  if(!store.get(key))setTimeout(open,reduce?0:550);
}

/* ---------- full screen ---------- */
const fs=$("fsBtn"),root=document.documentElement;
const fsOn=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
if(fs&&(document.fullscreenEnabled||document.webkitFullscreenEnabled)){
  fs.hidden=false;
  const label=()=>{fs.textContent=fsOn()?"Exit full screen":"Full screen";fs.setAttribute("aria-pressed",fsOn());body.classList.toggle("is-fs",fsOn())};
  fs.addEventListener("click",()=>{try{if(fsOn())(document.exitFullscreen||document.webkitExitFullscreen).call(document);
    else(root.requestFullscreen||root.webkitRequestFullscreen).call(root)}catch(e){}});
  document.addEventListener("fullscreenchange",label);document.addEventListener("webkitfullscreenchange",label);label();
}
})();
