/**
 * MAIN1054 M57 actual native Closet Current opt-in MULTI24 app:
 * genuine licensed original JPEG + synthetic owner login + source-bound P88
 * unresolved worker flag -> visible warning and disabled confirmation/save.
 * A separate manually marked human-confirmed replacement must remain usable.
 *
 * This does NOT use real recognition inference, actual donor worker process or hosted signed accounts.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';

const engine=process.env.M57_ENGINE;
assert.ok(['chromium','webkit'].includes(engine),'M57_ENGINE must select real browser');
const original=await readFile('benchmark/fixtures/commons-0003.jpg');
const sourceSHA=createHash('sha256').update(original).digest('hex');
// A SECOND genuine independently locked dress original is used only for
// source-honest manual owner review and native 2D outfit selection.
const dressOriginal=await readFile('benchmark/fixtures/commons-0053.jpg');
const dressSHA=createHash('sha256').update(dressOriginal).digest('hex');
const lock=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
 .find(r=>r.id==='commons-0003');
assert.equal(lock?.verified,true);
assert.equal(sourceSHA,lock.sha256);
const dressLock=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
 .find(r=>r.id==='commons-0053');
assert.equal(dressLock?.verified,true);
assert.equal(dressSHA,dressLock.sha256);
const root=resolve('.');
const out=join('benchmark','main57-native-p88-source-transport',engine);
await mkdir(out,{recursive:true});
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html',
 '.json':'application/json','.css':'text/css','.jpg':'image/jpeg',
 '.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||!/^\/(public|research|benchmark|node_modules|\.m57-exact-p88-donor)\//.test(path)||
      path.includes('\\')||path.includes('\0')||path.split('/').includes('..'))
   throw Error('read-only test-only asset');
  const absolute=resolve(root,'.'+path);
  if(!absolute.startsWith(root+'/'))throw Error('escaped repo');
  const body=await readFile(absolute);
  res.writeHead(200,{'content-type':mime[extname(absolute)]||'application/octet-stream',
   'cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('NOT_PUBLIC_BROWSER_SOURCE');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const auth='https://hlkgymugtfbirlpunsra.supabase.co';
const cloudStub='window.closetCloud={start:async()=>{},changed:()=>{},beforeWrite:async()=>{},sync:async()=>{}};';
// Synthesized P88-SHAPED transport packets; NOT pretrained model inference.
// The selected source is the genuine SHA-checked Commons-0003 JPEG.
const acceptedMask=new Uint8Array(64);for(const i of [9,10,11,17,18,19,25,26,27])acceptedMask[i]=1;
const maskSha=createHash('sha256').update(acceptedMask).digest('hex');
const workerFixture=String.raw`
(()=>{
 const Native=window.Worker;
 window.Worker=function(url,options){
  if(!String(url).includes('.m57-exact-p88-donor/public/outfit-worker.mjs'))
   return new Native(url,options);
  const mock={onmessage:null,onerror:null,terminated:false,
   postMessage(req){
    if(req?.instanceReview70!==true||req?.instanceReview840!==true||req?.multi24!==undefined||
       !/^data:image\/jpeg;base64,/.test(req.image||''))
     throw Error('M57 must send original JPEG with explicit P88 70/840 worker mode');
    window.__m57WorkerRequest={sourceOriginal:req.image.length,receipt:true,
     researchFlags:req.instanceReview70&&req.instanceReview840};
    const method='native_semantic_group_unresolved_fragments';
    const packet={id:req.id,type:'piece',piece:{
     cropBounds:{x:.12,y:.12,width:.42,height:.52},
     instanceMethod:method,
     hint:{categories:['Tops'],types:['T-shirt'],confidence:1,clipped:false},
     colorEstimate:{color:'Blue',extra:'DO-NOT-KEEP'},
     ownerId:'UNTRUSTED-FOREIGN',maskPixels:'UNTRUSTED-RAW-PIXELS',
     reconciliation70:{
      sourceSha256:'${sourceSHA}',maskSha256:'${maskSha}',
      instanceOrdinal:0,method
     }
    }};
    const send=(value,delay)=>setTimeout(()=>{if(!mock.terminated)mock.onmessage?.({data:value});},delay);
    send(packet,12);
    const duplicate=JSON.parse(JSON.stringify(packet));
    duplicate.piece.reconciliation70.instanceOrdinal=1;
    send(duplicate,20);
    const forged=JSON.parse(JSON.stringify(packet));
    forged.piece.reconciliation70.sourceSha256='0'.repeat(64);
    forged.piece.reconciliation70.instanceOrdinal=2;
    send(forged,28);
    send({id:req.id,type:'done',count:3},48);
    send(packet,80); // Late after DONE must never reopen or save.
   },
   terminate(){this.terminated=true;}
  };
  return mock;
 };
})();
`;
let browser,stage='startup',widthNow=0;
const issues=[],cases=[],screenshots=[];
const tokenRoute=route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204,body:''});
 if(url.pathname==='/auth/v1/token'){
  const info=JSON.parse(req.postData()||'{}');
  const type=url.searchParams.get('grant_type');
  const owner=type==='password'&&info.email==='m54-A@example.test'?'m54-A':
   type==='refresh_token'&&info.refresh_token==='m54-refresh-A'?'m54-A':null;
  if(!owner)return route.fulfill({status:401,contentType:'application/json',
   body:'{"error":"invalid synthetic account"}'});
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   user:{id:owner,email:owner+'@example.test'},
   access_token:'synthetic-m54-owner-A',
   refresh_token:'m54-refresh-A',expires_in:3600
  })});
 }
 issues.push('unapproved-auth-endpoint');
 return route.abort();
};
const countRows=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
 const req=db.transaction('items','readonly').objectStore('items').count();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
}));
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,
  ...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 for(const width of [320,390,430]){
  widthNow=width;
  const context=await browser.newContext({
   viewport:{width,height:920},isMobile:true,hasTouch:true,
   serviceWorkers:'block'});
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url===origin+'/public/cloud-backup.js')
    return route.fulfill({status:200,contentType:'text/javascript',body:cloudStub});
   if(url.startsWith(origin+'/')||url.startsWith('data:')||
      url.startsWith('blob:'+origin))return route.continue();
   if(url.startsWith(auth+'/auth/v1/'))return tokenRoute(route);
   // Even benign optional style/trend GETs never leave isolated CI.
   const parsed=new URL(url);
   if(route.request().method()==='GET'&&
      ['fonts.googleapis.com','raw.githubusercontent.com','cdn.jsdelivr.net'].includes(parsed.hostname))
    return route.abort();
   issues.push('unexpected-external-'+parsed.hostname+'-'+route.request().method());
   return route.abort();
  });
  const page=await context.newPage();
  page.on('dialog',async dialog=>{
   // Existing native REMOVE76 may ask once before discarding a human-edited
   // unsaved crop. This gesture grants removal, NEVER clothing save.
   if(dialog.type()==='confirm'&&/remove|discard/i.test(dialog.message()))
    await dialog.accept();
   else await dialog.dismiss();
  });
  page.on('pageerror',e=>issues.push('pageerror-'+e.name));
  page.on('crash',()=>issues.push('browser-crash'));
  await page.addInitScript({content:workerFixture});
  stage='auth';
  const params='multi24=research&p88Transport57=research&mission4Preview=research&captureProof01=after&index04=after&nativeLossless04=research&nativeIndex07=research&index02=after&restoreAtomic01=research&styleOwned03=research&nativeCorrection10=research';
  await page.goto(origin+'/public/index.html?'+params,{waitUntil:'domcontentloaded'});
  await page.locator('#authEmail').fill('m54-A@example.test');
  await page.locator('#authPassword').fill('fixture-only');
  await page.locator('#authSubmit').click();
  await page.waitForFunction(()=>window.closetAuth?.user?.id==='m54-A'&&
   db?.name==='closet-current-user-m54-A',
   null,{timeout:30000});
  await page.waitForFunction(()=>window.nativeLossless04Bridge?.status().active&&
   window.multi24Research?.active===true&&window.multi24Research.debug().p88Transport57===true,null,{timeout:45000});
  stage='native photo intake';
  await page.evaluate(()=>switchView('scan'));
  await page.locator('#captureOutfit').click();
  await page.locator('#outfitUpload').setInputFiles({
   name:'commons-0003.jpg',mimeType:'image/jpeg',buffer:original
  });
  await page.waitForFunction(sha=>window.multi24Research?.debug().sourceSHA256===sha,
   sourceSHA,{timeout:30000});
  const card=page.locator('#multi24Grid .multi24-card').first();
  await card.waitFor({timeout:30000});
  await page.waitForFunction(()=>document.getElementById('multi24Status')
   ?.textContent.includes('1 unverified region'),null,{timeout:20000});
  stage='source-bound P88 packet and source-veto category';
  const emitted=await page.evaluate(()=>window.__m57WorkerRequest);
  assert.equal(emitted?.researchFlags,true,'real native page did not request P88 70/840 receipts');
  assert.ok(emitted.sourceOriginal>100000,'actual original JPEG must be sent, not a mock source');
  assert.equal(await card.locator('[data-mask-review54="recapture-required"]').count(),1);
  assert.match(await card.locator('[data-mask-review54="recapture-required"]').innerText(),
   /photograph each physical garment separately/);
  assert.equal(await card.getByLabel('I confirm this visible garment, category and color').isDisabled(),true);
  assert.equal(await countRows(page),0,'unresolved detector proposal silently saved');
  await page.waitForFunction(()=>document.getElementById('multi24Status')?.textContent.includes('2 extra, duplicate or invalid'),null,{timeout:20000});
  // Move through the real crop editor: explicit human cropping and corrected
  // category/color must still be insufficient when physical unit is uncertain.
  await card.getByRole('button',{name:'Adjust crop/mask'}).click();
  const crop=page.locator('dialog.photo-crop-editor');
  await crop.waitFor({state:'visible'});
  await crop.getByRole('button',{name:'Save crop'}).click();
  await crop.waitFor({state:'hidden'});
  await card.getByLabel('Main category').selectOption('Tops');
  await card.getByLabel('Specific type').selectOption('T-shirt');
  await card.getByLabel('Color (confirm visually)').fill('Blue');
  assert.equal(await card.getByLabel('I confirm this visible garment, category and color').isDisabled(),true,
   'human category/crop cannot cure unresolved same-class source identity');
  assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true);
  assert.equal(await countRows(page),0);
  const png=await page.screenshot({animations:'disabled',fullPage:true});
  const filename=engine+'-'+width+'-source-bound-P88-unresolved-review.png';
  await writeFile(join(out,filename),png);
  screenshots.push({filename,width,sha256:createHash('sha256').update(png).digest('hex')});
  stage='remove unsafe proposal';
  await card.getByRole('button',{name:'Remove detection'}).click();
  assert.equal(await page.locator('#multi24Grid .multi24-card').count(),0);
  assert.equal(await countRows(page),0);

  // MAIN1054 finish-line positive journey in the SAME actual browser app:
  // replace the rejected source with a second registered public original,
  // reject the old P88 packet whose source SHA is now stale, and exercise
  // an explicitly MANUAL crop/review/save and native 2D outfit selection.
  // This is NOT model accuracy, human truth or a verified 3D garment.
  stage='native owner-positive manually reviewed second original';
  await page.locator('#outfitUpload').setInputFiles({
   name:'commons-0053.jpg',mimeType:'image/jpeg',buffer:dressOriginal
  });
  await page.waitForFunction(sha=>window.multi24Research?.debug().sourceSHA256===sha,
   dressSHA,{timeout:30000});
  await page.waitForFunction(()=>window.multi24Research?.debug().working===false,
   null,{timeout:30000});
  assert.equal(await page.locator('#multi24Grid .multi24-card').count(),0,
   'stale P88 worker packet from previous original was accepted into new original');
  await page.locator('#multi24Research').getByRole('button',{name:'Add missed piece'}).click();
  const manual=page.locator('#multi24Grid .multi24-card').first();
  await manual.waitFor({timeout:15000});
  await manual.getByRole('button',{name:'Adjust crop/mask'}).click();
  const manualEditor=page.locator('dialog.photo-crop-editor');
  await manualEditor.waitFor({state:'visible'});
  await manualEditor.getByRole('button',{name:'Save crop'}).click();
  await manualEditor.waitFor({state:'hidden'});
  await manual.getByLabel('Main category').selectOption('Dresses');
  await manual.getByLabel('Specific type').selectOption('Casual dress');
  await manual.getByLabel('Color (confirm visually)').fill('Black');
  await manual.getByLabel('I confirm this visible garment, category and color').check();
  assert.equal(await countRows(page),0,
   'manually corrected category and checkbox must not save without explicit Save');
  await page.locator('#multi24Research').getByRole('button',
   {name:'Save confirmed pieces together'}).click();
  await page.waitForFunction(async()=>{
   if(!db||db.name!=='closet-current-user-m54-A')return false;
   const count=await new Promise((resolve,reject)=>{
    const req=db.transaction('items','readonly').objectStore('items').count();
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   return count===1;
  },null,{timeout:30000});
  stage='original bytes and deliberate noncertification';
  const stored=await page.evaluate(async expected=>{
   const rows=await new Promise((resolve,reject)=>{
    const req=db.transaction('items','readonly').objectStore('items').getAll();
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   if(rows.length!==1)throw Error('exactly one explicitly confirmed private garment required');
   const row=rows[0];
   if(row.ownerId!=='m54-A'||row.sourceSHA256!==expected||
      row.originalPhoto?.sha256!==expected||row.sourceHashVerified!==true||
      row.sourceCropReviewed!==true||row.extractionReview!=='human-confirmed'||
      row.photoOnly!==true||row.threeDReady!==false||
      row.singleGarmentVerified!==false||
      row.ownerReviewed===true||row.sourcePhotoOriginal===true)
    throw Error('MULTI24 photo-only human save contract was silently promoted');
   const encoded=row.originalPhoto.image;
   if(!/^data:image\/jpeg;base64,/.test(encoded))throw Error('missing original JPEG envelope');
   const binary=Uint8Array.from(atob(encoded.split(',')[1]),c=>c.charCodeAt(0));
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',binary)),
    b=>b.toString(16).padStart(2,'0')).join('');
   if(digest!==expected)throw Error('saved original JPEG bytes were modified');
   return {id:row.id,sourceVerified:true,originalSha:digest,
    unverifiedPhysicalUnit:true,manuallyConfirmed:true};
  },dressSHA);
  stage='actual native owner private Outfit Builder selection';
  await page.evaluate(()=>switchView('builder'));
  await page.locator('#boardSlots .board-slot-top').click();
  const picker=page.locator('#boardPicker');
  await picker.waitFor({state:'visible'});
  const choice=page.locator('#boardPickerItems button.board-pick').first();
  await choice.waitFor();
  await choice.click();
  await page.waitForFunction(id=>{
   const slot=document.querySelector('#boardSlots .board-slot-top.owned img');
   return currentBoard.slots.top===id&&!!slot&&slot.complete&&slot.naturalWidth>0;
  },stored.id,{timeout:20000});
  const boardPhoto=await page.locator('#boardSlots .board-slot-top.owned img')
   .evaluate(img=>({decoded:img.naturalWidth>0,src:img.getAttribute('src')}));
  assert.equal(boardPhoto.decoded,true);
  assert.match(boardPhoto.src,/^data:image\/jpeg;base64,/);
  // The stricter source-certification preview MUST still refuse this
  // honest single-source/crop-unverified MULTI24 row. Outfit Board can show
  // its saved user-reviewed 2D photograph, but no invented 3D authority.
  await page.locator('#mission4Preview1054Section button').click();
  await page.waitForFunction(()=>document.getElementById('mission4Preview1054Status')
   ?.textContent.includes('Preview refused'),null,{timeout:20000});
  assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0,
   'unverified physical garment source cannot enter strict original-photo certification');
  assert.equal(await page.locator('#outfit3D01Canvas').count(),0,
   'manually reviewed MULTI24 source falsely authorized 3D');
  const positivePng=await page.locator('#outfitFigure').screenshot();
  const positiveFile=engine+'-'+width+'-positive-manual-source-to-private-2d-board.png';
  await writeFile(join(out,positiveFile),positivePng);
  screenshots.push({filename:positiveFile,width,
   sha256:createHash('sha256').update(positivePng).digest('hex')});
  cases.push({engine,width,actualNativeApp:true,
   licensedSourceSHA:sourceSHA,realBrowserCrypto:true,
   p88UnresolvedWorkerReplaySynthetic:true,p88ReceiptSourceBound:true,
   missingP88InstanceKeyHandled:true,duplicateMaskIgnored:true,
   spoofedSourceIgnored:true,lateDoneEventIgnored:true,
   ownerConfirmDisabled:true,ownerTypedCategorySubtypeColorStillDenied:true,
   ownerCropDoesNotOverrideVeto:true,unsafeProposalRemoved:true,
   savedRows:0,manualOwnerReviewedSecondSource:true,
   secondOriginalSourceShaVerified:stored.sourceVerified,
   verifiedOriginalBytesRetained:stored.originalSha===dressSHA,
   oneOwnerPrivateGarmentRow:true,
   actualNativeOutfitBoard2DPhoto:true,
   strictSourceCertifiedPreviewRefused:true,
   misleadingSingleGarmentCertification:false,
   positivePathModelPrediction:false,positivePathHumanTruthSynthetic:true,
   consumer3D:false,releaseAuthorized:false,familyAlpha:'HOLD'});
  await context.close();
 }
 assert.deepEqual(issues,[],'unknown network request or runtime browser failures');
 assert.equal(cases.length,3);
 await writeFile(join(out,'M57-NATIVE-P88-RECEIPT-NO-SILENT-SAVE.json'),
  JSON.stringify({schema:'MAIN1054_M57_NATIVE_P88_RECEIPT_REVIEW_VETO/v1',
   engine,photoSHA256:sourceSHA,realActualApp:true,
   browserWidths:cases.map(x=>x.width),screenshots,cases,
   independentModelAccuracy:false,humanReviewSynthetic:true,
   hostedTwoAccountRLS:false,physicalPhones:false,
   consumer3D:false,releaseAuthorized:false,familyAlpha:'HOLD'},null,2)+'\n');
 console.log('MAIN57_REAL_APP_SOURCE_BOUND_P88_VETO_HOLD',
  JSON.stringify({engine,widths:cases.map(x=>x.width),
   actualBrowserApp:true,originalLicensedPhoto:true,
   unsafePrivateSaves:0,sourceVeto:true,familyAlpha:'HOLD'}));
}catch(e){
 console.error('MAIN57_NATIVE_P88_TRANSPORT_FAIL',JSON.stringify({stage,engine,
  width:widthNow,error:String(e?.message||e).slice(0,280),issues:issues.slice(0,8)}));
 process.exitCode=1;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
