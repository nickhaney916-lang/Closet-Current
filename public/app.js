'use strict';
const $=id=>document.getElementById(id), categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const recognitionAssetVersion=new URL(document.currentScript?.src||location.href).searchParams.get('v')||'';
// P167 INTEGRATION BRANCH ONLY, unmerged and undeployed: exercise normal app
// camera + gallery source fidelity with no query flags on this isolated build.
// Release HOLD #255 remains absolute, no production or staging writes.
const nativeCanonical167Active=true;
const captureProof01Active=nativeCanonical167Active||
 new URLSearchParams(location.search).get('captureProof01')==='after';
const mobileCameraToCloset75Active=new URLSearchParams(location.search).get('cameraCloset75')==='after';
// Research only: loaded dynamically from full repository host, outside production dist.
const captureProof01Module=()=>nativeCanonical167Active
 ?import('./native-canonical-photo-source-167.mjs')
 :import('../research/capture-proof-01/source-proof.mjs');
function captureProofOwner(){
 const owner=window.closetAuth?.user?.id;
 return typeof owner==='string'&&db?.name==='closet-current-user-'+owner?owner:null;
}
async function captureProofFromJPEG(image,dimensions,owner){
 if(!owner||captureProofOwner()!==owner)throw Error('Camera session owner changed');
 const mod=await captureProof01Module();
 const proof=await mod.captureCanonicalJPEG(image,dimensions);
 if(!await mod.verifyStoredCanonical(proof)||captureProofOwner()!==owner)
  throw Error('Original JPEG verification or account check failed');
 return proof;
}
async function captureProofFromFile(file,owner){
 if(!owner||captureProofOwner()!==owner)throw Error('Import account changed');
 const mod=await captureProof01Module();
 const proof=await mod.importCanonicalPhoto(file);
 if(!await mod.verifyStoredCanonical(proof)||captureProofOwner()!==owner)
  throw Error('Imported original JPEG verification or account check failed');
 return proof;
}
// INDEX-04 research-only: absent by default; no deploy or ordinary scanner change.
const index04ResearchActive=new URLSearchParams(location.search).get('index04')==='after';
// PHOTO120: deliberate, multi-flag opt-in, only on an isolated research host.
// Original JPEG capture and the safety-first INDEX04 review gate are mandatory.
// No change to the normal application's Adjust / save flow without ALL flags.
const reviewedSave120Active=nativeCanonical167Active||
 (new URLSearchParams(location.search).get('reviewedSave120')==='research'&&
 captureProof01Active&&index04ResearchActive);
// PHOTO122: newly human-confirmed camera originals → existing owner Style tab.
// No new outfit generator, photo store, 3D claims, or non-research behavior.
const reviewedStyle122Active=reviewedSave120Active&&
 new URLSearchParams(location.search).get('reviewedStyle122')==='research'&&
 new URLSearchParams(location.search).get('styleOwned03')==='research'&&
 new URLSearchParams(location.search).get('nativeLossless04')==='research'&&
 new URLSearchParams(location.search).get('nativeIndex07')==='research';
// PHOTO123: explicit additional gate for a reviewed original reopened from
// My Closet after a browser reload. No session-capture ID needed after reload;
// a fresh owner-bound persisted source + category/color integrity check is.
const reviewedCloset123Active=reviewedStyle122Active&&
 new URLSearchParams(location.search).get('reviewedCloset123')==='research';
// PHOTO124: separately proven SHA-256 of P119 owner-reviewed cutout bytes,
// only for source-honest, photo-only styling of one human-confirmed instance.
const reviewedCutout124Active=reviewedCloset123Active&&
 new URLSearchParams(location.search).get('reviewedCutout124')==='research';
let saving=false;const sessionCapturedIds=new Set();
let localWorker,localReady=false,localBatch=false,localLoadPromise=null,recognitionUnavailable=false;const automaticQueue=[];let automaticRunning=false;const localJobs=new Map(),localPending=new Set();
const recognitionState={phase:'idle',percent:null,activeId:null};
let writes=Promise.resolve();
function queued(work){const result=writes.then(async()=>{window.closetAuth?.assertCurrent?.();await window.closetCloud?.beforeWrite(db);window.closetAuth?.assertCurrent?.();return work();});writes=result.catch(()=>{});result.catch(error=>{if(error?.name==='QuotaExceededError'||error?.cause?.name==='QuotaExceededError')message('Browser storage is full. Your existing closet and saved outfits remain in place. Free space and try again.');});result.then(()=>window.closetCloud?.changed()).catch(()=>{});result.then(()=>window.closetIndex02?.refresh()).catch(()=>{});return result;}
let db,items=[],batch=[],stream,timer,busy=false,lastPixels=null,lastSaved=null,stable=0,lastCapture=0,session=0,audio,cadence;
// STORAGE136: all saved records remain available to search, outfits and
// backup; only the visible closet-card window is bounded. This changes DOM
// and image decoding work, never persisted records or protected JPEG bytes.
const closetPageSize136=48;
let closetRendered136=closetPageSize136,closetQueryKey136='';
let cameraMode=null,cameraOpening=false,cameraRequest=0,captureProofTaking=false;
const video=$('video'),canvas=document.createElement('canvas'),tiny=document.createElement('canvas');tiny.width=32;tiny.height=32;
window.addEventListener('closet:session-locked',()=>{
 // AUTH36: immediately revoke all owner-visible local photo state. Supabase
 // signed RLS remains authoritative server-side; this protects stale tabs.
 stopCamera();
 for(const job of localJobs.values()){
  clearTimeout(job.timer);job.reject(Error('Authenticated account session ended'));
 }
 localJobs.clear();
 localWorker?.terminate();localWorker=null;
 try{db?.close();}catch{}
 db=null;items=[];batch=[];
 for(const image of document.querySelectorAll('#appShell img, dialog img')){
  const source=image.getAttribute('src');
  if(source?.startsWith('blob:'))URL.revokeObjectURL(source);
  if(source?.startsWith('blob:')||source?.startsWith('data:'))image.removeAttribute('src');
 }
 for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
});

