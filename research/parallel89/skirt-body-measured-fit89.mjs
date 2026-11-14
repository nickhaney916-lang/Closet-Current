/**
 * P89 separate source-locked anatomical fitting study for genuine Commons-0043
 * photographed skirt on both actual licensed 163-bone CC0 anatomical bodies.
 *
 * WHOLE-ORIGINAL skinned body vertices (not invented hip measures) determine
 * radial clearance envelopes around seven source-alpha skirt bands at THREE
 * original skeletal poses. Candidate photo-skirt mesh fitting is reversible.
 * Measured source front may move: original RGB/UV ARE unchanged, but photo
 * stretch/physical fit is NOT verified or approved. Entire source GLB, true
 * photo bytes, source UV/skin and 2D fallback remain untouched.
 *
 * Contact proof uses unmodified P84 true skinned BVH triangles; zero
 * observed strict crossings is NOT proof of whole-volume containment, swept
 * physical cloth, garment self-contact, shirt/skirt pairing or realism.
 */
import * as T from 'three';
const POSES=Object.freeze(['source','blend-50','relaxed']);
const SEGMENTS=48,ROWS=7,N=ROWS*(SEGMENTS+1),TRIANGLES=(ROWS-1)*SEGMENTS*2;
const REGIMES=Object.freeze([
 Object.freeze({name:'anatomy-fit-6mm',margin:.006,maxDisplacement:.07}),
 Object.freeze({name:'anatomy-fit-11mm',margin:.011,maxDisplacement:.085}),
 Object.freeze({name:'anatomy-fit-17mm',margin:.017,maxDisplacement:.095})
]);
const fail=reason=>Object.freeze({
 schema:'P89-genuine-source-skirt-measured-anatomical-envelope/v1',
 status:'BODY_MEASURED_SOURCE_GEOMETRY_REJECTED',reason,
 photoSkirtConsumer3DAdmitted:false,source2DFallbackRequired:true,
 humanVisualApproval:false,continuousContactCertified:false,
 originalSourceGeometryRetained:true,releaseAuthorized:false,familyAlpha:'HOLD'
});
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const same=(x,y)=>x.length===y.length&&x.every((n,i)=>Object.is(n,y[i]));
const validContact=x=>x&&Number.isSafeInteger(x.count)&&x.count>=0&&
 x.pairs instanceof Set&&x.pairs.size===x.count&&finite(x.maxDepth)&&x.maxDepth>=0;
