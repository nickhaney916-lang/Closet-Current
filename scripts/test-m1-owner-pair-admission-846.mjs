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
 cropEngineSrc=await readFile('public/photo-crop-engine.js','utf8'),
 cropEditorSrc=await readFile('public/photo-crop-editor.js','utf8'),
 taxonomy=await readFile('public/taxonomy.js','utf8'),
 details=await readFile('public/clothing-details.js','utf8');
function extract(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'P846 source segment missing '+a);return app.slice(i,j);}
const source=extract('function savePiece(', 'function node(')+
 extract('function node(', 'function hasSourceBoundMask88(')+
 extract('function hasSourceBoundMask88(', '// P846:')+
 extract('function unit70Receipts(', 'function renderRecognitionNotice(')+
 extract('function candidate(', 'function queueAutomatic(')+
 // Keep candidate()'s inherited fake backup for its existing UX checks, but
 // source-execute the REAL native persistDraft body under a separate local
 // test alias for the new IndexedDB transactional backup acceptance.
 extract('function persistDraft()', 'function readDraft()')
  .replace('function persistDraft(){','function realPersistDraft88(){');
// Browser-only exception witness: never silently turn a rejected review into
// a 30s timeout or a fake success. The actual consumer source stays unchanged.
const checkedSource=source.replace(
 "const conflictMessage88=ownerReviewedSaveConflict88(error);",
 "window.p846LastSaveError=String(error?.message||error);\n  const conflictMessage88=ownerReviewedSaveConflict88(error);"
);
if(checkedSource===source)throw Error('P846 native save error handler changed');
// Diagnostic only: extract all fields from the real transactional guard. Keep
// its refusal intact rather than weakening the app to satisfy a mock fixture.
const instrumentedSource=checkedSource.replace(
 "throw Error('P88_SOURCE_DRAFT_STORAGE_CHANGED');",
 `{window.p846DraftCAS={live:sourceSaveLeaseLive88(lease),
  known:draftStoreRevision88,expected,
  persisted:JSON.stringify(read.result?.batch??null),
  liveBatch:JSON.stringify(batch),captured:liveBatchRevision,
  duplicate:duplicateUnit70InCloset(value,items)};
  throw Error('P88_SOURCE_DRAFT_STORAGE_CHANGED');}`
);
const harness=[
 "const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];",
 "let items=[],batch=[],stream=null,cameraOpening=false,busy=false,localReady=true,session=0;",
 "let draftStoreRevision88='null';",
 "const reviewFirst836=true;const ui88={};const $=id=>(ui88[id]??={hidden:false,textContent:'',src:''});",
 // Keep the browser's original P846 native Adjust source, but provide the
 // same signed owner/IDB transaction boundary required by the new P88 guard.
 "let db={name:'closet-current-user-owner-A',transaction(stores,mode){if(mode!=='readwrite')throw Error('P88_EXPECTED_WRITE');const tx={objectStore(name){return {get(key){if(name!=='state'||key!=='draft')throw Error('P88_EXPECTED_DRAFT_READ');const req={result:structuredClone(window.p846StoredDraft??{id:'draft',batch:[]})};queueMicrotask(()=>req.onsuccess?.());return req;},getAll(){if(name!=='items')throw Error('P88_EXPECTED_SAVED_ITEMS');const req={result:structuredClone(items)};queueMicrotask(()=>req.onsuccess?.());return req;},add(value){if(name!=='items')throw Error('P88_INSERT_ONLY_ITEMS');window.lastItemWriteMethod='add';window.writeCount++;tx.saved=structuredClone(value);},put(value){if(name==='items'){window.lastItemWriteMethod='put';window.writeCount++;tx.saved=structuredClone(value);}else if(name==='state')tx.next=structuredClone(value);else throw Error('UNKNOWN_STORE');}}}};window.completions.push({resolve(){if(tx.next){window.p846StoredDraft=structuredClone(tx.next);window.draftSnapshots.push(tx.next);}window.stored.push(tx.saved);tx.oncomplete?.();},reject(error){tx.error=error||Error('REJECT');tx.onabort?.();}});return tx;}};",
 "const queued=async fn=>{await window.beforeWriteTest?.();return fn();};",
 "const originalSource88="+JSON.stringify(originalSource88),
 "const sourceHash88="+JSON.stringify(originalHash88),
 "const companionPhoto88="+JSON.stringify(companionPhoto88),
 "const localPending=new Set(),sessionCapturedIds=new Set();",
 "const checkPhoto=async()=>({colorEstimate:null,signature:[],aspect:1});",
 "const openPhotoCrop=(item,callbacks)=>{window.crop88Editor=callbacks;return Promise.resolve();};",
 "window.closetAuth={user:{id:'owner-A'}};",
 "window.writeCount=0;window.lastItemWriteMethod=null;window.stored=[];window.completions=[];window.draftSnapshots=[];window.messageText='';",
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
 "  draftStoreRevision88=JSON.stringify(batch);",
 "  window.p846StoredDraft={id:'draft',batch:structuredClone(batch)};",
 "  adjustPhoto(item);return item;",
 "};",
 "window.setupExactSaved88=()=>{",
 "  window.closetAuth.user={id:'owner-A'};session=0;window.autoQueueCount=0;window.persistDraftCount=0;",
 "  window.writeCount=0;window.stored=[];window.completions=[];window.draftSnapshots=[];window.beforeWriteTest=null;",
 "  items=[{id:'already-owned',image:originalSource88,category:'Tops',itemType:'T-shirt',color:'Blue'}];",
 "  batch=[];const accepted=candidate(originalSource88);draftStoreRevision88=JSON.stringify(batch);window.p846StoredDraft={id:'draft',batch:structuredClone(batch)};return accepted;",
 "};",
 "window.setupCropDuplicate88=()=>{",
 "  for(const old of document.querySelectorAll('dialog'))old.remove();",
 "  window.closetAuth.user={id:'owner-A'};window.beforeWriteTest=null;window.releaseCrop88=null;",
 "  window.draftSnapshots=[];window.completions=[];window.stored=[];window.crop88Editor=null;window.writeCount=0;",
 "  const saved={id:'saved-photo-exact',image:originalSource88,category:'Tops',itemType:'T-shirt',color:'Blue'};",
 "  const draft={id:'crop-exact',image:originalSource88,name:'Photo needing crop',category:'Tops',itemType:'T-shirt',color:'Blue',",
 "   seasons:[],userAdjusted:false,requiresOwnershipConfirmation:true,possibleDuplicate:true,",
 "   exactSavedPhotoMatch88:{savedItemId:saved.id}};",
 "  items=[saved];batch=[draft];cropClothingPhoto(draft);return draft;",
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
const cameraSource88=extract('function cameraOwnerLive88(', 'function waitEvent(');
const selectedBrowser88=process.env.M1_BROWSER_846;
if(selectedBrowser88&&!['chromium','webkit'].includes(selectedBrowser88))
 throw Error('M1_BROWSER_846 must be chromium or webkit');
try{
for(const [browserName,engine] of Object.entries({chromium,webkit})){
 if(selectedBrowser88&&selectedBrowser88!==browserName)continue;
 const browser=await engine.launch({headless:true,...(browserName==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:850},hasTouch:true,isMobile:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/');
   assert.equal(await page.evaluate(()=>isSecureContext&&!!crypto.subtle),true,'real browser SHA-256 must be available');
   for(const s of [taxonomy,details,harness,instrumentedSource])await page.addScriptTag({content:s});
   const approve=async()=>page.getByRole('checkbox',{name:/I checked the clothing photo/}).check();
   const submit=async(times=1)=>page.locator('dialog[open] form').evaluate((form,n)=>{
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
   await page.waitForFunction(()=>window.writeCount===1||!!window.p846LastSaveError,{timeout:10000});
   const sourceSaveDebug=await page.evaluate(()=>({writeCount:window.writeCount,
    failure:window.p846LastSaveError||null,ownerMessage:window.messageText||null,cas:window.p846DraftCAS||null}));
   assert.equal(sourceSaveDebug.failure,null,
    'P846 real source owner review failed: '+JSON.stringify(sourceSaveDebug));
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
   assert.equal(await page.getByAltText(/Previously saved garment photo with matching crop or shared original/).count(),1);
   const savedPreview=page.locator('dialog[open]');
   await savedPreview.getByLabel('Main category').selectOption('Tops');
   await savedPreview.locator('input[aria-label="Color"]').fill('Blue');
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
   assert.equal(await page.evaluate(()=>window.lastItemWriteMethod),'add',
    'ordinary owner-reviewed draft must be inserted, never replace an existing closet item');
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
   // The preview crop changes, but the full-size source still matches an
   // existing garment. Clear old attestations, not the physical duplicate gate.
   await page.evaluate(()=>window.setupCropDuplicate88());
   await page.evaluate(()=>{
    window.cropPromise88=window.crop88Editor.save({
     image:'data:image/jpeg;base64,TkVXUElYRUxT',
     cropBounds:{x:0,y:0,width:1,height:1}
    },null);
   });
   await page.waitForFunction(()=>window.completions.length===1);
   await page.evaluate(()=>window.completions.shift().resolve());
   await page.evaluate(()=>window.cropPromise88);
   const cropDuplicate=await page.evaluate(()=>{
    const v=batch[0],lease=reviewedSaveLease88(v);
    return {savedCount:items.length,pendingCount:batch.length,
     changedPhoto:v.image==='data:image/jpeg;base64,TkVXUElYRUxT',
     stillSameOriginal:v.originalPhoto?.image===originalSource88,
     sharedSourceMatch:v.exactSavedPhotoMatch88?.savedItemId==='saved-photo-exact',
     clearedOldAttestation:v.ownerDuplicateReview88===undefined,
     ownerReviewStillRequired:v.requiresOwnershipConfirmation===true,
     ownerDistinctReviewStillRequired:reviewedDistinctPhotoReceiptValid88(v,lease)===false};
   });
   assert.equal(cropDuplicate.savedCount,1);
   assert.equal(cropDuplicate.pendingCount,1);
   assert.equal(cropDuplicate.changedPhoto,true);
   assert.equal(cropDuplicate.stillSameOriginal,true);
   assert.equal(cropDuplicate.sharedSourceMatch,true);
   assert.equal(cropDuplicate.clearedOldAttestation,true);
   assert.equal(cropDuplicate.ownerReviewStillRequired,true);
   assert.equal(cropDuplicate.ownerDistinctReviewStillRequired,true);
   console.log('M1_P88_BROWSER_CROP_SHARED_ORIGINAL_OWNER_GATE',JSON.stringify({
    browser:browserName,width,rawOriginalPreserved:true,sharedSourceMatch:true,
    oldAttestationCleared:true,newCropRetainedAsUnsaved:true,
    reviewStillRequired:true,noAutomaticPhysicalDuplicateSave:true,
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
   // Native camera source, genuine DOM nodes and browser promise scheduling;
   // media permission/stream and accounts are synthetic transport doubles.
   // Use a closure so these handlers cannot replace the review harness globals.
   const cameraResult88=await page.evaluate(async source=>{
    const run=new Function('source', `return (async()=>{
     const nodes=new Map();
     const $=id=>{if(!nodes.has(id)){const n=document.createElement('div');
      n.value='1';nodes.set(id,n);}return nodes.get(id);};
     const owner={id:'camera-owner-A'};
     const window={document,closetAuth:{user:owner},AudioContext:class{async resume(){}}};
     let db={name:'closet-current-user-camera-owner-A'},stream=null,busy=false;
     let cameraMode=null,cameraOpening=false,cameraRequest=0,cameraOwnerLease88=null;
     let timer=null,audio=null,session=0,batch=[],cadence=null;
     let releasePlay,playReached=false,stops=0,photos=0,reviews=0;
     const navigator={mediaDevices:{async getUserMedia(){return {
      getTracks:()=>[{stop(){stops++;}}]
     };}}};
     const video=document.createElement('video');
     // Real HTMLMediaElement transport setters reject fake streams; override
     // only srcObject and play while retaining actual DOM/classList behavior.
     Object.defineProperty(video,'srcObject',{writable:true,value:null});
     video.play=()=>{playReached=true;return new Promise(r=>{releasePlay=r;});};
     const candidate=()=>{photos++;},snap=()=> 'synthetic-jpeg';
     const beep=()=>{},message=()=>{},switchView=()=>{reviews++;};
     const CaptureCadence=class{};
     eval(source);
     const pending=startCamera('manual');
     for(let i=0;i<20&&!playReached;i++)await Promise.resolve();
     if(!playReached)throw Error('camera play boundary not reached');
     window.closetAuth.user={id:'camera-owner-B'};
     db={name:'closet-current-user-camera-owner-B'};
     session=7;$('sessionCount').textContent='7';$('lastCaptureImage').hidden=false;
     releasePlay();await pending;
     takePhoto();finishScan();
     const preserved={session,count:$('sessionCount').textContent,
      previewHidden:$('lastCaptureImage').hidden,stops,photos,reviews};
     window.closetAuth.user=owner;db={name:'closet-current-user-camera-owner-A'};
     let releaseFirst,releaseSecond,requests=0;
     navigator.mediaDevices.getUserMedia=()=>new Promise(r=>{
      if(++requests===1)releaseFirst=r;else releaseSecond=r;
     });
     video.play=async()=>{};
     const first=startCamera('manual');
     for(let i=0;i<20&&!releaseFirst;i++)await Promise.resolve();
     if(!releaseFirst)throw Error('first permission boundary not reached');
     stopCamera();const cancelBusyReleased=!busy;
     const second=startCamera('manual');
     for(let i=0;i<20&&!releaseSecond;i++)await Promise.resolve();
     if(!releaseSecond)throw Error('cancelled camera blocked retry');
     releaseFirst({getTracks:()=>[{stop(){}}]});await first;
     const newBusyProtected=busy&&$('start').disabled;
     const nextStream={getTracks:()=>[{stop(){}}]};
     releaseSecond(nextStream);await second;
     const currentStreamRetained=stream===nextStream&&!busy;
     stopCamera();
     return {...preserved,cancelBusyReleased,newBusyProtected,currentStreamRetained};
    })()`);
    return run(source);
   },cameraSource88);
   assert.deepEqual(cameraResult88,{session:7,count:'7',previewHidden:false,
    stops:1,photos:0,reviews:0,cancelBusyReleased:true,newBusyProtected:true,
    currentStreamRetained:true});
   console.log('M1_P88_BROWSER_CAMERA_PLAY_OWNER_LEASE',JSON.stringify({
    browser:browserName,width,...cameraResult88,syntheticMediaTransport:true,
    physicalDeviceAcceptance:false
   }));
   console.log('M1_P846_BROWSER_OWNER_UNIT_REVIEW',JSON.stringify({
    browser:browserName,width,unresolvedBlocked:true,crossOwnerBlocked:true,
    companionDuplicateBlocked:true,pairedOneClosetUnit:true,sourceMasksRetained:true,
    repeatedSubmitBlocked:true,originalSourceShown:true,unpromotedOwnerReceipt:true,pageErrors:0}));
   // Actual native Chromium/WebKit IndexedDB isolation (synthetic owner/photos).
   // Never count a facade-only check as durable row compare-and-write evidence.
   const durableRow88=await page.evaluate(async()=>{
    window.beforeWriteTest=null;window.closetAuth.user={id:'owner-A'};
    const opened=indexedDB.open('closet-current-user-owner-A',2);
    const ownerDb=await new Promise((resolve,reject)=>{
     opened.onupgradeneeded=()=>{
      if(!opened.result.objectStoreNames.contains('items'))
       opened.result.createObjectStore('items',{keyPath:'id'});
      if(!opened.result.objectStoreNames.contains('state'))
       opened.result.createObjectStore('state',{keyPath:'id'});
     };
     opened.onsuccess=()=>resolve(opened.result);
     opened.onerror=()=>reject(opened.error);
    });
    db=ownerDb;
    const put=record=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     tx.objectStore('items').put(structuredClone(record));
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    const get=id=>new Promise((resolve,reject)=>{
     const request=db.transaction('items','readonly').objectStore('items').get(id);
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error);
    });
    const first={id:'native-88',image:originalSource88,
     originalPhoto:{image:originalSource88},
     recognitionPhoto:{image:originalSource88},
     ownerId:'owner-A',category:'Tops',itemType:'T-shirt',color:'Blue',
     ownerSourceReview88:{ownerReviewed:true,singleGarmentVerified:false,
      threeDReady:false},seasons:[],notes:'original'};
    await put(first);
    const local=structuredClone(first);items=[local];batch=[];
    await saveExistingPiece88({...local,color:'Green'},reviewedSaveLease88(local));
    const accepted=await get(first.id);
    const staleLease=reviewedSaveLease88(local);
    let deniedEdit=false;
    try{await saveExistingPiece88({...local,color:'Purple'},staleLease);}
    catch(e){deniedEdit=/P88_SAVED_EDITOR_STORAGE_CHANGED/.test(e.message);}
    const preservedEdit=(await get(first.id))?.color==='Green';
    items=[accepted];
    const deletionLease=reviewedSaveLease88(accepted);
    await put({...accepted,itemType:'Blouse'});
    let deniedDelete=false;
    try{await removeExistingPiece88(deletionLease);}
    catch(e){deniedDelete=/P88_SAVED_DELETE_STORAGE_CHANGED/.test(e.message);}
    const preservedDelete=(await get(first.id))?.itemType==='Blouse';
    items=[structuredClone(accepted)];
    const deletedLease=reviewedSaveLease88(items[0]);
    await new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     tx.objectStore('items').delete(first.id);
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    let deniedResurrection=false;
    try{await saveExistingPiece88({...items[0],color:'Yellow'},deletedLease);}
    catch(e){deniedResurrection=/P88_SAVED_EDITOR_STORAGE_CHANGED/.test(e.message);}
    const remainedDeleted=(await get(first.id))===undefined;
    ownerDb.close();
    return {accepted:accepted?.color==='Green',deniedEdit,preservedEdit,
     deniedDelete,preservedDelete,deniedResurrection,remainedDeleted};
   });
   assert.deepEqual(durableRow88,{accepted:true,deniedEdit:true,preservedEdit:true,
    deniedDelete:true,preservedDelete:true,deniedResurrection:true,
    remainedDeleted:true},'native IDB must preserve newer corrections');
   console.log('M1_P88_ACTUAL_BROWSER_IDB_SAVED_ROW_CAS',JSON.stringify({
    browser:browserName,width,durableUpdatedEdit:true,
    staleCrossTabCorrectionDenied:true,staleDeleteDenied:true,
    deletedRowCannotResurrect:true,syntheticOwner:true,physicalDevice:false,
    pageErrors:errors.length
   }));
   assert.deepEqual(errors,[]);
   const pendingPhoto88=await page.evaluate(async()=>{
    // Use the REAL IndexedDB transaction implementation in both engines.
    const opened=indexedDB.open('closet-current-user-owner-A');
    const ownerDb=await new Promise((resolve,reject)=>{
     opened.onsuccess=()=>resolve(opened.result);
     opened.onerror=()=>reject(opened.error);
    });
    db=ownerDb;window.closetAuth.user={id:'owner-A'};
    const putDraft=photos=>new Promise((resolve,reject)=>{
     const tx=db.transaction('state','readwrite');
     tx.objectStore('state').put({id:'draft',batch:structuredClone(photos)});
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    const getDraft=()=>new Promise((resolve,reject)=>{
     const req=db.transaction('state','readonly').objectStore('state').get('draft');
     req.onsuccess=()=>resolve(req.result?.batch||[]);
     req.onerror=()=>reject(req.error);
    });
    const getSaved=id=>new Promise((resolve,reject)=>{
     const req=db.transaction('items','readonly').objectStore('items').get(id);
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error);
    });
    const first={id:'real-pending-88',image:originalSource88,
     category:'Tops',itemType:'T-shirt',color:'Blue',notes:'owner original'};
    const second={id:'other-tab-original-88',image:companionPhoto88,
     category:'Dresses',itemType:'Dress',color:'Green'};
    items=[];batch=[first];
    await putDraft([first]);draftStoreRevision88=JSON.stringify([first]);
    const lease=reviewedSaveLease88(first);
    // A second tab appends another original while owner A reviews first.
    await putDraft([first,second]);
    let staleSaveRefused=false;
    try{await savePiece({...first},[],lease);}
    catch(e){staleSaveRefused=/P88_DRAFT_STORAGE_CHANGED/.test(e.message);}
    const otherPreservedBefore=(await getDraft()).some(x=>x.id===second.id);
    const noUnconfirmedSave=(await getSaved(first.id))===undefined;
    // Owner explicitly reloads the new durable source list, then confirms
    // only the first photo; the second original must survive that commit.
    batch=[first,second];draftStoreRevision88=JSON.stringify(batch);
    await savePiece({...first},[second],reviewedSaveLease88(first));
    const verifiedSaved=(await getSaved(first.id))?.color==='Blue';
    const afterSave=await getDraft();
    const secondSurvives=afterSave.length===1&&afterSave[0].id===second.id&&
      afterSave[0].image===second.image;
    // Another tab changes this remaining draft and the stale page attempts
    // to persist a different local revision; the native backup must abort.
    batch=[second];
    const newer={...second,color:'Purple'};
    await putDraft([newer]);
    await realPersistDraft88();
    const afterBackup=await getDraft();
    const backupBlocked=afterBackup[0]?.color==='Purple'&&afterBackup.length===1;
    ownerDb.close();
    return {staleSaveRefused,otherPreservedBefore,noUnconfirmedSave,
     verifiedSaved,secondSurvives,backupBlocked};
   });
   assert.deepEqual(pendingPhoto88,{staleSaveRefused:true,otherPreservedBefore:true,
    noUnconfirmedSave:true,verifiedSaved:true,secondSurvives:true,
    backupBlocked:true},'real IDB save/backup must not delete second-tab private originals');
   console.log('M1_P88_ACTUAL_BROWSER_DRAFT_CAS',JSON.stringify({
    browser:browserName,width,...pendingPhoto88,
    privatePhotos:false,syntheticOwner:true,physicalDevice:false,
    pageErrors:errors.length
   }));
   assert.deepEqual(errors,[]);
   // Actual IndexedDB, NOT a stub: browser tab B commits a same-photo garment
   // after tab A starts reviewing but BEFORE its atomic insert. Reject the
   // unreviewed duplicate without losing A's original pending draft.
   const durableNewDuplicate88=await page.evaluate(async()=>{
    const opened=indexedDB.open('closet-current-user-owner-A');
    const ownerDb=await new Promise((resolve,reject)=>{
     opened.onsuccess=()=>resolve(opened.result);
     opened.onerror=()=>reject(opened.error);
    });
    db=ownerDb;window.closetAuth.user={id:'owner-A'};window.beforeWriteTest=null;
    const putItem=row=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     tx.objectStore('items').put(structuredClone(row));
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    const getItem=id=>new Promise((resolve,reject)=>{
     const req=db.transaction('items','readonly').objectStore('items').get(id);
     req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    const putDraft=photos=>new Promise((resolve,reject)=>{
     const tx=db.transaction('state','readwrite');
     tx.objectStore('state').put({id:'draft',batch:structuredClone(photos)});
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    const getDraft=()=>new Promise((resolve,reject)=>{
     const req=db.transaction('state','readonly').objectStore('state').get('draft');
     req.onsuccess=()=>resolve(req.result?.batch||[]);
     req.onerror=()=>reject(req.error);
    });
    const image='data:image/jpeg;base64,UkVBTC1URVNU';
    const draft={id:'late-other-tab-draft-88',image,
     category:'Tops',itemType:'T-shirt',color:'Blue'};
    batch=[draft];items=[];
    await putDraft([draft]);draftStoreRevision88=JSON.stringify(batch);
    const lease=reviewedSaveLease88(draft);
    // Simulates an independent tab writing the same physical photo.
    const prior={id:'late-other-tab-saved-88',image,
     category:'Tops',itemType:'T-shirt',color:'Blue'};
    await putItem(prior);
    let staleDuplicateDenied=false;
    try{await savePiece({...draft},[],lease);}
    catch(e){staleDuplicateDenied=/P88_DURABLE_REVIEWED_DUPLICATE_CHANGED/.test(e.message);}
    const originalDraftSurvives=(await getDraft()).some(x=>x.id===draft.id&&x.image===image);
    const noSecondSavedItem=(await getItem(draft.id))===undefined;
    const firstSavedIntact=(await getItem(prior.id))?.image===image;
    // Distinct JPEG is still allowed after the owner reviews and provides a
    // new source photo; reject-all would not be a valid duplicate solution.
    const unique={...draft,id:'new-unique-owner-photo-88',
     image:'data:image/jpeg;base64,VU5JUVVFLVBIT1RP'};
    batch=[unique];await putDraft([unique]);
    draftStoreRevision88=JSON.stringify(batch);
    await savePiece({...unique},[],reviewedSaveLease88(unique));
    const uniqueCommitted=(await getItem(unique.id))?.image===unique.image;
    const uniqueDraftCleared=(await getDraft()).length===0;
    ownerDb.close();
    return {staleDuplicateDenied,originalDraftSurvives,noSecondSavedItem,
     firstSavedIntact,uniqueCommitted,uniqueDraftCleared};
   });
   assert.deepEqual(durableNewDuplicate88,{
    staleDuplicateDenied:true,originalDraftSurvives:true,noSecondSavedItem:true,
    firstSavedIntact:true,uniqueCommitted:true,uniqueDraftCleared:true
   },'actual IDB must deny late duplicate photos and still permit fresh originals');
   console.log('M1_P88_ACTUAL_BROWSER_DURABLE_NEW_DUPLICATE',JSON.stringify({
    browser:browserName,width,...durableNewDuplicate88,syntheticOwner:true,
    actualIndexedDB:true,physicalDevice:false,pageErrors:errors.length
   }));
   assert.deepEqual(errors,[]);

   // Same RAW original can yield distinct cropped review images. This is
   // not a new independent image nor evidence of two physical garments.
   // Native IDB: without a current explicit owner decision, fail closed.
   const sharedCroppedOriginal88=await page.evaluate(async()=>{
    const request=indexedDB.open('closet-current-user-owner-A');
    const ownerDb=await new Promise((resolve,reject)=>{
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error);
    });
    db=ownerDb;window.closetAuth.user={id:'owner-A'};window.beforeWriteTest=null;
    const putItem=v=>new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     tx.objectStore('items').put(structuredClone(v));
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    const getItem=id=>new Promise((resolve,reject)=>{
     const req=db.transaction('items','readonly').objectStore('items').get(id);
     req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    const setPending=values=>new Promise((resolve,reject)=>{
     const tx=db.transaction('state','readwrite');
     tx.objectStore('state').put({id:'draft',batch:structuredClone(values)});
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    const getPending=()=>new Promise((resolve,reject)=>{
     const req=db.transaction('state','readonly').objectStore('state').get('draft');
     req.onsuccess=()=>resolve(req.result?.batch||[]);
     req.onerror=()=>reject(req.error);
    });
    const raw='data:image/jpeg;base64,U0hBUkVELVJBVy1KUEVH';
    const old={id:'shared-original-first-88',
     image:'data:image/jpeg;base64,RklSU1QtQ1JPUA==',
     originalPhoto:{image:raw},category:'Tops',itemType:'T-shirt',color:'Blue'};
    const next={id:'shared-original-second-88',
     image:'data:image/jpeg;base64,U0VDT05ELUNST1A=',
     originalPhoto:{image:raw},category:'Tops',itemType:'T-shirt',color:'Red'};
    await putItem(old);
    batch=[next];items=[];await setPending([next]);
    draftStoreRevision88=JSON.stringify(batch);
    let staleCropBlocked=false;
    try{await savePiece({...next},[],reviewedSaveLease88(next));}
    catch(e){staleCropBlocked=/P88_DURABLE_REVIEWED_DUPLICATE_CHANGED/.test(e.message);}
    const preservedBeforeReview=(await getPending()).some(x=>x.id===next.id);
    items=[old];const lease=reviewedSaveLease88(next);
    const localSourceLinked=lease.exactPhotoPeers88.length===1&&
     lease.exactPhotoPeers88[0].id===old.id;
    let unapprovedBlocked=false;
    try{await savePiece({...next},[],lease);}
    catch(e){unapprovedBlocked=/P88_DISTINCT_OWNER_DECISION_REQUIRED/.test(e.message);}
    const ownerReceipt=reviewedDistinctPhotoReceipt88(lease);
    const approved={...next,ownerDuplicateReview88:ownerReceipt};
    // Simulated *explicit* owner decision; never independently certified.
    await putItem({...old,originalPhoto:{image:'data:image/jpeg;base64,TkVXLVJBVw=='}});
    let changedPeerBlocked=false;
    try{await savePiece(approved,[],lease);}
    catch(e){changedPeerBlocked=/P88_DURABLE_REVIEWED_DUPLICATE_CHANGED/.test(e.message);}
    await putItem(old);
    await savePiece(approved,[],lease);
    const distinctSaved=(await getItem(next.id))?.image===next.image;
    const untouchedOld=(await getItem(old.id))?.originalPhoto?.image===raw;
    const draftCleared=(await getPending()).length===0;
    const no3DCertification=(await getItem(next.id))?.ownerDuplicateReview88?.threeDReady===false;
    ownerDb.close();
    return {staleCropBlocked,preservedBeforeReview,localSourceLinked,
     unapprovedBlocked,changedPeerBlocked,distinctSaved,untouchedOld,draftCleared,
     no3DCertification};
   });
   assert.deepEqual(sharedCroppedOriginal88,{
    staleCropBlocked:true,preservedBeforeReview:true,localSourceLinked:true,
    unapprovedBlocked:true,changedPeerBlocked:true,distinctSaved:true,
    untouchedOld:true,draftCleared:true,no3DCertification:true
   },'actual IDB must require fresh approval for distinct crops of same raw original');
   console.log('M1_P88_BROWSER_SHARED_ORIGINAL_DIFFERENT_CROP',JSON.stringify({
    browser:browserName,width,...sharedCroppedOriginal88,
    syntheticOwnerAndPhoto:true,actualIndexedDB:true,physicalDevice:false,
    pageErrors:errors.length
   }));
   // A native owner UI refusal from a second tab is not a generic retry.
   // Reusing the old owner checkboxes must remain disabled until refresh.
   const prepareStaleOwnerReview=await page.evaluate(async()=>{
    const req=indexedDB.open('closet-current-user-owner-A');
    const ownerDb=await new Promise((resolve,reject)=>{
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error);
    });
    db=ownerDb;window.closetAuth.user={id:'owner-A'};
    const raw='data:image/jpeg;base64,T1JJR0lOQUwtSkRFUA==';
    const draft={id:'new-owner-review-conflict-88',
     image:'data:image/jpeg;base64,TkVXLUNST1A=',
     originalPhoto:{image:raw},name:'Red shirt',
     category:'Tops',itemType:'T-shirt',color:'Red',
     seasons:[],userAdjusted:false,requiresOwnershipConfirmation:true};
    batch=[draft];items=[];window.messageText='';
    window.beforeWriteTest=null;
    await new Promise((resolve,reject)=>{
     const tx=db.transaction('state','readwrite');
     tx.objectStore('state').put({id:'draft',batch:structuredClone(batch)});
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    draftStoreRevision88=JSON.stringify(batch);
    adjustPhoto(draft);
    return {raw,draftId:draft.id};
   });
   const staleOwnerDialog=page.locator('dialog[open]');
   await staleOwnerDialog.getByRole('checkbox',{
    name:/I checked the clothing photo and confirmed/
   }).check();
   assert.equal(await staleOwnerDialog.getByRole('button',{name:'Save changes'}).isEnabled(),true);
   await page.evaluate(async raw=>{
    // A second tab just inserted a different crop from the SAME original.
    await new Promise((resolve,reject)=>{
     const tx=db.transaction('items','readwrite');
     tx.objectStore('items').add({
      id:'late-other-tab-owner-review-88',
      image:'data:image/jpeg;base64,T0xELUNST1A=',
      originalPhoto:{image:raw},category:'Tops',itemType:'T-shirt',color:'Blue'
     });
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
   },prepareStaleOwnerReview.raw);
   await submit();
   await page.waitForFunction(()=>window.messageText.includes('Close Adjust')&&
    window.messageText.includes('refresh'));
   const staleOwnerUi=await page.evaluate(async draftId=>{
    const dlg=document.querySelector('dialog[open]');
    const save=dlg.querySelector('button.primary');
    const confirmed=[...dlg.querySelectorAll('input[type="checkbox"]')]
      .filter(x=>x.getAttribute('aria-label')?.includes('I checked the clothing photo'))
      .every(x=>x.checked===false);
    const stored=await new Promise((resolve,reject)=>{
     const req=db.transaction('items','readonly').objectStore('items').get(draftId);
     req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    const draft=await new Promise((resolve,reject)=>{
     const req=db.transaction('state','readonly').objectStore('state').get('draft');
     req.onsuccess=()=>resolve(req.result?.batch||[]);
     req.onerror=()=>reject(req.error);
    });
    return {disabled:save?.disabled===true,
     confirmedCleared:confirmed,
     draftPreserved:draft.some(x=>x.id===draftId),noNewRow:stored===undefined,
     guidance:window.messageText};
   },prepareStaleOwnerReview.draftId);
   assert.equal(staleOwnerUi.disabled,true,'outdated review must not re-enable retry');
   assert.equal(staleOwnerUi.confirmedCleared,true);
   assert.equal(staleOwnerUi.draftPreserved,true);
   assert.equal(staleOwnerUi.noNewRow,true);
   assert.match(staleOwnerUi.guidance,/same complete original|same original/i);
   // Dispatching submit directly must also be blocked, not just the button.
   const beforeRetry=staleOwnerUi.guidance;
   await submit();
   assert.match(await page.evaluate(()=>window.messageText),/outdated|refresh/i);
   console.log('M1_P88_BROWSER_STALE_OWNER_REVIEW_RECOVERY',JSON.stringify({
    browser:browserName,width,blocked:true,photoKept:true,
    staleButtonDisabled:true,scriptedRetryBlocked:true,syntheticOwner:true,
    realBrowserIndexedDB:true,physicalDevice:false,pageErrors:errors.length
   }));
   await page.evaluate(()=>db.close());

   // True browser-IDB crop CAS, not the synthetic IDB harness. The original
   // crop handler used a bare .put on saved wardrobe rows or the full draft,
   // silently losing second-tab corrections and pending raw JPEGs.
   const cropCas88=await page.evaluate(async()=>{
    const opened=indexedDB.open('closet-current-user-owner-A');
    const ownerDb=await new Promise((resolve,reject)=>{
     opened.onsuccess=()=>resolve(opened.result);
     opened.onerror=()=>reject(opened.error);
    });
    db=ownerDb;window.closetAuth.user={id:'owner-A'};window.beforeWriteTest=null;
    const put=(store,row)=>new Promise((resolve,reject)=>{
     const tx=db.transaction(store,'readwrite');
     tx.objectStore(store).put(structuredClone(row));
     tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    });
    const get=(store,id)=>new Promise((resolve,reject)=>{
     const req=db.transaction(store,'readonly').objectStore(store).get(id);
     req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    const raw='data:image/jpeg;base64,T1JJR0lOQUwtQ1JPUC1PQVNJUw==';
    const oldImage='data:image/jpeg;base64,T0xELU9XTkVSLUNST1A=';
    const newImage='data:image/jpeg;base64,TkVXLU9XTkVSLUNST1A=';
    const base={id:'actual-saved-crop-revision-88',image:oldImage,
     originalPhoto:{image:raw},category:'Tops',itemType:'T-shirt',
     color:'Blue',seasons:[],userAdjusted:false};
    items=[base];batch=[];await put('items',base);
    cropClothingPhoto(base);
    const corrected={...base,color:'Green',itemType:'Blouse'};
    await put('items',corrected);
    let staleSavedRefused=false;
    try{await window.crop88Editor.save({image:newImage},null);}
    catch(e){staleSavedRefused=/P88_SAVED_CROP_STORAGE_CHANGED/.test(e.message);}
    const correctionIntact=(await get('items',base.id))?.color==='Green'&&
     (await get('items',base.id))?.image===oldImage;
    const localSavedIntact=base.image===oldImage;
    await put('items',base);
    cropClothingPhoto(base);
    await window.crop88Editor.save({image:newImage},null);
    const savedCropCommitted=(await get('items',base.id))?.image===newImage;
    const originalSaved=(await get('items',base.id))?.originalPhoto?.image===raw;
    // Previously a saved item's Crop > Use suggested details could rewrite
    // confirmed category and subtype without a separate Adjust approval.
    cropClothingPhoto(base);
    let savedModelRejected=false;
    try{
     await window.crop88Editor.save({image:oldImage},{
      category:'Dresses',itemType:'Dress',color:'Red',label:'a dress',
      details:{color:'Red',fit:'Loose'}
     });
    }catch(e){
     savedModelRejected=/P88_SAVED_CROP_MODEL_SUGGESTION_REQUIRES_ADJUST/.test(e.message);
    }
    const savedAfterModel=await get('items',base.id);
    const ownerLabelsUntouched=savedAfterModel?.category==='Tops'&&
     savedAfterModel?.itemType==='T-shirt'&&savedAfterModel?.color==='Blue'&&
     savedAfterModel?.image===newImage;

    // Even a missing saved color cannot be silently filled by an estimated
    // garment-mask palette during Crop. Only explicit Adjust can change it.
    const unknown={id:'actual-saved-unknown-color-crop-88',
     image:oldImage,category:'Tops',itemType:'T-shirt',color:'',
     seasons:[],userAdjusted:true};
    items=[unknown];batch=[];await put('items',unknown);
    cropClothingPhoto(unknown);
    await window.crop88Editor.save({image:newImage,maskApplied:true,
     maskedColorEstimate:{color:'Red',source:'photo-estimate'}},null);
    const afterEstimate=await get('items',unknown.id);
    const savedUnknownRemainsUnknown=afterEstimate?.image===newImage&&
     afterEstimate?.color===''&&afterEstimate?.colorSource===undefined;


    const pending={id:'actual-pending-crop-88',image:oldImage,
     originalPhoto:{image:raw},name:'Pending original',category:'Tops',
     itemType:'T-shirt',color:'Blue',seasons:[],userAdjusted:false};
    const other={id:'later-tab-pending-88',
     image:'data:image/jpeg;base64,TEFURVItUEhPVE8='};
    items=[];batch=[pending];await put('state',{id:'draft',batch:[pending]});
    draftStoreRevision88=JSON.stringify(batch);
    cropClothingPhoto(pending);
    await put('state',{id:'draft',batch:[pending,other]});
    let staleDraftRefused=false;
    try{await window.crop88Editor.save({image:newImage},null);}
    catch(e){staleDraftRefused=/P88_CROP_DRAFT_STORAGE_CHANGED/.test(e.message);}
    const afterRefusal=(await get('state','draft'))?.batch||[];
    const otherPreserved=afterRefusal.some(x=>x.id===other.id&&x.image===other.image);
    const pendingRawPreserved=afterRefusal.some(x=>x.id===pending.id&&x.image===oldImage);
    batch=[pending,other];draftStoreRevision88=JSON.stringify(batch);
    cropClothingPhoto(pending);
    await window.crop88Editor.save({image:newImage},null);
    const afterReview=(await get('state','draft'))?.batch||[];
    const newCropSaved=afterReview.some(x=>x.id===pending.id&&x.image===newImage&&
     x.originalPhoto?.image===raw);
    const otherStillPreserved=afterReview.some(x=>x.id===other.id&&x.image===other.image);

    // A late saved matching preview must be found in durable IDB even when
    // this tab has not refreshed its stale in-memory items list.
    const newest={...pending,id:'actual-late-peer-new-crop-88',
     image:'data:image/jpeg;base64,TkVXLUxBVEUtQ1JPUA=='};
    const peer={id:'actual-other-tab-new-peer-88',image:newest.image,
     category:'Tops',itemType:'T-shirt',color:'Blue'};
    items=[];batch=[newest];await put('state',{id:'draft',batch:[newest]});
    draftStoreRevision88=JSON.stringify(batch);
    cropClothingPhoto(newest);
    await put('items',peer);
    await window.crop88Editor.save({image:newest.image,cropBounds:{x:0,y:0,width:1,height:1}},null);
    const flagged=(await get('state','draft'))?.batch?.find(x=>x.id===newest.id);
    const latePeerGuard=flagged?.exactSavedPhotoMatch88?.savedItemId===peer.id&&
     flagged?.possibleDuplicate===true&&
     flagged?.requiresOwnershipConfirmation===true;
    const noAutoSaved=(await get('items',newest.id))===undefined;
    // Real Crop editor includes originalPhoto on first crop. Preserve the
    // exact original source and reject photo-callback forged 3D credentials.
    const firstRaw='data:image/jpeg;base64,RklSU1QtUkFXLUpQRUc=';
    const first={id:'native-first-crop-original-88',image:firstRaw,
     category:'Tops',itemType:'T-shirt',color:'Blue',
     seasons:[],userAdjusted:false};
    items=[];batch=[first];await put('state',{id:'draft',batch:[first]});
    draftStoreRevision88=JSON.stringify(batch);
    cropClothingPhoto(first);
    const firstCropImage='data:image/jpeg;base64,RklSU1QtREVSSVZFRC1KUEVH';
    await window.crop88Editor.save({image:firstCropImage,
     originalPhoto:{image:firstRaw},cropBounds:{x:0,y:0,width:1,height:1}},null);
    const firstCropRow=(await get('state','draft'))?.batch?.find(x=>x.id===first.id);
    const firstCropSaved=firstCropRow?.image===firstCropImage&&
     firstCropRow?.originalPhoto?.image===firstRaw&&
     first.originalPhoto?.image===firstRaw;

    const guardedRaw='data:image/jpeg;base64,R1VBUkRFRC1PUklHSU5BTA==';
    const guarded={id:'native-forged-crop-credential-88',
     image:'data:image/jpeg;base64,R1VBUkRFRC1QUkVWSUVX',
     originalPhoto:{image:guardedRaw},category:'Tops',
     itemType:'T-shirt',color:'Blue',seasons:[],userAdjusted:false};
    items=[];batch=[guarded];await put('state',{id:'draft',batch:[guarded]});
    draftStoreRevision88=JSON.stringify(batch);cropClothingPhoto(guarded);
    let forgedRejected=0;
    for(const extra of [
     {threeDReady:true},{sourceHashVerified:true},
     {originalPhoto:{image:guardedRaw,sha256:'f'.repeat(64),verified:true}}
    ]){
     try{await window.crop88Editor.save({image:firstCropImage,...extra},null);}
     catch(e){if(/P88_CROP_(?:UNEXPECTED_FIELD|ORIGINAL_SOURCE_CHANGED)/.test(e.message))forgedRejected++;}
    }
    const unchanged=(await get('state','draft'))?.batch?.find(x=>x.id===guarded.id);
    const forgedOriginalUntouched=forgedRejected===3&&
     unchanged?.image===guarded.image&&
     unchanged?.threeDReady!==true&&unchanged?.sourceHashVerified!==true&&
     unchanged?.originalPhoto?.verified!==true;
    ownerDb.close();
    return {firstCropSaved,forgedOriginalUntouched,forgedRejected,
     savedModelRejected,ownerLabelsUntouched,savedUnknownRemainsUnknown,
     staleSavedRefused,correctionIntact,localSavedIntact,
     savedCropCommitted,originalSaved,staleDraftRefused,otherPreserved,
     pendingRawPreserved,newCropSaved,otherStillPreserved,
     latePeerGuard,noAutoSaved};
   });
   assert.deepEqual(cropCas88,{
    firstCropSaved:true,forgedOriginalUntouched:true,forgedRejected:3,
    savedModelRejected:true,ownerLabelsUntouched:true,
    savedUnknownRemainsUnknown:true,
    staleSavedRefused:true,correctionIntact:true,localSavedIntact:true,
    savedCropCommitted:true,originalSaved:true,staleDraftRefused:true,
    otherPreserved:true,pendingRawPreserved:true,
    newCropSaved:true,otherStillPreserved:true,
    latePeerGuard:true,noAutoSaved:true
   },'genuine native IDB crop CAS must protect saved and pending originals');
   console.log('M1_P88_ACTUAL_BROWSER_CROP_SAVED_AND_DRAFT_CAS',JSON.stringify({
    browser:browserName,width,...cropCas88,
    realBrowserIndexedDB:true,syntheticOwner:true,
    physicalDevice:false,pageErrors:errors.length
   }));
   assert.deepEqual(errors,[]);

   // True Crop editor DOM + browser canvas, not the native-app callback stub.
   // A concurrent stored-row or pending-draft rejection cannot be retried
   // against the old captured owner/source/IDB lease. Show honest guidance,
   // disable further saves and allow closing/reopening after a fresh review.
   await page.addScriptTag({content:cropEngineSrc});
   await page.addScriptTag({content:cropEditorSrc});
   const canvasJpeg=await page.evaluate(()=>{
    const c=document.createElement('canvas');c.width=320;c.height=320;
    const g=c.getContext('2d');g.fillStyle='#f1f1f1';g.fillRect(0,0,320,320);
    g.fillStyle='#2f6898';g.fillRect(80,45,160,240);
    return c.toDataURL('image/jpeg',0.94);
   });
   const conflictCodes=[
    'P88_SAVED_CROP_STORAGE_CHANGED',
    'P88_CROP_DRAFT_STORAGE_CHANGED',
    'P88_STALE_CROP_OWNER_OR_SOURCE'
   ];
   for(const code of conflictCodes){
    await page.evaluate(async ({source,code})=>{
     window.cropTerminalCalls88=0;
     await window.openPhotoCrop({image:source},{
      analyze:async()=>null,
      save:async()=>{window.cropTerminalCalls88++;throw Error(code);}
     });
    },{source:canvasJpeg,code});
    const dlg=page.locator('dialog.photo-crop-editor[open]');
    await dlg.getByRole('button',{name:'Save crop'}).click();
    await page.waitForFunction(()=>document.querySelector('dialog.photo-crop-editor[open] [role="status"]')
     ?.textContent.includes('Close Crop'));
    const output=await page.evaluate(async()=>{
     const dlg=document.querySelector('dialog.photo-crop-editor[open]');
     const buttons=[...dlg.querySelectorAll('button')];
     const save=buttons.find(x=>x.textContent==='Save crop');
     const check=buttons.find(x=>x.textContent==='Check recognition');
     const cancel=buttons.find(x=>x.textContent==='Cancel');
     const status=dlg.querySelector('[role="status"]')?.textContent||'';
     // Direct scripted re-entry must be denied even if caller invokes onclick
     // and bypasses the disabled DOM button.
     await save.onclick();
     return {guidance:status,saveDisabled:save.disabled,checkDisabled:check.disabled,
      cancelEnabled:!cancel.disabled,scriptedRetryBlocked:window.cropTerminalCalls88===1};
    });
    assert.match(output.guidance,/Close Crop/);
    assert.equal(output.saveDisabled,true);
    assert.equal(output.checkDisabled,true);
    assert.equal(output.cancelEnabled,true);
    assert.equal(output.scriptedRetryBlocked,true);
    if(code==='P88_CROP_DRAFT_STORAGE_CHANGED')assert.match(output.guidance,/original/);
    console.log('M1_P88_BROWSER_CROP_TERMINAL_CONFLICT',JSON.stringify({
     browser:browserName,width,code,blocked:true,scriptedRetryBlocked:true,
     cancelStillAvailable:true,realCanvasJpeg:true,syntheticPhoto:true,
     physicalDevice:false,pageErrors:errors.length
    }));
    await dlg.getByRole('button',{name:'Cancel'}).click();
    await page.waitForFunction(()=>!document.querySelector('dialog.photo-crop-editor[open]'));
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
 }finally{await browser.close();}
}

}finally{await new Promise(resolve=>server.close(resolve));}
