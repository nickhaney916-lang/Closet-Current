'use strict';
const $=id=>document.getElementById(id), categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
let saving=false;
let localWorker,localReady=false,localBatch=false;const localJobs=new Map(),localPending=new Set();
let writes=Promise.resolve();
function queued(work){const result=writes.then(work);writes=result.catch(()=>{});return result;}
let db,items=[],batch=[],stream,timer,busy=false,lastPixels=null,lastSaved=null,stable=0,lastCapture=0,session=0,audio,cadence;
const video=$('video'),canvas=document.createElement('canvas'),tiny=document.createElement('canvas');tiny.width=32;tiny.height=32;
function message(t){$('message').textContent=t;}
function switchView(view){if(stream&&view!=='scan')stopCamera();document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!==view);document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.view===view));render();}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('closet-current-v1',2);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
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
function render(){
 $('reviewCount').textContent=batch.length;$('closetCount').textContent=items.length;$('sessionCount').textContent=session;
 const grid=$('reviewGrid');grid.replaceChildren();
 if(!batch.length)empty(grid,'Your next piece starts with a scan.','Record or upload a short video to collect candidate images.');
 for(const item of batch){const card=node('article',null,'card'),im=node('img');im.src=item.image;im.alt='Candidate clothing image';const body=node('div',null,'card-body');const panel=node('div',null,'local-panel'),recognize=node('button',localPending.has(item.id)?'Recognizing…':'Recognize on this device','secondary');recognize.disabled=localPending.has(item.id)||!!stream;recognize.onclick=()=>recognizeItem(item);panel.append(recognize);if(item.localStatus)panel.append(node('p',item.localStatus));for(const suggestion of item.localChoices||[]){if(suggestion.category==='Uncategorized')continue;const use=node('button','Use '+suggestion.label.replace(/^a |^an /,''),'choice-button');use.onclick=()=>{applyLocalChoice(item,suggestion,true);persistDraft();render();};panel.append(use);}body.append(panel);clothingFields(body,item,persistDraft);
 const actions=node('div',null,'actions'),save=node('button','Save piece','primary'),discard=node('button','Remove','secondary');save.disabled=localPending.has(item.id);save.onclick=async()=>{if(saving||localPending.has(item.id))return;if(!db)return message('Storage is unavailable. Please use a regular browser.');saving=true;save.disabled=true;try{const value={...normalizeClothing(item),name:item.name.trim()||'Closet piece',category:item.category||'Uncategorized',savedAt:new Date().toISOString()};const nextBatch=batch.filter(x=>x.id!==item.id);await savePiece(value,nextBatch);items.push(value);batch=nextBatch;render();message('Piece saved to your closet.');}catch(e){message('Could not save this piece. Free browser storage and try again.');save.disabled=false;}finally{saving=false;}};discard.onclick=()=>{batch=batch.filter(x=>x.id!==item.id);persistDraft();render();};actions.append(save,discard);body.append(actions);card.append(im,body);grid.append(card);}
 const cg=$('closetGrid');cg.replaceChildren();const query=$('search').value.toLowerCase(),filter=$('filter').value,visible=items.filter(x=>clothingMatches(x,query,filter,$('seasonFilter').value,$('sleeveFilter').value));
 if(!visible.length)empty(cg,items.length?'No matching pieces.':'Your closet is ready to grow.',items.length?'Try a different search or category.':'Save your first piece from the review tab.');
 for(const item of visible){const card=node('article',null,'card'),im=node('img');im.src=item.image;im.alt=item.name;const body=node('div',null,'card-body');body.append(node('h3',item.name),node('p',[item.category,item.itemType,item.sleeveLength,item.color,item.pattern,item.fit].filter(x=>x&&x!=='Unknown'&&x!=='Not applicable').join(' · ')),node('p',item.seasons.length?item.seasons.join(' · '):'Season unknown'),node('p',[item.brand,item.size,item.material,item.occasion].filter(Boolean).join(' · ')),node('p',item.notes));const actions=node('div',null,'actions'),edit=node('button','Edit','secondary'),del=node('button','Delete','secondary');edit.onclick=()=>{const dialog=document.createElement('dialog');dialog.style.cssText='border:1px solid #d9ddd2;border-radius:8px;max-width:440px;width:90%;padding:24px';const f=node('form');const draft=structuredClone(item),collect=clothingFields(f,draft),ok=node('button','Save changes','primary'),cancel=node('button','Cancel','secondary');f.className='card';f.style.padding='15px';cancel.type='button';cancel.onclick=()=>dialog.close();f.onsubmit=async e=>{e.preventDefault();ok.disabled=true;try{const updated={...collect(),name:draft.name.trim()||'Closet piece'};await writeAll([updated]);Object.assign(item,updated);dialog.close();render();}catch{message('Changes could not be saved.');ok.disabled=false;}};f.append(ok,cancel);dialog.append(f);document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.showModal();};del.onclick=async()=>{if(!confirm('Delete this closet piece?'))return;try{await removeItem(item.id);items=items.filter(x=>x.id!==item.id);render();}catch{message('Could not delete the piece.');}};actions.append(edit,del);body.append(actions);card.append(im,body);cg.append(card);}
 if(typeof renderTrendMatches==='function')renderTrendMatches();
}
for(const c of categories){const o=node('option',c);$('filter').append(o);}$('search').oninput=render;$('filter').onchange=render;
function pixels(){const ctx=tiny.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0,32,32);return ctx.getImageData(0,0,32,32).data.slice();}
function difference(a,b){if(!a||!b)return 255;let total=0;for(let i=0;i<a.length;i+=4)total+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);return total/(a.length/4*3);}
function snap(){if(!video.videoWidth||video.readyState<2)throw Error('The camera has not provided a usable frame yet.');canvas.width=Math.min(900,video.videoWidth);canvas.height=Math.round(canvas.width*video.videoHeight/video.videoWidth);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.8);}
function beep(){if(!$('sound').checked||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=740;g.gain.value=.04;o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.12);}catch{}}
function candidate(image){batch.push({id:crypto.randomUUID(),image,name:'',category:'Uncategorized',color:'',notes:''});persistDraft();session++;$('sessionCount').textContent=session;$('reviewCount').textContent=batch.length;$('lastCaptureImage').src=image;$('lastCaptureImage').hidden=false;}
function stopCamera(){clearInterval(timer);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;$('start').hidden=false;$('stop').hidden=true;$('interval').disabled=false;$('captureState').textContent='Session finished — review your candidates';}
function controls(disabled){for(const id of ['start','upload','record','interval','clothingPhotos'])$(id).disabled=disabled;}
function finishScan(){
 if(stream&&session===0&&video.readyState>=2&&video.videoWidth){try{candidate(snap());}catch{}}
 stopCamera();
 if(batch.length){message(`${session} images collected in this session. Review the images and keep the clearest view of each garment.`);switchView('review');if(localReady&&$('autoLocal').checked)recognizeBatch();}
 else{message('No camera frames were received. Stay on this screen and try Record with phone camera or Upload a closet video.');$('captureState').textContent='No images captured — try a recorded video';}
}
function captureTick(now=Date.now()){
 if(!stream)return;
 const ready=video.readyState>=2&&video.videoWidth>0;
 if(!cadence.due(now,ready)){
  if(!ready)$('captureState').textContent='Waiting for camera images…';
  return;
 }
 try{candidate(snap());cadence.captured(now);beep();$('captureState').textContent=`${session} images captured · show the next piece`;
 if(session>=60){finishScan();message('60 images collected. Review this batch before continuing.');}}
 catch(e){$('captureState').textContent='Waiting for a usable camera frame…';}
}
$('start').onclick=async()=>{
 if(busy||stream)return;
 busy=true;$('start').disabled=true;
 try{audio=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();}catch{}
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access unavailable. Use Record with phone camera or upload a video.');
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false});
  video.removeAttribute('src');video.srcObject=stream;video.classList.add('visible');$('placeholder').hidden=true;
  await video.play();session=0;$('sessionCount').textContent='0';$('lastCaptureImage').hidden=true;
  cadence=new CaptureCadence(Number($('interval').value)*1000);
  $('start').hidden=true;$('stop').hidden=false;$('interval').disabled=true;
  $('captureState').textContent='Camera ready · hold the first garment in view';
  timer=setInterval(()=>captureTick(),250);captureTick();
  message(`Capturing one image every ${$('interval').value} seconds. Watch the image count increase; hold each garment still for one interval before moving to the next.`);
 }catch(e){stopCamera();message(e.message||'Camera could not start. Try uploading a recorded video.');}
 finally{busy=false;$('start').disabled=false;}
};
$('stop').onclick=finishScan;
function waitEvent(target,event,timeout=15000){return new Promise((resolve,reject)=>{let t;const clean=()=>{clearTimeout(t);target.removeEventListener(event,ok);target.removeEventListener('error',fail);};const ok=()=>{clean();resolve();},fail=()=>{clean();reject(Error('This video could not be read. Try an MP4 recorded by your phone.'));};target.addEventListener(event,ok,{once:true});target.addEventListener('error',fail,{once:true});t=setTimeout(fail,timeout);});}
async function upload(file){if(!file||busy)return;if(file.size>150*1024*1024)return message('Choose a video smaller than 150 MB. Short batches work best.');stopCamera();busy=true;controls(true);let url;const startLength=batch.length;try{url=URL.createObjectURL(file);video.src=url;video.classList.add('visible');$('placeholder').hidden=true;const loaded=waitEvent(video,'loadedmetadata');video.load();await loaded;if(!Number.isFinite(video.duration)||video.duration<=0)throw Error('Video duration could not be read. Try a regular MP4.');if(video.duration>180)throw Error('Please trim this video to 3 minutes or less.');session=0;const interval=Number($('interval').value);for(let t=Math.min(.1,video.duration/2);t<video.duration;t+=interval){const seek=waitEvent(video,'seeked');video.currentTime=t;await seek;candidate(snap());const progress=Math.round(t/video.duration*100);$('captureState').textContent=`Collecting images · ${progress}%`;}message(`${session} candidate images collected. Keep the best view of each garment. Categories are entered during review.`);switchView('review');if(localReady&&$('autoLocal').checked)recognizeBatch();}catch(e){render();if(batch.length>startLength){message(`${session} images recovered before processing stopped. ${e.message}`);switchView('review');}else message(e.message);}finally{busy=false;controls(false);video.removeAttribute('src');video.load();if(url)URL.revokeObjectURL(url);$('captureState').textContent='Ready for another batch';}}
for(const id of ['upload','record'])$(id).onchange=e=>{upload(e.target.files[0]);e.target.value='';};
$('discard').onclick=()=>{if(batch.length&&confirm('Discard all unsaved images in this batch?')){batch=[];persistDraft();session=0;render();}};
$('export').onclick=()=>{if(!items.length&&(typeof inspirationLooks==='undefined'||!inspirationLooks.length))return message('Save a closet piece or inspiration look before exporting.');const blob=new Blob([JSON.stringify({format:'closet-current',version:3,items,looks:typeof inspirationLooks!=='undefined'?inspirationLooks:[]})],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='closet-current-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Backup downloaded. Keep it somewhere you can find again.');};
$('import').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(!db)return message('Browser storage is unavailable.');if(file.size>100*1024*1024)return message('Backup must be smaller than 100 MB.');try{const data=JSON.parse(await file.text());if(data.format!=='closet-current'||![1,2,3].includes(data.version)||!Array.isArray(data.items)||data.items.length>1000)throw Error('Choose a Closet Current backup.');const valid=data.items.map(x=>{if(typeof x.id!=='string'||!x.id||typeof x.image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x.image)||x.image.length>3000000)throw Error('Backup contains an invalid image.');return normalizeClothing({...x,id:x.id.slice(0,100),image:x.image,name:String(x.name||'Closet piece').slice(0,120),category:categories.includes(x.category)?x.category:'Uncategorized',color:String(x.color||'').slice(0,120),notes:String(x.notes||'').slice(0,500),savedAt:String(x.savedAt||'')});});if(data.looks){if(!Array.isArray(data.looks)||data.looks.length>100)throw Error('Invalid inspiration backup.');data.looks=data.looks.map(validLook);}if(!confirm(`Import ${valid.length} pieces? Matching IDs will update existing pieces.`))return;await writeAll(valid);items=(await readAll()).map(normalizeClothing);if(data.looks)await importLooks(data.looks);render();message('Backup imported.');}catch(err){message(err.message||'Import failed.');}};
window.addEventListener('pagehide',stopCamera);window.addEventListener('beforeunload',e=>{if(batch.length||busy){e.preventDefault();e.returnValue='';}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream){stopCamera();message('Camera stopped while the app was in the background. Your candidate images are ready to review.');}});
const closetReady=(async()=>{try{db=await openDB();items=(await readAll()).map(normalizeClothing);batch=(await readDraft()).map(normalizeClothing);if(batch.length)message(`${batch.length} unfinished candidates restored. Continue in Review.`);}catch{message('Browser storage is unavailable. Use a regular browser to save your closet.');}render();})();

