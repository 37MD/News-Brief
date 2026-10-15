/* Pulse 20E service worker (real file). Same-origin: network first (so a new upload shows up), cache fallback when offline. External APIs pass through. */
const CACHE='pulse-20e-v1';
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./']).catch(()=>{}))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request, u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin) return;
  if(u.search.indexOf('share-target')>=0){
    const shared=u.searchParams.get('url')||u.searchParams.get('text')||'';
    e.respondWith(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{ if(cs.length){ cs[0].focus(); cs[0].postMessage({type:'SHARE_TARGET',url:shared}); } return Response.redirect(u.pathname,302); }));
    return;
  }
  e.respondWith(fetch(r).then(res=>{ if(res&&res.status===200){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); } return res; }).catch(()=>caches.match(r).then(m=>m||caches.match('./'))));
});
self.addEventListener('sync',e=>{ if(e.tag==='pulse-feed-refresh') e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>cs.forEach(c=>c.postMessage({type:'BG_SYNC_REFRESH'})))); });