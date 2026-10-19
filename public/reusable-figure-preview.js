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
   return out.toDataURL('image/png');
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
  const plan=engine.plan(typeof currentBoard==='undefined'?null:currentBoard,
   typeof items==='undefined'?[]:items,selector.value);
  base.src=plan.figureImage;
  positionFace();
  garmentContainer.replaceChildren();
  const counts={shown:0,skipped:plan.skipped.length};
  for(const placement of plan.placements){
   const imgSource=await imagePixels(placement.image,placement.category,placement.primaryColor);
   if(revision!==renderRevision)return;
   if(!imgSource){counts.skipped++;continue;}
   // Deform display-only transparent cutout using a deterministic local mesh.
   // The unmasked saved original and item pixels remain untouched.
   let fitted=imgSource;
   if(placement.slot!=='shoes'&&root.ClosetGarmentWarp){
    const garment=new Image();garment.src=imgSource;
    try{
     await garment.decode();
     if(revision!==renderRevision)return;
     const warped=root.ClosetGarmentWarp.warpTransparentImage(
       garment,placement.category,document.createElement('canvas'));
     if(warped)fitted=warped;
    }catch{/* Fall back to the intact transparent cutout, never invent pixels. */}
   }
   const img=document.createElement('img');
   img.src=fitted;
   img.alt='';
   img.className='reusable-figure-layer';
   for(const [key,value] of Object.entries(placement.rect))
    img.style[key]=value+'%';
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
