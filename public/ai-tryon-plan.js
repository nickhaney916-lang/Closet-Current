'use strict';
(function(root){
 const FIGURES=Object.freeze([{id:'female',label:'Female AI model'},{id:'male',label:'Male AI model'}]);
 // v1.6 only understands tops, bottoms and one-pieces. Shoes, accessories
 // and coat layering are deferred; never advertise them as rendered.
 const LIMIT=2, MAX_IMAGE_CHARS=7_500_000;
 function validImage(value){return typeof value==='string'&&value.length>24&&value.length<=MAX_IMAGE_CHARS&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);}
 function figure(value){return FIGURES.some(x=>x.id===value)?value:'female';}
 function plan(board,closet){
  const selected=board?.slots||{},items=Array.isArray(closet)?closet:[],
   find=id=>items.find(x=>x.id===id);
  const top=find(selected.top),dress=top?.category==='Dresses';
  const ordered=dress?[['top','one-pieces']]:[['top','tops'],['bottom','bottoms']];
  const steps=[];
  for(const [slot,category] of ordered){
   const item=find(selected[slot]);
   if(!item||!(slot==='top'?['Tops','Dresses'].includes(item.category):item.category==='Bottoms'))continue;
   // A whole-outfit originalPhoto may contain people and unrelated items.
   // Use the cropped catalog garment itself as the try-on reference.
   const image=item.image;
   if(!validImage(image))continue;
   steps.push({slot,category,image,itemId:item.id});
  }
  return {steps:steps.slice(0,LIMIT),
   unsupportedSlots:Object.keys(selected).filter(x=>!steps.some(step=>step.slot===x)),
   dress,completeOutfit:false};
 }
 const api={FIGURES,figure,plan,validImage,MAX_IMAGE_CHARS};
 root.AiTryOnPlan=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
