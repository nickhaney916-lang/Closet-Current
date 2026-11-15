'use strict';
// Execute the actual production import handler and owner lease against disposable
// signed-owner, DOM and backup-controller doubles. No private data or network.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('public/app.js','utf8');
function extract(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'missing actual app source boundary '+start);
 return source.slice(a,b);
}
const lease=extract('function ownerWardrobeMutationLease(){','function writeAll(');
const handler=extract("$('import').onchange=async e=>{","window.addEventListener('beforeunload',e=>{if(batch.length");
function fixture(){
 const events=[],nodes={
  import:{value:''},
  authGate:{hidden:true},
  appShell:{hidden:false}
 };
 const auth={user:{id:'owner-a'},assertCurrent(){if(auth.revoked)throw Error('revoked')}};
 const db={name:'closet-current-user-owner-a'};
 const ctx={
  window:{closetAuth:auth,restoreAtomic01Bridge:null},db,captureOperationEpoch:7,
  location:{search:'?restoreAtomic01=research&nativeLossless04=research'},
  URLSearchParams,
  $(id){return nodes[id]},
  message(value){events.push('message:'+value)},
  confirm(){events.push('confirm');return true}
 };
 vm.createContext(ctx);
 vm.runInContext(lease+handler,ctx,{timeout:3000});
 const counts={invoked:0,committed:0};
 const approval={incoming:{itemCount:1,savedCount:1},existing:2,savedExisting:1};
 const bridge={async importBackup(_data,{confirm}){
  counts.invoked++;events.push('bridge-invoked');
  const ok=confirm(approval);
  if(ok)counts.committed++;
  return {cancelled:!ok};
 }};
 ctx.window.restoreAtomic01Bridge=bridge;
 const payload=JSON.stringify({format:'closet-current-owner-backup',version:4,items:[]});
 const file={size:payload.length,text:async()=>payload};
 return {
  ctx,nodes,events,counts,bridge,file,
  run(selected=file){
   return ctx.$('import').onchange({target:{files:[selected],value:'selected'}});
  },
  changeOwner(){ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};ctx.db={name:'closet-current-user-owner-b'}},
  relogin(){ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}}},
  replaceBridge(){ctx.window.restoreAtomic01Bridge={importBackup(){throw Error('unrelated controller')}}}
 };
}
function pendingFile(f){
 let release;
 const file={size:100,text:()=>new Promise(resolve=>{release=()=>resolve(JSON.stringify({format:'closet-current-owner-backup',version:4,items:[]}))})};
 return {file,release:()=>release()};
}
async function turn(){await new Promise(resolve=>setImmediate(resolve))}
test('verified signed original session can import via the existing v4 bridge',async()=>{
 const f=fixture();
 await f.run();
 assert.equal(f.counts.invoked,1);
 assert.equal(f.counts.committed,1);
 assert.deepEqual(f.events.slice(-2),['confirm','message:All clothing photos, category corrections and outfits restored together.']);
});
test('auth gate relocked while file read pending prevents private confirmation/write',async()=>{
 const f=fixture(),p=pendingFile(f),running=f.run(p.file);
 await turn();f.nodes.authGate.hidden=false;p.release();await running;
 assert.equal(f.counts.invoked,0);
 assert.deepEqual(f.events,[]);
});
test('private app hidden during file read prevents private confirmation/write',async()=>{
 const f=fixture(),p=pendingFile(f),running=f.run(p.file);
 await turn();f.nodes.appShell.hidden=true;p.release();await running;
 assert.equal(f.counts.invoked,0);
 assert.deepEqual(f.events,[]);
});
test('same owner ID re-login during pending file read has no import side effect',async()=>{
 const f=fixture(),p=pendingFile(f),running=f.run(p.file);
 await turn();f.relogin();p.release();await running;
 assert.equal(f.counts.invoked,0);
 assert.deepEqual(f.events,[]);
});
test('bridge replacement inside approval denies old controller before commit',async()=>{
 const f=fixture();
 f.ctx.confirm=()=>{f.events.push('confirm');f.replaceBridge();return true};
 await f.run();
 assert.equal(f.counts.invoked,1);
 assert.equal(f.counts.committed,0);
 assert.ok(f.events.some(x=>x.includes('recovery controls changed')));
 assert.ok(!f.events.some(x=>x.includes('restored together')));
});
test('old controller finishing after replacement must not publish restore success',async()=>{
 const f=fixture();let release;
 f.bridge.importBackup=async()=>{
  f.counts.invoked++;
  await new Promise(resolve=>{release=resolve});
  return {cancelled:false};
 };
 const running=f.run();await turn();
 assert.equal(f.counts.invoked,1);
 f.replaceBridge();release();await running;
 assert.ok(!f.events.some(x=>x.includes('restored together')));
});
test('locked UI during v4 async restore cannot publish former owner status',async()=>{
 const f=fixture();let release;
 f.bridge.importBackup=async()=>{
  f.counts.invoked++;
  await new Promise(resolve=>{release=resolve});
  return {cancelled:false};
 };
 const running=f.run();await turn();
 assert.equal(f.counts.invoked,1);
 f.nodes.authGate.hidden=false;release();await running;
 assert.deepEqual(f.events,[]);
});
test('bridge replacement before async approval callback prevents old confirmation',async()=>{
 const f=fixture();let release;
 f.bridge.importBackup=async(_data,{confirm})=>{
  f.counts.invoked++;
  await new Promise(resolve=>{release=resolve});
  return {cancelled:!confirm({incoming:{itemCount:1,savedCount:1},existing:1,savedExisting:1})};
 };
 const running=f.run();await turn();f.replaceBridge();release();await running;
 assert.equal(f.counts.invoked,1);
 assert.ok(!f.events.includes('confirm'));
 assert.ok(!f.events.some(x=>x.includes('restored together')));
});