function message(t){$('message').textContent=t;}
document.addEventListener('error',event=>{
 const photo=event.target;
 if(!(photo instanceof HTMLImageElement)||!photo.closest('#appShell, dialog')||photo.dataset.missingPhoto)return;
 photo.dataset.missingPhoto='true';photo.hidden=true;
 const notice=node('span','Photo unavailable · clothing details kept','missing-photo');notice.setAttribute('role','img');notice.setAttribute('aria-label','Clothing photo unavailable');photo.after(notice);
},true);
function switchView(view){
 if(!document.getElementById(view)?.classList.contains('view'))return;
 if((stream||cameraOpening)&&view!=='scan')stopCamera();
 document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!==view);
 document.querySelectorAll('.tab').forEach(x=>{const active=x.dataset.view===view;x.classList.toggle('active',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
 const more=$('moreMenu');if(more){more.open=false;more.classList.toggle('has-active',['builder','trends','review','devicecheck'].includes(view));}
 render();
 const section=document.getElementById(view);section.scrollIntoView?.({block:'start',behavior:'instant'});
 const heading=section.querySelector?.('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('closet-current-user-'+window.closetAuth.user.id,2);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function readAll(){return new Promise((resolve,reject)=>{const r=db.transaction('items').objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
// NATIVE-INDEX-07 opt-in only: refresh the original native outfit controller
// after a committed saved-item mutation, not on every draft/photo write.
// Owner/session/CAS attestation is performed by the controller itself.
async function nativeIndex07Refresh(){
 if(new URLSearchParams(location.search).get('nativeIndex07')!=='research')return;
 const bridge=window.nativeLossless04Bridge;
 if(!bridge?.refreshWardrobe)return;
 try{
   await bridge.refreshWardrobe();
   if(new URLSearchParams(location.search).get('styleOwned03')==='research'){
    // A confirmed photo is not instantly selectable if this secondary source
    // digest runs fire-and-forget. Await only the same signed-in native
    // controller's new SHA-verified saved roster. Never write a second DB.
    const stylePanel=window.styleOwnedLive03Bridge;
    if(stylePanel?.refresh)await stylePanel.refresh({quiet:true});
    else window.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
   }
  }
 catch(error){const status=$('boardSaveStatus');if(status)
  status.textContent='New clothing saved; outfit builder needs a safe reload. '+String(error.message||error);}
}
function writeAll(values){return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('items','readwrite');for(const v of values)tx.objectStore('items').put(v);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);})).then(async value=>{await nativeIndex07Refresh();return value;});}
// Compare the persisted garment inside the same transaction that saves it.
// A stale editor must not resurrect a deleted piece or overwrite another tab.
function saveEditedGarment(updated,expected){
 const auth=window.closetAuth,owner=auth?.user?.id,ownerDB=db;
 const assertOwner=()=>{auth?.assertCurrent?.();if(!owner||window.closetAuth!==auth||auth.user?.id!==owner||db!==ownerDB||ownerDB.name!=='closet-current-user-'+owner)throw Error('Saved garment owner changed');};
 return queued(()=>new Promise((resolve,reject)=>{
  assertOwner();const tx=ownerDB.transaction('items','readwrite'),store=tx.objectStore('items');
  let failure;const request=store.get(expected.id);
  request.onsuccess=()=>{try{
   assertOwner();
   if(!request.result||JSON.stringify(normalizeClothing(request.result))!==JSON.stringify(normalizeClothing(expected)))throw Error('CORRECTION10_STALE_SAVED_GARMENT_REOPEN_EDITOR');
   store.put(updated);
  }catch(error){failure=error;tx.abort();}};
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(failure||tx.error||Error('Changes were not saved'));
 })).then(nativeIndex07Refresh);
}
function removeItem(id){return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('items','readwrite');tx.objectStore('items').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);})).then(async value=>{await nativeIndex07Refresh();return value;});}
function persistDraft(){if(!db)return;const snapshot=structuredClone(batch);return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'draft',batch:snapshot});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);})).catch(()=>message('Your unfinished scan could not be backed up. Keep this page open and save or export your pieces.'));}
function readDraft(){return new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('draft');r.onsuccess=()=>resolve(r.result?.batch||[]);r.onerror=()=>reject(r.error);});}
async function captureProofVerifyBeforeSave(value){
 if(!(typeof captureProof01Active!=='undefined'&&captureProof01Active))return;
 const owner=captureProofOwner();
 if(!owner||value.ownerId&&value.ownerId!==owner)
  throw Error('Owner changed while saving a captured photograph');
 if(value.sourceHashVerified===true){
  const mod=await captureProof01Module();
  const original=value.originalPhoto?.image;
  const proof={image:original,originalPhoto:value.originalPhoto,
   sourceSHA256:value.sourceSHA256,sourceHashVerified:value.sourceHashVerified};
  if(!await mod.verifyStoredCanonical(proof))
   throw Error('Original JPEG no longer matches captured SHA-256');
 }
 if(captureProofOwner()!==owner)
  throw Error('Owner changed during original-photo integrity check');
}
function nativeCorrection10Active(){
 const query=new URLSearchParams(location.search);
 return query.get('nativeCorrection10')==='research'&&
  query.get('nativeLossless04')==='research'&&query.get('nativeIndex07')==='research';
}
async function commitOwnerCorrection10(value,expectedSavedRow,nextBatch){
 if(!nativeCorrection10Active())throw Error('CORRECTION10 explicit private research gate required');
 const {commitNativeCorrection10}=await import('../research/native-correction-10/owner-correction-cas.mjs');
 const auth=window.closetAuth,owner=auth?.user?.id;
 const assertOwner=()=>{
  if(!owner||window.closetAuth!==auth||auth.user?.id!==owner||
     db?.name!=='closet-current-user-'+owner||
     $('authGate')?.hidden!==true||$('appShell')?.hidden!==false)
   throw Error('CORRECTION10 owner changed during saved clothing correction');
 };
 assertOwner();
 return commitNativeCorrection10({db,ownerId:owner,before:expectedSavedRow,
  after:value,nextBatch,assertOwner});
}
function savePiece(value,nextBatch,{expectedSavedRow=null}={}){return queued(async()=>{
 await captureProofVerifyBeforeSave(value);
 // CORRECTION10: only original SAVED garments, with a pre-edit row snapshot,
 // use strict owner/photo CAS. Newly captured draft photo saves continue via
 // unchanged existing save path. No change on the default app URL.
 if(expectedSavedRow&&new URLSearchParams(location.search).get('nativeCorrection10')==='research')
  return commitOwnerCorrection10(value,expectedSavedRow,nextBatch);
 return new Promise((resolve,reject)=>{const tx=db.transaction(['items','state'],'readwrite');
 tx.objectStore('items').put(value);tx.objectStore('state').put({id:'draft',batch:structuredClone(nextBatch)});
 tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
}).then(async result=>{await nativeIndex07Refresh();return result;});}
function node(tag,text,className){const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;}
function empty(grid,title,subtitle){const n=node('div',null,'empty');n.append(node('h3',title),node('p',subtitle));grid.append(n);}
function field(body,title,value,type='input'){const label=node('label',title),input=node(type);input.setAttribute('aria-label',title);if(type==='select'){for(const c of categories){const o=node('option',c);o.value=c;input.append(o);}}input.value=value||'';if(type==='input')input.maxLength=120;if(type==='textarea')input.maxLength=500;label.append(input);body.append(label);return input;}
function choice(body,title,value,options){const label=node('label',title),select=node('select');select.setAttribute('aria-label',title);for(const option of options)select.append(node('option',option));select.value=options.includes(value)?value:options[0];label.append(select);body.append(label);return select;}
function clothingFields(body,item,onChange=()=>{}){
 Object.assign(item,normalizeClothing(item));
 if(item.image){const reference=node('figure',null,'clothing-reference'),photo=node('img'),caption=node('figcaption',item.name||'Garment photo');photo.src=item.image;photo.alt=item.name||'Garment being edited';caption.title=item.name||'Garment photo';reference.append(photo,caption);body.append(reference);}
 const completion=node('p',null,'fine'),fillPhoto=node('button','Fill missing details from photo','secondary');fillPhoto.type='button';
 const refreshCompletion=()=>{const missing=ClothingDetails.missing(item);completion.textContent=(item.colorSource==='photo-estimate'?'Color estimated from photo · confirm '+item.color+'. ':'')+(missing.length?'Details to confirm: '+missing.join(', ')+'.':'Core details complete. Brand, size and fabric can be added from the label.');};refreshCompletion();body.append(completion);
 if(item.image){body.append(fillPhoto,node('p','Confirm seasons for how you wear it. Enter brand, size and fabric from the label.','fine'));}
 if(typeof ClothingMemory!=='undefined'){const suggestion=ClothingMemory.suggest(item,items)||ClothingMemory.weekly(item);if(suggestion){const memory=node('details',null,'clothing-details');memory.append(node('summary',suggestion.sourceIds?.length?'Suggestions from your confirmed clothes':'Recognition review suggestions'),node('p',(suggestion.sourceIds?.length?'Similar pieces suggest: ':'A fresh recognition check suggests: ')+Object.entries(suggestion.fields).map(([k,v])=>v).join(' · ')+'. Compare with this photo before using them.','fine'));const use=node('button','Use suggested details','secondary');use.type='button';use.onclick=()=>{Object.assign(item,ClothingMemory.apply(item,suggestion));fields.category.value=item.category;fields.itemType.replaceChildren(...['Unknown',...(clothingSchema.types[item.category]||[])].map(x=>node('option',x)));for(const [key,input]of Object.entries(fields))input.value=item[key]||'';refreshCompletion();onChange();use.disabled=true;};memory.append(use);body.append(memory);}}
 const fields={name:field(body,'Item name',item.name),category:field(body,'Main category',item.category,'select')};
 const details=node('details',null,'clothing-details');details.open=true;details.append(node('summary','Clothing details'));body.append(details);
 fields.color=field(details,'Color',item.color);
 fields.itemType=choice(details,'Item type',item.itemType,['Unknown',...(clothingSchema.types[item.category]||[])]);
 fields.sleeveLength=choice(details,'Sleeve length',item.sleeveLength,clothingSchema.sleeve);
 fields.pattern=choice(details,'Pattern',item.pattern,clothingSchema.pattern);
 fields.fit=choice(details,'Fit',item.fit,clothingSchema.fit);
 const seasons=node('fieldset',null,'season-picker');seasons.append(node('legend','Seasons · choose all that apply'));const checks=[];
 for(const season of clothingSchema.seasons){const label=node('label'),input=node('input');input.type='checkbox';input.value=season;input.checked=item.seasons.includes(season);label.append(input,document.createTextNode(season));seasons.append(label);checks.push(input);input.onchange=()=>{if(input.checked){for(const other of checks)if(other!==input&&(season==='All seasons'||other.value==='All seasons'))other.checked=false;}item.seasons=checks.filter(x=>x.checked).map(x=>x.value);refreshCompletion();onChange();};}details.append(seasons);
 const extra=node('details',null,'optional-details');extra.append(node('summary','Brand, size & other details'));details.append(extra);
 for(const [key,title]of [['brand','Brand'],['size','Size'],['material','Material'],['occasion','Occasion']])fields[key]=field(extra,title,item[key]);
 fields.notes=field(extra,'Notes',item.notes,'textarea');
 for(const [key,el]of Object.entries(fields))el.oninput=()=>{item[key]=el.value;if(key==='color')item.colorSource='user';if(key==='category'){const types=['Unknown',...(clothingSchema.types[item.category]||[])];fields.itemType.replaceChildren(...types.map(x=>node('option',x)));item.itemType='Unknown';fields.itemType.value='Unknown';if(['Shoes','Accessories','Bottoms'].includes(item.category)){item.sleeveLength='Not applicable';fields.sleeveLength.value='Not applicable';}else if(item.sleeveLength==='Not applicable'){item.sleeveLength='Unknown';fields.sleeveLength.value='Unknown';}}refreshCompletion();onChange();};
 fillPhoto.onclick=async()=>{fillPhoto.disabled=true;completion.textContent='Checking color, then garment identity…';try{const quality=await checkPhoto(item.image);if(!fillPhoto.isConnected)return;Object.assign(item,ClothingDetails.fillColor(item,quality.colorEstimate));fields.color.value=item.color||'';refreshCompletion();if(!localReady)await enableLocal();const result=await localRequest('classify',item.recognitionPhoto?.image||item.image,null,item.segmentHint),choice=result.choices?.[0];if(!fillPhoto.isConnected)return;if((!result.strong&&!result.categoryConfirmed)||!choice||!segmentationAllows(item,choice)){completion.textContent=(item.color?'Color kept. ':'')+'Garment identity needs confirmation. Optional details can stay blank.';return;}if(item.category!=='Uncategorized'&&item.category!==choice.category){completion.textContent='Photo suggests '+choice.category+' · '+choice.itemType+'. Use Crop photo to review and change the category.';return;}applyLocalChoice(item,choice);Object.assign(item,ClothingDetails.fill(item,choice,result.details));fields.category.value=item.category;fields.itemType.replaceChildren(...['Unknown',...(clothingSchema.types[item.category]||[])].map(x=>node('option',x)));for(const [key,input]of Object.entries(fields))input.value=item[key]||'';refreshCompletion();onChange();}catch{if(fillPhoto.isConnected)completion.textContent=(item.color?'Color kept. ':'')+'Garment recognition is unavailable. Your details are kept; optional fields can stay blank.';}finally{fillPhoto.disabled=false;}};
 if(item.image&&(!item.color||item.color==='Unknown'))checkPhoto(item.image).then(quality=>{if(!fields.color.isConnected||item.colorSource==='user')return;const updated=ClothingDetails.fillColor(item,quality.colorEstimate);if(updated!==item){Object.assign(item,updated);fields.color.value=item.color||'';if(!fillPhoto.disabled)refreshCompletion();onChange();}}).catch(()=>{});
 return ()=>normalizeClothing(item);
}
function cropClothingPhoto(item){
 if(localPending.has(item.id)||busy)return;
 if(stream||cameraOpening)stopCamera();
 openPhotoCrop(item,{
  async analyze(image){if(!localReady)await enableLocal();const result=await localRequest('classify',image,null);return (result.strong||result.categoryConfirmed)&&result.choices?.[0]&&segmentationAllows(item,result.choices[0])?{...result.choices[0],details:ClothingDetails.recognizedFields(result.choices[0],result.details)}:null;},
  async save(photo,choice){
   const value={...structuredClone(item),...photo,userAdjusted:true,localAnalyzed:true,scanFailed:false,saveFailed:false,possibleDuplicate:false};
   delete value.recognitionMemory;delete value.confirmedDetails;delete value.learningReviewedWeek;delete value.weeklySuggestion;delete value.recognitionPhoto;delete value.colorMethod;if(value.colorSource==='photo-estimate'){value.color='';delete value.colorSource;}const quality=await checkPhoto(photo.image);Object.assign(value,ClothingDetails.fillColor(value,photo.maskApplied?(photo.maskedColorEstimate||null):quality.colorEstimate));if(photo.maskedColorEstimate&&value.colorSource==='photo-estimate')value.colorMethod='garment-mask';delete value.maskedColorEstimate;delete value.maskApplied;value.visualSignature=quality.signature;value.visualAspect=quality.aspect;delete value.localChoices;delete value.indexedAt;
   if(choice){applyLocalChoice(value,choice,true);Object.assign(value,ClothingDetails.fill(value,choice,choice.details,true));value.indexedAt=new Date().toISOString();}
   value.localStatus=choice?'Crop checked. Suggested details applied.':'Crop saved. Check recognition or adjust the clothing details.';
   if(items.some(x=>x.id===item.id))await writeAll([value]);else await queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'draft',batch:batch.map(x=>x.id===item.id?value:x)});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));
   Object.assign(item,value);for(const key of ['visualSignature','visualAspect','localChoices','indexedAt','recognitionPhoto','colorMethod','recognitionMemory','confirmedDetails','learningReviewedWeek','weeklySuggestion'])if(!(key in value))delete item[key];render();
  }
 }).catch(()=>message('Could not open this photo for cropping. Your saved photo is kept.'));
}
function cropButton(item){const button=node('button','Crop photo','secondary');button.type='button';button.disabled=localPending.has(item.id);button.onclick=()=>cropClothingPhoto(item);return button;}
function adjustPhoto(item){
 if(stream||cameraOpening)stopCamera();
 const dialog=document.createElement('dialog');dialog.className='photo-adjust clothing-editor';
 const form=node('form'),draft=structuredClone(item),collect=clothingFields(form,draft);
 const evidence=item.recognitionDiagnostics?.outerwearRecovery;
 if(evidence?.outerwearReviewSuggested&&draft.category!=='Outerwear'){
  const suggestion=node('div',null,'recognition-review-suggestion');
  const proposedType=evidence.fullCatalogEvidence?.whole?.top?.[0]?.type;
  const agreedType=proposedType&&proposedType===evidence.fullCatalogEvidence?.confirmation?.top?.[0]?.type?proposedType:null;
  suggestion.append(node('p',agreedType?'Two photo checks suggest Outerwear ('+agreedType+'). Review the picture; the specific type will remain unconfirmed.':'Two photo checks suggest Outerwear. Confirm against the picture before applying.','fine'));
  const use=node('button','Use Outerwear category','secondary');use.type='button';
  use.onclick=()=>{
   draft.category='Outerwear';draft.itemType='Unknown';
   const category=form.querySelector('select[aria-label="Main category"]');
   if(category){category.value='Outerwear';category.dispatchEvent(new Event('input',{bubbles:true}));}
   const type=form.querySelector('select[aria-label="Item type"]');if(type)type.value='Unknown';
   use.disabled=true;
  };
  suggestion.append(use);form.prepend(suggestion);
 }
 const save=node('button','Save changes','primary'),cancel=node('button','Cancel','secondary'),remove=node('button','Remove photo','secondary');
 cancel.type=remove.type='button';cancel.onclick=()=>dialog.close();
 // PHOTO120 only for actual *unsaved* camera captures, not a saved-piece edit.
 // Owner must explicitly confirm category/type/color and garment source before
 // the separately SHA-proven atomic research commit. Never auto-check them.
 const reviewedCapture120=reviewedSave120Active&&!items.some(x=>x.id===item.id);
 let reviewConfirmed120=null,garmentConfirmed120=null;
 if(reviewedCapture120){
  const confirmBox=node('div',null,'reviewed-save120-confirmation');
  confirmBox.style.cssText='border:1px solid #a7b5ce;border-radius:10px;padding:12px;margin:12px 0;background:#f5f7fc;min-width:0';
  const help=node('p','Review the original photograph above. Confirm the garment category, type and color before saving privately.','fine');
  confirmBox.append(help);
  const reviewLabel=node('label'),reviewCheck=node('input');
  reviewCheck.type='checkbox';reviewCheck.required=true;
  reviewCheck.setAttribute('aria-label','I verified the category, clothing type and color');
  reviewLabel.append(reviewCheck,document.createTextNode(' I verified the category, clothing type and color'));
  confirmBox.append(reviewLabel);reviewConfirmed120=reviewCheck;
  const sourceLabel=node('label'),sourceCheck=node('input');
  sourceCheck.type='checkbox';sourceCheck.required=true;
  const multi=!!(item.outfitSourceId||item.cropBounds||item.segmentHint);
  sourceCheck.setAttribute('aria-label',multi?'I reviewed this specific separated garment':'I confirmed this photo shows one garment');
  sourceLabel.append(sourceCheck,document.createTextNode(multi?
   ' I reviewed this specific separated garment':' I confirmed this photo shows one garment'));
  confirmBox.append(sourceLabel);garmentConfirmed120=sourceCheck;
  form.append(confirmBox);
 }
 // CORRECTION10: opening and canceling Adjust must not mutate the saved
 // garment or turn unconfirmed classification into human review. Snapshot
 // the exact original row BEFORE any dialog work for atomic stale-tab CAS.
 const correction10=new URLSearchParams(location.search).get('nativeCorrection10')==='research'&&
  new URLSearchParams(location.search).get('nativeIndex07')==='research'&&
  new URLSearchParams(location.search).get('nativeLossless04')==='research';
 const expectedSavedRow=correction10&&items.some(x=>x.id===item.id)?structuredClone(item):null;
 const wasAdjusted=item.userAdjusted,wasScanning=localPending.has(item.id);
 if(!correction10)item.userAdjusted=true;
 remove.onclick=async()=>{try{if(items.some(x=>x.id===item.id))await removeItem(item.id);items=items.filter(x=>x.id!==item.id);batch=batch.filter(x=>x.id!==item.id);sessionCapturedIds.delete(item.id);await persistDraft();dialog.close();render();}catch{message('Could not remove this photo. Try again.');}};
 form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{
  const value={...collect(),name:draft.name.trim()||(draft.itemType&&draft.itemType!=='Unknown'?draft.itemType:'Closet piece'),savedAt:new Date().toISOString(),userAdjusted:true,requiresOwnershipConfirmation:false};
  if(typeof captureProof01Active!=='undefined'&&captureProof01Active&&
     (!captureProofOwner()||item.ownerId&&item.ownerId!==captureProofOwner()))
   throw Error('Owner changed. Sign in again before saving this photo.');
  if(typeof ClothingMemory!=='undefined')Object.assign(value,ClothingMemory.confirm(value));
  // COLOR41: Save does not prove an AI-estimated color was changed by the user.
  // clothingFields itself marks colorSource='user' on explicit color input.
  if(typeof reviewedCapture120!=='undefined'&&reviewedCapture120){
   if(!reviewConfirmed120?.checked||!garmentConfirmed120?.checked)
    throw Error('Confirm the photographed garment and its category, type and color.');
   const owner=window.closetAuth?.user?.id,auth=window.closetAuth;
   if(!owner||!auth||db?.name!=='closet-current-user-'+owner||
      $('authGate')?.hidden!==true||$('appShell')?.hidden!==false||
      !batch.includes(item))
    throw Error('The private camera draft or signed-in account changed.');
   const multi=!!(item.outfitSourceId||item.cropBounds||item.segmentHint);
   const review={
    confirmed:true,recordId:item.id,originalSHA256:item.sourceSHA256,
    category:value.category,itemType:value.itemType,color:value.color,
    name:value.name,singleGarmentConfirmed:!multi&&garmentConfirmed120.checked,
    instanceConfirmed:multi&&garmentConfirmed120.checked,
    ...(multi?{cutoutSHA256:item.segmentHint?.cutoutSHA256}:{}),
   };
   // P119 is the only writer for this research-only newly captured piece.
   // It independently re-hashes original JPEG (+ cutout JPEG for multi),
   // rechecks the actual saved owner draft and wardrobe *inside* the IDB
   // transaction, and atomically inserts the reviewed item/removes its draft.
   const liveOwner=()=>window.closetAuth===auth&&auth.user?.id===owner&&
     db?.name==='closet-current-user-'+owner&&
     $('authGate')?.hidden===true&&$('appShell')?.hidden===false?owner:null;
   const assertLease=()=>{
    auth.assertCurrent?.();
    return liveOwner()===owner&&batch.includes(item)&&
     dialog.isConnected&&dialog.open&&
     reviewConfirmed120.checked&&garmentConfirmed120.checked;
   };
   const {commitHumanReviewedPhoto119}=await (nativeCanonical167Active
    ?import('./native-reviewed-private-save-167.mjs')
    :import('../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs'));
   const result=await queued(()=>commitHumanReviewedPhoto119({
    db,ownerId:owner,currentOwner:liveOwner,record:item,review,assertLease
   }));
   if(!result.saved)throw Error('Original photograph or garment review could not be verified; nothing was saved.');
   // Do not duplicate or overwrite P119's already-atomic owner draft update.
   // Reload the actual committed wardrobe entry, not local AI proposals.
   const stored=await new Promise((resolve,reject)=>{
    const request=db.transaction('items','readonly').objectStore('items').get(item.id);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
   });
   if(!stored||stored.ownerId!==owner||stored.sourceSHA256!==item.sourceSHA256)
    throw Error('Saved garment needs a safe wardrobe reload.');
   if(!items.some(x=>x.id===item.id))items.push(normalizeClothing(stored));
   batch=batch.filter(x=>x.id!==item.id);
   await nativeIndex07Refresh();
   dialog.close();render();scheduleMemoryReview();
   message('Reviewed '+stored.itemType+' · '+stored.color+' saved to your private closet. Original photograph preserved.');
   return;
  }
  await savePiece(value,batch.filter(x=>x.id!==item.id),{expectedSavedRow});
  const existing=items.find(x=>x.id===item.id);if(existing)Object.assign(existing,value);else items.push(value);
  batch=batch.filter(x=>x.id!==item.id);await persistDraft();dialog.close();render();scheduleMemoryReview();
 }catch(error){
  save.disabled=false;
  message(typeof reviewedCapture120!=='undefined'&&reviewedCapture120?'Reviewed garment was not saved. '+String(error.message||error)+
   ' Your original photo remains available for review.':
   correction10?'Saved garment not overwritten. '+String(error.message||error)+
   '. Reopen Adjust to review the latest clothing details.':
   'Could not save changes. Try again.');
 }};
 dialog.onclose=()=>{if(batch.some(x=>x.id===item.id)&&!wasAdjusted){item.userAdjusted=false;if(wasScanning&&item.localAnalyzed&&!localPending.has(item.id)){item.localAnalyzed=false;queueAutomatic(item);}}dialog.remove();};
 const actions=node('div',null,'actions');actions.append(save,cancel,remove);form.append(actions);dialog.append(form);document.body.append(dialog);dialog.showModal();
}
function renderRecognitionNotice(){
 const notice=$('recognitionNotice');if(!notice)return;
 const loading=recognitionState.phase==='loading',saveFailed=recognitionState.phase==='save-failed',failed=(recognitionState.phase==='failed'||saveFailed)&&batch.some(x=>!x.localAnalyzed),pending=localPending.size;
 notice.hidden=!loading&&!failed&&!pending;
 if(notice.hidden)return;
 $('recognitionLabel').textContent=failed?(saveFailed?'Couldn’t save this piece':'Photo scanner couldn’t start'):loading?(recognitionState.percent===null?'Preparing scanner…':recognitionState.percent>=100?'Finishing setup…':'Downloading scanner · '+recognitionState.percent+'%'):'Checking '+pending+' photo'+(pending===1?'':'s')+'…';
 $('recognitionHint').textContent=failed?(saveFailed?'Keep this page open. Check available device storage, then try again or tap Adjust.':'Your photos are kept. Try again, or tap Adjust on any photo.'):loading?'First use needs a download. Your photos are kept.':'Results appear below automatically.';
 $('retryRecognition').hidden=!failed;
 const progress=$('recognitionProgress');progress.hidden=!loading;
 if(loading){if(recognitionState.percent===null)progress.removeAttribute('value');else progress.value=recognitionState.percent;}
}
/**
 * PHOTO122 user-initiated research-only shortcut from the ACTUAL confirmed
 * original-photo result card to the existing native Style My New Clothes.
 * The style controller independently re-hashes each private wardrobe JPEG.
 * Never guess 3 looks if the owned closet lacks compatible pieces.
 */
