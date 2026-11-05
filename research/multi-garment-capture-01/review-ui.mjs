/**
 * MULTI-GARMENT-CAPTURE-01 — actual native Add Clothes panel, research gated.
 * No detected garment enters the wardrobe until a user confirms each category,
 * subtype and color and one owner-bound IDB transaction commits the selection.
 */
import {atomicSaveGarments24,validCrop24,pieceKey24,duplicatePieceKeys24} from './atomic-group.mjs';
import {organizeReview28,reviewTier28} from './review-triage-28.mjs';
import {detectFlatlayFromImage29} from './flatlay-contrast-29.mjs';
import {sceneReviewDefaults32,canConfirmScene32} from './scene-class-guard-32.mjs';
import {intakeProposal58,MAX_TOTAL_REGIONS58} from './detection-intake-58.mjs';
import {snapshotConfirmations34,saveReceipt34} from './review-save-finality-34.mjs';
import {shouldAskBeforePhotoSwitch68,DISCARD_PROMPT68} from '../photo-switch-guard-68/source-discard-guard.mjs';
import {validReplacementFile70,sourcePreflightStillCurrent70} from '../verified-photo-switch-70/source-preflight.mjs';
import {keepHumanReviewOnSameSource72} from '../same-original-photo-review-72/repeat-source-guard.mjs';
import {needsCancelReviewConsent74,CANCEL_REVIEW_PROMPT74} from '../cancel-reviewed-capture-74/cancel-review-guard.mjs';
import {needsRemoveReviewConsent76,REMOVE_REVIEW_PROMPT76} from '../remove-reviewed-garment-76/remove-review-guard.mjs';
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
// COLOR46: Reviewed JPEG crop pixels, 48x48 (as in Work31's paired research).
// These are NOT a validated garment mask: visible background may dominate.
// Never write a suggested color into a user's confirmed field automatically.
async function reviewedPixelPalette46(piece){
 try{
  if(!window.PhotoColor?.maskedPalette||!piece?.image)return null;
  const image=await ensureImage(piece.image);
  if(image.naturalWidth<8||image.naturalHeight<8)return null;
  const c=document.createElement('canvas');c.width=48;c.height=48;
  const ctx=c.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  ctx.drawImage(image,0,0,48,48);
  return window.PhotoColor.maskedPalette(ctx.getImageData(0,0,48,48).data,48,48);
 }catch{return null;}
}
function normalizeRect(rect){
 const x=Math.max(0,Math.min(.974,Number(rect?.x)||0)),y=Math.max(0,Math.min(.974,Number(rect?.y)||0));
 return {x,y,width:Math.min(1-x,Math.max(.026,Number(rect?.width)||1-x)),height:Math.min(1-y,Math.max(.026,Number(rect?.height)||1-y))};
}
function manualKey(b){return 'manual-'+[b.x,b.y,b.width,b.height].map(v=>Math.round(v*1000)).join('-');}
export function mountMultiGarmentCapture24({
 doc=document,getOwner,makeProof,getDb,queued,refreshNative,onSaved,
 recognitionAssetVersion='',schema,active,recognitionReview42=false
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
 let state=null,canceled=false,job=null,renderVersion=0,selectionEpoch70=0,submitting=false;
 const cancel=button('Cancel extraction',()=>{
  if(submitting){status.textContent='Saving is in progress. Cancellation is unavailable once saving begins.';return;}
  // CANCEL74: an accidental touch must not destroy user-reviewed crops.
  // Mandatory auth/logout/session-lock/pagehide cleanup remains prompt-free.
  if(state&&!sameOwner()){reset('Account changed; unconfirmed photos cleared.');return;}
  if(needsCancelReviewConsent74({
   currentOwner:getOwner(),reviewOwner:state?.owner,dbName:getDb()?.name,
   pieces:state?.pieces,submitting
  })){
   const approved=typeof window.confirm==='function'&&window.confirm(CANCEL_REVIEW_PROMPT74);
   if(!approved){
    if(state&&!sameOwner())reset('Account changed; unconfirmed photos cleared.');
    else status.textContent='Extraction cancellation dismissed. Your original photograph and reviewed clothing are still available; nothing was saved.';
    return;
   }
  }
  // An owner or session switch while a native confirm is visible cannot
  // cause old private photos to be kept or transferred to another account.
  if(state&&!sameOwner()){reset('Account changed; unconfirmed photos cleared.');return;}
  reset('Unfinished extraction canceled; nothing was saved.');
 });
 const add=button('Add missed piece',()=>{if(!state||submitting)return;
  if(state.pieces.length>=MAX_TOTAL_REGIONS58){status.textContent='Review limit of 24 regions reached. Remove an incorrect region before adding another.';return;}
  const crop={x:0,y:0,width:1,height:1};state.pieces.push({id:crypto.randomUUID(),instanceKey:manualKey(crop),cropBounds:crop,image:state.proof.image,manual:true,cropReviewed:false,category:'Uncategorized',itemType:'Unknown',color:'',confirmed:false,maskApplied:false,hint:null});redraw();});
 const suggest=button('Suggest missed regions on a plain backdrop',()=>suggestFlatlay());
 // DETECTOR65: retain the same original photo while ending an unreliable
 // local model; manual crops and earlier human decisions remain accessible.
 const stop=button('Stop AI; keep manual review',()=>{
  if(submitting||!job)return;
  detectorFallback65(job,'Automatic detection stopped by you.');
 });
 const save=button('Save confirmed pieces together',()=>commit(),'primary');
 actions.append(add,suggest,stop,save,cancel);
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
 let classification42;
 function cancelClassification42(){classification42?.controller.abort();classification42=null;}
 function revoke(){cancelClassification42();canceled=true;renderVersion++;selectionEpoch70++;job?.worker?.terminate();if(job)clearTimeout(job.timeout);job=null;state=null;original.removeAttribute('src');original.hidden=true;grid.replaceChildren();save.disabled=true;add.disabled=true;suggest.disabled=true;stop.disabled=true;cancel.disabled=false;}
 function reset(text){revoke();status.textContent=text||'No unconfirmed photos were saved.';}
 // WORKER-FINALITY-38: a confirmed Save is a one-way review boundary.
 // Terminate the detector and revoke its session identity BEFORE first async
 // IDB read. Previously visible unsaved suggestions stay available for review.
 function freezeDetector38(){
  if(!job)return false;
  const running=job;job=null;
  clearTimeout(running.timeout);
  running.worker?.terminate();
  return true;
 }
 // Keep verified original, already reviewed crops and actual owner session.
 // Every stale worker packet is rejected once job identity is revoked.
 function detectorFallback65(session,reason){
  if(!state||job!==session||submitting)return false;
  if(!sameOwner()){reset('Account changed; extraction canceled.');return false;}
  session.terminal=true;
  freezeDetector38();
  redraw();
  status.textContent=reason+' The verified original photo and '+state.pieces.length+
   ' unverified review region(s) remain. Add missed piece, adjust crop, and choose category, subtype and color manually. Nothing was automatically saved.';
  return true;
 }
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
     if(classification42?.piece===piece)cancelClassification42();
     delete piece.recognitionSuggestion42;
     delete piece.recognitionStatus42;
     piece.image=photo.image;piece.cropBounds={...photo.cropBounds};piece.maskApplied=!!photo.maskApplied;
     piece.maskedColorEstimate=photo.maskApplied?photo.maskedColorEstimate:null;
     // LABEL59 old detector pixel evidence is not valid for an adjusted crop.
     piece.modelColorHint59='';
     piece.modelHintStale59=true;
     piece.cropReviewed=true;if(piece.manual)piece.instanceKey=manualKey(piece.cropBounds);
     piece.confirmed=false;redraw();
    }
   });
  }catch{
   if(currentReview(view,epoch))
    status.textContent='Crop editor unavailable. The original photograph was not changed.';
  }
 }
 async function classifyReviewed42(piece){
  if(submitting||!sameOwner()||!piece.cropReviewed||!state.pieces.includes(piece))return;
  const view=state,epoch=renderVersion;
  if(classification42){
   delete classification42.piece.recognitionStatus42;
   cancelClassification42();
  }
  const request={piece,controller:new AbortController()};
  classification42=request;
  const valid=()=>classification42===request&&!submitting&&currentReview(view,epoch)&&view.pieces.includes(piece);
  piece.recognitionStatus42='Checking the original and reviewed crop locally…';
  redraw();
  try{
   const {recognizeReviewedCrop42,boundedCropColor46,bindInputs49}=await import('./recognition-review-42.mjs');
   if(!valid())return;
   // INPUT49: bind exact crop bytes before the worker starts; detected-piece
   // instance keys can remain unchanged even when an image is re-cropped.
   const cropAtInference=piece.image;
   const binding49=await bindInputs49({
    sourceSHA256:view.proof.sourceSHA256,cropImage:cropAtInference,
    requestedAssetVersion:recognitionAssetVersion
   });
   if(!valid()||piece.image!==cropAtInference)return;
   const result=await recognizeReviewedCrop42({original:view.proof.image,crop:cropAtInference,
    signal:request.controller.signal,version:recognitionAssetVersion,schema,palette,categories:TYPES});
   if(!valid()||piece.image!==cropAtInference)return;
   result.inputBinding49=binding49;
   const pixels=await reviewedPixelPalette46(piece);
   if(!valid())return;
   const reviewedColor=boundedCropColor46(pixels,palette);
   if(reviewedColor)result.colorReview46=reviewedColor;
   // Category and subtype come only from the local FashionCLIP result.
   // Pixel colors remain unverified and are never copied to human inputs.
   if(!result.color&&reviewedColor){
    result.color=reviewedColor.primary;
    result.colorSource='reviewed-crop-pixel-estimate';
   }
   if(!result.color&&typeof window.checkPhoto==='function'){
    const estimate=piece.maskApplied?piece.maskedColorEstimate:
     (await window.checkPhoto(piece.image).catch(()=>null))?.colorEstimate;
    if(!valid())return;
    if(palette.includes(estimate?.color)){
     result.color=estimate.color;
     result.colorSource=piece.maskApplied?'mask-pixel-estimate':'crop-pixel-estimate';
    }
   }
   piece.recognitionSuggestion42=result;
   delete piece.recognitionStatus42;
  }catch{
   if(!valid())return;
   piece.recognitionStatus42='Local recognition unavailable. Enter the garment details manually.';
  }finally{
   if(valid()){classification42=null;redraw();}
  }
 }
 function input(label,value,change){const wrap=el('label',label),box=el('input');box.type='text';box.value=value||'';box.maxLength=120;box.oninput=()=>{if(!submitting)change(box.value);};wrap.append(box);return wrap;}
 function selector(label,options,value,change){const wrap=el('label',label),sel=el('select');for(const v of options){const option=el('option',v);option.value=v;sel.append(option);}sel.value=options.includes(value)?value:options[0];sel.disabled=submitting;sel.onchange=()=>{if(!submitting)change(sel.value);};wrap.append(sel);return wrap;}
 function redraw(){
  if(!state)return;grid.replaceChildren();
  original.hidden=false;
  add.disabled=submitting||state.pieces.length>=MAX_TOTAL_REGIONS58;
  suggest.disabled=submitting||state.pieces.length>=MAX_TOTAL_REGIONS58;
  stop.disabled=submitting||!job;
  cancel.disabled=submitting;
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
   card.dataset.cropReviewed55=p.cropReviewed===true?'confirmed':'unreviewed';
   card.dataset.reviewTier=tier;
   const image=el('img');image.src=p.image;image.alt='Visible garment '+(i+1)+' derived from unchanged source';
   const caption=el('p',(p.flatlay29?'Contrast-only suggestion — adjust crop; no clothing identity inferred':p.manual?'Manually marked':'Detected')+' piece '+(i+1)+(p.hint?.clipped?' · edge cut off':'')+(Number.isFinite(p.hint?.confidence)?' · model mask score '+Math.round(100*p.hint.confidence)+'/100 (uncalibrated)':'')+(p.sceneReviewReason==='no-person-evidence'?' · No person was verified; choose category and color yourself':
     p.sceneReviewReason&&p.sceneReviewReason!=='model-suggestion-requires-human-confirmation'?' · Model class needs manual review':'')+
    ' · requires review; not automatically confirmed','fine');
   card.append(image,caption);
   if(!p.manual&&!p.modelHintStale59&&Array.isArray(p.hint?.categories)&&p.hint.categories.length){
    const suggestedFamily=p.hint.categories.join(' / ');
    const suggestedColor=p.modelColorHint59?' · possible color '+p.modelColorHint59:'';
    const note=el('p','Unverified detector hint: '+suggestedFamily+suggestedColor+
     '. These are not confirmed. Select the correct category, type and color yourself.','fine');
    note.dataset.modelHint59='unverified';card.append(note);
   }
   if(p.cropReviewed!==true){
    const cropWarning=el('p','Unverified detection: inspect the original and use Adjust crop/mask before you can confirm or save this garment. Model confidence is not garment accuracy.','fine');
    cropWarning.dataset.cropReview55='required';cropWarning.setAttribute('role','status');
    card.append(cropWarning);
   }
   if(recognitionReview42&&p.cropReviewed){
    const result=p.recognitionSuggestion42;
    const review=el('p',p.recognitionStatus42||(result?
     'AI crop suggestion · '+[result.category||'Category uncertain',result.itemType||'Type uncertain',
      result.color?(result.color+(result.colorSource==='recognition'?'':' (pixel estimate)')):'Color uncertain'].join(' · ')+' · Confirm visually.':'Run local AI on this reviewed crop.'),'fine');
    review.dataset.recognition42=p.recognitionStatus42?.startsWith('Local recognition unavailable')?'error':result?'result':'status';
    review.setAttribute('role','status');
    const colorEvidence=result?.colorReview46;
    const preview=colorEvidence?el('p','Reviewed crop pixel color (unverified; background may affect it): '+
     colorEvidence.primary+(colorEvidence.secondary?' / '+colorEvidence.secondary:'')+
     ' · Check the original and confirm color yourself.','fine'):null;
    if(preview)preview.dataset.colorReview46='unverified';
    // SUBTYPE47: show conflicting candidate types but NEVER preselect either.
    // An AI "strong" tag is not a calibrated probability or human verification.
    const subtypeRisk=result?.subtypeReview47;
    const risk= subtypeRisk?.needsConfirmation===true?
     el('p','Subtype needs manual comparison: '+subtypeRisk.candidate+
      ' or '+subtypeRisk.alternative+
      '. The model has previously confused these types. Choose the correct one yourself.','fine'):null;
    if(risk)risk.dataset.subtypeReview47='manual-required';
    const classify=button('Suggest category, type and color',()=>classifyReviewed42(p));
    classify.disabled=classification42?.piece===p;
    card.append(review);
    if(preview)card.append(preview);
    if(risk)card.append(risk);
    card.append(classify);
   }
   card.append(selector('Main category',['Uncategorized',...TYPES],p.category,v=>{p.category=v;p.itemType='Unknown';p.confirmed=false;redraw();}));
   card.append(selector('Specific type',['Unknown',...(schema.types[p.category]||[])],p.itemType,v=>{p.itemType=v;p.confirmed=false;redraw();}));
   let confirmBox;
   const colorLabel=input('Color (confirm visually)',p.color,v=>{
    // COLOR73: editing THIS garment revokes only its confirmation.
    // Other human-confirmed garments must remain eligible for atomic Save;
    // do not redraw the text field or lose the keyboard focus mid-edit.
    p.color=v.trim();p.confirmed=false;
    save.disabled=submitting||!state.pieces.some(x=>x.confirmed);
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
   const remove=button('Remove detection',()=>{
    if(submitting||!state||!state.pieces.includes(p))return;
    // REMOVE76: one mistaken tap must not destroy personally cropped and
    // corrected clothing. Untouched automatic proposals remain one-tap.
    if(!sameOwner()){reset('Account changed; unconfirmed photos cleared.');return;}
    if(needsRemoveReviewConsent76({
     currentOwner:getOwner(),reviewOwner:state.owner,dbName:getDb()?.name,
     piece:p,submitting
    })){
     const approved=typeof window.confirm==='function'&&window.confirm(REMOVE_REVIEW_PROMPT76);
     if(!approved){
      if(!sameOwner())reset('Account changed; unconfirmed photos cleared.');
      else status.textContent='Garment removal canceled. Your reviewed crop and clothing corrections remain unchanged; nothing was saved.';
      return;
     }
    }
    // Never retain or transfer one owner's source after a session change.
    if(!sameOwner()){reset('Account changed; unconfirmed photos cleared.');return;}
    if(!state.pieces.includes(p))return;
    if(classification42?.piece===p)cancelClassification42();
    state.pieces.splice(state.pieces.indexOf(p),1);
    redraw();
    status.textContent='One unsaved review region removed. Other reviewed garments and the original photograph remain unchanged; nothing was saved.';
   });
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
   if(state.pieces.length>=MAX_TOTAL_REGIONS58)break;
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
  if(submitting||!state||session!==job||!sameOwner()||
    state.pieces.length>=MAX_TOTAL_REGIONS58)return;
  // Incoming raw is already minimized by intakeProposal58. Do not retain
  // arbitrary worker metadata or generate unbounded JPEG crops.
  if(state.pieces.some(x=>x.instanceKey===raw.instanceKey))return;
  const sourceImage=state.decoded,box=normalizeRect(raw.cropBounds);
  // A real model score is not proof of garment type; without affirmative
  // person evidence, never prefill the category or color (PR #588 failures).
  const defaults=sceneReviewDefaults32(raw),category=defaults.category;
  state.pieces.push({
   id:crypto.randomUUID(),instanceKey:raw.instanceKey,cropBounds:box,
   image:jpegCrop(sourceImage,box),manual:false,cropReviewed:false,
   category,itemType:'Unknown',color:defaults.color,confirmed:false,
   sceneReviewReason:defaults.reason,hint:raw.hint,
   modelColorHint59:typeof raw.colorEstimate?.color==='string'?raw.colorEstimate.color:'',
   maskApplied:false
  });redraw();
 }
 async function startFile(file){
  if(submitting){status.textContent='Finish the current save first.';return;}
  const owner=getOwner(),epoch=renderVersion;
  if(!owner){reset('Sign in before extracting garments.');return;}
  // RACE71: even an unusable newer file is a selection attempt. Advance
  // the attempt epoch BEFORE the size/type eligibility gate: otherwise a
  // previous valid JPEG still hashing/decoding can finish late, prompt to
  // discard human-reviewed crops, and replace the photo the user kept.
  // This does not revoke the existing original or its reviewed garments.
  const selection=++selectionEpoch70,priorEpoch=epoch;
  // SOURCE70: an empty/oversized file cannot discard existing review.
  // A rejected selection nevertheless supersedes any older in-flight proof.
  if(!validReplacementFile70(file)){
   status.textContent='Selected photo is missing or outside the 128-byte to 10 MB capture limit. Your existing original photo and manually reviewed garments remain unchanged.';
   return;
  }
  // Monotonic epoch and exact owner/review identity prevent an older source
  // from reappearing after another selection, logout or session reset.
  const pending=()=>sourcePreflightStillCurrent70({
    selection,currentSelection:selectionEpoch70,
    reviewEpoch:priorEpoch,currentReviewEpoch:renderVersion,
    owner,currentOwner:getOwner(),dbName:getDb()?.name,submitting
   });
  status.textContent=state?'Verifying replacement JPEG before discarding your current review…':
   'Verifying full-resolution original JPEG…';
  try{
   // TWO-PHASE SOURCE REPLACEMENT: complete SHA proof, image decode and
   // optional bounded inference preview BEFORE changing the current review.
   // An invalid, unsupported or corrupt JPEG cannot discard saved work.
   const proof=await makeProof(file,owner);
   if(!pending())return;
   const decoded=await ensureImage(proof.image);
   if(!pending())return;
   let inference=proof.image;
   if(Math.max(decoded.naturalWidth,decoded.naturalHeight)>3072){
    const scale=3072/Math.max(decoded.naturalWidth,decoded.naturalHeight);
    const c=el('canvas');c.width=Math.round(decoded.naturalWidth*scale);c.height=Math.round(decoded.naturalHeight*scale);
    c.getContext('2d').drawImage(decoded,0,0,c.width,c.height);
    inference=c.toDataURL('image/jpeg',.9);
   }
   if(!pending())return;
   // SOURCE72: repeated selection of the byte-identical verified original
   // is NOT consent to discard active human-reviewed crop/type/color.
   // Exact SHA, owner and human-review evidence must all match. Empty review
   // still permits deliberate reimport to check duplicates or missed items.
   if(keepHumanReviewOnSameSource72({
    currentSHA256:state?.proof?.sourceSHA256,nextSHA256:proof.sourceSHA256,
    currentOwner:owner,reviewOwner:state?.owner,pieces:state?.pieces,
    submitting
   })){
    if(pending())status.textContent='Same verified original photograph selected. Your current reviewed crops, clothing types and colors remain unchanged; nothing was saved.';
    return;
   }
   // Retain SWITCH68's explicit owner choice, but only ask after successful
   // source validation. User cancellation preserves original, review cards,
   // all crop bytes and any previous confirmed category/subtype/color.
   if(shouldAskBeforePhotoSwitch68({
    currentOwner:owner,reviewOwner:state?.owner,pieces:state?.pieces,
    submitting
   })){
    const approved=typeof window.confirm==='function'&&window.confirm(DISCARD_PROMPT68);
    if(!approved){
     if(pending())status.textContent='Photo switch canceled. Your current original photo, crops and confirmed clothing details are still available. No items were saved.';
     return;
    }
   }
   if(!pending())return;
   // Retain the inherited same-owner, same-source-epoch guard for any
   // existing active review. First-photo and after-Cancel imports have no
   // old state, so do not require the previous canceled=false flag.
   if(state){
    if(!currentLoading(epoch,owner))return;
   }
   // The new photo is now verified AND explicitly authorized. This is the
   // sole commit point where the old review is revoked. Previously COMMITTED
   // owner-private wardrobe rows are never touched by a source switch.
   revoke();canceled=false;
   const committedEpoch=renderVersion;
   state={owner,proof,decoded,pieces:[]};
   original.src=proof.image;original.hidden=false;redraw();
   if(!currentLoading(committedEpoch,owner))return;
   const next={id:crypto.randomUUID(),worker:null,pending:[],timeout:null,received:0,ignored:0,terminal:false};job=next;
   // Real 300s model timeout. The standalone browser QA fixture can
   // accelerate this timer only in an isolated test page.
   next.timeout=setTimeout(()=>{if(job===next&&!submitting)detectorFallback65(next,'Local segmentation timed out.');},300000);
   try{
    next.worker=new Worker('outfit-worker.mjs'+(recognitionAssetVersion?'?v='+recognitionAssetVersion:''),{type:'module'});
    next.worker.onmessage=event=>{
     if(job!==next||submitting||!sameOwner())return;
     // A completion/error message is final: no further piece, progress or
     // duplicate completion may modify a human review in this session.
     if(next.terminal)return;
     const data=event.data;if(data?.id!==next.id)return;
     if(data.type==='piece'){
      next.received++;
      const accepted=intakeProposal58(data.piece,state?.pieces||[],next.received);
      if(accepted.accepted)next.pending.push(addDetected(accepted.piece,next));
      else next.ignored++;
     }
     if(data.type==='progress')status.textContent=data.phase==='separating'?'Locating visible garment regions locally…':'Preparing local segmentation model…';
     if(data.type==='done'||data.type==='error'){
      next.terminal=true;
      Promise.all(next.pending).finally(()=>{
       if(job!==next)return;
       const failed=data.type==='error';
       clearTimeout(next.timeout);next.worker.terminate();job=null;
       redraw();
       status.textContent=failed?'Automatic extraction unavailable. Add and crop pieces manually; no items saved.':
        state.pieces.length+' unverified region'+(state.pieces.length===1?'':'s')+' found. '+
         (next.ignored?next.ignored+' extra, duplicate or invalid detector proposals were ignored for mobile reliability. ':'')+
         'Stronger suggestions appear first, other regions remain below. Inspect each crop or Add missed piece.';
      });
     }
    };
    next.worker.onerror=()=>{if(job!==next||submitting)return;detectorFallback65(next,'Local detection worker failed.');};
    next.worker.onmessageerror=()=>detectorFallback65(next,'Local detection returned an unreadable message.');
    // Worker construction and postMessage errors are NOT source proof errors.
    next.worker.postMessage({id:next.id,image:inference,multi24:true});
    redraw();
   }catch(workerError){
    detectorFallback65(next,'Local detection could not start.');
   }
  }catch(error){
   // A bad photo is a validation error, not consent to discard the existing
   // verified source. Retain all review state; stale concurrent errors are
   // not permitted to overwrite the current source/status.
   if(pending())status.textContent='Could not verify selected replacement photo: '+
    String(error?.message||error)+'. Your current original photo and reviewed clothing remain unchanged; nothing was saved.';
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
   if(snapshots.some(x=>!canConfirmScene32(x,schema)||x.cropReviewed!==true||
       !validCrop24(x.cropBounds)))
    throw Error('An unreviewed or invalid garment cannot be saved.');
  }catch(error){status.textContent=String(error.message||error);return;}
  // An immutable photo + confirmed-pieces snapshot is captured before any
  // asynchronous IndexedDB read, queued work or crop editor callback.
  if(classification42)delete classification42.piece.recognitionStatus42;
  cancelClassification42();
  submitting=true;redraw();freezeDetector38();
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
