'use strict';
const $=id=>document.getElementById(id), categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const recognitionAssetVersion=new URL(document.currentScript?.src||location.href).searchParams.get('v')||'';
let saving=false;const sessionCapturedIds=new Set();
let localWorker,localReady=false,localBatch=false,localLoadPromise=null,recognitionUnavailable=false;const automaticQueue=[];let automaticRunning=false;const localJobs=new Map(),localPending=new Set();
const recognitionState={phase:'idle',percent:null,activeId:null};
let writes=Promise.resolve();
function queued(work){const result=writes.then(async()=>{await window.closetCloud?.beforeWrite(db);return work();});writes=result.catch(()=>{});result.then(()=>window.closetCloud?.changed()).catch(()=>{});return result;}
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
function persistDraft(){if(!db)return;const snapshot=structuredClone(batch);return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'draft',batch:snapshot});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);})).catch(()=>message('Your unfinished scan could not be backed up. Keep this page open and save or export your pieces.'));}
function readDraft(){return new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('draft');r.onsuccess=()=>resolve(r.result?.batch||[]);r.onerror=()=>reject(r.error);});}
function savePiece(value,nextBatch){return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction(['items','state'],'readwrite');tx.objectStore('items').put(value);tx.objectStore('state').put({id:'draft',batch:structuredClone(nextBatch)});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));}
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
 const wasAdjusted=item.userAdjusted,wasScanning=localPending.has(item.id);item.userAdjusted=true;
 remove.onclick=async()=>{try{if(items.some(x=>x.id===item.id))await removeItem(item.id);items=items.filter(x=>x.id!==item.id);batch=batch.filter(x=>x.id!==item.id);sessionCapturedIds.delete(item.id);await persistDraft();dialog.close();render();}catch{message('Could not remove this photo. Try again.');}};
 form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{
  const value={...collect(),name:draft.name.trim()||(draft.itemType&&draft.itemType!=='Unknown'?draft.itemType:'Closet piece'),savedAt:new Date().toISOString(),userAdjusted:true,requiresOwnershipConfirmation:false};
  if(typeof ClothingMemory!=='undefined')Object.assign(value,ClothingMemory.confirm(value));
  if(value.color&&value.colorSource==='photo-estimate')value.colorSource='user';
  await savePiece(value,batch.filter(x=>x.id!==item.id));
  const existing=items.find(x=>x.id===item.id);if(existing)Object.assign(existing,value);else items.push(value);
  batch=batch.filter(x=>x.id!==item.id);await persistDraft();dialog.close();render();scheduleMemoryReview();
 }catch{save.disabled=false;message('Could not save changes. Try again.');}};
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
  card.append(image,body);grid.append(card);
 }
}
function render(){
 $('reviewCount').textContent=batch.length;$('closetCount').textContent=items.length;$('sessionCount').textContent=session;
 renderRecognitionNotice();
 const results=[...batch,...items.filter(item=>sessionCapturedIds.has(item.id))];
 renderPhotoResults($('reviewGrid'),results);
 renderPhotoResults($('scanResults'),results);
 const cg=$('closetGrid');cg.replaceChildren();const query=$('search').value.toLowerCase(),filter=$('filter').value,visible=(query||filter!=='All categories'||window.closetBrowseAll||window.closetSlotFilter)?items.filter(x=>(!window.closetSlotFilter||outfitSlots.some(slot=>slot.id===window.closetSlotFilter&&slotAllows(slot,x)))&&(!window.closetItemType||x.itemType===window.closetItemType)&&(!window.closetSleeves||window.closetSleeves.includes(x.sleeveLength))&&clothingMatches(x,query,filter,$('seasonFilter').value,$('sleeveFilter').value)):[];
 if(!visible.length)empty(cg,items.length?'No matching pieces.':'Your closet is ready to grow.',items.length?'Try a different search or category.':'Save your first piece from the review tab.');
 for(const item of visible){const card=node('article',null,'card'),im=node('img');im.loading='lazy';im.src=item.image;im.alt=item.name;const body=node('div',null,'card-body');body.append(node('h3',item.name),node('p',[item.color,item.pattern].filter(x=>x&&x!=='Unknown'&&x!=='Not applicable').join(' · ')),node('p',item.seasons.length?item.seasons.join(' · '):'Season unknown'),node('p',[item.brand,item.size,item.material,item.occasion].filter(Boolean).join(' · ')),node('p',item.notes));if(item.itemType==='Unknown'&&item.color)body.append(node('p','Category and color saved · refine the type when convenient.','fine'));const actions=node('div',null,'actions'),edit=node('button','Adjust details','secondary'),del=node('button','Delete','secondary');edit.onclick=()=>{const dialog=document.createElement('dialog');dialog.className='clothing-editor';dialog.style.cssText='border:1px solid #d9ddd2;border-radius:8px;max-width:440px;width:90%;padding:24px';const f=node('form');const draft=structuredClone(item),collect=clothingFields(f,draft),ok=node('button','Save changes','primary'),cancel=node('button','Cancel','secondary');f.className='card';f.style.padding='15px';cancel.type='button';cancel.onclick=()=>dialog.close();f.onsubmit=async e=>{e.preventDefault();ok.disabled=true;try{const updated={...collect(),name:draft.name.trim()||'Closet piece'};if(updated.color&&updated.colorSource==='photo-estimate')updated.colorSource='user';if(typeof ClothingMemory!=='undefined')Object.assign(updated,ClothingMemory.confirm(updated));await writeAll([updated]);Object.assign(item,updated);dialog.close();render();scheduleMemoryReview();}catch{message('Changes could not be saved.');ok.disabled=false;}};f.append(ok,cancel);dialog.append(f);document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.showModal();};del.onclick=async()=>{if(!confirm('Delete this closet piece?'))return;try{await removeItem(item.id);items=items.filter(x=>x.id!==item.id);render();}catch{message('Could not delete the piece.');}};if(typeof closetWearButton==='function')actions.append(closetWearButton(item));actions.append(edit,cropButton(item),del);body.append(actions);card.append(im,body);if(typeof enableClosetDrag==='function')enableClosetDrag(im,item);cg.append(card);}
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
function snap(){if(!video.videoWidth||video.readyState<2)throw Error('The camera has not provided a usable frame yet.');const scale=Math.min(1,2048/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));const context=canvas.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(video,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.94);}
function beep(){if(!$('sound').checked||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=740;g.gain.value=.04;o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.12);}catch{}}
function candidate(image,options={}){
 if([...items,...batch].some(item=>item.image===image)){if(typeof recordDeviceEvent==='function')recordDeviceEvent('exact_duplicate_skipped');message('Exact duplicate skipped. Show the next garment.');return false;}
 const item=normalizeClothing({id:crypto.randomUUID(),image,name:'',category:'Uncategorized',color:'',notes:'',localStatus:'Reading photo…'});
 if(typeof recordDeviceEvent==='function')recordDeviceEvent('photo_queued');
 if(options.outfitSourceId){item.outfitSourceId=options.outfitSourceId;item.requiresOwnershipConfirmation=false;item.segmentHint=options.segmentHint;item.recognitionPhoto=options.recognitionPhoto;item.originalPhoto=options.originalPhoto;item.cropBounds=options.cropBounds;if(options.colorEstimate){Object.assign(item,ClothingDetails.fillColor(item,options.colorEstimate));if(item.colorSource==='photo-estimate')item.colorMethod='garment-mask';}}
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
 stream=null;cameraMode=null;previousQualityFrame=null;video.srcObject=null;video.classList.remove('visible');
 $('placeholder').hidden=false;$('cameraChoices').hidden=false;$('cameraActions').hidden=true;
 controls(false);$('captureState').textContent='Camera stopped · your photos are ready to review';
}
function controls(disabled){for(const id of ['start','startAuto','upload','interval','clothingPhotos','outfitCamera','outfitUpload','outfitRetry','captureSingle','captureOutfit'])$(id).disabled=disabled;}
function finishScan(){
 const wasManual=cameraMode==='manual';
 if(!wasManual&&stream&&session===0&&video.readyState>=2&&video.videoWidth){try{if(cameraFrameQuality().usable)candidate(snap());}catch{}}
 stopCamera();
 if(batch.length){message('');switchView('review');}
 else if(session>0){message('');switchView('review');}
 else{message(wasManual?'No photos taken yet. Take photos and tap the shutter when a garment is ready.':'No camera frames were received. Try Take photos or choose a saved closet video.');$('captureState').textContent='No photos captured · choose a camera option to try again';}
}
function captureTick(now=Date.now()){
 if(!stream||cameraMode!=='auto')return;
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
 if(!stream||cameraMode!=='manual')return;
 try{const quality=cameraFrameQuality();if(!quality.usable){message('Photo looks too dark or low-resolution. Try brighter light and take it again.');return;}cameraStability();candidate(snap());beep();$('captureState').textContent=`${session} photos taken · ready for the next piece`;if(session>=60){finishScan();message('60 photos collected. Review this batch before continuing.');}}
 catch{message('The camera is still getting ready. Wait a moment, then tap Take photo again.');}
}
async function startCamera(mode){
 if(busy||stream)return;
 const request=++cameraRequest;cameraOpening=true;busy=true;controls(true);
 $('captureState').textContent='Opening camera…';
 try{audio=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();}catch{}
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access unavailable. Choose saved photos or a closet video instead.');
  const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
  if(request!==cameraRequest){acquired.getTracks().forEach(track=>track.stop());return;}
  stream=acquired;cameraMode=mode;
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
$('start').onclick=()=>startCamera('manual');
$('startAuto').onclick=()=>startCamera('auto');
$('takePhoto').onclick=takePhoto;
$('stop').onclick=finishScan;
function waitEvent(target,event,timeout=15000){return new Promise((resolve,reject)=>{let t;const clean=()=>{clearTimeout(t);target.removeEventListener(event,ok);target.removeEventListener('error',fail);};const ok=()=>{clean();resolve();},fail=()=>{clean();reject(Error('This video could not be read. Try an MP4 recorded by your phone.'));};target.addEventListener(event,ok,{once:true});target.addEventListener('error',fail,{once:true});t=setTimeout(fail,timeout);});}
async function upload(file){if(!file||busy)return;if(file.size>150*1024*1024)return message('Choose a video smaller than 150 MB. Short batches work best.');stopCamera();busy=true;controls(true);let url;const startLength=batch.length;try{url=URL.createObjectURL(file);video.src=url;video.classList.add('visible');$('placeholder').hidden=true;const loaded=waitEvent(video,'loadedmetadata');video.load();await loaded;if(!Number.isFinite(video.duration)||video.duration<=0)throw Error('Video duration could not be read. Try a regular MP4.');if(video.duration>180)throw Error('Please trim this video to 3 minutes or less.');session=0;const interval=Number($('interval').value);for(let t=Math.min(.1,video.duration/2);t<video.duration;t+=interval){const seek=waitEvent(video,'seeked');video.currentTime=t;await seek;candidate(snap());const progress=Math.round(t/video.duration*100);$('captureState').textContent=`Collecting images · ${progress}%`;}message('');switchView('review');}catch(e){render();if(batch.length>startLength){message(`${session} images recovered before processing stopped. ${e.message}`);switchView('review');}else message(e.message);}finally{busy=false;controls(false);video.removeAttribute('src');video.load();if(url)URL.revokeObjectURL(url);$('captureState').textContent='Ready for another batch';}}
$('upload').onchange=e=>{upload(e.target.files[0]);e.target.value='';};
$('discard').onclick=()=>{if(batch.length&&confirm('Discard all unsaved images in this batch?')){batch=[];persistDraft();session=0;render();}};
$('export').onclick=async()=>{if(typeof outfitBoardReady!=='undefined')await outfitBoardReady;if(!items.length&&(typeof inspirationLooks==='undefined'||!inspirationLooks.length))return message('Save a closet piece or inspiration look before exporting.');const blob=new Blob([JSON.stringify({format:'closet-current',version:3,items,looks:typeof inspirationLooks!=='undefined'?inspirationLooks:[],outfitBoard:typeof boardBackup==='function'?boardBackup():undefined})],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='closet-current-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Backup downloaded. Keep it somewhere you can find again.');};
$('import').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(!db)return message('Browser storage is unavailable.');if(file.size>100*1024*1024)return message('Backup must be smaller than 100 MB.');try{const data=JSON.parse(await file.text());if(data.format!=='closet-current'||![1,2,3].includes(data.version)||!Array.isArray(data.items)||data.items.length>1000)throw Error('Choose a Closet Current backup.');const valid=data.items.map(x=>{if(typeof x.id!=='string'||!x.id||typeof x.image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x.image)||x.image.length>3000000)throw Error('Backup contains an invalid image.');return normalizeClothing({...x,id:x.id.slice(0,100),image:x.image,name:String(x.name||'Closet piece').slice(0,120),category:categories.includes(x.category)?x.category:'Uncategorized',color:String(x.color||'').slice(0,120),notes:String(x.notes||'').slice(0,500),savedAt:String(x.savedAt||'')});});if(data.looks){if(!Array.isArray(data.looks)||data.looks.length>100)throw Error('Invalid inspiration backup.');data.looks=data.looks.map(validLook);}if(!confirm(`Import ${valid.length} pieces? Matching IDs will update existing pieces.`))return;await writeAll(valid);items=(await readAll()).map(normalizeClothing);if(data.looks)await importLooks(data.looks);if(data.outfitBoard&&typeof importBoardBackup==='function')await importBoardBackup(data.outfitBoard);render();message('Backup imported.');}catch(err){message(err.message||'Import failed.');}};
window.addEventListener('pagehide',stopCamera);window.addEventListener('beforeunload',e=>{if(batch.length||busy){e.preventDefault();e.returnValue='';}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(stream||cameraOpening)){stopCamera();message('Camera stopped while the app was in the background. Your photos are ready to review.');}});
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
async function saveIndexed(item){
 const value={...normalizeClothing(item),name:item.name.trim()||'Closet piece',savedAt:new Date().toISOString(),indexedAt:new Date().toISOString()};
 const saved=await queued(()=>new Promise((resolve,reject)=>{
  if(!db)return reject(Error('Browser storage is unavailable.'));
  if(!batch.some(x=>x.id===item.id)||item.userAdjusted||item.requiresOwnershipConfirmation)return resolve(false);
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
 const scanStarted=Date.now();let savingIndexed=false;recognitionState.activeId=item.id;item.scanFailed=false;item.saveFailed=false;item.localStatus='Checking photo quality…';render();
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
  if(await saveIndexed(item))if(typeof recordDeviceEvent==='function')recordDeviceEvent('recognized_saved',{durationMs:Date.now()-scanStarted});
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
  const result=await readPhotoBatch(files,photoToJPEG,(image,file)=>{const accepted=candidate(image);if(accepted){const item=batch.at(-1);if(item)item.importFilename=file.name;}return accepted;});
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
