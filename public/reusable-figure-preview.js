'use strict';
// Two reusable figures + local-only optional selfie. The preview is an
// APPROXIMATE collage, not AI fit synthesis and not a representation of sizing.
(function(root){
 const engine=root.ClosetReusableFigure;
 const byId=id=>document.getElementById(id);
 const stage=byId('reusableFigureStage'),base=byId('reusableFigureBase');
 const garmentContainer=byId('reusableFigureGarments'),selfie=byId('reusableFigureSelfie');
 const status=byId('reusableFigureStatus'),selector=byId('reusableFigureChoice');
 const upload=byId('reusableSelfieUpload'),remove=byId('reusableSelfieRemove');
 const consent=byId('reusableSelfieConsent'),clarity=byId('reusableFigureClarity');
 const retry=byId('reusableFigureRetry');
 const photoHelp=byId('reusableFigurePhotoHelp');
 const photoHelpText=byId('reusableFigurePhotoHelpText');
 const retake=byId('reusableFigureRetake');
 if(retake)retake.addEventListener('click',()=>{
  // Reuse the existing Add/Single-item workflow. Never edit/delete the
  // previously saved original, auto-activate the camera or upload anything.
  if(typeof switchView==='function'){
   switchView('scan');
   if(typeof setCaptureMode==='function')setCaptureMode('single');
  }
 });
 function updatePhotoHelp(held){
  if(!photoHelp||!photoHelpText||!retake)return;
  photoHelp.hidden=!held;
  retake.hidden=!held;
  if(held)photoHelpText.textContent=
   'That clothing photo is still saved. For a clearer automatic cutout, photograph one item against a plain, contrasting surface in even light. Avoid mannequins and other clothes.';
 }

 if(!engine||!stage||!base||!garmentContainer||!selfie||!status||!selector||!upload||!remove)return;
 let lastPlan=null,lastPlanOwner=null,activeRender=null;
 let renderRevision=0,localFaceURL=null,lastOwner=root.closetAuth?.user?.id||null;
 // Independent UI watchdog: frequent background refreshes must never keep a
 // stalled Image.decode() spinner alive by resetting each attempt's deadline.
 let renderWatchdog=null,watchdogState=null,stalledState=null;
 const sameRequest=(a,b)=>!!a&&!!b&&a.owner===b.owner&&
  a.database===b.database&&a.boardState===b.boardState&&
  engine.samePlan(a.plan,b.plan);
 function clearWatchdog(){if(renderWatchdog!==null)clearTimeout(renderWatchdog);
  renderWatchdog=null;watchdogState=null;}
 function guardWatchdog(state){
  if(sameRequest(watchdogState,state))return;
  clearWatchdog();watchdogState=state;
  renderWatchdog=setTimeout(()=>{
   // Changing the photo, model figure or account can still initiate a new
   // request; only this exact stalled board is temporarily held for retry.
   if(!sameRequest(watchdogState,state))return;
   // Also clear the explicit timer handle for deterministic cleanup in
   // test clocks and for paths that may inspect outstanding work.
   const fired=renderWatchdog;
   if(fired!==null)clearTimeout(fired);
   stalledState=state;renderWatchdog=null;watchdogState=null;
   ++renderRevision;activeRender=null;lastPlan=null;
   // A stalled cached PNG must not be immediately re-used by explicit Retry.
   for(const placement of state.plan.placements||[]){
    previewCache?.remove({owner:state.owner,id:String(placement.itemId),
     source:placement.image,category:placement.category,
     primaryColor:placement.primaryColor||''});
   }
   garmentContainer.replaceChildren();removeFace();updatePhotoHelp(false);
   base.style.visibility='hidden';stage.setAttribute('aria-busy','false');
   status.textContent='Preview took too long. Your photos are saved; tap Retry clothing preview.';
   if(retry)retry.hidden=false;
  },7000);
 }
 const previewCache=root.ClosetFigurePreviewCache?.create();
 const faceControls=byId('reusableSelfiePosition');
 const faceInputs=['X','Y','Zoom'].map(axis=>byId('reusableSelfie'+axis));
 function positionFace(){
  const rect=engine.selfieRect(selector.value,{x:Number(faceInputs[0]?.value||0),
   y:Number(faceInputs[1]?.value||0),zoom:Number(faceInputs[2]?.value||0)});
  for(const [key,value] of Object.entries(rect))selfie.style[key]=value+'%';
 }
 for(const input of faceInputs)input?.addEventListener('input',positionFace);
 const acceptableFace=file=>file&&['image/jpeg','image/png','image/webp'].includes(file.type)&&
  file.size>0&&file.size<=8_000_000;
 function removeFace(){
  if(consent)consent.checked=false;upload.disabled=true;
  selfie.hidden=true;selfie.removeAttribute('src');upload.value='';
  if(localFaceURL)URL.revokeObjectURL(localFaceURL);
  localFaceURL=null;remove.hidden=true;
  if(faceControls)faceControls.hidden=true;
  for(const input of faceInputs)if(input)input.value='0';
 }
 consent?.addEventListener('change',()=>{
  if(!consent.checked)removeFace();else upload.disabled=false;
 });
 upload.addEventListener('change',()=>{
  // Consent precedes even reading the file, creating a blob URL or decoding.
  if(!consent?.checked){removeFace();return;}
  const file=upload.files?.[0];
  removeFace();
  consent.checked=true;upload.disabled=false;
  if(!file)return;
  if(!acceptableFace(file)){status.textContent='Use a JPEG, PNG or WebP selfie smaller than 8 MB.';return;}
  localFaceURL=URL.createObjectURL(file);
  selfie.src=localFaceURL;selfie.hidden=false;remove.hidden=false;
  if(faceControls)faceControls.hidden=false;positionFace();
  status.textContent='Selfie face overlay is on this device only. Preview placement is approximate; nothing was uploaded or saved.';
 });
 remove.addEventListener('click',()=>{removeFace();lastPlan=null;requestRender();});
 selector.addEventListener('change',()=>{positionFace();requestRender();});
 // Bound decoding so a broken image cannot leave the customer waiting forever.
 async function decodeImage(image){
  let timer;
  try{await Promise.race([image.decode(),new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error('Image preparation timed out')),5000);
  })]);}finally{clearTimeout(timer);}
 }
 if(retry)retry.addEventListener('click',()=>{
  stalledState=null;clearWatchdog();lastPlan=null;requestRender();
 });
 async function imagePixels(value,category,primaryColor){
  const photo=new Image();photo.src=value;
  try{await decodeImage(photo);}catch{return null;}
  const w=photo.naturalWidth,h=photo.naturalHeight;
  if(w<24||h<24||w*h>20_000_000)return null;
  const scale=Math.min(1,Math.sqrt(150000/(w*h)));
  const c=document.createElement('canvas');
  c.width=Math.max(24,Math.floor(w*scale));c.height=Math.max(24,Math.floor(h*scale));
  const ctx=c.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  // Analyze only a bounded copy; after approval, use the higher-resolution
  // source for native alpha. Matting stays conservative at its tested limit.
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  function trimmed(source,pixels){
   const bounds=root.ClosetGarmentWarp?.alphaBounds(pixels.data,source.width,source.height);
   if(!bounds)return null;
   const out=document.createElement('canvas');out.width=bounds.width;out.height=bounds.height;
   const output=out.getContext('2d');if(!output)return null;
   output.drawImage(source,bounds.left,bounds.top,bounds.width,bounds.height,0,0,bounds.width,bounds.height);
   // Finish only an ALREADY-APPROVED hard-alpha display copy. This is
   // separate from the untouched original used for recognition/indexing.
   // Native soft alpha, fine cuffs or ambiguous masks are not modified.
   try{
    const rendered=output.getImageData(0,0,bounds.width,bounds.height);
    const edge=root.ClosetGarmentEdgeFinish?.finish(rendered.data,bounds.width,bounds.height);
    if(edge?.eligible===true&&edge.pixels?.length===rendered.data.length){
     rendered.data.set(edge.pixels);output.putImageData(rendered,0,0);
    }
   }catch{/* Preserve the already-approved unmodified cutout on failures. */}
   // Use the already-approved transparent image, not its raw photo or
   // unreviewed high-resolution mask diagnostic. Metadata only; no uploads.
   const croppedPixels=new Uint8ClampedArray(bounds.width*bounds.height*4);
   for(let y=0;y<bounds.height;y++)
    croppedPixels.set(pixels.data.subarray(
     ((bounds.top+y)*source.width+bounds.left)*4,
     ((bounds.top+y)*source.width+bounds.left+bounds.width)*4),y*bounds.width*4);
   const anchor=root.ClosetGarmentFitGeometry?.silhouetteAnchor(
    croppedPixels,bounds.width,bounds.height,category);
   return {image:out.toDataURL('image/png'),width:bounds.width,height:bounds.height,
    silhouetteCenter:anchor?.center??null};
  }
  try{ctx.drawImage(photo,0,0,c.width,c.height);
   const pixels=ctx.getImageData(0,0,c.width,c.height);
   const white=root.ClosetWhiteMatte;
   if(white?.hasTransparentBackground(pixels.data,c.width,c.height)){
    // Existing transparent cutouts have already been separated. Increase
    // ONLY their display sampling on high-density devices, bounded to 1MP;
    // keep uncertain matte creation at its established conservative scale.
    const highSize=root.ClosetPreviewSampling?.size(w,h,root.devicePixelRatio);
    if(!highSize)return null;
    const high=document.createElement('canvas');
    high.width=highSize.width;high.height=highSize.height;
    const hi=high.getContext('2d',{willReadFrequently:true});if(!hi)return null;
    hi.imageSmoothingEnabled=true;hi.imageSmoothingQuality='high';
    hi.drawImage(photo,0,0,high.width,high.height);
    const nativeCutout=hi.getImageData(0,0,high.width,high.height);
    // Transparency is NOT evidence the silhouette contains only fabric.
    // A mannequin neck or hanger can survive a third-party alpha cutout.
    // Hold suspicious upper-center attachments rather than placing their
    // pixels over an unrelated customer's face on either reusable figure.
    const contamination=root.ClosetTransparentForegroundSafety?.inspect(
     nativeCutout.data,high.width,high.height,category);
    if(contamination?.hold)return null; // Original saved photo remains intact.
    return trimmed(high,nativeCutout);
   }
   // Safe white-paper removal is optional and cannot reconstruct a garment.
   const matte=white?.analyze(pixels.data,c.width,c.height,{category,primaryColor});
   if(matte?.eligible===true&&matte.alpha?.length===c.width*c.height){
    for(let i=0;i<matte.alpha.length;i++)pixels.data[i*4+3]=matte.alpha[i];
    const bounds=root.ClosetGarmentWarp?.alphaBounds(pixels.data,c.width,c.height);
    if(['Tops','Outerwear','Dresses'].includes(category)&&
      root.ClosetGarmentWarp?.hasAmbiguousNeck(pixels.data,c.width,c.height,bounds))return null;
    ctx.putImageData(pixels,0,0);
    return trimmed(c,pixels);
   }
  }catch{return null;}
  return null;
 }
 async function render(){
  const revision=++renderRevision;
  const owner=root.closetAuth?.user?.id||null;
  if(owner!==lastOwner){removeFace();lastOwner=owner;}
  previewCache?.forOwner(owner); // Ownership changes clear every prior image.
  const database=typeof db==='undefined'?null:db;
  const databaseCurrent=()=>!!owner&&database?.name==='closet-current-user-'+owner&&
   database===(typeof db==='undefined'?null:db);
  if(!databaseCurrent()){
   clearWatchdog();stalledState=null;
   lastPlan=null;previewCache?.dispose();garmentContainer.replaceChildren();
   removeFace();updatePhotoHelp(false);base.style.visibility='hidden';
   stage.setAttribute('aria-busy','false');if(retry)retry.hidden=true;
   status.textContent='Your closet is unavailable for this account. Reload this page and sign in again.';
   return;
  }
  const board=()=>typeof currentBoard==='undefined'?null:currentBoard;
  const closet=()=>typeof items==='undefined'?[]:items;
  const plan=engine.plan(board(),closet(),selector.value);
  const boardState=JSON.stringify(board());
  const watchdogInput={owner,database,boardState,plan};
  if(stalledState){
   if(sameRequest(stalledState,watchdogInput))return;
   stalledState=null;
  }
  const sourceChanged=()=>JSON.stringify(board())!==boardState||
   !engine.samePlan(plan,engine.plan(board(),closet(),selector.value));
  if(lastPlanOwner===owner&&engine.samePlan(lastPlan,plan))return;
  guardWatchdog(watchdogInput);
  lastPlan=null; // A prior success cannot satisfy a request while another plan is rendering.
  activeRender={revision,owner,database,plan,boardState};
  stage.setAttribute('aria-busy','true');
  if(retry)retry.hidden=true;
  base.style.visibility='hidden';
  base.src=plan.figureImage;
  positionFace();
  // Never show the previous outfit with the newly selected figure, nor
  // expose half an outfit while async decoding/compositing is in flight.
  garmentContainer.replaceChildren();
  updatePhotoHelp(false); // Only the current finished render may show advice.
  status.textContent='Preparing local clothing preview…';
  const counts={shown:0,skipped:plan.skipped.length};
  const nextLayers=document.createDocumentFragment();
  const displayedSlots=new Set();
  const renderedLayers=[];
  const cancelled=()=>{
   if(revision!==renderRevision)return true;
   if((root.closetAuth?.user?.id||null)!==owner||!databaseCurrent()||sourceChanged()){
    lastPlan=null;previewCache?.forOwner(root.closetAuth?.user?.id||null);
    garmentContainer.replaceChildren();removeFace();updatePhotoHelp(false);
    stage.setAttribute('aria-busy','false');
    status.textContent='Your selection changed. Refresh the clothing preview.';
    if(retry)retry.hidden=false;
    return true;
   }
   return false;
  };
  await decodeImage(base);
  if(cancelled())return;
  base.style.visibility='visible';
  if(clarity)clarity.textContent=base.naturalWidth<600||base.naturalHeight<1000
   ?'Low-resolution '+plan.figure+' model reference ('+base.naturalWidth+' × '+base.naturalHeight+'). Enlarging it cannot restore detail. Check colors, textures and graphics in your saved clothing photos.'
   :'Model reference only. Check garment details in your saved clothing photos; this collage does not predict fit.';
  for(const placement of plan.placements){
   const query={owner,id:String(placement.itemId),source:placement.image,
    category:placement.category,primaryColor:placement.primaryColor||''};
   let prepared=previewCache?.get(query);
   let preparedNow=false;
   if(!prepared){
    const cutout=await imagePixels(placement.image,placement.category,placement.primaryColor);
    if(cancelled())return;
    if(!cutout){counts.skipped++;continue;}
    let image=cutout.image;
    if(placement.slot!=='shoes'&&root.ClosetGarmentWarp){
     const garment=new Image();garment.src=cutout.image;
     try{
      await decodeImage(garment);
      if(cancelled())return;
      const warped=root.ClosetGarmentWarp.warpTransparentImage(
       garment,placement.category,document.createElement('canvas'));
      if(warped)image=warped;
     }catch{/* Keep existing transparent cutout, never invent pixels. */}
    }
    if(cancelled())return;
    prepared={image,width:cutout.width,height:cutout.height,
     silhouetteCenter:cutout.silhouetteCenter};
    preparedNow=true;
   }
   // Preserve the calibrated female/male shoulder, waist and sole anchors,
   // without stretching garment prints or white/transparent empty margins.
   const rect=root.ClosetGarmentFitGeometry?.fitPlacement(
    placement.rect,prepared.width,prepared.height,
    {slot:placement.slot,category:placement.category,
     silhouetteCenter:prepared.silhouetteCenter});
   if(!rect){counts.skipped++;continue;}
   const img=document.createElement('img');
   img.src=prepared.image;
   img.alt='';
   img.className='reusable-figure-layer';
   for(const key of ['left','top','width','height'])img.style[key]=rect[key]+'%';
   // Do not advertise a garment as displayed until the final transformed
   // PNG has actually decoded to the dimensions used for aspect fitting.
   // A corrupt cached/display URL should be held, never a broken-image tile.
   try{await decodeImage(img);}catch{if(cancelled())return;previewCache?.remove(query);counts.skipped++;continue;}
   if(cancelled())return;
   if(img.naturalWidth!==prepared.width||img.naturalHeight!==prepared.height){
    previewCache?.remove(query);counts.skipped++;continue;
   }
   if(preparedNow)previewCache?.put(query,prepared); // Cache only proven images.
   img.dataset.slot=placement.slot;
   if(root.ClosetLocalLayerDepth?.depthFor(placement,displayedSlots).enabled)
    img.classList.add('reusable-figure-layer--contact-depth');
   nextLayers.append(img);displayedSlots.add(placement.slot);counts.shown++;
   renderedLayers.push({image:img,rect,slot:placement.slot});
  }
  // Only report when a piece is genuinely concealed by an APPROVED higher
  // layer. Do not count occlusion by the human figure or guess body physics.
  const visibility=renderedLayers.length>1
   ?root.ClosetLayerVisibility?.auditPlacedLayers(
      renderedLayers,()=>document.createElement('canvas')):null;
  if(cancelled())return;
  const covered=Array.isArray(visibility)
   ?visibility.filter(x=>x.mostlyConcealed).length:0;
  garmentContainer.replaceChildren(nextLayers);
  status.textContent=counts.shown+' owned clothing layer'+(counts.shown===1?'':'s')+
   ' displayed; '+counts.skipped+' held for transparent-cutout review. '+
   (covered>0?covered+' selected '+(covered===1?'piece is':'pieces are')+
    ' mostly hidden behind other clothing. ':'')+
   'This is a local styling collage, not a fit or fabric simulation.'+
   (localFaceURL?' Your selfie is on-device only.':'');
  stage.setAttribute('aria-busy','false');
  if(retry)retry.hidden=counts.skipped===0;
  updatePhotoHelp(counts.skipped>0);
  if(revision===renderRevision)clearWatchdog();
  lastPlan=counts.skipped===0?plan:null;lastPlanOwner=owner;
 }
 // Coalesce same-turn board updates; only completed identical previews are reused.
 let scheduled=false,pageHidden=false;
 async function safeRender(){
  const attempt=renderRevision+1;
  try{await render();}catch{
   if(attempt!==renderRevision||pageHidden)return;
   lastPlan=null;garmentContainer.replaceChildren();removeFace();updatePhotoHelp(false);
   base.style.visibility='hidden';stage.setAttribute('aria-busy','false');
   status.textContent='Preview unavailable. Your clothes are saved; try again.';
   if(retry)retry.hidden=false;
  }finally{if(activeRender?.revision===attempt){activeRender=null;clearWatchdog();}}
 }
 function requestRender(){
  if(pageHidden||scheduled)return;
  scheduled=true;
  Promise.resolve().then(()=>{
   scheduled=false;if(pageHidden)return;
   // Background UI refreshes must not restart the same pending image work or
   // postpone its timeout. New photos/board/account/database still replace it.
   try{
    const board=typeof currentBoard==='undefined'?null:currentBoard;
    if(activeRender?.revision===renderRevision&&
      activeRender.owner===(root.closetAuth?.user?.id||null)&&
      activeRender.database===(typeof db==='undefined'?null:db)&&
      activeRender.boardState===JSON.stringify(board)&&
      engine.samePlan(activeRender.plan,engine.plan(board,
       typeof items==='undefined'?[]:items,selector.value)))return;
   }catch{/* The guarded render reports unavailable planning/canvas state. */}
   // A timed-out identical request stays visibly retryable until an actual
   // user retry or an input change; background repaint cannot clear the hold.
   const owner=root.closetAuth?.user?.id||null;
   const dbNow=typeof db==='undefined'?null:db;
   const board=typeof currentBoard==='undefined'?null:currentBoard;
   if(stalledState&&sameRequest(stalledState,{
    owner,database:dbNow,boardState:JSON.stringify(board),
    plan:engine.plan(board,typeof items==='undefined'?[]:items,selector.value)
   }))return;
   return safeRender();
  });
 }
 root.renderReusableFigurePreview=requestRender;
 Promise.resolve(typeof outfitBoardReady==='undefined'?null:outfitBoardReady)
  .then(requestRender).catch(()=>{status.textContent='Preview unavailable; your saved closet is unchanged.';});
 root.addEventListener('pageshow',()=>{if(pageHidden){pageHidden=false;requestRender();}});
 root.addEventListener('pagehide',()=>{pageHidden=true;++renderRevision;clearWatchdog();stalledState=null;activeRender=null;lastPlan=null;lastPlanOwner=null;previewCache?.dispose();
  garmentContainer.replaceChildren();removeFace();stage.setAttribute('aria-busy','false');});
})(window);
