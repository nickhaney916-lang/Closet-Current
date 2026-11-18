/**
 * P89 research: skin-weight-preserving *counterfactual* core source-face
 * sensitivity around original P541 pelvis, spine, upper-leg transitions.
 *
 * Baseline strict 0.5 dominant-joint classification is immutable and must
 * match independently audited original photo 7x48 spoke receipts. Extra
 * source-indexed faces are hypothetically included ONLY if ALL vertices
 * have >=95% source skin weight in recognized torso/hip/leg joints (strict
 * alternate), or >=80% (exploratory alternate); the original source face
 * mask MUST still be 1, each triangle must belong to ONE original mesh,
 * there must be an original <0.5 dominant-joint mixed vertex, and no
 * previously certain excluded head/arm joints. The 80% threshold is
 * expressly NOT a confidence or garment-admission threshold.
 *
 * Every source position/skin/face buffer is read-only. A new ray witness
 * never becomes a true signed body volume or a physically measured fit.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const index=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const label=x=>typeof x==='string'&&x.length>0&&x.length<=96&&
 /^[\x20-\x7e]+$/.test(x);
const sum=a=>a.reduce((n,v)=>n+v,0);
const refuse=reason=>Object.freeze({
 schema:'P89-real-photo-source-core-skin-weight-counterfactual/v1',
 status:'SOURCE_SKIN_WEIGHT_COUNTERFACTUAL_UNVERIFIED',reason,
 originalPhoto2DFallbackRequired:true,
 neverAuthorized3D:false, // eligibility is never granted
 signedExteriorContainmentCertified:false,releaseAuthorized:false,
 consumer3DAdmitted:false,familyAlpha:'HOLD'
});
function classify(name){
 const s=name.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(s))
  return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(s))
  return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(s))
  return 'CORE_TORSO_HIPS';
 return 'UNKNOWN_ORIGINAL_BONE';
}
function cut(p,a,b,c,y){
 const v=[a,b,c],points=[];
 for(let i=0;i<3;i++){
  const s=v[i],t=v[(i+1)%3],y0=p[3*s+1],y1=p[3*t+1];
  if(Math.abs(y1-y0)<1e-10)continue;
  const u=(y-y0)/(y1-y0);
  if(u<0||u>1)continue;
  const x=p[3*s]+u*(p[3*t]-p[3*s]),
   z=p[3*s+2]+u*(p[3*t+2]-p[3*s+2]);
  if(!points.some(q=>Math.hypot(x-q[0],z-q[1])<1e-7))
   points.push([x,z]);
 }
 return points.length===2?
  [points[0][0],points[0][1],points[1][0],points[1][1]]:null;
}
function trace(segs,cx,cz,ux,uz,radius){
 if(!(radius>.005&&radius<3))return 'unknown';
 let far=-1,parallelAmbiguous=false;
 for(const [ax,az,bx,bz] of segs){
  const ex=bx-ax,ez=bz-az,px=ax-cx,pz=az-cz,det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)parallelAmbiguous=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,
   v=(px*uz-pz*ux)/det;
  if(t>=0&&t<=3&&v>=-1e-9&&v<=1+1e-9)
   far=Math.max(far,t);
 }
 if(parallelAmbiguous||far<0)return 'unknown';
 const gap=radius-far;
 return gap<-.002?'inward':gap<=.002?'near':'outward';
}
const empty=()=>({inward:0,near:0,outward:0,unknown:0});
export function summarizeOriginalCoreSkinWeightSensitivity89({
 bodyPositions,bodyIndices,skirtPositions,skirtIndices,coreBodyFaceMask,
 skinIndices,skinWeights,sourceMeshIds,sourceMeshNames,sourceBoneNamesByMesh
}={}){
 if(!(bodyPositions instanceof Float32Array)||
  bodyPositions.length<12||bodyPositions.length%3!==0||
  bodyPositions.length>2_100_000||!index(bodyIndices)||
  bodyIndices.length<6||bodyIndices.length%3!==0||
  bodyIndices.length>3_000_000||
  !(skirtPositions instanceof Float32Array)||
  skirtPositions.length!==343*3||
  !index(skirtIndices)||skirtIndices.length!==576*3||
  !(coreBodyFaceMask instanceof Uint8Array)||
  coreBodyFaceMask.length!==bodyIndices.length/3||
  !(skinIndices instanceof Uint16Array)||
  skinIndices.length!==bodyPositions.length/3*4||
  !(skinWeights instanceof Float32Array)||
  skinWeights.length!==skinIndices.length||
  !(sourceMeshIds instanceof Uint16Array)||
  sourceMeshIds.length!==bodyPositions.length/3||
  !Array.isArray(sourceMeshNames)||sourceMeshNames.length<1||
  sourceMeshNames.length>256||sourceMeshNames.some(s=>!label(s))||
  !Array.isArray(sourceBoneNamesByMesh)||
  sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(x=>!Array.isArray(x)||x.length!==163||
   x.some(y=>!label(y))))
  throw Error('exact-original-source-body-skin-and-skirt-required');
 const nv=bodyPositions.length/3,nf=bodyIndices.length/3;
 for(const x of bodyPositions)if(!finite(x))
  throw Error('original-body-posed-position-nonfinite');
 for(const x of skirtPositions)if(!finite(x))
  throw Error('original-photographed-skirt-position-nonfinite');
 for(const i of bodyIndices)if(i>=nv)
  throw Error('original-indexed-body-face-out-of-bounds');
 for(const i of skirtIndices)if(i>=343)
  throw Error('original-skirt-index-out-of-bounds');
 if(coreBodyFaceMask.some(x=>x!==0&&x!==1))
  throw Error('original-core-source-mask-invalid');
 const vertices=new Array(nv);
 for(let v=0;v<nv;v++){
  const m=sourceMeshIds[v];
  if(m>=sourceMeshNames.length)
   throw Error('original-source-body-mesh-identity-invalid');
  let max=-1,top=0,total=0,coreWeight=0,bannedWeight=0,unknownWeight=0,
   nonzeroCoreInfluences=0;
  for(let k=0;k<4;k++){
   const i=4*v+k,w=skinWeights[i],joint=skinIndices[i];
   if(!finite(w)||w<0||w>1||joint>=163)
    throw Error('source-original-163-bone-skin-invalid');
   total+=w;
   if(w>max){max=w;top=joint;}
   if(w<=1e-7)continue;
   const group=classify(sourceBoneNamesByMesh[m][joint]);
   if(group==='EXCLUDED_HEAD_ARMS')bannedWeight+=w;
   else if(group==='UNKNOWN_ORIGINAL_BONE')unknownWeight+=w;
   else{coreWeight+=w;nonzeroCoreInfluences++;}
  }
  if(Math.abs(total-1)>.003)
   throw Error('source-original-163bone-weight-sum-invalid');
  const strict=max<.5?'UNKNOWN_ORIGINAL_BONE':
   classify(sourceBoneNamesByMesh[m][top]);
  vertices[v]={strict,mesh:m,max,coreWeight,bannedWeight,
   unknownWeight,nonzeroCoreInfluences};
 }
 const strictFaces=[],supplement95=[],supplement80=[];
 let excludedHead=0,excludedMask=0,excludedMesh=0,excludedNonBlend=0,
  unsupportedCoreBlend=0,strictFaceCount=0,candidateAnyCount=0;
 for(let f=0;f<nf;f++){
  const a=bodyIndices[3*f],b=bodyIndices[3*f+1],c=bodyIndices[3*f+2],
   vs=[vertices[a],vertices[b],vertices[c]],
   p=[a,b,c],
   region=vs.map(x=>x.strict),
   allMeshSame=vs.every(x=>x.mesh===vs[0].mesh),
   excludesHead=region.includes('EXCLUDED_HEAD_ARMS'),
   unresolved=region.includes('UNKNOWN_ORIGINAL_BONE');
  if(!allMeshSame){excludedMesh++;continue;}
  if(excludesHead){excludedHead++;continue;}
  const allCore=region.every(s=>s==='CORE_LEGS'||s==='CORE_TORSO_HIPS');
  if(allCore&&coreBodyFaceMask[f]===1){strictFaceCount++;strictFaces.push(p);continue;}
  if(coreBodyFaceMask[f]!==1){excludedMask++;continue;}
  if(!unresolved){excludedNonBlend++;continue;}
  // Only counterfactual faces omitted BY ORIGINAL <.5 skin blending.
  // Retain original >=.5 exclusions; coarse original source face mask
  // and original source mesh identity are mandatory across scenarios.
  candidateAnyCount++;
  const meets=t=>vs.every(v=>
   v.coreWeight>=t-1e-7&&
   v.bannedWeight<=1-t+1e-7&&
   v.unknownWeight<=1-t+1e-7&&
   (v.strict!=='UNKNOWN_ORIGINAL_BONE'||v.nonzeroCoreInfluences>=2));
  if(meets(.95))supplement95.push(p);
  if(meets(.80))supplement80.push(p);
  else unsupportedCoreBlend++;
 }
 if(supplement95.length>supplement80.length)
  throw Error('original-counterfactual-threshold-order-invalid');
 let min=Infinity,max=-Infinity;
 for(let i=1;i<skirtPositions.length;i+=3){
  min=Math.min(min,skirtPositions[i]);max=Math.max(max,skirtPositions[i]);
 }
 if(!(max-min>.06&&max-min<2.5))
  throw Error('original-source-skirt-height-invalid');
 const results={strict:empty(),counterfactual95:empty(),
  counterfactual80:empty()},
  byRing=[],recovered={
   counterfactual95:{outward:0,near:0,inward:0,unknown:0},
   counterfactual80:{outward:0,near:0,inward:0,unknown:0}
  },baselineStatusChanged={counterfactual95:0,counterfactual80:0},
  counterfactualSegmentsByRing={counterfactual95:[],counterfactual80:[]};
 for(let row=0;row<7;row++){
  let cx=0,cz=0,y=0;
  for(let j=0;j<48;j++){
   const k=3*(49*row+j);
   cx+=skirtPositions[k];cz+=skirtPositions[k+2];
   y+=skirtPositions[k+1];
  }
  cx/=48;cz/=48;y/=48;
  const cutFaces=triangles=>{
   const segments=[];
   for(const [a,b,c] of triangles){
    const z=cut(bodyPositions,a,b,c,y);
    if(z)segments.push(z);
   }
   return segments;
  };
  const base=cutFaces(strictFaces),extra95=cutFaces(supplement95),
   extra80=cutFaces(supplement80),sets={
    strict:base,counterfactual95:base.concat(extra95),
    counterfactual80:base.concat(extra80)
   };
  counterfactualSegmentsByRing.counterfactual95.push(extra95.length);
  counterfactualSegmentsByRing.counterfactual80.push(extra80.length);
  const tally={strict:empty(),counterfactual95:empty(),
   counterfactual80:empty()};
  for(let j=0;j<48;j++){
   const p=3*(49*row+j),dx=skirtPositions[p]-cx,
    dz=skirtPositions[p+2]-cz,rr=Math.hypot(dx,dz);
   const ux=rr>0?dx/rr:0,uz=rr>0?dz/rr:0,
    obs=Object.fromEntries(Object.entries(sets).map(([k,segs])=>[
     k,trace(segs,cx,cz,ux,uz,rr)
    ]));
   for(const k of Object.keys(results)){
    tally[k][obs[k]]++;results[k][obs[k]]++;
   }
   for(const k of ['counterfactual95','counterfactual80']){
    if(obs.strict==='unknown')recovered[k][obs[k]]++;
    else if(obs.strict!==obs[k])baselineStatusChanged[k]++;
   }
  }
  for(const x of Object.values(tally))
   if(sum(Object.values(x))!==48)
    throw Error('original-source-core-ring-counterfactual-accounting');
  byRing.push({originalSourceSkirtBand:row,strict:tally.strict,
   hypothetical95:tally.counterfactual95,hypothetical80:tally.counterfactual80,
   genuineStrictBodyFacePlaneCuts:base.length,
   additional95BoneAttestedFacePlaneCuts:extra95.length,
   additional80BoneAttestedFacePlaneCuts:extra80.length});
 }
 if(Object.values(results).some(x=>sum(Object.values(x))!==336)||
  recovered.counterfactual95&&
  ['counterfactual95','counterfactual80'].some(k=>
   sum(Object.values(recovered[k]))!==results.strict.unknown))
  throw Error('original-source-336-ray-counterfactual-not-conserved');
 return Object.freeze({
  schema:'P89-original-skinweighted-core-counterfactual-sensitivity/v1',
  originalIndexedSourceBodyTriangleCount:nf,
  originalPhotographedSkirtTriangleCount:skirtIndices.length/3,
  originalPhotoSkirtSourceRays:336,
  originalStrictCoreMaskAndHalfWeightThresholdRetained:true,
  actualStrictSourceEligibleCoreFaces:strictFaceCount,
  originalLowDominanceMixedFaceCandidates:candidateAnyCount,
  hypothetical95SourceBoneCoreWeightFaces:supplement95.length,
  hypothetical80SourceBoneCoreWeightFaces:supplement80.length,
  excludedOriginalMeshIdentityFaces:excludedMesh,
  excludedHeadArmDominanceFaces:excludedHead,
  originalFaceMaskExcludedCandidateFaces:excludedMask,
  unsupportedMixedSourceBoneFacesAt80:unsupportedCoreBlend,
  strictOriginalSourceRays:results.strict,
  hypothetical95SourceRays:results.counterfactual95,
  hypothetical80SourceRays:results.counterfactual80,
  originalStrictUnknownRayCounterfactualOutcomes:recovered,
  alreadyObservedStrictSourceRaysWhoseClassChanges:baselineStatusChanged,
  additionalOriginalBoneWeightCutSegmentsByRing:counterfactualSegmentsByRing,
  originalSkirtBandSourceCounterfactuals:byRing,
  thresholdsAreResearchScenariosNotConfidenceOrReleaseCriteria:true,
  noOriginalSourcePositionsIndicesOrWeightsModified:true,
  projectedSourceContourNotPhysicalGarmentClearance:true,
  originalBodyVolumeStillNotClosedOrSigned:true,
  originalGarmentPhysicalWaistHemMissing:true,
  originalSkirtRearPhotoNotObserved:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
export function auditOriginalCoreWeightSensitivity89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,
  selectedActualWebGLPreview,previousIndependentOriginalCoreCauseReport}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||
  sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||
  selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  previousIndependentOriginalCoreCauseReport?.schema!==
   'P89-pure-original-skirt-core-ray-missing-contour-causes/v1'||
  previousIndependentOriginalCoreCauseReport?.trueOriginalSourceRingRayCount!==336||
  previousIndependentOriginalCoreCauseReport?.independentRayCauseCountsReconcile!==true)
  return refuse('genuine-original-photo-source-and-previous-core-cause-proof-missing');
 try{
  const p=summarizeOriginalCoreSkinWeightSensitivity89(args),
   old=previousIndependentOriginalCoreCauseReport;
  if(p.originalIndexedSourceBodyTriangleCount!==
    old.originalBodyFullIndexedTriangleCount||
   p.strictOriginalSourceRays.inward!==old.strictCoreInwardRays||
   p.strictOriginalSourceRays.outward!==old.strictCoreOutwardRays||
   p.strictOriginalSourceRays.near!==old.strictCoreNearRays||
   p.strictOriginalSourceRays.unknown!==old.strictCoreUnknownRays||
   p.originalSkirtBandSourceCounterfactuals.some((r,i)=>{
    const q=old.sourceSevenSkirtBandCauseBreakdown[i];
    return r.strict.inward!==q?.originalCoreInward||
     r.strict.outward!==q?.originalCoreOutward||
     r.strict.near!==q?.originalCoreNear||
     r.strict.unknown!==q?.originalCoreUnknown||
     r.genuineStrictBodyFacePlaneCuts!==q?.originalOriginalBodyCoreSegments;
   }))
   return refuse('independent-original-strict-core-baseline-does-not-match');
  return Object.freeze({
   schema:'P89-real-photo-source-core-skin-weight-counterfactual/v1',
   status:'ORIGINAL_BONE_BLEND_SENSITIVITY_RESEARCH_NOT_WEARABLE',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   evidence:p,
   336OriginalCoreRaysCrossChecked:false, // audit never upgrades consumer fit
   originalCoreRaysCrossChecked336:true,
   originalRigSkinWeightsAndAllOriginalFacesReadOnly:true,
   sourcePhoto2DFallbackRequired:true,originalPhoto2DFallbackRequired:true,
   closedBodyVolumeCertified:false,signedExteriorContainmentCertified:false,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const allowed=['exact-original-source-body-skin-and-skirt-required',
   'original-body-posed-position-nonfinite',
   'original-photographed-skirt-position-nonfinite',
   'original-indexed-body-face-out-of-bounds','original-skirt-index-out-of-bounds',
   'original-core-source-mask-invalid',
   'original-source-body-mesh-identity-invalid',
   'source-original-163-bone-skin-invalid',
   'source-original-163bone-weight-sum-invalid',
   'original-counterfactual-threshold-order-invalid',
   'original-source-skirt-height-invalid',
   'original-source-core-ring-counterfactual-accounting',
   'original-source-336-ray-counterfactual-not-conserved'];
  return refuse(allowed.includes(e.message)?e.message:
   'original-core-skin-blend-provenance-not-verifiable');
 }
}
