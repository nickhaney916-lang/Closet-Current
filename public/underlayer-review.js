'use strict';
(function(root){
 function suggestion(item,result){
  const hint=item?.segmentHint,classes=hint?.categories;
  if(!Array.isArray(classes)||!classes.includes('Tops')||!classes.includes('Outerwear')
    ||hint.clipped||hint.layerRole==='outerwear'||item.userAdjusted||item.possibleDuplicate
    ||result?.strong===true&&result?.choices?.[0]?.itemType&&result.choices[0].itemType!=='Unknown')
    return null;
  if(result?.choices?.[0]?.category==='Outerwear'&&result?.choices?.[0]?.score>=.55)
    return null;
  // Broad class 4 cannot distinguish a jacket from a top. This is only a
  // suggested category, and MUST be explicitly confirmed on the photo card.
  return {proposedCategory:'Tops',layerRole:hint.layerRole==='underlayer'?'underlayer':'ambiguous-upper',
    needsUserVerification:true,specificType:'Unknown',sleeveLength:'Unknown',
    autoSaveAllowed:false};
 }
 function canConfirm(item){
  return item?.underlayerReview?.needsUserVerification===true
    &&item.underlayerReview.proposedCategory==='Tops'
    &&item.category==='Tops'&&item.itemType==='Unknown'
    &&typeof item.color==='string'&&item.color.trim().length>0&&item.color!=='Unknown'
    &&!item.possibleDuplicate&&!item.scanFailed&&!item.saveFailed;
 }
 const api={suggestion,canConfirm};
 root.UnderlayerReview=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
