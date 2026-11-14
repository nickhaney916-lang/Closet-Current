// Execute the actual native Style original-photo viewer async import while
// delaying ESM delivery. Synthetic owners, real Chromium and WebKit only.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-styled-original-photo-async-mount-browser');
await mkdir(out,{recursive:true});
const src=await readFile('public/closet-stylist.js','utf8');
const p165=await readFile('public/style-photo-preview-gate-165.mjs','utf8');
const a=src.indexOf('function currentPhotoOwnerSession167(){');
const b=src.indexOf('// Generated outfit cards',a);
assert.ok(a>=0&&b>a,'Missing exact native Style photo mount function');
const actual=src.slice(a,b);
assert.ok(actual.includes("await import('./style-photo-preview-gate-165.mjs')"));
const environment=[
 "'use strict';",
 "let originalPhotoPreview167=null,originalPhotoMountSerial167=0;",
 "let styledCollectionRequestSerial=5,captureOperationEpoch=7;",
 "let styledCollectionResults=[{focusItemId:'synthetic-saved-a'}];",
 "let db={name:'closet-current-user-owner-a'};",
 "const $=id=>document.getElementById(id);",
 "const readAll=async()=>[{id:'synthetic-saved-a'}];",
 "window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};",
 "localStorage.setItem('closet-current-auth-v1',JSON.stringify({epoch:'same-token'}));",
 actual,
 "window.__begin=()=>mountOriginalPhotoPreview167();",
 "window.__change=mode=>{",
 "if(mode==='owner-switch'||mode==='error-owner-switch'){",
 " window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};",
 " db={name:'closet-current-user-owner-b'};captureOperationEpoch++;",
 " $('stylistStatus').textContent='owner B signed screen';",
 "}",
 "if(mode==='same-id-relogin'){",
 " window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};",
 " db={name:'closet-current-user-owner-a'};captureOperationEpoch++;",
 "}",
 "if(mode==='auth-ref-replacement')window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};",
 "if(mode==='db-ref-replacement')db={name:'closet-current-user-owner-a'};",
 "if(mode==='capture-epoch')captureOperationEpoch++;",
 "if(mode==='persisted-token')localStorage.setItem('closet-current-auth-v1',JSON.stringify({epoch:'other-token'}));",
 "if(mode==='auth-gate')$('authGate').hidden=false;",
 "if(mode==='app-shell')$('appShell').hidden=true;",
 "if(mode==='request-serial')styledCollectionRequestSerial++;",
 "if(mode==='results-replaced')styledCollectionResults=[{focusItemId:'other-result'}];",
 "if(mode==='newer-viewer-ticket')originalPhotoMountSerial167++;",
 "if(mode==='revoked-assertion')window.closetAuth.assertCurrent=()=>{throw Error('revoked')};",
 "};",
 "window.__outcome=()=>({mounted:!!originalPhotoPreview167,",
 " buttons:document.querySelectorAll('button[data-style-photo-preview-165]').length,",
 " status:$('stylistStatus').textContent});"
].join('\n');
const server=createServer((req,res)=>{
 if(req.url?.startsWith('/style-photo-preview-gate-165.mjs')){
  res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});return res.end(p165);
 }
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end('<!doctype html><html><body><div id="authGate" hidden></div><main id="appShell">'+
  '<p id="stylistStatus">owner A screen</p>'+
  '<section id="styledCollectionResults"><article class="styled-outfit">Synthetic outfit</article></section>'+
  '</main></body></html>');
});
await new Promise((ok,no)=>server.listen(0,'127.0.0.1',e=>e?no(e):ok()));
const url='http://127.0.0.1:'+server.address().port+'/';
const modes=['valid-owner','owner-switch','same-id-relogin','auth-ref-replacement',
 'db-ref-replacement','capture-epoch','persisted-token','auth-gate','app-shell',
 'request-serial','results-replaced','newer-viewer-ticket','revoked-assertion',
 'error-valid-owner','error-owner-switch'];
function deferred(){let resolve;const promise=new Promise(ok=>resolve=ok);return {promise,resolve};}
const results=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,
   args:name==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({
     viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     for(const mode of modes){
      const page=await context.newPage(),errors=[],requested=deferred(),release=deferred();
      page.on('pageerror',e=>errors.push(String(e)));
      try{
       await page.route('**/style-photo-preview-gate-165.mjs',async route=>{
        requested.resolve();
        await release.promise;
        if(mode.startsWith('error-'))await route.abort('failed');
        else await route.fulfill({status:200,contentType:'text/javascript',body:p165});
       });
       await page.goto(url,{waitUntil:'load'});
       await page.addScriptTag({type:'module',content:environment});
       await page.waitForFunction(()=>typeof window.__begin==='function');
       const work=page.evaluate(()=>window.__begin());
       await requested.promise;
       if(mode!=='valid-owner'&&mode!=='error-valid-owner')
        await page.evaluate(m=>window.__change(m),mode);
       release.resolve();
       await work;
       const state=await page.evaluate(()=>window.__outcome());
       if(mode==='valid-owner'){
        assert.equal(state.mounted,true,name+' '+width+' '+mode);
        assert.equal(state.buttons,1);
        assert.equal(state.status,'owner A screen');
       }else if(mode==='error-valid-owner'){
        assert.equal(state.mounted,false);
        assert.equal(state.buttons,0);
        assert.match(state.status,/Original clothing photo preview is unavailable/);
       }else{
        assert.equal(state.mounted,false,name+' '+width+' '+mode+' stale mount');
        assert.equal(state.buttons,0);
        assert.equal(state.status,mode==='error-owner-switch'?
         'owner B signed screen':'owner A screen');
       }
       assert.deepEqual(errors,[],name+' '+width+' '+mode+' browser JS exceptions');
       results.push({engine:name,width,mode,pass:true});
      }finally{release.resolve();await page.close();}
     }
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
assert.equal(results.length,90);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 source:'actual public/closet-stylist.js native P167 deferred import',
 module:'actual public/style-photo-preview-gate-165.mjs',
 cases:results.length,accounts:'synthetic',realPhysicalDevices:false,
 familyAlpha:'HOLD',results
},null,2));
console.log('Mission 3 native Style delayed ESM photo mount: 90 Chromium/WebKit synthetic viewport cases PASS. NO DEPLOY');
