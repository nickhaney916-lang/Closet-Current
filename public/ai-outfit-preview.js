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
 root.ClosetAIPreview={prepare};
 if(typeof module!=='undefined')module.exports={prepare};
})(typeof window!=='undefined'?window:globalThis);
