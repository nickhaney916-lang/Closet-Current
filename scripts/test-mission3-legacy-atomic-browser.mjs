// Mission 3 real Chromium/WebKit v1-v3 legacy backup atomic merge integration.
// Public app.js + private native IndexedDB + gated source module.
// Synthetic owners/photos; blocks every external host request.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const output=resolve(process.argv[2]||'benchmark/mission3-legacy-atomic-browser');
await mkdir(output,{recursive:true});
const jpeg='data:image/jpeg;base64,'+(await sharp({create:{
 width:320,height:240,channels:3,background:{r:101,g:150,b:188}
}}).jpeg().toBuffer()).toString('base64');
const root=resolve('.'),pub=resolve('public'),
 types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=p.startsWith('/research/')?resolve(root,'.'+p):
   resolve(pub,'.'+(p==='/'?'/index.html':p));
  if(p.includes('\\')||(!full.startsWith(pub+'/')&&!full.startsWith(resolve(root,'research')+'/')))
   throw Error('Outside test root');
  const data=await readFile(full);
  res.writeHead(200,{'content-type':types[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[],errors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const ownerA='a'+width+'0000-0000-4000-8000-000000000000';
   const ownerB='b'+width+'0000-0000-4000-8000-000000000000';
   const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
    hasTouch:true,serviceWorkers:'block'});
   const external=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetAuth={user:{id:'"+ownerA+"'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed:()=>{window.__cloudLocalChanged=(window.__cloudLocalChanged||0)+1;}};"}));
    await context.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(['blob:','data:'].includes(url.protocol)||url.hostname==='127.0.0.1')return route.fallback();
     external.push({method:route.request().method(),path:url.pathname,blocked:true});
     return route.abort();
    });
    await context.addInitScript(()=>{
     class OfflineWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(m){setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{
       id:m.id,type:m.type==='load'?'ready':'result',choices:[],strong:false,details:{}
      }});},0);}
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:OfflineWorker});
    });
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push({engine,width,error:String(e)}));
    await page.goto(origin+'/?legacyAtomicM3=research',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
    const result=await page.evaluate(async({ownerA,ownerB,jpeg})=>{
     const idbRead=()=>new Promise((done,reject)=>{
      const tx=db.transaction(['items','state'],'readonly');
      const a=tx.objectStore('items').getAll(),b=tx.objectStore('state').getAll();
      tx.oncomplete=()=>done({items:a.result,state:b.result});
      tx.onerror=()=>reject(tx.error);
     });
     const idbWrite=rows=>new Promise((done,reject)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      for(const item of rows.items)tx.objectStore('items').put(item);
      for(const state of rows.state)tx.objectStore('state').put(state);
      tx.oncomplete=done;tx.onerror=()=>reject(tx.error);
     });
     const old=normalizeClothing({id:'kept-original',ownerId:ownerA,
      name:'Owner A original',category:'Tops',itemType:'T-shirt',color:'Blue',image:jpeg});
     await idbWrite({items:[old],state:[
      {id:'looks',looks:[{id:'old-look',title:'Old look',pieces:[]}]},
      {id:'outfit-board',current:{name:'Existing',slots:{top:'kept-original'}},
       saved:[{name:'Existing',slots:{top:'kept-original'}}]},
      {id:'cloud-sync',baseVersion:3,baseDocument:null,localRevision:5,dirty:false}
     ]});
     items=(await readAllFrom(db)).map(normalizeClothing);
     await reloadCloudLooks();await reloadCloudBoard();render();
     const first=normalizeClothing({id:'new-top',ownerId:ownerA,
      name:'New owner A garment',category:'Tops',itemType:'T-shirt',color:'Green',image:jpeg});
     const makeBackup=(opts={})=>({format:'closet-current',version:3,items:[first],
      looks:[{id:'new-look',title:'New inspiration',pieces:[]}],
      outfitBoard:{current:{name:'Imported',slots:{top:opts.badRef?'unknown-photo':'new-top'}},
       saved:[{name:'Imported outfit',slots:{top:'new-top'}}]}});
     window.confirm=()=>true;
     const select=async value=>{
      const json=JSON.stringify(value);
      await document.getElementById('import').onchange({target:{
       files:[{size:json.length,text:async()=>json}],value:'selected'}});
     };
     await select(makeBackup());
     const committed=await idbRead();
     const after=Object.fromEntries(committed.state.map(x=>[x.id,x]));
     const outcome={
      mergedItems:committed.items.map(x=>({id:x.id,ownerId:x.ownerId})),
      mergedLooks:after.looks?.looks?.map(x=>x.id)||[],
      boardTop:after['outfit-board']?.current?.slots?.top,
      savedBoardTop:after['outfit-board']?.saved?.[0]?.slots?.top,
      cloudRevision:after['cloud-sync']?.localRevision,
      cloudDirty:after['cloud-sync']?.dirty,
      originalExists:committed.items.some(x=>x.id==='kept-original'&&x.image===jpeg),
      newExists:committed.items.some(x=>x.id==='new-top'&&x.image===jpeg),
      notice:document.getElementById('message').textContent,
      screenCount:document.getElementById('closetCount').textContent,
      cloudChanged:window.__cloudLocalChanged||0
     };
     const fingerprint=JSON.stringify(await idbRead());
     await select(makeBackup({badRef:true}));
     const badRefUnchanged=JSON.stringify(await idbRead())===fingerprint;
     window.confirm=()=>false;
     await select(makeBackup());
     const cancelledUnchanged=JSON.stringify(await idbRead())===fingerprint;
     window.confirm=()=>true;
     const oldFile={size:5000,text:()=>new Promise(resolve=>{
      window.__resumeOldFile=()=>resolve(JSON.stringify(makeBackup()));
     })};
     const oldPending=document.getElementById('import').onchange({target:{
      files:[oldFile],value:'selected'}});
     for(let i=0;i<6;i++)await Promise.resolve();
     window.dispatchEvent(new Event('closet:session-locked'));
     window.closetAuth.user={id:ownerB};
     db=await openDB();
     const b=normalizeClothing({id:'only-B',ownerId:ownerB,name:'Owner B jacket',
      category:'Outerwear',itemType:'Jacket',image:jpeg,color:'Red'});
     await idbWrite({items:[b],state:[]});
     items=[b];batch=[];render();
     window.__resumeOldFile();
     await oldPending;
     const second=await idbRead();
     return {...outcome,badRefUnchanged,cancelledUnchanged,
      afterAccountSwitch:second.items.map(x=>({id:x.id,ownerId:x.ownerId})),
      currentOwner:window.closetAuth.user.id,currentScreenCount:document.getElementById('closetCount').textContent};
    },{ownerA,ownerB,jpeg});
    assert.deepEqual(result.mergedItems,[{id:'kept-original',ownerId:ownerA},{id:'new-top',ownerId:ownerA}]);
    assert.deepEqual(result.mergedLooks,['old-look','new-look']);
    assert.equal(result.boardTop,'new-top');
    assert.equal(result.savedBoardTop,'new-top');
    assert.equal(result.cloudRevision,6);assert.equal(result.cloudDirty,true);
    assert.equal(result.originalExists,true);assert.equal(result.newExists,true);
    assert.equal(result.cloudChanged,1);
    assert.match(result.notice,/imported atomically/i);
    assert.equal(result.screenCount,'2');
    assert.equal(result.badRefUnchanged,true);
    assert.equal(result.cancelledUnchanged,true);
    assert.deepEqual(result.afterAccountSwitch,[{id:'only-B',ownerId:ownerB}]);
    assert.equal(result.currentScreenCount,'1');
    assert.equal(result.currentOwner,ownerB);
    assert.equal(external.some(x=>x.method!=='GET'),false,'External write attempted');
    assert.equal(external.every(x=>x.blocked),true);
    cases.push({engine,width,legacyV3NativeAtomic:true,mergePreservesItems:true,
     looksOutfitsOneCommit:true,cloudRevisionAtomic:true,badRefRollback:true,
     cancellationPreserves:true,oldOwnerReject:true,nativeIndexedDB:true,
     syntheticOwners:true,hostedSupabase:false,physicalPhone:false});
   }finally{await context.close();await browser.close();}
  }
 }
 assert.equal(cases.length,6);assert.deepEqual(errors,[]);
 const receipt={kind:'mission3-legacy-atomic-import-browser',
  familyAlpha:'HOLD',realChromiumWebKit:true,nativeIndexedDB:true,
  hostedCloud:false,physicalDevices:false,cases,errors};
 const data=JSON.stringify(receipt,null,2)+'\n';
 await writeFile(resolve(output,'results.json'),data);
 await writeFile(resolve(output,'sha256.txt'),
  createHash('sha256').update(data).digest('hex')+'  results.json\n');
 console.log('PASS: six Chromium/WebKit native private multi-store atomic import and account switch cases');
}finally{server.close();}
