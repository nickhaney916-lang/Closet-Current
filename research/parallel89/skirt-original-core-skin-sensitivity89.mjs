/**
 * M2 P89 — source-immutable anatomical CORE eligibility sensitivity.
 * The original CC0 163-bone weights stay unchanged. "Hypothetical" only
 * means a source-indexed triangle's summed, NAMED torso/hips/legs influences
 * satisfy an exploratory threshold; NEVER source anatomy authorization,
 * physical skirt containment, 3D body fit or an allowed consumer mesh.
 *
 * Exact licensed public photograph / genuine model gate lives in audit().
 * Numeric synthetic tests are NOT original-source acceptance.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const THRESHOLDS=Object.freeze([.50,.65,.80,.90,.95]);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const isIndex=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const safeName=x=>typeof x==='string'&&x.length>0&&x.length<=96&&
 /^[\x20-\x7e]+$/.test(x);
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const fail=reason=>Object.freeze({
 schema:'P89-source-locked-skirt-core-skin-sensitivity/v1',
 status:'ORIGINAL_SKIN_THRESHOLD_OR_SOURCE_PROVENANCE_UNVERIFIABLE',
 reason,originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 sourceOriginalAnatomyNeverEdited:true,closedSignedBodyVolumeVerified:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
function region(name){
 const s=name.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(s))
  return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(s))
  return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(s))
  return 'CORE_TORSO_HIPS';
 return 'UNKNOWN_ORIGINAL_BONE';
}
function cut(positions,a,b,c,y){
 const ids=[a,b,c],points=[];
 for(let k=0;k<3;k++){
  const s=ids[k],t=ids[(k+1)%3],y0=positions[s*3+1],y1=positions[t*3+1];
  if(Math.abs(y1-y0)<1e-10)continue;
  const u=(y-y0)/(y1-y0);
  if(u<0||u>1)continue;
  const x=positions[s*3]+u*(positions[t*3]-positions[s*3]),
   z=positions[s*3+2]+u*(positions[t*3+2]-positions[s*3+2]);
  if(!points.some(p=>Math.hypot(p[0]-x,p[1]-z)<1e-7))points.push([x,z]);
 }
 return points.length===2?[points[0][0],points[0][1],points[1][0],points[1][1]]:null;
}
function cast(lines,cx,cz,ux,uz){
 let far=-1,collinear=false;
 for(const [ax,az,bx,bz] of lines){
  const ex=bx-ax,ez=bz-az,px=ax-cx,pz=az-cz,
   det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)collinear=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,v=(px*uz-pz*ux)/det;
  if(t>=0&&t<=3&&v>=-1e-9&&v<=1+1e-9)
   far=Math.max(far,t);
 }
 return {hasHit:far>=0,farthest:far,collinear};
}
function validate(a){
 const {bodyPositions:p,bodyIndices:idx,skirtPositions:s,skirtIndices:si,
  coreBodyFaceMask:mask,skinIndices:bi,skinWeights:bw,
  sourceMeshIds:mi,sourceMeshNames:mn,sourceBoneNamesByMesh:bn}=a;
 if(!(p instanceof Float32Array)||p.length<12||p.length%3!==0||
  p.length>2_100_000||!isIndex(idx)||idx.length<6||idx.length%3!==0||
  idx.length>3_000_000||!(s instanceof Float32Array)||s.length!==343*3||
  !isIndex(si)||si.length!==1728||!(mask instanceof Uint8Array)||
  mask.length!==idx.length/3||!(bi instanceof Uint16Array)||
  bi.length!==p.length/3*4||!(bw instanceof Float32Array)||
  bw.length!==bi.length||!(mi instanceof Uint16Array)||
  mi.length!==p.length/3||!Array.isArray(mn)||mn.length<1||mn.length>256||
  mn.some(x=>!safeName(x))||!Array.isArray(bn)||bn.length!==mn.length||
  bn.some(a=>!Array.isArray(a)||a.length!==163||a.some(n=>!safeName(n))))
  throw Error('original-163bone-skin-sensitivity-buffers-required');
 for(const v of p)if(!finite(v))throw Error('original-body-skin-sensitivity-position-nonfinite');
 for(const v of s)if(!finite(v))throw Error('original-photo-skirt-position-nonfinite');
 for(const v of idx)if(v>=p.length/3)throw Error('original-body-skin-sensitivity-index-invalid');
 for(const v of si)if(v>=343)throw Error('original-photo-skirt-index-invalid');
 for(const v of mask)if(v!==0&&v!==1)throw Error('original-strict-core-face-mask-invalid');
 for(const v of mi)if(v>=mn.length)throw Error('original-source-mesh-id-invalid');
 for(let i=0;i<p.length/3;i++){
  let total=0;
  for(let k=0;k<4;k++){
   const b=bi[i*4+k],w=bw[i*4+k];
   if(b>=163||!finite(w)||w<0||w>1)
    throw Error('original-163bone-influence-invalid');
   total+=w;
  }
  if(Math.abs(total-1)>.003)
   throw Error('original-163bone-influence-not-normalized');
 }
 let min=Infinity,max=-Infinity;
 for(let i=1;i<s.length;i+=3){min=Math.min(min,s[i]);max=Math.max(max,s[i]);}
 if(max-min<.06||max-min>2.5)
  throw Error('original-photo-skirt-source-span-invalid');
}
/** Entirely source-identity-preserving. Thresholds are predeclared,
 * hypothetical and NOT writable/controllable at runtime.
 */
