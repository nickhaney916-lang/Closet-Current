/** USB Android physical-device research: run this on desktop, then
 * adb reverse tcp:8787 tcp:8787, open http://localhost:8787/... on PHONE.
 * Read-only loopback. Can be privately proxied via Tailscale Serve HTTPS
 * for real iPhone Safari on the SAME authorized private tailnet. NEVER Funnel.
 * Does not deploy, expose family/customer photos, or change production.
 * Restore original licensed fixture files first using the verified scripts.
 */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('.'),port=8787;
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const host='127.0.0.1';
const server=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'&&req.method!=='HEAD')throw Error('Only local read-only research preview');
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost:8787').pathname);
  if(!/^\/(research\/|benchmark\/|node_modules\/(?:three|three-mesh-bvh)\/)/.test(pathname)||
     pathname.includes('\\')||pathname.includes('\0')||pathname.split('/').includes('..'))
   throw Error('Only preapproved original source assets and research preview paths');
  const p=resolve(root,'.'+pathname);
  if(!p.startsWith(root+'/'))throw Error('Unsafe path');
  const data=await readFile(p);
  if(data.length>25e6)throw Error('Oversized source research file blocked');
  res.writeHead(200,{
   'content-type':types[extname(p)]||'application/octet-stream',
   'cache-control':'no-store',
   'x-content-type-options':'nosniff',
   'cross-origin-resource-policy':'same-origin',
   'referrer-policy':'no-referrer',
   'content-security-policy':"default-src 'self' blob: data:; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'none'",
   'x-robots-tag':'noindex,nofollow'
  });
  if(req.method==='HEAD')res.end();else res.end(data);
 }catch{
  res.writeHead(404,{'content-type':'text/plain','cache-control':'no-store'});
  res.end('Not available: research-only original source path');
 }
});
server.listen(port,host,()=>{
 console.log('Closet Current 3D66 ORIGINAL SOURCE PRIVATE phone QA:');
 console.log('1. Connect unlocked Android phone by USB with developer debugging.');
 console.log('2. adb reverse tcp:8787 tcp:8787');
 console.log('3. Android Chrome: http://localhost:8787/research/three-d-66/real-phone-qa.html?phone66=after');
 console.log('4. Physical iPhone Safari: private HTTPS Tailscale Serve on this loopback port ONLY, never Funnel: /research/three-d-66/real-phone-qa.html?phone66=after');
 console.log('Read-only preapproved original source paths, private loopback and tailnet only. No production deployment, no customer photos. Ctrl+C to stop.');
});