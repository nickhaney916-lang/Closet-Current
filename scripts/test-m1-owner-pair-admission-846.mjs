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
const app=await readFile('public/app.js','utf8'),
 taxonomy=await readFile('public/taxonomy.js','utf8'),
 details=await readFile('public/clothing-details.js','utf8');
function extract(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'P846 source segment missing '+a);return app.slice(i,j);}
const source=extract('function node(', 'function hasSourceBoundMask88(')+
 extract('function hasSourceBoundMask88(', '// P846:')+
 extract('function unit70Receipts(', 'function renderRecognitionNotice(');
const harness=[
 "const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];",
 "let items=[],batch=[],stream=null,cameraOpening=false,busy=false,localReady=true;",
 // Keep the browser's original P846 native Adjust source, but provide the
 // same signed owner/IDB transaction boundary required by the new P88 guard.
 "let db={name:'closet-current-user-owner-A',transaction(stores,mode){if(mode!=='readwrite')throw Error('P88_EXPECTED_WRITE');const tx={objectStore(name){return {put(value){if(name==='items'){window.writeCount++;tx.saved=structuredClone(value);}else if(name==='state')tx.next=structuredClone(value);else throw Error('UNKNOWN_STORE');}}}};window.completions.push({resolve(){if(tx.next)window.draftSnapshots.push(tx.next);window.stored.push(tx.saved);tx.oncomplete?.();},reject(error){tx.error=error||Error('REJECT');tx.onerror?.();}});return tx;}};",
 "const queued=async fn=>{await window.beforeWriteTest?.();return fn();};",
 "const originalSource88="+JSON.stringify(originalSource88),
 "const sourceHash88="+JSON.stringify(originalHash88),
 "const localPending=new Set(),sessionCapturedIds=new Set();",
 "const checkPhoto=async()=>({colorEstimate:null,signature:[],aspect:1});",
 "const openPhotoCrop=(item,callbacks)=>{window.crop88Editor=callbacks;return Promise.resolve();};",
 "window.closetAuth={user:{id:'owner-A'}};",
 "window.writeCount=0;window.stored=[];window.completions=[];window.draftSnapshots=[];window.messageText='';",
 "const savePiece=(v,b)=>{window.writeCount++;return new Promise((resolve,reject)=>window.completions.push({resolve:()=>{window.stored.push(structuredClone(v));resolve();},reject}));};",
 "const removeItem=async()=>{};",
 "const persistDraft=async()=>{};",
 "const render=()=>{};",
 "const scheduleMemoryReview=()=>{};",
 "const stopCamera=()=>{};",
 "const queueAutomatic=()=>{};",
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
 "    shoePair:{confirmedByOwner:true,companion:{image:'data:image/jpeg;base64,QUJDRA==',reconciliation70:receipt('owner-A',12)}}};",
 "  batch=[item];items=dup?[{id:'old',image:'data:image/jpeg;base64,QUJD',category:'Shoes',itemType:'Sneakers',color:'Black',reconciliation70:receipt('owner-A',12)}]:[];",
 "  adjustPhoto(item);return item;",
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
   assert.equal(result.ownerReceipt?.category,'Shoes');
   assert.equal(result.ownerReceipt?.physicalUnitDecision,'paired_confirmed');
   assert.equal(result.ownerReceipt?.ownerReviewed,true);
   assert.equal(result.ownerReceipt?.sourcePhotoOriginal,true);
   assert.equal(result.ownerReceipt?.independentPhysicalItemVerified,false);
   assert.equal(result.ownerReceipt?.singleGarmentVerified,false);
   assert.equal(result.ownerReceipt?.threeDReady,false);
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
