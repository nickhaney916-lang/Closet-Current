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
const owner='synthetic-assignment-15-a', secondOwner='synthetic-assignment-15-b';
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
 const engines=[['chromium',chromium],['webkit',webkit]];
 for(const [engine,type] of engines){
  if(engine!==process.argv[2])continue;
  const browser=await type.launch({headless:true,executablePath:process.env.A44_BROWSER_EXECUTABLE});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(['data:','blob:'].includes(url.protocol))return route.continue();
     if(url.hostname==='127.0.0.1'){
      // Keep synthetic auth and exact built-app reloads on the intercepted
      // request path, as in Assignment 42. This is not offline/PWA acceptance.
      if(url.pathname==='/public/sw.js')return route.abort();
      return route.continue();
     }
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/logout')
      return route.fulfill({status:204});
     if(url.hostname==='hlkgymugtfbirlpunsra.supabase.co'&&url.pathname==='/auth/v1/token'){
      const payload=route.request().postDataJSON();
      const id=payload.email?.split('@')[0]||payload.refresh_token;
      if([owner,secondOwner].includes(id))return route.fulfill({status:200,json:{
       access_token:'test-'+id,refresh_token:id,expires_in:3600,user:{id,email:id+'@example.invalid'}
      }});
     }
     return route.abort();
    });
    await context.addInitScript(()=>{
     class ReviewOnlyWorker{
      constructor(){this.onmessage=null;this.terminated=false;}
      postMessage(data){const reply=value=>setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:data.id,...value}});},0);
       if(data.type==='load')reply({type:'ready'});
       else if(data.type==='classify')reply({type:'result',strong:false,categoryConfirmed:false,choices:[],details:{}});
      }
      terminate(){this.terminated=true;}
     }
     Object.defineProperty(window,'Worker',{configurable:true,value:ReviewOnlyWorker});
    });
    const page=await context.newPage();
    page.setDefaultTimeout(12000);
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    const signIn=async id=>{
     await page.locator('#authEmail').fill(id+'@example.invalid');
     await page.locator('#authPassword').fill('local synthetic fixture');
     await page.locator('#authSubmit').click();
     await page.waitForFunction(id=>db?.name==='closet-current-user-'+id&&boardInitialized,id);
    };
    const reloadSaved=async()=>{
     await page.reload({waitUntil:'domcontentloaded'});
     try{
      await page.waitForFunction(id=>typeof db!=='undefined'&&db?.name==='closet-current-user-'+id&&
       typeof boardInitialized!=='undefined'&&boardInitialized&&savedOutfitBoards.length===2&&
       document.getElementById('appShell')?.hidden===false,owner);
     }catch(error){
      const state=await page.evaluate(()=>({
       authGateHidden:document.getElementById('authGate')?.hidden,
       appShellHidden:document.getElementById('appShell')?.hidden,
       dbOpen:typeof db!=='undefined'&&!!db,
       boardReady:typeof boardInitialized!=='undefined'&&boardInitialized,
       savedCount:typeof savedOutfitBoards==='undefined'?null:savedOutfitBoards.length,
       serviceWorkerControlled:!!navigator.serviceWorker?.controller
      })).catch(()=>null);
      console.error('ASSIGNMENT44 RELOAD FAILURE',engine,width,process.argv[4]||'candidate',JSON.stringify(state),errors.join('\n'));
      throw error;
     }
    };
    const signOut=async()=>{
     await page.locator('.account-menu summary').click();
     await page.locator('#logout').click();
     await page.locator('#authGate').waitFor();
    };
    const builder=async()=>{
     await page.locator('#moreMenu summary').click();
     await page.locator('#moreMenu button[data-view=builder]').click();
    };

    try{
     await page.goto(host);
     await signIn(owner);
     await page.evaluate(async rows=>{
      await writeAll(rows);items=(await readAll()).map(normalizeClothing);render();
      const legacy={name:'Twin',slots:{top:'tee'},savedAt:'2026-11-26T00:00:00Z'};
      await new Promise((resolve,reject)=>{
       const tx=db.transaction('state','readwrite');
       tx.objectStore('state').put({id:'outfit-board',current:legacy,saved:[legacy,legacy]});
       tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
      });
     },fixtures);
     await reloadSaved();
     await builder();
     if(process.argv[4]==='baseline'){
      assert.equal(await page.evaluate(()=>typeof readSavedOutfitOrganization),'undefined');
      assert.deepEqual(await page.evaluate(()=>savedOutfitBoards.map(row=>row.savedOutfitId??null)),[null,null]);
      console.log('BASELINE',engine,width,'two identical appearances have no durable IDs');
      continue;
     }
     const first=await page.evaluate(async()=>{
      const start=performance.now();
      const {saved,organization,write}=await readSavedOutfitOrganization();
      const migrationMs=performance.now()-start;
      await write({...organization,favoriteOutfitIds:[saved[1].savedOutfitId],
       collections:[{id:crypto.randomUUID(),name:'Travel',garmentIds:['tee'],outfitIds:[saved[0].savedOutfitId]}]});
      return {saved,migrationMs};
     });
     const ids=first.saved.map(row=>row.savedOutfitId);
     assert.equal(new Set(ids).size,2);
     assert.equal(first.saved[1].savedAt,'2026-11-26T00:00:00Z');
     await reloadSaved();
     await builder();
     await page.locator('#savedBoards').getByRole('button',{name:'Twin',exact:true}).first().click();
     await page.locator('#boardName').fill('Renamed');
     await page.locator('#boardName').press('Tab');
     await page.evaluate(()=>writes);
     await page.locator('#updateSavedOutfit').click();
     await page.locator('#savedBoards').getByRole('button',{name:'Renamed',exact:true}).waitFor();
     assert.deepEqual(await page.evaluate(async()=>(await readSavedOutfitOrganization()).saved.map(row=>row.savedOutfitId)),ids);
     const data=await page.evaluate(async()=>{
      const {exportDurableOwnerBackupM3}=await import('/public/native-default-verified-backup-export-m3.mjs');
      return (await exportDurableOwnerBackupM3({ownerDB:db,ownerId:window.closetAuth.user.id,
       assertLease:()=>window.closetAuth.assertCurrent?.()})).data;
     });
     assert.equal(data.version,5);
     assert.equal(data.items[0].originalPhoto.image,fixtures[0].originalPhoto.image);
     assert.deepEqual(data.outfitBoard.organization.favoriteOutfitIds,[ids[1]]);
     await page.evaluate(async()=>{
      const a=await readSavedOutfitOrganization(), b=await readSavedOutfitOrganization();
      await a.write({...a.organization,collections:[]});
      try{await b.write(b.organization);}catch(error){
       if(error.message.includes('organization changed'))return;
       throw error;
      }
      throw Error('Stale organization write was admitted');
     });
     await page.locator('#savedBoards').getByRole('button',{name:'Twin',exact:true}).click();
     page.once('dialog',dialog=>dialog.accept());
     await page.locator('#removeSavedOutfit').click();
     await page.waitForFunction(()=>savedOutfitBoards.length===1);
     const afterRemove=await page.evaluate(async()=>{const {saved,organization}=await readSavedOutfitOrganization();return {ids:saved.map(row=>row.savedOutfitId),favorites:organization.favoriteOutfitIds};});
     assert.deepEqual(afterRemove.ids,[ids[0]],'the intended outfit survives deletion of its twin');
     assert.deepEqual(afterRemove.favorites,[]);
     page.once('dialog',dialog=>dialog.accept());
     await page.locator('#import').setInputFiles({name:'wardrobe.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(data))});
     await page.waitForFunction(()=>savedOutfitBoards.length===2);
     assert.deepEqual(await page.evaluate(async()=>(await readSavedOutfitOrganization()).saved.map(row=>row.savedOutfitId)),ids);
     // Exercise the loaded app's local organization transaction during a
     // genuine browser network interruption. Service-worker navigation while
     // offline is intentionally outside this synthetic-auth fixture.
     await context.setOffline(true);
     try{
      assert.equal(await page.evaluate(()=>navigator.onLine),false);
      await page.evaluate(async()=>{
       const snapshot=await readSavedOutfitOrganization();
       await snapshot.write({...snapshot.organization,favoriteOutfitIds:[]});
      });
      const offline=await page.evaluate(async()=>{
       const {saved,organization}=await readSavedOutfitOrganization();
       return {ids:saved.map(row=>row.savedOutfitId),favorites:organization.favoriteOutfitIds};
      });
      assert.deepEqual(offline.ids,ids);
      assert.deepEqual(offline.favorites,[]);
     }finally{await context.setOffline(false);}
     await reloadSaved();
     assert.deepEqual(await page.evaluate(async()=>{
      const {saved,organization}=await readSavedOutfitOrganization();
      return {ids:saved.map(row=>row.savedOutfitId),favorites:organization.favoriteOutfitIds};
     }),{ids,favorites:[]});
     console.log('OFFLINE-RECONNECT PASS',engine,width);
     await signOut();
     await signIn(secondOwner);
     assert.equal(await page.evaluate(async()=>(await readSavedOutfitOrganization()).saved.length),0);
     assert.equal(errors.length,0,errors.join('\n'));
     console.log('PASS',engine,width,'legacy migration, reload, rename, organize, export, delete, restore, owner switch',first.migrationMs.toFixed(2)+' ms');
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
