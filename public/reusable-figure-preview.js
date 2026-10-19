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
 if(!engine||!stage||!base||!garmentContainer||!selfie||!status||!selector||!upload||!remove)return;
 let renderRevision=0,localFaceURL=null,lastOwner=root.closetAuth?.user?.id||null;
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
  selfie.hidden=true;selfie.removeAttribute('src');upload.value='';
  if(localFaceURL)URL.revokeObjectURL(localFaceURL);
  localFaceURL=null;remove.hidden=true;
  if(faceControls)faceControls.hidden=true;
  for(const input of faceInputs)if(input)input.value='0';
 }
 upload.addEventListener('change',()=>{
  const file=upload.files?.[0];
  removeFace();
  if(!file)return;
  if(!acceptableFace(file)){status.textContent='Use a JPEG, PNG or WebP selfie smaller than 8 MB.';return;}
  localFaceURL=URL.createObjectURL(file);
  selfie.src=localFaceURL;selfie.hidden=false;remove.hidden=false;
  if(faceControls)faceControls.hidden=false;positionFace();
  status.textContent='Selfie face overlay is on this device only. Preview placement is approximate; nothing was uploaded or saved.';
 });
 remove.addEventListener('click',()=>{removeFace();render();});
 selector.addEventListener('change',()=>{positionFace();render();});
 async function imagePixels(value,category,primaryColor){
  const photo=new Image();photo.src=value;
  try{await photo.decode();}catch{return null;}
  const w=photo.naturalWidth,h=photo.naturalHeight;
  if(w<24||h<24||w*h>20_000_000)return null;
  const scale=Math.min(1,Math.sqrt(150000/(w*h)));
  const c=document.createElement('canvas');
  c.width=Math.max(24,Math.floor(w*scale));c.height=Math.max(24,Math.floor(h*scale));
  const ctx=c.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  // Analyze only a bounded copy; after approval, use the higher-resolution
  // source for native alpha. Matting stays conservative at its tested limit.
  function trimmed(source,pixels){
   const bounds=root.ClosetGarmentWarp?.alphaBounds(pixels.data,source.width,source.height);
   if(!bounds)return null;
   const out=document.createElement('canvas');out.width=bounds.width;out.height=bounds.height;
   const output=out.getContext('2d');if(!output)return null;
   output.drawImage(source,bounds.left,bounds.top,bounds.width,bounds.height,0,0,bounds.width,bounds.height);
   return {image:out.toDataURL('image/png'),width:bounds.width,height:bounds.height};
  }
  try{ctx.drawImage(photo,0,0,c.width,c.height);
   const pixels=ctx.getImageData(0,0,c.width,c.height);
   const white=root.ClosetWhiteMatte;
   if(white?.hasTransparentBackground(pixels.data,c.width,c.height)){
    const highScale=Math.min(1,Math.sqrt(600000/(w*h)));
    const high=document.createElement('canvas');
    high.width=Math.floor(w*highScale);high.height=Math.floor(h*highScale);
    const hi=high.getContext('2d',{willReadFrequently:true});if(!hi)return null;
    hi.drawImage(photo,0,0,high.width,high.height);
    return trimmed(high,hi.getImageData(0,0,high.width,high.height));
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
  const plan=engine.plan(typeof currentBoard==='undefined'?null:currentBoard,
   typeof items==='undefined'?[]:items,selector.value);
  base.src=plan.figureImage;
  positionFace();
  // Never show the previous outfit with the newly selected figure, nor
  // expose half an outfit while async decoding/compositing is in flight.
  garmentContainer.replaceChildren();
  status.textContent='Preparing local clothing preview…';
  const counts={shown:0,skipped:plan.skipped.length};
  const nextLayers=document.createDocumentFragment();
  const cancelled=()=>revision!==renderRevision||
   (root.closetAuth?.user?.id||null)!==owner;
  for(const placement of plan.placements){
   const query={owner,id:String(placement.itemId),source:placement.image,
    category:placement.category,primaryColor:placement.primaryColor||''};
   let prepared=previewCache?.get(query);
   if(!prepared){
    const cutout=await imagePixels(placement.image,placement.category,placement.primaryColor);
    if(cancelled())return;
    if(!cutout){counts.skipped++;continue;}
    let image=cutout.image;
    if(placement.slot!=='shoes'&&root.ClosetGarmentWarp){
     const garment=new Image();garment.src=cutout.image;
     try{
      await garment.decode();
      if(cancelled())return;
      const warped=root.ClosetGarmentWarp.warpTransparentImage(
       garment,placement.category,document.createElement('canvas'));
      if(warped)image=warped;
     }catch{/* Keep existing transparent cutout, never invent pixels. */}
    }
    if(cancelled())return;
    prepared={image,width:cutout.width,height:cutout.height};
    previewCache?.put(query,prepared);
   }
   // Preserve the calibrated female/male shoulder, waist and sole anchors,
   // without stretching garment prints or white/transparent empty margins.
   const rect=root.ClosetGarmentFitGeometry?.fitPlacement(
    placement.rect,prepared.width,prepared.height,
    {slot:placement.slot,category:placement.category});
   if(!rect){counts.skipped++;continue;}
   const img=document.createElement('img');
   img.src=prepared.image;
   img.alt='';
   img.className='reusable-figure-layer';
   for(const key of ['left','top','width','height'])img.style[key]=rect[key]+'%';
   nextLayers.append(img);counts.shown++;
  }
  if(cancelled())return;
  garmentContainer.replaceChildren(nextLayers);
  status.textContent=counts.shown+' owned clothing layer'+(counts.shown===1?'':'s')+
   ' displayed; '+counts.skipped+' held for transparent-cutout review. '+
   'This is a local styling collage, not a fit or fabric simulation.'+
   (localFaceURL?' Your selfie is on-device only.':'');
 }
 root.renderReusableFigurePreview=()=>{void render();};
 // This page is already tied to its existing signed-in local closet database.
 Promise.resolve(typeof outfitBoardReady==='undefined'?null:outfitBoardReady)
  .then(()=>{void render();}).catch(()=>{status.textContent='Preview unavailable; your saved closet is unchanged.';});
 root.addEventListener('pagehide',()=>{++renderRevision;previewCache?.dispose();
  garmentContainer.replaceChildren();removeFace();});
})(window);