async function styleJustReviewedPhoto122(itemId,expectedSHA,{fromCloset123=false,cutout124=false}={}){
 if(!reviewedStyle122Active)throw Error('PHOTO122 explicit opt-in required');
 if(fromCloset123&&!reviewedCloset123Active)
  throw Error('PHOTO123 saved closet styling requires explicit research opt-in');
 if(cutout124&&(!fromCloset123||!reviewedCutout124Active))
  throw Error('PHOTO124 source-bound cutout needs independent research opt-in');
 const auth=window.closetAuth,owner=auth?.user?.id,originalDb=db;
 const live=()=>owner&&window.closetAuth===auth&&auth.user?.id===owner&&
  db===originalDb&&db?.name==='closet-current-user-'+owner&&
  $('authGate')?.hidden===true&&$('appShell')?.hidden===false;
 if(!live())throw Error('Private signed-in wardrobe unavailable');
 const tracked=items.find(row=>row.id===itemId&&row.ownerId===owner&&
  row.sourceSHA256===expectedSHA);
 if(!tracked||(!fromCloset123&&(!sessionCapturedIds.has(itemId)||batch.some(x=>x.id===itemId)))||
    (fromCloset123&&batch.some(x=>x.id===itemId)))
  throw Error('Reviewed original is not in your saved closet');
 const persisted=await new Promise((resolve,reject)=>{
  try{
   const q=originalDb.transaction('items','readonly').objectStore('items').get(itemId);
   q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('Private saved garment unavailable'));
  }catch{reject(Error('Private saved garment unavailable'));}
 });
 if(!live()||!persisted||persisted.ownerId!==owner||
    persisted.sourceHashVerified!==true||persisted.ownerReviewed!==true||
    persisted.userAdjusted!==true||
    (fromCloset123&&(persisted.sourcePhotoOriginal!==true||
      persisted.reviewProvenance!=='explicit-owner-claim-not-independent-review-evidence'||
      (!cutout124&&persisted.singleGarmentVerified!==true)))||
    (cutout124&&(
      persisted.singleGarmentVerified!==false||
      persisted.humanReviewedSource!==true||
      persisted.confirmedCategory!==true||persisted.confirmedColor!==true||
      persisted.colorSource!=='user'||persisted.multipleGarments===true||
      persisted.segmentHint?.ownerReviewedInstance!==true||
      persisted.segmentHint?.verified!==true||
      persisted.segmentHint?.clipped===true||
      persisted.segmentHint?.originalSHA256!==expectedSHA||
      persisted.segmentHint?.cutoutSHA256!==persisted.cutoutSHA256||
      !/^[a-f0-9]{64}$/.test(persisted.cutoutSHA256||'')||
      persisted.cutoutSHA256===expectedSHA||
      !persisted.segmentHint?.cutoutImage||
      persisted.segmentHint.cutoutImage===persisted.originalPhoto?.image||
      !persisted.outfitSourceId))||
    persisted.sourceSHA256!==expectedSHA||
    persisted.originalPhoto?.sha256!==expectedSHA||
    (!cutout124&&persisted.originalPhoto?.image!==persisted.image)||
    (cutout124&&persisted.image!==persisted.originalPhoto?.image&&
      persisted.image!==persisted.segmentHint?.cutoutImage)||
    persisted.category==='Uncategorized'||persisted.itemType==='Unknown'||
    !persisted.color||persisted.color==='Unknown')
  throw Error('Saved owner garment or original JPEG changed; reopen My Closet');
 // The native wardrobe bridge is the only source of owned clothing IDs.
 // Reopen/re-hash this saved snapshot before selecting a pinned new garment.
 await nativeIndex07Refresh();
 if(!live())throw Error('Owner signed out while refreshing the saved closet');
 const panel=window.styleOwnedLive03Bridge;
 if(!panel?.selectGarment||!panel?.generate)
  throw Error('Style My New Clothes owner-private viewer is unavailable');
 await panel.selectGarment(itemId);
 if(!live())throw Error('Owner changed while selecting the photographed garment');
 const suggestions=await panel.generate();
 // PHOTO124: the existing native Style panel must actually show the SECOND
 // SHA-256-verified instance cutout, never silently show the full original
 // or fabricate 3D surfaces for an unverified garment.
 if(cutout124&&document.querySelector('#styleOwned03Pinned img')?.getAttribute('src')!==
    persisted.segmentHint.cutoutImage)
  throw Error('Visible reviewed cutout was not independently verified for 2D styling');
 if(!live()||panel.status()?.pinnedId!==itemId||
    suggestions?.combinations?.some(look=>look.pinnedId!==itemId))
  throw Error('Pinned item or owner changed while creating outfit choices');
 switchView('stylist');
 const count=suggestions?.combinations?.length||0;
 if(count<3)message('Your saved photo is pinned. '+count+
  ' complete owned outfits are available; add compatible clothes to reach three.');
 return Object.freeze({pinnedId:itemId,lookCount:count,
  originalSHA256Verified:panel.status().sourceSHA256Verified===true,
  familyAlpha:'HOLD',releaseAuthorized:false});
}
function renderPhotoResults(grid,results){
 grid.replaceChildren();
 if(!results.length){const box=node('div',null,'empty');box.append(node('h3','Your photos appear here'),node('p','Take a photo to add your first piece.'));grid.append(box);return;}
 for(const item of results){
  const card=node('article',null,'card photo-result'),image=node('img');image.src=item.image;image.alt=item.name||'Clothing photo';
  const body=node('div',null,'card-body'),pending=localPending.has(item.id),saved=items.some(x=>x.id===item.id),known=item.category!=='Uncategorized';
  const title=item.name||(known&&item.itemType&&item.itemType!=='Unknown'?item.itemType:known?item.category:'Clothing photo');
  const state=pending?'checking':saved?'saved':item.saveFailed||item.scanFailed?'error':item.possibleDuplicate?'review':known&&item.localAnalyzed&&item.requiresOwnershipConfirmation?'ready':'review';
  const label=pending?(recognitionState.activeId===item.id&&localReady?'Checking…':'Waiting…'):saved?(item.itemType==='Unknown'&&item.color?'Saved · refine type':'Saved'):item.saveFailed?'Not saved':item.scanFailed?'Scanner unavailable':item.possibleDuplicate?'Check duplicate':state==='ready'?'Ready to add':known?'Needs review':item.color?'Color found · confirm garment':'Needs a clearer photo';
  body.append(node('span',label,'photo-status '+state),node('h3',title));
  if(known)body.append(node('p',[item.category,item.itemType,item.color].filter(x=>x&&x!=='Unknown').join(' · '),'photo-category'));
  else if(!pending)body.append(node('p',item.color?'Color: '+item.color+' · confirm the garment category.':item.scanFailed?'Try again, or add the details with Adjust.':'Retake this item, or add its details with Adjust.','fine'));
  const extra=[item.pattern,item.sleeveLength,item.fit,...(item.seasons||[])].filter(x=>x&&x!=='Unknown'&&x!=='Not applicable');
  if(extra.length){const details=node('details',null,'photo-extra');details.append(node('summary','More details'),node('p',extra.join(' · ')));body.append(details);}
  if(!pending&&!saved&&item.possibleDuplicate)body.append(node('p','Compare with your closet before adding.','fine'));
  const adjust=node('button','Adjust','secondary');adjust.type='button';adjust.onclick=()=>adjustPhoto(item);body.append(adjust,cropButton(item));
  // Only a successfully saved, exact owner-reviewed camera original receives
  // the single-tap three-owned-outfits shortcut on the REAL Photo results card.
  if(typeof reviewedStyle122Active!=='undefined'&&reviewedStyle122Active&&
     saved&&sessionCapturedIds.has(item.id)&&item.ownerReviewed===true&&
     item.sourceHashVerified===true&&item.userAdjusted===true){
   const style=node('button','Get 3 outfits with this piece','secondary');
   style.type='button';style.classList.add('reviewed-style122');
   style.dataset.savedItemId=item.id;
   style.onclick=async()=>{
    style.disabled=true;
    try{await styleJustReviewedPhoto122(item.id,item.sourceSHA256);}
    catch(error){message('Could not style that saved photo safely. '+String(error.message||error)+
      '. Your closet and saved outfits are unchanged.');}
    finally{style.disabled=false;}
   };
   body.append(style);
  }
  card.append(image,body);grid.append(card);
 }
}
function render(){
 const previousFocus=document.activeElement,focusedCard=previousFocus?.closest?.('#closetGrid .card'),
  focusedItemId=focusedCard?.dataset.itemId,focusedAction=previousFocus?.dataset?.action;
 $('reviewCount').textContent=batch.length;$('closetCount').textContent=items.length;$('sessionCount').textContent=session;
 renderRecognitionNotice();
 const results=[...batch,...items.filter(item=>sessionCapturedIds.has(item.id))];
 renderPhotoResults($('reviewGrid'),results);
 renderPhotoResults($('scanResults'),results);
 const cg=$('closetGrid');cg.replaceChildren();
 while(cg.nextElementSibling?.matches('.closet-page-status136,.closet-page-more136'))cg.nextElementSibling.remove();
 const query=$('search').value.toLowerCase(),filter=$('filter').value;
 const closetKey136=JSON.stringify([query,filter,$('seasonFilter').value,$('sleeveFilter').value,
  !!window.closetBrowseAll,window.closetSlotFilter||'',window.closetItemType||'',window.closetSleeves||null]);
 if(closetKey136!==closetQueryKey136){closetQueryKey136=closetKey136;closetRendered136=closetPageSize136;}
 const visible=(query||filter!=='All categories'||window.closetBrowseAll||window.closetSlotFilter)?items.filter(x=>(!window.closetSlotFilter||outfitSlots.some(slot=>slot.id===window.closetSlotFilter&&slotAllows(slot,x)))&&(!window.closetItemType||x.itemType===window.closetItemType)&&(!window.closetSleeves||window.closetSleeves.includes(x.sleeveLength))&&clothingMatches(x,query,filter,$('seasonFilter').value,$('sleeveFilter').value)&&(!window.closetIndex02||window.closetIndex02.includes(x.id))):[];
 if(!visible.length)empty(cg,items.length?'No matching pieces.':'Your closet is ready to grow.',items.length?'Try a different search or category.':'Save your first piece from the review tab.');
 const page=visible.length<=100?visible:visible.slice(0,closetRendered136);
 for(const item of page){const card=node('article',null,'card'),im=node('img');card.dataset.itemId=item.id;im.loading='lazy';if(visible.length>100)im.decoding='async';im.src=item.image;im.alt=item.name;const body=node('div',null,'card-body');body.append(node('h3',item.name),node('p',[item.color,item.pattern].filter(x=>x&&x!=='Unknown'&&x!=='Not applicable').join(' · ')),node('p',item.seasons.length?item.seasons.join(' · '):'Season unknown'),node('p',[item.brand,item.size,item.material,item.occasion].filter(Boolean).join(' · ')),node('p',item.notes));if(item.itemType==='Unknown'&&item.color)body.append(node('p','Category and color saved · refine the type when convenient.','fine'));const actions=node('div',null,'actions'),edit=node('button','Adjust details','secondary'),del=node('button','Delete','secondary'),styleFocus=node('button','Get three outfit ideas','secondary');edit.dataset.action='edit-clothing';styleFocus.type='button';styleFocus.onclick=()=>{try{const auth=window.closetAuth,owner=auth?.user?.id;auth?.assertCurrent?.();if(!owner||db?.name!=='closet-current-user-'+owner||!items.some(saved=>saved.id===item.id))throw Error('This saved item is no longer available in your signed-in closet.');if(typeof refreshStylistFocusItems!=='function')throw Error('Style My New Clothes is not ready yet.');refreshStylistFocusItems();const select=$('stylistFocusItem');if(![...select.options].some(option=>option.value===item.id))throw Error('Review and save this clothing category before styling it.');switchView('stylist');select.value=item.id;$('styleCollectionForm').requestSubmit();}catch(error){message(error.message||'Could not start styling this saved item.');}};edit.onclick=()=>{const dialog=document.createElement('dialog');dialog.className='clothing-editor';dialog.style.cssText='border:1px solid #d9ddd2;border-radius:8px;max-width:440px;width:90%;padding:24px';
 {
  // Mobile saved-item editors can otherwise extend past the viewport and
  // their Save/Cancel buttons become covered by scrolling clothing fields.
  // Keep these bounds active on the normal saved-clothing editor.
  dialog.style.boxSizing='border-box';
  dialog.style.width='calc(100vw - 24px)';
  dialog.style.maxWidth='min(440px,calc(100vw - 24px))';
  dialog.style.minWidth='0';
  dialog.style.margin='auto';
  dialog.style.maxHeight='min(90dvh,750px)';
  dialog.style.overflowY='auto';
  dialog.style.overflowX='hidden';
  dialog.style.overscrollBehavior='contain';
  dialog.style.scrollPaddingBottom='12px';
 }const title=node('h2','Adjust clothing details');title.id='savedClothingEditorTitle';dialog.setAttribute('aria-labelledby',title.id);dialog.append(title);
 let dirty=false,saving=false;
 const f=node('form');const draft=structuredClone(item),collect=clothingFields(f,draft,()=>{dirty=true;}),
  expectedSavedRow=structuredClone(item),
  ok=node('button','Save changes','primary'),cancel=node('button','Cancel','secondary');
 f.className='card';f.style.padding='15px';
 if(expectedSavedRow){
  f.style.boxSizing='border-box';f.style.width='100%';
  f.style.maxWidth='100%';f.style.minWidth='0';
 }const editStatus=node('p',null,'fine');editStatus.setAttribute('role','status');editStatus.setAttribute('aria-live','polite');editStatus.style.cssText='grid-column:1 / -1;margin:0;white-space:normal;overflow-wrap:anywhere';
 const protectUnsaved=event=>{if(dirty||saving){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',protectUnsaved);f.addEventListener('input',()=>dirty=true);f.addEventListener('change',()=>dirty=true);
 const closeEditor=()=>{if(saving)return;if(!dirty||confirm('Discard your unsaved clothing changes?'))dialog.close();};
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeEditor();});
 cancel.type='button';cancel.onclick=closeEditor;f.onsubmit=async e=>{e.preventDefault();if(saving)return;saving=true;ok.disabled=cancel.disabled=true;editStatus.textContent='Saving changes…';try{const updated={...collect(),name:draft.name.trim()||'Closet piece'};
  // COLOR41: Notes/type edits preserve estimated color provenance; only a
  // direct Color input marks source=user. Still record deliberately reviewed
  // category, subtype, and other *non-color* facts as confirmed learning.
  if(typeof ClothingMemory!=='undefined'){
   Object.assign(updated,ClothingMemory.confirm(updated));
   // Object.assign does not transfer deletions from the confirmed copy.
   // Reopen weekly garment learning after deliberately saving an edit.
   delete updated.learningReviewedWeek;
  }
 if(nativeCorrection10Active()){
  updated.userAdjusted=true;updated.requiresOwnershipConfirmation=false;
  // MODEL45: Multi-piece IndexedDB rows may be normalized for display; CAS
  // must compare and write against the EXACT persisted row (not a normalized
  // snapshot). Re-read under the owner's DB; fail closed on conflicting edits.
  const before=expectedSavedRow.sourcePieceKey?await new Promise(resolve=>{
   try{
    const r=db.transaction('items').objectStore('items').get(expectedSavedRow.id);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null);
   }catch{resolve(null);}
  }):expectedSavedRow;
  if(!before||(expectedSavedRow.sourcePieceKey&&
    JSON.stringify(normalizeClothing(before))!==JSON.stringify(expectedSavedRow)))
   throw Error('CORRECTION10_STALE_SAVED_GARMENT_REOPEN_EDITOR');
  // LABELSYNC66 is an isolated opt-in research correction. Exact owner
  // source and CAS checks remain authoritative; only previously generated
  // titles can follow an explicit category/type/color correction.
  if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('correctedName66')==='research'&&
     expectedSavedRow.sourcePieceKey){
   const {syncOwnerGarmentName66}=await import('../research/corrected-name-index-66/owner-label-sync.mjs');
   updated.name=syncOwnerGarmentName66(before,updated).name;
  }
  await queued(()=>commitOwnerCorrection10(updated,before,null));
  await nativeIndex07Refresh();
 }else await saveEditedGarment(updated,expectedSavedRow);
 Object.assign(item,updated);dialog.close();render();scheduleMemoryReview();
 }catch(error){
  const errorMessage=error?.name==='QuotaExceededError'?
   'Changes were not saved. Storage is full. Your edits are still here. Free space, then try Save changes again.':expectedSavedRow?
   String(error.message||error).includes('CORRECTION10_STALE_SAVED_GARMENT')?
    'Another tab changed this garment. Your edits were not saved. Reload the page, then reopen Adjust details.':
    'Changes were not saved. Check the original photo and sign-in, then reopen Adjust details.':
   'Changes could not be saved.';
  editStatus.textContent=errorMessage;message(errorMessage);
  saving=false;ok.disabled=cancel.disabled=false;}};/* Saved editor actions */{
  const actionRow=node('div',null,'actions native-correction10-actions');
  actionRow.style.cssText='position:sticky;bottom:0;z-index:3;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;background:#fff;padding:12px 3px max(12px,env(safe-area-inset-bottom,0px));border-top:1px solid #d9ddd2;min-width:0';
  for(const button of [ok,cancel]){
   button.style.minHeight='52px';button.style.width='100%';
   button.style.padding='10px 6px';button.style.whiteSpace='normal';
  }
  actionRow.append(editStatus,ok,cancel);f.append(actionRow);
 }
 dialog.append(f);document.body.append(dialog);dialog.onclose=()=>{window.removeEventListener('beforeunload',protectUnsaved);dialog.remove();
 const restoreFocus=()=>{if($('closet').hidden||$('appShell').hidden||document.querySelector('dialog[open]'))return;const card=[...document.querySelectorAll('#closetGrid .card')].find(card=>card.dataset.itemId===item.id);(card?.querySelector('[data-action=edit-clothing]')||$('search')).focus({preventScroll:true});};
 restoreFocus();requestAnimationFrame(()=>{if(document.activeElement===document.body)restoreFocus();});
 };dialog.showModal();};del.onclick=async()=>{if(!confirm('Delete this closet piece?'))return;try{await removeItem(item.id);items=items.filter(x=>x.id!==item.id);render();}catch{message('Could not delete the piece.');}};if(typeof closetWearButton==='function')actions.append(closetWearButton(item));if(new URLSearchParams(location.search).get('styleOwned03')==='research'){
 const reviewedStored123=typeof reviewedCloset123Active!=='undefined'&&
  reviewedCloset123Active&&item.ownerReviewed===true&&item.userAdjusted===true&&
  item.sourceHashVerified===true&&item.sourcePhotoOriginal===true&&
  item.singleGarmentVerified===true&&
  item.reviewProvenance==='explicit-owner-claim-not-independent-review-evidence';
 const isReviewedSource123=typeof reviewedCloset123Active!=='undefined'&&
  reviewedCloset123Active&&item.ownerReviewed===true&&item.userAdjusted===true&&
  item.sourceHashVerified===true&&item.sourcePhotoOriginal===true&&
  item.reviewProvenance==='explicit-owner-claim-not-independent-review-evidence';
 const reviewedCutoutStored124=typeof reviewedCutout124Active!=='undefined'&&
  reviewedCutout124Active&&isReviewedSource123&&item.humanReviewedSource===true&&
  item.singleGarmentVerified===false&&item.confirmedCategory===true&&
  item.confirmedColor===true&&item.colorSource==='user'&&
  item.segmentHint?.verified===true&&
  item.segmentHint?.ownerReviewedInstance===true&&
  item.segmentHint?.clipped!==true&&
  item.segmentHint?.originalSHA256===item.sourceSHA256&&
  item.segmentHint?.cutoutSHA256===item.cutoutSHA256&&
  /^[a-f0-9]{64}$/.test(item.cutoutSHA256||'')&&
  item.cutoutSHA256!==item.sourceSHA256&&
  item.segmentHint?.cutoutImage!==item.originalPhoto?.image&&
  typeof item.segmentHint?.cutoutImage==='string'&&
  item.multipleGarments!==true;
 if(reviewedCutoutStored124){
  // Label truthfully: a manually reviewed region is a visible 2D photograph,
  // not a learned segment/mask or an accepted 3D garment.
  im.src=item.segmentHint.cutoutImage;
  im.alt='Owner-reviewed photograph cutout, 2D-only: '+(item.name||item.itemType);
  body.append(node('p','Owner-reviewed visible cutout · 2D photo only','fine'));
 }
 const styleNew=node('button',reviewedCutoutStored124?'Get 3 outfits with this piece · 2D photo only':
  reviewedStored123?'Get 3 outfits with this piece':'Style this piece','secondary');
 styleNew.type='button';
 if(reviewedStored123||reviewedCutoutStored124){
  styleNew.classList.add('reviewed-closet123');
  if(reviewedCutoutStored124)styleNew.classList.add('reviewed-cutout124');
  styleNew.dataset.savedItemId=item.id;
 }
 styleNew.onclick=async()=>{
  styleNew.disabled=true;
  try{
   if(reviewedCutoutStored124)await styleJustReviewedPhoto122(item.id,item.sourceSHA256,{
    fromCloset123:true,cutout124:true
   });
   else if(reviewedStored123)await styleJustReviewedPhoto122(item.id,item.sourceSHA256,{fromCloset123:true});
   else{
    switchView('stylist');
    if(!window.styleOwnedLive03Bridge?.selectGarment)
     throw Error('Style My New Clothes is not ready');
    await window.styleOwnedLive03Bridge.selectGarment(item.id);
   }
  }catch(error){message('Could not reopen saved clothing for private styling. '+
    String(error.message||error)+'. Your closet and outfits are unchanged.');}
  finally{styleNew.disabled=false;}
 };
 actions.append(styleNew);
}actions.append(styleFocus,edit,cropButton(item),del);body.append(actions);card.append(im,body);if(typeof enableClosetDrag==='function')enableClosetDrag(im,item);cg.append(card);}
 if(visible.length>page.length){
  const more=node('button','Show more clothing','secondary closet-page-more136');more.type='button';
  more.setAttribute('aria-label','Show more clothing');
  more.onclick=()=>{closetRendered136=Math.min(visible.length,closetRendered136+closetPageSize136);render();};
  const status=node('p',`Showing ${page.length} of ${visible.length} pieces.`,'fine closet-page-status136');status.setAttribute('role','status');
  cg.after(status,more);
 }
 if(typeof renderClosetBrowser==='function')renderClosetBrowser();
 if(typeof renderTrendMatches==='function')renderTrendMatches();if(typeof renderOutfitBoard==='function')renderOutfitBoard();if(typeof renderStyledCollection==='function')renderStyledCollection();if(typeof renderHomePieces==='function')renderHomePieces();if(typeof renderOutfitCapture==='function')renderOutfitCapture();
 // Rebuilding a garment card must not drop keyboard focus onto the page body.
 if(focusedItemId&&focusedAction==='edit-clothing'&&previousFocus.isConnected===false&&document.activeElement===document.body&&
    !$('closet').hidden&&$('appShell').hidden===false&&!document.querySelector('dialog[open]')){
  const replacement=[...cg.querySelectorAll('.card')].find(card=>card.dataset.itemId===focusedItemId);
  replacement?.querySelector('[data-action=edit-clothing]')?.focus({preventScroll:true});
 }
}
for(const c of categories){const o=node('option',c);$('filter').append(o);}$('search').oninput=render;$('filter').onchange=render;
function pixels(){const ctx=tiny.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0,32,32);return ctx.getImageData(0,0,32,32).data.slice();}
function difference(a,b){if(!a||!b)return 255;let total=0;for(let i=0;i<a.length;i+=4)total+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);return total/(a.length/4*3);}
function snap(){if(!video.videoWidth||video.readyState<2)throw Error('The camera has not provided a usable frame yet.');const scale=typeof captureProof01Active!=='undefined'&&captureProof01Active?1:Math.min(1,2048/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.94);}
function beep(){if(!$('sound').checked||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=740;g.gain.value=.04;o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.12);}catch{}}
function candidate(image,options={}){
 // The native P167 camera/import path must never silently downgrade an
 // original-capture attempt into an unverified saved photo. Other inherited
 // research multi-item/legacy calls still use the P119 save-time gate.
 if(typeof nativeCanonical167Active!=='undefined'&&nativeCanonical167Active&&
    !options.sourceProof&&!options.originalSourceProof&&
    !options.outfitSourceId){
   message('Original photograph verification was not available. Retake or import this photo.');
   return false;
 }
 if([...items,...batch].some(item=>item.image===image)){if(typeof recordDeviceEvent==='function')recordDeviceEvent('exact_duplicate_skipped');message('Exact duplicate skipped. Show the next garment.');return false;}
 const item=normalizeClothing({id:crypto.randomUUID(),image,name:'',category:'Uncategorized',color:'',notes:'',localStatus:'Reading photo…'});
 if(typeof recordDeviceEvent==='function')recordDeviceEvent('photo_queued');
 if(typeof captureProof01Active!=='undefined'&&captureProof01Active){
  const proof=options.sourceProof||options.originalSourceProof;
  if(proof&&!captureProofOwner())return false;
  if(proof?.sourceHashVerified===true&&proof.originalPhoto?.sha256===proof.sourceSHA256){
   item.originalPhoto=structuredClone(proof.originalPhoto);
   item.ownerId=captureProofOwner();
   item.sourceSHA256=proof.sourceSHA256;item.sourceHashVerified=true;
   // A captured frame is NOT independently known to contain one garment.
   item.singleGarmentVerified=false;
   item.recognitionFromOriginal=options.sourceProof?.image===image;
  }
 }
 if(options.outfitSourceId){item.outfitSourceId=options.outfitSourceId;item.requiresOwnershipConfirmation=false;item.segmentHint=options.segmentHint;item.recognitionPhoto=options.recognitionPhoto;item.originalPhoto=options.originalSourceProof?.originalPhoto||options.originalPhoto;item.cropBounds=options.cropBounds;if(options.colorEstimate){Object.assign(item,ClothingDetails.fillColor(item,options.colorEstimate));if(item.colorSource==='photo-estimate')item.colorMethod='garment-mask';}}
 batch.push(item);sessionCapturedIds.add(item.id);persistDraft();session++;$('sessionCount').textContent=session;$('reviewCount').textContent=batch.length;$('lastCaptureImage').src=image;$('lastCaptureImage').hidden=false;
 queueAutomatic(item);return true;
}
function queueAutomatic(item){
 if(localPending.has(item.id)||!batch.some(x=>x.id===item.id))return;
 localPending.add(item.id);automaticQueue.push(item);drainAutomatic();
}
async function drainAutomatic(){
 if(automaticRunning)return;automaticRunning=true;
 try{while(automaticQueue.length){const item=automaticQueue.shift();if(batch.some(x=>x.id===item.id))await recognizeItem(item);else localPending.delete(item.id);}}
 finally{automaticRunning=false;render();scheduleMemoryReview();}
}
function stopCamera(){
 cameraRequest++;cameraOpening=false;clearInterval(timer);timer=null;
 if(stream)stream.getTracks().forEach(t=>t.stop());
 stream=null;cameraMode=null;video.srcObject=null;video.classList.remove('visible');
 $('placeholder').hidden=false;$('cameraChoices').hidden=false;$('cameraActions').hidden=true;
 controls(false);$('captureState').textContent='Camera stopped · your photos are ready to review';
}
function controls(disabled){for(const id of ['start','startAuto','upload','interval','clothingPhotos','singleCameraCapture','outfitCamera','outfitUpload','outfitRetry','captureSingle','captureOutfit'])$(id).disabled=disabled;}
function finishScan(){
 const wasManual=cameraMode==='manual';
 if(!wasManual&&stream&&session===0&&video.readyState>=2&&video.videoWidth){try{if(!(typeof captureProof01Active!=='undefined'&&captureProof01Active))candidate(snap());}catch{}}
 stopCamera();
 if(batch.length){message('');switchView('review');}
 else if(session>0){message('');switchView('review');}
 else{message(wasManual?'No photos taken yet. Take photos and tap the shutter when a garment is ready.':'No camera frames were received. Try Take photos or choose a saved closet video.');$('captureState').textContent='No photos captured · choose a camera option to try again';}
}
function captureTick(now=Date.now()){
 if(!stream||cameraMode!=='auto')return;
 if(typeof captureProof01Active!=='undefined'&&captureProof01Active&&captureProofTaking)return;
 const ready=video.readyState>=2&&video.videoWidth>0;
 if(!cadence.due(now,ready)){
  if(!ready)$('captureState').textContent='Waiting for camera images…';
  else $('captureState').textContent=`Next photo in ${Math.max(1,Math.ceil((cadence.intervalMs-(now-cadence.last))/1000))} seconds · hold the garment still`;
  return;
 }
 try{if(typeof captureProof01Active!=='undefined'&&captureProof01Active){captureProofPhoto().then(accepted=>{if(accepted){cadence.captured(Date.now());beep();$('captureState').textContent=session+' images captured · show the next piece';if(session>=60)finishScan();}}).catch(()=>message('Could not verify this frame. Take the photo again.'));return;}candidate(snap());cadence.captured(now);beep();$('captureState').textContent=`${session} images captured · show the next piece`;
 if(session>=60){finishScan();message('60 images collected. Review this batch before continuing.');}}
 catch(e){$('captureState').textContent='Waiting for a usable camera frame…';}
}
async function captureProofPhoto(){
 if(captureProofTaking||!stream||!cameraMode)return false;
 const owner=captureProofOwner(),request=cameraRequest;
 if(!owner){message('Sign in again before adding a photo.');return false;}
 captureProofTaking=true;
 try{
  const width=video.videoWidth,height=video.videoHeight,image=snap();
  const proof=await captureProofFromJPEG(image,{width,height,origin:'camera'},owner);
  if(request!==cameraRequest||!stream||captureProofOwner()!==owner||document.hidden)return false;
  return candidate(proof.image,{sourceProof:proof});
 }finally{captureProofTaking=false;}
}
function takePhoto(){
 if(!stream||cameraMode!=='manual')return;
 if(typeof captureProof01Active!=='undefined'&&captureProof01Active){
  captureProofPhoto().then(accepted=>{if(accepted){beep();$('captureState').textContent=session+' photos taken · ready for the next piece';if(session>=60)finishScan();}})
  .catch(()=>message('This photo could not be verified. Try taking it again.'));return;
 }
 try{candidate(snap());beep();$('captureState').textContent=`${session} photos taken · ready for the next piece`;if(session>=60){finishScan();message('60 photos collected. Review this batch before continuing.');}}
 catch{message('The camera is still getting ready. Wait a moment, then tap Take photo again.');}
}
async function startCamera(mode){
 if(busy||stream||cameraOpening)return;
 const request=++cameraRequest;cameraOpening=true;busy=true;controls(true);
 $('captureState').textContent='Opening camera…';
 try{audio=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();}catch{}
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access unavailable. Choose saved photos or a closet video instead.');
  const facing=typeof captureProof01Active!=='undefined'&&captureProof01Active?$('captureCameraFacing')?.value||'environment':'environment';
  let acquired;
  if(!(typeof captureProof01Active!=='undefined'&&captureProof01Active))
   acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
  else try{acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1080}},audio:false});}
  catch(error){
   if(!(typeof captureProof01Active!=='undefined'&&captureProof01Active&&
      ['OverconstrainedError','NotFoundError','NotReadableError'].includes(error.name)))throw error;
   // On unsupported devices relax preference only; permission denial never bypassed.
   acquired=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
  }
  if(request!==cameraRequest){acquired.getTracks().forEach(track=>track.stop());return;}
  stream=acquired;cameraMode=mode;
  if(typeof captureProof01Active!=='undefined'&&captureProof01Active)
   for(const track of acquired.getTracks())track.addEventListener?.('ended',()=>{
    if(stream===acquired){stopCamera();message('Camera disconnected. Your existing photos are ready for review.');}
   },{once:true});
  video.removeAttribute('src');video.srcObject=stream;video.classList.add('visible');$('placeholder').hidden=true;
  await video.play();session=0;$('sessionCount').textContent='0';$('lastCaptureImage').hidden=true;
  if(request!==cameraRequest)return;
  cameraOpening=false;$('cameraChoices').hidden=true;$('cameraActions').hidden=false;$('takePhoto').hidden=mode!=='manual';
  if(mode==='auto'){
   cadence=new CaptureCadence(Number($('interval').value)*1000,Date.now());
   timer=setInterval(()=>captureTick(),250);captureTick();
   message(`Automatic scan: one photo every ${$('interval').value} seconds. Watch the countdown and hold each garment still. Tap Done to stop the camera.`);
  }else{
   $('captureState').textContent='Frame a garment · tap Take photo when ready';
   message('Take each photo at your own pace. Tap Done when you are finished.');
  }
 }catch(e){
  if(request===cameraRequest){stopCamera();message(e.name==='NotAllowedError'?'Camera permission was denied. Allow camera access in your browser, or choose saved photos.':(e.message||'Camera could not start. Choose saved photos or a closet video.'));}
 }
 finally{busy=false;if(!stream)controls(false);}
}
if(typeof captureProof01Active!=='undefined'&&captureProof01Active)$('captureCameraFacingWrap').hidden=false;
if(typeof mobileCameraToCloset75Active!=='undefined'&&mobileCameraToCloset75Active)$('singleCameraCaptureWrap').hidden=false;
$('start').onclick=()=>startCamera('manual');
$('startAuto').onclick=()=>startCamera('auto');
$('takePhoto').onclick=takePhoto;
$('stop').onclick=finishScan;
function waitEvent(target,event,timeout=15000){return new Promise((resolve,reject)=>{let t;const clean=()=>{clearTimeout(t);target.removeEventListener(event,ok);target.removeEventListener('error',fail);};const ok=()=>{clean();resolve();},fail=()=>{clean();reject(Error('This video could not be read. Try an MP4 recorded by your phone.'));};target.addEventListener(event,ok,{once:true});target.addEventListener('error',fail,{once:true});t=setTimeout(fail,timeout);});}
async function upload(file){if(!file||busy)return;if(file.size>150*1024*1024)return message('Choose a video smaller than 150 MB. Short batches work best.');stopCamera();busy=true;controls(true);let url;const startLength=batch.length;try{url=URL.createObjectURL(file);video.src=url;video.classList.add('visible');$('placeholder').hidden=true;const loaded=waitEvent(video,'loadedmetadata');video.load();await loaded;if(!Number.isFinite(video.duration)||video.duration<=0)throw Error('Video duration could not be read. Try a regular MP4.');if(video.duration>180)throw Error('Please trim this video to 3 minutes or less.');session=0;const interval=Number($('interval').value);for(let t=Math.min(.1,video.duration/2);t<video.duration;t+=interval){const seek=waitEvent(video,'seeked');video.currentTime=t;await seek;if(typeof captureProof01Active!=='undefined'&&captureProof01Active){const owner=captureProofOwner();const image=snap(),proof=await captureProofFromJPEG(image,{width:video.videoWidth,height:video.videoHeight,origin:'video-frame'},owner);if(captureProofOwner()!==owner)throw Error('Video import account changed');candidate(proof.image,{sourceProof:proof});}else candidate(snap());const progress=Math.round(t/video.duration*100);$('captureState').textContent=`Collecting images · ${progress}%`;}message('');switchView('review');}catch(e){render();if(batch.length>startLength){message(`${session} images recovered before processing stopped. ${e.message}`);switchView('review');}else message(e.message);}finally{busy=false;controls(false);video.removeAttribute('src');video.load();if(url)URL.revokeObjectURL(url);$('captureState').textContent='Ready for another batch';}}
$('upload').onchange=e=>{upload(e.target.files[0]);e.target.value='';};
$('discard').onclick=()=>{if(batch.length&&confirm('Discard all unsaved images in this batch?')){batch=[];persistDraft();session=0;render();}};
$('export').onclick=async()=>{if(typeof outfitBoardReady!=='undefined')await outfitBoardReady;if(new URLSearchParams(location.search).get('restoreAtomic01')==='research'){
  try{
   if(!window.restoreAtomic01Bridge)throw Error('Verified private recovery is not ready');
   const {data}=await window.restoreAtomic01Bridge.exportJSON();
   const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=node('a');a.href=url;
   a.download='closet-current-owner-backup-v4.json';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   message('Private lossless backup exported. Store this file securely.');
  }catch(e){message(e.message||'Private backup failed; no data changed.');}
  return;
 }if(!items.length&&(typeof inspirationLooks==='undefined'||!inspirationLooks.length))return message('Save a closet piece or inspiration look before exporting.');const blob=new Blob([JSON.stringify({format:'closet-current',version:3,items,looks:typeof inspirationLooks!=='undefined'?inspirationLooks:[],outfitBoard:typeof boardBackup==='function'?boardBackup():undefined})],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='closet-current-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Backup downloaded. Keep it somewhere you can find again.');};
