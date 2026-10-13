'use strict';
async function photoToJPEG(file,{maxDimension=900,quality=.8}={}){
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
async function readPhotoBatch(files,decode,onPhoto){
 const errors=[];let added=0;
 for(const file of files){
  if(file.size>10*1024*1024){errors.push(file.name+': larger than 10 MB');continue;}
  if(!file.type.startsWith('image/')&&!/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name)){errors.push(file.name+': not an image');continue;}
  try{const image=await decode(file);if(await onPhoto(image)!==false)added++;}catch{errors.push(file.name+': could not open; try JPEG or PNG');}
 }
 return {added,errors};
}
