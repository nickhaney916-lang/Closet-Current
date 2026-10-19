'use strict';
// Free, local display-only figure layering. No model/provider calls, photo
// uploads, item mutations, or persistence of user selfies occur here.
(function(root){
 const FIGURES=Object.freeze({
  female:'ai-models/female-preview.webp',
  male:'ai-models/male-preview.webp'
 });
 const RECTS=Object.freeze({
  top:{left:22,top:17,width:56,height:35},
  bottom:{left:27,top:43,width:46,height:41},
  layer:{left:18,top:17,width:64,height:38},
  layer2:{left:16,top:16,width:68,height:44},
  layer3:{left:14,top:14,width:72,height:50},
  shoes:{left:18,top:86,width:64,height:12}
 });
 const ORDER=['bottom','top','layer','layer2','layer3','shoes'];
 const allowed=Object.freeze({
  top:['Tops','Dresses'],bottom:['Bottoms'],layer:['Tops','Outerwear'],
  layer2:['Outerwear'],layer3:['Outerwear'],shoes:['Shoes']
 });
 function isLocalGarmentImage(value){
  return typeof value==='string'&&value.length>=90&&value.length<=12_000_000&&
   /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
 }
 function plan(board,closet,figure='female'){
  const choice=Object.hasOwn(FIGURES,figure)?figure:'female';
  const slots=board?.slots||{},used=new Set(),placements=[],skipped=[];
  const source=Array.isArray(closet)?closet:[];
  const dress=source.find(x=>x.id===slots.top&&x.category==='Dresses');
  const selections=dress?['top','shoes']:ORDER;
  for(const slot of selections){
   if(!slots[slot])continue;
   const item=source.find(x=>x.id===slots[slot]);
   if(!item||!allowed[slot].includes(item.category)||used.has(item.id)||
    !isLocalGarmentImage(item.image)){
    skipped.push(slot);continue;
   }
   used.add(item.id);
   placements.push({slot,itemId:item.id,image:item.image,
    rect:dress&&slot==='top'?{left:19,top:16,width:62,height:67}:RECTS[slot]});
  }
  return {figure:choice,figureImage:FIGURES[choice],placements,skipped,
   excludesAccessories:true,usesOwnedGarmentsOnly:true,usesRemoteAI:false,
   needsTransparentCutouts:true,fitAndImageQualityVerified:false};
 }
 root.ClosetReusableFigure=Object.freeze({FIGURES,RECTS,isLocalGarmentImage,plan});
 if(typeof module!=='undefined')module.exports=root.ClosetReusableFigure;
})(typeof window!=='undefined'?window:globalThis);
