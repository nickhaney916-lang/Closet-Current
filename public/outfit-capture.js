'use strict';
let outfitActiveId=null,lastOutfitPhoto='',outfitSplitJob=null;
// P88 opt-in only: a retry has no authority to reassign the previous owner's
// JPEG to another signed session, including a replaced same-ID session.
let lastOutfitOwner88=null;
const captureOwner88=()=>typeof window==='undefined'?null:window.closetAuth?.user||null;
const sameCaptureOwner88=(lease)=>lease&&captureOwner88()===lease.user&&
 (captureOwner88()?.id||null)===lease.id;
// P840 no-deploy diagnostic flag; never enable all-user segmentation changes
// until prospective human-ground-truth and actual device gates are met.
const outfitInstances840=typeof location!=='undefined'&&new URL(location.href).searchParams.get('outfitInstances840')==='1';
const outfitUnits70=outfitInstances840&&typeof location!=='undefined'&&new URL(location.href).searchParams.get('outfitUnits70')==='1';
// #76 only exists alongside #70 owner and exact original/mask SHA receipts.
const outfitColor76=outfitUnits70&&typeof location!=='undefined'&&new URL(location.href).searchParams.get('color76')==='1';
const approvedColorNames76=new Set(['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor']);
// P88 review-only measured public validation found 0/13 correct accessory masks.
// Prompt a person to check the actual outfit; do not infer inventory completeness.
const ownerCoverageReminder88='Compare these tentative regions with your original outfit photo. Small accessories such as watches, belts, headwear, bags or glasses, and some tops or bottoms, may be missed. Photograph missing items individually and confirm each category, subtype and color yourself.';
const unit70Api=outfitUnits70?import('./outfit-unit-reconciliation-70.mjs'+(recognitionAssetVersion?'?v='+recognitionAssetVersion:'')):null;
let outfitUnit70Error='';
// Prove the original JPEG hash in the browser instead of trusting two
// self-consistent fields from one worker response. Opt-in unit70 and color76.
async function originalSha256ForColor76(image){
 try{
  if(typeof image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image)||image.length>12000000||!crypto?.subtle)return null;
  const encoded=image.slice('data:image/jpeg;base64,'.length),decoded=atob(encoded),bytes=new Uint8Array(decoded.length);
  for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
 }catch{return null;}
}
function unit70Owner(){return typeof window!=='undefined'?window.closetAuth?.user?.id:null;}
// P88: a physical garment decision is permissioned by the exact signed
// session object, original outfit source and owner ID at the time the Review
// panel is rendered. The ID alone does NOT distinguish replaced sessions.
function unit70OwnerLease88(){
 const user=captureOwner88();
 return {user,id:user?.id||null,sourceId:outfitActiveId};
}
function sameUnit70OwnerLease88(lease){
 const user=captureOwner88();
 return !!(lease?.user&&lease.id&&lease.sourceId&&user===lease.user&&
  user.id===lease.id&&outfitActiveId===lease.sourceId);
}
// The regular persistDraft() is a general-purpose queued best-effort write.
// For a source-bound owner decision, verify authorization *inside* the queued
// transaction callback, after the queue's asynchronous cloud.beforeWrite().
function persistUnit70Decision88(lease){
 const snapshot=structuredClone(batch),ownerDb=db;
 if(!ownerDb||!sameUnit70OwnerLease88(lease))return Promise.reject(Error('Owner session changed before garment draft persistence.'));
 return queued(()=>{
  if(!sameUnit70OwnerLease88(lease)||db!==ownerDb)
   throw Error('Owner session changed before garment draft persistence.');
  return new Promise((resolve,reject)=>{
   const tx=ownerDb.transaction('state','readwrite');
   tx.objectStore('state').put({id:'draft',batch:snapshot});
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
 });
}
// P88: P70 unpair must not call generic candidate() before the owner-bound
// queued write settles. candidate() immediately starts a separate draft write
// and recognition job, outside the physical-decision transaction's lease.
// Build a *detached* companion; attach both regions in ONE snapshot instead.
function detachedUnit70Companion88(original,companion,lease){
 const receipt=companion?.reconciliation70,base=original?.reconciliation70;
 if(!original||original.outfitSourceId!==lease.sourceId||
  base?.ownerId!==lease.id||receipt?.ownerId!==lease.id||
  !/^[a-f0-9]{64}$/.test(receipt?.sourceSha256||'')||
  !/^[a-f0-9]{64}$/.test(receipt?.maskSha256||'')||
  receipt.sourceSha256!==base.sourceSha256||
  receipt.maskSha256===base.maskSha256||
  !/^data:image\\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(companion?.image||'')||
  companion.image.length>8000000)
  throw Error('The companion garment is not bound to the same signed photo and distinct source mask.');
 if([...items,...batch].some(x=>x.image===companion.image))
  throw Error('The companion photo already exists; no duplicate was added.');
 const next=normalizeClothing({id:crypto.randomUUID(),image:companion.image,
  name:'',category:'Uncategorized',color:'',notes:'',
  localStatus:'Separate region restored. Check category, subtype and color.'});
 next.outfitSourceId=lease.sourceId;
 next.requiresOwnershipConfirmation=true;
 next.segmentHint=companion.segmentHint;
 next.recognitionPhoto=companion.recognitionPhoto;
 next.originalPhoto=original.originalPhoto;
 next.cropBounds=companion.cropBounds;
 next.reconciliation70={...receipt};
 next.reconciliation70Status='separate_confirmed';
 if(companion.colorEstimate){
  Object.assign(next,ClothingDetails.fillColor(next,companion.colorEstimate));
  if(next.colorSource==='photo-estimate')next.colorMethod='garment-mask';
 }
 return next;
}
async function updateUnit70(decision,ids,lease=unit70OwnerLease88()){
 if(!outfitUnits70)return;
 let previousBatch=null,assignedBatch=null,companionToReview88=null;
 try{
  if(!sameUnit70OwnerLease88(lease))
   throw Error('The signed owner or outfit changed. Reopen Review for this account.');
  // Capture the Review-panel authorization *before* the import await. A
  // same-ID replacement account cannot inherit old pairing/discard clicks.
  const api=await unit70Api,owner=lease.id;
  if(!sameUnit70OwnerLease88(lease))
   throw Error('The signed owner changed while loading garment review.');
  if(!Array.isArray(ids)||!ids.length||ids.some(id=>
   typeof id!=='string'||!batch.some(x=>x.id===id&&
    x.outfitSourceId===lease.sourceId&&x.reconciliation70?.ownerId===owner)))
   throw Error('Garment decision is outside the current original photo or signed owner.');
  previousBatch=batch.slice();
  if(decision==='pair'||decision==='combine'){
   if(ids.length!==2||ids[0]===ids[1])throw Error('Select exactly two different regions.');
   if(ids.some(id=>items.some(x=>x.id===id)))throw Error('A saved item cannot be regrouped.');
   batch=api.confirmWardrobePair70(batch,ids[0],ids[1],owner,{fragments:decision==='combine'});
  }else if(decision==='keep')batch=api.keepSeparate70(batch,ids,owner);
  else if(decision==='discard'){
   if(ids.some(id=>batch.find(x=>x.id===id)?.reconciliation70Status!=='unresolved'))
    throw Error('Only unresolved, unsaved detections can be discarded in this review.');
   batch=batch.filter(x=>!ids.includes(x.id));
  }
  else if(decision==='unpair'){
   if(ids.length!==1)throw Error('Select one confirmed grouping to separate.');
   const candidateItem=batch.find(x=>x.id===ids[0]),parts=api.unpairComponents70(batch,ids[0],owner);
   // No UI, IDB, source mutations or automatic scans until the owner-lease
   // transaction commits. Both restored components must share the same
   // actual original photo receipt and have distinct mask SHA receipts.
   companionToReview88=detachedUnit70Companion88(candidateItem,parts.companion,lease);
   batch=[...batch.map(x=>x.id===ids[0]?parts.first:x),companionToReview88];
  }else throw Error('Unknown garment review decision.');
  assignedBatch=batch;
  if(!sameUnit70OwnerLease88(lease))
   throw Error('The signed owner changed during garment review.');
  await persistUnit70Decision88(lease);
  if(!sameUnit70OwnerLease88(lease))return;
  if(companionToReview88&&batch.some(x=>x===companionToReview88)){
   // Model inference may open an additional (independently guarded) draft
   // lifecycle only AFTER both owner-confirmed halves are durably restored.
   sessionCapturedIds.add(companionToReview88.id);
   session++;
   $('sessionCount').textContent=session;
   $('reviewCount').textContent=batch.length;
   $('lastCaptureImage').src=companionToReview88.image;
   $('lastCaptureImage').hidden=false;
   queueAutomatic(companionToReview88);
  }
  outfitUnit70Error='';render();
 }catch(error){
  // Do not let a revoked account's pre-persist in-memory decision remain in
  // the active draft, and never roll back a newer session's replacement batch.
  if(previousBatch&&assignedBatch&&batch===assignedBatch)batch=previousBatch;
  if(!sameUnit70OwnerLease88(lease))return;
  outfitUnit70Error=error?.message||'Review decision could not be saved.';
  renderOutfitCapture();
 }
}
function renderUnit70Panel(){
 if(!outfitUnits70||typeof document==='undefined')return;
 const target=document.getElementById('outfitUnitReview70');if(!target)return;
 const lease=unit70OwnerLease88();
 const scoped=batch.filter(x=>x.outfitSourceId===lease.sourceId&&x.reconciliation70);
 // Never paint an out-of-session photo into the next signed owner's Review
 // panel, even if a stale draft batch has not yet been swapped by app auth.
 if(!sameUnit70OwnerLease88(lease)||
  scoped.some(x=>x.reconciliation70.ownerId!==lease.id)){
  target.replaceChildren();target.hidden=true;return;
 }
 unit70Api.then(api=>{
  // An asynchronous import cannot render old-owner photos into a new session,
  // and all buttons keep the lease from the panel that created them.
  if(!sameUnit70OwnerLease88(lease)||batch.some(x=>x.outfitSourceId===lease.sourceId&&
   x.reconciliation70&&x.reconciliation70.ownerId!==lease.id))return;
  if(typeof window!=='undefined')window.ownerMaySaveUnit70=api.ownerMaySaveUnit70;
  api.renderUnitReview70(target,{drafts:batch,existing:items,sourceId:lease.sourceId,
   onPair:(a,b)=>updateUnit70('pair',[a,b],lease),onCombine:(a,b)=>updateUnit70('combine',[a,b],lease),
   onKeep:ids=>updateUnit70('keep',ids,lease),onDiscard:ids=>updateUnit70('discard',ids,lease),
   onUnpair:id=>updateUnit70('unpair',[id],lease)});
  if(outfitUnit70Error){const warning=document.createElement('p');warning.textContent=outfitUnit70Error;warning.setAttribute('role','alert');target.prepend(warning);}
 }).catch(()=>{
  if(!sameUnit70OwnerLease88(lease))return;
  target.hidden=false;target.textContent='Garment reconciliation is unavailable. Your draft photographs are preserved. Use individual photos or retry.';
 });
}
function renderOutfitCapture(){
 if(!outfitActiveId)outfitActiveId=batch.find(x=>x.outfitSourceId)?.outfitSourceId||null;
 const pending=batch.filter(x=>x.outfitSourceId===outfitActiveId),saved=items.filter(x=>x.outfitSourceId===outfitActiveId);
 $('outfitPieceActions').hidden=!outfitActiveId||(!pending.length&&!saved.length);
 $('outfitPieceSummary').textContent=saved.length+' saved'+(pending.some(x=>localPending.has(x.id))?' · checking photos…':'')+(pending.some(x=>!localPending.has(x.id))?' · some pieces need review':'');
 $('useCapturedOutfit').disabled=!saved.length;renderUnit70Panel();
}
function finishOutfitSplit(job,text,failed=false){
 if(job!==outfitSplitJob)return;
 if(typeof recordDeviceEvent==='function')recordDeviceEvent(failed?'outfit_split_failed':'outfit_split_ready',{durationMs:Date.now()-job.started});
 clearTimeout(job.timer);job.worker?.terminate();outfitSplitJob=null;busy=false;controls(false);
 $('outfitSplitStatus').textContent=text;$('outfitRetry').hidden=!failed;renderOutfitCapture();
 if(job.added){if(!$('scan').hidden)switchView('review');$('outfitSaveStatus').textContent=failed?'The separated pieces below are kept. Return to Add clothes to try separating the rest again.':'Separated pieces remain here for you to confirm category, type and color before saving.';
  if(outfitColor76&&job.colorNotes.length)$('outfitSaveStatus').textContent+=' Research-only color suggestions (NOT applied): '+job.colorNotes.join(' · ')+'. Check each photo and enter its actual color in Adjust details.';
  // Successful or partial capture switches to Review, so the scan-only
  // outfitSplitStatus is not visible to the owner. Preserve the caution on
  // the actual Review screen with the unsaved pieces.
  if(outfitInstances840)$('outfitSaveStatus').textContent+=' '+ownerCoverageReminder88;
 }
}
function startOutfitSplit(image,sourceId=crypto.randomUUID()){
 if(busy||outfitSplitJob)return;
 stopCamera();busy=true;controls(true);outfitActiveId=sourceId;lastOutfitPhoto=image;
 if(outfitInstances840){const user=captureOwner88();lastOutfitOwner88={user,id:user?.id||null};}
 $('outfitRetry').hidden=true;$('outfitSaveStatus').textContent='';
 if(typeof recordDeviceEvent==='function')recordDeviceEvent('outfit_split_start');
 const job={id:crypto.randomUUID(),sourceId,ownerId:unit70Owner(),ownerRef88:outfitInstances840&&typeof window!=='undefined'?window.closetAuth?.user:null,started:Date.now(),phase:'loading',worker:null,timer:null,added:0,colorNotes:[],messageQueue:Promise.resolve(),sourceDigest:outfitColor76?originalSha256ForColor76(image):null,unit70SourceDigest:outfitUnits70&&!outfitColor76?originalSha256ForColor76(image):null};outfitSplitJob=job;
 const timeout=()=>finishOutfitSplit(job,'Outfit separation timed out. Your existing and separated photos are kept. Try again with one person, head to toe.',true);
 const touch=()=>{clearTimeout(job.timer);const remaining=300000-(Date.now()-job.started);job.timer=setTimeout(timeout,Math.max(0,Math.min(60000,remaining)));};touch();
 $('outfitSplitStatus').textContent='Preparing…';
 try{
  const version=recognitionAssetVersion?'?v='+recognitionAssetVersion:'';job.worker=new Worker('outfit-worker.mjs'+version,{type:'module'});
  const handleOutfitMessage=async event=>{
   if(job!==outfitSplitJob)return;const data=event.data;if(!data||data.id!==job.id)return;
   // P88: the opt-in instance split is tied to its original signed owner
   // reference, not only the optional physical shoe-unit reconciliation.
   // Replaced/revoked session objects with the same user ID are stale too.
   if((outfitUnits70||outfitInstances840)&&
    (job.ownerId!==unit70Owner()||
     (outfitInstances840&&job.ownerRef88&&
      (typeof window==='undefined'||window.closetAuth?.user!==job.ownerRef88)))){
    if(outfitInstances840){lastOutfitPhoto='';lastOutfitOwner88=null;}
    finishOutfitSplit(job,'Owner session changed. Further garment drafts were not accepted.',true);return;
   }
   if(data.type==='progress'){
    if(data.phase==='separating'&&job.phase!=='separating'){job.phase='separating';clearTimeout(job.timer);job.timer=setTimeout(timeout,60000);}
    else if(job.phase==='loading')touch();
    $('outfitSplitStatus').textContent=data.phase==='separating'?'Separating clothes…':Number.isFinite(data.percent)?'Downloading · '+data.percent+'%':'Preparing…';return;
   }
   if(data.type==='piece'){
    const p=data.piece;
    if(!p||typeof p.image!=='string'||p.image.length>8000000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.image)||!Array.isArray(p.hint?.categories)||p.hint.categories.some(x=>!categories.includes(x))||!Array.isArray(p.hint.types)||p.hint.types.length>8)return;
    if(p.recognitionPhoto&&(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.recognitionPhoto.image)||p.recognitionPhoto.image.length>8000000))return;
    if(outfitUnits70&&(!p.reconciliation70||!job.ownerId||
     !/^[a-f0-9]{64}$/.test(p.reconciliation70.sourceSha256||'')||
     !/^[a-f0-9]{64}$/.test(p.reconciliation70.maskSha256||''))){
     outfitUnit70Error='Garment mask receipt is missing or malformed; the original photo is kept.';
     finishOutfitSplit(job,'Source proof unavailable. Original and accepted earlier drafts are kept; retry this photo.',true);
     return;
    }
    // P88: unit grouping is also a source-security workflow without color76.
    // Recompute SHA-256 from the owner's original JPEG, not another worker
    // receipt; keep message processing ordered until the digest has settled.
    const sourceProof70=outfitUnits70?await (job.sourceDigest||job.unit70SourceDigest):null;
    if(outfitUnits70){
     if(job!==outfitSplitJob)return;
     if(job.ownerId!==unit70Owner()||
       (outfitInstances840&&job.ownerRef88&&captureOwner88()!==job.ownerRef88)){
      if(outfitInstances840){lastOutfitPhoto='';lastOutfitOwner88=null;}
      finishOutfitSplit(job,'Owner session changed during photo verification. No further pieces were added.',true);
      return;
     }
     if(!sourceProof70||p.reconciliation70.sourceSha256!==sourceProof70){
      outfitUnit70Error='The original JPEG SHA-256 does not match the garment receipt. No unverified mask was accepted.';
      finishOutfitSplit(job,'This garment source did not match its original JPEG. Earlier accepted drafts are kept; retry or recapture.',true);
      return;
     }
    }
    let verifiedColor76=!outfitColor76,colorNote76=null;
    if(outfitColor76){
     const sourceProof=sourceProof70;
     if(job!==outfitSplitJob)return;
     // Owner/source lease was revalidated after the SHA await above.
     const color=p.colorResearch76,valid=sourceProof&&color&&color.ownerId===job.ownerId&&color.requestId===job.id&&
       /^[a-f0-9]{64}$/.test(color.maskSha256||'')&&
       sourceProof===p.reconciliation70?.sourceSha256&&sourceProof===color.sourceSha256&&
       color.maskSha256===p.reconciliation70?.maskSha256;
     verifiedColor76=Boolean(valid&&color.status==='review'&&approvedColorNames76.has(color.proposedPrimary)&&
       (!color.proposedSecondary||(approvedColorNames76.has(color.proposedSecondary)&&color.proposedSecondary!==color.proposedPrimary)));
     colorNote76=verifiedColor76?
       p.label+': '+color.proposedPrimary+(color.proposedSecondary?' / '+color.proposedSecondary:'')+(color.multicolor?' (multicolor)':''):
       p.label+': color needs manual review';
     // An unbound/stale/cross-photo proposal must not let the older worker
     // color slip through as a confident fallback. Keep the photo for Adjust.
    }
    const safeColorEstimate76=verifiedColor76?p.colorEstimate:null;
    // P88: the P82 source-pinned worker already forwards instanceMethod.
    // Translate ONLY this exact opt-in diagnostic method into an owner draft
    // veto. Do not modify the frozen worker or trust free-text worker status.
    const unresolved88=outfitInstances840&&
      p.instanceMethod==='native_semantic_group_unresolved_fragments';
    const split88=outfitInstances840&&
      ['connected_semantic_component_unverified','connected_footwear_component'].includes(p.instanceMethod);
    // Even a well-separated mask is NOT a verified owned garment count.
    // Shoe pairs or shirt fragments require the exact source/mask receipt and
    // a separate human physical-unit decision before being saved.
    const hint88=unresolved88?{...p.hint,componentReviewStatus:'unresolved_fragments_keep_source_mask'}:
     split88?{...p.hint,componentReviewStatus:'owner_must_confirm_garment_units'}:p.hint;
    if(candidate(p.image,{outfitSourceId:sourceId,segmentHint:hint88,recognitionPhoto:p.recognitionPhoto,originalPhoto:{image},cropBounds:p.cropBounds,colorEstimate:safeColorEstimate76,
      ...(outfitUnits70?{reconciliation70:{...p.reconciliation70,ownerId:job.ownerId,colorEstimate:safeColorEstimate76||null},reconciliation70Status:'unresolved'}:{})})){
      job.added++;if(colorNote76)job.colorNotes.push(colorNote76);
    }
    renderOutfitCapture();return;
   }
   if(data.type==='done'){
    // P88 real, human-annotated public validation: the shoe-only-conservative
    // split matched 27/53 garment masks. Small/accessory items were often
    // missing; multiple disconnected garments are not verified owned units.
    // Never present detected region count as a complete wardrobe inventory.
    const result=outfitInstances840?
      (job.added?job.added+' tentative clothing regions found, not a verified garment count. ':'No confidently separated clothing regions found. ')+ownerCoverageReminder88:
      (job.added?job.added+' individual clothing photos cropped. Review their suggested categories and colors before saving.':'No new clothing pieces could be located. Try a clearer full-body photo; exact duplicates may already be in Photo results.');
    finishOutfitSplit(job,result,false);
   }
   else if(data.type==='error')finishOutfitSplit(job,job.added?'Some pieces are kept; the rest could not be separated. Try again.':'This outfit could not be separated. Try another clear photo of one person, head to toe.',true);
  };
  job.worker.onmessage=event=>{
   // Legacy behavior remains synchronous when unit70 is disabled.
   // All source-verified unit70 messages (not just color76) must be ordered;
   // a fast 'done' cannot outrun an asynchronously SHA-verified 'piece'.
   if(!outfitUnits70){void handleOutfitMessage(event);return;}
   job.messageQueue=job.messageQueue.then(()=>handleOutfitMessage(event)).catch(()=>
    finishOutfitSplit(job,'Research verification interrupted. Your original and already separated photos remain for manual review.',true));
  };
  job.worker.onerror=()=>finishOutfitSplit(job,'Outfit separation could not start. Your existing photos are kept. Try again.',true);
  job.worker.postMessage({id:job.id,image,...(outfitInstances840?{instanceReview840:true}:{}),...(outfitUnits70?{instanceReview70:true}:{}),...(outfitColor76?{color76:true,ownerId:job.ownerId}:{})});
 }catch{finishOutfitSplit(job,'Outfit separation is unavailable on this device. Try again or use individual clothing photos.',true);}
}
async function readOutfitPhoto(file){
 if(!file||busy||outfitSplitJob)return;
 if(file.size>10*1024*1024)return $('outfitSplitStatus').textContent='Choose an outfit photo smaller than 10 MB.';
 if(!file.type?.startsWith('image/')&&!/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name||''))return $('outfitSplitStatus').textContent='Choose a clothing photo.';
 stopCamera();busy=true;controls(true);let timer;
 const ownerAtDecode88=outfitInstances840?captureOwner88():null;
 try{const image=await Promise.race([photoToJPEG(file,{maxDimension:3072,quality:.94}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('decode timeout')),15000);})]);
  if(outfitInstances840&&(ownerAtDecode88!==captureOwner88()||
   (ownerAtDecode88?.id||null)!==(captureOwner88()?.id||null))){
   $('outfitSplitStatus').textContent='Your signed session changed while opening this photo. Choose the photo again for the current account.';
   return;
  }
  busy=false;controls(false);session=0;startOutfitSplit(image);}
 catch{$('outfitSplitStatus').textContent='Could not open that outfit photo. Try JPEG or PNG.';}
 finally{clearTimeout(timer);if(!outfitSplitJob){busy=false;controls(false);}}
}
for(const id of ['outfitCamera','outfitUpload']){$(id).onclick=()=>{if(!busy)stopCamera();};$(id).onchange=event=>{const file=event.target.files?.[0];event.target.value='';readOutfitPhoto(file);};}
$('outfitRetry').onclick=()=>{
 if(outfitInstances840&&!sameCaptureOwner88(lastOutfitOwner88)){
  // Never replay a prior account's JPEG through another owner's model/draft.
  lastOutfitPhoto='';lastOutfitOwner88=null;
  $('outfitRetry').hidden=true;
  $('outfitSplitStatus').textContent='The previous photo belongs to another signed session. Choose a new photo for this account.';
  return;
 }
 if(lastOutfitPhoto)startOutfitSplit(lastOutfitPhoto,outfitActiveId);
};
function capturedPieceSlot(item){
 if(['Tops','Dresses'].includes(item.category))return 'top';if(item.category==='Bottoms')return 'bottom';if(item.category==='Outerwear')return 'layer';if(item.category==='Shoes')return 'shoes';
 return item.itemType==='Bag'?'bag':['Jewelry','Sunglasses'].includes(item.itemType)?'accessory':['Belt','Scarf','Hat'].includes(item.itemType)?'finish':null;
}
$('useCapturedOutfit').onclick=async()=>{
 await outfitBoardReady;const selected=items.filter(x=>x.outfitSourceId===outfitActiveId),slots={};
 for(const item of selected){const slot=capturedPieceSlot(item);if(slot&&(!slots[slot]||item.category==='Dresses'))slots[slot]=item.id;}
 if(!Object.keys(slots).length)return $('outfitSaveStatus').textContent='Adjust the saved categories first so these pieces can be placed on the outfit board.';
 const previous=structuredClone(currentBoard);
 try{currentBoard=cleanOutfitBoard({...currentBoard,name:'Captured outfit',slots,ideas:{},audience:'All'},items);await persistBoardState();syncBoardInputs();renderOutfitBoard();$('boardTarget').value=boardGaps(currentBoard,items).find(x=>!x.optional)?.id||'shoes';renderBoardSuggestions();switchView('builder');$('boardSaveStatus').textContent='Your captured clothing is on the board. Choose an open space or compare alternatives below.';}
 catch{currentBoard=previous;syncBoardInputs();renderOutfitBoard();$('outfitSaveStatus').textContent='Could not open this outfit board. Your saved clothing is still in My closet.';}
};
closetReady.then(renderOutfitCapture);
