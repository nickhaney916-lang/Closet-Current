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
 let renderRevision=0,localFaceURL=null;
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
 async function imagePixels(value){
  const photo=new Image();photo.src=value;
  try{await photo.decode();}catch{return null;}
  const w=photo.naturalWidth,h=photo.naturalHeight;
  if(w<24||h<24||w*h>20_000_000)return null;
  const scale=Math.min(1,Math.sqrt(150000/(w*h)));
  const c=document.createElement('canvas');
  c.width=Math.max(24,Math.floor(w*scale));c.height=Math.max(24,Math.floor(h*scale));
  const ctx=c.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  try{ctx.drawImage(photo,0,0,c.width,c.height);
   const pixels=ctx.getImageData(0,0,c.width,c.height);
   const white=root.ClosetWhiteMatte;
   if(white?.hasTransparentBackground(pixels.data,c.width,c.height))
    return c.toDataURL('image/png');
   // Safe white-paper removal is optional and cannot reconstruct a garment.
   const matte=white?.analyze(pixels.data,c.width,c.height);
   if(matte?.eligible===true&&matte.alpha?.length===c.width*c.height){
    for(let i=0;i<matte.alpha.length;i++)pixels.data[i*4+3]=matte.alpha[i];
    ctx.putImageData(pixels,0,0);
    return c.toDataURL('image/png');
   }
  }catch{return null;}
  return null;
 }
 async function render(){
  const revision=++renderRevision;
  const plan=engine.plan(typeof currentBoard==='undefined'?null:currentBoard,
   typeof items==='undefined'?[]:items,selector.value);
  base.src=plan.figureImage;
  garmentContainer.replaceChildren();
  const counts={shown:0,skipped:plan.skipped.length};
  for(const placement of plan.placements){
   const imgSource=await imagePixels(placement.image);
   if(revision!==renderRevision)return;
   if(!imgSource){counts.skipped++;continue;}
   const img=document.createElement('img');
   img.src=imgSource;
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