function legacyBackupFile(outfitBoard){
 const data={format:'closet-current',version:3,items:[{
  id:'new-shirt',category:'Tops',name:'Reviewed shirt',
  image:'data:image/jpeg;base64,/9j/2Q==',color:'Blue'
 }],outfitBoard};
 const encoded=JSON.stringify(data);
 return {size:encoded.length,text:async()=>encoded};
}
function legacyFixture(){
 const f=fixture();
 f.ctx.location.search='';
 f.ctx.categories=['Tops','Uncategorized'];
 f.ctx.items=[{id:'existing-shoe',category:'Shoes'}];
 f.ctx.normalizeClothing=x=>x;
 f.ctx.validLook=x=>x;
 // VM executes the real default app import handler; the real atomic module
 // is exercised separately against native IndexedDB in the built-PWA test.
 // A constrained module double here observes the transaction boundary.
 f.ctx.writes=Promise.resolve();
 f.ctx.cleanOutfitBoard=(x)=>x;
 f.ctx.importBoardBackup=async()=>{throw Error('unsafe legacy separate board write')};
 f.ctx.mission3AtomicImporter=async()=>({
  prepareLegacyAtomicM3:async({data,assertLease})=>{
   assertLease();
   return {incoming:data.items,board:data.outfitBoard||null,
    looks:data.looks||null,
    counts:{garments:data.items.length,looks:data.looks?.length||0,
     savedOutfits:data.outfitBoard?.saved?.length||0}};
  },
  commitLegacyAtomicM3:async({prepared,assertLease,confirmed})=>{
   assertLease();assert.equal(confirmed,true);
   f.counts.legacyWrites=(f.counts.legacyWrites||0)+1;
   f.ctx.items.push(...prepared.incoming);
   if(prepared.board)f.counts.boardWrites=(f.counts.boardWrites||0)+1;
   return {committed:true,atomic:true};
  }
 });
 f.ctx.mission3ReloadOwnerCloudView=async()=>{};
 f.ctx.window.closetCloud={changed(){f.counts.cloudChanged=(f.counts.cloudChanged||0)+1}};
 f.ctx.render=()=>{};
 f.ctx.boardHasUnsavedDraft=()=>false;
 return f;
}
test('default legacy import rejects malformed saved outfits before any garment write',async()=>{
 const f=legacyFixture();
 await f.run(legacyBackupFile({current:{slots:{top:'new-shirt'}},saved:[null]}));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.equal(f.counts.boardWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('invalid outfit data')));
});
test('default legacy import rejects missing saved garment references before writing',async()=>{
 const f=legacyFixture();
 await f.run(legacyBackupFile({current:{slots:{top:'missing-owner-item'}},saved:[]}));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.equal(f.counts.boardWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('unavailable outfit garment')));
});
test('default legacy import refuses to overwrite an unfinished native outfit draft',async()=>{
 const f=legacyFixture();
 f.ctx.boardHasUnsavedDraft=()=>true;
 await f.run(legacyBackupFile({current:{slots:{top:'new-shirt'}},saved:[]}));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('Save or discard unfinished outfit changes')));
});
test('default legacy import rechecks outfit edits after approval before writing',async()=>{
 const f=legacyFixture();
 let dirty=false;
 f.ctx.boardHasUnsavedDraft=()=>dirty;
 f.ctx.confirm=()=>{dirty=true;return true};
 await f.run(legacyBackupFile({current:{slots:{top:'new-shirt'}},saved:[]}));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.equal(f.counts.boardWrites||0,0);
});
test('default legacy import still allows a valid saved outfit referring to a new or existing garment',async()=>{
 const f=legacyFixture();
 await f.run(legacyBackupFile({current:{slots:{top:'new-shirt',shoes:'existing-shoe'}},
  saved:[{name:'My saved outfit',slots:{top:'new-shirt',shoes:'existing-shoe'}}]}));
 assert.equal(f.counts.legacyWrites,1,JSON.stringify(f.events));
 assert.equal(f.counts.boardWrites,1);
 assert.ok(f.events.some(x=>x.includes('imported atomically.')));
});

