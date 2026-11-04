/**
 * MULTI-GARMENT-CAPTURE-01 — actual native Add Clothes panel, research gated.
 * No detected garment enters the wardrobe until a user confirms each category,
 * subtype and color and one owner-bound IDB transaction commits the selection.
 */
import {atomicSaveGarments24,validCrop24,pieceKey24,duplicatePieceKeys24} from './atomic-group.mjs';
import {organizeReview28,reviewTier28} from './review-triage-28.mjs';
import {detectFlatlayFromImage29} from './flatlay-contrast-29.mjs';
import {sceneReviewDefaults32,canConfirmScene32} from './scene-class-guard-32.mjs';
import {snapshotConfirmations34,saveReceipt34} from './review-save-finality-34.mjs';
const TYPES=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
const palette=['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor'];
const $=(root,id)=>root.getElementById(id);
const el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;if(cls)n.className=cls;return n;};
const button=(txt,run,cls='secondary')=>{const n=el('button',txt,cls);n.type='button';n.onclick=run;return n;};
function ensureImage(data){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=data;});}
function jpegCrop(image,rect){
 const width=image.naturalWidth,height=image.naturalHeight;
 const c=document.createElement('canvas'),sx=Math.max(0,Math.floor(rect.x*width)),sy=Math.max(0,Math.floor(rect.y*height));
 const sw=Math.max(1,Math.min(width-sx,Math.ceil(rect.width*width))),sh=Math.max(1,Math.min(height-sy,Math.ceil(rect.height*height)));
 c.width=sw;c.height=sh;c.getContext('2d').drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
 return c.toDataURL('image/jpeg',.94);
}
function normalizeRect(rect){
 const x=Math.max(0,Math.min(.974,Number(rect?.x)||0)),y=Math.max(0,Math.min(.974,Number(rect?.y)||0));
 return {x,y,width:Math.min(1-x,Math.max(.026,Number(rect?.width)||1-x)),height:Math.min(1-y,Math.max(.026,Number(rect?.height)||1-y))};
}
function manualKey(b){return 'manual-'+[b.x,b.y,b.width,b.height].map(v=>Math.round(v*1000)).join('-');}
export function mountMultiGarmentCapture24({
 doc=document,getOwner,makeProof,getDb,queued,refreshNative,onSaved,
 recognitionAssetVersion='',schema,active
}){
 if(!active||!getOwner()||!schema?.types)return {active:false};
 const host=$ (doc,'wholeOutfitCapture');
 if(!host)return {active:false};
 const style=el('style');style.textContent=`
 .multi24{margin-top:1rem;display:grid;gap:.85rem;min-width:0}
 .multi24 .multi24-source{max-width:100%;max-height:260px;object-fit:contain;border-radius:9px}
 .multi24 .multi24-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.75rem}
 .multi24 .multi24-card{border:1px solid #d4d8d1;padding:.8rem;border-radius:10px;min-width:0}
 .multi24 .multi28-heading{grid-column:1/-1;font-size:1rem;margin:.3rem 0 0;padding:.5rem;border-top:1px solid #c7c7c7}
 .multi24 .multi24-card[data-review-tier=additional]{border-style:dashed}
 .multi24 .multi24-card[data-review-tier=manual]{border-style:double}
 .multi24 .multi24-card img{display:block;max-width:100%;width:100%;height:150px;object-fit:contain}
 .multi24 label{display:grid;gap:.25rem;margin:.4rem 0;min-width:0}
 .multi24 input:not([type=checkbox]),.multi24 select{width:100%;max-width:100%;min-height:44px}
 .multi24 button{min-height:48px;margin:.15rem;white-space:normal}
 .multi24 .multi24-actions{display:flex;flex-wrap:wrap;gap:.35rem}
 .multi24 .multi24-status{overflow-wrap:anywhere}
 @media(max-width:350px){.multi24 .multi24-actions button{flex:1 1 100%}}
 `;
 const root=el('section',null,'multi24');root.id='multi24Research';
 root.append(el('h3','Review pieces together'),el('p','Original unchanged. Confirm each visible piece before adding it. Unseen backs, overlapping fabric and 3D fit are not inferred.','fine'));
 const original=el('img',null,'multi24-source');original.alt='Exact original multi-garment JPEG';original.hidden=true;root.append(original);
 const status=el('p','Choose a photo to separate visible garments.','multi24-status');status.id='multi24Status';status.setAttribute('role','status');root.append(status);
 const grid=el('div',null,'multi24-grid');grid.id='multi24Grid';
 const actions=el('div',null,'multi24-actions');
 let state=null,canceled=false,job=null,renderVersion=0,submitting=false;
 const cancel=button('Cancel extraction',()=>{
  if(submitting){status.textContent='Saving is in progress. Cancellation is unavailable once saving begins.';return;}
  reset('Unfinished extraction canceled; nothing was saved.');
 });
 const add=button('Add missed piece',()=>{if(!state||submitting)return;const crop={x:0,y:0,width:1,height:1};state.pieces.push({id:crypto.randomUUID(),instanceKey:manualKey(crop),cropBounds:crop,image:state.proof.image,manual:true,cropReviewed:false,category:'Uncategorized',itemType:'Unknown',color:'',confirmed:false,maskApplied:false,hint:null});redraw();});
 const suggest=button('Suggest missed regions on a plain backdrop',()=>suggestFlatlay());
 const save=button('Save confirmed pieces together',()=>commit(),'primary');
 actions.append(add,suggest,save,cancel);
 root.append(actions,grid);
 host.append(style,root);
 function sameOwner(){return !!state&&getOwner()===state.owner&&getDb()?.name==='closet-current-user-'+state.owner;}
 // REVIEW-SOURCE-EPOCH-34: owner equality alone is not enough: the same
 // owner may choose another source while a prior proof/editor/save is pending.
 // revoke() changes this epoch on every reset, cancel or source replacement.
 function currentReview(view,epoch){
  return !canceled&&renderVersion===epoch&&state===view&&sameOwner();
 }
 function currentLoading(epoch,owner){
  return !canceled&&renderVersion===epoch&&getOwner()===owner&&
   getDb()?.name==='closet-current-user-'+owner;
 }
 function revoke(){canceled=true;renderVersion++;job?.worker?.terminate();if(job)clearTimeout(job.timeout);job=null;state=null;original.removeAttribute('src');original.hidden=true;grid.replaceChildren();save.disabled=true;add.disabled=true;suggest.disabled=true;cancel.disabled=false;}
 function reset(text){revoke();status.textContent=text||'No unconfirmed photos were saved.';}
 async function crop(piece){
  if(submitting)return;
  if(!sameOwner()){reset('Account changed; extraction canceled.');return;}
  const view=state,epoch=renderVersion;
  if(!view.pieces.includes(piece))return;
  try{
   await window.openPhotoCrop({...piece,originalPhoto:view.proof.originalPhoto},{
    analyze:async()=>null,
    save:async photo=>{
     if(submitting)throw Error('A garment save is already in progress');
     if(!currentReview(view,epoch)||!view.pieces.includes(piece))
      throw Error('Source changed; stale crop cannot affect the current photograph');
     if(!validCrop24(photo.cropBounds))throw Error('Invalid crop');
     piece.image=photo.image;piece.cropBounds={...photo.cropBounds};piece.maskApplied=!!photo.maskApplied;
     piece.cropReviewed=true;if(piece.manual)piece.instanceKey=manualKey(piece.cropBounds);
     piece.confirmed=false;redraw();
    }
   });
  }catch{
   if(currentReview(view,epoch))
    status.textContent='Crop editor unavailable. The original photograph was not changed.';
  }
 }
 function input(label,value,change){const wrap=el('label',label),box=el('input');box.type='text';box.value=value||'';box.maxLength=120;box.oninput=()=>{if(!submitting)change(box.value);};wrap.append(box);return wrap;}
 function selector(label,options,value,change){const wrap=el('label',label),sel=el('select');for(const v of options){const option=el('option',v);option.value=v;sel.append(option);}sel.value=options.includes(value)?value:options[0];sel.disabled=submitting;sel.onchange=()=>{if(!submitting)change(sel.value);};wrap.append(sel);return wrap;}
 function redraw(){
  if(!state)return;grid.replaceChildren();
  original.hidden=false;add.disabled=submitting;suggest.disabled=submitting;cancel.disabled=submitting;
  const review=organizeReview28(state.pieces);
  root.dataset.priorityCount=String(review.priority.length);
  root.dataset.additionalCount=String(review.additional.length);
  root.dataset.manualCount=String(review.manual.length);
  let previousTier='';
  for(const [i,p]of review.ordered.entries()){
   const tier=reviewTier28(p);
   if(tier!==previousTier){
    const heading=el('h4',
     tier==='priority'?'Start review here · stronger location signal — still unverified':
     tier==='manual'?'Your marked regions · confirm the exact crop':
     'Other unverified regions · inspect closely or remove','multi28-heading');
    heading.dataset.reviewTier=tier;
    grid.append(heading);previousTier=tier;
   }
   const card=el('article',null,'multi24-card');card.dataset.pieceKey=p.instanceKey;
   card.dataset.reviewTier=tier;
   const image=el('img');image.src=p.image;image.alt='Visible garment '+(i+1)+' derived from unchanged source';
   const caption=el('p',(p.flatlay29?'Contrast-only suggestion — adjust crop; no clothing identity inferred':p.manual?'Manually marked':'Detected')+' piece '+(i+1)+(p.hint?.clipped?' · edge cut off':'')+(Number.isFinite(p.hint?.confidence)?' · model mask score '+Math.round(100*p.hint.confidence)+'/100 (uncalibrated)':'')+(p.sceneReviewReason==='no-person-evidence'?' · No person was verified; choose category and color yourself':
     p.sceneReviewReason&&p.sceneReviewReason!=='model-suggestion-requires-human-confirmation'?' · Model class needs manual review':'')+
    ' · requires review; not automatically confirmed','fine');
   card.append(image,caption);
   card.append(selector('Main category',['Uncategorized',...TYPES],p.category,v=>{p.category=v;p.itemType='Unknown';p.confirmed=false;redraw();}));
   card.append(selector('Specific type',['Unknown',...(schema.types[p.category]||[])],p.itemType,v=>{p.itemType=v;p.confirmed=false;redraw();}));
   let confirmBox;
   const colorLabel=input('Color (confirm visually)',p.color,v=>{
    p.color=v.trim();p.confirmed=false;save.disabled=true;
    if(confirmBox){confirmBox.checked=false;confirmBox.disabled=!canConfirmScene32(p,schema);}
   });
   const colorInput=colorLabel.querySelector('input');colorInput.setAttribute('list','multi24Colors');
   colorInput.disabled=submitting;
   const list=el('datalist');list.id='multi24Colors'+i;colorInput.setAttribute('list',list.id);
   for(const value of palette){const opt=el('option');opt.value=value;list.append(opt);}
   card.append(colorLabel,list);
   const confirmLabel=el('label');confirmBox=el('input');confirmBox.type='checkbox';
   confirmBox.disabled=submitting||!canConfirmScene32(p,schema);confirmBox.checked=!!p.confirmed&&canConfirmScene32(p,schema);
   confirmBox.onchange=()=>{if(submitting)return;
    p.confirmed=confirmBox.checked&&canConfirmScene32(p,schema);
    save.disabled=!state.pieces.some(x=>x.confirmed);};
   confirmLabel.append(confirmBox,doc.createTextNode('I confirm this visible garment, category and color'));card.append(confirmLabel);
   const controls=el('div',null,'multi24-actions'),edit=button('Adjust crop/mask',()=>crop(p));
   const remove=button('Remove detection',()=>{if(submitting||!state||!state.pieces.includes(p))return;state.pieces.splice(state.pieces.indexOf(p),1);redraw();});
   edit.disabled=submitting;remove.disabled=submitting;
   controls.append(edit,remove);card.append(controls);
   if(submitting)for(const control of card.querySelectorAll('button,input,select'))control.disabled=true;
   grid.append(card);
  }
  save.disabled=!state.pieces.some(p=>p.confirmed)||submitting;
 }
 function suggestFlatlay(){
  if(submitting)return;
  if(!state||!sameOwner())return reset('Account changed. No regions or photos saved.');
  const owner=state.owner,source=state.proof.sourceSHA256;
  const suggestion=detectFlatlayFromImage29(state.decoded);
  if(!state||!sameOwner()||state.owner!==owner||state.proof.sourceSHA256!==source)
   return reset('Account changed during background review. Nothing saved.');
  if(!suggestion.eligible){
   status.textContent='No safe uniform backdrop was found. Use Add missed piece and review the crop manually.';
   return;
  }
  let added=0;
  for(const rect of suggestion.boxes){
   const cropBounds=normalizeRect(rect),instanceKey=manualKey(cropBounds);
   // Preserve existing detected and user marked pieces; do not create
   // duplicate same-source proposals on repeated clicks.
   if(state.pieces.some(p=>p.instanceKey===instanceKey))continue;
   const intersects=state.pieces.some(p=>!p.manual&&overlap29(p.cropBounds,cropBounds)>.80);
   if(intersects)continue;
   state.pieces.push({
    id:crypto.randomUUID(),instanceKey,cropBounds,
    image:jpegCrop(state.decoded,cropBounds),flatlay29:true,manual:true,
    cropReviewed:false,category:'Uncategorized',itemType:'Unknown',
    color:'',confirmed:false,maskApplied:false,hint:null
   });added++;
  }
  redraw();
  status.textContent=added+
   ' plain-backdrop region(s) suggested for manual crop review. No type, color or garment accuracy is inferred; nothing was auto-saved.';
 }
 function overlap29(a,b){
  if(!a||!b)return 0;
  const dx=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
  const dy=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  const intersection=dx*dy;
  const denominator=a.width*a.height+b.width*b.height-intersection;
  return denominator>0?intersection/denominator:0;
 }
 async function addDetected(raw,session){
  if(!state||session!==job||!sameOwner())return;
  if(!raw?.instanceKey||!/^seg-[0-9-]+$/.test(raw.instanceKey)||!validCrop24(raw.cropBounds)||
    !Array.isArray(raw.hint?.categories)||!raw.hint.categories.some(x=>TYPES.includes(x)))return;
  if(state.pieces.some(x=>x.instanceKey===raw.instanceKey))return;
  const sourceImage=state.decoded,box=normalizeRect(raw.cropBounds);
  // A real model score is not proof of garment type; without affirmative
  // person evidence, never prefill the category or color (PR #588 failures).
  const defaults=sceneReviewDefaults32(raw),category=defaults.category;
  state.pieces.push({
   id:crypto.randomUUID(),instanceKey:raw.instanceKey,cropBounds:box,
   image:jpegCrop(sourceImage,box),manual:false,cropReviewed:true,
   category,itemType:'Unknown',color:defaults.color,confirmed:false,
   sceneReviewReason:defaults.reason,hint:{...raw.hint},maskApplied:false
  });redraw();
 }
 async function startFile(file){
  if(submitting){status.textContent='Finish the current save first.';return;}
  revoke();canceled=false;
  const owner=getOwner(),epoch=renderVersion;
  if(!owner){status.textContent='Sign in before extracting garments.';return;}
  if(!file||file.size>10*1024*1024){status.textContent='Choose a photo no larger than 10 MB.';return;}
  status.textContent='Verifying full-resolution original JPEG…';
  try{
   const proof=await makeProof(file,owner);
   if(!currentLoading(epoch,owner))return;
   const decoded=await ensureImage(proof.image);
   if(!currentLoading(epoch,owner))return;
   state={owner,proof,decoded,pieces:[]};original.src=proof.image;original.hidden=false;redraw();
   let inference=proof.image;
   if(Math.max(decoded.naturalWidth,decoded.naturalHeight)>3072){
    const scale=3072/Math.max(decoded.naturalWidth,decoded.naturalHeight);
    const c=el('canvas');c.width=Math.round(decoded.naturalWidth*scale);c.height=Math.round(decoded.naturalHeight*scale);
    c.getContext('2d').drawImage(decoded,0,0,c.width,c.height);inference=c.toDataURL('image/jpeg',.9);
   }
   if(!currentLoading(epoch,owner))return;
   const next={id:crypto.randomUUID(),worker:null,pending:[],timeout:null};job=next;
   next.timeout=setTimeout(()=>{if(job===next){next.worker?.terminate();job=null;status.textContent='Local segmentation timed out. You can mark pieces manually; nothing was auto-saved.';}},300000);
   next.worker=new Worker('outfit-worker.mjs'+(recognitionAssetVersion?'?v='+recognitionAssetVersion:''),{type:'module'});
   next.worker.onmessage=event=>{
    if(job!==next||!sameOwner())return;
    const data=event.data;if(data?.id!==next.id)return;
    if(data.type==='piece')next.pending.push(addDetected(data.piece,next));
    if(data.type==='progress')status.textContent=data.phase==='separating'?'Locating visible garment regions locally…':'Preparing local segmentation model…';
    if(data.type==='done'||data.type==='error'){
     Promise.all(next.pending).finally(()=>{
      if(job!==next)return;
      clearTimeout(next.timeout);next.worker.terminate();job=null;
      status.textContent=data.type==='error'?'Automatic extraction unavailable. Add and crop pieces manually; no items saved.':
       state.pieces.length+' unverified region'+(state.pieces.length===1?'':'s')+' found. Stronger suggestions appear first, other regions remain below. Confirm each or Add missed piece.';
     });
    }
   };
   next.worker.onerror=()=>{if(job!==next)return;clearTimeout(next.timeout);next.worker.terminate();job=null;status.textContent='Local detection unavailable. Manually add and crop pieces; nothing saved.';};
   next.worker.postMessage({id:next.id,image:inference,multi24:true});
  }catch(error){
   // A stale proof/decode must never clear a more recently selected source.
   if(currentLoading(epoch,owner))reset('Could not verify photo: '+String(error.message||error));
  }
 }
 async function commit(){
  if(submitting)return;
  if(!state||!sameOwner())return reset('Account changed. No garments saved.');
  const view=state,epoch=renderVersion,owner=view.owner,proof=view.proof;
  const selected=state.pieces.filter(x=>x.confirmed);
  if(!selected.length)return status.textContent='Select at least one reviewed garment.';
  let references,snapshots;
  try{
   ({references,snapshots}=snapshotConfirmations34(state.pieces,schema));
   // Preserve original explicit human-confirmation and manual crop-review guard.
   if(snapshots.some(x=>!canConfirmScene32(x,schema)||(x.manual&&!x.cropReviewed)||
       !validCrop24(x.cropBounds)))
    throw Error('An unreviewed or invalid garment cannot be saved.');
  }catch(error){status.textContent=String(error.message||error);return;}
  // An immutable photo + confirmed-pieces snapshot is captured before any
  // asynchronous IndexedDB read, queued work or crop editor callback.
  submitting=true;redraw();
  status.textContent='Verifying original SHA-256 and saving your confirmed snapshot…';
  let persisted=false;
  try{
   const db=getDb();
   const existing=await new Promise((resolve,reject)=>{
    const r=db.transaction('items').objectStore('items').getAll();
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   if(!currentReview(view,epoch))return;
   const duplicates=duplicatePieceKeys24(existing,
    snapshots.map(x=>({sourcePieceKey:pieceKey24(proof.sourceSHA256,x.instanceKey)})));
   if(duplicates.length)throw Error('Previously saved garment detected in this exact source. Deselect duplicate pieces.');
   if(!currentReview(view,epoch))return;
   const rows=await queued(()=>atomicSaveGarments24({
    db,proof,pieces:snapshots,ownerId:owner,
    currentOwner:()=>currentReview(view,epoch)?getOwner():null
   }));
   persisted=true;
   if(!currentReview(view,epoch))return;
   // The IndexedDB transaction has already completed. Do not keep saved
   // pieces in a retryable list if downstream refresh/notification fails.
   const savedIds=new Set(references.map(x=>x.id));
   view.pieces=view.pieces.filter(x=>!savedIds.has(x.id));
   let notificationFailed=false,refreshFailed=false;
   try{await onSaved(rows);}catch{notificationFailed=true;}
   if(!currentReview(view,epoch))return;
   try{await refreshNative();}catch{refreshFailed=true;}
   if(!currentReview(view,epoch))return;
   status.textContent=saveReceipt34(rows.length,notificationFailed,refreshFailed);
  }catch(error){
   if(currentReview(view,epoch))status.textContent=persisted?
    'Garments were saved privately, but the wardrobe display could not refresh. Reload My Closet to verify.':
    'Save rejected before confirmed commit. '+String(error.message||error);
  }finally{
   submitting=false;
   if(currentReview(view,epoch))redraw();
   else cancel.disabled=false;
  }
 }
 const handle=event=>{const file=event.target.files?.[0];event.target.value='';if(file)startFile(file);};
 for(const id of ['outfitCamera','outfitUpload'])$(doc,id).onchange=handle;
 window.addEventListener('closet:alpha-session-changed',()=>reset('Session changed; unconfirmed clothes cleared.'));
 window.addEventListener('closet:session-locked',()=>reset('Authenticated account session ended; unconfirmed photo and crops cleared.'));
 window.addEventListener('pagehide',()=>revoke());
 save.disabled=true;add.disabled=true;suggest.disabled=true;
 return {active:true,startFile,reset,debug:()=>({owner:state?.owner,sourceSHA256:state?.proof?.sourceSHA256,pieces:state?.pieces.map(x=>({id:x.id,instanceKey:x.instanceKey,category:x.category,color:x.color,confirmed:x.confirmed}))||[],working:!!job})};
}
