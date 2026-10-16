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
  if(!Number.isInteger(maxImages)||maxImages<1||maxImages>4)throw Error('Cloudflare accepts at most four references.');
  // Reserve reference image 0 for the consistent adult model; three garment photos remain.
  const priority=['top','bottom','layer','layer2','layer3','shoes','bag','accessory'];
  const images=[...prepared.garments].sort((a,b)=>priority.indexOf(a.slot)-priority.indexOf(b.slot));
  return {included:images.slice(0,maxImages),excluded:images.slice(maxImages),maxImages};
 }
 root.ClosetAIPreview={prepare,selectCloudflareReferences};
 if(typeof module!=='undefined')module.exports={prepare};
})(typeof window!=='undefined'?window:globalThis);