function legacyRowsFile(rows,board={current:{},saved:[]}){
 const content=JSON.stringify({format:'closet-current',version:3,items:rows,outfitBoard:board});
 return {size:content.length,text:async()=>content};
}
test('default legacy restore refuses two physical garment IDs colliding after 100-char normalization',async()=>{
 const f=legacyFixture(),same='x'.repeat(100);
 const photo='data:image/jpeg;base64,/9j/2Q==';
 await f.run(legacyRowsFile([{id:same+'A',image:photo},{id:same+'B',image:photo}]));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.equal(f.counts.boardWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('duplicate garment IDs')));
});
test('default legacy restore refuses a source record explicitly belonging to a different account',async()=>{
 const f=legacyFixture();
 await f.run(legacyRowsFile([{
  id:'old-owner-piece',ownerId:'owner-b',image:'data:image/jpeg;base64,/9j/2Q=='
 }]));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('another account')));
});
test('default legacy restore also refuses foreign-owner tag inside original photo metadata',async()=>{
 const f=legacyFixture();
 await f.run(legacyRowsFile([{
  id:'foreign-original',image:'data:image/jpeg;base64,/9j/2Q==',
  originalPhoto:{ownerId:'owner-b',image:'data:image/jpeg;base64,/9j/2Q=='}
 }]));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('another account')));
});

const {webcrypto}=require('node:crypto');
const originalJPEG='data:image/jpeg;base64,/9j/2Q==';
const originalHash='32461d5bd1773012acef0ba15636752949bd7c2ce50f9172159d9f56cf0dd9af';
function signedOriginalBackup({photo=originalJPEG,hash=originalHash,metadataHash=hash}={}){
 return legacyRowsFile([{
  id:'exact-original-photo',image:originalJPEG,category:'Tops',
  sourceHashVerified:true,sourceSHA256:hash,
  originalPhoto:{image:photo,sha256:metadataHash}
 }]);
}
function signedPhotoFixture(){
 const f=legacyFixture();
 f.ctx.crypto=webcrypto;
 f.ctx.atob=atob;
 return f;
}
test('default legacy import preserves a matching original JPEG and SHA-256 receipt',async()=>{
 const f=signedPhotoFixture();
 await f.run(signedOriginalBackup());
 assert.equal(f.counts.legacyWrites,1,JSON.stringify(f.events));
 const row=f.ctx.items.find(x=>x.id==='exact-original-photo');
 assert.equal(row.originalPhoto.image,originalJPEG);
 assert.equal(row.originalPhoto.sha256,originalHash);
 assert.equal(row.sourceSHA256,originalHash);
 assert.equal(row.sourceHashVerified,true);
});
test('default legacy import rejects tampered original JPEG bytes before any record write',async()=>{
 const f=signedPhotoFixture();
 await f.run(signedOriginalBackup({photo:'data:image/jpeg;base64,/9j/2A=='}));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('SHA-256 mismatch')));
});
test('default legacy import rejects internally inconsistent original SHA receipts',async()=>{
 const f=signedPhotoFixture();
 await f.run(signedOriginalBackup({metadataHash:'f'.repeat(64)}));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('receipt is inconsistent')));
});
test('default legacy import rejects a signed source whose original JPEG bytes are absent',async()=>{
 const f=signedPhotoFixture();
 const invalid=legacyRowsFile([{
  id:'missing-source',category:'Tops',image:originalJPEG,
  sourceHashVerified:true,sourceSHA256:originalHash,
  originalPhoto:{image:null,sha256:originalHash}
 }]);
 await f.run(invalid);
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('original JPEG is unavailable')));
});
test('default legacy import revalidates exact login after asynchronous original SHA verification',async()=>{
 const f=signedPhotoFixture();
 let resume,entered;
 const started=new Promise(resolve=>entered=resolve);
 const digest=await webcrypto.subtle.digest('SHA-256',Uint8Array.from([255,216,255,217]));
 f.ctx.crypto={subtle:{digest:async()=>{entered();return new Promise(resolve=>{resume=()=>resolve(digest)})}}};
 const importing=f.run(signedOriginalBackup());
 await started;
 f.relogin();
 resume();
 await importing;
 assert.equal(f.counts.legacyWrites||0,0);
 assert.equal(f.counts.boardWrites||0,0);
 assert.deepEqual(f.events,[]);
});

