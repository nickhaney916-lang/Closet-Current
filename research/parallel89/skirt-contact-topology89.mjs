/**
 * P89: original-source photo skirt × genuine 163-bone anatomical torso contact
 * topology in measured source-triangle coordinates. All coordinates and raw
 * face-pair keys remain in process; only derived totals leave this verifier.
 *
 * P84 bvhcast indices are indexed triangles in original THREE merged skinned
 * posed geometry (original skirt face index | original anatomical face index).
 * Rows 0..5 each contain 48 angular sectors × two triangles, 576 total.
 * All 3 genuine source/blend-50/relaxed poses must be present. No original
 * privacy, source JPEG/cutout, or anatomical mesh edits. This is NOT clearance.
 */
const POSES=Object.freeze(['source','blend-50','relaxed']);
const FACE_COUNT=576,SECTORS=48,BANDS=6;
const isNum=n=>Number.isSafeInteger(n)&&n>=0;
const refusal=reason=>Object.freeze({
 schema:'P89-original-photographed-skirt-true-face-contact-topology/v1',
 status:'REAL_SOURCE_CONTACT_TOPOLOGY_NOT_VERIFIED',reason,
 releaseAuthorized:false,sourceOriginalPhoto2DFallback:true,familyAlpha:'HOLD'
});
const parsePair=(text,bodyCount)=>{
 if(typeof text!=='string'||!/^(0|[1-9][0-9]*)\|(0|[1-9][0-9]*)$/.test(text))
  throw Error('malformed-original-source-triangle-pair-ID');
 const [skirt,body]=text.split('|').map(Number);
 if(!isNum(skirt)||skirt>=FACE_COUNT||!isNum(body)||body>=bodyCount)
  throw Error('out-of-range-original-source-triangle-pair-ID');
 const band=Math.floor(skirt/(SECTORS*2));
 const sector=Math.floor((skirt%(SECTORS*2))/2);
 return {skirt,body,band,sector,
  sourceSurface:sector<12||sector>=36?'photo-front':'neutral-inferred-rear'};
};
const zeroSix=()=>Array(BANDS).fill(0);
function countRegion(ids,mask,bodyCount){
 const sourceBands=zeroSix(),frontBands=zeroSix(),inferredRearBands=zeroSix();
 let core=0,other=0,front=0,rear=0;
 for(const id of ids){
  const p=parsePair(id,bodyCount);
  sourceBands[p.band]++;
  if(p.sourceSurface==='photo-front'){front++;frontBands[p.band]++;}
  else{rear++;inferredRearBands[p.band]++;}
  if(mask[p.body]===1)core++;else other++;
 }
 return Object.freeze({
  pairCount:ids.size,sourceSkirtBands:sourceBands,
  photoFrontBands:frontBands,unobservedNeutralBackBands:inferredRearBands,
  photographedFrontStrictPairs:front,unobservedRearStrictPairs:rear,
  originalTorsoLegFaceStrictPairs:core,
  originalUpperExtremityHeadOrExcludedFaceStrictPairs:other
 });
}
/** pairs[] corresponds, in order, to the three real pose names. Body mask
 * must be byte-aligned with the ORIGINAL unmodified CC0 indexed anatomical
 * body source (not fitted/hidden/custom avatar). Raw triangle IDs never
 * appear in returned receipts or artifact outputs.
 */