$('import').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(!db)return message('Browser storage is unavailable.');if(file.size>100*1024*1024)return message('Backup must be smaller than 100 MB.');try{const data=JSON.parse(await file.text());
 if(new URLSearchParams(location.search).get('restoreAtomic01')==='research'){
   if(new URLSearchParams(location.search).get('nativeLossless04')!=='research'||
      !window.restoreAtomic01Bridge)throw Error('Verified lossless restore unavailable; nothing changed');
   const result=await window.restoreAtomic01Bridge.importBackup(data,{
    confirm:({incoming,existing,savedExisting})=>confirm(
     'Replace '+existing+' existing clothes and '+savedExisting+' saved outfits with '+
     incoming.itemCount+' backup clothes and '+incoming.savedCount+
     ' saved outfits? The old local version will be replaced. Cancel keeps everything unchanged.')
   });
   if(result.cancelled)return message('Restore canceled. Your original closet is unchanged.');
   message('All clothing photos, category corrections and outfits restored together.');
   return;
  }
  if(new URLSearchParams(location.search).get('nativeLossless04')==='research')
   throw Error('Import blocked in lossless research mode BEFORE any wardrobe write: atomic wardrobe+outfit restore requires separate acceptance');if(data.format!=='closet-current'||![1,2,3].includes(data.version)||!Array.isArray(data.items)||data.items.length>1000)throw Error('Choose a Closet Current backup.');const valid=data.items.map(x=>{if(typeof x.id!=='string'||!x.id||typeof x.image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x.image)||x.image.length>3000000)throw Error('Backup contains an invalid image.');return normalizeClothing({...x,id:x.id.slice(0,100),image:x.image,name:String(x.name||'Closet piece').slice(0,120),category:categories.includes(x.category)?x.category:'Uncategorized',color:String(x.color||'').slice(0,120),notes:String(x.notes||'').slice(0,500),savedAt:String(x.savedAt||'')});});if(data.looks){if(!Array.isArray(data.looks)||data.looks.length>100)throw Error('Invalid inspiration backup.');data.looks=data.looks.map(validLook);}if(!confirm(`Import ${valid.length} pieces? Matching IDs will update existing pieces.`))return;await writeAll(valid);items=(await readAll()).map(normalizeClothing);if(data.looks)await importLooks(data.looks);if(data.outfitBoard&&typeof importBoardBackup==='function')await importBoardBackup(data.outfitBoard);render();message('Backup imported.');}catch(err){message(err.message||'Import failed.');}};