test('default atomic importer retains historical 100-character garment ID normalization',async()=>{
 const f=legacyFixture(),longId='l'.repeat(100)+'-legacy-overflow';
 await f.run(legacyRowsFile([{id:longId,category:'Tops',
  image:'data:image/jpeg;base64,/9j/2Q=='}],null));
 assert.equal(f.counts.legacyWrites,1,JSON.stringify(f.events));
 assert.equal(f.ctx.items.some(x=>x.id==='l'.repeat(100)),true);
 assert.equal(f.ctx.items.some(x=>x.id===longId),false);
 assert.ok(f.events.some(x=>x.includes('imported atomically.')));
});
test('default atomic importer does not normalize a conflicting long ID into an existing second row',async()=>{
 const f=legacyFixture(),common='q'.repeat(100);
 await f.run(legacyRowsFile([
  {id:common+'-first',image:'data:image/jpeg;base64,/9j/2Q=='},
  {id:common+'-second',image:'data:image/jpeg;base64,/9j/2Q=='}
 ],null));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('duplicate garment IDs')));
});

const simpleLegacyRow={id:'safe-source',image:'data:image/jpeg;base64,/9j/2Q==',category:'Tops'};
test('legacy import refuses foreign owner claim nested inside original photo metadata before write',async()=>{
 const f=legacyFixture();
 await f.run(legacyRowsFile([{
  ...simpleLegacyRow,originalPhoto:{metadata:{capture:{ownerId:'owner-b'}}}
 }]));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('another account')));
});
test('legacy import refuses foreign owner claim hidden in saved outfit metadata',async()=>{
 const f=legacyFixture();
 await f.run(legacyRowsFile([simpleLegacyRow],{current:{slots:{top:'safe-source'}},
  saved:[{name:'Cross-owner saved outfit',metadata:{ownerId:'owner-b'}}]}));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.equal(f.counts.boardWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('another account')));
});
test('legacy import refuses deep foreign owner claim in inspiration before any garment write',async()=>{
 const f=legacyFixture();
 // Production validLook sanitizes unknown metadata; security check must run
 // against the raw backup BEFORE sanitization could discard owner claims.
 f.ctx.validLook=x=>({id:x.id,pieces:x.pieces});
 const json=JSON.stringify({format:'closet-current',version:3,items:[simpleLegacyRow],
  looks:[{id:'unsafe-look',pieces:[],extras:[{source:{ownerId:'owner-b'}}]}]});
 await f.run({size:json.length,text:async()=>json});
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('another account')));
});
test('legacy import rejects prototype-pollution keys in nested photo data',async()=>{
 const f=legacyFixture();
 const evil=JSON.parse('{"__proto__":{"polluted":true}}');
 await f.run(legacyRowsFile([{...simpleLegacyRow,originalPhoto:{metadata:evil}}]));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('unsafe metadata')));
 assert.equal({}.polluted,undefined);
});
test('legacy import accepts nested source owner metadata matching its exact signed owner',async()=>{
 const f=legacyFixture();
 await f.run(legacyRowsFile([{...simpleLegacyRow,
  originalPhoto:{metadata:{capture:{ownerId:'owner-a'}}}
 }]));
 assert.equal(f.counts.legacyWrites,1,JSON.stringify(f.events));
 assert.ok(f.events.some(x=>x.includes('imported atomically.')));
});
test('legacy import rejects excessively nested metadata before any private storage mutation',async()=>{
 const f=legacyFixture();
 let nested={value:'leaf'};
 for(let i=0;i<40;i++)nested={deep:nested};
 await f.run(legacyRowsFile([{...simpleLegacyRow,metadata:nested}]));
 assert.equal(f.counts.legacyWrites||0,0);
 assert.ok(f.events.some(x=>x.includes('nesting is unsafe')));
});

