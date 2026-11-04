'use strict';
(function(root){
 const allowed=Object.freeze(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']);
 function needsReview(item){return item?.category==='Uncategorized';}
 function pending(items,skipped=new Set()){
  if(!Array.isArray(items))return [];
  return items.filter(x=>x&&typeof x.id==='string'&&needsReview(x)&&!skipped.has(x.id));
 }
 function confirm(item,category,color,colors){
  if(!needsReview(item)||typeof item.id!=='string'||
   !allowed.includes(category)||typeof color!=='string'||
   !Array.isArray(colors)||!colors.includes(color))
   throw Error('Choose a clothing category and color for this unsorted photo.');
  // Preserve both original full resolution and any recognition reference.
  // Do not let an old model item type, body-fit or sleeve hint survive a
  // manual change to an entirely different clothing category.
  const next={...item,category,color,itemType:'Unknown',
   sleeveLength:['Bottoms','Shoes','Accessories'].includes(category)?
    'Not applicable':'Unknown',colorSource:'user',
   userAdjusted:true,requiresOwnershipConfirmation:false};
  delete next.colorMethod; // a manually confirmed color is not an AI mask estimate
  return next;
 }
 const api=Object.freeze({allowed,needsReview,pending,confirm});
 root.ClosetReviewEngine=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
