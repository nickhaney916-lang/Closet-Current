// Pixel-level segmentation scoring. A reference mask must come from human-reviewed
// annotation, never from the model prediction being evaluated.
export function scoreGarmentMask(reference,prediction,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||reference?.length!==width*height||prediction?.length!==width*height)throw Error('Invalid segmentation benchmark masks');
 let truePositive=0,falsePositive=0,falseNegative=0,trueNegative=0;
 for(let i=0;i<reference.length;i++){
  const truth=reference[i],pred=prediction[i];
  if(![0,1].includes(truth)||![0,1].includes(pred))throw Error('Masks must be binary 0/1');
  if(truth&&pred)truePositive++;
  else if(!truth&&pred)falsePositive++;
  else if(truth&&!pred)falseNegative++;
  else trueNegative++;
 }
 const divide=(a,b)=>b?a/b:null;
 return {width,height,truePositive,falsePositive,falseNegative,trueNegative,
  garmentRecall:divide(truePositive,truePositive+falseNegative),
  garmentPrecision:divide(truePositive,truePositive+falsePositive),
  intersectionOverUnion:divide(truePositive,truePositive+falsePositive+falseNegative),
  backgroundContaminationRate:divide(falsePositive,falsePositive+trueNegative)};
}
export function decodeReferenceMask(annotation){
 const {width,height,runs}=annotation||{};
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>12e6||!Array.isArray(runs)||runs.length>width*height)throw Error('Invalid garment annotation');
 const mask=new Uint8Array(width*height);let offset=0,foreground=false;
 for(const count of runs){
  if(!Number.isInteger(count)||count<0||offset+count>mask.length)throw Error('Invalid annotation run');
  if(foreground)mask.fill(1,offset,offset+count);
  offset+=count;foreground=!foreground;
 }
 if(offset!==mask.length)throw Error('Incomplete annotation');
 return mask;
}

export function approvedReferenceMask(annotation,manifestEntry){
 if(!manifestEntry||annotation?.schemaVersion!==1||annotation.reviewStatus!=='approved')throw Error('Annotation not independently approved');
 if(annotation.image!==manifestEntry.image||annotation.sourceSha256!==manifestEntry.sourceSha256)throw Error('Annotation source mismatch');
 if(typeof annotation.reviewer!=='string'||!annotation.reviewer.trim()||typeof annotation.approvedBy!=='string'||!annotation.approvedBy.trim()||annotation.reviewer.trim()===annotation.approvedBy.trim())throw Error('Independent second reviewer required');
 const mask=decodeReferenceMask(annotation);
 const marked=mask.reduce((sum,v)=>sum+v,0);
 if(marked===0||marked===mask.length)throw Error('Annotation must contain garment and background');
 return mask;
}

export function scoreApprovedPrediction(annotation,manifestEntry,prediction){
 const reference=approvedReferenceMask(annotation,manifestEntry);
 if(!prediction||prediction.width!==annotation.width||prediction.height!==annotation.height||prediction.image!==manifestEntry.image||prediction.sourceSha256!==manifestEntry.sourceSha256)throw Error('Prediction source or dimensions mismatch');
 const predicted=decodeReferenceMask(prediction);
 return {image:manifestEntry.image,...scoreGarmentMask(reference,predicted,annotation.width,annotation.height)};
}

export function scoreApprovedPredictionAtReferenceResolution(annotation,manifestEntry,prediction){
 const reference=approvedReferenceMask(annotation,manifestEntry);
 if(!prediction||prediction.image!==manifestEntry.image||prediction.sourceSha256!==manifestEntry.sourceSha256)throw Error('Prediction source mismatch');
 const predicted=decodeReferenceMask(prediction);
 const {width:rw,height:rh}=annotation,{width:pw,height:ph}=prediction;
 if(rw/pw!==rh/ph)throw Error('Different image aspect ratios');
 const aligned=new Uint8Array(rw*rh);
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++)aligned[y*rw+x]=predicted[Math.min(ph-1,Math.floor((y+.5)*ph/rh))*pw+Math.min(pw-1,Math.floor((x+.5)*pw/rw))];
 return {image:manifestEntry.image,referenceWidth:rw,referenceHeight:rh,predictionWidth:pw,predictionHeight:ph,alignment:'nearest-neighbor at reference resolution',...scoreGarmentMask(reference,aligned,rw,rh)};
}