export function summarizeOriginalPhotoSkirtContactTopology89({
 baseline,trial,bodyFaceMask,bodyFaceCount,avatar,trialName
}={}){
 if(!['female','male'].includes(avatar)||
   typeof trialName!=='string'||!/^[a-z0-9-]{2,32}$/.test(trialName)||
   !isNum(bodyFaceCount)||bodyFaceCount<1000||bodyFaceCount>500000||
   !(bodyFaceMask instanceof Uint8Array)||bodyFaceMask.length!==bodyFaceCount||
   !bodyFaceMask.some(x=>x===0)||!bodyFaceMask.some(x=>x===1)||
   bodyFaceMask.some(x=>x!==0&&x!==1)||
   !Array.isArray(baseline)||!Array.isArray(trial)||
   baseline.length!==3||trial.length!==3)
  return refusal('genuine-original-full-body-skin-source-triangle-indices-required');
 try{
  let countOriginal=0,countTrial=0,countNew=0,countResolved=0,countPersisted=0;
  const poses=[];
  for(let i=0;i<3;i++){
   const before=baseline[i],after=trial[i];
   if(!(before?.pairs instanceof Set)||!(after?.pairs instanceof Set)||
    !isNum(before.count)||!isNum(after.count)||
    before.pairs.size!==before.count||after.pairs.size!==after.count||
    !Number.isFinite(before.maxDepth)||before.maxDepth<0||
    !Number.isFinite(after.maxDepth)||after.maxDepth<0||
    before.trueOriginalSkirtTriangleIndexStable!==true||
    before.trueOriginalBodyTriangleIndexStable!==true||
    after.trueOriginalSkirtTriangleIndexStable!==true||
    after.trueOriginalBodyTriangleIndexStable!==true||
    before.originalFaceSourceResolution!=='BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES'||
    after.originalFaceSourceResolution!=='BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES')
    throw Error('original-skinned-posed-BVH-triangle-proof-missing');
   const introduced=new Set(),resolved=new Set(),persistent=new Set();
   for(const id of before.pairs){
    parsePair(id,bodyFaceCount);
    if(after.pairs.has(id))persistent.add(id);else resolved.add(id);
   }
   for(const id of after.pairs){
    parsePair(id,bodyFaceCount);
    if(!before.pairs.has(id))introduced.add(id);
   }
   if(introduced.size+persistent.size!==after.count||
     resolved.size+persistent.size!==before.count)
    throw Error('source-contact-triangle-set-ledger-inconsistent');
   countOriginal+=before.count;countTrial+=after.count;
   countNew+=introduced.size;countResolved+=resolved.size;
   countPersisted+=persistent.size;
   poses.push(Object.freeze({
    pose:POSES[i],
    before:countRegion(before.pairs,bodyFaceMask,bodyFaceCount),
    after:countRegion(after.pairs,bodyFaceMask,bodyFaceCount),
    introduced:countRegion(introduced,bodyFaceMask,bodyFaceCount),
    resolved:countRegion(resolved,bodyFaceMask,bodyFaceCount),
    persisted:countRegion(persistent,bodyFaceMask,bodyFaceCount),
    originalOrientedFacePlaneDepthMeters:before.maxDepth,
    candidateOrientedFacePlaneDepthMeters:after.maxDepth,
    increasedMaxPlaneDepth:after.maxDepth>before.maxDepth+.0005,
    originalSkinnedSourceRigBones:163,releaseAuthorized:false
   }));
  }
  const totalBy=k=>zeroSix().map((_,i)=>poses.reduce((n,p)=>n+p[k].sourceSkirtBands[i],0));
  const sourceSurfaceSums=key=>Object.freeze({
   photoFront:poses.reduce((n,p)=>n+p[key].photographedFrontStrictPairs,0),
   unphotographedBack:poses.reduce((n,p)=>n+p[key].unobservedRearStrictPairs,0),
   originalTorsoLeg:poses.reduce((n,p)=>n+p[key].originalTorsoLegFaceStrictPairs,0),
   armsHeadOrOther:poses.reduce((n,p)=>n+
    p[key].originalUpperExtremityHeadOrExcludedFaceStrictPairs,0)
  });
  return Object.freeze({
   schema:'P89-original-photographed-skirt-true-face-contact-topology/v1',
   status:'GENUINE_ORIGINAL_FULL_BODY_SOURCE_CONTACT_TURNOVER_MEASURED_NOT_CLEARANCE',
   avatar,trialName,originalSkirtSourceId:'commons-0043',
   originalSourceFaceIndicesAreStableAcrossBVHRebuilds:true,
   indirectOriginalFaceResolutionRequired:true,
   bodySourceFaceCount:bodyFaceCount,sourceSkirtFaceCount:FACE_COUNT,
   poses,originalStrictCrossingPairSum:countOriginal,
   trialStrictCrossingPairSum:countTrial,
   newlyIntroducedOriginalBodySkirtFacePairSum:countNew,
   resolvedOriginalBodySkirtFacePairSum:countResolved,
   persistedOriginalBodySkirtFacePairSum:countPersisted,
   originalContactBands:totalBy('before'),
   trialContactBands:totalBy('after'),
   introducedContactBands:totalBy('introduced'),
   resolvedContactBands:totalBy('resolved'),
   originalContactSurfaces:sourceSurfaceSums('before'),
   trialContactSurfaces:sourceSurfaceSums('after'),
   newlyIntroducedContactSurfaces:sourceSurfaceSums('introduced'),
   resolvedContactSurfaces:sourceSurfaceSums('resolved'),
   rawOriginalAnatomicalSourceCoordinatesPersisted:false,
   exactOriginalSourceTrianglePairIDsPersisted:false,
   sourcePhotoRGBAndAlphaUnmodified:true,
   unphotographedNeutralRearNotTreatedAsReal:true,
   independentHumanFitApproved:false,continuousSweptContactCertified:false,
   ownerPrivate3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD',
   originalPhoto2DFallbackRequired:true
  });
 }catch(e){
  return refusal([
   'malformed-original-source-triangle-pair-ID',
   'out-of-range-original-source-triangle-pair-ID',
   'original-skinned-posed-BVH-triangle-proof-missing',
   'source-contact-triangle-set-ledger-inconsistent'
  ].includes(e?.message)?e.message:'source-contact-topology-unverifiable');
 }
}