window.addEventListener('pagehide',stopCamera);window.addEventListener('beforeunload',e=>{if(batch.length||busy){e.preventDefault();e.returnValue='';}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(stream||cameraOpening)){stopCamera();message('Camera stopped while the app was in the background. Your photos are ready to review.');}});
const closetReady=(async()=>{await window.closetAuth.ready;try{window.closetAuth?.assertCurrent?.();const connection=await openDB();
 try{window.closetAuth?.assertCurrent?.();}catch(error){connection.close();return;}
 db=connection;items=(await readAll()).map(normalizeClothing);window.closetAuth?.assertCurrent?.();batch=(await readDraft()).map(normalizeClothing);window.closetAuth?.assertCurrent?.();for(const item of batch)if(item.outfitSourceId&&item.requiresOwnershipConfirmation){item.requiresOwnershipConfirmation=false;item.localAnalyzed=false;}if(batch.length)message(`${batch.length} unfinished photos are waiting in More → Photo results.`);}catch{message('Browser storage is unavailable. Use a regular browser to save your closet.');}render();for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);})();

/**
 * INDEX-02 is opt-in research ONLY. Default app behavior does not load this
 * module. The exact owner-bound database is checked before every saved read.
 * No production deployment, schema migration, new network call or photo copy.
 */
