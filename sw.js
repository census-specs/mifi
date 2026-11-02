/* Mifi — service worker : cache hors ligne (cache-first, mise en cache limitée à l'app) */
const CACHE="mifi-v2";
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    const ks=await caches.keys();
    await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  const sameOrigin=new URL(e.request.url).origin===self.location.origin;
  e.respondWith(
    caches.match(e.request).then(hit=>{
      if(hit) return hit;
      return fetch(e.request).then(res=>{
        /* ne mettre en cache que les fichiers de l'app (pas les API/pochettes distantes) */
        if(sameOrigin&&res&&res.ok&&res.type==="basic"){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>{
        if(sameOrigin) return caches.match("./");
        return Response.error();
      });
    })
  );
});
