/** Main Mission 1 P846. Actual app.js Adjust source in real desktop
 * Chromium/WebKit, synthetic photos and mocked private IO only. Not physical
 * phone, hosted owner/cloud or real classifier acceptance.
 */
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {server82} from './p82-browser-server.mjs';
import {readFile} from 'node:fs/promises';
// P88: use a true byte-derived SHA for the original synthetic JPEG fixture.
// No family/public source photo or hosted owner account is used in this test.
const originalJpeg88=Buffer.from([255,216,255,224,0,16,1,2,3,4,255,217]);
const originalSource88='data:image/jpeg;base64,'+originalJpeg88.toString('base64');
const originalHash88=createHash('sha256').update(originalJpeg88).digest('hex');
const companionJpeg88=Buffer.from([255,216,255,224,21,22,23,255,217]);
const companionPhoto88='data:image/jpeg;base64,'+companionJpeg88.toString('base64');
const companionHash88=createHash('sha256').update(companionJpeg88).digest('hex');
const app=await readFile('public/app.js','utf8'),
 taxonomy=await readFile('public/taxonomy.js','utf8'),
 details=await readFile('public/clothing-details.js','utf8');
function extract(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'P846 source segment missing '+a);return app.slice(i,j);}
const source=extract('function savePiece(', 'function node(')+
 extract('function node(', 'function hasSourceBoundMask88(')+
 extract('function hasSourceBoundMask88(', '// P846:')+
 extract('function unit70Receipts(', 'function renderRecognitionNotice(')+
 extract('function candidate(', 'function queueAutomatic(');