if(new URLSearchParams(location.search).get('index02')==='after'){
 closetReady.then(async()=>{
  const signed=window.closetAuth?.user?.id;
  if(!signed||db?.name!=='closet-current-user-'+signed)throw Error('INDEX-02 sign-in/owner database mismatch');
  const {createMobileWardrobeIndex02}=await import('../research/wardrobe-index-02/mobile-index-app.mjs');
  if(db?.name!=='closet-current-user-'+window.closetAuth?.user?.id)
   throw Error('INDEX-02 account changed during research import');
  const bridge=createMobileWardrobeIndex02({
   document,closetElement:$('closet'),
   authenticatedOwner:()=>window.closetAuth?.user?.id||null,
   async readSavedItems(){
    const owner=window.closetAuth?.user?.id;
    if(!owner||db?.name!=='closet-current-user-'+owner)throw Error('INDEX-02 owner-bound storage unavailable');
    const rows=await readAll();
    if(!owner||db?.name!=='closet-current-user-'+owner||window.closetAuth?.user?.id!==owner)
     throw Error('INDEX-02 changed account while indexing');
    return rows;
   },
   onRerender:render
  });
  window.closetIndex02=bridge;
  await bridge.refresh();
 }).catch(()=>message('The optional closet index could not load. Your saved clothes and original photos are unchanged.'));
}