export function summarizeOriginalCoreSkinSensitivity89(a={}){
 validate(a);
 const {bodyPositions:p,bodyIndices:idx,skirtPositions:s,
  coreBodyFaceMask:mask,skinIndices:bi,skinWeights:bw,
  sourceMeshIds:mi,sourceBoneNamesByMesh:bn}=a;
 const vertices=p.length/3,faces=idx.length/3;
 const eligibleStrict=new Uint8Array(faces),
  candidateByThreshold=THRESHOLDS.map(()=>new Uint8Array(faces)),
  contaminatedByThreshold=THRESHOLDS.map(()=>new Uint8Array(faces));
 const info=Array.from({length:vertices},(_,i)=>{
  let core=0,head=0,unknown=0,max=-1,dominant='';
  for(let k=0;k<4;k++){
   const ix=i*4+k,w=bw[ix],name=bn[mi[i]][bi[ix]],
    label=region(name);
   if(label==='CORE_TORSO_HIPS'||label==='CORE_LEGS')core+=w;
   else if(label==='EXCLUDED_HEAD_ARMS')head+=w;
   else unknown+=w;
   if(w>max){max=w;dominant=label;}
  }
  return {core,head,unknown,max,dominant};
 });
 let strictFaceCount=0,sourceUnknownDominanceFaces=0;
 const eligibleCount=THRESHOLDS.map(()=>0),contaminatedCount=THRESHOLDS.map(()=>0);
 for(let f=0;f<faces;f++){
  const ids=[idx[f*3],idx[f*3+1],idx[f*3+2]],
   sameMesh=mi[ids[0]]===mi[ids[1]]&&mi[ids[1]]===mi[ids[2]],
   strict=sameMesh&&mask[f]===1&&ids.every(v=>
    info[v].max>=.5&&
    (info[v].dominant==='CORE_TORSO_HIPS'||info[v].dominant==='CORE_LEGS'));
  if(strict){eligibleStrict[f]=1;strictFaceCount++;}
  if(ids.some(v=>info[v].max<.5))sourceUnknownDominanceFaces++;
  // Counterfactuals do not replace the existing strict original face mask:
  // only excluded original indexed faces are considered as candidates.
  if(!strict&&sameMesh){
   for(let t=0;t<THRESHOLDS.length;t++){
    if(ids.every(v=>info[v].core+1e-7>=THRESHOLDS[t])){
     candidateByThreshold[t][f]=1;eligibleCount[t]++;
     if(ids.some(v=>info[v].head>.05||info[v].unknown>.05)){
      contaminatedByThreshold[t][f]=1;contaminatedCount[t]++;
     }
    }
   }
  }
 }
 const byBand=[],hypothetical=THRESHOLDS.map((t)=>({
  namedCoreWeightThreshold:t,sourceExcludedFaceCandidates:eligibleCount[THRESHOLDS.indexOf(t)],
  candidateFacesWithNoncoreWeightOverFivePercent:contaminatedCount[THRESHOLDS.indexOf(t)],
  originalCoreUnknownRaysWithHypotheticalCandidateIntersection:0,
  sourceExcludedUnknownRaysWithHypotheticalCandidateIntersection:0,
  sourceNoFaceRayHitDirectionsRemainingUnknown:0,
  originalCoreUnknownRaysWithoutCandidateIntersection:0,
  contaminatedHypotheticalCandidateHitDirections:0,
  byOriginalSkirtBand:Array(7).fill(0)
 }));
 let strictIn=0,strictOut=0,strictNear=0,strictUnknown=0,
  originalCoreExcludedHit=0,originalNoSourceFaceHit=0;
 for(let row=0;row<7;row++){
  let cx=0,cz=0,y=0;
  for(let j=0;j<48;j++){
   const i=(row*49+j)*3;cx+=s[i];cz+=s[i+2];y+=s[i+1];
  }
  cx/=48;cz/=48;y/=48;
  const strictLines=[],excludedOriginalLines=[],candidateLines=THRESHOLDS.map(()=>[]),
   contaminatedLines=THRESHOLDS.map(()=>[]);
  for(let f=0;f<faces;f++){
   const a0=idx[f*3],a1=idx[f*3+1],a2=idx[f*3+2];
   const xy=cut(p,a0,a1,a2,y);
   if(!xy)continue;
   if(eligibleStrict[f])strictLines.push(xy);
   else excludedOriginalLines.push(xy);
   for(let t=0;t<THRESHOLDS.length;t++){
    if(candidateByThreshold[t][f]){
     candidateLines[t].push(xy);
     if(contaminatedByThreshold[t][f])contaminatedLines[t].push(xy);
    }
   }
  }
  let rowUnknown=0,rowExcluded=0,rowNoHit=0,rowIn=0,rowOut=0,rowNear=0;
  for(let j=0;j<48;j++){
   const i=(row*49+j)*3,dx=s[i]-cx,dz=s[i+2]-cz,
    radius=Math.hypot(dx,dz);
   if(!(radius>.005&&radius<3)){
    strictUnknown++;rowUnknown++;originalNoSourceFaceHit++;rowNoHit++;
    for(const t of hypothetical){
     t.sourceNoFaceRayHitDirectionsRemainingUnknown++;
     t.originalCoreUnknownRaysWithoutCandidateIntersection++;
    }
    continue;
   }
   const ux=dx/radius,uz=dz/radius,
    c=cast(strictLines,cx,cz,ux,uz);
   if(!c.collinear&&strictLines.length>0&&c.hasHit){
    const gap=radius-c.farthest;
    if(gap<-.002){strictIn++;rowIn++;}
    else if(gap<=.002){strictNear++;rowNear++;}
    else{strictOut++;rowOut++;}
    continue;
   }
   strictUnknown++;rowUnknown++;
   const any=cast(excludedOriginalLines,cx,cz,ux,uz).hasHit;
   if(any){originalCoreExcludedHit++;rowExcluded++;}
   else{originalNoSourceFaceHit++;rowNoHit++;}
   for(let t=0;t<THRESHOLDS.length;t++){
    const report=hypothetical[t];
    const candidate=cast(candidateLines[t],cx,cz,ux,uz).hasHit;
    if(candidate){
     report.originalCoreUnknownRaysWithHypotheticalCandidateIntersection++;
     report.sourceExcludedUnknownRaysWithHypotheticalCandidateIntersection++;
     report.byOriginalSkirtBand[row]++;
     if(cast(contaminatedLines[t],cx,cz,ux,uz).hasHit)
      report.contaminatedHypotheticalCandidateHitDirections++;
    }else report.originalCoreUnknownRaysWithoutCandidateIntersection++;
    if(!any)report.sourceNoFaceRayHitDirectionsRemainingUnknown++;
    if(!any&&candidate)
     throw Error('counterfactual-source-without-original-face-ray-hit');
   }
  }
  if(rowIn+rowOut+rowNear+rowUnknown!==48||rowExcluded+rowNoHit!==rowUnknown)
   throw Error('original-skirt-source-ring-sensitivity-reconciliation-failed');
  byBand.push({originalSkirtBand:row,strictCoreInward:rowIn,strictCoreOutward:rowOut,
   strictCoreNear:rowNear,strictCoreUnknown:rowUnknown,
   originalExcludedFaceIntersection:rowExcluded,
   noObservedOriginalFaceIntersection:rowNoHit});
 }
 if(strictIn+strictOut+strictNear+strictUnknown!==336||
  originalCoreExcludedHit+originalNoSourceFaceHit!==strictUnknown||
  hypothetical.some((v,i)=>v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection+
   v.originalCoreUnknownRaysWithoutCandidateIntersection!==strictUnknown||
   v.sourceNoFaceRayHitDirectionsRemainingUnknown!==originalNoSourceFaceHit||
   v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection>
    originalCoreExcludedHit||
   v.sourceExcludedUnknownRaysWithHypotheticalCandidateIntersection!==
    v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection||
   sum(v.byOriginalSkirtBand)!==v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection||
   (i>0&&v.originalCoreUnknownRaysWithHypotheticalCandidateIntersection>
     hypothetical[i-1].originalCoreUnknownRaysWithHypotheticalCandidateIntersection)))
  throw Error('original-skirt-anatomical-threshold-monotonicity-or-ray-count-failed');
 return Object.freeze({
  schema:'P89-original-anatomy-skin-core-sensitivity-source-indexed/v1',
  sourceSkirtSpokeCount:336,sourceSkirtSevenBands:7,sourceIndexedBodyTriangles:faces,
  originalStrictCoreSourceFaceCount:strictFaceCount,
  originalSourceFacesWithSubHalfDominantWeight:sourceUnknownDominanceFaces,
  baselineStrictCoreInward:strictIn,baselineStrictCoreOutward:strictOut,
  baselineStrictCoreNear:strictNear,baselineStrictCoreUnknown:strictUnknown,
  baselineUnknownExcludedOriginalFaceRayHits:originalCoreExcludedHit,
  baselineUnknownNoOriginalFaceRayHits:originalNoSourceFaceHit,
  originalStrictCoreSourceBandReceipts:byBand,
  hypotheticalSourceNamedCoreWeightSensitivity:hypothetical,
  thresholdsArePredeclaredNotLearnedOrPhysicallyValidated:true,
  allCandidateFacesAreOriginalIndexedNotCreatedGeometry:true,
  corePartMembershipFromOriginalBoneNameHeuristicOnly:true,
  sourceOriginalSkinWeightsAndMeshDataNotModified:true,
  counterfactualsMayNotChangeOriginalStrictCoreMask:true,
  originalUnknownNoHitRaysNeverAutomaticallyCleared:true,
  originalPhoto2DFallbackRequired:true,closedSignedBodyVolumeVerified:false,
  fullBodyOrClothCollisionCleared:false,garmentPhysicalSizeMeasured:false,
  sourceUnphotographedRearObserved:false,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
export function auditOriginalCoreSkinSensitivity89(a={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  independentlyVerifiedBoneNoHitReceipt}=a;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||sourcePhotoSHA256!==PHOTO||
  sourceAnatomyGLBSHA256!==RIG[avatar]||originalRig163Bones!==true||
  selectedMeasuredFivePoseBvh!==true||selectedActualWebGLPreview!==true||
  independentlyVerifiedBoneNoHitReceipt?.schema!==
   'P89-pure-original-core-unknown-bone-name-nohit-spokes/v1'||
  independentlyVerifiedBoneNoHitReceipt?.actualOriginalSkirtSourceSpokes!==336||
  independentlyVerifiedBoneNoHitReceipt?.originalSourceBoneLabelsNeverAutomaticallyReclassified!==true)
  return fail('immutable-original-public-photo-avatar-and-bone-identity-receipt-required');
 try{
  const x=summarizeOriginalCoreSkinSensitivity89(a),
   prior=independentlyVerifiedBoneNoHitReceipt;
  if(x.sourceIndexedBodyTriangles!==prior.sourceIndexedOriginalBodyTriangleCount||
   x.baselineStrictCoreInward!==prior.originalCoreInward||
   x.baselineStrictCoreOutward!==prior.originalCoreOutward||
   x.baselineStrictCoreNear!==prior.originalCoreNear||
   x.baselineStrictCoreUnknown!==prior.originalCoreUnknown||
   x.baselineUnknownExcludedOriginalFaceRayHits!==
    prior.unknownSpokesWithAnyExcludedSourceFaceHit||
   x.baselineUnknownNoOriginalFaceRayHits!==
    prior.unknownSpokesWithNoActualSourceFaceRayHit||
   x.originalStrictCoreSourceBandReceipts.some((v,i)=>
    v.strictCoreUnknown!==prior.originalSourceSevenBandProvenanceReceipts[i]?.unknown||
    v.originalExcludedFaceIntersection!==
     prior.originalSourceSevenBandProvenanceReceipts[i]?.excludedSourceHit||
    v.noObservedOriginalFaceIntersection!==
     prior.originalSourceSevenBandProvenanceReceipts[i]?.noSourceRayHit))
   return fail('hypothetical-original-core-source-does-not-match-independent-baseline');
  return Object.freeze({
   schema:'P89-source-locked-skirt-core-skin-sensitivity/v1',
   status:'ORIGINAL_SKIN_CORE_THRESHOLD_HYPOTHESES_MEASURED_NO_WEARABLE_FIT',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   originalSkinCoreSensitivityEvidence:x,
   independentlyReconciledAll336OriginalPhotoSpokes:true,
   originalPhoto2DFallbackRequired:true,closedSignedBodyVolumeVerified:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const allowed=[
   'original-163bone-skin-sensitivity-buffers-required',
   'original-body-skin-sensitivity-position-nonfinite',
   'original-photo-skirt-position-nonfinite',
   'original-body-skin-sensitivity-index-invalid',
   'original-photo-skirt-index-invalid',
   'original-strict-core-face-mask-invalid',
   'original-source-mesh-id-invalid',
   'original-163bone-influence-invalid',
   'original-163bone-influence-not-normalized',
   'original-photo-skirt-source-span-invalid',
   'counterfactual-source-without-original-face-ray-hit',
   'original-skirt-source-ring-sensitivity-reconciliation-failed',
   'original-skirt-anatomical-threshold-monotonicity-or-ray-count-failed'
  ];
  return fail(allowed.includes(e.message)?e.message:
   'original-source-anatomical-skin-threshold-research-unverifiable');
 }
}
