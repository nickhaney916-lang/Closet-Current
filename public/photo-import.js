'use strict';
async function photoToJPEG(file,{maxDimension=2048,quality=.94,decodeTimeout=0}={}){
 const url=URL.createObjectURL(file);let timer;
 try{
  const image=new Image();image.src=url;
  const decoded=image.decode();
  if(decodeTimeout>0)await Promise.race([decoded,new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error('decode timeout')),decodeTimeout);
  })]);
  else await decoded;
  if(!image.width||!image.height)throw Error('No image content');
  const scale=Math.min(1,maxDimension/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',quality);
 }finally{if(timer!==undefined)clearTimeout(timer);URL.revokeObjectURL(url);}
}
async function readPhotoBatch(files,decode,onPhoto){
 const errors=[],results=[];let added=0;
 for(const file of files){
  let reason=null;
  if(file.size>10*1024*1024)reason='larger than 10 MB';
  else if(!file.type.startsWith('image/')&&!/\\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name))reason='not an image';
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
