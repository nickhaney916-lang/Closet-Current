'use strict';
const VERSION='__VERSION__';
const CACHE='closet-current-'+VERSION;
const FILES=__ASSETS__;
const urls=FILES.map(path=>new URL(path,self.registration.scope).href);
// An old controlled tab may still request old ?v= URLs after a deployment.
// Hosts can ignore query strings, so network-first would substitute NEW JS
// under an OLD versioned URL. Static scripts and versioned data are immutable.
const pinned=new Set(urls.filter(href=>{
 const url=new URL(href);
 return url.searchParams.get('v')===VERSION||/\.(?:js|mjs|css)$/.test(url.pathname);
}));
function sameVersionShell(html){
 const references=[...html.matchAll(/\b(?:src|href)="([^"]+\.(?:js|mjs|css)(?:\?[^"]*)?)"/g)];
 if(!references.some(match=>/(?:^|\/)app\.js\?/.test(match[1])))return false;
 return references.every(match=>{
  const url=new URL(match[1],self.registration.scope);
  return url.origin===self.location.origin&&url.searchParams.get('v')===VERSION;
 });
}
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('closet-current-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 const home=new URL('./',self.registration.scope).href,index=new URL('index.html',self.registration.scope).href;
 const isHome=url.href===home||url.href===index;
 if(!isHome&&!urls.includes(url.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(pinned.has(url.href)){
   // Never replace a pinned script, static worker import, stylesheet or model
   // index with possibly different bytes from a post-deploy server.
   return await cache.match(event.request)||new Response('Matching offline asset unavailable. Reconnect and reload after the app updates.',{status:503});
  }
  try{
   const response=await fetch(event.request);
   if(response.ok&&!response.redirected&&response.type==='basic'){
    // An old active SW can see a new shell before the new SW activates.
    // Serve it online, but preserve the old shell for coherent offline reloads.
    if(!isHome||sameVersionShell(await response.clone().text())){
     await cache.put(isHome?index:event.request,response.clone());
    }
   }
   return response;
  }
  catch{
   const saved=await cache.match(isHome?index:event.request);
   return saved||new Response('Reconnect to load Closet Current.',{status:503});
  }
 })());
});
