'use strict';
let outfitActiveId=null,lastOutfitPhoto='',outfitSplitJob=null;
function renderOutfitCapture(){
 // Saved garment records survive reload, even when the unsaved review queue
 // is empty. Recover only this account's latest captured outfit group.
 if(!outfitActiveId){
  const unfinished=batch.find(x=>x.outfitSourceId)?.outfitSourceId;
  const mostRecentSaved=items.filter(x=>typeof x.outfitSourceId==='string'&&x.outfitSourceId)
   .sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||'')))[0];
  outfitActiveId=unfinished||mostRecentSaved?.outfitSourceId||null;
 }
 const pending=batch.filter(x=>x.outfitSourceId===outfitActiveId),saved=items.filter(x=>x.outfitSourceId===outfitActiveId);
 $('outfitPieceActions').hidden=!outfitActiveId||(!pending.length&&!saved.length);
 $('outfitPieceSummary').textContent=saved.length+' saved'+(pending.some(x=>localPending.has(x.id))?' · checking photos…':'')+(pending.some(x=>!localPending.has(x.id))?' · some pieces need review':'');
 $('useCapturedOutfit').disabled=!saved.length;
}
function finishOutfitSplit(job,text,failed=false){
 if(job!==outfitSplitJob)return;
 if(typeof recordDeviceEvent==='function')recordDeviceEvent(failed?'outfit_split_failed':'outfit_split_ready',{durationMs:Date.now()-job.started});
 clearTimeout(job.timer);job.worker?.terminate();outfitSplitJob=null;busy=false;controls(false);
 $('outfitSplitStatus').textContent=text;$('outfitRetry').hidden=!failed;renderOutfitCapture();
 if(job.added){if(!$('scan').hidden)switchView('review');$('outfitSaveStatus').textContent=failed?'The separated pieces below are kept. Return to Add clothes to try separating the rest again.':'Recognized pieces save automatically. Unclear or duplicate pieces remain here for review.';}
}
function startOutfitSplit(image,sourceId=crypto.randomUUID()){
 if(busy||outfitSplitJob)return;
 stopCamera();busy=true;controls(true);outfitActiveId=sourceId;lastOutfitPhoto=image;$('outfitRetry').hidden=true;$('outfitSaveStatus').textContent='';
 if(typeof recordDeviceEvent==='function')recordDeviceEvent('outfit_split_start');
 const job={id:crypto.randomUUID(),sourceId,started:Date.now(),phase:'loading',worker:null,timer:null,added:0};outfitSplitJob=job;
 const timeout=()=>finishOutfitSplit(job,'Outfit separation timed out. Your existing and separated photos are kept. Try again with one person, head to toe.',true);
 const touch=()=>{clearTimeout(job.timer);const remaining=300000-(Date.now()-job.started);job.timer=setTimeout(timeout,Math.max(0,Math.min(60000,remaining)));};touch();
 $('outfitSplitStatus').textContent='Preparing…';
 try{
  const version=recognitionAssetVersion?'?v='+recognitionAssetVersion:'';job.worker=new Worker('outfit-worker.mjs'+version,{type:'module'});
  job.worker.onmessage=event=>{
   if(job!==outfitSplitJob)return;const data=event.data;if(!data||data.id!==job.id)return;
   if(data.type==='progress'){
    if(data.phase==='separating'&&job.phase!=='separating'){job.phase='separating';clearTimeout(job.timer);job.timer=setTimeout(timeout,60000);}
    else if(job.phase==='loading')touch();
    $('outfitSplitStatus').textContent=data.phase==='separating'?'Separating clothes…':Number.isFinite(data.percent)?'Downloading · '+data.percent+'%':'Preparing…';return;
   }
   if(data.type==='piece'){
    const p=data.piece;
    if(!p||typeof p.image!=='string'||p.image.length>8000000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.image)||!Array.isArray(p.hint?.categories)||p.hint.categories.some(x=>!categories.includes(x))||!Array.isArray(p.hint.types)||p.hint.types.length>8)return;
    if(p.recognitionPhoto&&(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.recognitionPhoto.image)||p.recognitionPhoto.image.length>8000000))return;
    if(candidate(p.image,{outfitSourceId:sourceId,segmentHint:p.hint,recognitionPhoto:p.recognitionPhoto,originalPhoto:{image},cropBounds:p.cropBounds,colorEstimate:p.colorEstimate}))job.added++;renderOutfitCapture();return;
   }
   if(data.type==='done')finishOutfitSplit(job,job.added?job.added+' individual clothing photos cropped. Categories are being checked.':'No new clothing pieces could be located. Try a clearer full-body photo; exact duplicates may already be in Photo results.',false);
   else if(data.type==='error')finishOutfitSplit(job,job.added?'Some pieces are kept; the rest could not be separated. Try again.':'This outfit could not be separated. Try another clear photo of one person, head to toe.',true);
  };
  job.worker.onerror=()=>finishOutfitSplit(job,'Outfit separation could not start. Your existing photos are kept. Try again.',true);
  job.worker.postMessage({id:job.id,image});
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
 if(['Tops','Dresses'].includes(item.category))return 'top';
 if(item.category==='Bottoms')return 'bottom';
 // Respect the existing three clothing layers: a captured jacket belongs
 // on the jacket slot, and a long coat on the outer coat slot.
 if(item.category==='Outerwear')
  return ['Coat','Raincoat'].includes(item.itemType)?'layer3':
   ['Cardigan','Vest'].includes(item.itemType)?'layer':'layer2';
 if(item.category==='Shoes')return 'shoes';
 return item.itemType==='Bag'?'bag':['Jewelry','Sunglasses'].includes(item.itemType)?'accessory':['Belt','Scarf','Hat'].includes(item.itemType)?'finish':null;
}
$('useCapturedOutfit').onclick=async()=>{
 await outfitBoardReady;const selected=items.filter(x=>x.outfitSourceId===outfitActiveId),slots={};
 for(const item of selected){const slot=capturedPieceSlot(item);if(slot&&(!slots[slot]||item.category==='Dresses'))slots[slot]=item.id;}
 if(!Object.keys(slots).length)return $('outfitSaveStatus').textContent='Adjust the saved categories first so these pieces can be placed on the outfit board.';
 const previous=structuredClone(currentBoard);
 try{currentBoard=cleanOutfitBoard({...currentBoard,name:'Captured outfit',slots,ideas:{},audience:'All',layerCount:0},items);await persistBoardState();syncBoardInputs();renderOutfitBoard();$('boardTarget').value=boardGaps(currentBoard,items).find(x=>!x.optional)?.id||'shoes';renderBoardSuggestions();switchView('builder');$('boardSaveStatus').textContent='Your captured clothing is on the board. Choose an open space or compare alternatives below.';}
 catch{currentBoard=previous;syncBoardInputs();renderOutfitBoard();$('outfitSaveStatus').textContent='Could not open this outfit board. Your saved clothing is still in My closet.';}
};
closetReady.then(renderOutfitCapture);
