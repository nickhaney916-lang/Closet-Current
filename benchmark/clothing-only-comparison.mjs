// Review-only category-specific clothing mask selection. No app runtime imports this.
export const CLASS_SELECTION=Object.freeze({
  Dresses:Object.freeze([7]),
  Bottoms:Object.freeze([5,6]),
  Shoes:Object.freeze([9]),
  'Upper garment':Object.freeze([4]),
  Tops:Object.freeze([4]),
  Outerwear:Object.freeze([4]),
  Skirts:Object.freeze([5]),
  Skirt:Object.freeze([5]),
  Pants:Object.freeze([6]),
  Shorts:Object.freeze([6])
});
export const HOLDOUT_CATEGORY_IDS=Object.freeze([
  'validation-0001','validation-0003','validation-0010','validation-0017',
  'validation-0019','validation-0023','validation-0024'
]);
export function selectedCategoryMask(map,category,{minimumPixels=20}={}){
  const selected=CLASS_SELECTION[category];
  if(!selected||!Number.isInteger(minimumPixels)||minimumPixels<1)throw Error('Unknown or invalid garment category');
  const {width,height,labels,confidence}=map??{};
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1
    ||width*height>1024*1024||labels?.length!==width*height
    ||confidence?.length!==width*height)throw Error('Invalid category mask shape');
  const alpha=new Uint8Array(labels.length);
  let foregroundPixels=0,confidenceSum=0,otherGarmentPixels=0;
  for(let i=0;i<labels.length;i++){
    const l=labels[i];
    if(!Number.isInteger(l)||l<0||l>17)throw Error('Invalid category label');
    if(!Number.isFinite(confidence[i])||confidence[i]<0||confidence[i]>1)throw Error('Invalid confidence');
    if(selected.includes(l)){alpha[i]=255;foregroundPixels++;confidenceSum+=confidence[i];}
    else if([4,5,6,7,9,1,3,8,16,17].includes(l))otherGarmentPixels++;
  }
  return {width,height,alpha,foregroundPixels,otherGarmentPixels,
    detected:foregroundPixels>=minimumPixels,meanConfidence:foregroundPixels?confidenceSum/foregroundPixels:0,
    category,selectedClasses:[...selected],notPixelAccuracy:true,garmentOnlyVerified:false};
}
export function nativeCategoryAlpha(selected,nativeWidth,nativeHeight){
  if(!Number.isInteger(nativeWidth)||!Number.isInteger(nativeHeight)||nativeWidth<1||nativeHeight<1
    ||nativeWidth*nativeHeight>12000000||selected?.alpha?.length!==selected.width*selected.height)throw Error('Invalid image or mask dimensions');
  const result=new Uint8Array(nativeWidth*nativeHeight),sx=selected.width/nativeWidth,sy=selected.height/nativeHeight;
  for(let y=0;y<nativeHeight;y++){
    const row=Math.min(selected.height-1,Math.floor(y*sy))*selected.width;
    for(let x=0;x<nativeWidth;x++)result[y*nativeWidth+x]=selected.alpha[row+Math.min(selected.width-1,Math.floor(x*sx))];
  }
  return result;
}
export function assessGarmentOnlyComparison(cases){
  if(!Array.isArray(cases)||!cases.length)throw Error('No comparison cases');
  const missing=cases.filter(c=>c.maskDetected!==true).map(c=>c.id);
  return {status:'review-required',casesProcessed:cases.length,missingCategoryMasks:missing,
    clothingOnlyVerified:false,independentPixelReferences:false,mobileRuntimeVerified:false,
    productionAuthorized:false,accuracyPercentage:null};
}
