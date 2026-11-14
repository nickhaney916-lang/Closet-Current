// Exercise the actual P165 2D original-photo verification and UI controls
// in real Chromium/WebKit secure localhost origins. Synthetic photos only.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const folder=resolve(process.argv[2]||'benchmark/mission3-styled-original-photo-exact-session-browser');
await mkdir(folder,{recursive:true});
const source=await readFile('public/style-photo-preview-gate-165.mjs','utf8');
assert.ok(source.includes('createStyledOwnerPhotoPreview165'));
const jpeg=Buffer.concat([Buffer.from([255,216]),Buffer.alloc(180,67),Buffer.from([255,217])]);
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const sha=createHash('sha256').update(jpeg).digest('hex');
async function scenario(mode){
 document.body.innerHTML='<main id="grid"><article class="styled-outfit">'+
  '<h3>Synthetic saved blouse</h3></article></main>';
 const grid=document.getElementById('grid'),card=grid.querySelector('.styled-outfit');
 let authenticated=true,ownerId='owner-a',tokenEpoch='same-token',
  captureEpoch=3,authRef={id:'login-a'},privateDbRef={name:'closet-current-user-owner-a'};
 const session=()=>({authenticated,ownerId,epoch:tokenEpoch,
  privateDbName:privateDbRef.name,authRef,privateDbRef,operationEpoch:captureEpoch});
 const picture=mode.startsWith('legacy-')?{
  id:'synthetic-shirt-a',ownerId:'owner-a',image:window.__photo,
  userAdjusted:true,category:'Tops',itemType:'Shirt',name:'Synthetic Shirt'
 }:{
  id:'synthetic-shirt-a',ownerId:'owner-a',image:window.__photo,
  originalPhoto:{image:window.__photo,sha256:window.__sha},
  sourceSHA256:window.__sha,sourcePhotoOriginal:true,sourceHashVerified:true,
  userAdjusted:true,ownerReviewed:true,category:'Tops',itemType:'Shirt',
  name:'Synthetic shirt'
 };
 if(mode==='canonical-invalid-review')picture.ownerReviewed=false;
 if(mode==='canonical-original-sha-tamper'){
  picture.sourceSHA256='e'.repeat(64);
  picture.originalPhoto.sha256='e'.repeat(64);
 }
 const combination={focusItemId:picture.id,board:{slots:{top:picture.id}}};
 let list=[combination],calls=0;
 let unblock,reject,begin;
 const waiting=new Promise((yes,no)=>{unblock=yes;reject=no});waiting.catch(()=>{});
 const started=new Promise(yes=>begin=yes);
 const secondRead=mode.includes('second-read');
 const readOwnerItems=()=>{
  calls++;
  if(calls===(secondRead?2:1)){
   begin();return waiting;
  }
  return Promise.resolve([picture]);
 };
 const viewer=createStyledOwnerPhotoPreview165({
  grid,readResults:()=>list,readOwnerItems,getSession:session,events:window
 });
 viewer.mount();
 const button=card.querySelector('button[data-style-photo-preview-165]');
 const work=button.onclick();
 await started;
 const stale=()=>{
  if(mode==='canonical-switch-owner'){ownerId='owner-b';authRef={id:'login-b'};
   privateDbRef={name:'closet-current-user-owner-b'};captureEpoch++;}
  if(mode==='canonical-same-user-auth-ref'||mode==='canonical-second-read-relogin'||
     mode==='legacy-second-read-relogin'||mode==='canonical-stale-rejection')
   authRef={id:'relogin-a'};
  if(mode==='canonical-db-ref')privateDbRef={name:'closet-current-user-owner-a'};
  if(mode==='canonical-capture-epoch')captureEpoch++;
  if(mode==='canonical-token-epoch')tokenEpoch='new-token';
  if(mode==='canonical-signed-out')authenticated=false;
  if(mode==='canonical-detached')card.remove();
  if(mode==='canonical-results-replaced')list=[{...combination}];
  if(mode==='canonical-inventory-committed')window.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
  if(mode==='canonical-session-locked')window.dispatchEvent(new Event('closet:session-locked'));
 };
 stale();
 if(['canonical-error','canonical-stale-rejection'].includes(mode))
  reject(Error('PRIVATE original owner JPEG metadata'));
 else unblock([picture]);
 await work;
 const img=grid.querySelector('section.style-original-photo-preview-165 img');
 const warning=grid.querySelector('p[role="status"]');
 const detail=grid.querySelector('.style-original-photo-preview-165');
 const state=viewer.getState();
 const result={
  mode,calls,visible:!!img,photoMode:detail?.dataset.garmentPreviewMode||null,
  privateErrorLeak:!!warning?.textContent.includes('PRIVATE'),
  warning:warning?.textContent||'',
  disabled:button.disabled,buttonConnected:button.isConnected,
  stateVisible:state.visibleOriginalPhoto,
  released:state.releaseAuthorized
 };
 viewer.dispose();
 return result;
}
const js=[
 source.replace(/^export /gm,''),
 "window.__photo="+JSON.stringify(photo)+";",
 "window.__sha="+JSON.stringify(sha)+";",
 "window.__scenario=("+scenario.toString()+");"
].join('\n');
const modes=[
 'canonical-valid','legacy-valid','canonical-invalid-review','canonical-error',
 'canonical-switch-owner','canonical-same-user-auth-ref','canonical-db-ref',
 'canonical-capture-epoch','canonical-token-epoch','canonical-signed-out',
 'canonical-second-read-relogin','legacy-second-read-relogin',
 'canonical-stale-rejection','canonical-detached','canonical-results-replaced',
 'canonical-inventory-committed','canonical-session-locked',
 'canonical-original-sha-tamper'
];
const server=createServer((req,res)=>{
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end('<!doctype html><html><body>synthetic preview test</body></html>');
});
await new Promise((yes,no)=>server.listen(0,'127.0.0.1',err=>err?no(err):yes()));
const url='http://127.0.0.1:'+server.address().port+'/';
const results=[];
try{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,
   args:engineName==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({
     viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(String(e)));
     await page.goto(url);
     await page.addScriptTag({content:js});
     for(const mode of modes){
      const r=await page.evaluate(m=>window.__scenario(m),mode);
      assert.equal(r.privateErrorLeak,false,engineName+' '+width+' '+mode);
      assert.equal(r.released,false);
      if(mode==='canonical-valid'){
       assert.equal(r.visible,true);assert.equal(r.stateVisible,true);
       assert.equal(r.photoMode,'verified-original-photo-2d');
       assert.equal(r.disabled,false);
      }else if(mode==='legacy-valid'){
       assert.equal(r.visible,true);
       assert.equal(r.photoMode,'saved-photo-unverified-original-2d');
      }else if(['canonical-invalid-review','canonical-error',
       'canonical-original-sha-tamper'].includes(mode)){
       assert.equal(r.visible,false);
       assert.equal(r.warning,'Could not verify this saved photo. Reopen My Closet and try again.');
       assert.equal(r.disabled,false);
      }else{
       assert.equal(r.visible,false,engineName+' '+width+' '+mode+' stale image');
       assert.equal(r.warning,'',engineName+' '+width+' '+mode+' stale error');
       assert.equal(r.disabled,true,engineName+' '+width+' '+mode+' stale button');
      }
      results.push({engine:engineName,width,mode,pass:true});
     }
     assert.deepEqual(errors,[],engineName+' '+width+' page errors');
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
assert.equal(results.length,108);
await writeFile(resolve(folder,'results.json'),JSON.stringify({
 source:'production P165 photo preview gate from public source',
 cases:results.length,sourceBytes:jpeg.length,
 data:'synthetic locally generated JPEG-like bytes only',physicalDevice:false,
 familyAlpha:'HOLD',results
},null,2));
console.log('Mission 3 exact owner P165 photo preview:',results.length,
 'real Chromium/WebKit mobile viewport assertions passed. NO DEPLOY');
