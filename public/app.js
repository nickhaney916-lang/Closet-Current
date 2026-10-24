'use strict';
const $=id=>document.getElementById(id), categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const recognitionAssetVersion=new URL(document.currentScript?.src||location.href).searchParams.get('v')||'';
let saving=false;const sessionCapturedIds=new Set();
let localWorker,localReady=false,localBatch=false,localLoadPromise=null,recognitionUnavailable=false;const automaticQueue=[];let automaticRunning=false;const localJobs=new Map(),localPending=new Set();
const recognitionState={phase:'idle',percent:null,activeId:null};
let writes=Promise.resolve();
function queued(work){
 const database=db,owner=window.closetAuth?.user?.id;
 const current=()=>!!owner&&db===database&&window.closetAuth?.user?.id===owner&&database?.name==='closet-current-user-'+owner;
 const result=writes.then(async()=>{
  if(!current())throw Error('Your account changed. Reload your closet before saving.');
  await window.closetCloud?.beforeWrite(database);
  if(!current())throw Error('Your account changed. Reload your closet before saving.');
  const value=await work();
  // A committed old-owner transaction must not populate a newly opened closet.
  if(!current())throw Error('Your account changed. Reload your closet before saving.');
  return value;
 });
 writes=result.catch(()=>{});result.then(()=>{if(current())window.closetCloud?.changed();}).catch(()=>{});return result;
}
let db,items=[],batch=[],stream,timer,busy=false,lastPixels=null,lastSaved=null,stable=0,lastCapture=0,session=0,audio,cadence;
let cameraMode=null,cameraOpening=false,cameraRequest=0;
const video=$('video'),canvas=document.createElement('canvas'),tiny=document.createElement('canvas');tiny.width=32;tiny.height=32;
function message(t){$('message').textContent=t;}
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
function writeAll(values){return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('items','readwrite');for(const v of values)tx.objectStore('items').put(v);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));}
function removeItem(id){return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('items','readwrite');tx.objectStore('items').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);}));}
// Copy mutable metadata now, sharing immutable photo strings until the write.
// Cloud restoration/editor changes must not replace the requested photo batch.
function draftMetadataSnapshot(value){
 if(Array.isArray(value))return value.map(draftMetadataSnapshot);
 if(ArrayBuffer.isView(value))return typeof value.slice==='function'?value.slice():new DataView(value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength));
 if(value instanceof ArrayBuffer)return value.slice(0);
 if(value instanceof Date)return new Date(value.getTime());
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,draftMetadataSnapshot(child)]));
 return value;
}
let pendingDraftWrite=null,clearingDraft=false;
function persistDraft(){
 // Prevent an old draft write from reintroducing photos while clearing.
 if((typeof clearingDraft!=='undefined'&&clearingDraft)||!db)return Promise.resolve(false);
 const owner=window.closetAuth?.user?.id,database=db;
 const current=()=>!!owner&&window.closetAuth?.user?.id===owner&&db===database&&database.name==='closet-current-user-'+owner;
 if(!current())return Promise.resolve(false);
 // Coalesce only adjacent draft requests. An intervening garment/state write
 // is an ordering barrier; never move a draft update across that transaction.
 window.closetUnsavedDraftOwner=owner;
 const metadata=draftMetadataSnapshot(batch);
 if(pendingDraftWrite&&!pendingDraftWrite.started&&pendingDraftWrite.tail===writes&&pendingDraftWrite.database===database&&pendingDraftWrite.owner===owner){pendingDraftWrite.snapshot=metadata;return pendingDraftWrite.promise;}
 const request={owner,database,started:false,snapshot:metadata};
 const result=writes.then(async()=>{
  if(!current())throw Error('Draft account changed');
  await window.closetCloud?.beforeWrite(database);
  if(!current())throw Error('Draft account changed');
  request.started=true;
  // Clone photo bytes once from the latest requested snapshot, not mutable
  // global batch state that a concurrent cloud reload may have replaced.
  const snapshot=structuredClone(request.snapshot);request.snapshot=null;
  return new Promise((resolve,reject)=>{
   const tx=database.transaction('state','readwrite');
   tx.objectStore('state').put({id:'draft',batch:snapshot});
   tx.oncomplete=()=>current()?resolve():reject(Error('Draft account changed'));
   tx.onerror=()=>reject(tx.error||Error('Draft storage failed'));
   tx.onabort=()=>reject(tx.error||Error('Draft storage stopped'));
  });
 });
 writes=result.catch(()=>{});request.tail=writes;
 request.promise=result.then(()=>{
  if(current()){if(pendingDraftWrite===request)window.closetUnsavedDraftOwner=null;$('draftSaveStatus').textContent='';$('retryDraftSave').hidden=true;window.closetCloud?.changed();}
  return true;
 },error=>{
  if(current()){
   const text=error?.name==='QuotaExceededError'?'Device storage is full. Unfinished photos are only in this open page. Keep it open, make space, then tap Retry saving photos. Your saved closet has not been deleted.':'Unfinished photos could not be saved on this device. Keep this page open and tap Retry saving photos. Your saved closet is kept.';
   $('draftSaveStatus').textContent=text;$('retryDraftSave').hidden=false;message(text);
  }
  return false;
 }).finally(()=>{request.snapshot=null;if(pendingDraftWrite===request)pendingDraftWrite=null;});
 pendingDraftWrite=request;return request.promise;
}
function readDraft(){return new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('draft');r.onsuccess=()=>resolve(r.result?.batch||[]);r.onerror=()=>reject(r.error);});}
function savePiece(value,nextBatch,stillCurrent){return queued(()=>new Promise((resolve,reject)=>{if(typeof stillCurrent==='function'&&!stillCurrent())return reject(Error('The photo or account changed. Reopen Adjust before saving.'));const tx=db.transaction(['items','state'],'readwrite');tx.objectStore('items').put(value);tx.objectStore('state').put({id:'draft',batch:structuredClone(nextBatch)});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));}
function node(tag,text,className){const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;}
function empty(grid,title,subtitle){const n=node('div',null,'empty');n.append(node('h3',title),node('p',subtitle));grid.append(n);}
function field(body,title,value,type='input'){const label=node('label',title),input=node(type);input.setAttribute('aria-label',title);if(type==='select'){for(const c of categories){const o=node('option',c);o.value=c;input.append(o);}}input.value=value||'';if(type==='input')input.maxLength=120;if(type==='textarea')input.maxLength=500;label.append(input);body.append(label);return input;}
function choice(body,title,value,options){const label=node('label',title),select=node('select');select.setAttribute('aria-label',title);for(const option of options)select.append(node('option',option));select.value=options.includes(value)?value:options[0];label.append(select);body.append(label);return select;}
// Classification, color inference and review always inspect camera-original
// RGB. Whole-outfit pieces use their unmasked original-pixel crop, never the
// separate display cutout, normalized preview or AI try-on image.
// For ordinary single-item captures, item.image itself is the original photo.
function recognitionSourcePhoto(item){
 // An outfit display cutout can be AI-cleaned, matted or partially restored.
 // The garment must be identified from ORIGINAL RGB captured pixels: its
 // unmasked source crop, after the complete original outfit was segmented.
 // An old/restored record without that crop must never silently fall back
 // to its clipped or generated display preview.
 const unmasked=item?.recognitionPhoto?.image;
 if(typeof unmasked==='string'&&unmasked.length)return unmasked;
 if(item?.outfitSourceId)return null;
 return typeof item?.image==='string'?item.image:null;
}
function clothingFields(body,item,onChange=()=>{}){
 Object.assign(item,normalizeClothing(item));
 if(item.image){const reference=node('figure',null,'clothing-reference'),photo=node('img'),caption=node('figcaption',item.name||'Garment photo');photo.src=item.image;photo.alt=item.name||'Garment being edited';caption.title=item.name||'Garment photo';reference.append(photo,caption);body.append(reference);}
 // The untouched source scene is useful for recognizing layers and shape,
 // even when a derived display cutout shows only part of a garment. Keep
 // this optional and collapsed; never classify the whole multi-item scene
 // as one garment or overwrite original-linked recognition metadata.
 if(item.outfitSourceId&&typeof item.originalPhoto?.image==='string'&&item.originalPhoto.image){
  const scene=node('details',null,'original-outfit-context');
  const photo=node('img');photo.src=item.originalPhoto.image;photo.alt='Original full outfit photograph before garment separation';
  scene.append(node('summary','View original outfit'),photo,
   node('p','Check the original outfit for sleeves, layers, shape and color before confirming this garment.','fine'));
  body.append(scene);
 }
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
 fillPhoto.onclick=async()=>{fillPhoto.disabled=true;completion.textContent='Checking color, then garment identity…';try{
  const source=recognitionSourcePhoto(item);
  if(!source){completion.textContent='Original garment photo crop unavailable. Use an original photo to identify this clothing item.';return;}
  const quality=await checkPhoto(source);if(!fillPhoto.isConnected)return;Object.assign(item,ClothingDetails.fillColor(item,trustedAutomaticPhotoColor(item,quality)));fields.color.value=item.color||'';refreshCompletion();if(!localReady)await enableLocal();const result=await localRequest('classify',recognitionSourcePhoto(item),null,item.segmentHint),choice=result.choices?.[0];if(!fillPhoto.isConnected)return;if((!result.strong&&!result.categoryConfirmed)||!choice||!segmentationAllows(item,choice)){completion.textContent=(item.color?'Color kept. ':'')+'Garment identity needs confirmation. Optional details can stay blank.';return;}if(item.category!=='Uncategorized'&&item.category!==choice.category){completion.textContent='Photo suggests '+choice.category+' · '+choice.itemType+'. Use Crop photo to review and change the category.';return;}applyLocalChoice(item,choice);Object.assign(item,ClothingDetails.fill(item,choice,result.details));fields.category.value=item.category;fields.itemType.replaceChildren(...['Unknown',...(clothingSchema.types[item.category]||[])].map(x=>node('option',x)));for(const [key,input]of Object.entries(fields))input.value=item[key]||'';refreshCompletion();onChange();}catch{if(fillPhoto.isConnected)completion.textContent=(item.color?'Color kept. ':'')+'Garment recognition is unavailable. Your details are kept; optional fields can stay blank.';}finally{fillPhoto.disabled=false;}};
 if(item.image&&recognitionSourcePhoto(item)&&(!item.color||item.color==='Unknown'))checkPhoto(recognitionSourcePhoto(item)).then(quality=>{if(!fields.color.isConnected||item.colorSource==='user')return;const updated=ClothingDetails.fillColor(item,trustedAutomaticPhotoColor(item,quality));if(updated!==item){Object.assign(item,updated);fields.color.value=item.color||'';if(!fillPhoto.disabled)refreshCompletion();onChange();}}).catch(()=>{});
 return ()=>normalizeClothing(item);
}
function cropClothingPhoto(item){
 if(localPending.has(item.id)||busy)return;
 if(stream||cameraOpening)stopCamera();
 openPhotoCrop(item,{
  async analyze(image){if(!localReady)await enableLocal();const result=await localRequest('classify',image,null);return (result.strong||result.categoryConfirmed)&&result.choices?.[0]&&segmentationAllows(item,result.choices[0])?{...result.choices[0],details:ClothingDetails.recognizedFields(result.choices[0],result.details)}:null;},
  async save(photo,choice){
   const value={...structuredClone(item),...photo,userAdjusted:true,localAnalyzed:true,scanFailed:false,saveFailed:false,possibleDuplicate:false};
   delete value.recognitionMemory;delete value.confirmedDetails;delete value.learningReviewedWeek;delete value.weeklySuggestion;if(!photo.recognitionPhoto)delete value.recognitionPhoto;delete value.colorMethod;if(value.colorSource==='photo-estimate'){value.color='';delete value.colorSource;}const quality=await checkPhoto(photo.recognitionPhoto?.image||photo.image);Object.assign(value,ClothingDetails.fillColor(value,photo.maskApplied?(photo.maskedColorEstimate||null):trustedAutomaticPhotoColor(value,quality)));// Only the editor's two-view verified foreground method is trusted.delete value.maskedColorEstimate;delete value.maskApplied;value.visualSignature=quality.signature;value.visualAspect=quality.aspect;delete value.localChoices;delete value.indexedAt;
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
 dialog.setAttribute('aria-label','Review clothing photo details');
 const editorDB=db,editorOwner=window.closetAuth?.user?.id,editorSource=recognitionSourcePhoto(item);
 const editorCurrent=()=>db===editorDB&&window.closetAuth?.user?.id===editorOwner&&recognitionSourcePhoto(item)===editorSource&&(batch.includes(item)||items.includes(item));
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
 const save=node('button','Save changes','primary'),
  style=node('button','Save & style this','primary'),
  cancel=node('button','Cancel','secondary'),remove=node('button','Remove photo','secondary');
 const reviewingNewPiece=batch.some(x=>x.id===item.id);
 style.type='submit';style.hidden=!reviewingNewPiece;
 cancel.type=remove.type='button';cancel.onclick=()=>dialog.close();
 if(reviewingNewPiece&&item.outfitSourceId&&
    (item.segmentHint?.displayFallback==='original-crop'||
     item.segmentHint?.clipped||item.segmentHint?.categories?.length!==1)){
  const caution=node('p','This region may contain more than one garment or background. Check the photo closely and use Crop photo first if it is not a single clothing piece.','fine');
  form.prepend(caution);
 }
 const wasAdjusted=item.userAdjusted,wasScanning=localPending.has(item.id);item.userAdjusted=true;
 remove.onclick=async()=>{try{if(items.some(x=>x.id===item.id))await removeItem(item.id);items=items.filter(x=>x.id!==item.id);batch=batch.filter(x=>x.id!==item.id);sessionCapturedIds.delete(item.id);await persistDraft();dialog.close();render();}catch{message('Could not remove this photo. Try again.');}};
 form.onsubmit=async event=>{
  event.preventDefault();
  if(!editorCurrent()){message('Your photo or account changed. Reopen Adjust before saving.');return;}
  const withStyling=event.submitter===style&&reviewingNewPiece;
  const value={...collect(),name:draft.name.trim()||
   (draft.itemType&&draft.itemType!=='Unknown'?draft.itemType:'Closet piece'),
   savedAt:new Date().toISOString(),userAdjusted:true,requiresOwnershipConfirmation:false};
  // Never save an Uncategorized/unsupported item in response to a request
  // to style it; the user can correct the category or choose plain Save.
  if(withStyling&&!['Tops','Bottoms','Dresses','Outerwear','Shoes'].includes(value.category)){
   message('Choose the clothing category before styling this piece.');
   return;
  }
  save.disabled=style.disabled=true;
  try{
   if(typeof ClothingMemory!=='undefined')Object.assign(value,ClothingMemory.confirm(value));
   if(value.color&&value.colorSource==='photo-estimate')value.colorSource='user';
   // savePiece atomically writes the garment AND removes it from the draft.
   // A second persistDraft here could fail after a successful transaction and
   // incorrectly tell the customer that their wardrobe save failed.
   value.recognitionReviewRequired=false;
   await savePiece(value,batch.filter(x=>x.id!==item.id),editorCurrent);
   const existing=items.find(x=>x.id===item.id);if(existing)Object.assign(existing,value);else items.push(value);
   batch=batch.filter(x=>x.id!==item.id);dialog.close();render();scheduleMemoryReview();
   if(withStyling){
    // The save is already durable. A stylist UI error is NOT a save failure.
    try{
     if(typeof styleNewClosetItem!=='function'||!styleNewClosetItem(value.id))
      message('Your clothing was saved. Open My closet to style this piece.');
    }catch{message('Your clothing was saved. Open My closet to style this piece.');}
   }
  }catch{
   save.disabled=style.disabled=false;
   message('Could not save changes. Try again.');
  }
 };
 dialog.onclose=()=>{if(batch.some(x=>x.id===item.id)&&!wasAdjusted){item.userAdjusted=false;if(wasScanning&&item.localAnalyzed&&!localPending.has(item.id)){item.localAnalyzed=false;queueAutomatic(item);}}dialog.remove();};
 const actions=node('div',null,'actions');actions.append(save,style,cancel,remove);form.append(actions);dialog.append(form);document.body.append(dialog);dialog.showModal();
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

// The normal scanner remains automatic. Only images with a confirmed garment
// category and no reliable color offer this one-choice inline fallback.
// Saving is transactional and rechecks eligibility at write time so it cannot
// overwrite a newer capture, duplicate, or unfinished recognition result.
function canConfirmReviewedColor(item){
 return !!item&&batch.some(x=>x.id===item.id)&&!items.some(x=>x.id===item.id)&&
  !localPending.has(item.id)&&item.localAnalyzed&&!item.userAdjusted&&
  !item.possibleDuplicate&&!item.requiresOwnershipConfirmation&&
  !item.scanFailed&&!item.saveFailed&&!item.recognitionReviewRequired&&
  // A restored outfit lacking its unmasked ORIGINAL RGB crop must not
  // become a closet item through the quick-color path. The display mask,
  // repaired cutout or AI derivative is never a valid recognition source.
  !!recognitionSourcePhoto(item)&&
  // A fragmented outline often includes the person's skin or a second
  // garment. Color-only confirmation is not sufficient to approve it.
  item.segmentHint?.displayFallback!=='original-crop'&&
  categories.includes(item.category)&&item.category!=='Uncategorized'&&
  // Quick save must obey the same outfit-piece checks as automatic indexing.
  // A clipped region or category/type conflict cannot be authorized by simply
  // choosing a color, even if stale draft metadata contains a category.
  (!item.segmentHint||(!item.segmentHint.clipped&&
    Array.isArray(item.segmentHint.categories)&&item.segmentHint.categories.includes(item.category)&&
    (!item.segmentHint.types?.length||item.itemType==='Unknown'||item.segmentHint.types.includes(item.itemType))))&&
  !ClothingDetails.validColor(item.color);
}
async function confirmReviewedColor(item,color){
 if(!ClothingDetails.validColor(color)||!canConfirmReviewedColor(item))return false;
 // A queued save may run after the user changes the crop, original scene,
 // clothing type, or selected source photo. Refuse to transfer a color
 // chosen for an OLD image onto a newer source or categorization.
 const source=recognitionSourcePhoto(item),display=item.image,
  scene=item.originalPhoto?.image??null,category=item.category,type=item.itemType;
 let value;
 const saved=await queued(()=>new Promise((resolve,reject)=>{
  if(!canConfirmReviewedColor(item)||recognitionSourcePhoto(item)!==source||
     item.image!==display||(item.originalPhoto?.image??null)!==scene||
     item.category!==category||item.itemType!==type)return resolve(false);
  if(!db)return reject(Error('Browser storage is unavailable.'));
  // Clone after the final safety/identity gate, never before the queue delay.
  value=normalizeClothing({...structuredClone(item),color,colorSource:'user',
   name:[color,item.itemType&&item.itemType!=='Unknown'?item.itemType:item.category].filter(Boolean).join(' '),
   userAdjusted:true,requiresOwnershipConfirmation:false,
   indexingLevel:item.itemType==='Unknown'?'category-color':'specific-type',
   savedAt:new Date().toISOString(),indexedAt:new Date().toISOString()});
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put(value);
  tx.objectStore('state').put({id:'draft',batch:structuredClone(batch.filter(x=>x.id!==item.id))});
  tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 }));
 if(!saved)return false;
 if(!items.some(x=>x.id===item.id))items.push(value);
 batch=batch.filter(x=>x.id!==item.id);
 persistDraft();render();scheduleMemoryReview();
 return true;
}
function renderPhotoResults(grid,results){
 grid.replaceChildren();
 if(!results.length){const box=node('div',null,'empty');box.append(node('h3','Your photos appear here'),node('p','Take a photo to add your first piece.'));grid.append(box);return;}
 for(const item of results){
  const card=node('article',null,'card photo-result'),image=node('img');image.src=item.image;image.alt=item.name||'Clothing photo';
  const body=node('div',null,'card-body'),pending=localPending.has(item.id),saved=items.some(x=>x.id===item.id),known=item.category!=='Uncategorized';
  const title=item.name||(known&&item.itemType&&item.itemType!=='Unknown'?item.itemType:known?item.category:'Clothing photo');
  const state=pending?'checking':saved?'saved':item.saveFailed||item.scanFailed?'error':item.possibleDuplicate?'review':known&&item.localAnalyzed&&item.requiresOwnershipConfirmation?'ready':'review';
  const label=pending?(recognitionState.activeId===item.id&&localReady?'Checking…':'Waiting…'):saved?(item.itemType==='Unknown'&&item.color?'Saved · refine type':'Saved'):item.saveFailed?'Not saved':item.scanFailed?'Scanner unavailable':item.possibleDuplicate?'Check duplicate':state==='ready'?'Ready to add':canConfirmReviewedColor(item)?'Choose color to save':known?'Needs review':item.color?'Color found · confirm garment':'Needs a clearer photo';
  body.append(node('span',label,'photo-status '+state),node('h3',title));
  if(item.outfitSourceId&&item.segmentHint?.displayFallback==='original-crop')
   body.append(node('p',item.segmentHint.displayFallbackReason==='dress-layer-conflict-review-only'?
     'Photo region needs review: this may be a top or jacket over a skirt, not one dress. Check the pieces or photograph each separately before saving.':
     item.segmentHint.displayFallbackReason==='disconnected-upper-regions'?
     'Photo region needs review: two upper-clothing areas were found, but they may be parts of ONE garment. Compare both photos in Adjust before saving.':
     'Photo region needs review: this cutout may contain other clothes, skin or background. Check with Adjust or photograph the item alone before saving.','fine'));
  if(known)body.append(node('p',[item.category,item.itemType,item.color].filter(x=>x&&x!=='Unknown').join(' · '),'photo-category'));
  else if(!pending)body.append(node('p',item.color?'Color: '+item.color+' · confirm the garment category.':item.scanFailed?'Try again, or add the details with Adjust.':'Retake this item, or add its details with Adjust.','fine'));
  const extra=[item.pattern,item.sleeveLength,item.fit,...(item.seasons||[])].filter(x=>x&&x!=='Unknown'&&x!=='Not applicable');
  if(extra.length){const details=node('details',null,'photo-extra');details.append(node('summary','More details'),node('p',extra.join(' · ')));body.append(details);}
  if(!pending&&!saved&&item.possibleDuplicate)body.append(node('p','Compare with your closet before adding.','fine'));
  if(canConfirmReviewedColor(item)){
   const label=node('label',null,'quick-color-confirm'),picker=node('select');
   const prompt=node('option','Choose color to save');
   prompt.value='';picker.append(prompt);
   for(const color of ClothingDetails.colors){const option=node('option',color);option.value=color;picker.append(option);}
   picker.value='';picker.setAttribute('aria-label','Choose the color of '+title+' and save');
   label.append(node('span','Choose color · save','fine'),picker);
   picker.onchange=async()=>{
    if(!picker.value)return;
    picker.disabled=true;
    try{if(!await confirmReviewedColor(item,picker.value)){
     picker.disabled=false;message('This photo needs another check. Use Adjust to save your choice.');
    }}catch{picker.disabled=false;message('Could not save this color. Your photo is still here.');}
   };
   body.append(label);
  }
  const adjust=node('button','Adjust','secondary');adjust.type='button';
  adjust.onclick=()=>adjustPhoto(item);if(saved&&['Tops','Bottoms','Dresses','Outerwear','Shoes'].includes(item.category)){
    const style=node('button','Style this','primary');style.type='button';
    style.onclick=()=>{if(typeof styleNewClosetItem==='function')styleNewClosetItem(item.id);};
    body.append(style);
   }body.append(adjust,cropButton(item));
  card.append(image,body);grid.append(card);
 }
}
function render(){
 $('reviewCount').textContent=batch.length;$('closetCount').textContent=items.length;$('sessionCount').textContent=session;
 renderRecognitionNotice();
 const results=[...batch,...items.filter(item=>sessionCapturedIds.has(item.id))];
 renderPhotoResults($('reviewGrid'),results);
 renderPhotoResults($('scanResults'),results);
 const cg=$('closetGrid');
 // Preserve the currently viewed garment across capture, save, edit, and
 // rerender; otherwise a full redraw jumps the rack back to its first card.
 if(window.closetPresentationMode==='rack'&&window.closetActiveItemId!==null&&
    typeof ClosetRackEngine!=='undefined'&&!($('closetCollection')?.hidden)){
  window.closetActiveItemId=ClosetRackEngine.activeItemId(cg)||window.closetActiveItemId;
 }
 cg.replaceChildren();const query=$('search').value.toLowerCase(),filter=$('filter').value,visible=(query||filter!=='All categories'||window.closetBrowseAll||window.closetSlotFilter)?items.filter(x=>(!window.closetSlotFilter||outfitSlots.some(slot=>slot.id===window.closetSlotFilter&&slotAllows(slot,x)))&&(!window.closetItemType||x.itemType===window.closetItemType)&&(!window.closetSleeves||window.closetSleeves.includes(x.sleeveLength))&&clothingMatches(x,query,filter,$('seasonFilter').value,$('sleeveFilter').value)):[];
 if(!visible.length)empty(cg,items.length?'No matching pieces.':'Your closet is ready to grow.',items.length?'Try a different search or category.':'Save your first piece from the review tab.');
 for(const item of visible){const card=node('article',null,'card'),im=node('img');card.dataset.itemId=String(item.id);card.classList.add('rack-support-'+(typeof ClosetRackEngine!=='undefined'?ClosetRackEngine.support(item):'hanger'));im.loading='lazy';im.src=item.image;im.alt=item.name;const body=node('div',null,'card-body');body.append(node('h3',item.name),node('p',[item.color,item.pattern].filter(x=>x&&x!=='Unknown'&&x!=='Not applicable').join(' · ')),node('p',item.seasons.length?item.seasons.join(' · '):'Season unknown'),node('p',[item.brand,item.size,item.material,item.occasion].filter(Boolean).join(' · ')),node('p',item.notes));if(item.itemType==='Unknown'&&item.color)body.append(node('p','Category and color saved · refine the type when convenient.','fine'));const actions=node('div',null,'actions'),edit=node('button','Adjust details','secondary'),del=node('button','Delete','secondary');edit.onclick=()=>{const dialog=document.createElement('dialog');dialog.className='clothing-editor';dialog.setAttribute('aria-label','Adjust saved clothing details');dialog.style.cssText='border:1px solid #d9ddd2;border-radius:8px;max-width:440px;width:90%;padding:24px';const f=node('form');const draft=structuredClone(item),collect=clothingFields(f,draft),ok=node('button','Save changes','primary'),cancel=node('button','Cancel','secondary');f.className='card';f.style.padding='15px';cancel.type='button';cancel.onclick=()=>dialog.close();f.onsubmit=async e=>{e.preventDefault();ok.disabled=true;try{const updated={...collect(),name:draft.name.trim()||'Closet piece'};if(updated.color&&updated.colorSource==='photo-estimate')updated.colorSource='user';if(typeof ClothingMemory!=='undefined')Object.assign(updated,ClothingMemory.confirm(updated));await writeAll([updated]);Object.assign(item,updated);dialog.close();render();scheduleMemoryReview();}catch{message('Changes could not be saved.');ok.disabled=false;}};f.append(ok,cancel);dialog.append(f);document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.showModal();};del.onclick=async()=>{if(!confirm('Delete this closet piece?'))return;try{await removeItem(item.id);items=items.filter(x=>x.id!==item.id);render();}catch{message('Could not delete the piece.');}};if(typeof closetWearButton==='function')actions.append(closetWearButton(item));if(['Tops','Bottoms','Dresses','Outerwear','Shoes'].includes(item.category)){
    const style=node('button','Style this','primary');style.type='button';
    style.onclick=()=>{if(typeof styleNewClosetItem==='function')styleNewClosetItem(item.id);};
    actions.append(style);
   }actions.append(edit,cropButton(item),del);body.append(actions);const rackPicture=node('div',null,'closet-rack-picture');const hardware=node('span',null,'closet-rack-hardware');hardware.setAttribute('aria-hidden','true');hardware.innerHTML='<svg viewBox="0 0 140 65" focusable="false" aria-hidden="true"><path d="M71 21c-9-1-11-15-1-19 8-3 15 4 11 10-2 4-6 4-9 7v8l54 32H14l54-32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';rackPicture.append(hardware,im);card.append(rackPicture,body);if(typeof enableClosetDrag==='function')enableClosetDrag(im,item);cg.append(card);
 if(typeof ClosetTileEngine!=='undefined'&&typeof ClosetTileEngine.observe==='function')
  ClosetTileEngine.observe(im,item);}
 if(typeof renderClosetBrowser==='function')renderClosetBrowser();
 if(typeof renderTrendMatches==='function')renderTrendMatches();if(typeof renderOutfitBoard==='function')renderOutfitBoard();if(typeof renderStyledCollection==='function')renderStyledCollection();if(typeof renderHomePieces==='function')renderHomePieces();if(typeof renderOutfitCapture==='function')renderOutfitCapture();
}
for(const c of categories){const o=node('option',c);$('filter').append(o);}$('search').oninput=render;$('filter').onchange=render;
function pixels(){const ctx=tiny.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0,32,32);return ctx.getImageData(0,0,32,32).data.slice();}
function difference(a,b){if(!a||!b)return 255;let total=0;for(let i=0;i<a.length;i+=4)total+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);return total/(a.length/4*3);}
function cameraFrameQuality(){
 if(typeof document==='undefined')return {usable:true};
 // A low-information frame may be a plain garment, not an out-of-focus photo.
 // Only the combination of very low contrast and very low edge variation is flagged.
 if(video.readyState<2||video.videoWidth<320||video.videoHeight<240)return {usable:false,reason:'resolution'};
 try{
  const sample=document.createElement('canvas');sample.width=64;sample.height=48;
  const context=sample.getContext('2d',{willReadFrequently:true});
  if(!context)return {usable:true};
  context.drawImage(video,0,0,64,48);
  const pixels=context.getImageData(0,0,64,48).data,gray=new Float32Array(64*48);
  let min=255,max=0,edges=0,count=0;
  for(let p=0;p<gray.length;p++){const k=p*4;const value=.2126*pixels[k]+.7152*pixels[k+1]+.0722*pixels[k+2];gray[p]=value;min=Math.min(min,value);max=Math.max(max,value);}
  for(let y=1;y<47;y++)for(let x=1;x<63;x++){const p=y*64+x;edges+=Math.abs(4*gray[p]-gray[p-1]-gray[p+1]-gray[p-64]-gray[p+64]);count++;}
  const tooDark=max<45&&max-min<18&&edges/count<4;
  return {usable:!tooDark,reason:tooDark?'very-dark-frame':null};
 }catch{return {usable:true};}
}
// Compare successive samples only when their visual structure is similar.
// This is advisory: moving garments and uniform fabrics must not be rejected.
let previousQualityFrame=null;
function cameraStability(){
 if(typeof document==='undefined'||video.readyState<2)return {stable:true};
 try{
  const c=document.createElement('canvas');c.width=32;c.height=24;
  const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)return {stable:true};
  ctx.drawImage(video,0,0,32,24);
  const rgba=ctx.getImageData(0,0,32,24).data,values=new Uint8Array(32*24);
  let variance=0,sum=0,difference=0;
  for(let i=0;i<values.length;i++){const p=i*4;values[i]=Math.round(.2126*rgba[p]+.7152*rgba[p+1]+.0722*rgba[p+2]);sum+=values[i];}
  const mean=sum/values.length;
  for(let i=0;i<values.length;i++)variance+=(values[i]-mean)**2;
  if(previousQualityFrame){for(let i=0;i<values.length;i++)difference+=Math.abs(values[i]-previousQualityFrame[i]);}
  const hadPrevious=!!previousQualityFrame;previousQualityFrame=values;
  const motion=hadPrevious?difference/values.length:0;
  // Report movement for diagnostics only. Motion alone cannot prove blur.
  return {stable:!hadPrevious||motion<24,motion:Math.round(motion*10)/10,lowTexture:variance/values.length<100};
 }catch{return {stable:true};}
}
function snap(){
 if(!video.videoWidth||video.readyState<2)throw Error('The camera has not provided a usable frame yet.');
 // Video frames remain capped at 2048px for repeated automatic captures.
 // Bound encoded size as well: noisy frames can exceed backup limits.
 for(const target of [2048,1536,1024]){
  const scale=Math.min(1,target/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
  canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
  const context=canvas.getContext('2d');
  if(!context)throw Error('Unable to prepare camera frame.');
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  context.drawImage(video,0,0,canvas.width,canvas.height);
  const jpeg=canvas.toDataURL('image/jpeg',.94);
  if(!jpeg||jpeg==='data:,')throw Error('Unable to encode camera frame.');
  if(jpeg.length<=2850000)return jpeg;
 }
 throw Error('Photo exceeds storage limits. Try brighter light or a closer photo.');
}

// Prefer a genuine sensor still over freezing the preview. Recognition receives
// this full-scene JPEG before any clipping/masking; this is not a raw sensor file.
async function captureCameraStill(track,StillCapture,isCurrent=()=>true){
 const blob=await new StillCapture(track).takePhoto();
 if(!isCurrent())throw Error('Camera session ended before photo arrived.');
 if(!blob||!blob.size||blob.size>32*1024*1024||(blob.type&&!blob.type.startsWith('image/')))
   throw Error('Camera did not supply a usable image.');
 // Honor EXIF orientation once in the decoder. Keep browser color conversion;
 // never disable color management, recolor fabric, sharpen or mirror the photo.
 const bitmap=await createImageBitmap(blob,{imageOrientation:'from-image',colorSpaceConversion:'default'});
 try{
  if(!isCurrent())throw Error('Camera session ended before photo decoded.');
  const width=bitmap.width,height=bitmap.height;
  if(!Number.isInteger(width)||!Number.isInteger(height)||Math.min(width,height)<240||Math.max(width,height)<320)
    throw Error('Still image was too small.');
  let previousWidth=0,previousHeight=0;
  for(const target of [3072,2560,2048,1536,1024]){
   if(!isCurrent())throw Error('Camera session ended while preparing photo.');
   const scale=Math.min(1,target/Math.max(width,height));
   const outputWidth=Math.max(1,Math.round(width*scale)),outputHeight=Math.max(1,Math.round(height*scale));
   if(outputWidth===previousWidth&&outputHeight===previousHeight)continue;
   previousWidth=outputWidth;previousHeight=outputHeight;
   canvas.width=outputWidth;canvas.height=outputHeight;
   const context=canvas.getContext('2d');
   if(!context)throw Error('Unable to prepare camera photo.');
   context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
   // Every pixel-size retry draws from original decoded RGB, never a previous JPEG.
   context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   // Preserve cuff, sole and seam resolution when slight JPEG compression fits.
   // Do not redraw or downscale until all bounded same-size encodings fail.
   for(const quality of [.94,.88,.82]){
    if(!isCurrent())throw Error('Camera session ended while preparing photo.');
    const jpeg=canvas.toDataURL('image/jpeg',quality);
    if(!jpeg||jpeg==='data:,')throw Error('Unable to encode camera photo.');
    if(jpeg.length<=2850000)return jpeg;
   }
  }
  throw Error('Photo exceeds storage limits. Try a closer photo.');
 }finally{bitmap.close?.();}
}
function beep(){if(!$('sound').checked||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=740;g.gain.value=.04;o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.12);}catch{}}
// Identical AI-cleaned DISPLAY JPEG bytes are not evidence that two
// *physical* clothes are identical. White-matted previews may collide across
// photos or different garment regions. For outfit captures, compare the
// original full-source photo and the rectangle instead. Never silently
// discard an unverified physical item; retain it with a duplicate warning.
function exactlyRepeatedCapturedItem(existing,proposed){
 if(existing?.image!==proposed?.image)return false;
 const validPhoto=x=>typeof x==='string'&&x.startsWith('data:image/jpeg;base64,');
 const newSource=proposed.originalPhoto?.image;
 // A standalone original and an outfit-derived display may look pixel-for-
 // pixel identical. Neither direction proves the same physical item. Keep
 // both and let the duplicate-review gate decide; never depend on queue order.
 if(!proposed.outfitSourceId&&existing?.outfitSourceId)return false;
 if(!proposed.outfitSourceId)return true;
 // A matching cleaned preview is never enough to discard an outfit region
 // when its original RGB or full-scene provenance is missing. Preserve it
 // in review instead: two different garments can share one display cutout.
 if(!validPhoto(newSource)||!validPhoto(proposed.recognitionPhoto?.image))return false;
 // Old single-item or incomplete records can't prove that the new garment
 // is the same physical article. The review queue handles possible matches.
 if(!existing.outfitSourceId||!validPhoto(existing.originalPhoto?.image))return false;
 if(existing.originalPhoto.image!==newSource)return false;
 // A changed capture-group ID is NOT proof of a repeated physical item.
 // Retry/import may split additional layers from the SAME original scene;
 // compare original source, role and location before dropping a candidate.
 // Different underlayer/outerlayer labels may share nearly the same outer
 // rectangle. The segmentation worker can identify distinct source hints even
 // when the display fallback JPEG is identical. Keep both for review.
 const role=x=>JSON.stringify([
  typeof x.segmentHint?.layerRole==='string'?x.segmentHint.layerRole:null,
  typeof x.segmentHint?.sourceLabel==='string'?x.segmentHint.sourceLabel:null,
  Array.isArray(x.segmentHint?.categories)?[...x.segmentHint.categories].sort():[],
  Array.isArray(x.segmentHint?.types)?[...x.segmentHint.types].sort():[]
 ]);
 if(role(existing)!==role(proposed))return false;
 const a=existing.cropBounds,b=proposed.cropBounds;
 const valid=x=>x&&['x','y','width','height'].every(k=>
  typeof x[k]==='number'&&Number.isFinite(x[k])&&
  x[k]>=0&&x[k]<=1)&&x.width>0&&x.height>0&&
  x.x+x.width<=1.001&&x.y+x.height<=1.001;
 if(!valid(a)||!valid(b))
  return existing.outfitSourceId===proposed.outfitSourceId;
 // Across independent group IDs, missing geometry would make the identity
 // unprovable. Keep such records for human duplicate review instead.
 const overlap=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*
  Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const union=a.width*a.height+b.width*b.height-overlap;
 return union<=0||overlap/union>=.975;
}
function candidate(image,options={}){
 if(typeof clearingDraft!=='undefined'&&clearingDraft){message('Finish clearing unfinished photos before taking another picture.');return false;}
 if([...items,...batch].some(item=>exactlyRepeatedCapturedItem(item,{image,...options}))){if(typeof recordDeviceEvent==='function')recordDeviceEvent('exact_duplicate_skipped');message('Exact duplicate skipped. Show the next garment.');return false;}
 const item=normalizeClothing({id:crypto.randomUUID(),image,name:'',category:'Uncategorized',color:'',notes:'',localStatus:'Reading photo…'});
 if(typeof recordDeviceEvent==='function')recordDeviceEvent('photo_queued');
 if(options.outfitSourceId){item.outfitSourceId=options.outfitSourceId;item.requiresOwnershipConfirmation=false;item.segmentHint=options.segmentHint;item.recognitionPhoto=options.recognitionPhoto;item.originalPhoto=options.originalPhoto;item.cropBounds=options.cropBounds;if(options.colorEstimate&&options.colorEstimate.source==='photo-estimate'&&Number.isFinite(options.colorEstimate.support)&&options.colorEstimate.support>=.6&&options.colorEstimate.support<=1&&!options.colorEstimate.needsConfirmation&&typeof options.recognitionPhoto?.image==='string'&&options.recognitionPhoto.image.startsWith('data:image/jpeg;base64,')&&typeof options.originalPhoto?.image==='string'&&options.originalPhoto.image.startsWith('data:image/jpeg;base64,')){Object.assign(item,ClothingDetails.fillColor(item,{...options.colorEstimate,method:'garment-mask'}));}}
 batch.push(item);sessionCapturedIds.add(item.id);persistDraft();session++;$('sessionCount').textContent=session;$('reviewCount').textContent=batch.length;$('lastCaptureImage').src=image;$('lastCaptureImage').hidden=false;
 queueAutomatic(item);return true;
}
// An identical-looking color signature from the *same* source photograph
// cannot establish that a separately segmented shoe and shirt are duplicates.
// Exempt ONLY well-separated, incompatible semantic categories from the
// visual-lookalike warning. Same-category, layered, touching, unsupported,
// different-source and unverifiable pieces remain conservatively reviewable.
function independentlyDistinctOutfitRegions(a,b){
 if(!a?.outfitSourceId||a.outfitSourceId!==b?.outfitSourceId)return false;
 const source=a.originalPhoto?.image;
 if(typeof source!=='string'||!source.startsWith('data:image/jpeg;base64,')||
    source!==b.originalPhoto?.image)return false;
 const classes=x=>Array.isArray(x?.segmentHint?.categories)?
  x.segmentHint.categories.filter(c=>['Tops','Bottoms','Dresses','Outerwear','Shoes'].includes(c)):[];
 const ca=classes(a),cb=classes(b);
 if(!ca.length||!cb.length||ca.some(v=>cb.includes(v)))return false;
 if(a.segmentHint?.clipped||b.segmentHint?.clipped||
    a.segmentHint?.displayFallback==='original-crop'||
    b.segmentHint?.displayFallback==='original-crop')return false;
 const r=a.cropBounds,s=b.cropBounds;
 const valid=x=>x&&['x','y','width','height'].every(k=>
  typeof x[k]==='number'&&Number.isFinite(x[k]))&&
  x.x>=0&&x.y>=0&&x.width>0&&x.height>0&&
  x.x+x.width<=1.001&&x.y+x.height<=1.001;
 if(!valid(r)||!valid(s))return false;
 const overlap=Math.max(0,Math.min(r.x+r.width,s.x+s.width)-Math.max(r.x,s.x))*
  Math.max(0,Math.min(r.y+r.height,s.y+s.height)-Math.max(r.y,s.y));
 const area=r.width*r.height+s.width*s.height-overlap;
 return area>0&&overlap/area<.01;
}
// An unmasked whole-outfit RGB crop includes room and other garments. It
// remains the recognition input, but its generic photo-check palette cannot
// be trusted as garment color. Mask-derived color set during capture survives.
function trustedAutomaticPhotoColor(item,quality){
 return item?.outfitSourceId?null:quality?.colorEstimate||null;
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
let manualStillShot=null;
let cameraStartAttempt=null;
let cameraPreviewWatch=null;
function stopCameraPreviewWatch(){
 const watch=cameraPreviewWatch;cameraPreviewWatch=null;
 if(!watch)return;
 clearInterval(watch.timer);
 if(watch.visibilityListener&&typeof document!=='undefined')document.removeEventListener?.('visibilitychange',watch.visibilityListener);
 if(watch.frameId!=null&&typeof video.cancelVideoFrameCallback==='function'){
  try{video.cancelVideoFrameCallback(watch.frameId);}catch{}
 }
}
function cameraPreviewHealth(now=Date.now()){
 const track=stream?.getVideoTracks?.()[0]||stream?.getTracks?.()[0];
 if(!stream||track?.readyState==='ended'||track?.muted===true)
  return {live:false,reason:'Camera preview stopped delivering video. Your saved photos are safe. Restart the camera or choose an imported photo.'};
 const watch=cameraPreviewWatch;
 if(!watch||watch.request!==cameraRequest||watch.stream!==stream)return {live:true};
 if(typeof document!=='undefined'&&document.visibilityState==='hidden')return {live:true};
 if(watch.mode==='playback-clock'&&Number.isFinite(video.currentTime)){
  if(video.currentTime>watch.lastMediaTime+.001){
   watch.lastMediaTime=video.currentTime;watch.lastFrame=now;
  }else if(video.currentTime<watch.lastMediaTime-.05){
   // Camera tracks can reset playback clock during brief browser resume.
   watch.lastMediaTime=video.currentTime;watch.lastFrame=now;
  }
 }
 // Only a genuine frame callback or advancing playback clock proves new
 // frames: unchanged fabric pixels are not evidence of a frozen camera.
 if(watch.mode!=='unobservable'&&now-watch.lastFrame>4500)
  return {live:false,reason:'Camera preview froze. Your photos are still saved. Restart the camera or import a photo.'};
 return {live:true};
}
function monitorCameraPreview(acquired,request){
 stopCameraPreviewWatch();
 const watch={stream:acquired,request,lastFrame:Date.now(),frameId:null,timer:null,
  lastMediaTime:Number.isFinite(video.currentTime)?video.currentTime:null,
  mode:typeof video.requestVideoFrameCallback==='function'?'video-frame':
   Number.isFinite(video.currentTime)?'playback-clock':'unobservable'};
 cameraPreviewWatch=watch;
 if(typeof document!=='undefined'&&document.addEventListener){
  watch.visibilityListener=()=>{
   if(cameraPreviewWatch!==watch)return;
   // Backgrounding suspends callback/timer delivery; reset the live-frame
   // deadline on both visibility transitions before polling resumes.
   watch.lastFrame=Date.now();
   if(Number.isFinite(video.currentTime))watch.lastMediaTime=video.currentTime;
  };
  document.addEventListener('visibilitychange',watch.visibilityListener);
 }
 if(watch.mode==='video-frame'){
  const onFrame=()=>{
   if(cameraPreviewWatch!==watch||cameraRequest!==request||stream!==acquired)return;
   watch.lastFrame=Date.now();
   watch.frameId=video.requestVideoFrameCallback(onFrame);
  };
  try{watch.frameId=video.requestVideoFrameCallback(onFrame);}
  catch{watch.mode=Number.isFinite(video.currentTime)?'playback-clock':'unobservable';}
 }
 // Older engines without frame-delivery or playback timing APIs cannot
 // reliably prove a freeze; do not falsely reject a static garment image.
 if(watch.mode==='unobservable')return;
 watch.timer=setInterval(()=>{
  if(cameraPreviewWatch!==watch||cameraRequest!==request||stream!==acquired)return;
  if(typeof document!=='undefined'&&document.visibilityState==='hidden'){
   // Backgrounded phone tabs frequently suspend video and callback delivery.
   watch.lastFrame=Date.now();
   if(Number.isFinite(video.currentTime))watch.lastMediaTime=video.currentTime;
   return;
  }
  const health=cameraPreviewHealth();
  if(health.live)return;
  stopCamera();message(health.reason);
 },1000);
}
function stopCamera(){
 stopCameraPreviewWatch();
 const opening=cameraStartAttempt;cameraStartAttempt=null;
 if(opening){opening.cancel();busy=false;}
 cameraRequest++;cameraOpening=false;manualStillShot=null;$('takePhoto').disabled=false;$('stop').disabled=false;clearInterval(timer);timer=null;
 if(stream)stream.getTracks().forEach(t=>t.stop());
 stream=null;cameraMode=null;previousQualityFrame=null;video.srcObject=null;video.classList.remove('visible');
 $('placeholder').hidden=false;$('cameraChoices').hidden=false;$('cameraActions').hidden=true;
 controls(false);$('captureState').textContent='Camera stopped · your photos are ready to review';
}
function controls(disabled){for(const id of ['start','startAuto','upload','interval','clothingPhotos','outfitCamera','outfitUpload','outfitRetry','captureSingle','captureOutfit'])$(id).disabled=disabled;}
function finishScan(){
 const wasManual=cameraMode==='manual';
 if(!wasManual&&stream&&session===0&&video.readyState>=2&&video.videoWidth&&cameraPreviewHealth().live){try{if(cameraFrameQuality().usable)candidate(snap());}catch{}}
 stopCamera();
 if(batch.length){message('');switchView('review');}
 else if(session>0){message('');switchView('review');}
 else{message(wasManual?'No photos taken yet. Take photos and tap the shutter when a garment is ready.':'No camera frames were received. Try Take photos or choose a saved closet video.');$('captureState').textContent='No photos captured · choose a camera option to try again';}
}
function captureTick(now=Date.now()){
 if(!stream||cameraMode!=='auto')return;
 const health=cameraPreviewHealth(now);
 if(!health.live){$('captureState').textContent='Camera preview unavailable · restart to continue';return;}
 const ready=video.readyState>=2&&video.videoWidth>0;
 if(!cadence.due(now,ready)){
  if(!ready)$('captureState').textContent='Waiting for camera images…';
  else $('captureState').textContent=`Next photo in ${Math.max(1,Math.ceil((cadence.intervalMs-(now-cadence.last))/1000))} seconds · hold the garment still`;
  return;
 }
 try{const quality=cameraFrameQuality();if(!quality.usable){$('captureState').textContent='Hold steady in brighter light · trying the next frame';return;}const stability=cameraStability();if(!stability.stable&&!stability.lowTexture){$('captureState').textContent='Movement detected · capturing when steady';return;}candidate(snap());cadence.captured(now);beep();$('captureState').textContent=`${session} images captured · show the next piece`;
 if(session>=60){finishScan();message('60 images collected. Review this batch before continuing.');}}
 catch(e){$('captureState').textContent='Waiting for a usable camera frame…';}
}
function takePhoto(){
 if(!stream||cameraMode!=='manual'||manualStillShot)return;
 const health=cameraPreviewHealth();
 if(!health.live){message(health.reason);$('captureState').textContent='Camera preview unavailable · restart to continue';return;}
 const activeStream=stream,activeRequest=cameraRequest;
 const active=()=>stream===activeStream&&cameraRequest===activeRequest&&cameraMode==='manual';
 const saveCaptured=image=>{
  if(!active())return;
  if(!cameraPreviewHealth().live)return;
  candidate(image);beep();$('captureState').textContent=`${session} photos taken · ready for the next piece`;
  if(session>=60){finishScan();message('60 photos collected. Review this batch before continuing.');}
 };
 const fallback=()=>{
  if(!active())return;
  if(!cameraPreviewHealth().live){message('Camera preview is unavailable. Restart the camera before taking more photos.');return;}
  try{saveCaptured(snap());}
  catch{message(video.readyState<2||!video.videoWidth?'The camera is still getting ready. Wait a moment, then tap Take photo again.':'Could not prepare this camera photo. Try brighter light, take another photo, or choose a saved photo.');}
 };
 try{
  const quality=cameraFrameQuality();
  if(!quality.usable){message('Photo looks too dark or low-resolution. Try brighter light and take it again.');return;}
  cameraStability();
  const StillCapture=window.ImageCapture,track=stream.getVideoTracks?.()[0];
  if(typeof StillCapture!=='function'||!track||typeof createImageBitmap!=='function'){
   fallback();return;
  }
  const shot={stream:activeStream,request:activeRequest,expired:false};
  manualStillShot=shot;$('takePhoto').disabled=true;$('stop').disabled=true;
  $('captureState').textContent='Taking high-quality photo…';
  // Some Android camera drivers never settle takePhoto(). Fall back rather
  // than locking the shutter. A late resolution cannot modify our canvas.
  let timer;
  const bounded=Promise.race([
   captureCameraStill(track,StillCapture,()=>active()&&manualStillShot===shot&&!shot.expired),
   new Promise((_,reject)=>{timer=setTimeout(()=>{shot.expired=true;reject(Error('Still photo timed out'));},4000);})
  ]);
  bounded.then(image=>{
   if(manualStillShot===shot){
    try{saveCaptured(image);}catch{message('Photo could not be added. Try again.');}
   }
  },()=>{
   // Unsupported ImageCapture, timeouts and camera errors must not lose a tap.
   if(manualStillShot===shot)fallback();
  }).finally(()=>{
   clearTimeout(timer);
   if(manualStillShot===shot){manualStillShot=null;$('takePhoto').disabled=false;$('stop').disabled=false;}
  });
 }catch{fallback();}
}
async function startCamera(mode){
 if(busy||stream)return;
 const request=++cameraRequest;cameraOpening=true;busy=true;controls(true);
 $('captureState').textContent='Opening camera…';
 let deadline,rejectOpening;
 const interrupted=new Promise((_,reject)=>{rejectOpening=reject;});
 // A synchronous browser error can precede the first race; cancellation must
 // still be handled without an unhandled rejection.
 interrupted.catch(()=>{});
 const attempt={expired:false,acquired:null,cancel(){
  clearTimeout(deadline);
  if(attempt.acquired){attempt.acquired.getTracks().forEach(track=>track.stop());attempt.acquired=null;}
  rejectOpening(Error('Camera opening cancelled.'));
 }};
 cameraStartAttempt=attempt;
 const current=()=>cameraStartAttempt===attempt&&request===cameraRequest&&!attempt.expired;
 const bounded=work=>Promise.race([work,interrupted]);
 deadline=setTimeout(()=>{
  attempt.expired=true;
  rejectOpening(Error('Camera opening timed out. Try again, check camera permission, or choose saved photos.'));
 },15000);
 // Sound is optional. A suspended AudioContext must never hold the camera
 // permission prompt or preview hostage, and retries reuse the context.
 try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();Promise.resolve(audio.resume()).catch(()=>{});}catch{}
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access unavailable. Choose saved photos or a closet video instead.');
  const acquisition=navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
  const acquired=await bounded(acquisition.then(value=>{
   // getUserMedia cannot be aborted. Release a grant arriving after timeout,
   // navigation or retry, without attaching it to the current preview.
   if(!current()){value.getTracks().forEach(track=>track.stop());return null;}
   attempt.acquired=value;return value;
  }));
  if(!current()||!acquired)return;
  stream=acquired;attempt.acquired=null;cameraMode=mode;
  for(const track of acquired.getTracks())track.addEventListener?.('ended',()=>{
   if(request!==cameraRequest||stream!==acquired)return;
   stopCamera();message('Camera was interrupted. Your photos are kept. Tap Take photos to restart.');
  },{once:true});
  video.removeAttribute('src');video.srcObject=stream;video.classList.add('visible');$('placeholder').hidden=true;
  await bounded(video.play());
  // Check identity before any counters/UI change, including an old play()
  // finishing while a newer camera already has captured photos.
  if(!current())return;
  session=0;$('sessionCount').textContent='0';$('lastCaptureImage').hidden=true;
  cameraOpening=false;$('cameraChoices').hidden=true;$('cameraActions').hidden=false;$('takePhoto').hidden=mode!=='manual';
  monitorCameraPreview(acquired,request);
  if(mode==='auto'){
   cadence=new CaptureCadence(Number($('interval').value)*1000,Date.now());
   timer=setInterval(()=>captureTick(),250);captureTick();
   message(`Automatic scan: one photo every ${$('interval').value} seconds. Watch the countdown and hold each garment still. Tap Done to stop the camera.`);
  }else{
   $('captureState').textContent='Frame a garment · tap Take photo when ready';
   message('Take each photo at your own pace. Tap Done when you are finished.');
  }
 }catch(e){
  if(cameraStartAttempt===attempt&&request===cameraRequest){stopCamera();message(e.name==='NotAllowedError'?'Camera permission was denied. Allow camera access in your browser, or choose saved photos.':(e.message||'Camera could not start. Choose saved photos or a closet video.'));}
 }finally{
  clearTimeout(deadline);
  // Old completion must not enable controls owned by a newer camera/import.
  if(cameraStartAttempt===attempt){cameraStartAttempt=null;cameraOpening=false;busy=false;if(!stream)controls(false);}
 }
}
$('start').onclick=()=>startCamera('manual');
$('startAuto').onclick=()=>startCamera('auto');
$('takePhoto').onclick=takePhoto;
$('stop').onclick=finishScan;
function waitEvent(target,event,timeout=15000){return new Promise((resolve,reject)=>{let t;const clean=()=>{clearTimeout(t);target.removeEventListener(event,ok);target.removeEventListener('error',fail);};const ok=()=>{clean();resolve();},fail=()=>{clean();reject(Error('This video could not be read. Try an MP4 recorded by your phone.'));};target.addEventListener(event,ok,{once:true});target.addEventListener('error',fail,{once:true});t=setTimeout(fail,timeout);});}
// Keep video capture bounded even for the maximum three-minute upload.
// Distribute up to twenty original video frames across long clips rather
// than exhausting mobile memory and disk with thirty-six 2.85MB candidates.
function videoSampleTimes(duration,requestedSeconds){
 if(!Number.isFinite(duration)||duration<=0||duration>180)
  throw Error('Please choose a video between 1 second and 3 minutes.');
 const cadence=[5,8,10].includes(Number(requestedSeconds))?Number(requestedSeconds):5;
 const step=Math.max(cadence,duration/20),times=[];
 for(let t=Math.min(.1,duration/2);t<duration&&times.length<20;t+=step)
  times.push(Math.round(t*1000)/1000);
 return times;
}
async function upload(file){
 if(!file||busy)return;
 if(file.size>150*1024*1024)return message('Choose a video smaller than 150 MB. Short batches work best.');
 const owner=window.closetAuth?.user?.id;
 if(!owner)return message('Sign in before importing a video into your closet.');
 const sameOwner=()=>owner===window.closetAuth?.user?.id;
 stopCamera();busy=true;controls(true);
 let url;const startLength=batch.length;
 try{
  url=URL.createObjectURL(file);video.src=url;
  video.classList.add('visible');$('placeholder').hidden=true;
  const loaded=waitEvent(video,'loadedmetadata');video.load();await loaded;
  if(!sameOwner())throw Error('Video import stopped because the signed-in account changed.');
  if(!Number.isFinite(video.duration)||video.duration<=0)
   throw Error('Video duration could not be read. Try a regular MP4.');
  const times=videoSampleTimes(video.duration,$('interval').value);
  session=0;
  for(let n=0;n<times.length;n++){
   if(!sameOwner())throw Error('Video import stopped because the signed-in account changed.');
   const seek=waitEvent(video,'seeked');video.currentTime=times[n];await seek;
   if(!sameOwner())throw Error('Video import stopped because the signed-in account changed.');
   candidate(snap());
   $('captureState').textContent='Collecting images · '+Math.round((n+1)/times.length*100)+'%';
  }
  const added=batch.length-startLength;
  if(added){message('');switchView('review');}
  else message('No new video frames were added. Existing photos are still in your closet or review list.');
 }catch(e){
  if(!sameOwner()){message('Video import stopped after an account change. Sign in again before importing.');}
  else{
   render();
   const recovered=batch.length-startLength;
   if(recovered){
    message(recovered+' images recovered before video processing stopped. '+e.message);
    switchView('review');
   }else message(e.message);
  }
 }finally{
  busy=false;controls(false);video.pause?.();video.removeAttribute('src');video.load();
  if(url)URL.revokeObjectURL(url);
  $('captureState').textContent='Ready for another batch';
 }
}
$('retryDraftSave').onclick=async()=>{const button=$('retryDraftSave');button.disabled=true;try{if(await persistDraft())message('Unfinished photos saved on this device. Check Photo results before closing; they are not yet confirmed closet pieces.');}finally{button.disabled=false;}};
$('upload').onchange=e=>{upload(e.target.files[0]);e.target.value='';};
// Only remove the visible queue after the owner-bound empty draft commits.
// Previously uploaded cloud photos are NOT erased by this local action.
async function clearUnfinishedPhotosSafely(){
 if(clearingDraft||!batch.length)return false;
 const owner=window.closetAuth?.user?.id,database=db;
 if(!owner||!database||database.name!=='closet-current-user-'+owner){
  message('Unfinished photos cannot be cleared while device storage is unavailable. Keep this page open.');return false;
 }
 if(busy||cameraOpening||stream||saving||automaticRunning||automaticQueue.length||localPending.size||localJobs.size){
  message('Finish or stop photo processing before clearing unfinished photos. No photos were removed.');return false;
 }
 if(!confirm('Remove unfinished photos from this device’s review list? Previously uploaded cloud photo files may remain. This is not full account deletion.'))return false;
 const original=batch,originalIds=batch.map(x=>x.id),button=$('discard');
 clearingDraft=true;button.disabled=true;
 try{
  await queued(()=>new Promise((resolve,reject)=>{
   const tx=database.transaction('state','readwrite');
   tx.objectStore('state').put({id:'draft',batch:[]});
   tx.oncomplete=resolve;
   tx.onerror=()=>reject(tx.error||Error('Draft clear failed'));
   tx.onabort=()=>reject(tx.error||Error('Draft clear aborted'));
  }));
  if(window.closetAuth?.user?.id!==owner||db!==database||batch!==original||
   batch.length!==originalIds.length||batch.some((item,i)=>item.id!==originalIds[i])){
   message('Your review queue changed while clearing. Reload and review photos before trying again.');
   return false;
  }
  batch=[];session=0;
  window.closetUnsavedDraftOwner=null;
  $('draftSaveStatus').textContent='Unfinished photo review cleared from this device. Previously uploaded cloud photos may still remain.';
  $('retryDraftSave').hidden=true;
  render();
  message('Unfinished photos removed from this device’s review list. Cloud photo files and old backups may remain.');
  return true;
 }catch{
  // On quota/abort/transaction failure, leave photos intact and visible.
  const text='Could not clear unfinished photos from device storage. Your photos are still here. Keep this page open and retry.';
  $('draftSaveStatus').textContent=text;message(text);return false;
 }finally{clearingDraft=false;button.disabled=false;}
}
$('discard').onclick=clearUnfinishedPhotosSafely;
// A sign-out must never silently discard unfinished photos held in memory.
// The owning account remains active until its latest draft transaction completes.
// In-progress captures/recognition are blocked rather than discarded.
window.closetAuth.beforeSignOut=async()=>{
 const owner=window.closetAuth?.user?.id;
 if(!owner)return false;
 if(busy||cameraOpening||stream||saving||automaticRunning||automaticQueue.length||localPending.size||localJobs.size){
  message('Finish or stop photo capture and processing before signing out, so unfinished photos are not lost.');
  return false;
 }
 if(batch.length){
  if(!db||db.name!=='closet-current-user-'+owner){
   message('Your unfinished photos are not safely saved. Keep this page open and use Retry saving photos.');
   return false;
  }
  let saved=false;
  try{saved=await persistDraft();}catch{}
  if(!saved||window.closetAuth?.user?.id!==owner){
   message('Unable to save unfinished photos. Keep this page open and use Retry saving photos before logging out.');
   return false;
  }
 }
 await writes;
 return window.closetAuth?.user?.id===owner&&!busy&&!cameraOpening&&!stream&&!saving&&
  !automaticRunning&&!automaticQueue.length&&!localPending.size&&!localJobs.size;
};
// Account-bound file backup and atomic restore are initialized in wardrobe-backup.js.
window.addEventListener('pagehide',stopCamera);window.addEventListener('beforeunload',e=>{if((batch.length||busy)&&!window.closetAuth?.isSigningOut?.()){e.preventDefault();e.returnValue='';}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(stream||cameraOpening)){stopCamera();message('Camera stopped while the app was in the background. Your photos are ready to review.');}});
const closetReady=(async()=>{await window.closetAuth.ready;try{db=await openDB();items=(await readAll()).map(normalizeClothing);batch=(await readDraft()).map(normalizeClothing);for(const item of batch)if(item.outfitSourceId&&item.requiresOwnershipConfirmation){item.requiresOwnershipConfirmation=false;item.localAnalyzed=false;}if(batch.length)message(`${batch.length} unfinished photos are waiting in More → Photo results.`);}catch{message('Browser storage is unavailable. Use a regular browser to save your closet.');}render();for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);})();

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
     // A malformed worker message must fail closed, not strand an unresolved
     // scan until the watchdog fires or throw outside the promise lifecycle.
     if(!data||typeof data!=='object'){
      stopRecognitionWorker('Recognition returned an invalid response. Your photos are kept. Try again or use Adjust.','worker_response_invalid');
      return;
     }
     if(data.type==='progress'){
      for(const job of localJobs.values())if(job.type==='load')job.touch();
      if(typeof recordDeviceEvent==='function')recordDeviceEvent('scanner_progress',{stage:data.phase||data.stage,percent:data.percent});
      if(data.stage==='weights'&&Number.isFinite(data.percent))recognitionState.percent=Math.max(recognitionState.percent||0,data.percent);
      renderRecognitionNotice();return;
     }
     const job=localJobs.get(data.id);if(!job)return;
     if(data.type==='identified'){
      // This is an intermediate, unverified candidate. Applying it to the
      // draft here changes category/type BEFORE recognizeItem checks that
      // the original high-resolution source and the final model result are
      // still current. That can invalidate a normal scan or overwrite a
      // newer user selection. Only the final 'result' may classify/save.
      // Keep the in-progress status without modifying garment attributes.
      return;
     }
     // A load acknowledgment is not a garment classification. Never promote
     // an unknown/mismatched protocol event to a successful model result.
     const expected=job.type==='load'?'ready':'result';
     if(data.type!=='error'&&data.type!==expected){
      stopRecognitionWorker('Recognition returned an unexpected response. Your photos are kept. Try again or use Adjust.','worker_response_invalid');
      return;
     }
     clearTimeout(job.timer);localJobs.delete(data.id);
     if(data.type==='error'){
      // A corrupt single JPEG is a per-photo failure: the already loaded
      // worker can safely scan the next garment without a full model reload.
      // Runtime, memory, asset and unknown failures remain fail-closed.
      const recoverable=job.type!=='load'&&data.code==='image';
      if(!recoverable)localReady=false;
      if(typeof recordDeviceEvent==='function')recordDeviceEvent('scanner_error',{stage:data.stage,code:data.code,durationMs:Date.now()-job.started});
      const error=Error(typeof data.text==='string'&&data.text?data.text:'Recognition stopped. Try again or use Adjust.');
      error.recoverable=recoverable;job.reject(error);
     }else job.resolve(data);
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
 return !hint.clipped&&(!item.outfitSourceId||hint.displayFallback!=='original-crop')&&Array.isArray(hint.categories)&&hint.categories.includes(choice.category)&&(!hint.types?.length||choice.itemType==='Unknown'||hint.types.includes(choice.itemType));
}
function applyLocalChoice(item,choice,overwrite=false){
 if(choice.category==='Uncategorized')return;
 if(overwrite||item.category==='Uncategorized')item.category=choice.category;
 if(item.category===choice.category){if(overwrite||!item.itemType||item.itemType==='Unknown')item.itemType=choice.itemType;if(overwrite||!item.sleeveLength||item.sleeveLength==='Unknown')item.sleeveLength=choice.sleeveLength;}
 if(!item.name?.trim())item.name=choice.label.replace(/^a |^an /,'').replace(/^./,c=>c.toUpperCase());
 Object.assign(item,normalizeClothing(item));item.localStatus='Local suggestion applied. Confirm the category, sleeves, and seasons before saving.';
}
async function saveIndexed(item,sourceStillCurrent){
 // Model-derived category and type are legitimate changes before this call.
 // Pin them at submission so a later draft edit cannot inherit that result.
 const acceptedCategory=item.category,acceptedType=item.itemType;
 let value;
 const saved=await queued(()=>new Promise((resolve,reject)=>{
  if(!db)return reject(Error('Browser storage is unavailable.'));
  if(typeof sourceStillCurrent!=='function'||!sourceStillCurrent()||
     item.category!==acceptedCategory||item.itemType!==acceptedType||!batch.includes(item)||items.some(x=>x.id===item.id)||item.userAdjusted||item.requiresOwnershipConfirmation||item.possibleDuplicate||item.scanFailed||item.saveFailed||item.recognitionReviewRequired||!segmentationAllows(item,{category:item.category,itemType:item.itemType})||item.category==='Uncategorized'||!ClothingDetails.validColor(item.color))return resolve(false);
  // Another capture, cloud restore or manual save can add a matching item
  // while this classifier waits in the write queue. Recheck immediately
  // before opening the transaction, without silently deleting the photo.
  const latest=[...items,...batch].filter(x=>x.id!==item.id);
  const conflicts=latest.some(x=>x.image===item.image||
   (!independentlyDistinctOutfitRegions(item,x)&&
    Number.isFinite(item.visualAspect)&&Number.isFinite(x.visualAspect)&&
    Math.abs(x.visualAspect-item.visualAspect)<.02&&
    similarPhotos(item.visualSignature,x.visualSignature)));
  if(conflicts){
   item.possibleDuplicate=true;
   item.localStatus='Possible duplicate: compare this photo with your closet before saving.';
   return resolve(false);
  }
  // The queue can wait while recognition or a user edit changes the draft.
  // Snapshot ONLY after the last safety validation, so the IndexedDB item
  // reflects the exact original-derived category/color that was approved.
  value={...normalizeClothing(item),name:item.name.trim()||'Closet piece',savedAt:new Date().toISOString(),indexedAt:new Date().toISOString()};
  const tx=db.transaction(['items','state'],'readwrite');
  tx.objectStore('items').put(value);
  tx.objectStore('state').put({id:'draft',batch:structuredClone(batch.filter(x=>x.id!==item.id))});
  tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 }));
 if(!saved)return false;
 if(!items.some(x=>x.id===item.id))items.push(value);
 batch=batch.filter(x=>x.id!==item.id);persistDraft();return true;
}
async function recognizeItem(item){
 const scanStarted=Date.now();let savingIndexed=false;
 const scanDB=db,scanOwner=globalThis.window?.closetAuth?.user?.id;
 item.recognitionReviewRequired=true;
 // A slow or failing decode/classifier must not change the status of a newer
 // photo, updated category, or manually adjusted garment on the same card.
 let scanInputsCurrent=()=>true;
 recognitionState.activeId=item.id;item.scanFailed=false;item.saveFailed=false;item.localStatus='Checking photo quality…';render();
 try{
  const sourcePhoto=recognitionSourcePhoto(item);
  // Pin the entire source identity at scan start, not just the cropped JPEG.
  // A user can replace the full outfit, move the crop or adjust its semantic
  // hint while model work is pending. Old results must not classify new pixels.
  const originalDisplay=item.image,originalFull=item.originalPhoto?.image??null,
   originalCategory=item.category,originalType=item.itemType,
   originalHint=item.segmentHint?JSON.stringify(item.segmentHint):null;
  const sourceStillCurrent=()=>db===scanDB&&globalThis.window?.closetAuth?.user?.id===scanOwner&&recognitionSourcePhoto(item)===sourcePhoto&&
   item.image===originalDisplay&&(item.originalPhoto?.image??null)===originalFull&&
   (item.segmentHint?JSON.stringify(item.segmentHint):null)===originalHint;
  const categoryStillCurrent=()=>sourceStillCurrent()&&
   item.category===originalCategory&&item.itemType===originalType;
  scanInputsCurrent=categoryStillCurrent;
  if(!sourcePhoto){
   item.scanFailed=true;
   item.localStatus='Original source crop unavailable. Photograph this garment again or use Adjust; a cleaned cutout cannot identify it.';
   return true;
  }
  const quality=await checkPhoto(sourcePhoto);
  if(!batch.some(x=>x.id===item.id))return;
  if(!categoryStillCurrent()){
   item.localAnalyzed=false;item.scanFailed=true;
   item.localStatus='Photo or category changed while scanning. Retry to identify the new original photo.';
   return true;
  }
  if(quality.blank){if(typeof recordDeviceEvent==='function')recordDeviceEvent('blank_skipped');batch=batch.filter(x=>x.id!==item.id);message('Blank or featureless photo skipped. Frame one garment and try again.');return true;}
  if(!item.userAdjusted)Object.assign(item,ClothingDetails.fillColor(item,trustedAutomaticPhotoColor(item,quality)));item.visualSignature=quality.signature;item.visualAspect=quality.aspect;
  const matches=[...items,...batch].filter(x=>x.id!==item.id);
  if(matches.some(x=>exactlyRepeatedCapturedItem(x,item))){if(typeof recordDeviceEvent==='function')recordDeviceEvent('exact_duplicate_skipped');batch=batch.filter(x=>x.id!==item.id);message('Exact duplicate skipped.');return true;}
  // Two *different* physical garments can produce identical cleaned previews.
  // Never auto-save a display collision even if semantic hints disagree:
  // retain both original-source candidates for identity review.
  item.possibleDuplicate=matches.some(x=>x.image===item.image||
   (!independentlyDistinctOutfitRegions(item,x)&&Math.abs((x.visualAspect||0)-quality.aspect)<.02&&similarPhotos(quality.signature,x.visualSignature)));
  if(recognitionUnavailable)throw Error('Recognition is unavailable. Try again or use Adjust.');
  item.localStatus='Identifying this garment…';render();
  let result;
  try{if(!localReady)await enableLocal();result=await localRequest('classify',sourcePhoto,item.id,item.segmentHint);}
  catch(error){
   // A delayed rejected request for a discarded/replaced source must not
   // block recognition of the next newly photographed article.
   if(categoryStillCurrent()&&!item.userAdjusted&&!error?.recoverable)recognitionUnavailable=true;
   throw error;
  }
  if(!batch.some(x=>x.id===item.id))return;
  if(!categoryStillCurrent()){
   item.localAnalyzed=false;item.scanFailed=true;
   item.localStatus='Photo or category changed during recognition. Retry to identify the new original photo.';
   return true;
  }
  if(typeof ClothingMemory!=='undefined'&&ClothingMemory.valid(result.recognitionMemory))item.recognitionMemory=result.recognitionMemory;
  item.localAnalyzed=true;item.localChoices=[];
  // Diagnostic evidence contains category/type scores only, never wardrobe images.
  if(result.diagnostics)item.recognitionDiagnostics={reason:result.reason||null,...result.diagnostics};
  const corePartial=!result.strong&&result.categoryConfirmed&&result.categoryOnly&&result.choices?.[0]&&result.choices[0].itemType==='Unknown';
  const acceptedChoice=result.choices?.[0];
  if(result.strong||corePartial){
   const supported=acceptedChoice&&Object.hasOwn(clothingSchema.types,acceptedChoice.category)&&
    (acceptedChoice.itemType==='Unknown'?corePartial:clothingSchema.types[acceptedChoice.category].includes(acceptedChoice.itemType));
   const conflicts=supported&&((item.category!=='Uncategorized'&&item.category!==acceptedChoice.category)||
    (item.itemType&&item.itemType!=='Unknown'&&item.itemType!==acceptedChoice.itemType));
   if(!supported||conflicts){
    item.localStatus='Garment checks disagree with the current category or type. Confirm the garment in Adjust before saving.';
    return true;
   }
   // Keep this photo in review until mask/source, manual edits, color,
   // duplicate/ownership and all other save gates pass. In particular, a
   // strong classifier score is NOT enough to clear a clipped/mixed mask.
  }
  if(corePartial){
   if(item.userAdjusted||!segmentationAllows(item,result.choices[0])){item.localStatus=item.userAdjusted?'Your adjustments are preserved. Save this piece when ready.':item.outfitSourceId&&item.segmentHint?.displayFallback==='original-crop'?'This photo region may include multiple garments or background. Verify with Adjust or photograph the item alone.':'The clothing checks disagree. Use Adjust or take a clearer photo.';return true;}
   applyLocalChoice(item,result.choices[0]);item.name=[item.color,result.choices[0].category].filter(Boolean).join(' ');
   if(item.outfitSourceId&&item.segmentHint?.displayFallback==='original-crop'){
    item.localStatus='The outline may contain more than one item or background. Check with Adjust or photograph the garment alone before saving.';return true;
   }
   if(!item.color||item.color==='Unknown'){item.localStatus=item.possibleDuplicate?'Possible duplicate: compare this photo with your closet before saving.':item.requiresOwnershipConfirmation?'Confirm this garment belongs in your closet before saving.':'Garment category recognized. Choose a color below to save; specific type is optional.';return true;}
  }
  if(!result.strong&&!corePartial){if(typeof recordDeviceEvent==='function')recordDeviceEvent('not_recognized',{durationMs:Date.now()-scanStarted});if(item.outfitSourceId&&item.segmentHint?.displayFallback==='original-crop'){item.localStatus='The outline may contain more than one garment or background. Check with Adjust or photograph the item alone.';return true;}item.localStatus=(item.possibleDuplicate?'Possible duplicate. ':'')+(item.color?'Color kept. Confirm the garment category and type in Adjust.':'Garment identity needs confirmation. Choose a color and category in Adjust.');return true;}
  if(!segmentationAllows(item,result.choices[0])){item.localStatus=item.segmentHint?.clipped?'This piece is partly outside the photo. Retake the whole garment or use Adjust.':item.outfitSourceId&&item.segmentHint?.displayFallback==='original-crop'?'This photo region may include multiple garments or background. Verify with Adjust or photograph the item alone.':'The clothing mask and garment checks disagree. Use Adjust or take a clearer photo.';return true;}
  if(item.userAdjusted){item.localStatus='Your adjustments are preserved. Save this piece when ready.';return true;}
  applyLocalChoice(item,result.choices[0]);
  // If the original photo's central white pixels could just be its backdrop,
  // a model-suggested White detail from those same pixels is not independent
  // evidence of a white garment. Keep the category but ask for color review.
  // Other model-approved colors and actual mask-verified outfit colors retain
  // their existing gates. Never classify using the clipped display image.
  const details=item.outfitSourceId||quality.colorEstimate?.reason!=='white-foreground-unverified'||
   result.details?.color!=='White'?result.details:
   {...result.details,color:null};
  Object.assign(item,ClothingDetails.fill(item,result.choices[0],details));
  item.name=[item.color,item.itemType&&item.itemType!=='Unknown'?item.itemType:item.category].filter(Boolean).join(' ');item.indexingLevel=item.itemType==='Unknown'?'category-color':'specific-type';
  if(item.outfitSourceId&&item.segmentHint?.displayFallback==='original-crop'){
   item.localStatus='This photo region may include multiple garments or background. Verify it with Adjust or photograph the item alone before saving.';return true;
  }
  // Category and color are required for automatic closet indexing. A valid
  // garment photo stays reviewable when neither reliable photo color nor model
  // color is available; optional subtype and label details can remain blank.
  if(item.category==='Uncategorized'||!ClothingDetails.validColor(item.color)){
   item.localStatus=item.possibleDuplicate?'Possible duplicate: compare this photo with your closet before saving.':item.requiresOwnershipConfirmation?'Confirm this garment belongs in your closet before saving.':'Garment identified. Choose a color below to save; your original photo is kept.';
   return true;
  }
  if(item.possibleDuplicate){if(typeof recordDeviceEvent==='function')recordDeviceEvent('duplicate_review');item.localStatus='Possible duplicate: compare this photo with your closet before saving.';return true;}
  if(item.requiresOwnershipConfirmation){item.localStatus='Identified. Add this piece only if it belongs in your closet.';return true;}
  // Every early return above still requires review. Clear it ONLY for the
  // final original-linked category+color admission path, directly before the
  // atomic save (whose preflight checks it again).
  item.recognitionReviewRequired=false;
  item.localStatus='Recognized. Saving to your closet…';
  savingIndexed=true;
  // Applying the FINAL verified classifier legitimately changed category/type.
  // A storage failure for these accepted fields remains actionable, while
  // a later user edit/replaced original must not inherit that failed status.
  const acceptedCategory=item.category,acceptedType=item.itemType;
  scanInputsCurrent=()=>sourceStillCurrent()&&
   item.category===acceptedCategory&&item.itemType===acceptedType;
  if(await saveIndexed(item,sourceStillCurrent))if(typeof recordDeviceEvent==='function')recordDeviceEvent('recognized_saved',{durationMs:Date.now()-scanStarted});
  if(recognitionState.phase==='save-failed')recognitionState.phase='ready';
  return true;
 }catch(error){
  // Old failures are as stale as old successes. Leave the user's replacement
  // original image and manual category alone; do not surface an obsolete
  // timeout as if it belonged to the new garment.
  if(!batch.includes(item)||!scanInputsCurrent()||item.userAdjusted)return false;
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
 const owner=window.closetAuth?.user?.id;
 if(!owner)return message('Sign in before adding clothing photos to My closet.');
 const isCurrent=()=>owner===window.closetAuth?.user?.id;
 stopCamera();busy=true;controls(true);session=0;
 // Do not let a prior batch's filenames/results look like a new import after
 // the customer changes accounts on this browser.
 if(typeof window!=='undefined')window.__lastPhotoImportResult=null;
 try{
  const result=await readPhotoBatch(files,photoToJPEG,(image,file)=>{
   if(!isCurrent())return false;
   const accepted=candidate(image);
   if(accepted){const item=batch.at(-1);if(item)item.importFilename=file.name;}
   return accepted;
  },{isCurrent});
  if(!isCurrent()||result.cancelled){
   if(typeof window!=='undefined')window.__lastPhotoImportResult={added:0,errors:[],results:[],cancelled:true};
   message('Photo import stopped because the signed-in account changed. Sign in again before importing.');
   return;
  }
  if(typeof window!=='undefined')window.__lastPhotoImportResult=result;
  if(result.added){switchView('review');message(result.errors.length?result.errors.join('; '):'');}
  else message(result.errors.length?'No photos could be imported. '+result.errors.join('; '):'Exact duplicate photos were skipped; they are already in your closet or review batch.');
 }finally{busy=false;controls(false);}
}
$('clothingPhotos').onchange=event=>{const files=Array.from(event.target.files);event.target.value='';importClothingPhotos(files);};

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
  const before=JSON.stringify(target),image=recognitionSourcePhoto(target);if(!image)continue;let result;
  try{result=await localRequest(target.itemType==='Unknown'||!target.color?'classify':'features',image,null,target.segmentHint);}catch{break;}
  const current=items.find(x=>x.id===target.id);if(!current||JSON.stringify(current)!==before)continue;
  if(!ClothingMemory.valid(result.recognitionMemory))continue;
  const value={...current,recognitionMemory:result.recognitionMemory,learningReviewedWeek:week};delete value.weeklySuggestion;const choice=result.choices?.[0];if(result.strong&&choice&&segmentationAllows(current,choice)&&current.category===choice.category){const fields={itemType:choice.itemType,...ClothingDetails.recognizedFields(choice,result.details)};delete fields.color;value.weeklySuggestion={fields,requiresConfirmation:true,week};}const saved=await saveMemoryReview(value);if(saved&&recognitionSourcePhoto(current)===image){completed++;current.recognitionMemory=saved.recognitionMemory;current.learningReviewedWeek=saved.learningReviewedWeek;if(saved.weeklySuggestion)current.weeklySuggestion=saved.weeklySuggestion;else delete current.weeklySuggestion;}
 }
 }finally{memoryReviewRunning=false;render();if(completed===8&&!memoryReviewTimer)memoryReviewTimer=setTimeout(()=>{memoryReviewTimer=null;reviewRecognitionMemory().catch(()=>{});},20000);}
}
closetReady.then(scheduleMemoryReview);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleMemoryReview();});

function saveMemoryReview(value){return queued(()=>new Promise((resolve,reject)=>{
 let saved=null;const tx=db.transaction('items','readwrite'),store=tx.objectStore('items'),read=store.get(value.id);
 read.onsuccess=()=>{const current=read.result;if(!current||!recognitionSourcePhoto(current)||recognitionSourcePhoto(current)!==recognitionSourcePhoto(value))return;
 saved={...current,recognitionMemory:value.recognitionMemory,learningReviewedWeek:value.learningReviewedWeek};delete saved.weeklySuggestion;
 if(current.category===value.category&&value.weeklySuggestion)saved.weeklySuggestion=value.weeklySuggestion;store.put(saved);
 };tx.oncomplete=()=>resolve(saved);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
}));}

setInterval(scheduleMemoryReview,60*60*1000);
