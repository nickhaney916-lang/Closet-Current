'use strict';
let outfitActiveId=null,lastOutfitPhoto='',outfitSplitJob=null;
// P840 no-deploy diagnostic flag; never enable all-user segmentation changes
// until prospective human-ground-truth and actual device gates are met.
const outfitInstances840=typeof location!=='undefined'&&new URL(location.href).searchParams.get('outfitInstances840')==='1';
const outfitUnits70=outfitInstances840&&typeof location!=='undefined'&&new URL(location.href).searchParams.get('outfitUnits70')==='1';
const unit70Api=outfitUnits70?import('./outfit-unit-reconciliation-70.mjs'+(recognitionAssetVersion?'?v='+recognitionAssetVersion:'')):null;
let outfitUnit70Error='';
function unit70Owner(){return typeof window!=='undefined'?window.closetAuth?.user?.id:null;}
async function updateUnit70(decision,ids){
 if(!outfitUnits70)return;
 try{
  const api=await unit70Api,owner=unit70Owner();
  if(!owner)throw Error('Sign in to resolve your garment pieces.');
  if(decision==='pair'||decision==='combine'){
   if(ids.length!==2||ids[0]===ids[1])throw Error('Select exactly two different regions.');
   if(ids.some(id=>items.some(x=>x.id===id)))throw Error('A saved item cannot be regrouped.');
   batch=api.confirmWardrobePair70(batch,ids[0],ids[1],owner,{fragments:decision==='combine'});
  }else if(decision==='keep')batch=api.keepSeparate70(batch,ids,owner);
  else if(decision==='discard'){
   if(!ids.length||ids.some(id=>!batch.some(x=>x.id===id&&x.reconciliation70?.ownerId===owner)))throw Error('Invalid source selection.');
   batch=batch.filter(x=>!ids.includes(x.id));
  }else if(decision==='unpair'){
   const candidateItem=batch.find(x=>x.id===ids[0]),parts=api.unpairComponents70(batch,ids[0],owner);
   const extra=parts.companion,added=candidate(extra.image,{outfitSourceId:candidateItem.outfitSourceId,
    segmentHint:extra.segmentHint,recognitionPhoto:extra.recognitionPhoto,
    originalPhoto:candidateItem.originalPhoto,cropBounds:extra.cropBounds,colorEstimate:extra.colorEstimate,
    reconciliation70:extra.reconciliation70,reconciliation70Status:'separate_confirmed'});
   if(!added)throw Error('Companion already exists; nothing was split.');
   batch=batch.map(x=>x.id===ids[0]?parts.first:x);
  }
  outfitUnit70Error='';await persistDraft();render();
 }catch(error){outfitUnit70Error=error?.message||'Review decision could not be saved.';renderOutfitCapture();}
}
function renderUnit70Panel(){
 if(!outfitUnits70||typeof document==='undefined')return;
 const target=document.getElementById('outfitUnitReview70');if(!target)return;
 unit70Api.then(api=>{
  if(!outfitUnits70)return;
  if(typeof window!=='undefined')window.ownerMaySaveUnit70=api.ownerMaySaveUnit70;
  api.renderUnitReview70(target,{drafts:batch,existing:items,sourceId:outfitActiveId,
   onPair:(a,b)=>updateUnit70('pair',[a,b]),onCombine:(a,b)=>updateUnit70('combine',[a,b]),
   onKeep:ids=>updateUnit70('keep',ids),onDiscard:ids=>updateUnit70('discard',ids),onUnpair:id=>updateUnit70('unpair',[id])});
  if(outfitUnit70Error){const warning=document.createElement('p');warning.textContent=outfitUnit70Error;warning.setAttribute('role','alert');target.prepend(warning);}
 }).catch(()=>{target.hidden=false;target.textContent='Garment reconciliation is unavailable. Your draft photographs are preserved. Use individual photos or retry.';});
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
 if(job.added){if(!$('scan').hidden)switchView('review');$('outfitSaveStatus').textContent=failed?'The separated pieces below are kept. Return to Add clothes to try separating the rest again.':'Separated pieces remain here for you to confirm category, type and color before saving.';}
}
function startOutfitSplit(image,sourceId=crypto.randomUUID()){
 if(busy||outfitSplitJob)return;
 stopCamera();busy=true;controls(true);outfitActiveId=sourceId;lastOutfitPhoto=image;$('outfitRetry').hidden=true;$('outfitSaveStatus').textContent='';
 if(typeof recordDeviceEvent==='function')recordDeviceEvent('outfit_split_start');
 const job={id:crypto.randomUUID(),sourceId,ownerId:unit70Owner(),started:Date.now(),phase:'loading',worker:null,timer:null,added:0};outfitSplitJob=job;
 const timeout=()=>finishOutfitSplit(job,'Outfit separation timed out. Your existing and separated photos are kept. Try again with one person, head to toe.',true);
 const touch=()=>{clearTimeout(job.timer);const remaining=300000-(Date.now()-job.started);job.timer=setTimeout(timeout,Math.max(0,Math.min(60000,remaining)));};touch();
 $('outfitSplitStatus').textContent='Preparing…';
 try{
  const version=recognitionAssetVersion?'?v='+recognitionAssetVersion:'';job.worker=new Worker('outfit-worker.mjs'+version,{type:'module'});
  job.worker.onmessage=event=>{
   if(job!==outfitSplitJob)return;const data=event.data;if(!data||data.id!==job.id)return;
   if(outfitUnits70&&job.ownerId!==unit70Owner()){finishOutfitSplit(job,'Owner session changed. No pieces were added.',true);return;}
   if(data.type==='progress'){
    if(data.phase==='separating'&&job.phase!=='separating'){job.phase='separating';clearTimeout(job.timer);job.timer=setTimeout(timeout,60000);}
    else if(job.phase==='loading')touch();
    $('outfitSplitStatus').textContent=data.phase==='separating'?'Separating clothes…':Number.isFinite(data.percent)?'Downloading · '+data.percent+'%':'Preparing…';return;
   }
   if(data.type==='piece'){
    const p=data.piece;
    if(!p||typeof p.image!=='string'||p.image.length>8000000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.image)||!Array.isArray(p.hint?.categories)||p.hint.categories.some(x=>!categories.includes(x))||!Array.isArray(p.hint.types)||p.hint.types.length>8)return;
    if(p.recognitionPhoto&&(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.recognitionPhoto.image)||p.recognitionPhoto.image.length>8000000))return;
    if(outfitUnits70&&(!p.reconciliation70||!job.ownerId||!p.reconciliation70.sourceSha256||!p.reconciliation70.maskSha256)){outfitUnit70Error='A garment mask has no verifiable source identity. Please retry.';return;}
    if(candidate(p.image,{outfitSourceId:sourceId,segmentHint:p.hint,recognitionPhoto:p.recognitionPhoto,originalPhoto:{image},cropBounds:p.cropBounds,colorEstimate:p.colorEstimate,
      ...(outfitUnits70?{reconciliation70:{...p.reconciliation70,ownerId:job.ownerId,colorEstimate:p.colorEstimate||p.reconciliation70.colorEstimate||null},reconciliation70Status:'unresolved'}:{})}))job.added++;
    renderOutfitCapture();return;
   }
   if(data.type==='done')finishOutfitSplit(job,job.added?job.added+' individual clothing photos cropped. Review their suggested categories and colors before saving.':'No new clothing pieces could be located. Try a clearer full-body photo; exact duplicates may already be in Photo results.',false);
   else if(data.type==='error')finishOutfitSplit(job,job.added?'Some pieces are kept; the rest could not be separated. Try again.':'This outfit could not be separated. Try another clear photo of one person, head to toe.',true);
  };
  job.worker.onerror=()=>finishOutfitSplit(job,'Outfit separation could not start. Your existing photos are kept. Try again.',true);
  job.worker.postMessage({id:job.id,image,...(outfitInstances840?{instanceReview840:true}:{}),...(outfitUnits70?{instanceReview70:true}:{})});
 }catch{finishOutfitSplit(job,'Outfit separation is unavailable on this device. Try again or use individual clothing photos.',true);}
}
async function readOutfitPhoto(file){
 if(!file||busy||outfitSplitJob)return;
 if(file.size>10*1024*1024)return $('outfitSplitStatus').textContent='Choose an outfit photo smaller than 10 MB.';
 if(!file.type?.startsWith('image/')&&!/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name||''))return $('outfitSplitStatus').textContent='Choose a clothing photo.';
 stopCamera();busy=true;controls(true);let timer;
 try{const image=await Promise.race([photoToJPEG(file,{maxDimension:3072,quality:.94}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('decode timeout')),15000);})]);busy=false;controls(false);session=0;startOutfitSplit(image);}
 catch{$('outfitSplitStatus').textContent='Could not open that outfit photo. Try JPEG or PNG.';}
 finally{clearTimeout(timer);if(!outfitSplitJob){busy=false;controls(false);}}
}
for(const id of ['outfitCamera','outfitUpload']){$(id).onclick=()=>{if(!busy)stopCamera();};$(id).onchange=event=>{const file=event.target.files?.[0];event.target.value='';readOutfitPhoto(file);};}
$('outfitRetry').onclick=()=>{if(lastOutfitPhoto)startOutfitSplit(lastOutfitPhoto,outfitActiveId);};
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