for(const c of categories.slice(1))$('batchCategory').append(node('option',c));
$('applyCategory').onclick=()=>{const category=$('batchCategory').value;if(!category)return message('Choose a category for this batch.');let count=0;for(const item of batch)if(item.category==='Uncategorized'){item.category=category;Object.assign(item,normalizeClothing(item));count++;}persistDraft();render();message(`Category applied to ${count} uncategorized candidates.`);};

for(const season of clothingSchema.seasons.slice(0,4))$('seasonFilter').append(node('option',season));for(const sleeve of clothingSchema.sleeve)$('sleeveFilter').append(node('option',sleeve));$('seasonFilter').onchange=render;$('sleeveFilter').onchange=render;

function stopRecognitionWorker(text,eventType='worker_start_failed'){
 if(typeof recordDeviceEvent==='function')recordDeviceEvent(eventType);
 localReady=false;recognitionUnavailable=true;recognitionState.phase='failed';recognitionState.percent=null;
 for(const job of localJobs.values()){clearTimeout(job.timer);job.reject(Error(text));}
 localJobs.clear();if(localWorker)localWorker.terminate();localWorker=null;renderRecognitionNotice();
}
function localRequest(type,image,itemId,hint){
 return new Promise((resolve,reject)=>{
  try{
   if(!localWorker){
    localWorker=new Worker('local-worker.mjs'+(recognitionAssetVersion?'?v='+recognitionAssetVersion:''),{type:'module'});
    const worker=localWorker;
    localWorker.onmessage=event=>{
     if(worker!==localWorker)return;
     const data=event.data;
     if(data.type==='progress'){
      for(const job of localJobs.values())if(job.type==='load')job.touch();
      if(typeof recordDeviceEvent==='function')recordDeviceEvent('scanner_progress',{stage:data.phase||data.stage,percent:data.percent});
      if(data.stage==='weights'&&Number.isFinite(data.percent))recognitionState.percent=Math.max(recognitionState.percent||0,data.percent);
      renderRecognitionNotice();return;
     }
     const job=localJobs.get(data.id);if(!job)return;
     if(data.type==='identified'){const item=batch.find(x=>x.id===job.itemId);if(item&&!item.userAdjusted&&segmentationAllows(item,data.choice)){applyLocalChoice(item,data.choice);render();}return;}
     clearTimeout(job.timer);localJobs.delete(data.id);
     if(data.type==='error'){localReady=false;if(typeof recordDeviceEvent==='function')recordDeviceEvent('scanner_error',{stage:data.stage,code:data.code,durationMs:Date.now()-job.started});job.reject(Error(data.text));}else job.resolve(data);
    };
    localWorker.onerror=()=>{if(worker===localWorker)stopRecognitionWorker('Local recognition is unavailable. Try again or use Adjust.');};
   }
   const id=crypto.randomUUID(),started=Date.now();
   const job={resolve,reject,type,itemId,started,timer:null,touch(){
    clearTimeout(job.timer);
    const remaining=(type==='load'?300000:60000)-(Date.now()-started);
    job.timer=setTimeout(()=>stopRecognitionWorker('Recognition timed out. Your photos are kept. Try again or use Adjust.','timeout'),Math.max(0,Math.min(type==='load'?60000:remaining,remaining)));
   }};
   localJobs.set(id,job);job.touch();localWorker.postMessage({type,id,image,hint});
  }catch{stopRecognitionWorker('Recognition could not start. Try again or use Adjust.');reject(Error('Recognition could not start.'));}
 });
}
async function enableLocal(){
 if(localReady)return true;
 if(!localLoadPromise)localLoadPromise=(async()=>{
  recognitionState.phase='loading';recognitionState.percent=null;if(typeof recordDeviceEvent==='function')recordDeviceEvent('setup_start');const setupStarted=Date.now();render();
  try{await localRequest('load');localReady=true;recognitionUnavailable=false;scheduleMemoryReview();if(typeof recordDeviceEvent==='function')recordDeviceEvent('setup_ready',{durationMs:Date.now()-setupStarted});recognitionState.phase='ready';recognitionState.percent=null;render();return true;}
  catch(error){recognitionState.phase='failed';renderRecognitionNotice();throw error;}
  finally{localLoadPromise=null;}
 })();
 return localLoadPromise;
}
function segmentationAllows(item,choice){
 const hint=item.segmentHint;if(!hint)return true;
 return !hint.clipped&&Array.isArray(hint.categories)&&hint.categories.includes(choice.category)&&(!hint.types?.length||choice.itemType==='Unknown'||hint.types.includes(choice.itemType));
}
function applyLocalChoice(item,choice,overwrite=false){
 if(choice.category==='Uncategorized')return;
 if(overwrite||item.category==='Uncategorized')item.category=choice.category;
 if(item.category===choice.category){if(overwrite||!item.itemType||item.itemType==='Unknown')item.itemType=choice.itemType;if(overwrite||!item.sleeveLength||item.sleeveLength==='Unknown')item.sleeveLength=choice.sleeveLength;}
 if(!item.name?.trim())item.name=choice.label.replace(/^a |^an /,'').replace(/^./,c=>c.toUpperCase());
 Object.assign(item,normalizeClothing(item));item.localStatus='Local suggestion applied. Confirm the category, sleeves, and seasons before saving.';
}
async function saveIndexed(item,index04ApprovedOwner=null){
 const index04Active=typeof index04ResearchActive!=='undefined'&&index04ResearchActive;
 if(index04Active&&(!index04ApprovedOwner||window.closetAuth?.user?.id!==index04ApprovedOwner||db?.name!=='closet-current-user-'+index04ApprovedOwner))return false;
 const value={...normalizeClothing(item),name:item.name.trim()||'Closet piece',savedAt:new Date().toISOString(),indexedAt:new Date().toISOString()};
 const saved=await queued(()=>new Promise((resolve,reject)=>{
  if(!db)return reject(Error('Browser storage is unavailable.'));
  if(!batch.some(x=>x.id===item.id)||item.userAdjusted||item.requiresOwnershipConfirmation||
     (index04Active&&(window.closetAuth?.user?.id!==index04ApprovedOwner||db?.name!=='closet-current-user-'+index04ApprovedOwner)))return resolve(false);
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put(value);
  tx.objectStore('state').put({id:'draft',batch:structuredClone(batch.filter(x=>x.id!==item.id))});
  tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 }));
 if(!saved)return false;
 if(!items.some(x=>x.id===item.id))items.push(value);
 batch=batch.filter(x=>x.id!==item.id);persistDraft();await nativeIndex07Refresh();return true;
}
async function recognizeItem(item){
 const index04Active=typeof index04ResearchActive!=='undefined'&&index04ResearchActive;
 const scanStarted=Date.now();let savingIndexed=false,index04ApprovedOwner=null;recognitionState.activeId=item.id;item.scanFailed=false;item.saveFailed=false;item.localStatus='Checking photo quality…';render();
 try{
  const quality=await checkPhoto(item.recognitionPhoto?.image||item.image);
  if(!batch.some(x=>x.id===item.id))return;
  if(quality.blank){if(typeof recordDeviceEvent==='function')recordDeviceEvent('blank_skipped');batch=batch.filter(x=>x.id!==item.id);message('Blank or featureless photo skipped. Frame one garment and try again.');return true;}
  if(!item.userAdjusted)Object.assign(item,ClothingDetails.fillColor(item,quality.colorEstimate));item.visualSignature=quality.signature;item.visualAspect=quality.aspect;
  const matches=[...items,...batch].filter(x=>x.id!==item.id);
  if(matches.some(x=>x.image===item.image)){if(typeof recordDeviceEvent==='function')recordDeviceEvent('exact_duplicate_skipped');batch=batch.filter(x=>x.id!==item.id);message('Exact duplicate skipped.');return true;}
  item.possibleDuplicate=matches.some(x=>Math.abs((x.visualAspect||0)-quality.aspect)<.02&&similarPhotos(quality.signature,x.visualSignature));
  if(recognitionUnavailable)throw Error('Recognition is unavailable. Try again or use Adjust.');
  item.localStatus='Identifying this garment…';render();
  let result;
  try{if(!localReady)await enableLocal();result=await localRequest('classify',item.recognitionPhoto?.image||item.image,item.id,item.segmentHint);}
  catch(error){recognitionUnavailable=true;throw error;}
  if(!batch.some(x=>x.id===item.id))return;
  if(typeof ClothingMemory!=='undefined'&&ClothingMemory.valid(result.recognitionMemory))item.recognitionMemory=result.recognitionMemory;
  item.localAnalyzed=true;item.localChoices=[];
  // Diagnostic evidence contains category/type scores only, never wardrobe images.
  if(result.diagnostics)item.recognitionDiagnostics={reason:result.reason||null,...result.diagnostics};
  // INDEX-04 opt-in: before any model label is applied or automatically saved,
  // independently prove original input bytes, owner, reviewed type and duplicate.
  // Missing evidence sends the existing unsaved item to Adjust, not the DB.
  if(index04Active){
   try{
    const owner=window.closetAuth?.user?.id;
    if(!owner||db?.name!=='closet-current-user-'+owner)throw Error('owner-bound database missing');
    const saved=await readAll();
    if(window.closetAuth?.user?.id!==owner||db?.name!=='closet-current-user-'+owner)
     throw Error('account changed while reading');
    const {evaluateOwnerSavedRecognition04}=await import('../research/index-04/verified-saved-recognition.mjs');
    const decision=await evaluateOwnerSavedRecognition04({
     ownerId:owner,currentOwner:()=>window.closetAuth?.user?.id||null,
     record:item,recognition:result,savedItems:saved
    });
    if(!batch.some(x=>x.id===item.id))return true;
    if(!decision.autoSaveSafe){
     item.recognitionReviewReasons=[...decision.reviewReasons];
     const suggested=decision.suggestion.category!=='Uncategorized'
      ?'Photo suggests '+decision.suggestion.category+' · '+decision.suggestion.itemType+'. ':'';
     item.localStatus=suggested+'Please confirm this garment and color in Adjust before saving. Original photo kept.';
     return true;
    }
    index04ApprovedOwner=owner;
   }catch{
    item.localStatus='Automatic indexing needs source or account verification. Confirm this garment in Adjust; your photo is kept.';
    return true;
   }
  }
  // Proof of JPEG bytes is not independent proof of a single garment. With
  // INDEX-04 disabled, CAPTURE-PROOF still fails closed to manual Adjust.
  if(typeof captureProof01Active!=='undefined'&&captureProof01Active&&!index04Active){
   item.localStatus='Original verified. Confirm garment category and color in Adjust before saving.';
   return true;
  }
  const corePartial=!result.strong&&result.categoryConfirmed&&result.categoryOnly&&result.choices?.[0]&&result.choices[0].itemType==='Unknown';
  if(corePartial){
   if(item.userAdjusted||!segmentationAllows(item,result.choices[0])){item.localStatus=item.userAdjusted?'Your adjustments are preserved. Save this piece when ready.':'The clothing checks disagree. Use Adjust or take a clearer photo.';return true;}
   applyLocalChoice(item,result.choices[0]);item.name=[item.color,result.choices[0].category].filter(Boolean).join(' ');
   if(!item.color||item.color==='Unknown'){item.localStatus='Garment category recognized. Confirm the specific type and color in Adjust; optional details can stay blank.';return true;}
  }
  if(!result.strong&&!corePartial){if(typeof recordDeviceEvent==='function')recordDeviceEvent('not_recognized',{durationMs:Date.now()-scanStarted});item.localStatus=(item.possibleDuplicate?'Possible duplicate. ':'')+(item.color?'Color kept. Confirm the garment category and type in Adjust.':'Garment identity needs confirmation. Choose a color and category in Adjust.');return true;}
  if(!segmentationAllows(item,result.choices[0])){item.localStatus=item.segmentHint?.clipped?'This piece is partly outside the photo. Retake the whole garment or use Adjust.':'The clothing mask and garment checks disagree. Use Adjust or take a clearer photo.';return true;}
  if(item.userAdjusted){item.localStatus='Your adjustments are preserved. Save this piece when ready.';return true;}
  applyLocalChoice(item,result.choices[0]);
  Object.assign(item,ClothingDetails.fill(item,result.choices[0],result.details));
  item.name=[item.color,item.itemType&&item.itemType!=='Unknown'?item.itemType:item.category].filter(Boolean).join(' ');item.indexingLevel=item.itemType==='Unknown'?'category-color':'specific-type';
  if(item.possibleDuplicate){if(typeof recordDeviceEvent==='function')recordDeviceEvent('duplicate_review');item.localStatus='Possible duplicate: compare this photo with your closet before saving.';return true;}
  if(item.requiresOwnershipConfirmation){item.localStatus='Identified. Add this piece only if it belongs in your closet.';return true;}
  item.localStatus='Recognized. Saving to your closet…';
  savingIndexed=true;
  const wasSaved=await saveIndexed(item,index04ApprovedOwner);
  if(wasSaved&&typeof recordDeviceEvent==='function')recordDeviceEvent('recognized_saved',{durationMs:Date.now()-scanStarted});
  if(!wasSaved&&index04Active){item.localStatus='Owner changed or confirmation is needed. Your photo remains unsaved for review.';return true;}
  if(recognitionState.phase==='save-failed')recognitionState.phase='ready';
  return true;
 }catch(error){
  item.localAnalyzed=false;item.scanFailed=true;item.saveFailed=savingIndexed;if(!item.visualSignature&&typeof recordDeviceEvent==='function')recordDeviceEvent('photo_check_failed',{stage:'photo_check',durationMs:Date.now()-scanStarted});if(recognitionUnavailable)recognitionState.phase='failed';
  if(savingIndexed){recognitionState.phase='save-failed';item.localStatus='Could not save this piece. Keep this page open, check device storage, then try again or use Adjust.';}
  else if(!item.visualSignature)item.localStatus='Could not read this photo. Retake it or adjust details.';
  else{item.localStatus=error.message||'Automatic indexing stopped. Retry or adjust details.';}
  $('localStatus').textContent=item.localStatus;return false;
 }finally{localPending.delete(item.id);if(recognitionState.activeId===item.id)recognitionState.activeId=null;persistDraft();render();}
}
async function recognizeBatch(){
 if(localBatch)return;localBatch=true;recognitionUnavailable=false;
 try{for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);}
 finally{localBatch=false;}
}
$('recognizeBatch').onclick=recognizeBatch;
$('retryRecognition').onclick=recognizeBatch;

