// P93 latest-M97 disposable native app: real v3 export->UI import of a
// SHA-bound large original JPEG. Uses only public JPEG + synthetic metadata,
// synthetic owner account; no genuine model, hosted keys or remote writes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const originBytes=await readFile('benchmark/fixtures/commons-0003.jpg');
assert(originBytes[0]===255&&originBytes[1]===216);
const chunks=[originBytes.subarray(0,2)];
for(let n=0;n<56;n++){
 const size=48000;
 chunks.push(Buffer.from([255,239,(size+2)>>8,(size+2)&255]),Buffer.alloc(size,n%197));
}
chunks.push(originBytes.subarray(2));
const full=Buffer.concat(chunks);
const originalJPEG='data:image/jpeg;base64,'+full.toString('base64');
const originalSHA=createHash('sha256').update(full).digest('hex');
assert(originalJPEG.length>3_000_000&&originalJPEG.length<11_200_000);
const previewJPEG='data:image/jpeg;base64,'+(await sharp({create:{
 width:160,height:160,channels:3,background:{r:88,g:125,b:189}
}}).jpeg().toBuffer()).toString('base64');
const output=resolve(process.argv[2]||'benchmark/parallel93-m97-large-original-browser');
await mkdir(output,{recursive:true});
const root=resolve('.'),pub=resolve('public');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const absolute=p.startsWith('/research/')?resolve(root,'.'+p):
   resolve(pub,'.'+(p==='/'?'/index.html':p));
  if(p.includes('\\')||
     (!absolute.startsWith(pub+'/')&&!absolute.startsWith(resolve(root,'research')+'/')))
   throw Error('Outside local source');
  const bytes=await readFile(absolute);
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('P93 source unavailable');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local='http://127.0.0.1:'+server.address().port;
const cases=[],errors=[];
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  for(const width of [320,390,430]){
   const owner='a'+width+'0000-0000-4000-8000-000000000000';
   const browser=await type.launch({headless:true,
    args:engine==='chromium'?['--no-sandbox']:[]});
   const context=await browser.newContext({viewport:{width,height:844},
    isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const outbound=[];
   try{
    await context.route('**/auth.js*',route=>route.fulfill({
     contentType:'text/javascript',
     body:"window.closetAuth={user:{id:'"+owner+
      "'},ready:Promise.resolve(),getAccessToken:async()=>'synthetic',assertCurrent:()=>{}};"+
      "document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
    }));
    await context.route('**/cloud-backup.js*',route=>route.fulfill({
     contentType:'text/javascript',
     body:"window.closetCloud={start:async()=>({started:true}),beforeWrite:async()=>{},changed:()=>{window.__p93CloudChanged=(window.__p93CloudChanged||0)+1;}};"
    }));
    await context.route('**/*',route=>{
     const url=new URL(route.request().url());
     if(['blob:','data:'].includes(url.protocol)||url.hostname==='127.0.0.1')
      return route.fallback();
     outbound.push({method:route.request().method(),blocked:true});
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
    page.on('pageerror',e=>errors.push({engine,width,kind:String(e.name||'page-error')}));
    await page.goto(local+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady,inspirationReady]));
    const result=await page.evaluate(async({owner,previewJPEG,originalJPEG,originalSHA})=>{
     const readRows=()=>new Promise((resolve,reject)=>{
      const tx=db.transaction(['items','state'],'readonly');
      const i=tx.objectStore('items').getAll(),s=tx.objectStore('state').getAll();
      tx.oncomplete=()=>resolve({items:i.result,state:s.result});
      tx.onerror=()=>reject(tx.error);
     });
     const update=({items,states,clear=false})=>new Promise((resolve,reject)=>{
      const tx=db.transaction(['items','state'],'readwrite');
      if(clear){tx.objectStore('items').clear();tx.objectStore('state').clear();}
      else{
       for(const row of items||[])tx.objectStore('items').put(row);
       for(const row of states||[])tx.objectStore('state').put(row);
      }
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     });
     const row=normalizeClothing({
      id:'p93-original',ownerId:owner,name:'Original photo',
      category:'Tops',itemType:'T-shirt',color:'Blue',colorSource:'user',
      image:previewJPEG,sourceSHA256:originalSHA,sourceHashVerified:true,
      originalPhoto:{image:originalJPEG,sha256:originalSHA,ownerId:owner}
     });
     const outfit={id:'outfit-board',current:{name:'Owner selected',
      slots:{top:'p93-original'}},saved:[{name:'Saved owned outfit',
      slots:{top:'p93-original'}}]};
     await update({items:[row],states:[outfit,
      {id:'cloud-sync',localRevision:3,baseVersion:1,baseDocument:null,dirty:false}]});
     items=(await readAllFrom(db)).map(normalizeClothing);
     await reloadCloudLooks();await reloadCloudBoard();render();
     // This is the exact native exporter imported by the real app's button.
     const {exportDurableOwnerBackupM3}=await import('./native-default-verified-backup-export-m3.mjs');
     const exported=await exportDurableOwnerBackupM3({ownerDB:db,ownerId:owner,
      assertLease:()=>{if(window.closetAuth?.user?.id!==owner)throw Error('owner revoked');},
      assertIdle:()=>{}});
     if(exported.data?.items?.[0]?.originalPhoto?.image!==originalJPEG||
        exported.data?.outfitBoard?.current?.slots?.top!=='p93-original')
      throw Error('Lossless original export invariant failed');
     // Now emulate a NEW, empty owner's device while retaining the same
     // cryptographically signed synthetic owner and app.
     await update({clear:true});
     const before=await readRows();
     window.confirm=()=>true;
     const payload=exported.json;
     await document.getElementById('import').onchange({target:{
      files:[{size:payload.length,text:async()=>payload}],value:'p93-selected-backup'}});
     const after=await readRows();
     const status=document.getElementById('message')?.textContent||'';
     const state=Object.fromEntries(after.state.map(x=>[x.id,x]));
     return {exportedSourceExact:exported.data.items[0].originalPhoto.image===originalJPEG,
      exportedOriginalHashExact:exported.data.items[0].sourceSHA256===originalSHA,
      exportedV3:exported.data.version===3,
      beforeEmpty:before.items.length===0,
      restoredOnlyOwnOriginal:after.items.length===1&&
       after.items[0].id==='p93-original'&&after.items[0].ownerId===owner,
      preservedOriginalBytes:after.items[0]?.originalPhoto?.image===originalJPEG,
      preservedSHA:after.items[0]?.sourceSHA256===originalSHA&&
       after.items[0]?.originalPhoto?.sha256===originalSHA,
      selectedBoardRecovered:state['outfit-board']?.current?.slots?.top==='p93-original'&&
       state['outfit-board']?.saved?.[0]?.slots?.top==='p93-original',
      cloudDirty:state['cloud-sync']?.dirty===true,
      cloudRevision:state['cloud-sync']?.localRevision,
      actualUIImport:status.includes('imported atomically'),
      cloudMarkerChanged:window.__p93CloudChanged||0};
    },{owner,previewJPEG,originalJPEG,originalSHA});
    for(const [field,value] of Object.entries(result)){
     if(['cloudRevision','cloudMarkerChanged'].includes(field))continue;
     assert.equal(value,true,engine+' width '+width+' lost native large original at '+field);
    }
    assert.equal(result.cloudRevision,1);
    assert.equal(result.cloudMarkerChanged,1);
    assert.deepEqual(errors,[],'Browser application errors');
    assert.equal(outbound.some(x=>x.method!=='GET'),false,
     'Unexpected non-local cloud or account write');
    cases.push({engine,width,actualNativeApp:true,
     originalEncodedLength:originalJPEG.length,canonicalOriginalSHAValid:true,
     exportImportLargeOriginalUI:true,losslessOriginal:true,
     ownerOriginalOutfitRecovered:true,sourceTo3DAllowed:false,
     realHostedJWT:false,modelAccuracyMeasured:false,physicalDevice:false});
   }finally{
    await context.close();await browser.close();
   }
  }
 }
 assert.equal(cases.length,6);
 const report={schema:'P93-M97-native-large-original-v3-recovery/v1',
  familyAlpha:'HOLD',sourcePhotoPublicSyntheticMetadata:true,
  exactSourceSHAVerified:true,releaseAuthorized:false,
  realBrowserEngines:['chromium','webkit'],cases,errors};
 await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log('P93 native >3M original-photo export/import UI PASS: 6/6 Chromium/WebKit 320/390/430; HOLD');
}finally{server.close();}
