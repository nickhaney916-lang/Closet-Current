// Exercise the normal local owner UI with licensed, SHA-pinned originals and intercepted auth.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import {createHash} from 'node:crypto';

const root=resolve(process.argv[3]||'dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/public\/[a-zA-Z0-9_./-]+$/.test(path)||path.split('/').includes('..'))throw Error('forbidden path');
  const file=resolve(root,path.slice('/public/'.length)),bytes=await readFile(file);
  if(!file.startsWith(root+'/'))throw Error('outside public app');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port+'/public/index.html'; // P167 no research URL flags
const owner='synthetic-assignment-45-a', secondOwner='synthetic-assignment-45-b';
const specimens=[
 ['tee','Tops','T-shirt','Blue','commons-0001','Blue shirt']
];
const locks=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const fixtures=await Promise.all(specimens.map(async ([id,category,itemType,color,fixture,name])=>{
 const jpg=await readFile('benchmark/fixtures/'+fixture+'.jpg');
 const image='data:image/jpeg;base64,'+jpg.toString('base64');
 const sourceSHA256=createHash('sha256').update(jpg).digest('hex');
 const lock=locks.find(row=>row.id===fixture);
 assert.equal(lock?.verified,true);
 assert.ok(lock.attribution?.license);
 assert.equal(sourceSHA256,lock.sha256);
 return {id,ownerId:owner,name,category,itemType,color,colorSource:'user',
  image,originalPhoto:{image,sha256:sourceSHA256},sourceSHA256,sourceHashVerified:true,
  sourcePhotoOriginal:true,ownerReviewed:true,singleGarmentVerified:true,userAdjusted:true,pattern:'Solid',seasons:[],savedAt:'2026-11-24T00:00:00Z'};
}));
try{
 const engine=process.argv[2],type={chromium,webkit}[engine];
 assert.ok(type,'native engine required');
 const browser=await type.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const contexts=[];
   async function profile(id){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
    contexts.push(context);
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(['data:','blob:'].includes(url.protocol))return route.continue();
     if(url.hostname==='127.0.0.1')return url.pathname==='/public/sw.js'?route.abort():route.continue();
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token'){
      const payload=route.request().postDataJSON();
      if((payload.email?.split('@')[0]||payload.refresh_token)===id)return route.fulfill({status:200,json:{
       access_token:'test-'+id,refresh_token:id,expires_in:3600,user:{id,email:id+'@example.invalid'}
      }});
     }
     return route.abort();
    });
    await context.addInitScript(()=>{
     window.Worker=class {
      postMessage(data){if(data.type==='load')setTimeout(()=>this.onmessage?.({data:{id:data.id,type:'ready'}}),0);}
      terminate(){}
     };
    });
    const page=await context.newPage();
    page.setDefaultTimeout(12000);
    await page.goto(host);
    await page.locator('#authEmail').fill(id+'@example.invalid');
    await page.locator('#authPassword').fill('local synthetic fixture');
    await page.locator('#authSubmit').click();
    await ready(page,id);
    return {context,page};
   }
   async function ready(page,id){
    await page.waitForFunction(id=>db?.name==='closet-current-user-'+id&&boardInitialized&&document.getElementById('appShell')?.hidden===false,id);
   }
   const history={id:'outfit-wear-history-v1',owner,events:[{id:'wear-1',name:'Work',day:'2026-11-27',at:1795737600000,slots:{top:'previously-removed'}}]};
   try{
    const source=await profile(owner),dest=await profile(owner),foreign=await profile(secondOwner);
    const backup=await source.page.evaluate(async ({fixtures,history})=>{
     await writeAll(fixtures);items=(await readAll()).map(normalizeClothing);render();
     await writes;
     const {migrateOutfitOrganization}=await import('/public/outfit-organization.mjs');
     const current={name:'Saved',slots:{top:'tee'}};
     const board=migrateOutfitOrganization({id:'outfit-board',current,saved:[current]},history.owner);
     await new Promise((resolve,reject)=>{
      const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');
      store.put(board);store.put(history);
      tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
     });
     const {exportDurableOwnerBackupM3}=await import('/public/native-default-verified-backup-export-m3.mjs');
     const {exportOwnerWearSection}=await import('/public/outfit-wear-portability-transaction.mjs');
     const args={ownerDB:db,ownerId:history.owner,assertLease:()=>window.closetAuth.assertCurrent()};
     return {data:(await exportDurableOwnerBackupM3(args)).data,section:await exportOwnerWearSection(args),combined:(await exportDurableOwnerBackupM3({...args,researchWearV6:true})).data};
    },{fixtures,history});
    assert.equal(backup.data.version,5);
    // Actual normal wardrobe import on a separate browser profile.
    dest.page.once('dialog',dialog=>dialog.accept());
    await dest.page.locator('#import').setInputFiles({name:'wardrobe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup.data))});
    await dest.page.waitForFunction(()=>savedOutfitBoards.length===1);
    const baseline=await dest.page.evaluate(async()=>{
     const {exportOwnerWearSection}=await import('/public/outfit-wear-portability-transaction.mjs');
     return exportOwnerWearSection({ownerDB:db,ownerId:window.closetAuth.user.id,assertLease:()=>window.closetAuth.assertCurrent()});
    });
    assert.deepEqual(baseline.events,[]);
    console.log('A45 V5 OMISSION',engine,width);
    const denied=await foreign.page.evaluate(async section=>{
     const {prepareOwnerWearRestore}=await import('/public/outfit-wear-portability-transaction.mjs');
     try{await prepareOwnerWearRestore({ownerDB:db,ownerId:window.closetAuth.user.id,assertLease:()=>window.closetAuth.assertCurrent(),section});return false;}
     catch(e){return /foreign/.test(e.message);}
    },backup.section);
    assert.equal(denied,true);
    // Preload the module before cutting connectivity. The independent
    // research adapter is not a user-facing backup integration.
    await dest.page.evaluate(async()=>{window.a45=await import('/public/outfit-wear-portability-transaction.mjs');});
    await dest.context.setOffline(true);
    try{
     const result=await dest.page.evaluate(async section=>{
      const args={ownerDB:db,ownerId:window.closetAuth.user.id,assertLease:()=>window.closetAuth.assertCurrent()};
      const prepared=await a45.prepareOwnerWearRestore({...args,section});
      let rolledBack=false;
      try{await a45.commitOwnerWearRestore({...args,prepared,confirmed:true,onStage(){throw Error('injected');}});}catch(e){rolledBack=e.message==='injected';}
      const afterAbort=await a45.exportOwnerWearSection(args);
      await a45.commitOwnerWearRestore({...args,prepared,confirmed:true});
      const repeat=await a45.prepareOwnerWearRestore({...args,section});
      await a45.commitOwnerWearRestore({...args,prepared:repeat,confirmed:true});
      return {rolledBack,afterAbort:afterAbort.events,offline:!navigator.onLine,section:await a45.exportOwnerWearSection(args)};
     },backup.section);
     assert.deepEqual(result,{rolledBack:true,afterAbort:[],offline:true,section:backup.section});
    }finally{await dest.context.setOffline(false);}
    await dest.page.reload({waitUntil:'domcontentloaded'});await ready(dest.page,owner);
    const actual=await dest.page.evaluate(async()=>{
     const args={ownerDB:db,ownerId:window.closetAuth.user.id,assertLease:()=>window.closetAuth.assertCurrent()};
     const {exportOwnerWearSection}=await import('/public/outfit-wear-portability-transaction.mjs');
     const {exportDurableOwnerBackupM3}=await import('/public/native-default-verified-backup-export-m3.mjs');
     return {section:await exportOwnerWearSection(args),data:(await exportDurableOwnerBackupM3(args)).data};
    });
    assert.deepEqual(actual.section,backup.section);
    assert.deepEqual(actual.data.outfitBoard.saved,backup.data.outfitBoard.saved);
    assert.deepEqual(actual.data.outfitBoard.organization,backup.data.outfitBoard.organization);
    assert.equal(actual.data.items[0].originalPhoto.image,fixtures[0].originalPhoto.image);
    console.log('A45 NATIVE HISTORY PASS',engine,width,'separate profile, foreign refusal, rollback, offline restore, retry, reload, exact history and original');
    const combined=await profile(owner);
    assert.equal(backup.combined.version,6);
    const receipt=await combined.page.evaluate(async data=>{
     const {prepareDefaultAtomicM3,commitDefaultAtomicM3}=await import('/public/native-default-atomic-import-m3.mjs');
     const {exportOwnerWearSection}=await import('/public/outfit-wear-portability-transaction.mjs');
     const args={ownerDB:db,ownerId:window.closetAuth.user.id,assertLease:()=>window.closetAuth.assertCurrent(),normalizeClothing,validLook,cleanOutfitBoard,researchWearV6:true};
     const prepared=await prepareDefaultAtomicM3({...args,data});
     let rollback=false;
     try{await commitDefaultAtomicM3({...args,prepared,confirmed:true,onStage(){throw Error('combined abort');}});}catch(e){rollback=e.message==='combined abort';}
     const empty=await readAll(),history=await exportOwnerWearSection(args);
     await commitDefaultAtomicM3({...args,prepared,confirmed:true});
     return {rollback,empty:empty.length,history:history.events};
    },backup.combined);
    assert.deepEqual(receipt,{rollback:true,empty:0,history:[]});
    await combined.page.reload({waitUntil:'domcontentloaded'});await ready(combined.page,owner);
    const recovered=await combined.page.evaluate(async()=>{
     const {exportDurableOwnerBackupM3}=await import('/public/native-default-verified-backup-export-m3.mjs');
     return (await exportDurableOwnerBackupM3({ownerDB:db,ownerId:window.closetAuth.user.id,assertLease:()=>window.closetAuth.assertCurrent(),researchWearV6:true})).data;
    });
    assert.deepEqual(recovered.wearHistory,backup.combined.wearHistory);
    assert.deepEqual(recovered.outfitBoard.saved,backup.combined.outfitBoard.saved);
    assert.deepEqual(recovered.outfitBoard.organization,backup.combined.outfitBoard.organization);
    assert.equal(recovered.items[0].originalPhoto.image,fixtures[0].originalPhoto.image);
    console.log('A45 NATIVE COMBINED V6 PASS',engine,width);
   }finally{for(const context of contexts)await context.close();}
  }
 }finally{await browser.close();}
}finally{await new Promise(resolve=>server.close(resolve));}
