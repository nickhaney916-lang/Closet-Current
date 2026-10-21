'use strict';
// Keep more fabric, sole and seam detail in ordinary imports when the source
// and available storage permit. These are bounded JPEG derivatives, NOT
// unchanged native sensor/EXIF files; recognition still precedes any masking.
async function photoToJPEG(file,{maxDimension=3072,quality=.94,maxDataURLLength=2850000}={}){
 if(!Number.isInteger(maxDimension)||maxDimension<1||maxDimension>4096||
    !Number.isInteger(maxDataURLLength)||maxDataURLLength<1024||
    maxDataURLLength>10000000||!Number.isFinite(quality)||quality<.5||quality>1)throw Error('Invalid photo conversion limits.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;
  // Unsupported phone codecs and damaged images cannot stall a photo batch.
  let timer;
  try{await Promise.race([image.decode(),new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error('Photo decoding timed out.')),15000);
  })]);}finally{clearTimeout(timer);}
  if(!image.width||!image.height)throw Error('No image content');
  const canvas=document.createElement('canvas'),longest=Math.max(image.width,image.height);
  // Prefer a slightly lower JPEG quality at the SAME pixels over losing
  // shoe stitching, fabric texture, and prints by reducing both dimensions.
  // Three bounded attempts per frame preserve the existing encoded backup cap.
  const qualities=[quality,...[.88,.82].filter(q=>q<quality)];
  const targets=[maxDimension,...[2560,2048,1536,1024].filter(n=>n<maxDimension)];
  for(const target of targets){
   const scale=Math.min(1,target/longest);
   canvas.width=Math.max(1,Math.round(image.width*scale));
   canvas.height=Math.max(1,Math.round(image.height*scale));
   const context=canvas.getContext('2d');
   if(!context)throw Error('Unable to prepare this image.');
   context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
   context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);
   context.drawImage(image,0,0,canvas.width,canvas.height);
   for(const jpegQuality of qualities){
    const jpeg=canvas.toDataURL('image/jpeg',jpegQuality);
    if(jpeg==='data:,')throw Error('Unable to encode this image.');
    if(jpeg.length<=maxDataURLLength)return jpeg;
   }
   // Only reduce pixel dimensions after bounded quality attempts fail.
   // Every output still stays inside the existing backup/image-string budget.
  }
  throw Error('Photo is too large after conversion. Try a closer photo.');
 }finally{URL.revokeObjectURL(url);}
}
async function readPhotoBatch(files,decode,onPhoto){
 const errors=[],results=[];let added=0;
 for(const file of files){
  let reason=null;
  if(file.size>10*1024*1024)reason='larger than 10 MB';
  else{
   // iOS share sheets and exported pictures sometimes supply an empty MIME.
   // Decode is still authoritative: a renamed non-image must not be added.
   const mime=typeof file.type==='string'?file.type.toLowerCase():'';
   const extension=/\.(?:jpe?g|png|webp|avif|heic|heif)$/i.test(file.name||'');
   if(!mime.startsWith('image/')&&!(extension&&(!mime||mime==='application/octet-stream')))
    reason='not an image';
  }
  if(reason){errors.push(file.name+': '+reason);results.push({name:file.name,status:'rejected',reason});continue;}
  try{
   const image=await decode(file),accepted=await onPhoto(image,file);
   if(accepted===false){results.push({name:file.name,status:'duplicate',reason:'exact duplicate image'});}
   else{added++;results.push({name:file.name,status:'added'});}
  }catch(error){
   reason=error instanceof Error?error.message:'unknown error';
   errors.push(file.name+': could not open; try JPEG or PNG');
   results.push({name:file.name,status:'error',reason});
  }
 }
 return {added,errors,results};
}
