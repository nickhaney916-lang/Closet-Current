'use strict';
const CACHE='closet-current-__VERSION__';
const FILES=__ASSETS__;
const urls=FILES.map(path=>new URL(path,self.registration.scope).href);
const executableIntegrity=new Map(__EXECUTABLE_INTEGRITY__.map(([path,hash])=>[new URL(path,self.registration.scope).href,hash]));
function expectedIntegrity(href){
 const url=new URL(href);url.search='';url.hash='';
 return executableIntegrity.get(url.href);
}
async function trustedExecutable(response,expected){
 if(!response||!response.ok||response.redirected||response.type!=='basic')return false;
 const digest=await crypto.subtle.digest('SHA-384',await response.clone().arrayBuffer());
 return 'sha384-'+btoa(String.fromCharCode(...new Uint8Array(digest)))===expected;
}
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls.map(href=>{
  const integrity=expectedIntegrity(href);
  return integrity?new Request(href,{integrity,redirect:'error'}):href;
 }))));
});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('closet-current-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 const home=new URL('./',self.registration.scope).href,index=new URL('index.html',self.registration.scope).href;
 const isHome=url.href===home||url.href===index;
 const integrity=expectedIntegrity(url.href);
 if(!isHome&&!urls.includes(url.href)&&!integrity)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(integrity){
   try{
    const response=await fetch(event.request);
    if(await trustedExecutable(response,integrity)){
     if(urls.includes(url.href))await cache.put(event.request,response.clone());
     return response;
    }
   }catch{}
   try{
    const saved=await cache.match(event.request);
    if(await trustedExecutable(saved,integrity))return saved;
   }catch{}
   return new Response('Executable integrity verification failed. Reconnect to load Closet Current.',{status:503});
  }
  try{const response=await fetch(event.request);if(response.ok&&!response.redirected&&response.type==='basic')await cache.put(isHome?index:event.request,response.clone());return response;}
  catch{const saved=await cache.match(isHome?index:event.request);return saved||new Response('Reconnect to load Closet Current.',{status:503});}
 })());
});