async function importClothingPhotos(files){
 if(busy||!files.length)return;
 if(files.length>20)return message('Choose up to 20 clothing photos per batch.');
 stopCamera();busy=true;controls(true);session=0;
 try{
  const proofMode=(typeof captureProof01Active!=='undefined'&&captureProof01Active)||
   (typeof mobileCameraToCloset75Active!=='undefined'&&mobileCameraToCloset75Active);
  const owner=proofMode?captureProofOwner():null;
  if(proofMode&&!owner)throw Error('Please sign in before importing photos.');
  const decode=proofMode?file=>captureProofFromFile(file,owner):photoToJPEG;
  const result=await readPhotoBatch(files,decode,(decoded,file)=>{
   if(proofMode&&captureProofOwner()!==owner)return false;
   const proof=proofMode?decoded:null;
   const accepted=candidate(proof?proof.image:decoded,proof?{sourceProof:proof}:{});
   if(accepted){const item=batch.at(-1);if(item)item.importFilename=file.name;}
   return accepted;
  });
  if(typeof window!=='undefined')window.__lastPhotoImportResult=result;
  if(result.added){switchView('review');message(result.errors.length?result.errors.join('; '):'');}
  else message(result.errors.length?'No photos could be imported. '+result.errors.join('; '):'Exact duplicate photos were skipped; they are already in your closet or review batch.');
 }finally{busy=false;controls(false);}
}
$('clothingPhotos').onchange=event=>{const files=Array.from(event.target.files);event.target.value='';importClothingPhotos(files);};
$('singleCameraCapture').onchange=event=>{
 const files=Array.from(event.target.files||[]);event.target.value='';
 if(!files.length)return; // Picker cancellation leaves every existing review untouched.
 if(!(typeof mobileCameraToCloset75Active!=='undefined'&&mobileCameraToCloset75Active))return;
 importClothingPhotos(files);
};
$('singleCameraCapture').addEventListener('cancel',()=>{}); // Native picker cancel is intentionally a no-op.

let memoryReviewTimer=null,memoryReviewRunning=false;
function scheduleMemoryReview(){
 if(typeof ClothingMemory==='undefined'||memoryReviewTimer||memoryReviewRunning)return;
 memoryReviewTimer=setTimeout(()=>{memoryReviewTimer=null;reviewRecognitionMemory().catch(()=>{});},1500);
}
async function reviewRecognitionMemory(){
 if(typeof ClothingMemory==='undefined'||!db||memoryReviewRunning||busy||automaticRunning||localPending.size||document.hidden||document.querySelector('dialog[open]'))return;
 const week=ClothingMemory.week(),targets=items.filter(x=>(x.confirmedDetails||ClothingMemory.valid(x.recognitionMemory))&&(x.learningReviewedWeek!==week||!ClothingMemory.valid(x.recognitionMemory))).slice(0,8);
 if(!targets.length)return;
 memoryReviewRunning=true;let completed=0;
 try{if(!localReady)await enableLocal();for(const target of targets){
  if(busy||automaticRunning||localPending.size||document.hidden||document.querySelector('dialog[open]'))break;
  const before=JSON.stringify(target),image=target.recognitionPhoto?.image||target.image;let result;
  try{result=await localRequest(target.itemType==='Unknown'||!target.color?'classify':'features',image,null,target.segmentHint);}catch{break;}
  const current=items.find(x=>x.id===target.id);if(!current||JSON.stringify(current)!==before)continue;
  if(!ClothingMemory.valid(result.recognitionMemory))continue;
  const value={...current,recognitionMemory:result.recognitionMemory,learningReviewedWeek:week};delete value.weeklySuggestion;const choice=result.choices?.[0];if(result.strong&&choice&&segmentationAllows(current,choice)&&current.category===choice.category){const fields={itemType:choice.itemType,...ClothingDetails.recognizedFields(choice,result.details)};delete fields.color;value.weeklySuggestion={fields,requiresConfirmation:true,week};}const saved=await saveMemoryReview(value);if(saved&&(current.recognitionPhoto?.image||current.image)===image){completed++;current.recognitionMemory=saved.recognitionMemory;current.learningReviewedWeek=saved.learningReviewedWeek;if(saved.weeklySuggestion)current.weeklySuggestion=saved.weeklySuggestion;else delete current.weeklySuggestion;}
 }
 }finally{memoryReviewRunning=false;render();if(completed===8&&!memoryReviewTimer)memoryReviewTimer=setTimeout(()=>{memoryReviewTimer=null;reviewRecognitionMemory().catch(()=>{});},20000);}
}
closetReady.then(scheduleMemoryReview);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleMemoryReview();});

function saveMemoryReview(value){return queued(()=>new Promise((resolve,reject)=>{
 let saved=null;const tx=db.transaction('items','readwrite'),store=tx.objectStore('items'),read=store.get(value.id);
 read.onsuccess=()=>{const current=read.result;if(!current||(current.recognitionPhoto?.image||current.image)!==(value.recognitionPhoto?.image||value.image))return;
 saved={...current,recognitionMemory:value.recognitionMemory,learningReviewedWeek:value.learningReviewedWeek};delete saved.weeklySuggestion;
 if(current.category===value.category&&value.weeklySuggestion)saved.weeklySuggestion=value.weeklySuggestion;store.put(saved);
 };tx.oncomplete=()=>resolve(saved);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
}));}

setInterval(scheduleMemoryReview,60*60*1000);

