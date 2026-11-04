/**
 * BOARD04: genuine ORIGINAL native consumer Outfit Builder, not an overlay.
 * Real Chromium+WebKit mobile, actual public/auth.js and outfit-board.js;
 * only native Supabase HTTP auth *response* mocked. No live cloud access.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),dir='benchmark/native-consumer-board-04';
await mkdir(dir,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const rows=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const images={};
for(const id of ['commons-0053','commons-0003','commons-0021','commons-0064','commons-0067','commons-0080']){
 const row=rows.find(x=>x.id===id),bytes=await readFile('benchmark/fixtures/'+id+'.jpg');
 assert.ok(row?.verified&&row.sha256===sha(bytes));
 images[id]={image:'data:image/jpeg;base64,'+bytes.toString('base64'),hash:row.sha256};
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
  const path=resolve(root,'.'+u);
  if(!path.startsWith(root+'/'))throw Error('out of tree');
  const b=await readFile(path);
  res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(b);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const authHost='https://hlkgymugtfbirlpunsra.supabase.co';
let tokenCounter=0;
const blocked=[],cases=[],screens=[],errors=[];
const cloudStub=`window.closetCloud={start:async(_db,settings)=>{window.__native04CloudSettings=settings;},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};`;
const authResponse=(owner,token)=>({user:{id:owner,email:owner+'@example.test',
 user_metadata:{username:owner}},access_token:token,
 refresh_token:'refresh-'+owner,expires_in:3600});
async function authRoute(route){
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'){
  const data=JSON.parse(req.postData()||'{}'),grant=url.searchParams.get('grant_type');
  let owner;
  if(grant==='password'&&/^native04-[AB]@example\.test$/.test(data.email||'')){
   owner=data.email.split('@')[0];
  }else if(grant==='refresh_token'&&/^refresh-native04-[AB]$/.test(data.refresh_token||'')){
   owner=data.refresh_token.replace('refresh-','');
  }else return route.fulfill({status:401,contentType:'application/json',
   body:JSON.stringify({error_code:'invalid_credentials',msg:'Research auth fixture rejected'})});
  return route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify(authResponse(owner,'native04-token-'+owner+'-'+(++tokenCounter)))});
 }
 blocked.push({reason:'unmatched native HTTP auth route',method:req.method()});
 return route.abort();
}
const fixture=owner=>{
 const item=(name,category,itemType,pic)=>({
  id:owner+'-'+name,ownerId:owner,name,category,itemType,color:'Black',
  image:images[pic].image,sourceSHA256:images[pic].hash,
  originalPhoto:{image:images[pic].image,sha256:images[pic].hash}});
 const board={
  id:'outfit-board',current:{name:'Original CURRENT preserved',slots:{},futureCurrent:{keep:true}},
  saved:[
   {id:owner+'-outfit',outfit3dId:owner+'-original-3d',ownerId:owner,
    name:'Original dress + jacket and coat',layerCount:3,
    slots:{top:owner+'-dress',layer2:owner+'-jacket',
     layer3:owner+'-coat',shoes:owner+'-shoes'},
    slotSources:{top:{sha256:images['commons-0053'].hash,categoryAtSave:'Dresses'}},
    sourceHistory:{some:'original'},futureMetadata:{preserve:'yes'}},
   {id:owner+'-missing-outfit',outfit3dId:owner+'-missing-3d',ownerId:owner,
    name:'Missing pants remain',slots:{top:owner+'-shirt',bottom:owner+'-removed-jeans',shoes:owner+'-shoes'},
    futureMetadata:{preserve:'yes'}}
   ],futureBoardVersion:'DO_NOT_DROP'};
 return {
  items:[
   item('dress','Dresses','Casual dress','commons-0053'),
   item('jacket','Outerwear','Jacket','commons-0064'),
   item('coat','Outerwear','Coat','commons-0067'),
   item('shirt','Tops','T-shirt','commons-0003'),
   item('jeans','Bottoms','Jeans','commons-0021'),
   item('shoes','Shoes','Sneakers','commons-0080'),
   item('newshoes','Shoes','Sneakers','commons-0080')
  ],board};
};
const read=(page,id='outfit-board')=>page.evaluate(key=>new Promise((resolve,reject)=>{
 const r=db.transaction('state','readonly').objectStore('state').get(key);
 r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);
}),id);
async function screenshot(page,engine,width,owner,stage){
 const full=await page.screenshot({animations:'disabled',fullPage:false});
 const m=await sharp(full).metadata(),stat=await sharp(full).stats();
 assert.equal(m.width,width);assert.ok(m.height>=790&&full.length>4000);
 assert.ok(stat.channels.some(x=>x.stdev>6),'Rendered original app must not be blank');
 const name=engine+'-'+width+'-'+owner+'-'+stage+'.png';
 await writeFile(dir+'/'+name,full);
 screens.push({name,width,engine,owner,stage,sha256:sha(full)});
}
async function signIn(page,owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('Research-Only-No-Live-Password');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(x=>window.closetAuth?.user?.id===x&&
  document.getElementById('appShell')?.hidden===false,owner,{timeout:30000});
 await page.waitForFunction(x=>db?.name==='closet-current-user-'+x,owner,{timeout:30000});
}
async function seed(page,data){
 await page.evaluate(f=>new Promise((resolve,reject)=>{
  if(window.closetAuth?.user?.id!==f.items[0].ownerId)throw Error('cross-owner test seed blocked');
  const tx=db.transaction(['items','state'],'readwrite');
  for(const row of f.items)tx.objectStore('items').put(row);
  tx.objectStore('state').put(f.board);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('seed fail'));
 }),data);
}
async function gotoBuilder(page){
 await page.evaluate(()=>switchView('builder'));
 await page.waitForFunction(()=>document.getElementById('builder')?.hidden===false);
}
async function waitReady(page,owner){
 await page.waitForFunction(x=>window.nativeLossless04Bridge?.status()?.active&&
  window.closetAuth?.user?.id===x,owner,{timeout:30000});
 await page.waitForFunction(()=>document.querySelectorAll('#savedBoards button').length===2);
}
let browser;
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  browser=await browserType.launch({headless:true,args:engine==='chromium'?
   ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  for(const width of [320,390,430]){
   const ctx=await browser.newContext({viewport:{width,height:900},hasTouch:true,
    isMobile:true,deviceScaleFactor:1,serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
    const url=route.request().url(),path=new URL(url).pathname;
    if(path==='/public/cloud-backup.js')return route.fulfill({
     contentType:'text/javascript',body:cloudStub});
    if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'+host))return route.continue();
    if(url.startsWith(authHost+'/auth/v1/'))return authRoute(route);
    blocked.push({reason:'unknown external blocked',method:route.request().method()});
    return route.abort();
   });
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push({engine,width,message:e.message}));
   await page.goto(host+'/public/index.html?nativeLossless04=research',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.closetAuth?.ready);
   assert.equal(await page.locator('#authGate').isVisible(),true);
   await signIn(page,'native04-A');
   await seed(page,fixture('native04-A'));
   await page.reload({waitUntil:'domcontentloaded'});
   await waitReady(page,'native04-A');
   await gotoBuilder(page);
   const before=await read(page);
   assert.equal(before.saved.length,2);
   const baseline=await page.evaluate(()=>({
    board:window.nativeLossless04Bridge.readOnlySnapshot(),
    exposed:typeof window.nativeLossless04Bridge?.persist==='function',
    uiNewButton:!!document.getElementById('native04SaveChanges'),
    nativeAuthHasSyntheticEpoch:Object.hasOwn(window.closetAuth,'getSessionGeneration')
   }));
   assert.equal(baseline.exposed,true);assert.equal(baseline.uiNewButton,true);
   assert.equal(baseline.nativeAuthHasSyntheticEpoch,false);
   assert.deepEqual(baseline.board,before,'Exact native original stored state unchanged on login/view');
   await screenshot(page,engine,width,'A','01-original-consumer-outfit-builder');
   await page.locator('#savedBoards button').first().click();
   await page.waitForFunction(()=>document.getElementById('boardSummary')?.textContent.includes('4 of your own pieces'));
   assert.equal(await page.locator('#boardSlots .board-slot-layer2 img').count(),1);
   assert.equal(await page.locator('#boardSlots .board-slot-layer3 img').count(),1);
   assert.equal(await page.locator('#boardSlots .board-slot-shoes img').count(),1);
   assert.deepEqual(await read(page),before,'Saved open/render never rewrites original');
   const noAutoWrite=await read(page,'cloud-sync');
   assert.equal(noAutoWrite,null,'Opening or rendering original outfit never marks cloud dirty');
   await page.locator('#boardSlots .board-slot-shoes').click();
   await page.locator('#boardPickerItems button').filter({hasText:'newshoes'}).click();
   assert.equal(await page.locator('#boardSaveStatus').textContent().then(t=>t.includes('Unsaved change')),true);
   assert.deepEqual(await read(page),before,'Native picker changes draft only');
   assert.equal(await page.evaluate(()=>window.__native04CloudSettings?.canRestore()),false,
    'Cloud restore must pause while the consumer has an unsaved edit');
   await screenshot(page,engine,width,'A','02-unsaved-native-shoe-swap');
   await page.locator('#native04SaveChanges').click();
   await page.waitForFunction(()=>document.getElementById('boardSaveStatus')?.textContent.includes('Saved private outfit'));
   const changed=await read(page);
   assert.equal(changed.saved[0].slots.shoes,'native04-A-newshoes');
   assert.equal(changed.saved[0].slots.layer2,'native04-A-jacket');
   assert.equal(changed.saved[0].slots.layer3,'native04-A-coat');
   assert.equal(changed.saved[0].outfit3dId,'native04-A-original-3d');
   assert.deepEqual(changed.saved[0].futureMetadata,{preserve:'yes'});
   assert.deepEqual(changed.saved[1],before.saved[1]);
   assert.deepEqual(changed.current,before.current);
   assert.equal(changed.futureBoardVersion,'DO_NOT_DROP');
   const cloud=await read(page,'cloud-sync');
   assert.equal(cloud.dirty,true);assert.equal(cloud.localRevision,1);
   assert.equal(await page.evaluate(()=>window.__native04CloudSettings?.canRestore()),true);
   await screenshot(page,engine,width,'A','03-saved-all-original-dress-coat-shoes');
   // Explicit delete requires confirmation; cancel and save-as-new preserve original.
   await page.locator('#native04CancelChanges').click();
   assert.deepEqual(await read(page),changed,'Cancel cannot rewrite records');
   await page.locator('#saveBoard').click();
   await page.waitForFunction(()=>document.getElementById('savedBoards')?.querySelectorAll('button').length===3);
   const copied=await read(page);
   assert.equal(copied.saved.length,3);assert.deepEqual(copied.saved[0],changed.saved[0]);
   assert.ok(copied.saved[2].id!==copied.saved[0].id);
   assert.ok(copied.saved[2].outfit3dId!==copied.saved[0].outfit3dId);
   page.once('dialog',dialog=>dialog.dismiss());
   await page.locator('#native04DeleteOutfit').click();
   assert.deepEqual(await read(page),copied,'Declined delete must not change the outfit');
   // Detect external backup/cloud revision changes, do not overwrite.
   await page.evaluate(()=>new Promise((resolve,reject)=>{
    const tx=db.transaction('state','readwrite'),s=tx.objectStore('state'),r=s.get('cloud-sync');
    r.onsuccess=()=>s.put({...r.result,localRevision:r.result.localRevision+1});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   }));
   await page.locator('#boardName').fill('Should conflict, not overwrite');
   await page.locator('#boardName').dispatchEvent('change');
   await page.locator('#native04SaveChanges').click();
   await page.waitForFunction(()=>/CONFLICT/.test(document.getElementById('boardSaveStatus')?.textContent||''));
   assert.deepEqual(await read(page),copied,'Cloud conflict must preserve previous valid saved outfit');
   // Gated native JSON backup import refuses before any item/board write.
   const beforeImport=await read(page);
   await page.locator('#import').setInputFiles({
    name:'untrusted-import.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify({format:'closet-current',version:3,
     items:[{id:'should-not-write',name:'no'}],outfitBoard:{current:{slots:{}},saved:[]}}))
   });
   await page.waitForFunction(()=>document.getElementById('message')?.textContent?.includes('Import blocked')||
    [...document.querySelectorAll('[role=status]')].some(el=>el.textContent.includes('Import blocked')),
    null,{timeout:10000}).catch(()=>{});
   assert.deepEqual(await read(page),beforeImport,'Rejected backup cannot modify saved outfit');
   // Original B account: actual logout, then genuine new browser session.
   await page.locator('details.account-menu > summary').click();
   await page.locator('#logout').click();
   await page.waitForFunction(()=>window.closetAuth?.user===null&&
     document.getElementById('authGate')?.hidden===false);
   assert.equal(await page.locator('#boardSlots img').count(),0,'Logout must clear old private images');
   assert.equal(await page.evaluate(()=>window.__native04CloudSettings?.canRestore()),false,
    'Logged-out private owner cloud restore must also remain paused');
   await signIn(page,'native04-B');
   await seed(page,fixture('native04-B'));
   await page.reload({waitUntil:'domcontentloaded'});
   await waitReady(page,'native04-B');
   await gotoBuilder(page);
   const bBefore=await read(page);
   assert.equal(bBefore.saved[0].slots.layer2,'native04-B-jacket');
   assert.equal(bBefore.saved[0].slots.layer3,'native04-B-coat');
   assert.equal(await page.locator('#savedBoards').textContent().then(x=>x.includes('native04-A')),false);
   await page.locator('#savedBoards button').first().click();
   assert.equal(await page.locator('#boardSlots .board-slot-layer2 img').count(),1);
   assert.equal(await page.locator('#boardSlots .board-slot-layer3 img').count(),1);
   assert.deepEqual(await read(page),bBefore,'Owner B original data unchanged on open');
   await screenshot(page,engine,width,'B','04-owner-B-native-saved-dress-and-coat');
   await page.locator('#savedBoards button').nth(1).click();
   assert.equal(await page.locator('#boardSlots .board-slot-bottom').textContent().then(t=>t.includes('Missing saved clothing')),true);
   assert.deepEqual(await read(page),bBefore,'Missing saved clothing not erased on view');
   await screenshot(page,engine,width,'B','05-missing-original-reference-kept');
   const bRestore=await page.evaluate(()=>window.__native04CloudSettings?.canRestore());
   assert.equal(bRestore,true);
   cases.push({engine,width,actualNativeOutfitBuilder:true,
    actualNativeAuthSource:true,onlyAuthHTTPMocked:true,actualPrivateIndexedDB:true,
    originalJPEGSourceSHA:true,sourceTrueDressWithTwoOuterwear:true,
    savedAnd3DIDsPreserved:true,explicitCASWrite:true,
    readRenderCancelNoWrite:true,cloudRestorePausedDuringEdit:true,
    cloudRevisionConflictDetected:true,backupImportBlockedBeforeMutation:true,
    accountAtoBIsolation:true,missingItemIDPreserved:true,
    realLiveSupabaseRLS:false,physicalPhones:false,releaseAuthorized:false,familyAlpha:'HOLD'});
   await page.close();await ctx.close();
  }
  await browser.close();browser=null;
 }
 assert.equal(cases.length,6);assert.equal(screens.length,30);
 assert.deepEqual(errors,[]);
 assert.deepEqual(blocked.filter(x=>x.method!=='GET'),[]);
 for(const x of screens)assert.equal(sha(await readFile(dir+'/'+x.name)),x.sha256);
 for(const [key,proof]of Object.entries(images)){
  const bytes=await readFile('benchmark/fixtures/'+key+'.jpg');
  assert.equal(sha(bytes),proof.hash);
 }
 const result={priority:'NATIVE-CONSUMER-BOARD-04',cases:cases.length,
  screenshots:screens.length,engines:['chromium','webkit'],widths:[320,390,430],
  realNativeUI:true,syntheticAuthHTTPOnly:true,realOwnerIndexedDB:true,
  realCloudJWTs:false,originalPhotosUnchanged:true,productionDeployed:false,
  originalCleanerUnchanged:true,cloudWriteAPITested:false,
  releaseAuthorized:false,familyAlpha:'HOLD',
  evidence:cases,screens,errors,blocked};
 await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
 console.log('BOARD04_BROWSER_VERIFIED',JSON.stringify({cases:6,screens:30,
  actualNativeBuilder:true,losslessCAS:true,liveRLS:false,release:'HOLD'}));
}catch(error){
 await writeFile(dir+'/ERROR.json',JSON.stringify({
  message:String(error.stack||error),completedScreens:screens.length,errors,blocked},null,2));
 throw error;
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(ok));
}
