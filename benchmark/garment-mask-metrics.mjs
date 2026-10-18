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
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>12e6||!Array.isArray(runs)||runs.length>width*height+1)throw Error('Invalid garment annotation');
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
 if(typeof annotation.reviewer!=='string'||!annotation.reviewer.trim()||typeof annotation.approvedBy!=='string'||!annotation.approvedBy.trim()||annotation.reviewer.trim().toLocaleLowerCase('en-US')===annotation.approvedBy.trim().toLocaleLowerCase('en-US'))throw Error('Independent second reviewer required');
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
 // Matching photos may be resized by the annotation editor with
 // rounded dimensions. Allow <= one reference pixel of rounding only for
 // large images; small synthetic masks retain exact aspect requirements.
 if((Math.min(rw,rh,pw,ph)<32&&rw*ph!==rh*pw)||
    (Math.min(rw,rh,pw,ph)>=32&&Math.abs(pw*rh/ph-rw)>1))
  throw Error('Different image aspect ratios');
 const aligned=new Uint8Array(rw*rh);
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++)aligned[y*rw+x]=predicted[Math.min(ph-1,Math.floor((y+.5)*ph/rh))*pw+Math.min(pw-1,Math.floor((x+.5)*pw/rw))];
 return {image:manifestEntry.image,referenceWidth:rw,referenceHeight:rh,predictionWidth:pw,predictionHeight:ph,alignment:'nearest-neighbor at reference resolution',...scoreGarmentMask(reference,aligned,rw,rh)};
}

// Quantify sampled foreground against an APPROVED garment outline.
// This scores mask contamination, not clothing color correctness.
export function erodeMaskInterior(mask,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
    width*height>12e6||mask?.length!==width*height)throw Error('Invalid interior mask');
 const core=new Uint8Array(mask.length);
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const i=y*width+x;
  if(!mask[i])continue;
  let all=true;
  for(let dy=-1;dy<=1&&all;dy++)for(let dx=-1;dx<=1;dx++)
   if(mask[i+dy*width+dx]!==1){all=false;break;}
  if(all)core[i]=1;
 }
 return core;
}
function alignPredictionToReference(mask,pw,ph,rw,rh){
 const aligned=new Uint8Array(rw*rh);
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++)
  aligned[y*rw+x]=mask[Math.min(ph-1,Math.floor((y+.5)*ph/rh))*pw+
    Math.min(pw-1,Math.floor((x+.5)*pw/rw))];
 return aligned;
}
export function scoreApprovedColorSampling(annotation,manifestEntry,prediction){
 const reference=approvedReferenceMask(annotation,manifestEntry);
 if(!prediction||prediction.image!==manifestEntry.image||
    prediction.sourceSha256!==manifestEntry.sourceSha256)
  throw Error('Prediction source mismatch');
 const predicted=decodeReferenceMask(prediction);
 const {width:rw,height:rh}=annotation,{width:pw,height:ph}=prediction;
 if((Math.min(rw,rh,pw,ph)<32&&rw*ph!==rh*pw)||
    (Math.min(rw,rh,pw,ph)>=32&&Math.abs(pw*rh/ph-rw)>1))
  throw Error('Different image aspect ratios');
 const interiorMask=erodeMaskInterior(predicted,pw,ph);
 const full=scoreGarmentMask(reference,alignPredictionToReference(predicted,pw,ph,rw,rh),rw,rh);
 const inner=scoreGarmentMask(reference,alignPredictionToReference(interiorMask,pw,ph,rw,rh),rw,rh);
 const total=full.truePositive+full.falsePositive,
       innerTotal=inner.truePositive+inner.falsePositive,
       referenceTotal=full.truePositive+full.falseNegative;
 return {
  image:manifestEntry.image,sourceSha256:manifestEntry.sourceSha256,
  referenceStatus:'independently-approved',
  method:'predicted-region overlap with human outline; no RGB accuracy measured',
  predictionDimensions:{width:pw,height:ph},referenceDimensions:{width:rw,height:rh},
  full:{foregroundPrecision:full.garmentPrecision,garmentRecall:full.garmentRecall,
    selectedPixels:total,backgroundPixelsSampled:full.falsePositive},
  interior:{foregroundPrecision:inner.garmentPrecision,garmentRecall:inner.garmentRecall,
    selectedPixels:innerTotal,backgroundPixelsSampled:inner.falsePositive},
  sampledPixelRetention:total?innerTotal/total:null,
  backgroundPixelsRemoved:full.falsePositive-inner.falsePositive,
  garmentPixelsRemoved:full.truePositive-inner.truePositive,
  additionalGarmentMissRate:referenceTotal?(full.truePositive-inner.truePositive)/referenceTotal:null
 };
}


