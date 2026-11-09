/**
 * P195: independent left/right, source-registered silhouette measurements
 * for ONE licensed blouse. Width-only P190 silently mirrors an asymmetric
 * reviewed photo. This algorithm keeps the two genuine decoded PNG edges
 * independently rather than inventing the reverse or extra garment parts.
 *
 * Input rows come from SHA-attested owner/source image readback behind
 * P191-P194 topology admission, not user-provided scalar metadata.
 */
const SRC='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const fail=message=>{throw Error('P195 '+message);};
const finite=v=>Number.isFinite(v);
export function deriveOwnerBilateralContour195({
 sourceRows,ownerRows,width,height,sourceSHA256,maskSHA256
}={}){
 if(sourceSHA256!==SRC||!/^[0-9a-f]{64}$/.test(maskSHA256||'')||
    !Number.isInteger(width)||!Number.isInteger(height)||
    width<32||height<32||width*height>8000000||
    !Array.isArray(sourceRows)||!Array.isArray(ownerRows)||
    sourceRows.length!==height||ownerRows.length!==height)
  fail('same-source, current owner SHA and actual registered decoded alpha row bounds required');
 const left=[],right=[];
 let valid=0,maxAsym=0;
 for(let b=0;b<12;b++){
  const begin=Math.round(height*(.08+b*.07));
  const end=Math.min(height,Math.round(height*(.08+(b+1)*.07)));
  let leftSum=0,rightSum=0,n=0;
  for(let y=begin;y<end;y++){
   const a=sourceRows[y],c=ownerRows[y];
   if(!a||!c||!finite(a.first)||!finite(a.last)||
      !finite(c.first)||!finite(c.last)||!finite(a.width)||!finite(c.width))
    fail('malformed pixel readback or source/owner row contour');
   if(a.width<Math.max(24,width*.12)||c.width<Math.max(24,width*.12))continue;
   if(c.first<a.first-width*.01||c.last>a.last+width*.01)
    fail('owner bilateral edge protrudes beyond registered source silhouette');
   const center=(a.first+a.last)/2;
   const l=(center-c.first)/(center-a.first),r=(c.last-center)/(a.last-center);
   if(!finite(l)||!finite(r)||l<.80||r<.80||l>1.05||r>1.05)
    fail('separate owner garment side contour outside physical support envelope');
   leftSum+=l;rightSum+=r;n++;
  }
  const l=n?leftSum/n:1,r=n?rightSum/n:1;
  left.push(l);right.push(r);valid+=n;
  maxAsym=Math.max(maxAsym,Math.abs(l-r));
 }
 if(valid<height*.32||maxAsym<.012)
  fail('requires measurable current owner alpha left/right asymmetry, not duplicated width ratios');
 return Object.freeze({
  sourceId195:'commons-0016',sourceSHA256:SRC,maskSHA256,
  ownerBilateralContourMeasured195:true,
  leftRatioBands195:Object.freeze(left),
  rightRatioBands195:Object.freeze(right),
  ownerBilateralAsymmetry195:maxAsym,
  bilateralEvidenceRows195:valid,
  physicallyReconstructsArbitraryGarment195:false,
  rearIndependentlyPhotographed195:false,
  humanSegmentationIndependentlyApproved195:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
