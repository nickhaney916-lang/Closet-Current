'use strict';
const $=id=>document.getElementById(id), categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const recognitionAssetVersion=new URL(document.currentScript?.src||location.href).searchParams.get('v')||'';
let saving=false;const sessionCapturedIds=new Set();
let localWorker,localReady=false,localBatch=false,localLoadPromise=null,recognitionUnavailable=false;const automaticQueue=[];let automaticRunning=false;const localJobs=new Map(),localPending=new Set();
let writes=Promise.resolve();
function queued(work){const result=writes.then(work);writes=result.catch(()=>{});return result;}
let db,items=[],batch=[],stream,timer,busy=false,lastPixels=null,lastSaved=null,stable=0,lastCapture=0,session=0,audio,cadence;
let cameraMode=null,cameraOpening=false,cameraRequest=0;
const video=$('video'),canvas=document.createElement('canvas'),tiny=document.createElement('canvas');tiny.width=32;tiny.height=32;
function message(t){$('message').textContent=t;}
function switchView(view){
 if(!document.getElementById(view)?.classList.contains('view'))return;
 if((stream||cameraOpening)&&view!=='scan')stopCamera();
 document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!==view);
 document.querySelectorAll('.tab').forEach(x=>{const active=x.dataset.view===view;x.classList.toggle('active',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});
 const more=$('moreMenu');if(more){more.open=false;more.classList.toggle('has-active',['builder','trends','review'].includes(view));}
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
function field(body,title,value,type='input'){const label=node('label',title),input=node(type);if(type==='select'){for(const c of categories){const o=node('option',c);o.value=c;input.append(o);}}input.value=value||'';if(type==='input')input.maxLength=120;if(type==='textarea')input.maxLength=500;label.append(input);body.append(label);return input;}
function choice(body,title,value,options){const label=node('label',title),select=node('select');for(const option of options)select.append(node('option',option));select.value=options.includes(value)?value:options[0];label.append(select);body.append(label);return select;}
function clothingFields(body,item,onChange=()=>{}){
 Object.assign(item,normalizeClothing(item));
 const fields={name:field(body,'Item name',item.name),category:field(body,'Main category',item.category,'select')};
 const details=node('details',null,'clothing-details');details.open=true;details.append(node('summary','Clothing details'));body.append(details);
 fields.itemType=choice(details,'Item type',item.itemType,['Unknown',...(clothingSchema.types[item.category]||[])]);
 fields.sleeveLength=choice(details,'Sleeve length',item.sleeveLength,clothingSchema.sleeve);
 fields.color=field(details,'Color',item.color);
 fields.pattern=choice(details,'Pattern',item.pattern,clothingSchema.pattern);
 fields.fit=choice(details,'Fit',item.fit,clothingSchema.fit);
 const seasons=node('fieldset',null,'season-picker');seasons.append(node('legend','Seasons · choose all that apply'));const checks=[];
 for(const season of clothingSchema.seasons){const label=node('label'),input=node('input');input.type='checkbox';input.value=season;input.checked=item.seasons.includes(season);label.append(input,document.createTextNode(season));seasons.append(label);checks.push(input);input.onchange=()=>{if(input.checked){for(const other of checks)if(other!==input&&(season==='All seasons'||other.value==='All seasons'))other.checked=false;}item.seasons=checks.filter(x=>x.checked).map(x=>x.value);onChange();};}details.append(seasons);
 const extra=node('details',null,'optional-details');extra.append(node('summary','Brand, size & other details'));details.append(extra);
 for(const [key,title]of [['brand','Brand'],['size','Size'],['material','Material'],['occasion','Occasion']])fields[key]=field(extra,title,item[key]);
 fields.notes=field(extra,'Notes',item.notes,'textarea');
 for(const [key,el]of Object.entries(fields))el.oninput=()=>{item[key]=el.value;if(key==='category'){const types=['Unknown',...(clothingSchema.types[item.category]||[])];fields.itemType.replaceChildren(...types.map(x=>node('option',x)));item.itemType='Unknown';fields.itemType.value='Unknown';if(['Shoes','Accessories','Bottoms'].includes(item.category)){item.sleeveLength='Not applicable';fields.sleeveLength.value='Not applicable';}else if(item.sleeveLength==='Not applicable'){item.sleeveLength='Unknown';fields.sleeveLength.value='Unknown';}}onChange();};
 return ()=>normalizeClothing(item);
}
function adjustPhoto(item){
 const dialog=document.createElement('dialog');dialog.className='photo-adjust';
 const form=node('form'),draft=structuredClone(item),collect=clothingFields(form,draft);
 const save=node('button','Save changes','primary'),cancel=node('button','Cancel','secondary'),remove=node('button','Remove photo','secondary');
 cancel.type=remove.type='button';cancel.onclick=()=>dialog.close();
 const wasAdjusted=item.userAdjusted;item.userAdjusted=true;
 remove.onclick=async()=>{try{if(items.some(x=>x.id===item.id))await removeItem(item.id);items=items.filter(x=>x.id!==item.id);batch=batch.filter(x=>x.id!==item.id);sessionCapturedIds.delete(item.id);await persistDraft();dialog.close();render();}catch{message('Could not remove this photo. Try again.');}};
 form.onsubmit=async event=>{event.preventDefault();save.disabled=true;try{
  const value={...collect(),name:draft.name.trim()||draft.itemType||'Closet piece',savedAt:new Date().toISOString(),userAdjusted:true};
  await savePiece(value,batch.filter(x=>x.id!==item.id));
  const existing=items.find(x=>x.id===item.id);if(existing)Object.assign(existing,value);else items.push(value);
  batch=batch.filter(x=>x.id!==item.id);await persistDraft();dialog.close();render();
 }catch{save.disabled=false;message('Could not save changes. Try again.');}};
 dialog.onclose=()=>{if(batch.some(x=>x.id===item.id)&&!wasAdjusted)item.userAdjusted=false;dialog.remove();};
 const actions=node('div',null,'actions');actions.append(save,cancel,remove);form.append(actions);dialog.append(form);document.body.append(dialog);dialog.showModal();
}
function renderPhotoResults(grid,results){
 grid.replaceChildren();
 for(const item of results){
  const card=node('article',null,'card'),image=node('img');image.src=item.image;image.alt=item.name||'Clothing photo';
  const body=node('div',null,'card-body'),pending=localPending.has(item.id),saved=items.some(x=>x.id===item.id);
  const title=pending?(item.category!=='Uncategorized'?(item.itemType||'Garment'):'Reading photo…'):saved?(item.name||item.itemType):item.possibleDuplicate?'Possible duplicate':'Not recognized';
  body.append(node('h3',title));
  if(pending&&item.category!=='Uncategorized')body.append(node('p',item.category+' · finishing details…','fine'));
  else if(pending)body.append(node('p',localReady?'Identifying garment…':'Preparing recognition · first use may take a few minutes on Wi-Fi.','fine'));
  else if(item.category!=='Uncategorized')body.append(node('p',[item.category,item.itemType,item.color,item.pattern,item.sleeveLength,item.fit,...(item.seasons||[])].filter(x=>x&&x!=='Unknown'&&x!=='Not applicable').join(' · ')));
  else body.append(node('p','Try a clearer photo or fill in the details.','fine'));
  if(!pending&&!saved&&item.category!=='Uncategorized')body.append(node('p',item.possibleDuplicate?'Check whether this piece is already in your closet.':'Not saved yet · use Adjust to finish.','fine'));
  if(!pending){const adjust=node('button','Adjust','secondary');adjust.type='button';adjust.onclick=()=>adjustPhoto(item);body.append(adjust);}
  card.append(image,body);grid.append(card);
 }
}
function render(){
 $('reviewCount').textContent=batch.length;$('closetCount').textContent=items.length;$('sessionCount').textContent=session;
 $('indexingStatus').textContent='';
 const results=[...batch,...items.filter(item=>sessionCapturedIds.has(item.id))];
 renderPhotoResults($('reviewGrid'),results);
 renderPhotoResults($('scanResults'),results);
 const cg=$('closetGrid');cg.replaceChildren();const query=$('search').value.toLowerCase(),filter=$('filter').value,visible=items.filter(x=>clothingMatches(x,query,filter,$('seasonFilter').value,$('sleeveFilter').value));
 if(!visible.length)empty(cg,items.length?'No matching pieces.':'Your closet is ready to grow.',items.length?'Try a different search or category.':'Save your first piece from the review tab.');
 for(const item of visible){const card=node('article',null,'card'),im=node('img');im.src=item.image;im.alt=item.name;const body=node('div',null,'card-body');body.append(node('h3',item.name),node('p',[item.category,item.itemType,item.sleeveLength,item.color,item.pattern,item.fit].filter(x=>x&&x!=='Unknown'&&x!=='Not applicable').join(' · ')),node('p',item.seasons.length?item.seasons.join(' · '):'Season unknown'),node('p',[item.brand,item.size,item.material,item.occasion].filter(Boolean).join(' · ')),node('p',item.notes));const actions=node('div',null,'actions'),edit=node('button','Adjust details','secondary'),del=node('button','Delete','secondary');edit.onclick=()=>{const dialog=document.createElement('dialog');dialog.style.cssText='border:1px solid #d9ddd2;border-radius:8px;max-width:440px;width:90%;padding:24px';const f=node('form');const draft=structuredClone(item),collect=clothingFields(f,draft),ok=node('button','Save changes','primary'),cancel=node('button','Cancel','secondary');f.className='card';f.style.padding='15px';cancel.type='button';cancel.onclick=()=>dialog.close();f.onsubmit=async e=>{e.preventDefault();ok.disabled=true;try{const updated={...collect(),name:draft.name.trim()||'Closet piece'};await writeAll([updated]);Object.assign(item,updated);dialog.close();render();}catch{message('Changes could not be saved.');ok.disabled=false;}};f.append(ok,cancel);dialog.append(f);document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.showModal();};del.onclick=async()=>{if(!confirm('Delete this closet piece?'))return;try{await removeItem(item.id);items=items.filter(x=>x.id!==item.id);render();}catch{message('Could not delete the piece.');}};actions.append(edit,del);body.append(actions);card.append(im,body);cg.append(card);}
 if(typeof renderTrendMatches==='function')renderTrendMatches();if(typeof renderOutfitBoard==='function')renderOutfitBoard();if(typeof renderStyledCollection==='function')renderStyledCollection();if(typeof renderHomePieces==='function')renderHomePieces();
}
for(const c of categories){const o=node('option',c);$('filter').append(o);}$('search').oninput=render;$('filter').onchange=render;
function pixels(){const ctx=tiny.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0,32,32);return ctx.getImageData(0,0,32,32).data.slice();}
function difference(a,b){if(!a||!b)return 255;let total=0;for(let i=0;i<a.length;i+=4)total+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);return total/(a.length/4*3);}
function snap(){if(!video.videoWidth||video.readyState<2)throw Error('The camera has not provided a usable frame yet.');canvas.width=Math.min(900,video.videoWidth);canvas.height=Math.round(canvas.width*video.videoHeight/video.videoWidth);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.8);}
function beep(){if(!$('sound').checked||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=740;g.gain.value=.04;o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.12);}catch{}}
function candidate(image){
 if([...items,...batch].some(item=>item.image===image)){message('Exact duplicate skipped. Show the next garment.');return false;}
 const item={id:crypto.randomUUID(),image,name:'',category:'Uncategorized',color:'',notes:'',localStatus:'Reading photo…'};
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
 finally{automaticRunning=false;render();}
}
function stopCamera(){
 cameraRequest++;cameraOpening=false;clearInterval(timer);timer=null;
 if(stream)stream.getTracks().forEach(t=>t.stop());
 stream=null;cameraMode=null;video.srcObject=null;video.classList.remove('visible');
 $('placeholder').hidden=false;$('cameraChoices').hidden=false;$('cameraActions').hidden=true;
 controls(false);$('captureState').textContent='Camera stopped · your photos are ready to review';
}
function controls(disabled){for(const id of ['start','startAuto','upload','interval','clothingPhotos'])$(id).disabled=disabled;}
function finishScan(){
 const wasManual=cameraMode==='manual';
 if(!wasManual&&stream&&session===0&&video.readyState>=2&&video.videoWidth){try{candidate(snap());}catch{}}
 stopCamera();
 if(batch.length){message('');switchView('review');}
 else if(session>0){message('');switchView('review');}
 else{message(wasManual?'No photos taken yet. Open camera and tap Take photo when a garment is ready.':'No camera frames were received. Try Open camera or choose a saved closet video.');$('captureState').textContent='No photos captured · choose a camera option to try again';}
}
function captureTick(now=Date.now()){
 if(!stream||cameraMode!=='auto')return;
 const ready=video.readyState>=2&&video.videoWidth>0;
 if(!cadence.due(now,ready)){
  if(!ready)$('captureState').textContent='Waiting for camera images…';
  else $('captureState').textContent=`Next photo in ${Math.max(1,Math.ceil((cadence.intervalMs-(now-cadence.last))/1000))} seconds · hold the garment still`;
  return;
 }
 try{candidate(snap());cadence.captured(now);beep();$('captureState').textContent=`${session} images captured · show the next piece`;
 if(session>=60){finishScan();message('60 images collected. Review this batch before continuing.');}}
 catch(e){$('captureState').textContent='Waiting for a usable camera frame…';}
}
function takePhoto(){
 if(!stream||cameraMode!=='manual')return;
 try{candidate(snap());beep();$('captureState').textContent=`${session} photos taken · ready for the next piece`;if(session>=60){finishScan();message('60 photos collected. Review this batch before continuing.');}}
 catch{message('The camera is still getting ready. Wait a moment, then tap Take photo again.');}
}
async function startCamera(mode){
 if(busy||stream)return;
 const request=++cameraRequest;cameraOpening=true;busy=true;controls(true);
 $('captureState').textContent='Opening camera…';
 try{audio=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();}catch{}
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access unavailable. Choose saved photos or a closet video instead.');
  const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false});
  if(request!==cameraRequest){acquired.getTracks().forEach(track=>track.stop());return;}
  stream=acquired;cameraMode=mode;
  video.removeAttribute('src');video.srcObject=stream;video.classList.add('visible');$('placeholder').hidden=true;
  await video.play();session=0;$('sessionCount').textContent='0';$('lastCaptureImage').hidden=true;
  if(request!==cameraRequest)return;
  cameraOpening=false;$('cameraChoices').hidden=true;$('cameraActions').hidden=false;$('takePhoto').hidden=mode!=='manual';
  if(mode==='auto'){
   cadence=new CaptureCadence(Number($('interval').value)*1000,Date.now());
   timer=setInterval(()=>captureTick(),250);captureTick();
   message(`Automatic scan: one photo every ${$('interval').value} seconds. Watch the countdown and hold each garment still. Finish & review stops the camera.`);
  }else{
   $('captureState').textContent='Frame a garment · tap Take photo when ready';
   message('Take each photo at your own pace. Tap Finish & review when you are done.');
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
const closetReady=(async()=>{await window.closetAuth.ready;try{db=await openDB();items=(await readAll()).map(normalizeClothing);batch=(await readDraft()).map(normalizeClothing);if(batch.length)message(`${batch.length} unfinished photos are waiting in More → Photo results.`);}catch{message('Browser storage is unavailable. Use a regular browser to save your closet.');}render();for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);})();