/**
 * Diagnostic only: compare actual garment-edge retention against an independently
 * approved outline. The bottom band is relative to the reviewed garment's bounds,
 * not the photograph's bounds. It is a lower-edge warning, NOT a hem/sole label.
 * Masks and original RGB are read-only; no predicted pixels are repaired here.
 */
export function scoreApprovedGarmentEdgeRetention(annotation,manifestEntry,prediction,{
 lowerBandFraction=0.25
}={}){
 if(!Number.isFinite(lowerBandFraction)||lowerBandFraction<0.1||lowerBandFraction>0.5)
  throw Error('Invalid garment lower-band fraction');
 // Reuse the independent-review, source, dimension and aspect-ratio gates.
 const overall=scoreApprovedPredictionAtReferenceResolution(annotation,manifestEntry,prediction);
 const truth=approvedReferenceMask(annotation,manifestEntry);
 const {width,height}=annotation;
 const candidate=alignPredictionToReference(decodeReferenceMask(prediction),
  prediction.width,prediction.height,width,height);
 let minY=height,maxY=-1;
 for(let i=0;i<truth.length;i++)if(truth[i]){
  const y=Math.floor(i/width);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 // approvedReferenceMask already rejects empty and all-foreground annotations.
 const bandRows=Math.max(1,Math.ceil((maxY-minY+1)*lowerBandFraction));
 const lowerBandStart=maxY-bandRows+1;
 let garmentPixels=0,missingGarmentPixels=0,lowerGarmentPixels=0,
  missingLowerGarmentPixels=0,referenceBoundaryPixels=0,missingBoundaryPixels=0,
  lowerBoundaryPixels=0,missingLowerBoundaryPixels=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;if(!truth[i])continue;
  garmentPixels++;
  const missing=!candidate[i];
  if(missing)missingGarmentPixels++;
  const lower=y>=lowerBandStart;
  if(lower){lowerGarmentPixels++;if(missing)missingLowerGarmentPixels++;}
  let edge=false;
  for(let dy=-1;dy<=1&&!edge;dy++)for(let dx=-1;dx<=1;dx++){
   if(!dx&&!dy)continue;
   const xx=x+dx,yy=y+dy;
   if(xx<0||yy<0||xx>=width||yy>=height||!truth[yy*width+xx]){
    edge=true;break;
   }
  }
  if(edge){
   referenceBoundaryPixels++;if(missing)missingBoundaryPixels++;
   if(lower){lowerBoundaryPixels++;if(missing)missingLowerBoundaryPixels++;}
  }
 }
 return {
  image:manifestEntry.image,sourceSha256:manifestEntry.sourceSha256,
  referenceStatus:'independently-approved',method:'exact reference-pixel overlap; no inferred hem or shoe-sole labels',
  boundaryPixelRecall:referenceBoundaryPixels?
   (referenceBoundaryPixels-missingBoundaryPixels)/referenceBoundaryPixels:null,
  missingBoundaryPixels,referenceBoundaryPixels,
  lowerBandFraction,lowerBandStartRow:lowerBandStart,
  lowerBoundaryRecall:lowerBoundaryPixels?
   (lowerBoundaryPixels-missingLowerBoundaryPixels)/lowerBoundaryPixels:null,
  missingLowerBoundaryPixels,lowerBoundaryPixels,
  lowerGarmentRecall:lowerGarmentPixels?
   (lowerGarmentPixels-missingLowerGarmentPixels)/lowerGarmentPixels:null,
  missingLowerGarmentPixels,lowerGarmentPixels,
  missingGarmentPixels,garmentPixels,intersectionOverUnion:overall.intersectionOverUnion,
  verifiedHemOrSolePreservation:false,changesToPhotoOrIndex:false,
  productionAuthorized:false
 };
}