if(process.env.M3_TEST_DIST_ATOMIC==='1'){
 test('DEFAULT built PWA atomically restores original JPEG, looks and outfit in Chromium and WebKit',async()=>{
  const {createServer}=require('node:http');
  const {readFile}=require('node:fs/promises');
  const {resolve,extname}=require('node:path');
  const {createHash}=require('node:crypto');
  const {chromium,webkit}=require('playwright');
  const sharp=require('sharp');
  const root=resolve('dist');
  const jpeg='data:image/jpeg;base64,'+(await sharp({create:{width:64,height:64,
   channels:3,background:{r:72,g:132,b:181}}}).jpeg().toBuffer()).toString('base64');
  const sha=createHash('sha256').update(Buffer.from(jpeg.slice('data:image/jpeg;base64,'.length),'base64')).digest('hex');
  // A genuine, high-entropy JPEG bigger than the preview's 3 MB encoded cap.
  // Legacy back-ups may carry a larger lossless original alongside a small
  // reviewed preview. Both browser engines must round-trip this original.
  const largeSourceBytes=await sharp(require('node:crypto').randomBytes(2000*2000*3),
   {raw:{width:2000,height:2000,channels:3}}).jpeg({quality:90}).toBuffer();
  assert.ok(largeSourceBytes.length>2_250_000&&largeSourceBytes.length<8*1024*1024,
   'fixture must exercise the separate, bounded original JPEG allowance');
  const largeOriginal='data:image/jpeg;base64,'+largeSourceBytes.toString('base64');
  const largeSHA=createHash('sha256').update(largeSourceBytes).digest('hex');
  const server=createServer(async(req,res)=>{
   try{
    const url=new URL(req.url,'http://127.0.0.1');
    const rel=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    const file=resolve(root,rel);
    if(!file.startsWith(root+'/'))throw Error('Outside PWA distribution');
    const body=await readFile(file);
    const mime=extname(file)==='.html'?'text/html':
     /\.(?:js|mjs)$/.test(file)?'text/javascript':'application/octet-stream';
    res.writeHead(200,{'content-type':mime,'cache-control':'no-store'});res.end(body);
   }catch{res.writeHead(404);res.end('not found');}
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const origin='http://127.0.0.1:'+server.address().port;
  try{
   for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
    try{
     const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
      hasTouch:true,serviceWorkers:'block'});
     try{
      const owner='signed-dist-'+name;
      await ctx.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
       "window.closetAuth={user:{id:'"+owner+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
      await ctx.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
       'window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed:()=>{window.__privateCloudDirty=(window.__privateCloudDirty||0)+1}};'}));
      const blocked=[];
      await ctx.route('**/*',route=>{
       const url=new URL(route.request().url());
       if(url.hostname==='127.0.0.1'||url.protocol==='data:'||url.protocol==='blob:')
        return route.fallback();
       blocked.push({url:url.href,method:route.request().method()});return route.abort();
      });
      await ctx.addInitScript(()=>{
       class OfflineWorker{
        constructor(){this.onmessage=null;this.terminated=false;}
        postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
         id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}
        }});},0);}
        terminate(){this.terminated=true;}
       }
       Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
      });
      const page=await ctx.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(String(error)));
      await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
      const result=await page.evaluate(async({owner,jpeg,sha,largeOriginal,largeSHA})=>{
       const input={format:'closet-current',version:3,items:[{
        id:'built-photo',ownerId:owner,name:'Original intact',category:'Tops',itemType:'T-shirt',
        color:'Blue',image:jpeg,sourceHashVerified:true,sourceSHA256:sha,
        originalPhoto:{image:jpeg,sha256:sha,ownerId:owner}
       }],looks:[{id:'built-look',title:'Built PWA look',pieces:[]}],
        outfitBoard:{current:{name:'Built outfit',slots:{top:'built-photo'}},
         saved:[{name:'Saved built outfit',slots:{top:'built-photo'}}]}};
       window.confirm=()=>true;
       const json=JSON.stringify(input);
       await document.getElementById('import').onchange({target:{
        files:[{size:json.length,text:async()=>json}],value:'selected'}});
       const readSnapshot=()=>new Promise((done,reject)=>{
        const tx=db.transaction(['items','state'],'readonly');
        const items=tx.objectStore('items').getAll(),state=tx.objectStore('state').getAll();
        tx.oncomplete=()=>done({items:items.result,state:state.result});
        tx.onerror=()=>reject(tx.error);
       });
       const rows=await readSnapshot(),fingerprint=JSON.stringify(rows);
       // An invalid saved outfit after the first valid import must not partially
       // write the new garment, inspiration or cloud revision in built PWA.
       const invalid=structuredClone(input);
       invalid.items[0].id='should-never-appear';
       invalid.outfitBoard.saved[0].slots.top='unavailable-owner-garment';
       const badJSON=JSON.stringify(invalid);
       await document.getElementById('import').onchange({target:{
        files:[{size:badJSON.length,text:async()=>badJSON}],value:'selected'}});
       const invalidRollback=JSON.stringify(await readSnapshot())===fingerprint;
       window.confirm=()=>false;
       await document.getElementById('import').onchange({target:{
        files:[{size:json.length,text:async()=>json}],value:'selected'}});
       const cancelledUnchanged=JSON.stringify(await readSnapshot())===fingerprint;
       const changesBeforeHistorical=window.__privateCloudDirty||0;
       // Earlier v1-v3 imports accepted long garment IDs and truncated them
       // at 100 characters. Verify the new default atomic route preserves that
       // exact contract in the BUILT app, without a separate research server.
       window.confirm=()=>true;
       const legacyId='h'.repeat(100)+'-historical-long-tail';
       const legacyBackup={format:'closet-current',version:1,items:[{
        id:legacyId,category:'Tops',name:'Historical import',image:jpeg,
        sourceHashVerified:true,sourceSHA256:largeSHA,
        originalPhoto:{image:largeOriginal,sha256:largeSHA,ownerId:owner}
       }]};
       const legacyJSON=JSON.stringify(legacyBackup);
       await document.getElementById('import').onchange({target:{
        files:[{size:legacyJSON.length,text:async()=>legacyJSON}],value:'selected'}});
       const historicalRows=await readSnapshot();
       const historicalState=Object.fromEntries(historicalRows.state.map(row=>[row.id,row]));
       const legacyIdNormalized=historicalRows.items.some(row=>row.id===legacyId.slice(0,100))&&
        !historicalRows.items.some(row=>row.id===legacyId);
       const largeOriginalRetained=historicalRows.items.some(row=>
        row.id===legacyId.slice(0,100)&&row.originalPhoto?.image===largeOriginal&&
        row.sourceSHA256===largeSHA&&row.sourceHashVerified===true);
       const originalAndLooksPreserved=
        historicalRows.items.some(row=>row.id==='built-photo'&&row.originalPhoto?.image===jpeg)&&
        historicalState.looks?.looks?.some(row=>row.id==='built-look')&&
        historicalState['outfit-board']?.current?.slots?.top==='built-photo';
       // Some v1-v3 exports carry explicit null owner tags because owner
       // attestation was not yet part of that version. Do not reject them as
       // a foreign account or falsely mark their original JPEG as verified.
       const unclaimed={format:'closet-current',version:2,items:[{
        id:'unclaimed-legacy-source',ownerId:null,category:'Tops',image:jpeg,
        originalPhoto:{ownerId:null,image:jpeg}
       }]};
       const unclaimedJSON=JSON.stringify(unclaimed);
       await document.getElementById('import').onchange({target:{
        files:[{size:unclaimedJSON.length,text:async()=>unclaimedJSON}],value:'selected'}});
       const nullOwnerRows=await readSnapshot();
       const unclaimedSaved=nullOwnerRows.items.find(row=>row.id==='unclaimed-legacy-source');
       const unclaimedOwnerAccepted=unclaimedSaved?.ownerId===null&&
        unclaimedSaved.originalPhoto?.ownerId===null&&unclaimedSaved.originalPhoto?.image===jpeg&&
        unclaimedSaved.sourceHashVerified!==true;
       const nullOwnerState=Object.fromEntries(nullOwnerRows.state.map(row=>[row.id,row]));
       const byId=Object.fromEntries(rows.state.map(row=>[row.id,row]));
       return {items:rows.items.map(item=>({id:item.id,ownerId:item.ownerId,
        originalPhoto:item.originalPhoto?.image,sourceSHA256:item.sourceSHA256})),
        looks:byId.looks?.looks?.map(x=>x.id),
        outfit:byId['outfit-board']?.current?.slots?.top,
        saved:byId['outfit-board']?.saved?.[0]?.slots?.top,
        revision:byId['cloud-sync']?.localRevision,
        dirty:byId['cloud-sync']?.dirty,
        message:document.getElementById('message')?.textContent,
        invalidRollback,cancelledUnchanged,legacyIdNormalized,largeOriginalRetained,originalAndLooksPreserved,
        unclaimedOwnerAccepted,afterUnclaimedRevision:nullOwnerState['cloud-sync']?.localRevision,
        afterLegacyRevision:historicalState['cloud-sync']?.localRevision,
        changed:changesBeforeHistorical,afterLegacyCloudChanged:window.__privateCloudDirty||0};
      },{owner,jpeg,sha,largeOriginal,largeSHA});
      assert.deepEqual(result.items,[{id:'built-photo',ownerId:owner,
       originalPhoto:jpeg,sourceSHA256:sha}],name+' original custody');
      assert.deepEqual(result.looks,['built-look'],name+' inspiration');
      assert.equal(result.outfit,'built-photo');
      assert.equal(result.saved,'built-photo');
      assert.equal(result.revision,1);
      assert.equal(result.dirty,true);
      assert.equal(result.changed,1);
      assert.equal(result.invalidRollback,true,name+' rejected malformed backup without partial writes');
      assert.equal(result.cancelledUnchanged,true,name+' retained all private data on cancellation');
      assert.equal(result.legacyIdNormalized,true,name+' truncates historical long IDs without losing the garment');
      assert.equal(result.largeOriginalRetained,true,name+' preserves a genuine >3 MB encoded original JPEG');
      assert.equal(result.originalAndLooksPreserved,true,name+' preserves existing outfits and JPEG');
      assert.equal(result.afterLegacyRevision,2,name+' increments cloud revision in atomic transaction');
      assert.equal(result.afterLegacyCloudChanged,3,name+' signals private backup after each atomic commit');
      assert.equal(result.unclaimedOwnerAccepted,true,name+' restores v2 unclaimed owner photo without false proof');
      assert.equal(result.afterUnclaimedRevision,3,name+' records unclaimed import in private cloud revision');
      assert.match(result.message,/canceled|imported atomically/i);
      assert.deepEqual(errors,[]);
      assert.equal(blocked.some(request=>request.method!=='GET'),false,
       'Built private import must never attempt an external write');
     }finally{await ctx.close();}
    }finally{await browser.close();}
   }
  }finally{server.close();}
 });

 test('DEFAULT atomic backup restores offline from installed scoped PWA cache in Chromium and WebKit',async()=>{
  const {createServer}=require('node:http');
  const {readFile}=require('node:fs/promises');
  const {resolve,extname}=require('node:path');
  const {chromium,webkit}=require('playwright');
  const sharp=require('sharp');
  const jpeg='data:image/jpeg;base64,'+(await sharp({create:{
   width:48,height:48,channels:3,background:{r:71,g:130,b:182}
  }}).jpeg().toBuffer()).toString('base64');
  const root=resolve('dist'),scoped='/closet-current/';
  const moduleRequests=[];
  let originDisconnected=false;
  const server=createServer(async(req,res)=>{
   // WebKit Playwright's offline emulation may reject before SW interception.
   // A severed origin socket tests the actual offline cache path instead.
   if(originDisconnected){req.socket.destroy();return;}
   try{
    const url=new URL(req.url,'http://127.0.0.1');
    // Intentionally do NOT serve /research from the root. The import must
    // stay within /closet-current/ or the deployed subpath is broken.
    if(!url.pathname.startsWith(scoped))throw Error('Outside scoped PWA');
    const relative=decodeURIComponent(url.pathname.slice(scoped.length))||'index.html';
    const full=resolve(root,relative);
    if(!full.startsWith(root+'/'))throw Error('Outside distribution');
    if(relative==='research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs')
     moduleRequests.push(url.pathname);
    const data=await readFile(full);
    const type=extname(full)==='.html'?'text/html':
     /\.(?:js|mjs)$/.test(full)?'text/javascript':'application/octet-stream';
    res.writeHead(200,{'content-type':type,'cache-control':'no-store'});res.end(data);
   }catch{res.writeHead(404);res.end('not found');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  try{
   for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
    try{
     const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
      hasTouch:true,serviceWorkers:'allow'});
     try{
      const owner='scoped-atomic-'+name;
      await ctx.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
       "window.closetAuth={user:{id:'"+owner+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
      await ctx.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
       'window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed:()=>{}};'}));
      const external=[];
      await ctx.route('**/*',route=>{
       const url=new URL(route.request().url());
       if(url.hostname==='127.0.0.1'||url.protocol==='data:'||url.protocol==='blob:')
        return route.fallback();
       external.push({method:route.request().method(),url:url.href});return route.abort();
      });
      await ctx.addInitScript(()=>{
       class OfflineWorker{
        constructor(){this.onmessage=null;this.terminated=false;}
        postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
         id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}
        }});},0);}
        terminate(){this.terminated=true;}
       }
       Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
      });
      const page=await ctx.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(String(error)));
      await page.goto(origin+scoped,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
      // This is the real built PWA service worker, not a mocked network
      // route. Allow its install/precache to finish and claim the page first.
      await page.evaluate(()=>navigator.serviceWorker.ready);
      await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,
       {timeout:30000});
      const helperCache=await page.evaluate(async()=>{
       const target=new URL('research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs',
        navigator.serviceWorker.controller.scriptURL);
       const cachesList=await caches.keys();
       for(const name of cachesList){
        const cached=await caches.open(name);
        if(await cached.match(target.href))return {present:true,cache:name};
       }
       return {present:false,caches:cachesList};
      });
      assert.equal(helperCache.present,true,name+' scoped offline cache includes atomic module');
      // The import module has NOT yet been fetched by the app script itself.
      // Cut the network now: onChange must load it from service-worker cache.
      if(name==='webkit')originDisconnected=true;
      else await ctx.setOffline(true);
      const offlineProbe=await page.evaluate(async()=>{
       const url=new URL('./research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs',location.href);
       try{const res=await fetch(url.href,{cache:'no-store'});return {ok:res.ok,status:res.status,
        swControlled:!!navigator.serviceWorker.controller,online:navigator.onLine};}
       catch(error){return {error:String(error),swControlled:!!navigator.serviceWorker.controller,
        online:navigator.onLine};}
      });
      const answer=await page.evaluate(async({owner,jpeg})=>{
       const backup={format:'closet-current',version:3,
        items:[{id:'scoped-shirt',ownerId:owner,name:'Scoped shirt',category:'Tops',
         itemType:'T-shirt',color:'Blue',image:jpeg}],
        looks:[{id:'scoped-look',title:'Scoped inspiration',pieces:[]}],
        outfitBoard:{current:{name:'Scoped outfit',slots:{top:'scoped-shirt'}},
         saved:[{name:'Scoped saved outfit',slots:{top:'scoped-shirt'}}]}};
       window.confirm=()=>true;
       const json=JSON.stringify(backup);
       await document.getElementById('import').onchange({target:{
        files:[{size:json.length,text:async()=>json}],value:'selected'}});
       const rows=await new Promise((resolve,reject)=>{
        const tx=db.transaction(['items','state'],'readonly');
        const items=tx.objectStore('items').getAll(),state=tx.objectStore('state').getAll();
        tx.oncomplete=()=>resolve({items:items.result,state:state.result});
        tx.onerror=()=>reject(tx.error);
       });
       const state=Object.fromEntries(rows.state.map(x=>[x.id,x]));
       return {photos:rows.items.map(x=>({id:x.id,owner:x.ownerId})),
        looks:state.looks?.looks?.map(x=>x.id),
        board:state['outfit-board']?.current?.slots?.top,
        saved:state['outfit-board']?.saved?.[0]?.slots?.top,
        revision:state['cloud-sync']?.localRevision,dirty:state['cloud-sync']?.dirty,
        message:document.getElementById('message').textContent};
      },{owner,jpeg});
      assert.deepEqual(answer.photos,[{id:'scoped-shirt',owner}],
       name+' offline SW probe '+JSON.stringify({probe:offlineProbe,answer,errors,external}));
      assert.deepEqual(answer.looks,['scoped-look']);
      assert.equal(answer.board,'scoped-shirt');
      assert.equal(answer.saved,'scoped-shirt');
      assert.equal(answer.revision,1);assert.equal(answer.dirty,true);
      assert.match(answer.message,/imported atomically/i);
      assert.deepEqual(errors,[]);
      assert.equal(external.some(x=>x.method!=='GET'),false,'No external private writes');
      if(name==='webkit')originDisconnected=false;
      else await ctx.setOffline(false);
     }finally{originDisconnected=false;await ctx.close();}
    }finally{await browser.close();}
   }
   assert.equal(moduleRequests.length,2,'Each engine loaded the module from its scoped PWA folder');
   assert.ok(moduleRequests.every(x=>x===scoped+
    'research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs'));
  }finally{server.close();}
 });
}
