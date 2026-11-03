/**
 * NATIVE-BOARD-HANDOFF-03 original native login and verified source / private
 * saved outfit cross-branch integration. REAL Chromium/WebKit page, IndexedDB,
 * authentic unchanged native public/auth.js; intercepted auth HTTP fixture only.
 * No live Supabase account, no release or staging claim.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),authdonor=resolve('.native03-auth-550'),
 donor=resolve('.native03-outfit-541'),dir='benchmark/native-board-handoff-03';
await mkdir(dir,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const sources={};
for(const id of ['commons-0053','commons-0003','commons-0021','commons-0064','commons-0067','commons-0080']){
 const row=manifest.find(x=>x.id===id),bytes=await readFile('benchmark/fixtures/'+id+'.jpg');
 assert.equal(row?.verified,true);assert.equal(row?.sha256,sha(bytes));
 assert.ok(row.attribution?.license&&row.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
 sources[id]={image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:row.sha256};
}
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png',
 '.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const u=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(public\/|research\/|authdonor\/|donor\/|node_modules\/)/.test(u)||
   u.includes('\\')||u.includes('\0')||u.split('/').includes('..'))
   throw Error('Invalid research path');
  const base=u.startsWith('/authdonor/')?authdonor:u.startsWith('/donor/')?donor:root;
  const sub=u.startsWith('/authdonor/')?u.slice(10):u.startsWith('/donor/')?u.slice(6):u;
  const file=resolve(base,'.'+sub);
  if(!file.startsWith(base+'/'))throw Error('Escaped research path');
  const b=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(b);
 }catch{res.writeHead(404);res.end('Research file not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const prodAuth='https://hlkgymugtfbirlpunsra.supabase.co';
let nextToken=0;
const blocked=[],errors=[],cases=[],screens=[],warnings=[];
const bodyFor=(id,token)=>({user:{id,email:id+'@example.test',
 user_metadata:{username:id}},access_token:token,
 refresh_token:'refresh-'+id,expires_in:3600});
async function fakeNativeHTTP(route){
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/auth/v1/logout')
  return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'&&req.method()==='POST'){
  const data=JSON.parse(req.postData()||'{}'),grant=url.searchParams.get('grant_type');
  let id=null;
  if(grant==='password'&&/^fixture-native-[AB]@example\.test$/.test(data.email||'')){
   id=data.email.split('@')[0];
  }else if(grant==='refresh_token'&&/^refresh-fixture-native-[AB]$/.test(data.refresh_token||'')){
   id=data.refresh_token.replace('refresh-','');
  }else return route.fulfill({status:401,contentType:'application/json',
   body:JSON.stringify({error_code:'invalid_credentials',msg:'Not an authorized test fixture'})});
  return route.fulfill({status:200,contentType:'application/json',
   body:JSON.stringify(bodyFor(id,'native03-token-'+id+'-'+(++nextToken)))});
 }
 blocked.push({method:req.method(),reason:'unexpected native auth route'});
 return route.abort();
}
function fixture(owner){
 const item=(name,category,itemType,photo)=>({
  id:owner+'-'+name,ownerId:owner,name,color:'Black',category,itemType,
  image:sources[photo].image,sourceSHA256:sources[photo].sha256,
  originalPhoto:{image:sources[photo].image,sha256:sources[photo].sha256}});
 return {
  items:[
   item('dress','Dresses','Casual dress','commons-0053'),
   item('jacket','Outerwear','Jacket','commons-0064'),
   item('coat','Outerwear','Coat','commons-0067'),
   item('shirt','Tops','T-shirt','commons-0003'),
   item('jeans','Bottoms','Jeans','commons-0021'),
   item('shoes','Shoes','Sneakers','commons-0080'),
   item('newshoes','Shoes','Sneakers','commons-0080')],
  state:{id:'outfit-board',current:{name:'Untouched native current',slots:{},future:{retained:true}},
   saved:[{id:owner+'-dress-outfit',outfit3dId:owner+'-3d-dress',ownerId:owner,
    name:'Original verified dress and coats',layerCount:3,
    slots:{top:owner+'-dress',layer2:owner+'-jacket',layer3:owner+'-coat',shoes:owner+'-shoes'},
    slotSources:{top:{sha256:sources['commons-0053'].sha256,categoryAtSave:'Dresses'}},
    futureMetadata:{mustPreserve:true}},
    {id:owner+'-missing-outfit',outfit3dId:owner+'-3d-missing',ownerId:owner,
     name:'Original saved missing jeans',slots:{top:owner+'-shirt',bottom:owner+'-missing-jeans',
       shoes:owner+'-shoes'},futureMetadata:{mustPreserve:true}}]}
 };
}
async function shot(page,engine,width,owner,stage){
 assert.equal(page.viewportSize().width,width);
 const png=await page.screenshot({fullPage:false,animations:'disabled'});
 const m=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(m.width,width);assert.ok(m.height>=760);assert.ok(png.length>3500);
 assert.ok(stats.channels.some(x=>x.stdev>6),'native page screenshot blank');
 const name=engine+'-'+width+'-'+owner+'-'+stage+'.png';
 await writeFile(dir+'/'+name,png);
 screens.push({name,engine,width,owner,stage,sha256:sha(png)});
}
async function signIn(page,owner){
 await page.locator('#authEmail').fill(owner+'@example.test');
 await page.locator('#authPassword').fill('native-research-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(id=>window.closetAuth?.user?.id===id&&
  document.getElementById('appShell')?.hidden===false,id,{timeout:25000});
 await page.waitForFunction(()=>typeof db!=='undefined'&&
  db?.name==='closet-current-user-'+window.closetAuth.user.id);
}
async function seed(page,data){
 return await page.evaluate(async fixture=>{
  const owner=window.closetAuth.user?.id;
  if(fixture.items.some(x=>x.ownerId!==owner)||
    fixture.state.saved.some(x=>x.ownerId!==owner))throw Error('Native owner mismatch while seeding');
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(['items','state'],'readwrite');
   const store=tx.objectStore('items');
   for(const row of fixture.items)store.put(row);
   tx.objectStore('state').put(fixture.state);
   tx.oncomplete=()=>resolve({owner,db:db.name});
   tx.onerror=()=>reject(tx.error);
  });
 },data);
}
const getStored=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const r=db.transaction('state','readonly').objectStore('state').get('outfit-board');
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
}));
async function mount(page){
 return await page.evaluate(async()=>{
  const {createNativeAuthEpoch01}=await import('/authdonor/research/auth-epoch-01/native-session-epoch.mjs');
  const {mountNativeBoardHandoff03}=await import('/research/native-board-handoff-03/native-board-handoff.mjs');
  const {decideOutfit3D01}=await import('/donor/research/outfit-3d-01/source-true-viewer.mjs');
  const original=window.closetAuth;
  window.__native03=await mountNativeBoardHandoff03({
   createNativeEpoch:opts=>{window.__native03Epoch=createNativeAuthEpoch01(opts);return window.__native03Epoch;},sourceHonest3DDecision:decideOutfit3D01});
  const ui=window.__native03;
  return {status:ui.status,nativeUnchanged:window.closetAuth===original,
   originalNativeNoSyntheticEpoch:!('getSessionGeneration' in original)};
 });
}
async function ownerAcceptance(page,owner){
 return await page.evaluate(async id=>{
  const handoff=window.__native03,e=handoff.editor;
  const source=e.list().find(x=>x.name==='Original verified dress and coats');
  if(!source)throw Error('Own saved outfit unavailable');
  const original=e.open(source.id),before=JSON.stringify(original.slots);
  if(original.slots.top!==id+'-dress'||original.slots.layer2!==id+'-jacket'||
   original.slots.layer3!==id+'-coat')throw Error('Original dress or coat lost');
  const raw=e.toPreview();
  if(raw.selected.some(x=>x.originalSHA256!==null))
   throw Error('Unverified JPEG pretending to be photo-true 3D');
  const verified=await e.toVerified3DPlan();
  const {decideOutfit3D01}=await import('/donor/research/outfit-3d-01/source-true-viewer.mjs');
  const decision=decideOutfit3D01(verified);
  if(decision.mode!=='dress'||!verified.originalJPEGsByteVerified||
     !decision.fallbackIds.includes(id+'-coat')||
     !decision.fallbackIds.includes(id+'-jacket')||
     !decision.fallbackIds.includes(original.slots.shoes))
    throw Error('3D decision lost owner photo or fabricated unsupported garment mesh');
  const missing=e.open(id+'-missing-outfit');
  if(missing.missing.length!==1||missing.missing[0].itemId!==id+'-missing-jeans')
    throw Error('Original deleted garment reference lost');
  e.open(source.id);
  const savedBefore=JSON.stringify(verified);
  return {owner:id,originalDressCoat:before,
    originalPhotoHashVerified:verified.originalJPEGsByteVerified,
    sourceHonestMode:decision.mode,fallbackCount:decision.fallbackIds.length,
    missingSavedId:missing.missing[0].itemId,
    noInMemoryRawSourceChange:savedBefore.length>0,
    originalNativeNoSyntheticEpoch:!('getSessionGeneration' in window.closetAuth),
    status:handoff.status};
 },owner);
}
let browser;
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  browser=await type.launch({headless:true,args:engine==='chromium'?
   ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  for(const width of [320,390,430]){
   const ctx=await browser.newContext({viewport:{width,height:900},isMobile:true,
    hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
   await ctx.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'+host))return route.continue();
    if(url.startsWith(prodAuth+'/auth/v1/'))return fakeNativeHTTP(route);
    blocked.push({method:route.request().method(),reason:'non-fixture external blocked'});
    return route.abort();
   });
   try{
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push({engine,width,error:e.message}));
    await page.goto(host+'/public/index.html?nativeBoardHandoff03=research&boardLossless02=research',
      {waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!window.closetAuth?.ready);
    assert.equal(await page.locator('#authGate').isVisible(),true);
    await shot(page,engine,width,'A','01-original-native-login');
    await signIn(page,'fixture-native-A');
    await seed(page,fixture('fixture-native-A'));
    const before=await getStored(page);
    assert.equal(before.saved[0].slots.layer2,'fixture-native-A-jacket');
    assert.equal(before.saved[0].slots.layer3,'fixture-native-A-coat');
    const nativeLoss=await page.evaluate(()=>{
     const state=window.__unused;
     return cleanOutfitBoard({name:'native loses jacket',
      slots:{top:'fixture-native-A-dress',
       layer2:'fixture-native-A-jacket',layer3:'fixture-native-A-coat'}},
       [{id:'fixture-native-A-dress',category:'Dresses'},
       {id:'fixture-native-A-jacket',category:'Outerwear',itemType:'Jacket'},
       {id:'fixture-native-A-coat',category:'Outerwear',itemType:'Coat'}]);
    });
    assert.equal(nativeLoss.slots.layer2,undefined);
    assert.equal(nativeLoss.slots.layer3,undefined);
    const aMount=await mount(page);
    assert.equal(aMount.nativeUnchanged,true);
    assert.equal(aMount.originalNativeNoSyntheticEpoch,true);
    assert.equal(aMount.status.active,true);
    const aPlan=await ownerAcceptance(page,'fixture-native-A');
    assert.equal(aPlan.sourceHonestMode,'dress');
    await page.evaluate(()=>{window.__native03.editor.open('fixture-native-A-dress-outfit');
      window.__native03.editor.setSlot('shoes','fixture-native-A-newshoes');});
    await shot(page,engine,width,'A','02-genuine-native-session-edit-draft');
    assert.deepEqual(await getStored(page),before,'Draft preview cannot mutate authenticated owner database');
    const saved=await page.evaluate(async()=>{
     const receipt=await window.__native03.editor.save();
     return {receipt,status:window.__native03.status};
    });
    assert.equal(saved.status.active,true);
    const after=await getStored(page);
    assert.equal(after.saved[0].slots.shoes,'fixture-native-A-newshoes');
    assert.equal(after.saved[0].slots.layer2,'fixture-native-A-jacket');
    assert.equal(after.saved[0].slots.layer3,'fixture-native-A-coat');
    assert.equal(after.saved[0].outfit3dId,'fixture-native-A-3d-dress');
    assert.deepEqual(after.saved[0].futureMetadata,{mustPreserve:true});
    assert.deepEqual(after.saved[1],before.saved[1]);
    await shot(page,engine,width,'A','03-saved-and-preserved-original');
    const refreshed=await page.evaluate(async()=>{
     await window.closetAuth.getAccessToken({force:true});
     return {status:window.__native03.status,
      imgCount:document.querySelectorAll('#board02Preview img').length,
      statusText:document.getElementById('boardLossless02Status')?.textContent};
    });
    assert.equal(refreshed.status.active,false,'Token rotation must invalidate privileged editor');
    assert.equal(refreshed.imgCount,0,'Logout/refresh must remove private thumbnails');
    assert.ok(/session changed|cleared/i.test(refreshed.statusText));
    const stale=await page.evaluate(()=>{
     try{window.__native03.editor.list();return false;}catch{return true;}
    });
    assert.equal(stale,true);
    assert.deepEqual(await getStored(page),after,'Revoked editor may not write owner state');
    await shot(page,engine,width,'A','04-refresh-revoked-private-panel');
    // After real browser reload, real native auth restores its rotated session.
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.closetAuth?.user?.id==='fixture-native-A'&&
      document.getElementById('appShell')?.hidden===false&&db?.name==='closet-current-user-fixture-native-A');
    assert.deepEqual(await getStored(page),after);
    await mount(page);
    const reopening=await ownerAcceptance(page,'fixture-native-A');
    assert.equal(reopening.owner,'fixture-native-A');
    await page.locator('#logout').click();
    await page.waitForFunction(()=>window.closetAuth?.user===null&&
      document.getElementById('authGate')?.hidden===false,{timeout:25000});
    assert.equal(await page.locator('#board02Preview img').count(),0);
    await signIn(page,'fixture-native-B');
    const bData=fixture('fixture-native-B');
    await seed(page,bData);
    const bBefore=await getStored(page);
    const bMount=await mount(page);
    assert.equal(bMount.status.active,true);
    const bPlan=await ownerAcceptance(page,'fixture-native-B');
    assert.equal(bPlan.missingSavedId,'fixture-native-B-missing-jeans');
    const crossOwnerDenied=await page.evaluate(async()=>{
     const {createExistingBoard02IO}=await import('/research/board-lossless-02/existing-idb-cas.mjs');
     const bridge=window.__native03Epoch;
     try{await createExistingBoard02IO(bridge.auth).read({authenticated:true,
      ownerId:'fixture-native-A',generation:bridge.auth.getSessionGeneration()});return false;}
     catch{return true;}
    });
    assert.equal(crossOwnerDenied,true);
    assert.deepEqual(await getStored(page),bBefore,'Reading B original photo may not mutate B stored state');
    await shot(page,engine,width,'B','05-independent-owner-B-with-originals');
    cases.push({engine,width,realNativeAuthSource:true,verifiedNativeHTTP:'MOCK_ONLY',
     independentOwnerFixtures:2,originalSourceSHA256:true,
     originalNativeStillLossy:true,losslessDraftNeverWritten:true,successfulCASWrite:true,
     originalSaved3DIDsAndCoatsPreserved:true,
     tokenRefreshRevokesPriorPrivatePreview:true,
     pageReloadNativeAuthSessionPersisted:true,
     accountSwitchAtoB:true,ownerBCannotReadOwnerA:true,
     donorSourceHonestFallback:true,privateJPEGHeadersNeverSentOffhost:true,
     realSupabaseRLS:'NOT VERIFIED',physicalPhones:'NOT TESTED',
     releaseAuthorized:false,familyAlpha:'HOLD'});
    await page.close();
   }finally{await ctx.close();}
  }
  await browser.close();browser=null;
 }
 assert.equal(cases.length,6);assert.equal(screens.length,30);
 assert.deepEqual(errors,[]);
 assert.deepEqual(blocked.filter(x=>x.method!=='GET'),[]);
 for(const shotInfo of screens)
  assert.equal(sha(await readFile(dir+'/'+shotInfo.name)),shotInfo.sha256);
 for(const [id,source]of Object.entries(sources)){
  assert.equal(sha(await readFile('benchmark/fixtures/'+id+'.jpg')),source.sha256);
 }
 const result={priority:'NATIVE-BOARD-HANDOFF-03',caseCount:cases.length,
  screenshotCount:screens.length,exactNativeApp:true,exactNativeAuthUnchanged:true,
  originalPhotoBytesPreserved:true,authHTTPMocked:true,
  actualBrowserStorage:true,authEpochFromExactPR550:true,
  losslessEditorFromExactPR552:true,sourceHonest3DDecisionFromExactPR541:true,
  actual3DMeshesRenderedInThisRun:false,
  accountTwoJWTLive:false,originalNativeEditorReplaced:false,
  environment:'ISOLATED RESEARCH ONLY',releaseAuthorized:false,familyAlpha:'HOLD',
  cases,screens,blocked,errors};
 await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
 console.log('NATIVE03 genuine native auth->lossless saved board',JSON.stringify({
  browserCases:6,originalSourceBrowserScreens:30,ownerSessionRevocation:true,
  originalNativeUnchanged:true,liveRLS:'NOT TESTED',familyAlpha:'HOLD'}));
}catch(e){
 await writeFile(dir+'/ERROR.json',JSON.stringify({
  type:e?.name||'Error',details:String(e?.stack||e),screens:screens.length,errors,blocked},null,2));
 throw e;
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