for(const c of categories.slice(1))$('batchCategory').append(node('option',c));
$('applyCategory').onclick=()=>{const category=$('batchCategory').value;if(!category)return message('Choose a category for this batch.');let count=0;for(const item of batch)if(item.category==='Uncategorized'){item.category=category;Object.assign(item,normalizeClothing(item));count++;}persistDraft();render();message(`Category applied to ${count} uncategorized candidates.`);};

for(const season of clothingSchema.seasons.slice(0,4))$('seasonFilter').append(node('option',season));for(const sleeve of clothingSchema.sleeve)$('sleeveFilter').append(node('option',sleeve));$('seasonFilter').onchange=render;$('sleeveFilter').onchange=render;

function localRequest(type,image,itemId){
 return new Promise((resolve,reject)=>{
  if(!localWorker){
   localWorker=new Worker('local-worker.mjs'+(recognitionAssetVersion?'?v='+recognitionAssetVersion:''),{type:'module'});
   localWorker.onmessage=event=>{const data=event.data;if(data.type==='progress'){$('localStatus').textContent=data.text;return;}const job=localJobs.get(data.id);if(!job)return;if(data.type==='identified'){const item=batch.find(x=>x.id===job.itemId);if(item&&!item.userAdjusted){applyLocalChoice(item,data.choice);render();}return;}clearTimeout(job.timer);localJobs.delete(data.id);if(data.type==='error')job.reject(Error(data.text));else job.resolve(data);};
   localWorker.onerror=()=>{localReady=false;for(const job of localJobs.values()){clearTimeout(job.timer);job.reject(Error('Local recognition is unavailable. Try Chrome with Wi-Fi.'));}localJobs.clear();localWorker.terminate();localWorker=null;};
  }
  const id=crypto.randomUUID(),timer=setTimeout(()=>{const job=localJobs.get(id);if(job){localJobs.delete(id);job.reject(Error('The local model is taking too long. Retry with Wi-Fi.'));}if(localWorker){localWorker.terminate();localWorker=null;localReady=false;for(const other of localJobs.values()){clearTimeout(other.timer);other.reject(Error('Local recognition stopped. Please try again.'));}localJobs.clear();}},240000);
  localJobs.set(id,{resolve,reject,timer,itemId});localWorker.postMessage({type,id,image});
 });
}
async function enableLocal(){
 if(localReady)return true;
 if(!localLoadPromise)localLoadPromise=(async()=>{
  $('localStatus').textContent='Loading automatic recognition on this device…';
  try{await localRequest('load');localReady=true;$('localStatus').textContent='Recognition ready. New photos are indexed automatically.';return true;}
  finally{localLoadPromise=null;}
 })();
 return localLoadPromise;
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
  if(!batch.some(x=>x.id===item.id)||item.userAdjusted)return resolve(false);
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
 item.localStatus='Checking photo quality…';render();
 try{
  const quality=await checkPhoto(item.image);
  if(!batch.some(x=>x.id===item.id))return;
  if(quality.blank){batch=batch.filter(x=>x.id!==item.id);message('Blank or featureless photo skipped. Frame one garment and try again.');return true;}
  item.visualSignature=quality.signature;item.visualAspect=quality.aspect;
  const matches=[...items,...batch].filter(x=>x.id!==item.id);
  if(matches.some(x=>x.image===item.image)){batch=batch.filter(x=>x.id!==item.id);message('Exact duplicate skipped.');return true;}
  item.possibleDuplicate=matches.some(x=>Math.abs((x.visualAspect||0)-quality.aspect)<.02&&similarPhotos(quality.signature,x.visualSignature));
  if(recognitionUnavailable)throw Error('Automatic recognition is unavailable. Tap Retry unfinished photos or adjust this piece yourself.');
  item.localStatus='Identifying this garment…';render();
  let result;
  try{if(!localReady)await enableLocal();result=await localRequest('classify',item.image,item.id);}
  catch(error){recognitionUnavailable=true;throw error;}
  if(!batch.some(x=>x.id===item.id))return;
  item.localAnalyzed=true;item.localChoices=[];
  if(!result.strong){item.localStatus=(item.possibleDuplicate?'Possible duplicate. ':'')+'Not identified confidently.';return true;}
  if(item.userAdjusted){item.localStatus='Your adjustments are preserved. Save this piece when ready.';return true;}
  applyLocalChoice(item,result.choices[0]);
  for(const [key,value]of Object.entries(result.details||{}))if(['color','pattern','fit','sleeveLength'].includes(key)&&(!item[key]||item[key]==='Unknown'))item[key]=value;
  item.name=[item.color,item.itemType].filter(x=>x&&x!=='Unknown').join(' ');
  if(item.possibleDuplicate){item.localStatus='Possible duplicate: compare this photo with your closet before saving.';return true;}
  item.localStatus='Recognized. Saving to your closet…';
  await saveIndexed(item);
  return true;
 }catch(error){
  if(!item.visualSignature)item.localStatus='Could not read this photo. Retake it or adjust details.';
  else{item.localStatus=error.message||'Automatic indexing stopped. Retry or adjust details.';}
  $('localStatus').textContent=item.localStatus;return false;
 }finally{localPending.delete(item.id);persistDraft();render();}
}
async function recognizeBatch(){
 if(localBatch)return;localBatch=true;recognitionUnavailable=false;
 try{for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);}
 finally{localBatch=false;}
}
$('recognizeBatch').onclick=recognizeBatch;

async function importClothingPhotos(files){
 if(busy||!files.length)return;
 if(files.length>20)return message('Choose up to 20 clothing photos per batch.');
 stopCamera();busy=true;controls(true);session=0;
 try{
  const result=await readPhotoBatch(files,photoToJPEG,image=>candidate(image));
  if(result.added){switchView('review');message(result.errors.length?result.errors.join('; '):'');}
  else message(result.errors.length?'No photos could be imported. '+result.errors.join('; '):'Exact duplicate photos were skipped; they are already in your closet or review batch.');
 }finally{busy=false;controls(false);}
}
$('clothingPhotos').onchange=event=>{const files=Array.from(event.target.files);event.target.value='';importClothingPhotos(files);};
