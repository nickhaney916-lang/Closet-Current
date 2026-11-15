/**
 * MAIN1054 M50 — Real desktop Chromium/WebKit executing original source
 * PHOTO119 → browser IndexedDB → native board normalizer → original 2D
 * viewer against the REAL licensed public JPEG. Local synthetic test owner,
 * never a hosted/JWT or physical iOS/Android assertion.
 *
 * M49 already covers the same chain on Node fake-IDB and mock DOM; M50
 * requires genuine browser crypto, real IndexedDB, document and image decode.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {M48} from '../research/main1054-3d48/photo-neckline-edge-admission48.mjs';
const engine=process.env.M50_ENGINE;
assert.ok(['chromium','webkit'].includes(engine),
 'M50_ENGINE must identify the ACTUAL browser engine, no Chromium default');
const root=resolve('.');
const publicJpeg=await readFile('benchmark/fixtures/commons-0053.jpg');
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(publicJpeg),M48.sourceSHA256,'M50 must use original genuine licensed M47/M48 JPEG');
const originalPhoto='data:image/jpeg;base64,'+publicJpeg.toString('base64');
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.jpg':'image/jpeg','.json':'application/json','.png':'image/png'};
const pathAllowed=p=>/^\/(public\/|research\/|benchmark\/fixtures\/)/.test(p);
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:sans-serif;padding:12px}#original-preview{border:1px solid #999;min-height:200px}img{height:auto}</style></head><body><h1>Original licensed source • 2D photo only</h1><main id="original-preview"></main></body></html>';
const served=[];
const server=createServer(async(req,res)=>{
 try{
  const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))
   throw Error('invalid read-only browser source URL');
  if(p==='/m50.html'){
   res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});
   res.end(html);return;
  }
  if(!pathAllowed(p))throw Error('source outside protected research route');
  const full=resolve(root,'.'+p);
  if(!full.startsWith(root+'/'))throw Error('source escaped repository');
  const b=await readFile(full);
  served.push(p);
  res.writeHead(200,{'content-type':mime[extname(full)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(b);
 }catch{res.writeHead(404);res.end('NO_PRIVATE_TEST_SOURCE');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const out=join('benchmark','main50-licensed-original-owner-2d',engine);
await mkdir(out,{recursive:true});
const receipts=[],errors=[],external=[];
let browser;
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true});
 for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:780},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith(origin+'/')||u.startsWith('data:'))return route.continue();
   external.push({kind:'unapproved-network',method:route.request().method()});
   return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e.message).slice(0,160)));
  page.on('crash',()=>errors.push('browser-crash'));
  await page.goto(origin+'/m50.html',{waitUntil:'domcontentloaded'});
  await page.addScriptTag({url:origin+'/public/outfit-board-engine.js'});
  const run=await page.evaluate(async({image,sha,width})=>{
   const check=(ok,reason)=>{if(!ok)throw Error('M50_BROWSING_CONTRACT: '+reason);};
   const open=owner=>new Promise((resolve,reject)=>{
    const q=indexedDB.open('closet-current-user-'+owner,2);
    q.onupgradeneeded=()=>{
     q.result.createObjectStore('items',{keyPath:'id'});
     q.result.createObjectStore('state',{keyPath:'id'});
    };
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   });
   const put=(db,store,row)=>new Promise((resolve,reject)=>{
    const t=db.transaction(store,'readwrite');
    t.objectStore(store).put(row);
    t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(t.error);
   });
   const read=db=>new Promise((resolve,reject)=>{
    const q=db.transaction('items','readonly').objectStore('items').getAll();
    q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
   });
   const [save,source,previewModule]=await Promise.all([
    import('/public/native-reviewed-private-save-167.mjs'),
    import('/research/main-thread-integration-1054/source-to-outfit.mjs'),
    import('/research/main-thread-integration-1054/native-2d-preview.mjs')
   ]);
   check(typeof window.cleanOutfitBoard==='function','actual native Outfit Builder engine not present');
   const ownerA='synthetic-m50-'+width+'-A',ownerB='synthetic-m50-'+width+'-B',
    id='original-licensed-dress';
   const dbA=await open(ownerA),dbB=await open(ownerB);
   let owner=ownerA,currentDb=dbA,auth={user:{id:ownerA},assertCurrent(){}},
    signed=true,capture=15;
   const getSession=()=>({authenticated:signed,ownerId:owner,
    epoch:'native-browser-M50-test',operationEpoch:capture,
    authRef:auth,privateDbRef:currentDb,privateDbName:currentDb.name});
   const getBoard=()=>structuredClone(board);
   const readOwnerItems=()=>read(currentDb);
   const board={name:'Real original source only',slots:{top:id}};
   const record={id,ownerId:ownerA,category:'Uncategorized',
    itemType:'Unknown',color:'Unknown',sourceSHA256:sha,
    sourceHashVerified:true,singleGarmentVerified:false,
    originalPhoto:{image,sha256:sha},image};
   const review={confirmed:true,recordId:id,originalSHA256:sha,
    category:'Dresses',itemType:'Casual dress',color:'Black',
    singleGarmentConfirmed:true};
   const target=document.getElementById('original-preview');
   const preview=previewModule.mountOwnerOutfitPhotoPreview1054({
    target,getSession,getBoard,readOwnerItems,
    cleanBoard:window.cleanOutfitBoard,events:window,doc:document
   });
   let refused=0;
   try{await preview.refresh();}catch{refused++;}
   check(refused===1&&target.querySelectorAll('img').length===0,
    'unreviewed original source displayed without private owner confirmation');
   await put(dbA,'state',{id:'draft',batch:[structuredClone(record)]});
   const receipt=await save.commitHumanReviewedPhoto119({
    db:dbA,ownerId:ownerA,currentOwner:()=>signed?owner:null,
    record,review,cryptoProvider:crypto,
    assertLease:()=>signed&&owner===ownerA&&currentDb===dbA&&auth.user.id===ownerA
   });
   check(receipt.saved===true&&receipt.releaseAuthorized===false,'reviewed original source not saved or release error');
   const actual=await read(dbA);
   check(actual.length===1&&actual[0].sourceSHA256===sha&&
    actual[0].originalPhoto.image===image&&actual[0].ownerReviewed===true,
    'real browser IndexedDB original JPEG save/readback mismatch');
   const plan=await source.preflightOwnedOutfit1054({
    getSession,readOwnerItems,cleanBoard:window.cleanOutfitBoard,
    board:getBoard()
   });
   check(plan.status==='source-verified-2d-only'&&plan.slots.length===1&&
    plan.slots[0].sourceSHA256===sha&&plan.renderAuthorized3D===false&&
    plan.releaseAuthorized===false,'actual native Outfit Builder photo/source approval failed');
   const displayed=await preview.refresh();
   check(displayed.slotCount===1&&displayed.presentationMode==='verified-original-photo-2d'&&
    displayed.renderAuthorized3D===false&&displayed.releaseAuthorized===false,
    'real native DOM 2D display not approved');
   const shown=target.querySelector('img');
   check(shown&&shown.src===image,'browser displayed changed or substituted original source JPEG');
   await shown.decode();
   check(shown.naturalWidth>0&&shown.naturalHeight>0,'real browser did not decode genuine original JPEG');
   check(document.querySelectorAll('canvas').length===0,
    'webgl viewer allocated despite no 3D authorization');
   // Screenshot must be taken by Playwright outside browser evaluation.
   window.__m50={preview,dbA,dbB,board,getSession,
    getCurrent:()=>({owner,currentDb,auth,signed,capture}),
    setOwner:(id,db)=>{owner=id;currentDb=db;auth={user:{id},assertCurrent(){}};capture++;},
    relogin:()=>{auth={user:{id:owner},assertCurrent(){}};capture++;},
    swapDB:async()=>{currentDb=await open(owner);},
    bump:()=>capture++,
    logout:()=>{signed=false;window.dispatchEvent(new Event('closet:session-locked'));},
    readOwnerItems,put,record,sha,image
   };
   return {width,originalPhotoReadback:true,originalBrowserIndexedDB:true,
    originalPhotographDecoded:true,slotCount:displayed.slotCount,
    originalPhotoOnly:true,privateSourceOutsideResult:true,
    consumer3D:false,releaseAuthorized:false,familyAlpha:'HOLD'};
  },{image:originalPhoto,sha:sha(publicJpeg),width});
  assert.equal(run.originalPhotoReadback,true);
  const png=await page.screenshot({animations:'disabled'});
  const filename=engine+'-'+width+'-native-original-2d.png';
  await writeFile(join(out,filename),png);
  const changes=await page.evaluate(async()=>{
   const x=window.__m50;
   const preview=x.preview,target=document.getElementById('original-preview');
   const check=(ok,why)=>{if(!ok)throw Error('M50_LEASE_VETO: '+why);};
   const empty=()=>{
    const state=preview.status; // synchronous real auth/board/display lease
    check(state.renderAuthorized3D===false&&state.releaseAuthorized===false,
     '3D or release permitted');
    check(!state.hasOwnerPhotos&&target.querySelectorAll('img').length===0,
     'stale owner original photo remained in browser DOM');
   };
   x.relogin();
   window.dispatchEvent(new Event('focus'));empty();
   await preview.refresh();
   check(target.querySelectorAll('img').length===1,'fresh same-owner re-login cannot reverify');
   await x.swapDB();
   window.dispatchEvent(new Event('focus'));empty();
   await preview.refresh();
   check(target.querySelectorAll('img').length===1,'new same-named DB handle cannot safely reverify');
   x.board.slots.top='missing';
   window.dispatchEvent(new Event('focus'));empty();
   x.board.slots.top=x.record.id;
   await preview.refresh();
   check(target.querySelectorAll('img').length===1,'restored selected source failed new verification');
   x.setOwner(x.getCurrent().owner.replace('-A','-B'),x.dbB);
   empty();
   let foreignDenied=false;
   try{await preview.refresh();}catch{foreignDenied=true;}
   check(foreignDenied,'foreign empty owner falsely displayed prior saved photograph');
   empty();
   x.setOwner(x.dbA.name.slice('closet-current-user-'.length),x.dbA);
   await preview.refresh();
   x.logout();empty();
   let loggedOutDenied=false;
   try{await preview.refresh();}catch{loggedOutDenied=true;}
   check(loggedOutDenied,'logout did not refuse old source');
   preview.dispose();empty();
   x.dbA.close();x.dbB.close();
   return {sameOwnerReloginRevoked:true,
    privateDbIdentityRotationRevoked:true,outfitSlotChangeRevoked:true,
    foreignOwnerPhotoBlocked:true,logoutPhotoRevoked:true,
    no3DImportAndNoCanvas:document.querySelectorAll('canvas').length===0};
  });
  receipts.push({engine,width,photoSHA256:sha(publicJpeg),
   ...run,...changes,screenshotSHA256:sha(png),
   actualBrowserDOM:true,nativeBrowserOriginalJpegDecode:true,
   authenticatedHostedAccount:false,physicalPhone:false,
   realHumanReviewed:false,consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'});
  await context.close();
 }
 assert.deepEqual(errors,[],'browser page exceptions');
 assert.deepEqual(external,[],'unexpected network access');
 assert.ok(!served.some(p=>p.startsWith('/research/native-3d-05/')),
  'unverified 3D render code unexpectedly served');
 assert.ok(receipts.every(x=>x.actualBrowserDOM&&x.nativeBrowserOriginalJpegDecode&&
  !x.consumer3DAdmitted&&!x.releaseAuthorized&&x.familyAlpha==='HOLD'));
 const report={schema:'MAIN1054_M50_NATIVE_CHROME_WEBKIT_ORIGINAL_OWNER_2D_ONLY/v1',
  engine,originalLicensedJpegSHA256:sha(publicJpeg),
  measuredBrowsers:1,screenWidths:receipts.map(r=>r.width),
  browserScreenshots:receipts.length,realBrowserIndexedDBAndWebCrypto:true,
  nativeOriginalSourceAndBoardModules:true,signedOwnerOnlySynthetic:true,
  genuineOriginalPhotoPixelsDecoded:true,noHostedRLS:true,noPhysicalPhone:true,
  independentHumanReviewProven:false,consumer3D:false,releaseAuthorized:false,
  familyAlpha:'HOLD',cases:receipts.map(x=>({
   width:x.width,originalPhotoReadback:x.originalPhotoReadback,
   originalPhotographDecoded:x.originalPhotographDecoded,
   sameOwnerReloginRevoked:x.sameOwnerReloginRevoked,
   privateDbIdentityRotationRevoked:x.privateDbIdentityRotationRevoked,
   outfitSlotChangeRevoked:x.outfitSlotChangeRevoked,
   foreignOwnerPhotoBlocked:x.foreignOwnerPhotoBlocked,
   logoutPhotoRevoked:x.logoutPhotoRevoked,
   no3DImportAndNoCanvas:x.no3DImportAndNoCanvas,
   screenshotSHA256:x.screenshotSHA256
  }))};
 await writeFile(join(out,'M50-real-browser-original-owner-2d-NOT-RELEASE.json'),
  JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log('MAIN50_REAL_BROWSER_ORIGINAL_OWNER_2D_ONLY_HOLD',JSON.stringify({
  engine,realBrowserSizes:report.screenWidths,originalSourceVerified:true,
  nativeBrowserIndexedDB:true,originalJpegDecode:true,
  photoOwnerSessionRevocations:true,no3D:true,familyAlpha:'HOLD'
 }));
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
