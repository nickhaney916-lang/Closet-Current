export function scoreReviewedShadowCleanup({baseline,candidate,garment,shadow}){
 const inputs={baseline,candidate,garment,shadow};
 const lengths=Object.values(inputs).map(v=>v?.length);
 if(lengths.some(n=>!Number.isInteger(n)||n===0)||new Set(lengths).size!==1)throw Error('All four masks must have equal nonzero dimensions');
 for(const [name,arr] of Object.entries(inputs))for(const v of arr)if(v!==0&&v!==1)throw Error(name+' contains nonbinary values');
 let garmentCount=0,shadowCount=0,baselineGarment=0,candidateGarment=0,baselineShadow=0,candidateShadow=0,added=0,baselineBackground=0,candidateBackground=0;
 for(let i=0;i<baseline.length;i++){
  if(garment[i]&&shadow[i])throw Error('Reviewed garment and shadow masks overlap');
  garmentCount+=garment[i];shadowCount+=shadow[i];
  if(garment[i]){baselineGarment+=baseline[i];candidateGarment+=candidate[i];}
  if(shadow[i]){baselineShadow+=baseline[i];candidateShadow+=candidate[i];}
  if(!garment[i]&&!shadow[i]){baselineBackground+=baseline[i];candidateBackground+=candidate[i];}
  if(candidate[i]&&!baseline[i])added++;
 }
 if(!garmentCount||!shadowCount)throw Error('Reviewed regions must include real garment and shadow pixels');
 const garmentRetention=candidateGarment/garmentCount;
 const baselineRetention=baselineGarment/garmentCount;
 const shadowRemoval=baselineShadow-candidateShadow;
 const garmentFullyPreserved=candidateGarment===garmentCount;
 const shadowRemovalRate=baselineShadow?shadowRemoval/baselineShadow:0;
 const backgroundLeakageDelta=candidateBackground-baselineBackground;
 return {garmentRetention,garmentFullyPreserved,shadowRemovalRate,baselineBackgroundPixels:baselineBackground,candidateBackgroundPixels:candidateBackground,backgroundLeakageDelta,baselineGarmentRetention:baselineRetention,garmentPixelsLostComparedToBaseline:baselineGarment-candidateGarment,shadowPixelsRemovedComparedToBaseline:shadowRemoval,baselineShadowPixels:baselineShadow,candidateShadowPixels:candidateShadow,addedForegroundPixels:added,improvedWithoutGarmentLoss:shadowRemoval>0&&garmentFullyPreserved&&added===0,verified:true};
}
