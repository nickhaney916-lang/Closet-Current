/**
 * RESTORE01 authentic ORIGINAL HTML/auth/Outfit Builder mobile acceptance.
 * Supabase AUTH HTTP responses only are mocked; no real signed JWT/RLS.
 * Valid SHA-pinned licensed source JPEGs, real browser IndexedDB transaction.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const dir='benchmark/restore-atomic-01',root=resolve('.'),sha=x=>createHash('sha256').update(x).digest('hex');
await mkdir(dir,{recursive:true});
const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const images={};
for(const id of ['commons-0053','commons-0064','commons-0067','commons-0080']){
 const source=locked.find(x=>x.id===id),bytes=await readFile('benchmark/fixtures/'+id+'.jpg');
 assert.ok(source?.verified&&source.sha256===sha(bytes),'Original source must match locked provenance');
 images[id]={image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:source.sha256};
}
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.json':'application/json','.css':'text/css','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const u=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(!/^\/(public\/|research\/|node_modules\/)/.test(u)||
    u.includes('\\')||u.includes('\0')||u.split('/').includes('..'))
   throw Error('blocked path');
  const path=resolve(root,'.'+u);if(!path.startsWith(root+'/'))throw Error('blocked traversal');
  const bytes=await readFile(path);
  res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const authHost='https://hlkgymugtfbirlpunsra.supabase.co';
const cloudStub='window.closetCloud={start:async(_db,settings)=>{window.__RESTORE01Cloud=settings;},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
const screenshotRecords=[],cases=[],errors=[],external=[];
let tokenCounter=0;
async function authRoute(route){
 const req=route.request(),u=new URL(req.url());
 if(u.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(u.pathname==='/auth/v1/token'){
  const posted=JSON.parse(req.postData()||'{}'),grant=u.searchParams.get('grant_type');
  let owner=null;
  if(grant==='password'&&/^restore01-[AB]@example\.test$/.test(posted.email||''))
   owner=posted.email.split('@')[0];
  if(grant==='refresh_token'&&/^refresh-restore01-[AB]$/.test(posted.refresh_token||''))
   owner=posted.refresh_token.slice('refresh-'.length);
  if(!owner)return route.fulfill({status:401,contentType:'application/json',body:'{"error_code":"invalid_credentials"}'});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   user:{id:owner,email:owner+'@example.test',user_metadata:{username:owner}},
   access_token:'restore01-token-'+owner+'-'+(++tokenCounter),refresh_token:'refresh-'+owner,expires_in:3600
  })});
 }
 external.push({method:req.method(),reason:'unmatched auth request'});return route.abort();
}
const fixture=owner=>{
 const piece=(name,cat,type,id)=>({id:owner+'-'+name,ownerId:owner,
  name,category:cat,itemType:type,color:'Indigo',correctedCategory:true,
  image:images[id].image,sourceSHA256:images[id].sha256,
  originalPhoto:{image:images[id].image,sha256:images[id].sha256},
  futureTag:{doNotNormalize:'yes'}});
 return {
  items:[piece('dress','Dresses','Casual dress','commons-0053'),
   piece('jacket','Outerwear','Jacket','commons-0064'),
   piece('coat','Outerwear','Coat','commons-0067'),
   piece('shoes','Shoes','Sneakers','commons-0080')],
  board:{id:'outfit-board',futureBoard:{unrecognized:true},
   current:{name:'Original current preserved',slots:{},future:{yes:true}},
   saved:[{id:owner+'-outfit',outfit3dId:owner+'-outfit3d',ownerId:owner,
    name:'Dress jacket and coat',layerCount:3,
    slots:{top:owner+'-dress',layer2:owner+'-jacket',layer3:owner+'-coat',
     shoes:owner+'-shoes'},future:{futureId:'stay'}},
    {id:owner+'-missing',outfit3dId:owner+'-missing3d',ownerId:owner,
     name:'Missing jeans still referenced',
     slots:{top:owner+'-removed-shirt',bottom:owner+'-deleted-jeans'},
     future:{displayPhotoOnly:true}}]}
 };
};
async function signIn(page,owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('Synthetic-no-real-credentials-123');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&
  document.getElementById('appShell')?.hidden===false,owner);
 await page.waitForFunction(id=>typeof db!=='undefined'&&
  db?.name==='closet-current-user-'+id,owner);
}
async function seed(page,source){
 await page.evaluate(value=>new Promise((resolve,reject)=>{
  const tx=db.transaction(['items','state'],'readwrite');
  for(const item of value.items)tx.objectStore('items').put(item);
  tx.objectStore('state').put(value.board);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 }),source);
}
async function stored(page,store='items'){
 return page.evaluate(s=>new Promise((resolve,reject)=>{
  const tx=db.transaction(s,'readonly'),r=tx.objectStore(s).getAll();
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 }),store);
}
async function picture(page,engine,width,stage){
 if(stage==='01-before-saved-photo-outfit'||stage==='03-after-atomic-owner-restore')
  await page.locator('#outfitFigure').scrollIntoViewIfNeeded();
 if(stage==='04-missing-garment-ID-placeholder')
  await page.locator('#outfitFigure').scrollIntoViewIfNeeded();
 if(stage==='05-reopened-edited-and-saved')
  await page.locator('#savedBoards').scrollIntoViewIfNeeded();
 const bytes=await page.screenshot({animations:'disabled',fullPage:false});
 const m=await sharp(bytes).metadata(),stat=await sharp(bytes).stats();
 assert.equal(m.width,width);assert.ok(bytes.length>3500&&stat.channels.some(x=>x.stdev>5),
  'Real native viewport cannot be blank');
 const name=engine+'-'+width+'-'+stage+'.png';
 await writeFile(dir+'/'+name,bytes);
 screenshotRecords.push({engine,width,stage,name,sha256:sha(bytes)});
}
let browser;
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  browser=await type.launch({headless:true,args:engine==='chromium'?
   ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  for(const width of [320,390,430]){
   const ctx=await browser.newContext({viewport:{width,height:900},
    isMobile:true,hasTouch:true,deviceScaleFactor:1,acceptDownloads:true,serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
    const u=route.request().url(),path=new URL(u).pathname;
    if(path==='/public/cloud-backup.js')return route.fulfill({contentType:'text/javascript',body:cloudStub});
    if(u.startsWith(host+'/')||u.startsWith('data:')||u.startsWith('blob:'+host))return route.continue();
    if(u.startsWith(authHost+'/auth/v1/'))return authRoute(route);
    external.push({method:route.request().method(),reason:'blocked non-test request'});
    return route.abort();
   });
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push({engine,width,message:e.message}));
   await page.goto(host+'/public/index.html?nativeLossless04=research&restoreAtomic01=research');
   await signIn(page,'restore01-A');await seed(page,fixture('restore01-A'));
   await page.reload();
   await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active&&
    window.restoreAtomic01Bridge?.status()?.active,{timeout:30000});
   await page.evaluate(()=>switchView('builder'));
   await page.locator('#savedBoards button').first().click();
   await page.waitForFunction(()=>document.querySelectorAll('#boardSlots img').length>=3);
   await picture(page,engine,width,'01-before-saved-photo-outfit');
   const origBoard=(await stored(page,'state')).find(x=>x.id==='outfit-board');
   const origItems=await stored(page);
   assert.equal(origItems.length,4);assert.equal(origBoard.saved[0].outfit3dId,'restore01-A-outfit3d');
   const exportDiagnostic=await page.evaluate(async()=>{
    try{return {valid:!!(await window.restoreAtomic01Bridge.exportJSON()).data};}
    catch(e){return {error:String(e.message||e)};}
   });
   assert.deepEqual(exportDiagnostic,{valid:true},'Original browser backup validation must succeed');
   await page.evaluate(()=>switchView('closet'));
   await page.locator('details.closet-backup > summary').click();
   const downloadPromise=page.waitForEvent('download',{timeout:12000});
   await page.locator('#export').click();
   const download=await downloadPromise.catch(async e=>{
    throw Error('Native backup download unavailable: '+e+'; app status: '+
     await page.locator('#message').textContent());
   });
   // Download verification uses streaming fallback below for Node runtimes.
   const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);
   const backup=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   assert.equal(backup.version,4);assert.equal(backup.ownerId,'restore01-A');
   assert.deepEqual(backup.items,origItems);
   assert.deepEqual(backup.state['outfit-board'],origBoard);
   // Deliberate simulated local data loss prior to owner-authorized recovery.
   await page.evaluate(()=>new Promise((resolve,reject)=>{
    const tx=db.transaction(['items','state'],'readwrite');
    tx.objectStore('items').delete('restore01-A-coat');
    const b=tx.objectStore('state');const req=b.get('outfit-board');
    req.onsuccess=()=>b.put({...req.result,saved:[]});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   }));
   await page.evaluate(async()=>{items=(await readAll()).map(normalizeClothing);render();});
   await picture(page,engine,width,'02-before-recovery-storage-loss');
   const makeFile=o=>({name:'closet-v4.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(o))});
   const tampered=structuredClone(backup);tampered.items[0].originalPhoto.sha256='0'.repeat(64);
   await page.locator('#import').setInputFiles(makeFile(tampered));
   await page.waitForFunction(()=>document.getElementById('message')?.textContent?.includes('RESTORE01'));
   assert.equal((await stored(page)).length,3,'Invalid backup cannot mutate wardrobe');
   page.once('dialog',d=>d.dismiss());
   await page.locator('#import').setInputFiles(makeFile(backup));
   await page.waitForFunction(()=>document.getElementById('message')?.textContent?.includes('Restore canceled'));
   assert.equal((await stored(page)).length,3,'Cancel cannot mutate wardrobe');
   page.once('dialog',d=>d.accept());
   await page.locator('#import').setInputFiles(makeFile(backup));
   await page.waitForFunction(()=>items.length===4&&window.nativeLossless04Bridge?.status()?.active&&
    document.getElementById('message')?.textContent?.includes('restored together'));
   const after=await stored(page),afterBoard=(await stored(page,'state')).find(x=>x.id==='outfit-board');
   assert.deepEqual(after,origItems,'Each original JPEG and category correction must survive');
   assert.deepEqual(afterBoard,origBoard,'Original saved outfits and dangling references survive');
   await page.evaluate(()=>switchView('builder'));
   await page.locator('#savedBoards button').first().click();
   await picture(page,engine,width,'03-after-atomic-owner-restore');
   await page.locator('#savedBoards button').nth(1).click();
   await page.waitForFunction(()=>document.getElementById('boardSlots')?.textContent?.includes('Missing saved clothing'));
   assert.equal((await stored(page,'state')).find(x=>x.id==='outfit-board').saved[1].slots.bottom,
    'restore01-A-deleted-jeans','Temporarily missing garment reference must stay durable');
   await picture(page,engine,width,'04-missing-garment-ID-placeholder');
   await page.locator('#savedBoards button').first().click();
   await page.locator('#boardName').fill('Restored then edited');
   await page.locator('#boardName').dispatchEvent('change');
   await page.locator('#native04SaveChanges').click();
   await page.waitForFunction(()=>document.querySelector('#boardSaveStatus')?.textContent?.includes('Saved private outfit'));
   const changed=(await stored(page,'state')).find(x=>x.id==='outfit-board');
   assert.equal(changed.saved[0].name,'Restored then edited');
   assert.equal(changed.saved[0].slots.layer3,'restore01-A-coat');
   assert.equal(changed.saved[0].outfit3dId,'restore01-A-outfit3d');
   await picture(page,engine,width,'05-reopened-edited-and-saved');
   // Separate synthetic B cannot import A's owner-bound recovery.
   await page.locator('details.account-menu > summary').click();
   await page.locator('#logout').click();
   await page.waitForFunction(()=>document.getElementById('authGate')?.hidden===false);
   await signIn(page,'restore01-B');await seed(page,fixture('restore01-B'));
   await page.reload();await page.waitForFunction(()=>window.restoreAtomic01Bridge?.status()?.active);
   await page.evaluate(()=>switchView('closet'));
   await page.locator('details.closet-backup > summary').click();
   await page.locator('#import').setInputFiles(makeFile(backup));
   await page.waitForFunction(()=>document.getElementById('message')?.textContent?.includes('owner'));
   assert.deepEqual(await stored(page),fixture('restore01-B').items);
   cases.push({engine,width,originalJPEGs:4,screenshots:5,
    ownerAandBIsolated:true,originalPhotosUnchanged:true,
    savedOutfit3dIdRetained:true,dressJacketCoatRetained:true,
    missingReferencesRetained:true,actualNativeConsumer:true,
    atomicRestoreAndNativeEdit:true,realSignedCloudJWT:false,releaseAuthorized:false});
   await ctx.close();
  }
  await browser.close();browser=null;
 }
 assert.equal(cases.length,6);assert.equal(screenshotRecords.length,30);
 assert.deepEqual(errors,[]);assert.deepEqual(external.filter(x=>x.method!=='GET'),[]);
 for(const s of screenshotRecords)assert.equal(sha(await readFile(dir+'/'+s.name)),s.sha256);
 await writeFile(dir+'/results.json',JSON.stringify({
  priority:'RESTORE-ATOMIC-01',cases,imagesVerified:Object.keys(images).length,
  screenshots:screenshotRecords,errors,external,
  nativeChromiumWebKit:true,liveSignedRLS:false,physicalPhones:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 },null,2));
 console.log('RESTORE01_BROWSER',JSON.stringify({scenarios:6,screenshots:30,release:'HOLD'}));
}catch(e){
 await writeFile(dir+'/error.json',JSON.stringify({error:String(e.stack||e),
  screenshots:screenshotRecords.length,errors,external},null,2));
 throw e;
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
