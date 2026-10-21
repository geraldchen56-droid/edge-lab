/* Edge Lab service worker: works offline after the first visit. */
const VERSION="8ac637f2e7";
const CORE=[
"index.html",
"styles.css",
"i18n.js",
"auth.js",
"app.js",
"scene.js",
"shell.js",
"gauntlet.js",
"board.js",
"manifest.webmanifest",
"icons/icon-192.png",
"icons/icon-512.png",
"play/daily.html",
"zh/index.html",
"ja/index.html",
"es/index.html",
"i18n/zh.js",
"i18n/ja.js",
"i18n/es.js",
"https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
"https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js",
"https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@300;500;700;800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"
];
const CACHE="edgelab-"+VERSION;
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{mode:/^https?:/.test(u)&&!u.startsWith(self.location.origin)?"cors":"same-origin"})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("edgelab-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const CDN=/^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(u.pathname.startsWith("/_vercel/")||/supabase\.co$/.test(u.hostname))return;      // analytics + live data: always network
  if(u.origin!==self.location.origin&&!CDN.test(r.url))return;
  /* pages: network first so updates show immediately; fall back to cache offline */
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(k=>k.put(r,c));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("index.html"))));return}
  /* assets: stale-while-revalidate */
  e.respondWith(caches.match(r).then(m=>{const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque")){const c=res.clone();caches.open(CACHE).then(k=>k.put(r,c))}return res}).catch(()=>m);return m||net}));
});
