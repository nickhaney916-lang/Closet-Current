import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from 'playwright';
const [engine,baseline,candidate]=process.argv.slice(2);
assert.ok(['chromium','webkit'].includes(engine));
const roots={baseline:resolve(baseline),candidate:resolve(candidate)};
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm'};
let substitute=false;
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost'),[,build,...parts]=u.pathname.split('/');
  const root=roots[build],path=root&&resolve(root,parts.join('/')||'index.html');
  if(!path||!path.startsWith(root+sep))return res.writeHead(404).end();
  let bytes=await readFile(path);
  if(substitute&&parts.join('/')==='scanner-errors.mjs')bytes=Buffer.concat([bytes,Buffer.from('\nglobalThis.integritySubstitutionMarker=true;\n')]);
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
 }catch{return res.writeHead(404).end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await {chromium,webkit}[engine].launch();
 for(const width of [320,390,430]){
  for(const build of ['baseline','candidate']){
   substitute=false;
   const context=await browser.newContext({viewport:{width,height:800}});
   try{
    const page=await context.newPage();
    await page.goto(origin+'/'+build+'/');
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:30000});
    const clean=await page.evaluate(async()=>{const r=await fetch('scanner-errors.mjs');return {ok:r.ok,body:await r.text()}});
    assert.equal(clean.ok,true);
    substitute=true;
    const changed=await page.evaluate(async()=>{const r=await fetch('scanner-errors.mjs');return {status:r.status,body:await r.text()}});
    if(build==='baseline'){
     assert.match(changed.body,/integritySubstitutionMarker/);
     console.log('LOCAL_EXECUTABLE_RED',engine,width);
    }else{
     assert.equal(changed.status,200);assert.equal(changed.body,clean.body);
     await page.evaluate(async()=>{
      const url=new URL('scanner-errors.mjs',location.href).href;
      const names=await caches.keys();
      for(const name of names){if(name.startsWith('closet-current-'))await (await caches.open(name)).put(url,new Response('modified cached executable',{headers:{'Content-Type':'text/javascript'}}))}
     });
     const blocked=await page.evaluate(async()=>{const r=await fetch('scanner-errors.mjs');return {status:r.status,body:await r.text()}});
     assert.equal(blocked.status,503);
     substitute=false;
     const recovered=await page.evaluate(async()=>{const r=await fetch('scanner-errors.mjs');return {status:r.status,body:await r.text()}});
     assert.equal(recovered.status,200);assert.equal(recovered.body,clean.body);
     console.log('LOCAL_EXECUTABLE_GREEN',engine,width);
    }
   }finally{await context.close()}
  }
 }
}finally{await browser?.close();server.close()}
