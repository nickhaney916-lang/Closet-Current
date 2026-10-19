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
 const acceptableFace=file=>file&&['image/jpeg','image/png','image/webp'].includes(file.type)&&
  file.size>0&&file.size<=8_000_000;
 function removeFace(){
  selfie.hidden=true;selfie.removeAttribute('src');upload.value='';
  if(localFaceURL)URL.revokeObjectURL(localFaceURL);
  localFaceURL=null;remove.hidden=true;
 }
 upload.addEventListener('change',()=>{
  const file=upload.files?.[0];
  removeFace();
  if(!file)return;
  if(!acceptableFace(file)){status.textContent='Use a JPEG, PNG or WebP selfie smaller than 8 MB.';return;}
  localFaceURL=URL.createObjectURL(file);
  selfie.src=localFaceURL;selfie.hidden=false;remove.hidden=false;
  status.textContent='Selfie face overlay is on this device only. Preview placement is approximate; nothing was uploaded or saved.';
 });
 remove.addEventListener('click',()=>{removeFace();render();});
 selector.addEventListener('change',()=>{render();});
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
  try{
   ctx.drawImage(photo,0,0,c.width,c.height);
   const pixels=ctx.getImageData(0,0,c.width,c.height);
   const white=root.ClosetWhiteMatte;
   if(!white?.hasTransparentBackground(pixels.data,c.width,c.height)){
    // Refuse to display opaque original-image rectangles as wearable clothes.
    // White-matte processing is conservative and never changes source images.
    const matte=white?.analyze(pixels.data,c.width,c.height,{category,primaryColor});
    if(matte?.eligible!==true||matte.alpha?.length!==c.width*c.height)return null;
    for(let i=0;i<matte.alpha.length;i++)pixels.data[i*4+3]=matte.alpha[i];
    ctx.putImageData(pixels,0,0);
   }
   // Trim only verified external transparent margins. The garment and source
   // remain unchanged; a new PNG is generated only for this local preview.
   const bounds=root.ClosetGarmentFitGeometry?.inspectAlpha(pixels.data,c.width,c.height);
   if(!bounds)return null;
   const {x,y,width,height}=bounds.crop;
   const cropped=document.createElement('canvas');cropped.width=width;cropped.height=height;
   const croppedCtx=cropped.getContext('2d');
   if(!croppedCtx)return null;
   croppedCtx.drawImage(c,x,y,width,height,0,0,width,height);
   return {src:cropped.toDataURL('image/png'),width,height};
  }catch{return null;}
 }
 async function render(){
  const revision=++renderRevision;
  const owner=root.closetAuth?.user?.id||null;
  if(owner!==lastOwner){removeFace();lastOwner=owner;}
  const plan=engine.plan(typeof currentBoard==='undefined'?null:currentBoard,
   typeof items==='undefined'?[]:items,selector.value);
  base.src=plan.figureImage;
  garmentContainer.replaceChildren();
  const counts={shown:0,skipped:plan.skipped.length};
  for(const placement of plan.placements){
   const prepared=await imagePixels(placement.image,placement.category,placement.primaryColor);
   if(revision!==renderRevision)return;
   if(!prepared){counts.skipped++;continue;}
   // Deform display-only transparent cutout using a deterministic local mesh.
   // Original high-resolution classification imagery stays untouched.
   let fitted=prepared.src;
   if(placement.slot!=='shoes'&&root.ClosetGarmentWarp){
    const garment=new Image();garment.src=prepared.src;
    try{
     await garment.decode();
     if(revision!==renderRevision)return;
     const warped=root.ClosetGarmentWarp.warpTransparentImage(
       garment,placement.category,document.createElement('canvas'));
     if(warped)fitted=warped;
    }catch{/* Fail open to existing transparent preview, never invent pixels. */}
   }
   // Preserve garment aspect ratio instead of stretching every item to an
   // identical rectangle. Upper garments align to shoulders; shoes to soles.
   const fittedRect=root.ClosetGarmentFitGeometry?.fitPlacement(
    placement.rect,prepared.width,prepared.height,placement.category);
   if(!fittedRect){counts.skipped++;continue;}
   const img=document.createElement('img');
   img.src=fitted;
   img.alt='';
   img.className='reusable-figure-layer';
   for(const key of ['left','top','width','height'])img.style[key]=fittedRect[key]+'%';
   garmentContainer.append(img);counts.shown++;
  }
  status.textContent=counts.shown+' owned clothing layer'+(counts.shown===1?'':'s')+
   ' displayed; '+counts.skipped+' held for transparent-cutout review. '+
   'This is a local styling collage, not a fit or fabric simulation.'+
   (localFaceURL?' Your selfie is on-device only.':'');
 }
 root.renderReusableFigurePreview=()=>{void render();};
 // This page is already tied to its existing signed-in local closet database.
 Promise.resolve(typeof outfitBoardReady==='undefined'?null:outfitBoardReady)
  .then(()=>{void render();}).catch(()=>{status.textContent='Preview unavailable; your saved closet is unchanged.';});
 root.addEventListener('pagehide',()=>{removeFace();});
})(window);
