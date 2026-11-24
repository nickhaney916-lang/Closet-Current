/**
 * Mission 2: measured garment <-> wearer <-> real licensed 163-bone rig
 * research-only dimensional registration. NO consumer clothing admission.
 *
 * This does NOT replace continuous original mesh contact/drape, approved
 * front/rear silhouettes, camera calibration, garment material, original
 * licensed-rig source hashing or owner authorization. The caller MUST
 * authenticate the source/rule/owner independently, not with input claims.
 *
 * Two physically measured anatomical 3D landmark spans infer a bounded
 * rig-unit->millimetre interval; a THIRD separately measured span is a
 * falsification holdout, not an extra curve-fitting degree of freedom.
 * Directly measured, anatomically matching body & garment circumferences
 * then yield *only* dimensional ease intervals, never a 3D fitted mesh.
 */
const finite = v => typeof v === 'number' && Number.isFinite(v);
const positive = v => finite(v) && v>0;
const isSHA = v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const isSafeText = v => typeof v === 'string' && v.length>0 && v.length<=100;
const vec3 = v => Array.isArray(v) && v.length===3 &&
  Array.from(v).every(x=>finite(x)&&Math.abs(x)<=10);
const triad = ["height","shoulder","torso"];
const sectionSets=Object.freeze({
 top:["chest","waist"],jacket:["chest","waist"],
 skirt:["waist","hip"],trousers:["waist","hip"],
 dress:["chest","waist","hip"]
});
const distance = (a,b)=>Math.hypot(
 a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const fail = (decision,other={}) => ({
 decision,...other,
 actualOwnerMeasuredPhysicalFitCertified:false,
 actualAvatarMetricScaleIndependentlyCertified:false,
 originalPhotoToBodyGeometryCertified:false,
 garmentToLicensedRigMeshFitted:false,
 garmentBodyContinuousCollisionCleared:false,
 photoAndWearerSideAndRearCertified:false,
 originalPhoto2DFallbackRequired:true,
 consumer3DAdmitted:false,familyAlpha:"HOLD"
});
function segmentShape(s) {
 return s && typeof s==="object" && !Array.isArray(s) &&
  Object.keys(s).sort().join(",")==="landmark,measuredMm,rigA,rigB,uncertaintyMm" &&
  triad.includes(s.landmark) && vec3(s.rigA) && vec3(s.rigB) &&
  positive(s.measuredMm) && s.measuredMm>=50 && s.measuredMm<=2500 &&
  positive(s.uncertaintyMm) &&
  s.uncertaintyMm>=.2 &&
  s.uncertaintyMm<=Math.min(50,s.measuredMm*.05) &&
  distance(s.rigA,s.rigB)>=.02 &&
  distance(s.rigA,s.rigB)<=5;
}
function interval(s){
 const u=distance(s.rigA,s.rigB);
 return [(s.measuredMm-s.uncertaintyMm)/u,
         (s.measuredMm+s.uncertaintyMm)/u];
}
function sectionValid(s){
 return s && typeof s==="object" && !Array.isArray(s) &&
  Object.keys(s).sort().join(",")==="bodyCircumferenceMm,bodyUncertaintyMm,garmentCircumferenceMm,garmentUncertaintyMm,landmark,measuredAsCompleteClosedCircumference" &&
  ["chest","waist","hip"].includes(s.landmark) &&
  s.measuredAsCompleteClosedCircumference === true &&
  positive(s.bodyCircumferenceMm)&&s.bodyCircumferenceMm>=200&&
  s.bodyCircumferenceMm<=2500 &&
  positive(s.garmentCircumferenceMm)&&s.garmentCircumferenceMm>=200&&
  s.garmentCircumferenceMm<=3000 &&
  finite(s.bodyUncertaintyMm)&&s.bodyUncertaintyMm>=.2&&
  s.bodyUncertaintyMm<=Math.min(40,s.bodyCircumferenceMm*.05)&&
  finite(s.garmentUncertaintyMm)&&s.garmentUncertaintyMm>=.2&&
  s.garmentUncertaintyMm<=Math.min(40,s.garmentCircumferenceMm*.05);
}
/**
 * Inputs are anonymous measurements in tests. No private measurements should
 * ever be sent to public GitHub issues/logs or bundled in the consumer app.
 * A boolean "independently verified" in JSON does not constitute authority.
 */
export function assessMetricGarmentToWearerFit({
 source,independentSourceWitness,
 licensedRig,independentRigWitness,
 measurements,measurementTrust
}={}){
 if(!source || !independentSourceWitness ||
   !isSHA(source.originalPhotoSHA256) ||
   !isSHA(independentSourceWitness.originalPhotoSHA256) ||
   source.originalPhotoSHA256!==independentSourceWitness.originalPhotoSHA256 ||
   source.imageId!==independentSourceWitness.imageId ||
   independentSourceWitness.originalBytesRehashedByNativeCaller!==true ||
   !Number.isSafeInteger(source.imageId) || source.imageId<=0)
  return fail("BLOCKED_ORIGINAL_GARMENT_SOURCE_IDENTITY_MISSING");
 if(!licensedRig||!independentRigWitness||
  !["female","male"].includes(licensedRig.kind) ||
  licensedRig.kind!==independentRigWitness.kind ||
  !isSHA(licensedRig.sha256) ||
  licensedRig.sha256!==independentRigWitness.sha256 ||
  licensedRig.actualOriginalBoneCount!==163 ||
  independentRigWitness.actualOriginalBoneCount!==163 ||
  independentRigWitness.originalSourceRigBytesVerifiedByNativeCaller!==true ||
  independentRigWitness.actualOriginalRigSourcePositionsVerified!==true)
  return fail("BLOCKED_GENUINE_LICENSED_RIG_PROVENANCE_MISSING");
 if(!measurements)
  return fail("BLOCKED_NO_REAL_GARMENT_OR_WEARER_MEASUREMENTS",{
   actualLicensed163BoneRigKind:licensedRig.kind,
   sourceImageId:source.imageId,
   licensedOriginalRigNotPhysicalWearerMeasurement:true
  });
 if(!measurementTrust ||
  !isSHA(measurements.sourcePhotoSHA256)||
  !isSHA(measurements.originalRigSHA256)||
  measurements.sourcePhotoSHA256!==source.originalPhotoSHA256 ||
  measurements.originalRigSHA256!==licensedRig.sha256 ||
  measurements.sourcePhotoSHA256!==measurementTrust.sourcePhotoSHA256 ||
  measurements.originalRigSHA256!==measurementTrust.originalRigSHA256 ||
  !isSafeText(measurements.sourceRevision) ||
  measurements.sourceRevision!==measurementTrust.sourceRevision ||
  measurementTrust.activeOwnerLeaseVerifiedByTrustedCaller!==true ||
  measurementTrust.independentlyAuthenticatedMeasurementSpecimens!==true)
  return fail("BLOCKED_OWNER_SOURCE_RIG_AND_MEASUREMENTS_NOT_AUTHENTICATED");
 const kind=measurements.garmentType;
 if(!Object.hasOwn(sectionSets,kind))
  return fail("BLOCKED_UNSUPPORTED_MEASURED_GARMENT_TYPE");
 const anchors=measurements.rigMetricAnchors;
 const holdout=measurements.rigMetricIndependentHoldout;
 if(!Array.isArray(anchors)||anchors.length!==2 ||
  !Array.from(anchors).every(segmentShape)||!segmentShape(holdout) ||
  new Set([...anchors.map(x=>x.landmark),holdout.landmark]).size!==3)
  return fail("BLOCKED_MISSING_DISTINCT_REAL_BODY_RIG_LANDMARKS");
 if(anchors.some(x=>JSON.stringify(x.rigA)===JSON.stringify(x.rigB)))
  return fail("BLOCKED_DEGENERATE_REAL_BODY_LANDMARK");
 // Different labels cannot make the same unordered geometric endpoints
 // independent observations. A shared single endpoint is allowed.
 const spanKey=s=>[JSON.stringify(s.rigA),JSON.stringify(s.rigB)].sort().join('|');
 if(new Set([...anchors,holdout].map(spanKey)).size!==3)
  return fail("BLOCKED_REUSED_RIG_LANDMARK_SPAN");
 const [a,b]=anchors.map(interval);
 const lower=Math.max(a[0],b[0]),upper=Math.min(a[1],b[1]);
 if(!finite(lower)||!finite(upper)||lower<=0||lower>upper||
  lower<20||upper>5000)
  return fail("BLOCKED_CONTRADICTORY_RIG_METRIC_ANCHORS",{
   anchorScaleIntervalsMmPerRigUnit:[a,b]
  });
 const holdoutInterval=interval(holdout);
 const compatible=holdoutInterval[0]<=upper&&
  holdoutInterval[1]>=lower;
 if(!compatible)
  return fail("BLOCKED_INDEPENDENT_WEARER_RIG_HOLDOUT_CONTRADICTION",{
   anchorIntersectionMmPerRigUnit:[lower,upper],
   holdoutScaleIntervalMmPerRigUnit:holdoutInterval
  });
 const sections=measurements.physicalCircumferenceSections;
 if(!Array.isArray(sections)||sections.length!==sectionSets[kind].length||
  !Array.from(sections).every(sectionValid)||
  sections.some((s,i)=>s.landmark!==sectionSets[kind][i]))
  return fail("BLOCKED_MISSING_DIRECT_MEASURED_MATCHED_BODY_GARMENT_SECTIONS",{
   expectedAnatomicalSections:sectionSets[kind]
  });
 const fit=sections.map(s=>{
  const lo=s.garmentCircumferenceMm-s.garmentUncertaintyMm-
   (s.bodyCircumferenceMm+s.bodyUncertaintyMm),
   hi=s.garmentCircumferenceMm+s.garmentUncertaintyMm-
   (s.bodyCircumferenceMm-s.bodyUncertaintyMm);
  return {landmark:s.landmark,
   minimumPossibleEaseMm:lo,
   maximumPossibleEaseMm:hi,
   classification:hi<0?"MEASURED_DIMENSIONAL_DEFICIT_REQUIRES_STRETCH_OR_CHANGE":
    lo<=0?"MEASURED_CLEARANCE_UNCERTAIN":
     "MEASURED_CIRCUMFERENCE_CLEARANCE_POSSIBLE_NOT_FIT",
   trueThreeDimensionalDrapeOrGarmentFitProved:false
  };
 });
 const deficits=fit.filter(x=>x.maximumPossibleEaseMm<0).map(x=>x.landmark);
 return fail(deficits.length?
  "BLOCKED_MEASURED_GARMENT_DIMENSIONAL_DEFICIT":
  "BLOCKED_REAL_WORLD_METRIC_FIT_REQUIRES_APPROVED_CONTACT_AND_DRAPE",{
  metricRigScaleIntervalMmPerRigUnit:[lower,upper],
  independentlyMeasuredThirdLandmarkScaleIntervalMmPerRigUnit:holdoutInterval,
  directCircumferenceMeasurementsOnly:true,
  conditionalMeasuredGarmentBodyEase:fit,
  anatomicalSectionsWithDefiniteMeasuredDeficit:deficits,
  measurementNumbersSelfReportedAndNotProofOfRealWorldIndependentMeasurement:true,
  actualMeasuredGarmentDepthAndPatternPanelGeometryUnknown:true,
  independentlyObservedSourcePhotoPlaneAndCameraStillRequired:true,
  noFabricElasticityOrLayerStackAssumed:true,
  fitted3DGeometry:null
 });
}

/** Sampled geometric distortion only, not material strain or a physical fit.
 * Use the exact original indexed front and actual rest/posed XYZ buffers.
 * The 10% band is an explicitly arbitrary research diagnostic, NOT a fabric
 * limit; sampled poses cannot certify the unsampled continuous motion. */
export function auditSampledOriginalFrontProportions({rest,poses,indices,
 expectedFaces,expectedVertices}={}){
 const invalid=()=>fail("BLOCKED_INVALID_SAMPLED_ORIGINAL_FRONT_GEOMETRY");
 const buffer=v=>Array.isArray(v)||v instanceof Float32Array||v instanceof Float64Array;
 if(!Number.isSafeInteger(expectedVertices)||expectedVertices<3||expectedVertices>1000000||
  !Number.isSafeInteger(expectedFaces)||expectedFaces<1||expectedFaces>2000000||
  !buffer(rest)||rest.length!==expectedVertices*3||
  !Array.isArray(poses)||poses.length<1||poses.length>64||
  !(Array.isArray(indices)||indices instanceof Uint32Array||indices instanceof Uint16Array)||
  indices.length!==expectedFaces*3)return invalid();
 const good=v=>buffer(v)&&v.length===rest.length&&
  Array.from(v).every(n=>finite(n)&&Math.abs(n)<=10000);
 if(!good(rest)||!Array.from(poses).every(good))return invalid();
 const edges=new Map(),triangles=[];
 const length=(v,a,b)=>Math.hypot(v[a*3]-v[b*3],v[a*3+1]-v[b*3+1],v[a*3+2]-v[b*3+2]);
 const area=(v,a,b,c)=>{
  const x=v[b*3]-v[a*3],y=v[b*3+1]-v[a*3+1],z=v[b*3+2]-v[a*3+2],
   u=v[c*3]-v[a*3],w=v[c*3+1]-v[a*3+1],q=v[c*3+2]-v[a*3+2];
  return Math.hypot(y*q-z*w,z*u-x*q,x*w-y*u);
 };
 for(let k=0;k<indices.length;k+=3){
  const a=indices[k],b=indices[k+1],c=indices[k+2];
  if(![a,b,c].every(i=>Number.isSafeInteger(i)&&i>=0&&i<expectedVertices)||
   a===b||b===c||a===c)return invalid();
  const base=area(rest,a,b,c);
  if(!positive(base))return invalid();
  triangles.push([a,b,c,base]);
  for(const [i,j] of [[a,b],[b,c],[c,a]]){
   const lo=Math.min(i,j),hi=Math.max(i,j),key=lo*expectedVertices+hi;
   if(!edges.has(key)){
    const base=length(rest,lo,hi);if(!positive(base))return invalid();
    edges.set(key,[lo,hi,base]);
   }
  }
 }
 const samples=[];
 for(const v of poses){
  let minEdge=Infinity,maxEdge=0,minArea=Infinity,maxArea=0,edgeOutside=0,areaOutside=0,collapsedFaces=0;
  let worstEdge=null,worstFace=null,faceOrdinal=0;
  for(const [a,b,base] of edges.values()){
   const r=length(v,a,b)/base;if(!finite(r))return invalid();
   if(!worstEdge||Math.abs(r-1)>Math.abs(worstEdge.ratio-1))
    worstEdge={vertexIndices:[a,b],ratio:r,restLength:base};
   minEdge=Math.min(minEdge,r);maxEdge=Math.max(maxEdge,r);
   if(r<.9||r>1.1)edgeOutside++;
  }
  for(const [a,b,c,base] of triangles){
   const r=area(v,a,b,c)/base;if(!finite(r))return invalid();
   if(!worstFace||Math.abs(r-1)>Math.abs(worstFace.ratio-1))
    worstFace={faceOrdinal,vertexIndices:[a,b,c],ratio:r};
   faceOrdinal++;
   minArea=Math.min(minArea,r);maxArea=Math.max(maxArea,r);
   if(r<.9||r>1.1)areaOutside++;
   if(r===0)collapsedFaces++;
  }
  samples.push({minimumEdgeLengthRatio:minEdge,maximumEdgeLengthRatio:maxEdge,
   minimumTriangleAreaRatio:minArea,maximumTriangleAreaRatio:maxArea,
   edgesOutsideResearchBand:edgeOutside,facesOutsideResearchBand:areaOutside,collapsedFaces,
   worstOriginalEdge:worstEdge,worstOriginalFace:worstFace});
 }
 return fail("RESEARCH_ONLY_SAMPLED_ORIGINAL_FRONT_PROPORTION_AUDIT",{
  sampledPoseCount:samples.length,originalFrontFaces:triangles.length,
  uniqueOriginalFrontEdges:edges.size,diagnosticRatioBand:[.9,1.1],
  arbitraryResearchBandNotPhysicalFabricLimit:true,
  continuousMotionOrMaterialStrainCertified:false,
  sampledPoseDistortion:samples
 });
}

/** One bounded, midpoint-preserving research correction on a COPY of a pose.
 * No collision or material validation. Never apply to a live source mesh.
 * Reject if the full sampled front's aggregate distortion gets worse.
 */
export function trialBoundedOriginalFrontCorrection({rest,pose,indices,expectedFaces,expectedVertices}={}){
 const input={rest,indices,expectedFaces,expectedVertices};
 const baseline=auditSampledOriginalFrontProportions({...input,poses:[pose]});
 const reject=(decision,extra={})=>fail(decision,{...extra,
  correctionAppliedToLiveMesh:false,correctedPose:null,
  materialOrCollisionCertified:false});
 if(!baseline.sampledPoseDistortion)return reject(baseline.decision);
 const before=baseline.sampledPoseDistortion[0],witness=before.worstOriginalEdge;
 if(!before.edgesOutsideResearchBand||before.collapsedFaces||witness.ratio===0)
  return reject("RESEARCH_ONLY_NO_SAFE_EDGE_CORRECTION_ATTEMPT",{before});
 const [a,b]=witness.vertexIndices,L=witness.restLength;
 const d=[0,1,2].map(k=>pose[b*3+k]-pose[a*3+k]),length=Math.hypot(...d);
 const shift=Math.max(-.02*L,Math.min(.02*L,(length-L)/2));
 const candidate=Float64Array.from(pose);
 for(let k=0;k<3;k++){
  const move=shift*d[k]/length;
  candidate[a*3+k]+=move;candidate[b*3+k]-=move;
 }
 const check=auditSampledOriginalFrontProportions({...input,poses:[candidate]});
 if(!check.sampledPoseDistortion)return reject("BLOCKED_CORRECTION_GEOMETRY_INVALID",{before});
 const after=check.sampledPoseDistortion[0];
 const err=(lo,hi)=>Math.max(Math.abs(lo-1),Math.abs(hi-1));
 const edgeErr=p=>err(p.minimumEdgeLengthRatio,p.maximumEdgeLengthRatio);
 const areaErr=p=>err(p.minimumTriangleAreaRatio,p.maximumTriangleAreaRatio);
 if(!(edgeErr(after)<edgeErr(before)-1e-12)||
  areaErr(after)>areaErr(before)+1e-12||
  after.edgesOutsideResearchBand>before.edgesOutsideResearchBand||
  after.facesOutsideResearchBand>before.facesOutsideResearchBand||
  after.collapsedFaces>before.collapsedFaces)
  return reject("RESEARCH_ONLY_CORRECTION_REJECTED_NO_GLOBAL_IMPROVEMENT",{before,attempted:after});
 return fail("RESEARCH_ONLY_BOUNDED_EDGE_CORRECTION_CANDIDATE",{
  before,after,correctedPose:candidate,maximumEndpointDisplacementRigUnits:Math.abs(shift),
  maximumEndpointDisplacementFractionOfRestEdge:.02,
  correctionAppliedToLiveMesh:false,materialOrCollisionCertified:false
 });
}

/** Coordinated Jacobi-style research trial on a detached XYZ copy.
 * Each vertex has a total step cap of 2% of its shortest incident rest edge.
 * No new out-of-band edge/face may be hidden by improvements elsewhere.
 * No physical material, contact, continuous-motion or wearable claim. */
export function trialCoordinatedOriginalFrontCorrection({rest,pose,indices,expectedFaces,expectedVertices}={}){
 const input={rest,indices,expectedFaces,expectedVertices};
 const baseline=auditSampledOriginalFrontProportions({...input,poses:[pose]});
 const reject=(decision,extra={})=>fail(decision,{...extra,correctedPose:null,
  correctionAppliedToLiveMesh:false,materialOrCollisionCertified:false});
 if(!baseline.sampledPoseDistortion)return reject(baseline.decision);
 const before=baseline.sampledPoseDistortion[0];
 if(!before.edgesOutsideResearchBand||before.collapsedFaces||before.minimumEdgeLengthRatio===0)
  return reject("RESEARCH_ONLY_NO_COORDINATED_CORRECTION_ATTEMPT",{before});
 const edges=new Map(),faces=[],caps=new Float64Array(expectedVertices).fill(Infinity),
  delta=new Float64Array(pose.length),degree=new Uint32Array(expectedVertices);
 const dist=(v,a,b)=>Math.hypot(v[3*a]-v[3*b],v[3*a+1]-v[3*b+1],v[3*a+2]-v[3*b+2]);
 const normal=(v,a,b,c)=>{
  const x=v[3*b]-v[3*a],y=v[3*b+1]-v[3*a+1],z=v[3*b+2]-v[3*a+2],
   u=v[3*c]-v[3*a],w=v[3*c+1]-v[3*a+1],q=v[3*c+2]-v[3*a+2];
  return [y*q-z*w,z*u-x*q,x*w-y*u];
 };
 const outside=r=>r<.9||r>1.1;
 for(let k=0;k<indices.length;k+=3){
  const a=indices[k],b=indices[k+1],c=indices[k+2],n=normal(pose,a,b,c),
   base=Math.hypot(...normal(rest,a,b,c));
  faces.push({a,b,c,n,base,prior:Math.hypot(...n)/base});
  for(const [i,j] of [[a,b],[b,c],[c,a]]){
   const lo=Math.min(i,j),hi=Math.max(i,j),key=lo*expectedVertices+hi;
   if(edges.has(key))continue;
   const L=dist(rest,lo,hi),length=dist(pose,lo,hi);
   edges.set(key,{a:lo,b:hi,L,prior:length/L});
   caps[lo]=Math.min(caps[lo],.02*L);caps[hi]=Math.min(caps[hi],.02*L);
  }
 }
 let selected=0;
 for(const {a,b,L,prior} of edges.values()){
  if(!outside(prior))continue;
  selected++;degree[a]++;degree[b]++;
  const length=prior*L,shift=Math.max(-.02*L,Math.min(.02*L,(length-L)/2));
  for(let k=0;k<3;k++){
   const move=shift*(pose[3*b+k]-pose[3*a+k])/length;
   delta[3*a+k]+=move;delta[3*b+k]-=move;
  }
 }
 let maxFraction=0,moved=0;
 for(let i=0;i<expectedVertices;i++){
  if(!degree[i])continue;
  const p=3*i;
  for(let k=0;k<3;k++)delta[p+k]/=degree[i];
  const d=Math.hypot(delta[p],delta[p+1],delta[p+2]);
  if(!d)continue;
  const scale=Math.min(1,caps[i]/d);
  for(let k=0;k<3;k++)delta[p+k]*=scale;
  maxFraction=Math.max(maxFraction,d*scale/(caps[i]/.02));moved++;
 }
 const err=(lo,hi)=>Math.max(Math.abs(lo-1),Math.abs(hi-1));
 const edgeErr=p=>err(p.minimumEdgeLengthRatio,p.maximumEdgeLengthRatio);
 const areaErr=p=>err(p.minimumTriangleAreaRatio,p.maximumTriangleAreaRatio);
 const trials=[];
 for(const step of [1,.5,.25,.125]){
  const candidate=Float64Array.from(pose,(v,i)=>v+step*delta[i]);
  const audit=auditSampledOriginalFrontProportions({...input,poses:[candidate]});
  if(!audit.sampledPoseDistortion)continue;
  const after=audit.sampledPoseDistortion[0];
  let newBadEdges=0,newBadFaces=0,flippedOrOrthogonalFaces=0;
  for(const {a,b,L,prior} of edges.values())if(!outside(prior)&&outside(dist(candidate,a,b)/L))newBadEdges++;
  for(const {a,b,c,n,base,prior} of faces){
   const q=normal(candidate,a,b,c);
   if(!outside(prior)&&outside(Math.hypot(...q)/base))newBadFaces++;
   if(q[0]*n[0]+q[1]*n[1]+q[2]*n[2]<=0)flippedOrOrthogonalFaces++;
  }
  trials.push({step,newBadEdges,newBadFaces,flippedOrOrthogonalFaces});
  if(newBadEdges||newBadFaces||flippedOrOrthogonalFaces||
   !(edgeErr(after)<edgeErr(before)-1e-12)||
   areaErr(after)>areaErr(before)+1e-12||
   after.edgesOutsideResearchBand>before.edgesOutsideResearchBand||
   after.facesOutsideResearchBand>before.facesOutsideResearchBand||after.collapsedFaces>before.collapsedFaces)continue;
  return fail("RESEARCH_ONLY_COORDINATED_CORRECTION_CANDIDATE",{
   before,after,correctedPose:candidate,selectedDistortedEdges:selected,movedVertices:moved,
   maximumVertexStepFractionOfShortestIncidentRestEdge:maxFraction*step,
   trials,correctionAppliedToLiveMesh:false,materialOrCollisionCertified:false
  });
 }
 return reject("RESEARCH_ONLY_COORDINATED_CORRECTION_REJECTED",{before,selectedDistortedEdges:selected,trials});
}

/** Progressive research-only stabilization of a detached pose.
 * Each pass is separately admitted by the coordinated correction guard.
 * Total traveled distance (not merely net displacement) is capped at 5%
 * of the shortest incident rest edge per vertex. Never rebase that budget.
 * Retain the last accepted copy if a subsequent pass fails.
 */
export function trialProgressiveOriginalFrontStabilization({rest,pose,indices,expectedFaces,expectedVertices}={}){
 return progressiveWithGuard({rest,pose,indices,expectedFaces,expectedVertices},null);
}
function progressiveWithGuard({rest,pose,indices,expectedFaces,expectedVertices},guard){
 const input={rest,indices,expectedFaces,expectedVertices};
 const audit=auditSampledOriginalFrontProportions({...input,poses:[pose]});
 const finish=(decision,extra={})=>fail(decision,{...extra,
  correctionAppliedToLiveMesh:false,materialOrCollisionCertified:false});
 if(!audit.sampledPoseDistortion)return finish(audit.decision,{correctedPose:null});
 const before=audit.sampledPoseDistortion[0],caps=new Float64Array(expectedVertices).fill(Infinity),
  traveled=new Float64Array(expectedVertices);
 const distance=(v,a,b)=>Math.hypot(v[3*a]-v[3*b],v[3*a+1]-v[3*b+1],v[3*a+2]-v[3*b+2]);
 const normal=(v,a,b,c)=>{
  const x=v[3*b]-v[3*a],y=v[3*b+1]-v[3*a+1],z=v[3*b+2]-v[3*a+2],
   u=v[3*c]-v[3*a],w=v[3*c+1]-v[3*a+1],q=v[3*c+2]-v[3*a+2];
  return [y*q-z*w,z*u-x*q,x*w-y*u];
 };
 for(let k=0;k<indices.length;k+=3){
  const a=indices[k],b=indices[k+1],c=indices[k+2];
  for(const [i,j] of [[a,b],[b,c],[c,a]]){
   const L=distance(rest,i,j);
   caps[i]=Math.min(caps[i],L);caps[j]=Math.min(caps[j],L);
  }
 }
 let current=Float64Array.from(pose),last=before,stopReason="PASS_LIMIT",maxTravel=0;
 const passes=[];
 for(let i=0;i<6;i++){
  const result=trialCoordinatedOriginalFrontCorrection({...input,pose:current});
  if(result.decision!=="RESEARCH_ONLY_COORDINATED_CORRECTION_CANDIDATE"){
   stopReason=result.decision;break;
  }
  const candidate=result.correctedPose,travel=traveled.slice();
  let nextMax=0,within=true;
  for(let j=0;j<expectedVertices;j++){
   const p=3*j,d=Math.hypot(candidate[p]-current[p],candidate[p+1]-current[p+1],candidate[p+2]-current[p+2]);
   travel[j]+=d;
   const ratio=travel[j]/caps[j];
   if(ratio>.05||(!Number.isFinite(caps[j])&&d!==0)){within=false;break;}
   nextMax=Math.max(nextMax,ratio);
  }
  if(!within){stopReason="CUMULATIVE_TRAVEL_LIMIT";break;}
  // Local normals may rotate gradually: also compare against the original
  // uncorrected posed surface, not solely the preceding accepted pass.
  let originalNormalConflict=false;
  for(let k=0;k<indices.length;k+=3){
   const a=indices[k],b=indices[k+1],c=indices[k+2],
    n=normal(pose,a,b,c),q=normal(candidate,a,b,c);
   if(n[0]*q[0]+n[1]*q[1]+n[2]*q[2]<=0){originalNormalConflict=true;break;}
  }
  if(originalNormalConflict){stopReason="ORIGINAL_POSE_NORMAL_CONFLICT";break;}
  if(guard){const receipt=guard(current,candidate);if(!receipt.clear){stopReason=receipt.reason||'SWEPT_OBSTACLE_OVERLAP_UNRESOLVED';break;}}
  traveled.set(travel);maxTravel=nextMax;current=candidate;last=result.after;
  passes.push({pass:i+1,maximumCumulativeTravelFraction:maxTravel,
   minimumEdgeLengthRatio:last.minimumEdgeLengthRatio,maximumEdgeLengthRatio:last.maximumEdgeLengthRatio,
   minimumTriangleAreaRatio:last.minimumTriangleAreaRatio,maximumTriangleAreaRatio:last.maximumTriangleAreaRatio,
   edgesOutsideResearchBand:last.edgesOutsideResearchBand,facesOutsideResearchBand:last.facesOutsideResearchBand,
   collapsedFaces:last.collapsedFaces});
 }
 return finish(passes.length?"RESEARCH_ONLY_PROGRESSIVE_STABILIZATION_CANDIDATE":
  "RESEARCH_ONLY_PROGRESSIVE_STABILIZATION_REFUSED",{
  before,after:last,passes,stopReason,maximumCumulativeTravelFraction:maxTravel,
  maximumAllowedCumulativeTravelFraction:.05,
  correctedPose:passes.length?current:null
 });
}

/** Fixed-pose conservative broadphase of each correction segment, not an
 * exact contact solver. Overlapping AABBs require a strict separating
 * projection of all six swept endpoints from the obstacle triangle.
 * Otherwise unresolved. No claim about unchanged faces, self-contact,
 * cloth thickness, unsupplied layers, or moving obstacles. */
export function trialObstacleGuardedOriginalFrontStabilization({
 rest,pose,indices,expectedFaces,expectedVertices,obstacles
}={}){
 const input={rest,pose,indices,expectedFaces,expectedVertices};
 const denied=(decision)=>fail(decision,{correctedPose:null,
  correctionAppliedToLiveMesh:false,materialOrCollisionCertified:false});
 const base=auditSampledOriginalFrontProportions({rest,poses:[pose],indices,expectedFaces,expectedVertices});
 if(!base.sampledPoseDistortion)return denied(base.decision);
 const goodBuffer=v=>Array.isArray(v)||v instanceof Float32Array||v instanceof Float64Array;
 if(!Array.isArray(obstacles)||obstacles.length<1||obstacles.length>8||
  !Array.from(obstacles).every(o=>o&&['body','layer'].includes(o.kind))||
  obstacles.filter(o=>o.kind==='body').length!==1)return denied('BLOCKED_MISSING_FIXED_BODY_OBSTACLE');
 const bounds=(v,ids,other=null)=>{
  const b=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
  for(const i of ids)for(let k=0;k<3;k++){
   const p=v[i*3+k],q=other?other[i*3+k]:p;
   b[k]=Math.min(b[k],p,q);b[k+3]=Math.max(b[k+3],p,q);
  }
  return b;
 };
 const union=(a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.min(a[2],b[2]),
  Math.max(a[3],b[3]),Math.max(a[4],b[4]),Math.max(a[5],b[5])];
 const intersects=(a,b)=>[0,1,2].every(k=>a[k]<=b[k+3]+1e-9&&b[k]<=a[k+3]+1e-9);
 const build=rows=>{
  const b=rows.reduce((a,r)=>a?union(a,r.b):r.b,null);
  if(rows.length<=8)return {b,rows};
  let axis=0;for(let k=1;k<3;k++)if(b[k+3]-b[k]>b[axis+3]-b[axis])axis=k;
  rows.sort((a,b)=>a.b[axis]+a.b[axis+3]-b.b[axis]-b.b[axis+3]);
  const mid=rows.length>>1;
  return {b,left:build(rows.slice(0,mid)),right:build(rows.slice(mid))};
 };
 // All linearly interpolated moving triangle points lie inside the convex
 // hull of its six endpoints. A strict common projection gap is sufficient
 // to reject a broadphase candidate for the entire correction segment.
 // The axis set is intentionally incomplete: no separation means BLOCKED.
 const sub=(a,b)=>a.map((v,k)=>v-b[k]);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const triangleEdges=t=>[sub(t[1],t[0]),sub(t[2],t[1]),sub(t[0],t[2])];
 const points=(v,ids)=>ids.map(i=>[v[3*i],v[3*i+1],v[3*i+2]]);
 const separation=(start,end,fixed,fixedEnd=fixed)=>{
  const groups=[start,end,fixed,fixedEnd].map(triangleEdges);
  const normals=groups.map(e=>cross(e[0],e[1]));
  const axes=[...normals];
  for(const n of normals)for(const es of groups)for(const e of es)axes.push(cross(n,e));
  for(const es of groups.slice(0,2))for(const e of es)for(const other of groups.slice(2))for(const q of other)axes.push(cross(e,q));
  const moving=[...start,...end],origin=fixed[0];
  const localA=moving.map(p=>sub(p,origin)),localB=[...fixed,...fixedEnd].map(p=>sub(p,origin));
  for(const axis of axes){
   const length=Math.hypot(...axis);if(!finite(length)||length<=1e-14)continue;
   const u=axis.map(x=>x/length);
   const project=p=>p[0]*u[0]+p[1]*u[1]+p[2]*u[2];
   const a=localA.map(project),b=localB.map(project);
   const gap=Math.max(Math.min(...a)-Math.max(...b),Math.min(...b)-Math.max(...a));
   // Deliberately leave a generous numerical ambiguity band.
   const margin=1e-8*Math.max(1,...a.map(Math.abs),...b.map(Math.abs));
   if(gap>margin)return true;
  }
  return false;
 };
 const query=(node,b,unresolved)=>{
  if(!intersects(node.b,b))return null;
  if(node.rows)return node.rows.find(r=>intersects(r.b,b)&&unresolved(r))||null;
  return query(node.left,b,unresolved)||query(node.right,b,unresolved);
 };
 const rows=[];
 for(let oi=0;oi<obstacles.length;oi++){
  const o=obstacles[oi],v=o.vertices,ix=o.indices;
  if(!goodBuffer(v)||v.length<9||v.length%3||v.length>3000000||
   !Array.from(v).every(n=>finite(n)&&Math.abs(n)<=10000)||
   !(Array.isArray(ix)||ix instanceof Uint16Array||ix instanceof Uint32Array)||
   ix.length<3||ix.length%3||ix.length>6000000||
   rows.length+ix.length/3>2000000)return denied('BLOCKED_INVALID_FIXED_OBSTACLE_GEOMETRY');
  for(let k=0;k<ix.length;k+=3){
   const ids=[ix[k],ix[k+1],ix[k+2]];
   if(!ids.every(i=>Number.isSafeInteger(i)&&i>=0&&i<v.length/3)||
    new Set(ids).size!==3)return denied('BLOCKED_INVALID_FIXED_OBSTACLE_GEOMETRY');
   rows.push({b:bounds(v,ids),ids,obstacleIndex:oi,kind:o.kind,faceOrdinal:k/3});
  }
 }
 const tree=build(rows),receipts=[],selfReceipts=[];
 // Incident triangles legitimately touch at their common topology. Test
 // separation beyond that topology, not ordinary AABB overlap.
 const dot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
 const plus=(a,b)=>a.map((v,k)=>v+b[k]);
 const unit=a=>{const l=Math.hypot(...a);return l>1e-14?a.map(v=>v/l):null;};
 const relative=(v,a,b)=>sub(points(v,[a])[0],points(v,[b])[0]);
 const incidentSeparation=(from,to,a,b,shared)=>{
  if(shared.length===2){
   const [u,v]=shared,ia=a.find(i=>!shared.includes(i)),ib=b.find(i=>!shared.includes(i));
   const e0=relative(from,v,u),e1=relative(to,v,u);
   // For linear edge/third-point motion, cross products are quadratic
   // Bernstein curves. All nine cross-control dot products strictly
   // negative implies the two oriented wedge vectors stay opposed.
   const controls=i=>{
    const p=relative(from,i,u),q=relative(to,i,u);
    return [cross(e0,p),plus(cross(e0,q),cross(e1,p)).map(x=>x/2),cross(e1,q)].map(unit);
   };
   const x=controls(ia),y=controls(ib);
   return x.every(n=>n&&y.every(m=>m&&dot(n,m)<-1e-8));
  }
  if(shared.length!==1)return false; // duplicate faces never cleared
  const u=shared[0],vectors=ids=>[from,to].flatMap(v=>ids.filter(i=>i!==u).map(i=>unit(relative(v,i,u))));
  const x=vectors(a),y=vectors(b);
  if([...x,...y].some(v=>!v))return false;
  const axes=[sub(x.reduce(plus),y.reduce(plus))];
  for(const p of x)for(const q of y)axes.push(sub(p,q));
  // A fixed axis strictly separates all relative endpoint rays; linear
  // interpolation and convexity then exclude contact beyond the vertex.
  for(const axis of axes){
   const n=unit(axis);if(!n)continue;
   if(x.every(p=>dot(p,n)>1e-8)&&y.every(q=>dot(q,n)<-1e-8))return true;
  }
  return false;
 };
 // All pairs involving a moving face are candidates, including two moving
 // faces. Unresolved incident geometry is refused separately.

 const selfGuard=(from,to)=>{
  const faces=[];
  for(let k=0;k<indices.length;k+=3){
   const ids=[indices[k],indices[k+1],indices[k+2]];
   faces.push({ids,faceOrdinal:k/3,b:bounds(from,ids,to),
    moving:ids.some(i=>[0,1,2].some(j=>from[3*i+j]!==to[3*i+j]))});
  }
  const selfTree=build(faces.slice()),moving=faces.filter(f=>f.moving);
  let broadphasePairsExamined=0,separatedSweptPairs=0,incidentPairsExcluded=0,incidentPairsSeparated=0,budgetExceeded=false,incidentUnresolved=false;
  for(const f of moving){
   const start=points(from,f.ids),end=points(to,f.ids);
   const hit=query(selfTree,f.b,g=>{
    if(g.faceOrdinal===f.faceOrdinal||(g.moving&&g.faceOrdinal<f.faceOrdinal))return false;
    const shared=f.ids.filter(i=>g.ids.includes(i));
    if(shared.length){
     if(incidentPairsExcluded>=250000){budgetExceeded=true;incidentUnresolved=true;return true;}
     incidentPairsExcluded++;
     if(incidentSeparation(from,to,f.ids,g.ids,shared)){incidentPairsSeparated++;return false;}
     incidentUnresolved=true;return true;
    }
    if(broadphasePairsExamined>=250000){budgetExceeded=true;return true;}
    broadphasePairsExamined++;
    if(separation(start,end,points(from,g.ids),points(to,g.ids))){separatedSweptPairs++;return false;}
    return true;
   });
   if(hit){const receipt={clear:false,reason:incidentUnresolved?'SWEPT_INCIDENT_FOLDOVER_UNRESOLVED':'SWEPT_NONINCIDENT_SELF_OVERLAP_UNRESOLVED',
    movingFacesIndexed:moving.length,broadphasePairsExamined,separatedSweptPairs,
    incidentPairsExcluded,incidentPairsSeparated,budgetExceeded,frontFaceOrdinal:f.faceOrdinal,
    otherFrontFaceOrdinal:hit.faceOrdinal};selfReceipts.push(receipt);return receipt;}
  }
  const receipt={clear:true,movingFacesIndexed:moving.length,broadphasePairsExamined,
   separatedSweptPairs,incidentPairsExcluded,incidentPairsSeparated,budgetExceeded:false};selfReceipts.push(receipt);return receipt;
 };
 const guard=(from,to)=>{
  const self=selfGuard(from,to);if(!self.clear)return self;
  let movingFacesExamined=0,broadphasePairsExamined=0,separatedSweptPairs=0,budgetExceeded=false;
  for(let k=0;k<indices.length;k+=3){
   const ids=[indices[k],indices[k+1],indices[k+2]];
   if(!ids.some(i=>[0,1,2].some(j=>from[3*i+j]!==to[3*i+j])))continue;
   movingFacesExamined++;
   const start=points(from,ids),end=points(to,ids);
   const hit=query(tree,bounds(from,ids,to),r=>{
    if(broadphasePairsExamined>=250000){budgetExceeded=true;return true;}
    broadphasePairsExamined++;
    if(separation(start,end,points(obstacles[r.obstacleIndex].vertices,r.ids))){separatedSweptPairs++;return false;}
    return true;
   });
   if(hit){
    const receipt={clear:false,movingFacesExamined,broadphasePairsExamined,separatedSweptPairs,budgetExceeded,frontFaceOrdinal:k/3,
     obstacleIndex:hit.obstacleIndex,obstacleKind:hit.kind,obstacleFaceOrdinal:hit.faceOrdinal};
    receipts.push(receipt);return receipt;
   }
  }
  const receipt={clear:true,movingFacesExamined,broadphasePairsExamined,separatedSweptPairs,budgetExceeded:false};receipts.push(receipt);return receipt;
 };
 const result=progressiveWithGuard(input,guard);
 return {...result,correctionSegmentObstacleReceipts:receipts,
  correctionSegmentNonincidentSelfReceipts:selfReceipts,
  nonincidentMovingFaceSelfBroadphaseEnabled:true,
  incidentMovingFaceFoldoverGuardEnabled:true,
  incidentFaceFoldoverOrStationarySelfContactCertified:false,
  fixedObstacleFacesIndexed:rows.length,suppliedLayerCount:obstacles.filter(o=>o.kind==='layer').length,
  sweptMovingFaceBoundsOnly:false,conservativeSweptProjectionSeparation:true,
  unchangedFaceOrSelfContactCertified:false,
  fullLayeredOutfitCollisionCertified:false};
}