const harness=[
 "const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];",
 "let items=[],batch=[],stream=null,cameraOpening=false,busy=false,localReady=true,session=0;",
 "const reviewFirst836=true;const ui88={};const $=id=>(ui88[id]??={hidden:false,textContent:'',src:''});",
 // Keep the browser's original P846 native Adjust source, but provide the
 // same signed owner/IDB transaction boundary required by the new P88 guard.
 "let db={name:'closet-current-user-owner-A',transaction(stores,mode){if(mode!=='readwrite')throw Error('P88_EXPECTED_WRITE');const tx={objectStore(name){return {put(value){if(name==='items'){window.writeCount++;tx.saved=structuredClone(value);}else if(name==='state')tx.next=structuredClone(value);else throw Error('UNKNOWN_STORE');}}}};window.completions.push({resolve(){if(tx.next)window.draftSnapshots.push(tx.next);window.stored.push(tx.saved);tx.oncomplete?.();},reject(error){tx.error=error||Error('REJECT');tx.onerror?.();}});return tx;}};",
 "const queued=async fn=>{await window.beforeWriteTest?.();return fn();};",
 "const originalSource88="+JSON.stringify(originalSource88),
 "const sourceHash88="+JSON.stringify(originalHash88),
 "const companionPhoto88="+JSON.stringify(companionPhoto88),
 "const localPending=new Set(),sessionCapturedIds=new Set();",
 "const checkPhoto=async()=>({colorEstimate:null,signature:[],aspect:1});",
 "const openPhotoCrop=(item,callbacks)=>{window.crop88Editor=callbacks;return Promise.resolve();};",
 "window.closetAuth={user:{id:'owner-A'}};",
 "window.writeCount=0;window.stored=[];window.completions=[];window.draftSnapshots=[];window.messageText='';",
 "const removeItem=async()=>{};",
 "const persistDraft=async()=>{window.persistDraftCount=(window.persistDraftCount||0)+1;};",
 "const render=()=>{};",
 "const scheduleMemoryReview=()=>{};",
 "const stopCamera=()=>{};",
 "const queueAutomatic=()=>{window.autoQueueCount=(window.autoQueueCount||0)+1;};",
 "const message=x=>window.messageText=x;",
 "const sh=n=>Number(n).toString(16).padStart(64,'0');",
 "const receipt=(owner,m)=>({ownerId:owner,sourceSha256:sourceHash88,maskSha256:sh(m)});",
 "window.setup846=(status='paired_confirmed',account='owner-A',dup=false)=>{",
 "  for(const old of document.querySelectorAll('dialog'))old.remove();",
 "  window.closetAuth.user.id=account;window.writeCount=0;window.stored=[];window.completions=[];window.messageText='';",
 "  const item={id:'pair',image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==',",
 "    name:'Black shoes',category:'Shoes',itemType:'Sneakers',color:'Black',",
 "    colorSource:'photo-estimate',seasons:[],userAdjusted:false,outfitSourceId:'outfit-source',",
 "    originalPhoto:{image:originalSource88},requiresOwnershipConfirmation:true,reconciliation70Status:status,reconciliation70:receipt('owner-A',11),",
 "    shoePair:{confirmedByOwner:true,companion:{image:companionPhoto88,reconciliation70:receipt('owner-A',12)}}};",
 "  batch=[item];items=dup?[{id:'old',image:'data:image/jpeg;base64,QUJD',category:'Shoes',itemType:'Sneakers',color:'Black',reconciliation70:receipt('owner-A',12)}]:[];",
 "  adjustPhoto(item);return item;",
 "};",
 "window.setupExactSaved88=()=>{",
 "  window.closetAuth.user={id:'owner-A'};session=0;window.autoQueueCount=0;window.persistDraftCount=0;",
 "  items=[{id:'already-owned',image:originalSource88,category:'Tops',itemType:'T-shirt',color:'Blue'}];",
 "  batch=[];return candidate(originalSource88);",
 "};",
 "window.setupCrop88=()=>{",
 "  for(const old of document.querySelectorAll('dialog'))old.remove();",
 "  window.closetAuth.user={id:'owner-A'};window.beforeWriteTest=null;window.releaseCrop88=null;",
 "  window.draftSnapshots=[];window.completions=[];window.stored=[];window.crop88Editor=null;window.messageText='';",
 "  const item={id:'crop-88',image:originalSource88,name:'Blue shirt',category:'Tops',itemType:'T-Shirt',color:'Blue',",
 "   seasons:[],userAdjusted:false,requiresOwnershipConfirmation:true};",
 "  batch=[item];items=[];cropClothingPhoto(item);return item;",
 "};"
].join('\n');
// Web Crypto is intentionally unavailable at insecure about:blank. The same
// ephemeral loopback test host used by P82 exercises actual browser SHA-256.
const {server,origin}=await server82();
try{
for(const [browserName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(browserName==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:850},hasTouch:true,isMobile:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/');
   assert.equal(await page.evaluate(()=>isSecureContext&&!!crypto.subtle),true,'real browser SHA-256 must be available');
   for(const s of [taxonomy,details,harness,source])await page.addScriptTag({content:s});
   const approve=async()=>page.getByRole('checkbox',{name:/I checked the clothing photo/}).check();
   const submit=async(times=1)=>page.locator('dialog form').evaluate((form,n)=>{
    for(let i=0;i<n;i++)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   },times);
   // Unsafe unresolved unit: reviewed category/color alone cannot admit one of two shoe regions.
   await page.evaluate(()=>window.setup846('unresolved'));await approve();await submit();
   assert.equal(await page.evaluate(()=>window.writeCount),0);
   assert.equal(await page.evaluate(()=>batch.length),1);
   // Cross-owner replay, even if checked, must fail closed.
   await page.evaluate(()=>window.setup846('paired_confirmed','owner-B'));await approve();await submit();
   assert.equal(await page.evaluate(()=>window.writeCount),0);
   // Already saved companion mask: cannot insert a duplicate item via another card.
   await page.evaluate(()=>window.setup846('paired_confirmed','owner-A',true));await approve();await submit();
   assert.equal(await page.evaluate(()=>window.writeCount),0);
   // Genuine user acknowledgement with consistent owner/receipts creates exactly one unit.
   await page.evaluate(()=>window.setup846('paired_confirmed','owner-A',false));
   assert.equal(await page.getByAltText(/Second original garment region confirmed/).count(),1);
   assert.equal(await page.getByAltText(/Original complete outfit photo/).count(),1,'the owner sees original source next to crop');
   await approve();await submit(2);
   // SHA-256 is asynchronous. Wait for actual source-bound IDB arrival, not
   // merely for synchronous form dispatch to return.
   await page.waitForFunction(()=>window.writeCount===1,{timeout:10000});
   assert.equal(await page.evaluate(()=>window.writeCount),1);
   assert.equal(await page.getByRole('button',{name:'Saving…'}).isDisabled(),true);
   await page.evaluate(()=>window.completions.shift().resolve());
   await page.waitForFunction(()=>window.stored.length===1&&items.length===1&&batch.length===0);
   const result=await page.evaluate(()=>({
     saved:window.stored.length,finalClosetItems:items.length,
     pairedOwner:items[0]?.shoePair?.confirmedByOwner,
     keptCompanion:Boolean(items[0]?.shoePair?.companion?.image),
     status:items[0]?.reconciliation70Status,
     secondMask:items[0]?.shoePair?.companion?.reconciliation70?.maskSha256,
     ownerReceipt:items[0]?.ownerSourceReview88
   }));
   assert.equal(result.saved,1);
   assert.equal(result.finalClosetItems,1);
   assert.equal(result.pairedOwner,true);
   assert.equal(result.keptCompanion,true);
   assert.equal(result.status,'paired_confirmed');
   assert.match(result.secondMask,/^[a-f0-9]{64}$/);
   assert.equal(result.ownerReceipt?.schema,'p88-owner-source-review/v1');
   assert.equal(result.ownerReceipt?.ownerId,'owner-A');
   assert.equal(result.ownerReceipt?.sourceId,'outfit-source');
   assert.equal(result.ownerReceipt?.originalPhotoSha256,originalHash88);
   assert.equal(result.ownerReceipt?.companionMaskSha256,result.secondMask);
   assert.equal(result.ownerReceipt?.companionImageSha256,companionHash88);
   assert.equal(result.ownerReceipt?.companionImageBytesVerified,true);
   assert.equal(result.ownerReceipt?.category,'Shoes');
   assert.equal(result.ownerReceipt?.physicalUnitDecision,'paired_confirmed');
   assert.equal(result.ownerReceipt?.ownerReviewed,true);
   assert.equal(result.ownerReceipt?.sourcePhotoOriginal,true);
   assert.equal(result.ownerReceipt?.independentPhysicalItemVerified,false);
   assert.equal(result.ownerReceipt?.singleGarmentVerified,false);
   assert.equal(result.ownerReceipt?.threeDReady,false);
   // The *native* camera entry must retain an intentional re-capture of an
   // already-saved original as UNSAVED owner-reviewed physical-unit evidence,
   // never silently dismiss it or auto-index an identical owned garment.
   const capturedAgain=await page.evaluate(()=>window.setupExactSaved88());
   assert.equal(capturedAgain,true);
   const identicalCapture=await page.evaluate(()=>({
    originalItemCount:items.length,
    existingId:items[0].id,
    pending:batch.length,
    identicalBytes:batch[0]?.image===items[0]?.image,
    unclassified:batch[0]?.category==='Uncategorized',
    requiresHuman:batch[0]?.requiresOwnershipConfirmation===true,
    possibleDuplicate:batch[0]?.possibleDuplicate===true,
    localAnalyzed:batch[0]?.localAnalyzed===true,
    status:batch[0]?.localStatus,
    scannerCalls:window.autoQueueCount,backups:window.persistDraftCount,
    duplicatePendingAccepted:candidate(originalSource88)
   }));
   assert.equal(identicalCapture.originalItemCount,1);
   assert.equal(identicalCapture.existingId,'already-owned');
   assert.equal(identicalCapture.pending,1);
   assert.equal(identicalCapture.identicalBytes,true);
   assert.equal(identicalCapture.unclassified,true);
   assert.equal(identicalCapture.requiresHuman,true);
   assert.equal(identicalCapture.possibleDuplicate,true);
   assert.equal(identicalCapture.localAnalyzed,true);
   assert.match(identicalCapture.status,/Original kept unsaved for owner comparison/);
   assert.equal(identicalCapture.scannerCalls,0);
   assert.equal(identicalCapture.backups,1);
   assert.equal(identicalCapture.duplicatePendingAccepted,false);
   console.log('M1_P88_BROWSER_EXACT_PHOTO_OWNER_REVIEW',JSON.stringify({
    browser:browserName,width,savedOriginalRetained:true,
    duplicateRescanKeptUnsaved:true,secondPendingFrameCoalesced:true,
    noModelAutoClassification:true,noAutoSave:true,pageErrors:errors.length
   }));
   // The owner must provide a SECOND, explicit physical-item decision for
   // exact saved JPEGs. Main category, color and the general review checkbox
   // alone are not distinct physical-garment evidence.
   await page.evaluate(()=>adjustPhoto(batch[0]));
   assert.equal(await page.getByAltText(/Already saved photograph exactly matching/).count(),1);
   const savedPreview=page.locator('dialog');
   await savedPreview.getByLabel('Main category').selectOption('Tops');
   await savedPreview.getByLabel('Color').fill('Blue');
   await approve();
   assert.equal(await page.getByRole('button',{name:'Save changes'}).isDisabled(),true,
    'general model/owner review cannot bypass identical saved source');
   await submit();
   assert.equal(await page.evaluate(()=>window.writeCount),0);
   await savedPreview.getByRole('checkbox',{
    name:/I physically checked this is a different owned garment/
   }).check();
   assert.equal(await page.getByRole('button',{name:'Save changes'}).isEnabled(),true);
   await submit(2);
   await page.waitForFunction(()=>window.writeCount===1);
   await page.evaluate(()=>window.completions.shift().resolve());
   await page.waitForFunction(()=>window.stored.length===1&&items.length===2&&batch.length===0);
   const distinctReceipt=await page.evaluate(()=>items[1]?.ownerDuplicateReview88);
   assert.equal(distinctReceipt?.schema,'p88-distinct-physical-owner-attestation/v1');
   assert.deepEqual(distinctReceipt?.identicalSavedPhotoItemIds,['already-owned']);
   assert.equal(distinctReceipt?.ownerAttestedDistinctPhysicalItem,true);
   assert.equal(distinctReceipt?.independentPhysicalItemVerified,false);
   assert.equal(distinctReceipt?.singleGarmentVerified,false);
   assert.equal(distinctReceipt?.threeDReady,false);
   console.log('M1_P88_BROWSER_EXACT_PHYSICAL_OWNER_GATE',JSON.stringify({
    browser:browserName,width,generalReviewAloneRejected:true,
    exactSavedPeerPhotoVisible:true,distinctPhysicalItemOwnerConfirmed:true,
    duplicateStoredOnlyAfterSeparateAttestation:true,threeDAuthority:false,
    pageErrors:errors.length
   }));
   // Source-execute the actual native Crop controller in real Chromium and
   // WebKit. The crop editor transport and signed owner are synthetic; no
   // real model inference or private owner is claimed by these checks.
   await page.evaluate(()=>window.setupCrop88());
   await page.evaluate(()=>{
    window.beforeWriteTest=()=>new Promise(resolve=>{window.releaseCrop88=resolve;});
    window.cropPromise88=window.crop88Editor.save({
     image:'data:image/jpeg;base64,TkVXUElYRUxT',
     cropBounds:{x:0,y:0,width:1,height:1}
    },null);
   });
   await page.waitForFunction(()=>typeof window.releaseCrop88==='function');
   await page.evaluate(()=>{
    batch.push({id:'second-photo-88',image:'data:image/jpeg;base64,TkVYVA=='});
    window.releaseCrop88();
   });
   await page.waitForFunction(()=>window.completions.length===1);
   await page.evaluate(()=>window.completions.shift().resolve());
   await page.evaluate(()=>window.cropPromise88);
   const cropResult=await page.evaluate(()=>({
    savedImage:batch[0]?.image,
    noItemAutoSaved:items.length===0,
    retainedNewDraft:batch.some(x=>x.id==='second-photo-88'),
    savedDraftImages:window.draftSnapshots.at(-1)?.batch.map(x=>x.image),
    reviewStillRequired:batch[0]?.requiresOwnershipConfirmation===true
   }));
   assert.equal(cropResult.savedImage,'data:image/jpeg;base64,TkVXUElYRUxT');
   assert.equal(cropResult.noItemAutoSaved,true);
   assert.equal(cropResult.retainedNewDraft,true);
   assert.equal(cropResult.savedDraftImages.length,2);
   assert.equal(cropResult.reviewStillRequired,true);
   // A renewed same-ID account during queued crop cannot use an old photo
   // or write into the signed owner's IndexedDB.
   await page.evaluate(()=>window.setupCrop88());
   await page.evaluate(()=>{
    window.beforeWriteTest=()=>new Promise(resolve=>{window.releaseCrop88=resolve;});
    window.cropPromise88=window.crop88Editor.save({
     image:'data:image/jpeg;base64,TkVXUElYRUxT',
     cropBounds:{x:0,y:0,width:1,height:1}
    },null).then(()=>({status:'accepted'}),e=>({status:'blocked',error:e.message}));
   });
   await page.waitForFunction(()=>typeof window.releaseCrop88==='function');
   await page.evaluate(()=>{
    window.closetAuth.user={id:'owner-A'};
    window.releaseCrop88();
   });
   const revokedCrop=await page.evaluate(()=>window.cropPromise88);
   assert.equal(revokedCrop.status,'blocked');
   assert.match(revokedCrop.error,/P88_STALE_CROP_OWNER_OR_SOURCE/);
   assert.equal(await page.evaluate(()=>window.completions.length),0);
   assert.equal(await page.evaluate(()=>batch[0].image),originalSource88);
   console.log('M1_P88_BROWSER_SIGNED_CROP',JSON.stringify({
    browser:browserName,width,sourceBoundOriginalPreserved:true,
    lateSecondDraftPreserved:true,sameIdSessionReplayBlocked:true,
    noAutomaticClosetSave:true,pageErrors:errors.length
   }));
   assert.deepEqual(errors,[]);
   console.log('M1_P846_BROWSER_OWNER_UNIT_REVIEW',JSON.stringify({
    browser:browserName,width,unresolvedBlocked:true,crossOwnerBlocked:true,
    companionDuplicateBlocked:true,pairedOneClosetUnit:true,sourceMasksRetained:true,
    repeatedSubmitBlocked:true,originalSourceShown:true,unpromotedOwnerReceipt:true,pageErrors:0}));
   await page.close();
  }
 }finally{await browser.close();}
}

}finally{await new Promise(resolve=>server.close(resolve));}
