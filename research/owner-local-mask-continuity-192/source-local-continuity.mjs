/**
 * Closet Current MAIN P192 — local missing-fabric continuity for the single
 * source-pinned licensed blouse. This never asserts independent human review.
 *
 * P191's global IoU/component/hole totals can overlook an owner-alpha slit
 * that connects to background and therefore is not counted as an internal
 * hole. Inspect intact original-source horizontal segments for sustained
 * missing interior fabric before any physical 163-bone deformation.
 * Called only after P191's owner PNG byte SHA and source identity checks.
 */
const fail=message=>{throw Error('P192 '+message);};
const valid=(p,w,h)=>p instanceof Uint8Array&&p.length===w*h;
export function verifyLocalSourceContinuity192({
 sourcePixels,ownerPixels,width,height
}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||
    width<32||height<32||width*height>192*192||
    !valid(sourcePixels,width,height)||!valid(ownerPixels,width,height))
  fail('bounded actual decoded binary source and owner alpha required');
 let inspectedRows=0,maxMissing=0,maxStreak=0,streak=0;
 let affectedRows=0;
 for(let y=0;y<height;y++){
  let x=0,seenCore=false,concerning=false,severe=false;
  while(x<width){
   if(sourcePixels[y*width+x]!==1){x++;continue;}
   const start=x;
   while(x<width&&sourcePixels[y*width+x]===1)x++;
   const span=x-start;
   // Leave real source neckline, strap and sleeve negative-space topology
   // intact. Only inspect robust contiguous bands with a genuine interior.
   if(span<Math.max(20,Math.ceil(width*.16)))continue;
   const margin=Math.max(2,Math.ceil(span*.08));
   if(span<=2*margin+6)continue;
   seenCore=true;
   const minRun=Math.max(4,Math.ceil(span*.10));
   const severeRun=Math.max(8,Math.ceil(span*.22));
   let run=0,worst=0;
   for(let k=start+margin;k<x-margin;k++){
    if(ownerPixels[y*width+k]!==1)run++;
    else run=0;
    if(run>worst)worst=run;
   }
   maxMissing=Math.max(maxMissing,worst);
   if(worst>=minRun)concerning=true;
   if(worst>=severeRun)severe=true;
  }
  if(seenCore)inspectedRows++;
  if(concerning){
   affectedRows++;
   streak++;
   maxStreak=Math.max(maxStreak,streak);
  }else streak=0;
  // A wide missing tear is unsafe even on one raster row. Two sustained
  // localized smaller tears also fail; the global IoU may remain excellent.
  if(severe||streak>=2)
   fail('source garment has an unreviewable localized missing-fabric slit');
 }
 if(inspectedRows<Math.ceil(height*.2))
  fail('too few intact source garment core rows for local continuity evidence');
 return Object.freeze({
  ownerSourceInteriorContinuous192:true,
  inspectedOriginalSourceCoreRows192:inspectedRows,
  maxInteriorMissingRunPixels192:maxMissing,
  concerningSourceRows192:affectedRows,
  maxConsecutiveConcerningRows192:maxStreak,
  licensePinnedBlouseOnly:true,
  independentHumanReviewVerified:false,
  generalGarmentSegmentationCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