for(const c of categories.slice(1))$('batchCategory').append(node('option',c));
$('applyCategory').onclick=()=>{const category=$('batchCategory').value;if(!category)return message('Choose a category for this batch.');let count=0;for(const item of batch)if(item.category==='Uncategorized'){item.category=category;Object.assign(item,normalizeClothing(item));count++;}persistDraft();render();message(`Category applied to ${count} uncategorized candidates.`);};

for(const season of clothingSchema.seasons.slice(0,4))$('seasonFilter').append(node('option',season));for(const sleeve of clothingSchema.sleeve)$('sleeveFilter').append(node('option',sleeve));$('seasonFilter').onchange=render;$('sleeveFilter').onchange=render;

function localRequest(type,image){
 return new Promise((resolve,reject)=>{
  if(!localWorker){
   localWorker=new Worker('local-worker.mjs',{type:'module'});
   localWorker.onmessage=event=>{const data=event.data;if(data.type==='progress'){$('localStatus').textContent=data.text;return;}const job=localJobs.get(data.id);if(!job)return;clearTimeout(job.timer);localJobs.delete(data.id);if(data.type==='error')job.reject(Error(data.text));else job.resolve(data);};
   localWorker.onerror=()=>{localReady=false;for(const job of localJobs.values()){clearTimeout(job.timer);job.reject(Error('Local recognition is unavailable. Try Chrome with Wi-Fi.'));}localJobs.clear();localWorker.terminate();localWorker=null;};
  }
  const id=crypto.randomUUID(),timer=setTimeout(()=>{const job=localJobs.get(id);if(job){localJobs.delete(id);job.reject(Error('The local model is taking too long. Retry with Wi-Fi.'));}if(localWorker){localWorker.terminate();localWorker=null;localReady=false;for(const other of localJobs.values()){clearTimeout(other.timer);other.reject(Error('Local recognition stopped. Please try again.'));}localJobs.clear();}},240000);
  localJobs.set(id,{resolve,reject,timer});localWorker.postMessage({type,id,image});
 });
}
async function enableLocal(){
 if(localReady)return true;
 $('enableLocal').disabled=true;$('localStatus').textContent='Loading recognition on this device…';
 try{await localRequest('load');localReady=true;$('localStatus').textContent='Local recognition ready. Clothing images stay on your device.';$('enableLocal').textContent='Local recognition ready';return true;}
 catch(error){message(error.message);$('localStatus').textContent=error.message;return false;}
 finally{$('enableLocal').disabled=false;}
}
function applyLocalChoice(item,choice,overwrite=false){
 if(choice.category==='Uncategorized')return;
 if(overwrite||item.category==='Uncategorized')item.category=choice.category;
 if(item.category===choice.category){if(overwrite||!item.itemType||item.itemType==='Unknown')item.itemType=choice.itemType;if(overwrite||!item.sleeveLength||item.sleeveLength==='Unknown')item.sleeveLength=choice.sleeveLength;}
 if(!item.name?.trim())item.name=choice.label.replace(/^a |^an /,'').replace(/^./,c=>c.toUpperCase());
 Object.assign(item,normalizeClothing(item));item.localStatus='Local suggestion applied. Confirm the category, sleeves, and seasons before saving.';
}
async function recognizeItem(item){
 if(localPending.has(item.id)||!batch.some(x=>x.id===item.id))return;
 localPending.add(item.id);item.localStatus='Recognizing this image on your device…';render();
 try{
  if(!localReady&&!await enableLocal())throw Error('Local recognition did not load. Manual categories are available.');
  const result=await localRequest('classify',item.image);if(!batch.some(x=>x.id===item.id))return;
  item.localChoices=result.choices;item.localStatus=result.choices[0]?.category==='Uncategorized'?'No clear clothing item found. Choose a category or capture a clearer view.':'Possible matches below. These are suggestions, not confirmed identifications.';
  if(result.strong)applyLocalChoice(item,result.choices[0]);
  item.localAnalyzed=true;return true;
 }catch(error){item.localStatus=error.message;message(error.message);return false;}
 finally{localPending.delete(item.id);persistDraft();render();}
}
async function recognizeBatch(){
 if(localBatch)return;localBatch=true;$('recognizeBatch').disabled=true;
 try{if(!localReady&&!await enableLocal())return;
 const pending=batch.filter(x=>!x.localAnalyzed);let count=0;for(const item of pending){if(!batch.some(x=>x.id===item.id))continue;$('localStatus').textContent=`Recognizing image ${++count} of ${pending.length} on your device…`;if(!await recognizeItem(item))break;}
 $('localStatus').textContent='Review the local suggestions before saving each piece.';
 }finally{localBatch=false;$('recognizeBatch').disabled=false;}
}
$('enableLocal').onclick=enableLocal;$('recognizeBatch').onclick=recognizeBatch;

async function importClothingPhotos(files){
 if(busy||!files.length)return;
 if(files.length>20)return message('Choose up to 20 clothing photos per batch.');
 stopCamera();busy=true;controls(true);session=0;
 try{
  const result=await readPhotoBatch(files,photoToJPEG,image=>candidate(image));
  if(result.added){switchView('review');message(`${result.added} clothing photos added. Each image has its own category, sleeves, seasons, and other fields.${result.errors.length?' '+result.errors.join('; '):''}`);if(localReady&&$('autoLocal').checked)recognizeBatch();}
  else message('No photos could be imported. '+result.errors.join('; '));
 }finally{busy=false;controls(false);}
}
$('clothingPhotos').onchange=event=>{const files=Array.from(event.target.files);event.target.value='';importClothingPhotos(files);};