const cleanup=x=>{try{x?.dispose();}catch{}};
function measureSkinnedBodyEnvelopes89({worldBody,rest}){
 // An indexed triangle-plane intersection reconstructs the actual CC0
 // public body's local contour from source faces; sparse vertex-only height
 // bands are insufficient to infer anything about source panel clearance.
 const positions=worldBody?.positions??worldBody,
   indices=worldBody?.indices??null,
   indexed=indices instanceof Uint16Array||indices instanceof Uint32Array;
 if(!(positions instanceof Float32Array)||positions.length%3!==0||
   positions.length<900||positions.length>2_100_000)
  throw Error('original skinned CC0 anatomical positions missing');
 if(indices!==null&&(!indexed||indices.length%3!==0||indices.length<150||
   indices.length>3_000_000))
  throw Error('actual anatomical source face indices unavailable');
 const radiusSlices=[],directSliceSamples=[],observed=[],segmentEvidence=[];
 for(let row=0;row<ROWS;row++){
  const j=row*(SEGMENTS+1),k=j+SEGMENTS/2;
  const centerX=(rest.getX(j)+rest.getX(k))/2,
    centerZ=(rest.getZ(j)+rest.getZ(k))/2,
    y=rest.getY(j);
  const bins=new Float64Array(SEGMENTS),seen=new Uint32Array(SEGMENTS);
  let count=0,segments=0;
  const push=(x,z)=>{
   const dx=x-centerX,dz=z-centerZ,radius=Math.hypot(dx,dz);
   if(!finite(radius)||radius<.025||radius>.57)return;
   const a=(Math.atan2(dx,dz)+2*Math.PI)%(2*Math.PI);
   const bin=Math.round(a*SEGMENTS/(2*Math.PI))%SEGMENTS;
   count++;
   // Each recorded angular sector is explicitly touched by a genuine skinned
   // triangle plane intersection. One-step neighbor expansion compensates
   // for sampling the source contour on a 48-sector garment boundary.
   for(const offset of [-1,0,1]){
    const k=(bin+offset+SEGMENTS)%SEGMENTS;
    if(!seen[k]||radius>bins[k])bins[k]=radius;
    seen[k]++;
   }
  };
  if(indexed){
   // All ORIGINAL full-source anatomical skinned triangles, not just
   // vertices conveniently within an arbitrary near-y tolerance.
   const edge=[[0,1],[1,2],[2,0]];
   for(let t=0;t<indices.length;t+=3){
    const verts=[];
    for(let k=0;k<3;k++){
     const id=indices[t+k]*3;
     if(id<0||id+2>=positions.length)
      throw Error('original-body-face-index-out-of-range');
     const x=positions[id],vy=positions[id+1],z=positions[id+2];
     if(!finite(x)||!finite(vy)||!finite(z))
      throw Error('invalid original anatomical skinned vertex');
     verts.push([x,vy,z]);
    }
    const crossings=[];
    for(const [a,b] of edge){
     const A=verts[a],B=verts[b],da=A[1]-y,db=B[1]-y;
     if((da<0&&db>0)||(da>0&&db<0)){
      const u=(y-A[1])/(B[1]-A[1]);
      crossings.push([A[0]+(B[0]-A[0])*u,A[2]+(B[2]-A[2])*u]);
     }
    }
    if(crossings.length!==2)continue;
    const [a,b]=crossings,len=Math.hypot(a[0]-b[0],a[1]-b[1]);
    if(!finite(len)||len<1e-7)continue;
    segments++;
    const steps=Math.max(2,Math.min(24,Math.ceil(len/.006)));
    for(let i=0;i<=steps;i++){
     const t=i/steps;
     push(a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t);
    }
   }
  }else{
   // Synthetic structural test compatibility, NOT an alternate native source
   // proof: true browser CI explicitly requires original indexed body faces.
   for(let i=0;i<positions.length;i+=3){
    const x=positions[i],by=positions[i+1],z=positions[i+2];
    if(!finite(x)||!finite(by)||!finite(z))
     throw Error('invalid original anatomical skinned vertex');
    if(Math.abs(by-y)>.052)continue;
    push(x,z);
   }
  }
  let covered=0,maxRadius=0;
  for(let i=0;i<SEGMENTS;i++)if(seen[i]){
   covered++;maxRadius=Math.max(maxRadius,bins[i]);
  }
  if(covered<SEGMENTS*.60||count<60||maxRadius<.09||maxRadius>.57||
    (indexed&&segments<12))
   throw Error('original indexed anatomy cross-section incomplete at skirt band '+row+
    ': angular '+covered+'/48, source-face-segments '+segments+
    ', measured points '+count);
  const corrected=Array.from(bins,(v,i)=>{
   if(!seen[i])return null;
   return Math.max(v,bins[(i-1+SEGMENTS)%SEGMENTS],
    bins[(i+1)%SEGMENTS]);
  });
  radiusSlices.push({values:corrected,centerX,centerZ,y});
  directSliceSamples.push(count);observed.push(covered);segmentEvidence.push(segments);
 }
 return {radiusSlices,observed,directSliceSamples,segmentEvidence,
  actualAnatomicalIndexedFaceCutsUsed:indexed};
}
function fitCandidateGeometry89({geometry,original,rest,envelopes,regime,worldInverse}){
 const position=geometry.getAttribute('position');
 const inv=worldInverse;
 const p=new T.Vector3();
 let moved=0,photoMoved=0,maxShift=0,mean=0,blockedMissing=0,
    clipped=0,largestNeeded=0;
 const ringStats=[];
 for(let row=0;row<ROWS;row++){
  const slice=envelopes[row],out={row,sourcePixelBand:row+1,anatomicalSampledAngularBins:0,
   changedVerts:0,largestShiftMeters:0};
  for(let j=0;j<=SEGMENTS;j++){
   const i=row*(SEGMENTS+1)+j,bin=j%SEGMENTS;
   const radius=slice.values[bin],originalWorld=new T.Vector3(
    rest.getX(i),rest.getY(i),rest.getZ(i));
   const dx=originalWorld.x-slice.centerX,dz=originalWorld.z-slice.centerZ;
   const originalRad=Math.hypot(dx,dz);
   if(!finite(originalRad)||originalRad<.08)throw Error('photographed original skirt radius invalid');
   const photographicFront=j<=SEGMENTS/4||j>=SEGMENTS*3/4;
   if(radius===null){blockedMissing++;continue;}
   out.anatomicalSampledAngularBins++;
   const need=Math.max(0,radius+regime.margin-originalRad);
   largestNeeded=Math.max(largestNeeded,need);
   const shift=Math.min(regime.maxDisplacement,need);
   if(need>regime.maxDisplacement+.0001)clipped++;
   const newWorld=originalWorld.clone().add(new T.Vector3(
    dx/originalRad*shift,0,dz/originalRad*shift));
   p.copy(newWorld).applyMatrix4(inv);
   if(shift>.0001){moved++;if(photographicFront)photoMoved++;out.changedVerts++;}
   mean+=shift;maxShift=Math.max(maxShift,shift);
   out.largestShiftMeters=Math.max(out.largestShiftMeters,shift);
   position.setXYZ(i,p.x,p.y,p.z);
  }
  ringStats.push(out);
 }
 position.needsUpdate=true;geometry.computeVertexNormals();
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return {sourceSkirtVerticesMoved:moved,sourcePhotoFrontVerticesMoved:photoMoved,
  maximumWorldSkirtAdjustmentMeters:maxShift,
  averageWorldSkirtAdjustmentMeters:mean/N,
  desiredWorldClearanceMaximumAdjustmentMeters:largestNeeded,
  requiredButBecameClippedVertices:clipped,
  noAnatomicalAngleObservedVertices:blockedMissing,
  sourceMaskBandFit: ringStats};
}
function imageGeometryDistortion89(before,after,index){
 const p=i=>i*3;
 const a=(arr,i)=>new T.Vector3(arr[p(i)],arr[p(i)+1],arr[p(i)+2]);
 let worstArea=0,worstEdge=0,flipped=0,degenerate=0;
 for(let i=0;i<index.count;i+=3){
  const x=index.getX(i),y=index.getX(i+1),z=index.getX(i+2);
  const b=[a(before,x),a(before,y),a(before,z)];
  const n=[a(after,x),a(after,y),a(after,z)];
  const b1=b[1].clone().sub(b[0]),b2=b[2].clone().sub(b[0]),
    n1=n[1].clone().sub(n[0]),n2=n[2].clone().sub(n[0]);
  const beforeNormal=b1.clone().cross(b2),afterNormal=n1.clone().cross(n2),
    oldA=beforeNormal.length(),newA=afterNormal.length();
  if(oldA<1e-9||newA<1e-9){degenerate++;continue;}
  if(beforeNormal.dot(afterNormal)<=0)flipped++;
  worstArea=Math.max(worstArea,Math.abs(newA/oldA-1));
  for(const [i,j] of [[0,1],[1,2],[2,0]]){
   const old=b[i].distanceTo(b[j]),now=n[i].distanceTo(n[j]);
   if(old<1e-6){degenerate++;continue;}
   worstEdge=Math.max(worstEdge,Math.abs(now/old-1));
  }
 }
 return {worstAreaRelativeChange:worstArea,worstEdgeRelativeChange:worstEdge,
  flippedTriangles:flipped,degenerateTriangles:degenerate};
}
function collisionWitnesses(before,after){
 const added=[...after.pairs].filter(x=>!before.pairs.has(x)).length;
 return {before:before.count,after:after.count,
  addedCrossingPairIDs:added,
  contactPlaneDepthWorsened:after.maxDepth>before.maxDepth+.0005};
}
/** Intentionally cannot serialize a source-body mesh or 3D user wardrobe.
 * Returns finite numeric derived counts only; every trial is ALWAYS reverted.
 */
