'use strict';
(function(root){
 const SLOTS=['top','bottom','layer','layer2','layer3','shoes','bag','accessory'];
 const MAX_ITEMS=8;
 function prepare(board,closet,{model='neutral-adult'}={}){
  if(!board||!board.slots||!Array.isArray(closet))throw Error('An outfit and saved clothes are required.');
  const byId=new Map(closet.map(item=>[item.id,item]));
  const dress=byId.get(board.slots.top)?.category==='Dresses';
  const garments=[];
  for(const slot of SLOTS){
   if(dress&&slot==='bottom')continue;
   const item=byId.get(board.slots[slot]);
   if(!item||typeof item.image!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,/i.test(item.image))continue;
   garments.push({slot,itemId:String(item.id),name:String(item.name||item.itemType||'Garment').slice(0,120),
    category:String(item.category||'Unknown').slice(0,60),type:String(item.itemType||'Unknown').slice(0,60),
    color:String(item.color||'Unknown').slice(0,60),image:item.image});
  }
  if(garments.length<1)throw Error('Add an outfit with at least one saved garment photo first.');
  if(garments.length>MAX_ITEMS)throw Error('Too many garment references.');
  return {version:1,model,garments,requirements:{
   fullBody:true,studioBackground:true,consistentAdultModel:true,
   preserveGarmentAppearance:true,doNotInventExtraGarments:true,
   disclaimer:'AI visualization only; actual garment fit and details may differ.'
  }};
 }
 // Cloudflare FLUX.2 klein accepts at most four input images, each <512x512.
 // Restrict pilot references deterministically rather than silently uploading
 // every saved closet image. No network requests are made here.
 function selectCloudflareReferences(prepared,{maxImages=3}={}){
  if(!prepared||!Array.isArray(prepared.garments))throw Error('Prepare a selected outfit first.');
  if(!Number.isInteger(maxImages)||maxImages<1||maxImages>3)throw Error('Reserve one model image; choose at most three garment references.');
  // Reserve reference image 0 for the consistent adult model; three garment photos remain.
  const priority=['top','bottom','layer','layer2','layer3','shoes','bag','accessory'];
  const images=[...prepared.garments].sort((a,b)=>priority.indexOf(a.slot)-priority.indexOf(b.slot));
  return {included:images.slice(0,maxImages),excluded:images.slice(maxImages),maxImages};
 }
 function referenceDimensions(width,height,maxDimension=510){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Invalid photo dimensions.');
  if(!Number.isInteger(maxDimension)||maxDimension<1||maxDimension>510)throw Error('Image reference must remain below 512 pixels.');
  const scale=Math.min(1,maxDimension/Math.max(width,height));
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
 }
 // Local preprocessing only. Never updates the saved photo or contacts a server.
 async function resizeReference(dataUrl,{maxDimension=510,quality=.88}={}){
  if(typeof dataUrl!=='string'||!/^data:image[/](?:jpeg|png|webp);base64,/i.test(dataUrl))throw Error('A saved clothing photograph is required.');
  if(typeof document==='undefined'||typeof createImageBitmap!=='function')throw Error('Browser image decoding is unavailable.');
  const response=await fetch(dataUrl),blob=await response.blob();
  if(blob.size>16*1024*1024)throw Error('Reference photo is too large to prepare.');
  const bitmap=await createImageBitmap(blob);
  try{
   const dims=referenceDimensions(bitmap.width,bitmap.height,maxDimension),canvas=document.createElement('canvas');
   canvas.width=dims.width;canvas.height=dims.height;
   const context=canvas.getContext('2d');if(!context)throw Error('Could not prepare the clothing photograph.');
   context.fillStyle='#fff';context.fillRect(0,0,dims.width,dims.height);
   context.drawImage(bitmap,0,0,dims.width,dims.height);
   return {...dims,image:canvas.toDataURL('image/jpeg',quality)};
  }finally{bitmap.close();}
 }
 root.ClosetAIPreview={prepare,selectCloudflareReferences,referenceDimensions,resizeReference};
 if(typeof module!=='undefined')module.exports={prepare,selectCloudflareReferences,referenceDimensions};
})(typeof window!=='undefined'?window:globalThis);
