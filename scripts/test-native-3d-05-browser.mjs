/** NATIVE-3D-05 genuine original native Outfit Builder → pinned unchanged
 * PR541 anatomical 163-bone WebGL, source-true photographed original JPEG,
 * outfit owner / source SHA / dress jacket coat photo-fallback, no writes.
 * The Supabase auth *HTTP responses* are synthetic. Real RLS NOT verified.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const photoSilhouette62=process.env.PHOTO_SILHOUETTE62==='1';
const photoShoulder185=process.env.PHOTO_SHOULDER185==='1';
const photoOwnerCutout186=process.env.PHOTO_OWNER_CUTOUT186==='1';
const photoPreflight187=process.env.PHOTO_CUTOUT_PREFLIGHT187==='1';
const photoOwnerPositive188=process.env.PHOTO_OWNER_POSITIVE188==='1';
const photoOwnerAlpha189=process.env.PHOTO_OWNER_ALPHA189==='1';
const photoOwnerGeometry190=process.env.PHOTO_OWNER_GEOMETRY190==='1';
if(photoOwnerGeometry190&&!photoOwnerAlpha189)
 throw Error('P190 actual owner contour geometry requires P189 independently SHA-verified private PNG');
if(photoOwnerAlpha189&&!photoOwnerPositive188)
 throw Error('P189 requires P188 owner private JPEG, P187 double-hash preflight and P186 review');
if(photoOwnerPositive188&&(!photoPreflight187||!photoOwnerCutout186))
 throw Error('P188 requires P187 pre-WebGL and P186 double-JPEG review enforcement');
if(photoPreflight187&&!photoOwnerCutout186)throw Error('P187 must retain the real P186 reviewed JPEG byte-proof admission');
if(photoOwnerCutout186&&!photoShoulder185)throw Error('P186 requires genuine P185 physical source geometry');
if(photoShoulder185&&!photoSilhouette62)throw Error('P185 requires actual P62 original photographic source checks');
const photoSilhouetteEngine62=process.env.PHOTO_SILHOUETTE62_BROWSER||'chromium';
const root=resolve('.'),donor=resolve(photoSilhouette62?'.donor541':'.native05-donor-541');
const dir=photoSilhouette62?'benchmark/user-photo-to-anatomical-3d-62/'+photoSilhouetteEngine62:'benchmark/native-3d-05';
await mkdir(dir,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const locks=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const ids=['commons-0053','commons-0064','commons-0067','commons-0080','commons-0003','commons-0016'];
const photos={};
for(const id of ids){
 const locked=locks.find(x=>x.id===id),bytes=await readFile('benchmark/fixtures/'+id+'.jpg');
 assert.ok(locked?.verified&&locked.sha256===digest(bytes)&&
  locked.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
 photos[id]={image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:locked.sha256};
}
let ownerCutout188=null,ownerAlpha189=null;
if(photoOwnerPositive188){
 // Licensed Work47 alpha cutout is converted to a genuine JPEG with distinct
 // SHA; this is a SYNTHETIC owner-review fixture, NOT an independently
 // witnessed real human decision or an owner-generated segmentation mask.
 const png=await readFile(donor+'/benchmark/work47/assets/commons-0016.png');
 const jpeg=await sharp(png).flatten({background:'#f8f8f8'})
  .jpeg({quality:92}).toBuffer();
 ownerCutout188={image:'data:image/jpeg;base64,'+jpeg.toString('base64'),
  sha256:digest(jpeg),sourceMaskPNGFromWork47:true,simulatedOwnerReview:true};
 assert.notEqual(ownerCutout188.sha256,photos['commons-0016'].sha256);
 if(photoOwnerAlpha189){
  // Deliberately synthetic owner-ASSERTED mask: a distinct real RGBA PNG
  // built from the public fixture for regression. It is NOT independent
  // owner photo segmentation or witnessed manual review.
  const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.channels,4);
  if(photoOwnerGeometry190){
   // Synthetic owner assertion: trim licensed mask edges 3-5%, not family photography.
   for(let y=0;y<info.height;y++){
    let left=info.width,right=-1;
    for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=160){
     left=Math.min(left,x);right=Math.max(right,x);
    }
    if(right-left<info.width*.10)continue;
    const trim=Math.max(2,Math.round((right-left)*(.025+.012*Math.sin(Math.PI*y/info.height))));
    for(let x=left;x<left+trim;x++)data[(y*info.width+x)*4+3]=0;
    for(let x=right-trim+1;x<=right;x++)data[(y*info.width+x)*4+3]=0;
   }
  }
  for(let i=3;i<data.length;i+=4)if(data[i]>0)data[i]=Math.round(data[i]*.91);
  const maskBytes=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}})
   .png({compressionLevel:9}).toBuffer();
  ownerAlpha189={image:'data:image/png;base64,'+maskBytes.toString('base64'),
   sha256:digest(maskBytes),simulatedOwnerMask:true,realRGBA:true};
  assert.notEqual(ownerAlpha189.sha256,ownerCutout188.sha256);
 }
}
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.json':'application/json','.css':'text/css','.glb':'model/gltf-binary',
 '.jpg':'image/jpeg','.png':'image/png','.bin':'application/octet-stream',
 '.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path.includes('\\')||path.includes('\0')||path.split('/').includes('..')||
    !/^\/(public\/|research\/|donor\/|benchmark\/|node_modules\/)/.test(path))
   throw Error('Unsafe test path');
  const fromDonor=path.startsWith('/donor/')||path.startsWith('/benchmark/');
  const base=fromDonor?donor:root;
  const sub=path.startsWith('/donor/')?path.slice(6):path;
  const target=resolve(base,'.'+sub);
  if(!target.startsWith(base+'/'))throw Error('Outside research');
  const bytes=await readFile(target);
  res.writeHead(200,{'content-type':types[extname(target)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const authOrigin='https://hlkgymugtfbirlpunsra.supabase.co';
let browser=null;
const external=[],errors=[],cases=[],screens=[],navigations=[],crashes=[];
let tokenCount=0;
const native88=process.env.NATIVE88==='1';
const native89=process.env.NATIVE89==='1';
const native91=process.env.NATIVE91==='1';
const native92=process.env.NATIVE92==='1';
const native93=process.env.NATIVE93==='1';
const native102=process.env.NATIVE102==='1';
const photoFit171=process.env.PHOTO_FIT171==='1';
const photoTorso173=process.env.PHOTO_TORSO173==='1';
const photoSleeve174=process.env.PHOTO_SLEEVE174==='1';
const photoDress175=process.env.PHOTO_DRESS175==='1';
const cloudStub="window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};";
function fixture(owner){
 const item=(label,cat,subtype,pic)=>({
  id:owner+'-'+label,ownerId:owner,name:'Saved '+label,
  category:cat,itemType:subtype,color:'Black',colorSource:'user',
  userAdjusted:true,requiresOwnershipConfirmation:false,
  possibleDuplicate:false,sourceSHA256:photos[pic].sha256,
  sourceHashVerified:true,singleGarmentVerified:true,
  originalPhoto:{image:photos[pic].image,sha256:photos[pic].sha256},
  image:photos[pic].image,seasons:[],notes:'',brand:'',size:'',material:'',occasion:'',
  ...(photoOwnerPositive188&&pic==='commons-0016'?{
   sourceId:'commons-0016',ownerReviewed:true,humanReviewedSource:true,
   reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
   cutoutSHA256:ownerCutout188.sha256,
   segmentHint:{verified:true,ownerReviewedInstance:true,
    originalSHA256:photos[pic].sha256,cutoutSHA256:ownerCutout188.sha256,
    cutoutImage:ownerCutout188.image,
    ...(photoOwnerAlpha189?{
     ownerAlphaPNG189:ownerAlpha189.image,
     ownerAlphaSHA256189:ownerAlpha189.sha256,
     ownerAlphaOwnerId189:owner,
     ownerAlphaSourceId189:'commons-0016',
     ownerAlphaReviewState189:'owner-asserted-reviewed-not-independently-witnessed'
    }:{})}
  }:{})
 });
 return {
  items:[
   item('dress','Dresses','Casual dress','commons-0053'),
   item('jacket','Outerwear','Jacket','commons-0064'),
   item('coat','Outerwear','Coat','commons-0067'),
   item('shoes','Shoes','Sneakers','commons-0080'),
   item('shirt','Tops','T-shirt','commons-0003'),
   item('blouse','Tops','Blouse','commons-0016')],
  state:{id:'outfit-board',current:{name:'Existing current',slots:{},future:{preserve:true}},
   saved:[
    {id:owner+'-dress-saved',outfit3dId:owner+'-verified-dress-3D',
     ownerId:owner,name:'Source-true dress and coat',
     layerCount:3,slots:{top:owner+'-dress',layer2:owner+'-jacket',
      layer3:owner+'-coat',shoes:owner+'-shoes'},
     extraOriginalMetadata:{keep:true},futureSourceKeys:{ver:1}},
    {id:owner+'-missing-saved',outfit3dId:owner+'-missing-3D',
     ownerId:owner,name:'Missing lower garment',
     slots:{top:owner+'-shirt',bottom:owner+'-lost-denim',shoes:owner+'-shoes'},
     futureSourceKeys:{ver:2}},
    {id:owner+'-shirt-saved',outfit3dId:owner+'-verified-shirt-3D',
     ownerId:owner,name:'Source-true original photographed shirt',
     slots:{top:owner+'-shirt'},futureSourceKeys:{ver:3}},
    {id:owner+'-blouse-saved',outfit3dId:owner+'-verified-blouse-3D',
     ownerId:owner,name:'Provisional original blouse photo · review pending',
     slots:{top:owner+'-blouse'},futureSourceKeys:{ver:4}}],
   futureBoardVersion:'never-drop'}
 };
}
const readBoard=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const r=db.transaction('state','readonly').objectStore('state').get('outfit-board');
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
}));
async function login(page,id){
 await page.locator('#authEmail').fill(id+'@example.test');
 await page.locator('#authPassword').fill('research-fixture-only');
 await page.locator('#authSubmit').click();
 await page.waitForFunction(owner=>window.closetAuth?.user?.id===owner&&
   document.getElementById('appShell')?.hidden===false, id,{timeout:30000});
 await page.waitForFunction(owner=>db?.name==='closet-current-user-'+owner,id);
}
async function seed(page,owner){
 await page.evaluate(data=>new Promise((resolve,reject)=>{
  const tx=db.transaction(['state','items'],'readwrite');
  for(const item of data.items)tx.objectStore('items').put(item);
  tx.objectStore('state').put(data.state);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
 }),fixture(owner));
}
async function take(page,width,stage){
 const png=await page.screenshot({fullPage:false,animations:'disabled'});
 const meta=await sharp(png).metadata(),stat=await sharp(png).stats();
 assert.equal(meta.width,width);assert.ok(meta.height>=880&&png.length>4500);
 assert.ok(stat.channels.some(x=>x.stdev>7),'Actual mobile canvas/image blank');
 const name=(photoSilhouette62?photoSilhouetteEngine62:'chromium')+'-'+width+'-'+stage+'.png';
 await writeFile(dir+'/'+name,png);
 screens.push({name,width,stage,sha256:digest(png)});
}
function authHttp(route){
 const req=route.request(),u=new URL(req.url());
 if(u.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(u.pathname==='/auth/v1/token'){
  const d=JSON.parse(req.postData()||'{}'),grant=u.searchParams.get('grant_type');
  let owner;
  if(grant==='password'&&/^native05-[AB]@example\.test$/.test(d.email||'')){
   owner=d.email.split('@')[0];
  }else if(grant==='refresh_token'&&/^refresh-native05-[AB]$/.test(d.refresh_token||'')){
   owner=d.refresh_token.slice(8);
  }else return route.fulfill({status:401,contentType:'application/json',
    body:JSON.stringify({error_code:'invalid_credentials',msg:'No approved fixture'})});
  const data={user:{id:owner,email:owner+'@example.test'},
   access_token:'research-native05-token-'+owner+'-'+(++tokenCount),
   refresh_token:'refresh-'+owner,expires_in:3600};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 }
 external.push({kind:'unrecognized-auth',method:req.method()});return route.abort();
}
try{
 for(const width of [320,390,430]){
  // A fresh Chromium/GPU process per real WebGL width avoids stale prior
  // 163-bone canvas contexts, renderer memory and stale browser navigation.
  const browserEngine=photoSilhouette62&&photoSilhouetteEngine62==='webkit'?webkit:chromium;
  browser=await browserEngine.launch({headless:true,
   ...(photoSilhouette62&&photoSilhouetteEngine62==='chromium'&&process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),
   ...(browserEngine===chromium?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})});
  const ctx=await browser.newContext({viewport:{width,height:920},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.route('**/*',route=>{
   const u=route.request().url(),path=new URL(u).pathname;
   if(path==='/public/cloud-backup.js')return route.fulfill({
     contentType:'text/javascript',body:cloudStub});
   if(u.startsWith(origin+'/')||u.startsWith('data:')||u.startsWith('blob:'+origin))
    return route.continue();
   if(u.startsWith(authOrigin+'/auth/v1/'))return authHttp(route);
   external.push({kind:'unexpected-external',method:route.request().method(),
    host:new URL(u).hostname});
   return route.abort();
  });
  const page=await ctx.newPage();
  let donorRequests187=0;
  if(photoPreflight187)page.on('request',r=>{
   if(new URL(r.url()).pathname.startsWith('/donor/'))donorRequests187++;
  });
  page.on('pageerror',e=>errors.push({width,message:e.message}));
  page.on('framenavigated',f=>{if(f===page.mainFrame())
   navigations.push({width,path:new URL(f.url()).pathname,query:new URL(f.url()).search});});
  page.on('crash',()=>crashes.push({width,kind:'renderer-crash'}));
  await page.goto(origin+'/public/index.html?nativeLossless04=research&native3D05=research'+(photoFit171?'&photoFit171=research':'')+(photoTorso173?'&photoTorso173=research':'')+(photoSleeve174?'&photoSleeve174=research':'')+(photoDress175?'&photoDress175=research':'')+(photoSilhouette62?'&photoSilhouette62=research':'')+(photoShoulder185?'&photoShoulder185=research':'')+(photoOwnerCutout186?'&photoOwnerCutout186=research':'')+(photoPreflight187?'&photoOwnerCutout187=research':'')+(photoOwnerPositive188?'&photoOwnerPositive188=research':'')+(photoOwnerAlpha189?'&photoOwnerAlpha189=research':'')+(photoOwnerGeometry190?'&photoOwnerGeometry190=research':''),
    {waitUntil:'domcontentloaded'});
  await login(page,'native05-A');
  await seed(page,'native05-A');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active&&
   !!window.native3D05Bridge,{timeout:30000});
  await page.evaluate(()=>switchView('builder'));
  await page.waitForFunction(()=>document.getElementById('builder')?.hidden===false);
  assert.equal(await page.locator('#native3D05Preview').isVisible(),true);
  const ownerOriginal=await readBoard(page);
  await take(page,width,'01-original-native-builder');
  // A clicked original saved outfit rather than donor-created selection.
  await page.locator('#savedBoards button').first().click();
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),0);
  if(photoSilhouette62){
   await page.locator('#savedBoards button').nth(3).click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),3);
   // Do not swallow the user's actual button error then wait 150 seconds
   // for a 3D that never opened. Invoke the SAME existing native open method,
   // capture its real cause and fail this evidence gate immediately.
   const openProof=await page.evaluate(async()=>{
    try{return {ok:true,result:await window.native3D05Bridge.open()};}
    catch(e){return {ok:false,error:String(e?.stack||e),
     nativeStatus:document.getElementById('native3D05Status')?.textContent,
     viewerStatus:document.getElementById('outfit3D01Status')?.textContent,
     state:window.native3D05Bridge?.state()};}
   });
   if(photoOwnerCutout186&&!photoOwnerPositive188){
    assert.equal(openProof.ok,false,
     'P186 unreviewed provisional cutout must NEVER be promoted to an owner-approved 3D preview');
    if(photoPreflight187){
     assert.match([openProof.error,openProof.nativeStatus].join(' '),/P187/,
      'Pre-WebGL owner-cutout rejection must have a specific, sanitized denial');
     assert.equal(donorRequests187,0,
      'P187 must NOT even import the real donor before owner review SHA proof');
     assert.equal(await page.locator('#outfit3D01Dialog').count(),0,
      'P187 no unapproved garment 3D donor/dialog ever created');
     assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
    }
    assert.match([openProof.error,openProof.nativeStatus,openProof.viewerStatus].join(' '),photoPreflight187?/P187/i:/P186/i,
     'Engine-independent proof must expose an explicit refused owner-cutout review');
    const unsafe=await page.evaluate(()=>window.native3D05Bridge.state());
    assert.equal(unsafe.active,false,'P186 must destroy provisional private 3D scene');
    assert.equal(unsafe.photoOwnerCutout186,false);
    assert.deepEqual(await readBoard(page),ownerOriginal,
     'P186 fallback must never erase, save, or rewrite owner outfit');
    await take(page,width,photoPreflight187?'02-pre-webgl-unreviewed-owner-cutout-2d-fallback':'02-provisional-cutout-review-required-2d-fallback');
    cases.push({width,provisionalBlouseOwnerCutoutReviewRejected186:true,
     ...(photoPreflight187?{actualDonorImports187:donorRequests187,
      preWebGLReviewDenial187:true,unreviewed3DSceneNeverCreated187:true,
      legacyP186FallbackStillProtected:true}:{}),
     originalPhotoFallbackPreserved:true,source3DVisibilityRevoked:true,
     ownerWardrobeUntouched:true,physicalPhoneApproved:false,
     arbitraryOwnerPhoto3DApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'});
    await page.close();await ctx.close();await browser.close();browser=null;
    continue;
   }
   assert.equal(openProof.ok,true,'P183 actual owner saved photo 3D open rejected: '+JSON.stringify(openProof));
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
    window.native3D05Bridge.state().viewerMode==='shirt'&&
    window.native3D05Bridge.state().photoSourceSilhouette62===true&&
    window.native3D05Bridge.state().bones===163,null,{timeout:15000});
   const blouseState=await page.evaluate(()=>window.native3D05Bridge.state());
   assert.equal(blouseState.opened,'native05-A-verified-blouse-3D');
   assert.ok(blouseState.silhouetteVertices62>=20);
   assert.ok(blouseState.silhouetteMaxMeters62>=.001&&blouseState.silhouetteMaxMeters62<=.0251);
   assert.equal(blouseState.photoSourceFit171,true);
   assert.equal(blouseState.ownerPhoto3DArbitraryFittingApproved,false);
   assert.equal(blouseState.photorealismApproved,false);
   if(photoOwnerPositive188){
    assert.equal(blouseState.photoOwnerCutout186,true);
    assert.equal(blouseState.photoOwnerCutout187,true);
    assert.equal(blouseState.ownerReviewedCutoutTextureOnMesh188,true,
     'Actual signed-fixture private owner JPEG texels must be composited on the real 163-bone source garment');
    assert.equal(blouseState.ownerCutoutMaskFromUser188,false,
     'Never misrepresent licensed Work47 PNG alpha as a segmented private owner mask');
    assert.equal(blouseState.ownerCutoutHumanReviewIndependentlyWitnessed188,false);
    assert.equal(JSON.stringify(blouseState).includes('data:image'),false,
     'Public bridge state must never contain owner JPEG pixels');
    const disclosure188=await page.locator('#outfit3D01OwnerTextureDisclosure188').textContent();
    assert.match(disclosure188,/PRIVATE REVIEWED JPEG/);
    if(photoOwnerAlpha189){
     assert.equal(blouseState.ownerAlphaMaskTextureApplied189,true,
      'Owner PNG alpha must genuinely mask reviewed JPEG fabric on 163-bone mesh');
     assert.equal(blouseState.ownerAlphaMaskSourceGeometryChanged189,false);
     assert.equal(blouseState.ownerAlphaMaskHumanReviewIndependentlyWitnessed189,false);
     assert.equal(blouseState.ownerAlphaMaskSegmentationAccuracyVerified189,false);
     if(photoOwnerGeometry190){
      assert.equal(blouseState.ownerAlphaPhysicalMeshFit190,true,
       'P190 actual owner-contour bounded 163-bone source shell missing');
      assert.ok(blouseState.ownerAlphaPhysicalVertices190>=20);
      assert.ok(blouseState.ownerAlphaPhysicalMoveMeters190>=.0005&&
       blouseState.ownerAlphaPhysicalMoveMeters190<=.00901);
      assert.equal(blouseState.ownerAlphaBilateralCapJoins190,2);
      assert.equal(blouseState.ownerAlphaGeneral3DApproved190,false);
      assert.equal(blouseState.ownerAlphaRearActuallyPhotographed190,false);
     }
     assert.equal(JSON.stringify(blouseState).includes('data:image'),false);
     assert.match(disclosure188,/OWNER-ASSERTED PNG alpha/);
     assert.match(disclosure188,/GEOMETRY still uses the licensed source silhouette/);
    }else{
     assert.match(disclosure188,/PINNED LICENSED PNG/);
     assert.match(disclosure188,/NOT user-derived/);
    }
   }
   if(photoShoulder185){
    assert.equal(blouseState.photoSourceShoulder185,true,
     'P185 requires actual bounded rounded shoulder/hem world-axis mesh receipt');
    assert.ok(blouseState.physicalShoulderVertices185>=20);
    assert.equal(blouseState.shoulderCapSeamsRetained185,true,
     'P185 cannot break original bilateral sewn shoulder cap normals');
    assert.ok(blouseState.sewnShoulderCaps185>=2);
    assert.ok(blouseState.physicalShoulderMaxMeters185>.0001&&
     blouseState.physicalShoulderMaxMeters185<=.025);
    assert.equal(blouseState.mannequinBaseCoverDisclosure185,true);
    const disclosure=await page.locator('#outfit3D01AnatomyCover185').textContent();
    assert.match(disclosure,/BOTTOMS: NONE SELECTED/);
    assert.match(disclosure,/not to your closet or this saved outfit/);
    const coverRect=await page.locator('#outfit3D01AnatomyCover185').boundingBox();
    assert.ok(coverRect&&coverRect.y>=0&&coverRect.y+coverRect.height<=920,
     'P185 mannequin shorts disclaimer must be genuinely visible above fold in mobile WebGL preview');
    assert.equal(await page.locator('#outfit3D01Slot-bottom').inputValue(),'');
   }
   assert.equal(await page.locator('#outfit3D01Photos img').count(),1);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await page.locator('#outfit3D01Front').click(); await take(page,width,'01-female-front-provisional-blouse');
   await page.locator('#outfit3D01Side').click(); await take(page,width,'02-female-side-provisional-blouse');
   await page.locator('#outfit3D01Back').click(); await take(page,width,'03-female-inferred-rear-provisional-blouse');
   const model=page.locator('#outfit3D01Model');
   if(await model.count()){
    await model.selectOption('male');
    // Distinguish actual male mesh rejection from slow loading. Never claim
    // two-humanoid acceptance simply because the select changed to 'male'.
    // Changing the anatomical model is an async donor UI action. Capture
    // both states even if a model-switch exception gets swallowed by its UI
    // task queue rather than writing an "Action not saved" message.
    await page.waitForTimeout(7000);
    const maleProof=await page.evaluate(()=>({
     state:window.native3D05Bridge?.state(),
     donorStatus:String(document.getElementById('outfit3D01Status')?.textContent||'').slice(0,360),
     choice:document.getElementById('outfit3D01Model')?.value,
     previewStatus:document.getElementById('native3D05Status')?.textContent?.slice(0,250)
    }));
    assert.equal(maleProof.state?.modelReady&&maleProof.state?.figure==='male'&&
     maleProof.state?.photoSourceSilhouette62===true,true,
     'P183 actual male 163-bone photographed blouse failed after female PASS: '+JSON.stringify(maleProof));
    if(photoOwnerPositive188)assert.equal(maleProof.state?.ownerReviewedCutoutTextureOnMesh188,true,
     'P188 actual male 163-bone garment must retain decoded owner private JPEG texture');
    if(photoOwnerAlpha189)assert.equal(maleProof.state?.ownerAlphaMaskTextureApplied189,true,
     'P189 actual male 163-bone private owner alpha must remain on texture');
    if(photoOwnerGeometry190){
     assert.equal(maleProof.state?.ownerAlphaPhysicalMeshFit190,true,
      'P190 physical mask contour must fit the male 163-bone skinned garment');
     assert.ok(maleProof.state?.ownerAlphaPhysicalVertices190>=20);
     assert.ok(maleProof.state?.ownerAlphaPhysicalMoveMeters190<=.00901);
     assert.equal(maleProof.state?.ownerAlphaBilateralCapJoins190,2);
    }
    if(photoShoulder185){
     assert.equal(maleProof.state?.photoSourceShoulder185,true,
      'P185 real switched male source shoulder fit must be independently verified');
     assert.ok(maleProof.state?.physicalShoulderVertices185>=20);
     assert.equal(maleProof.state?.shoulderCapSeamsRetained185,true);
     assert.ok(maleProof.state?.sewnShoulderCaps185>=2);
     assert.ok(maleProof.state?.physicalShoulderMaxMeters185<=.025);
     assert.equal(maleProof.state?.mannequinBaseCoverDisclosure185,true);
    }
    await take(page,width,'04-male-front-provisional-blouse');
    await page.locator('#outfit3D01Side').click(); await take(page,width,'05-male-side-provisional-blouse');
    await page.locator('#outfit3D01Back').click(); await take(page,width,'06-male-inferred-rear-provisional-blouse');
   }
   assert.deepEqual(await readBoard(page),ownerOriginal);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
   cases.push({width,source:'commons-0016',sourceSHA256:photos['commons-0016'].sha256,
    authenticOwnerSavedOutfit:true,actualOriginalPhotoNative163BoneWebGL:true,
    femaleAndMaleRendered:true,bothHumanoidFrontSideRearCaptured:true,
    bothRearViewsInferredNotPhotographed:true,physicalMaskDerivedDeformation:true,
    physicalPhotoSilhouetteVertices62:blouseState.silhouetteVertices62,
    physicalPhotoSilhouetteMaxMeters62:blouseState.silhouetteMaxMeters62,
    ...(photoShoulder185?{
     anatomicalShoulderHemSourceAxis185:true,
     physicalShoulderEasing185:true,
     shoulderEasedVertices185:blouseState.physicalShoulderVertices185,
     bilateralSewnShoulderCapsRetained185:true,
     actualSkinnedShoulderCapMeshes185:blouseState.sewnShoulderCaps185,
     shoulderMaxMeters185:blouseState.physicalShoulderMaxMeters185,
     maleShoulderEasing185:true,
     mannequinBaseCoverDisclosure185:true,
     noSelectedOrSavedBottomFabricated185:true
    }:{}),
    originalPhotoFallbackRetained:true,inferredRearDisclosed:true,
    ownerApprovalForArbitraryPhotos:false,photorealismAccepted:false,
    ...(photoOwnerPositive188?{provisionalCutoutNeedsHumanReview:false}:{provisionalCutoutNeedsHumanReview:true}),
    ...(photoOwnerGeometry190?{
     sourceOwnerAlphaPhysicalMeshFitted190:true,
     ownerMaskMeasuredActuallyFromPrivateRaster190:true,
     sourceOwnerAlphaActualMovedVertices190:blouseState.ownerAlphaPhysicalVertices190,
     sourceOwnerAlphaMaxMovement190:blouseState.ownerAlphaPhysicalMoveMeters190,
     actualMaleAndFemaleSewnCapJoins190:true,
     sourceOwnerMaskGeometryOnlyLicensedBlouse190:true,
     ownerPhotoBackStillInferred190:true,
     independentlyWitnessedOwnerReview190:false,
     generalOwnerGarmentFitting190:false
    }:{}),
    ...(photoOwnerAlpha189?{actualOwnerAlphaPNGAppliedToFabric189:true,
     syntheticOwnerMaskNotIndependentReview189:true,
     ownerMaskSourceGeometryStillPinned189:true,
     ownerMaskWebCryptoVerifiedBeforeAndAfterDonor189:true,
     ownerMaskRealHumanApproved:false,
     ownerMaskSegmentationAccuracyMeasured:false}:{}),
    ...(photoOwnerPositive188?{syntheticPersistedOwnerReview188:true,
     originalAndOwnerCutoutJPEGIndependentlyWebCryptoVerified188:true,
     ownerCutoutPrivateJPEGTexelsOnTrueSkinnedMesh188:true,
     licensePinnedPNGMaskNotOwnerSegmentation188:!photoOwnerAlpha189,
     independentHumanReviewWitnessed188:false,
     physicalPhoneAccepted188:false}:{}),
    outfitUnmodified:true,physicalPhoneVerified:false,familyAlpha:'HOLD'});
   if(photoOwnerPositive188&&width===390){
    // Genuine IndexedDB source revision after visible 3D must revoke the
    // previous reviewed JPEG and close the skinned renderer, not silently
    // maintain a cached canvas. No saved outfit CAS is touched.
    if(photoOwnerAlpha189){
     // A distinct same-origin research browser tab changes only the live
     // owner's reviewed mask SHA. This avoids destroying the WebGL tab's
     // page.evaluate context mid-transaction and is a stronger cross-tab
     // owner-mask revocation test than mutating through the active renderer.
     const modifier=await ctx.newPage();
     try{
      // Load an inert public benchmark document, NOT another full app.
      // A second unauthenticated app instance broadcasts a session-change
      // event and closes the signed-in owner's original viewer, which would
      // falsely pass the owner-mask revocation test.
      await modifier.goto(origin+'/public/benchmark.html',{waitUntil:'domcontentloaded'});
      assert.match(await modifier.title(),/Photo Recognition Benchmark/);
      assert.equal(await page.evaluate(()=>window.closetAuth?.user?.id),'native05-A',
       'P189 private signed-in viewer must survive the independent data-writing tab');
      const revised=await modifier.evaluate(()=>new Promise((resolve,reject)=>{
       const req=indexedDB.open('closet-current-user-native05-A');
       req.onerror=()=>reject(req.error);
       req.onsuccess=()=>{
        const idb=req.result;
        if(!idb.objectStoreNames.contains('items')){
         idb.close();reject(Error('P189 source items store missing'));return;
        }
        const tx=idb.transaction('items','readwrite');
        const store=tx.objectStore('items'),get=store.get('native05-A-blouse');
        let changed=false;
        get.onerror=()=>reject(get.error);
        get.onsuccess=()=>{
         const row=get.result;
         if(row?.ownerId!=='native05-A'||!row.segmentHint?.ownerAlphaSHA256189){
          reject(Error('P189 only the current owner photo mask may be revised'));return;
         }
         row.segmentHint.ownerAlphaSHA256189='f'.repeat(64);
         changed=true;store.put(row);
        };
        tx.onerror=()=>{idb.close();reject(tx.error);};
        tx.oncomplete=()=>{idb.close();resolve(changed);};
       };
      }));
      assert.equal(revised,true,'P189 independent browser tab must persist a changed owner mask SHA');
     }finally{await modifier.close();}
    }else{
     await page.evaluate(()=>new Promise((resolve,reject)=>{
      const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
      const get=store.get('native05-A-blouse');
      get.onsuccess=()=>{const row=get.result;row.ownerReviewed=false;store.put(row);};
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     }));
    }
    // Never infer success from page navigation or a cleared owner session.
    // The original WebGL page must remain signed in, observe real changed
    // IndexedDB data and revoke only through its source-review guard.
    assert.equal(await page.evaluate(()=>window.closetAuth?.user?.id),'native05-A',
     'P189 mask-only change must not log out the verified owner');
    let storageReadFailedClosed189=false;
    try{await page.evaluate(()=>window.nativeLossless04Bridge.refreshWardrobe());}
    catch(e){
     if(!photoOwnerAlpha189||!/Failed to read large IndexedDB value|UnknownError/i.test(String(e)))
      throw e;
     // Chromium may refuse to materialize a large source JPEG after a
     // separate-tab mask mutation. The real P189/P93 security requirement
     // is to revoke the already visible 3D, without deleting that JPEG.
     // A generic read failure MUST NOT be silently counted as success.
     storageReadFailedClosed189=true;
    }
    if(photoOwnerAlpha189&&!storageReadFailedClosed189){
     const persisted=await page.evaluate(()=>new Promise((resolve,reject)=>{
      const req=db.transaction('items','readonly').objectStore('items').get('native05-A-blouse');
      req.onsuccess=()=>resolve(req.result?.segmentHint?.ownerAlphaSHA256189);
      req.onerror=()=>reject(req.error);
     }));
     assert.equal(persisted,'f'.repeat(64),
      'P189 mask-only SHA change must actually persist before WebGL revocation is credited');
    }
    if(storageReadFailedClosed189)
     await page.waitForFunction(()=>window.native3D05Bridge?.state()?.active===false,
      null,{timeout:12000});
    const revoked=await page.evaluate(()=>window.native3D05Bridge.state());
    assert.equal(revoked.active,false);
    assert.equal(revoked.ownerReviewedCutoutTextureOnMesh188,false);
    assert.deepEqual(await readBoard(page),ownerOriginal);
    await take(page,width,'07-private-reviewed-JPEG-revoked-to-original-photo-2d');
    cases.at(-1).reviewRevocationClosesGenuineWebGL188=true;
    if(photoOwnerAlpha189){
     cases.at(-1).ownerAlphaMutationRevokedReal3D189=true;
     cases.at(-1).largeIndexedDBReadFailsClosed189=storageReadFailedClosed189;
    }
   }
   await page.close();await ctx.close();await browser.close();browser=null;
   continue;
  }
  let tamperedOriginalBlocked92=false;
  if(native92&&width===390){
   // A genuine but WRONG licensed JPEG replaces the stored bytes under the
   // SAME item ID; sourceSHA256 and originalPhoto.sha256 are deliberately
   // unchanged. Metadata-only NATIVE91 correctly cannot see this failure;
   // only genuine WebCrypto over the bytes can protect the 3D renderer.
   const putPhoto=async image=>{
    await page.evaluate(({image})=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
     const get=store.get('native05-A-dress');
     get.onsuccess=()=>{
      const row=get.result;
      if(row?.ownerId!=='native05-A')return reject(Error('Wrong test account'));
      row.originalPhoto.image=image;row.image=image;
      // Deliberately retain BOTH original SHA metadata fields.
      store.put(row);
     };
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     tx.onabort=()=>reject(tx.error);
    }),{image});
    await page.evaluate(()=>window.nativeLossless04Bridge.refreshWardrobe());
   };
   await putPhoto(photos['commons-0003'].image);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.readOnlyGarmentSources91(
    ['native05-A-dress']).sources[0].sha256),photos['commons-0053'].sha256);
   await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /NATIVE92 ORIGINAL JPEG BYTES DO NOT MATCH SOURCE SHA/);
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   const png=await page.screenshot({fullPage:false,animations:'disabled'});
   const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
   assert.equal(meta.width,390);
   assert.ok(png.length>4500&&stats.channels.some(x=>x.stdev>7));
   await mkdir('benchmark/native-3d-92',{recursive:true});
   const filename='forged-unchanged-SHA-blocked-before-WebGL-390.png';
   await writeFile('benchmark/native-3d-92/'+filename,png);
   await writeFile('benchmark/native-3d-92/acceptance.json',
    JSON.stringify({priority:'NATIVE-3D-ORIGINAL-JPEG-BYTES-92',
     file:filename,width:390,height:meta.height,sha256:digest(png),
     originalSHA:photos['commons-0053'].sha256,
     replacementBytesSHA:photos['commons-0003'].sha256,
     licensedOriginalJPEGs:true,shaMetadataIntentionallyUnchanged:true,
     genuineBrowserWebCryptoRejectsBytes:true,donorNotOpenedForMismatchedBytes:true,
     savedBoardUnchanged:true,ownerSessionPreserved:true,
     physicalPhoneVerified:false,realSignedCloudVerified:false,
     modelAccuracyMeasured:false,productionDeployed:false,familyAlpha:'HOLD'
    },null,2)+'\n');
   await putPhoto(photos['commons-0053'].image);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   tamperedOriginalBlocked92=true;
  }
  let staleSelectionBlocked88=false;
  if(native88&&width===390){
   // NATIVE88 genuine browser race: pause pinned WebGL donor's lazy import
   // while a signed-in owner switches between existing saved outfits.
   const path='**/donor/research/outfit-3d-01/research-panel.mjs*';
   let releaseDonor,notifyDonor;
   const pause=new Promise(resolve=>{releaseDonor=resolve;});
   const requested=new Promise(resolve=>{notifyDonor=resolve;});
   await page.route(path,async route=>{
    notifyDonor();
    await pause;
    await route.continue();
   });
   const pending=page.evaluate(async()=>{
    try{await window.native3D05Bridge.open();return {ok:true};}
    catch(e){return {ok:false,reason:String(e?.message||e)};}
   });
   await Promise.race([requested,new Promise((_,reject)=>setTimeout(
    ()=>reject(Error('NATIVE88 did not intercept actual pinned donor import')),45000))]);
   await page.locator('#savedBoards button').nth(1).click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),1);
   releaseDonor();
   const returned=await Promise.race([pending,new Promise((_,reject)=>setTimeout(
    ()=>reject(Error('NATIVE88 stale donor request did not settle')),90000))]);
   await page.unroute(path);
   assert.equal(returned.ok,false,'Changed saved outfit must block stale source-bound 3D');
   assert.match(returned.reason,/NATIVE88 saved outfit changed/);
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await page.locator('#savedBoards button').first().click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),0);
   staleSelectionBlocked88=true;
  }
  // Real end-user button click: do NOT hold one long-running Playwright
  // page.evaluate() open promise while WebGL imports/contexts are created.
  // Native PR541 itself drives its browser test by DOM click + state wait.
  await page.locator('#native3D05Preview').click();
  await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
   window.native3D05Bridge.state().viewerMode==='dress'&&
   window.native3D05Bridge.state().bones===163,null,{timeout:150000});
  assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().opened),
   'native05-A-verified-dress-3D');
  if(photoFit171){
   await page.waitForFunction(()=>
    window.native3D05Bridge?.state().photoSourceFit171===true ||
    document.getElementById('native3D05Status')?.textContent.includes('P171 source-bound'),
    null,{timeout:30000});
  }
  if(photoDress175){
   // Actual signed owner board opens the already saved original dress,
   // never constructs a generic fake owner photo garment.
   await page.waitForFunction(()=>
    window.native3D05Bridge?.state().photoSourceDress175===true||
    document.getElementById('native3D05Status')?.textContent.includes(
     'P175 original photographed dress bodice/skirt 3D unavailable'),
    null,{timeout:30000});
  }
  const state=await page.evaluate(()=>window.native3D05Bridge.state());
  if(photoDress175){
   const originalDressStatus=await page.evaluate(()=>
    document.getElementById('native3D05Status')?.textContent||'no status');
   assert.equal(state.photoSourceDress175,true,
    'P175 genuine original physical dress was not fitted in native saved 3D: '+originalDressStatus);
   assert.equal(state.photoSourceFit171,true);
   assert.equal(state.viewerMode,'dress');
   assert.equal(state.bones,163);
   assert.ok(state.physicalDressBodiceVertices175>=100);
   assert.ok(state.physicalDressSkirtVertices175>=100);
   assert.ok(state.physicalDressMaxBodiceMeters175>=.001&&
    state.physicalDressMaxBodiceMeters175<=.0129001);
   assert.ok(state.physicalDressMaxSkirtMeters175>=.001&&
    state.physicalDressMaxSkirtMeters175<=.01905);
   assert.equal(state.photorealismApproved,false);
   assert.equal(state.ownerPhoto3DArbitraryFittingApproved,false);
  }
  if(photoFit171){
   const reason171=await page.evaluate(()=>document.getElementById('native3D05Status')?.textContent||'no status');
   assert.equal(state.photoSourceFit171,true,
    'P171 exact saved original SHA must be attached to a photographed P60 source-skinned 163-bone garment: '+reason171+'; active='+state.active+'; viewerMode='+state.viewerMode+'; bones='+state.bones);
   assert.equal(state.ownerPhoto3DArbitraryFittingApproved,false);
   assert.equal(state.photorealismApproved,false);
   assert.equal(state.bones,163);
  }
  assert.equal(state.meshCount>=1,true);
  assert.ok(state.fallbackCount>=3,'Jacket coat shoes must remain photo-only');
  assert.equal(await page.locator('#outfit3D01Photos img').count(),4);
  assert.equal(await page.locator('#outfit3D01Save').isDisabled(),true);
  assert.equal(await page.locator('#outfit3D01Delete').isDisabled(),true);
  assert.equal(await page.locator('#outfit3D01Slot-layer2').isDisabled(),true);
  const plan=await page.evaluate(()=>window.native3D05Bridge.state());
  assert.equal(plan.productionEnabled,false);
  assert.deepEqual(await readBoard(page),ownerOriginal,'3D scene may not rewrite outfit or JPEG IDs');
  await page.locator('#outfit3D01Front').click();
  await take(page,width,'02-genuine-163-bone-front-dress');
  await page.locator('#outfit3D01Side').click();
  await take(page,width,'03-genuine-163-bone-side-dress');
  await page.locator('#outfit3D01Back').click();
  await take(page,width,'04-genuine-163-bone-rear-neutral');
  if(native89&&width===390){
   // NATIVE89: actual source/owner viewer is already WebGL READY. A native
   // saved outfit selection change must revoke its previously visible
   // original photographs and mesh; it is not enough to reject a future open.
   await page.evaluate(()=>window.nativeLossless04Bridge.selectSaved(1));
   await page.waitForFunction(()=>
     window.native3D05Bridge?.state().active===false&&
     document.getElementById('native3D05Status')?.textContent.includes('stale source-photo 3D preview closed'),
     null,{timeout:20000});
   assert.equal(await page.locator('#outfit3D01Photos img').count(),0,
     'Stale source private photographs must be removed on live selection change');
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true,
     'Revoking stale WebGL must not revoke the valid native account/editor');
   assert.deepEqual(await readBoard(page),ownerOriginal,
     'Preview revocation must never overwrite owner private wardrobe');
   const img=await page.screenshot({fullPage:false,animations:'disabled'});
   const measure=await sharp(img).metadata(),stats=await sharp(img).stats();
   assert.equal(measure.width,390);
   assert.ok(img.length>4500&&stats.channels.some(c=>c.stdev>7));
   await mkdir('benchmark/native-3d-89',{recursive:true});
   const name='stale-photo-preview-cleared-390.png';
   await writeFile('benchmark/native-3d-89/'+name,img);
   await writeFile('benchmark/native-3d-89/acceptance.json',
     JSON.stringify({priority:'NATIVE-3D-LIVE-SOURCE-89',
      file:name,sha256:digest(img),width:390,height:measure.height,
      originalOutfitPrivate:true,oldSource3DRemoved:true,
      originalBoardUnmodified:true,nativeSessionActive:true,
      actualModelAlreadyRendered:true,physicalPhoneVerified:false,
      realSignedCloudVerified:false,productionDeployed:false,
      familyAlpha:'HOLD'},null,2)+'\n');
   await page.evaluate(()=>window.nativeLossless04Bridge.selectSaved(0));
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
     window.native3D05Bridge.state().viewerMode==='dress'&&
     window.native3D05Bridge.state().bones===163,null,{timeout:150000});
   assert.deepEqual(await readBoard(page),ownerOriginal);
  }
  if(native91&&width===390){
   // NATIVE91: original 163-bone source-photographed dress is already visible.
   // Update ONLY the underlying garment's genuine original JPEG + verified
   // source SHA in the owner-private items store, keeping its ID and the
   // *saved outfit slots* byte-for-byte identical. This is a deliberate
   // same-ID source revision, not an AI-recognition accuracy test.
   const original=photos['commons-0053'],replacement=photos['commons-0003'];
   const itemId='native05-A-dress';
   async function changeSource(photo){
    await page.evaluate(({itemId,photo})=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     const object=tx.objectStore('items'),req=object.get(itemId);
     req.onsuccess=()=>{
      const row=req.result;
      if(!row||row.ownerId!=='native05-A')return reject(Error('Wrong source owner'));
      row.originalPhoto={image:photo.image,sha256:photo.sha256};
      row.sourceSHA256=photo.sha256;row.image=photo.image;
      object.put(row);
     };
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     tx.onabort=()=>reject(tx.error);
    }),{itemId,photo});
    await page.evaluate(()=>window.nativeLossless04Bridge.refreshWardrobe());
   }
   await changeSource(replacement);
   await page.waitForFunction(()=>
    window.native3D05Bridge?.state().active===false&&
    document.getElementById('native3D05Status')?.textContent.includes('stale source-photo 3D preview closed'),
    null,{timeout:30000});
   assert.equal(await page.locator('#outfit3D01Photos img').count(),0,
    'Owner changed JPEG under SAME item ID; old photo must be removed');
   assert.deepEqual(await readBoard(page),ownerOriginal,
    'Photo revision may not rewrite saved board or garment IDs');
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true,
    '3D revocation may not sign user out or lose editable wardrobe');
   const revoked=await page.screenshot({fullPage:false,animations:'disabled'});
   const meta=await sharp(revoked).metadata(),stats=await sharp(revoked).stats();
   assert.equal(meta.width,390);
   assert.ok(revoked.length>4500&&stats.channels.some(c=>c.stdev>7));
   await mkdir('benchmark/native-3d-91',{recursive:true});
   const filename='same-id-source-photo-replaced-and-private-preview-cleared-390.png';
   await writeFile('benchmark/native-3d-91/'+filename,revoked);
   await writeFile('benchmark/native-3d-91/acceptance.json',
    JSON.stringify({priority:'NATIVE-3D-SOURCE-REVISION-91',
     file:filename,width:390,height:meta.height,sha256:digest(revoked),
     originalPhotoSHA:original.sha256,replacementPhotoSHA:replacement.sha256,
     realLicensedSourceJPEGs:true,sameGarmentId:true,savedOutfitIDsUnchanged:true,
     stalePhotoAndWebGLRevoked:true,ownerSessionStillValid:true,
     rendererWas163BoneAndSourceVerified:true,
     modelRecognitionAccuracyMeasured:false,physicalPhonesVerified:false,
     realSignedRLSVerified:false,productionDeployed:false,familyAlpha:'HOLD'},null,2)+'\n');
   await changeSource(original);
   // Source restore allows the same explicit source-verified garment to reopen.
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
    window.native3D05Bridge.state().viewerMode==='dress'&&
    window.native3D05Bridge.state().bones===163,null,{timeout:150000});
   assert.deepEqual(await readBoard(page),ownerOriginal);
  }
  if(native93&&width===390){
   // NATIVE93: corrupt live source BYTES only AFTER original 163-bone model
   // and permitted original photo have already been rendered. Retain the
   // saved garment ID and BOTH recorded SHA fields. The native viewer must
   // revoke on a real owner wardrobe refresh even though #91 metadata and
   // the saved outfit have not changed. There is no polling or fake model.
   const putPhoto93=async image=>{
    await page.evaluate(({image})=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
     const req=store.get('native05-A-dress');
     req.onsuccess=()=>{
      const row=req.result;
      if(row?.ownerId!=='native05-A')return reject(Error('Wrong wardrobe owner'));
      row.originalPhoto.image=image;
      row.image=image;
      // Keep sourceSHA256 and originalPhoto.sha256 UNCHANGED deliberately.
      store.put(row);
     };
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
     tx.onabort=()=>reject(tx.error);
    }),{image});
    await page.evaluate(()=>window.nativeLossless04Bridge.refreshWardrobe());
   };
   assert.equal(await page.locator('#outfit3D01Photos img').count(),4);
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().bones),163);
   const beforeRevision=await page.evaluate(()=>
    window.nativeLossless04Bridge.readOnlyWardrobeRevision93());
   await putPhoto93(photos['commons-0003'].image);
   const afterRevision=await page.evaluate(()=>
    window.nativeLossless04Bridge.readOnlyWardrobeRevision93());
   assert.equal(afterRevision.ownerId,beforeRevision.ownerId);
   assert.equal(afterRevision.revision,beforeRevision.revision+1);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.readOnlyGarmentSources91(
    ['native05-A-dress']).sources[0].sha256),photos['commons-0053'].sha256);
   // Wait for automatic native DOM mutation revocation. Do NOT call the
   // bridge state getter until after the old private photo is already gone.
   await page.waitForFunction(()=>document.getElementById('native3D05Status')
    ?.textContent.includes('stale source-photo 3D preview closed')&&
    document.querySelectorAll('#outfit3D01Photos img').length===0,
    null,{timeout:30000});
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /NATIVE92 ORIGINAL JPEG BYTES DO NOT MATCH SOURCE SHA/);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   const png=await page.screenshot({fullPage:false,animations:'disabled'});
   const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
   assert.equal(meta.width,390);
   assert.ok(png.length>4500&&stats.channels.some(ch=>ch.stdev>7));
   await mkdir('benchmark/native-3d-93',{recursive:true});
   const filename='post-open-unchanged-SHA-photo-bytes-revoked-390.png';
   await writeFile('benchmark/native-3d-93/'+filename,png);
   await writeFile('benchmark/native-3d-93/acceptance.json',
    JSON.stringify({priority:'NATIVE-3D-WARDROBE-REFRESH-93',
     file:filename,width:390,height:meta.height,sha256:digest(png),
     originalSHA:photos['commons-0053'].sha256,
     unapprovedBytesSHA:photos['commons-0003'].sha256,
     sourcePhotoPreviouslyRendered:true,realOriginalWebGLBones:163,
     savedGarmentIdUnchanged:true,shaMetadataIntentionallyUnchanged:true,
     ownerWardrobeRevisionIncremented:true,automaticVisible3DRevocation:true,
     privatePhotoRemovedBeforeStateRead:true,
     reOpenCorruptSourceBlockedByWebCrypto:true,privateSavedBoardUnchanged:true,
     validNativeOwnerSessionPreserved:true,physicalPhoneVerified:false,
     realSignedCloudVerified:false,modelAccuracyMeasured:false,
     productionDeployed:false,familyAlpha:'HOLD'
    },null,2)+'\n');
   await putPhoto93(photos['commons-0053'].image);
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
    window.native3D05Bridge.state().viewerMode==='dress'&&
    window.native3D05Bridge.state().bones===163,null,{timeout:150000});
   assert.deepEqual(await readBoard(page),ownerOriginal);
  }
  if(native102&&width===390){
   // Genuine photo-backed original 163-bone donor MUST be visible before the
   // simulated mobile tab-hidden lifecycle event. Browser API lifecycle is
   // emulated through real Chromium DOM events; NOT a physical phone test.
   const before102=await page.evaluate(()=>window.native3D05Bridge.state());
   assert.equal(before102.modelReady,true);
   assert.equal(before102.bones,163);
   const hidden=await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
    document.dispatchEvent(new Event('visibilitychange'));
    return {
     status:document.getElementById('native3D05Status')?.textContent,
     photos:document.querySelectorAll('#outfit3D01Photos img').length,
     signedIn:window.nativeLossless04Bridge.status().active
    };
   });
   assert.match(hidden.status,/Browser backgrounded.*preview closed/);
   assert.equal(hidden.photos,0,'Hidden tab must synchronously dispose original private 3D photo');
   assert.equal(hidden.signedIn,true,'Normal tab background must not log out owner');
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /NATIVE102 hidden browser must close photographed 3D/);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   const background=await page.screenshot({fullPage:false,animations:'disabled'});
   const bgMeta=await sharp(background).metadata();
   assert.equal(bgMeta.width,390);
   await mkdir('benchmark/native-3d-102',{recursive:true});
   await writeFile('benchmark/native-3d-102/background-source-revoked-390.png',background);
   await page.evaluate(()=>{
    delete document.hidden;delete document.visibilityState;
   });
   // Use the same actual browser touch button as the known-good #93
   // reopen sequence. A raw page.evaluate() promise can be invalidated by
   // donor-managed document navigation during 3D reattachment.
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady&&
    window.native3D05Bridge.state().bones===163,null,{timeout:150000});
   assert.deepEqual(await readBoard(page),ownerOriginal);
   // A different mobile lifecycle freeze can also occur without pagehide.
   const frozen=await page.evaluate(()=>{
    document.dispatchEvent(new Event('freeze'));
    return {
     status:document.getElementById('native3D05Status')?.textContent,
     photos:document.querySelectorAll('#outfit3D01Photos img').length,
     signedIn:window.nativeLossless04Bridge.status().active
    };
   });
   assert.match(frozen.status,/Browser frozen.*preview closed/);
   assert.equal(frozen.photos,0);
   assert.equal(frozen.signedIn,true);
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().active),false);
   assert.deepEqual(await readBoard(page),ownerOriginal);
   const freezePng=await page.screenshot({fullPage:false,animations:'disabled'});
   const freezeMeta=await sharp(freezePng).metadata();
   assert.equal(freezeMeta.width,390);
   await writeFile('benchmark/native-3d-102/freeze-source-revoked-390.png',freezePng);
   await writeFile('benchmark/native-3d-102/acceptance.json',
    JSON.stringify({
     priority:'NATIVE-MOBILE-VISIBILITY-SOURCE-REVOKE-102',
     browser:'Chromium',simulatedBrowserVisibility:true,
     actualPhysicalAndroidIPhone:false,viewportCSSWidth:390,
     authenticSourceJPEG:true,realOriginalWebGLBones:163,
     hiddenEventClosedSourceBeforeStateRead:true,
     hiddenOpenBlocked:true,sourceReopenPassedActualNATIVE92OriginalBytes:true,
     freezeEventClosedSourceBeforeStateRead:true,
     originalOwnerSavedOutfitUnchanged:true,signedOwnerStillActive:true,
     originalPhotographsInArtifacts:false,
     screenshots:[
      {file:'background-source-revoked-390.png',sha256:digest(background),
       width:bgMeta.width,height:bgMeta.height},
      {file:'freeze-source-revoked-390.png',sha256:digest(freezePng),
       width:freezeMeta.width,height:freezeMeta.height}
     ],
     realSignedCloudRLS:false,releaseAuthorized:false,familyAlpha:'HOLD'
    },null,2)+'\n');
  }
  if(photoTorso173){
   // THE ACTUAL saved owner shirt from the consumer board, not a donor-created
   // fake selection. P171 and P173 must be present on the loaded P541 model.
   await page.evaluate(()=>window.native3D05Bridge.close());
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await page.locator('#savedBoards button').nth(2).click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),2);
   await page.locator('#native3D05Preview').click();
   await page.waitForFunction(()=>
    window.native3D05Bridge?.state().photoSourceTorso173===true ||
    document.getElementById('native3D05Status')?.textContent.includes('P173 original photographed shirt geometry unavailable'),
    null,{timeout:150000});
   if(photoSleeve174){
    const diagnostic=await page.evaluate(()=>({
     source:window.native3D05Bridge?.state(),
     message:document.getElementById('native3D05Status')?.textContent||'',
     donor:document.getElementById('outfit3D01Status')?.textContent||''
    }));
    console.log('P174_NATIVE_SOURCE_BOOT_DIAGNOSTIC',JSON.stringify(diagnostic));
    assert.equal(diagnostic.source?.photoSourceTorso173,true,
     'P174 upstream physical 163-bone source or panel failed before sleeve evidence: '+JSON.stringify(diagnostic));
    // P174 must be admitted by the ACTUAL saved owner source original
    // skinned P172+P173, NEVER a toy detached generic glTF garment.
    await page.waitForFunction(()=>
     window.native3D05Bridge?.state().photoSourceShoulder174===true||
     document.getElementById('native3D05Status')?.textContent.includes('P174 exact original photographed shoulder seam fit unavailable'),
     null,{timeout:30000});
   }
   const shirtState=await page.evaluate(()=>window.native3D05Bridge.state());
   if(photoSleeve174){
    const status174=await page.evaluate(()=>
     document.getElementById('native3D05Status')?.textContent||'no P174 source');
    assert.equal(shirtState.photoSourceShoulder174,true,
     'P174 requires real bilateral source shoulder/cap mesh deformation: '+status174);
    assert.equal(shirtState.photoSourceTorso173,true);
    assert.ok(shirtState.shoulderMovedVertices174>=40);
    assert.ok(shirtState.shoulderMaxMeters174>=.0025&&
     shirtState.shoulderMaxMeters174<=.00961);
    assert.equal(shirtState.bones,163);
   }
   const fitStatus=await page.evaluate(()=>
    document.getElementById('native3D05Status')?.textContent||'no source-fit status');
   assert.equal(shirtState.photoSourceTorso173,true,
    'P173 actual native owner shirt source geometry missing: '+fitStatus);
   assert.equal(shirtState.photoSourceFit171,true);
   assert.equal(shirtState.viewerMode,'shirt');
   assert.equal(shirtState.bones,163);
   assert.ok(shirtState.physicalShirtVertices173>30,
    'Must physically reshape original skinned mesh, not a shader or screenshot');
   assert.ok(shirtState.physicalShirtMaxMoveMeters173>=.006&&
    shirtState.physicalShirtMaxMoveMeters173<=.0201);
   assert.equal(shirtState.ownerPhoto3DArbitraryFittingApproved,false);
   assert.equal(shirtState.photorealismApproved,false);
   assert.equal(await page.locator('#outfit3D01Photos img').count(),1,
    'Actual signed owner photographed shirt must remain visible');
   assert.equal(await page.locator('#outfit3D01Save').isDisabled(),true);
   await page.locator('#outfit3D01Front').click();
   await take(page,width,'06-owner-physical-shirt-front');
   await page.locator('#outfit3D01Side').click();
   await take(page,width,'07-owner-physical-shirt-side');
   await page.locator('#outfit3D01Back').click();
   await take(page,width,'08-owner-shirt-neutral-inferred-rear');
   assert.deepEqual(await readBoard(page),ownerOriginal);
   await page.evaluate(()=>window.native3D05Bridge.close());
   assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().photoSourceTorso173),false);
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
   await page.locator('#savedBoards button').first().click();
   assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().selected),0);
  }
  // Explicit scene close must NOT invalidate still-signed-in consumer editor.
  await page.evaluate(()=>window.native3D05Bridge.close());
  assert.equal(await page.evaluate(()=>window.nativeLossless04Bridge.status().active),true);
  assert.deepEqual(await readBoard(page),ownerOriginal);
  // Unsaved edit must fail closed, rather than replacing source with a fake mesh.
  await page.locator('#boardSlots .board-slot-shoes').click();
  await page.locator('#boardPickerItems button').filter({hasText:'shoes'}).first().click().catch(()=>{});
  await page.evaluate(()=>window.nativeLossless04Bridge.setField('name','unsaved 3D prohibited'));
  await assert.rejects(page.evaluate(()=>window.native3D05Bridge.open()),
    /Save or cancel unsaved outfit/);
  assert.deepEqual(await readBoard(page),ownerOriginal);
  await page.evaluate(()=>window.nativeLossless04Bridge.cancel());
  await page.locator('details.account-menu > summary').click();
  await page.locator('#logout').click();
  await page.waitForFunction(()=>window.closetAuth?.user===null&&
   document.getElementById('authGate')?.hidden===false);
  assert.equal(await page.locator('#outfit3D01Photos img').count(),0);
  assert.equal(await page.evaluate(()=>!window.native3D05Bridge||!window.native3D05Bridge.state().active),true,
   'Native logout may destroy the whole research bridge or leave it revoked');
  // Session B cannot inherit A preview, owner IDs, or original photo URLs.
  await login(page,'native05-B');
  await seed(page,'native05-B');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status()?.active&&
   !!window.native3D05Bridge,{timeout:30000});
  await page.evaluate(()=>switchView('builder'));
  const bStored=await readBoard(page);
  assert.equal(bStored.saved[0].outfit3dId,'native05-B-verified-dress-3D');
  assert.equal(await page.locator('#savedBoards').textContent().then(t=>t.includes('native05-A')),false);
  await page.locator('#savedBoards button').nth(1).click();
  assert.equal(await page.locator('#boardSlots .board-slot-bottom').textContent().then(
   t=>t.includes('Missing saved clothing')),true);
  await take(page,width,'05-B-private-missing-source-fallback');
  assert.deepEqual(await readBoard(page),bStored);
  cases.push({width,realNativeBuilder:true,exactSourceDonorPR541:true,
   ...(native88?{staleSelectionBlocked88:width===390?staleSelectionBlocked88:'not-tested-in-this-viewport'}:{}),
   authenticPhotoSourcedDress3D:true,
   ...(photoTorso173?{actualSignedOwnerSourceShirtPhysicallyContoured173:true}:{}),
   ...(photoSleeve174?{actualSignedOwnerBilateralShoulderSeamPhysicallyEased174:true}:{}),
   ...(photoDress175?{actualSignedOwnerPhotographedDressPhysicallyReshaped175:true}:{}),
   bones:163,renderedGenuineMeshes:state.meshCount,
   nonVettedCoatJacketShoesPhotoFallback:true,readOnlyDonorActions:true,
   noOutfitMutation:true,unsavedEditsBlocked:true,
   sessionLogoutClears3D:true,consumerStillActiveAfterViewerClose:true,
   ...(native89?{liveSourceRevocation89:width===390?'verified':'not-tested-in-this-viewport'}:{}),
   ...(native91?{sameGarmentIdPhotoSourceRevision91:width===390?'verified':'not-tested-in-this-viewport'}:{}),
   ...(native92?{tamperedOriginalJPEGBlocked92:width===390?tamperedOriginalBlocked92:'not-tested-in-this-viewport'}:{}),
   ...(native93?{postOpenUnchangedSHASourceRevoked93:width===390?'verified':'not-tested-in-this-viewport'}:{}),
   ...(native102?{mobileVisibilitySourceRevoked102:width===390?'verified-in-Chromium-lifecycle-simulation':'not-tested-in-this-viewport'}:{}),
   separateAccountBPrivate:true,missingIDsRetained:true,
   physicalPhoneApproved:false,liveSignedRLS:false,releaseAuthorized:false,
   familyAlpha:'HOLD'});
  await page.close();await ctx.close();
  await browser.close();browser=null;
 }
 assert.equal(crashes.length,0,'No real WebGL viewport may crash');
 assert.equal(cases.length,3);photoOwnerPositive188?assert.equal(screens.length,22):photoOwnerCutout186?assert.equal(screens.length,6):
  assert.equal(screens.length,photoSilhouette62?21:photoTorso173?24:15);
 assert.deepEqual(errors,[]);
 assert.deepEqual(external.filter(x=>x.method!=='GET'),[]);
 for(const entry of screens)assert.equal(digest(await readFile(dir+'/'+entry.name)),entry.sha256);
 const result={priority:photoOwnerGeometry190?'OWNER-ALPHA-PHYSICAL-SILHOUETTE-190':photoOwnerAlpha189?'OWNER-ALPHA-PNG-ON-REVIEWED-JPEG-3D-189':photoOwnerPositive188?'OWNER-REVIEWED-PRIVATE-JPEG-TEXTURE-188':photoPreflight187?'PRE-WEBGL-CUTOUT-187':photoOwnerCutout186?'OWNER-CUTOUT-186':photoSilhouette62?'USER-PHOTO-TO-ANATOMICAL-3D-62':'NATIVE-3D-05',cases:3,...(photoOwnerPositive188?{screenshots:22}:photoOwnerCutout186?{screenshots:6}:{screenshots:photoSilhouette62?21:photoTorso173?24:15}),
  browser:photoSilhouette62?photoSilhouetteEngine62:'chromium',widths:[320,390,430],
  originalNativeAuthHTTPOnlyMocked:true,realWebGL:true,
  pinnedDonorSourceSHA:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  realSignedRLS:false,originalUserSavedStateUnmodified:true,
  actual3DWithHonestUnsupportedPhotoFallback:true,
  physicalPhone:'NOT TESTED',familyAlpha:'HOLD',releaseAuthorized:false,
  evidence:cases,screens,errors,external,
  navigations,crashes,isolatedChromiumProcessPerWidth:true};
 await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
 console.log('NATIVE05_BROWSER_3D_VERIFIED',JSON.stringify({cases:3,
   real163BoneWebGL:true,realMobileScreenshots:photoOwnerCutout186?6:photoSilhouette62?21:15,familyAlpha:'HOLD'}));
}catch(error){
 await writeFile(dir+'/ERROR.json',JSON.stringify({
  message:String(error?.stack||error),cases:cases.length,
  screens:screens.length,errors,external,navigations,crashes},null,2));throw error;
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
}
