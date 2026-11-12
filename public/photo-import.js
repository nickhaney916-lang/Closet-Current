'use strict';
async function photoToJPEG(file,{maxDimension=2048,quality=.94}={}){
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  if(!image.width||!image.height)throw Error('No image content');
  const scale=Math.min(1,maxDimension/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',quality);
 }finally{URL.revokeObjectURL(url);}
}
async function readPhotoBatch(files,decode,onPhoto,{shouldContinue=()=>true}={}){
 const errors=[],results=[];let added=0,cancelled=false;
 // The optional owner-session lease is checked before *every* decode and
 // after each await. Revocation must not decode the remaining camera photos,
 // count an abandoned item as a duplicate, or publish a former owner's error.
 for(const file of files){
  if(!shouldContinue()){cancelled=true;break;}
  let reason=null;
  if(file.size>10*1024*1024)reason='larger than 10 MB';
  else if(!file.type.startsWith('image/')&&!/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name))reason='not an image';
  if(reason){errors.push(file.name+': '+reason);results.push({name:file.name,status:'rejected',reason});continue;}
  try{
   const image=await decode(file);
   if(!shouldContinue()){cancelled=true;break;}
   const accepted=await onPhoto(image,file);
   if(!shouldContinue()){cancelled=true;break;}
   if(accepted===false){results.push({name:file.name,status:'duplicate',reason:'exact duplicate image'});}
   else{added++;results.push({name:file.name,status:'added'});}
  }catch(error){
   if(!shouldContinue()){cancelled=true;break;}
   reason=error instanceof Error?error.message:'unknown error';
   errors.push(file.name+(error?.code==='CAPTURE_STORAGE_FAILED'?': photo not saved to device; free storage and retry before leaving this page':': could not open; try JPEG or PNG'));
   results.push({name:file.name,status:'error',reason});
  }
 }
 return cancelled?{added,errors,results,cancelled:true}:{added,errors,results};
}