export function compareActualMeasuredSkirtFit89({
 root,mesh,avatar,applyPose,sampleContact,sampleBodySkinnedWorld
}={}){
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||
  mesh.skeleton?.bones.length!==163||
  !['female','male'].includes(avatar)||typeof applyPose!=='function'||
  typeof sampleContact!=='function'||typeof sampleBodySkinnedWorld!=='function')
  return fail('true photographed-skirt 163-bone body sources required');
 const original=mesh.geometry,position=original?.getAttribute('position'),
  rest=original?.getAttribute('sourceSkirt89Rest'),index=original?.index,
  uv=original?.getAttribute('uv'),skinIndex=original?.getAttribute('skinIndex'),
  skinWeight=original?.getAttribute('skinWeight');
 if(position?.count!==N||rest?.count!==N||index?.count!==TRIANGLES*3||
  uv?.count!==N||skinIndex?.count!==N||skinWeight?.count!==N)
  return fail('source-photographed alpha 7-ring garment topology unavailable');
 const saved=position.array.slice(),baseline=[],envelopeObservations=[],
  protectedArrays=[['uv',uv.array.slice()],['skinIndex',skinIndex.array.slice()],
   ['skinWeight',skinWeight.array.slice()],['sourceSkirt89Rest',rest.array.slice()],
   ['index',index.array.slice()]];
 const regimes=[],fullBody=[],snapshots=[];
 let cloned=null;
 try{
  for(const pose of POSES){
   applyPose(pose);
   const body=sampleBodySkinnedWorld(pose);
   const measured=measureSkinnedBodyEnvelopes89({worldBody:body,rest});
   fullBody.push(measured);
   envelopeObservations.push({pose,angularBinsObservedPerSourceBand:measured.observed,
    trueOriginalBodyFacePlaneSegmentsPerBand:measured.segmentEvidence,
    genuineSkinnedBodySourceTriangleIntersections:measured.actualAnatomicalIndexedFaceCutsUsed,
    originalAnatomicalBodyProfileSamplesWithinHeightBands:measured.directSliceSamples});
   const contact=sampleContact(pose);
   if(!validContact(contact))throw Error('actual-posed-original-source-BVH-missing');
   baseline.push(contact);
  }
  // Preserve only six per-band strict crossing counts as a reproducible,
  // source-geometry-located research finding. NO body coordinates/photographic
  // pixels, source triangulation arrays or owner-related data leave the browser.
  const baselineCrossingsByGarmentBand=Array.from({length:ROWS-1},()=>0);
  for(const result of baseline)for(const pair of result.pairs){
   const triangle=Number(pair.split('|',1)[0]);
   if(!Number.isSafeInteger(triangle)||triangle<0||triangle>=TRIANGLES)
    throw Error('real skinned source contact triangle identity invalid');
   baselineCrossingsByGarmentBand[Math.floor(triangle/(SEGMENTS*2))]++;
  }
  // Maximum across TRUE original poses, each same immutable source body and
  // original skirt photo garment bands; missing bins remain UNKNOWN.
  const combined=fullBody[0].radiusSlices.map((row,r)=>({
   centerX:row.centerX,centerZ:row.centerZ,y:row.y,
   values:row.values.map((v,b)=>{
    if(fullBody.some(sample=>sample.radiusSlices[r].values[b]===null))return null;
    return Math.max(...fullBody.map(sample=>sample.radiusSlices[r].values[b]));
   })
  }));
  mesh.updateWorldMatrix(true,false);
  const inv=mesh.matrixWorld.clone().invert();
  cloned=original.clone();
  mesh.geometry=cloned;
  let best=null;
  for(const regime of REGIMES){
   cloned.getAttribute('position').array.set(saved);
   cloned.getAttribute('position').needsUpdate=true;
   const candidate=fitCandidateGeometry89({geometry:cloned,original:saved,
    rest,envelopes:combined,regime,worldInverse:inv});
   const distort=imageGeometryDistortion89(saved,cloned.getAttribute('position').array,index);
   const photoWarpNotHumanApproved=true;
   const rejectReasons=[];
   if(candidate.noAnatomicalAngleObservedVertices>0)
    rejectReasons.push('anatomical-horizontal-cross-section-angular-coverage-incomplete');
   if(candidate.requiredButBecameClippedVertices>0)
    rejectReasons.push('required-anatomical-clearance-exceeds-source-scale-and-displacement-budget');
   if(candidate.sourceSkirtVerticesMoved<15)rejectReasons.push('original-body-geometry-did-not-affect-fabric');
   if(candidate.maximumWorldSkirtAdjustmentMeters>.095+.0001)
    rejectReasons.push('original-photo-fabric-displaced-beyond-budget');
   if(distort.worstAreaRelativeChange>.22||distort.worstEdgeRelativeChange>.20||
      distort.flippedTriangles>0||distort.degenerateTriangles>0)
    rejectReasons.push('photographic-fabric-triangle-area-edge-normal-distortion');
   const contacts=[];
   if(!rejectReasons.length){
    for(let i=0;i<POSES.length;i++){
     applyPose(POSES[i]);
     const after=sampleContact(POSES[i]);
     if(!validContact(after))throw Error('source-original-bvh-contact-after-body-fit-missing');
     contacts.push(collisionWitnesses(baseline[i],after));
    }
    if(contacts.some(x=>x.addedCrossingPairIDs>0))
     rejectReasons.push('new-body-skirt-original-triangle-crossing-IDs');
    if(contacts.some(x=>x.contactPlaneDepthWorsened))
     rejectReasons.push('oriented-anatomical-body-plane-depth-worsened');
   }
   const beforeTotal=baseline.reduce((n,x)=>n+x.count,0),
    afterTotal=contacts.reduce((n,x)=>n+x.after,0);
   if(!rejectReasons.length&&afterTotal>=beforeTotal)
    rejectReasons.push('no-measured-improvement-in-original-real-body-pose-crossings');
   const row=Object.freeze({
    approach:regime.name,trueOriginalSkinnedRig:163,
    sampledPoseCount:POSES.length,anatomyWorldCrossSectionMeasurements:envelopeObservations,
    sourceCutoutJPEGAndAlphaBytesPreserved:true,
    originalPhotoTextureUVNeverEdited:true,
    photographFrontSurfacePositionsWereAdjusted:candidate.sourcePhotoFrontVerticesMoved>0,
    photoMotifStretchHasNoHumanAcceptance:photoWarpNotHumanApproved,
    originalSourcePhotoAbsoluteScaleUnknown:true,
    ...candidate,...distort,
    originalStrictSkirtBodyCrossingPairSum:beforeTotal,
    trialStrictSkirtBodyCrossingPairSum:contacts.length===POSES.length?afterTotal:null,
    realOriginalTriangleCrossingComparisons:contacts,
    acceptedForResearchA_BOnly:rejectReasons.length===0,
    refusedReasons:rejectReasons,
    realHumanVisualFitAccepted:false,consumer3DAdmitted:false,
    releaseAuthorized:false
   });
   regimes.push(row);
   if(row.acceptedForResearchA_BOnly&&(!best||
      row.trialStrictSkirtBodyCrossingPairSum<best.trialStrictSkirtBodyCrossingPairSum))
    best=row;
  }
  // Exact source-buffer identity checks: real original photo + mask bytes
  // cannot be modified in any stage; sampled public body never exported.
  for(const [name,copy] of protectedArrays){
   const originalAttr=name==='index'?original.index.array:original.getAttribute(name).array;
   const clonedAttr=name==='index'?cloned.index.array:cloned.getAttribute(name).array;
   if(!same(originalAttr,copy)||!same(clonedAttr,copy))
    throw Error('original-photographed-source-uv-skin-or-faces-mutated');
  }
  if(!same(original.getAttribute('position').array,saved))
   throw Error('original-source-photo-skirt-geometry-was-mutated');
  return Object.freeze({
   schema:'P89-genuine-source-skirt-measured-anatomical-envelope/v1',
   status:best?'BODY_MEASURED_FIT_RESEARCH_CONTACT_REDUCED_NOT_WEARABLE':
    'BODY_MEASURED_SOURCE_FIT_REFUSED_OR_COLLISIONS_REMAIN',
   avatar,sourceId:'commons-0043',nativeSkinnedRigBones:163,
   trueOriginalLicensedGarment:true,originalCutoutReviewOnly:true,
   actualBodyMeasurementsFromOriginalPublicGLBsOnly:true,
   originalSkinnedSourceFacePlaneIntersectionsUsed:fullBody.every(x=>x.actualAnatomicalIndexedFaceCutsUsed),
   sampledActualBonePoses:POSES,radialSourceBands:ROWS,sectorCount:SEGMENTS,
   actualAnatomicalOriginalBodyCrossSectionSummaries:envelopeObservations,
   baselineStrictSkirtBodyTriangleCrossingsAcrossPoses:baseline.reduce((n,x)=>n+x.count,0),
   baselineCrossingsBySourceSkirtBand:baselineCrossingsByGarmentBand,
   candidateRegimes:regimes,
   bestProvisionalStructuralAB:best,
   originalPhotographedFrontColorAndUVPreserved:true,
   originalSkirtSourceBuffersUntouched:true,
   allTestsRevertedNoConsumerGeometryChanged:true,
   originalBodyMeshCoordinatesNotExported:true,sourceUnobservedBackRemainsInferred:true,
   originalPhotoAbsoluteSizingUnknown:true,source2DFallbackRequired:true,
   fabricDrapeDynamicsCertified:false,continuousContactCertified:false,
   garmentLayerSelfCollisionCertified:false,
   physicalAndroidOrIPhoneVerified:false,
   humanVisualPhotoRealismApproved:false,privateOwnerAcceptanceConfirmed:false,
   photoSkirtConsumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const known=['original 163-bone cross-section too incomplete for safe front/back estimation',
   'original skinned CC0 anatomical positions missing',
   'invalid original anatomical skinned vertex',
   'original photographed skirt radius invalid',
   'actual-posed-original-source-BVH-missing',
   'real skinned source contact triangle identity invalid',
   'source-original-bvh-contact-after-body-fit-missing',
   'original-photographed-source-uv-skin-or-faces-mutated',
   'original-source-photo-skirt-geometry-was-mutated'];
  return fail(known.includes(e.message)?e.message:'source-measured-real-body-fit-not-verifiable');
 }finally{
  mesh.geometry=original;
  cleanup(cloned);
  try{applyPose('source');}catch{}
 }
}
