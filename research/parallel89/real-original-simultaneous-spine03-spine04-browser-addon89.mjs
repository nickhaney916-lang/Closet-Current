/**
 * M2 original authentic public museum garment front + CC0 licensed male/female
 * 163bone skeleton, TWO spine joints moving at the SAME TIME. This is a
 * browser-only additive module appended IN MEMORY to the original SHA-pinned
 * unmodified original photographic THREE source registration.
 */
import {evaluateOriginalSimultaneousSpine03Spine04AngularBroadphase}
 from './simultaneous-two-original-spine-joint-bvh89.mjs';
import {evaluateTwoJointOriginalRectangle}
 from './two-joint-rectangle-safety89.mjs';
import {triageOriginalTwoAngleRectangleFirstWitness}
 from './original-rectangle-first-witness-triage89.mjs';
import {institutionalPartAAnchor}
 from './met70759-physical-garment-dimension-anchor89.mjs';

window.__M2RealRigPhotoTrial.verifyTrueConcurrentSpine03Spine04OriginalSurface=()=>{
 const x=sourceSkinResearch;
 invariant(x?.mesh?.isSkinnedMesh&&x?.model?.snapshots?.length>0&&
  x.body?.skeleton?.bones?.length===163&&
  x.mesh.skeleton===x.body.skeleton&&
  x.lowerName==='spine03'&&x.upperName==='spine04',
  'true-original-licensed-two-moving-named-bones-not-found');
 const model=x.model,frontIndices=faces.slice(
  range.sourcePhotoFront.start,
  range.sourcePhotoFront.start+range.sourcePhotoFront.count);
 invariant(frontIndices.length/3===35262&&x.sourceFrontN===17985,
  'entire-original-museum-photo-front-original-faces-required');
 const parts=model.snapshots.map(entry=>{
  const mesh=entry.mesh,geometry=mesh.geometry,
   vertices=geometry.getAttribute('position'),
   index=geometry.getIndex();
  invariant(mesh.isSkinnedMesh&&mesh.skeleton.bones.length===163&&
   vertices.count>2,'true-original-licensed-body-component-missing');
  const n=index?index.count:vertices.count;
  invariant(n>0&&n%3===0,'actual-original-body-component-face-invalid');
  return {mesh,index,vertexCount:vertices.count,indexCount:n};
 });
 const bodyVertexCount=parts.reduce((v,p)=>v+p.vertexCount,0),
  bodyIndices=new Uint32Array(parts.reduce((v,p)=>v+p.indexCount,0));
 let pos=0,offset=0;
 for(const p of parts){
  for(let i=0;i<p.indexCount;i++){
   const local=p.index?p.index.getX(i):i;
   invariant(Number.isSafeInteger(local)&&local>=0&&
    local<p.vertexCount,'actual-original-body-vertex-index-out-of-range');
   bodyIndices[offset+i]=pos+local;
  }
  pos+=p.vertexCount;offset+=p.indexCount;
 }
 invariant(bodyVertexCount===72771&&bodyIndices.length/3===109064,
  'all-original-licensed-body-anatomy-indexed-faces-required');
 const allBones=x.body.skeleton.bones,
  q3=x.lowerBone.quaternion.clone(),q4=x.posedBone.quaternion.clone();
 const originalLocalPose=allBones.map(b=>({
  b,p:b.position.toArray(),q:b.quaternion.toArray(),
  s:b.scale.toArray()
 }));
 const frozenOther161=()=>originalLocalPose.every(item=>{
  const bone=item.b;
  if(bone===x.lowerBone||bone===x.posedBone)return true;
  return item.p.every((v,k)=>bone.position.toArray()[k]===v)&&
   item.q.every((v,k)=>bone.quaternion.toArray()[k]===v)&&
   item.s.every((v,k)=>bone.scale.toArray()[k]===v);
 });
 const index=frontIndices[0],
  trueOriginalVertex=originalSkinnedVertexWorld(x.mesh,index),
  zeroSeed=x.mesh.applyBoneTransform(index,new THREE.Vector3())
   .applyMatrix4(x.mesh.matrixWorld);
 const realOriginalVsIncorrectZeroSeedDistance=
  trueOriginalVertex.distanceTo(zeroSeed);
 invariant(Number.isFinite(realOriginalVsIncorrectZeroSeedDistance)&&
  realOriginalVsIncorrectZeroSeedDistance>.0001,
  'not-true-original-position-attribute-skinning');
 const actualVertices=(mesh,count)=>{
  const positions=new Float64Array(count*3);
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  for(let i=0;i<count;i++){
   const original=originalSkinnedVertexWorld(mesh,i);
   invariant([original.x,original.y,original.z].every(Number.isFinite),
    'actual-original-simultaneous-joint-pose-nonfinite');
   positions[i*3]=original.x;
   positions[i*3+1]=original.y;
   positions[i*3+2]=original.z;
  }
  return positions;
 };
 const generate=(a,b)=>{
  x.lowerBone.quaternion.copy(q3);
  x.lowerBone.rotateZ(a*Math.PI/180);
  x.posedBone.quaternion.copy(q4);
  x.posedBone.rotateZ(b*Math.PI/180);
  model.root.updateMatrixWorld(true);
  x.body.skeleton.update();
  invariant(frozenOther161(),
   'simultaneous-original-two-joint-pose-mutated-third-bone');
  const front=actualVertices(x.mesh,x.sourceFrontN),
   body=new Float64Array(bodyVertexCount*3);
  let j=0;
  for(const p of parts){
   const v=actualVertices(p.mesh,p.vertexCount);
   body.set(v,j);j+=v.length;
  }
  invariant(j===body.length,'actual-original-licensed-anatomy-truncated');
  return {front,body};
 };
 try{
  const grid=[],path=[],offDiagonal=[];
  for(const a of [-6,0,6])for(const b of [-12,0,12])
   grid.push(generate(a,b));
  for(let i=0;i<5;i++){
   const a=[-6,-3,0,3,6][i],b=[-12,-6,0,6,12][i];
   path.push(generate(a,b));
  }
  for(const [a,b] of [[-3,6],[3,-6]])
   offDiagonal.push({anglesDeg:[a,b],...generate(a,b)});
  const evaluator=evaluateOriginalSimultaneousSpine03Spine04AngularBroadphase({
   frontGridPoses:grid.map(x=>x.front),
   bodyGridPoses:grid.map(x=>x.body),
   frontPoses:path.map(x=>x.front),
   bodyPoses:path.map(x=>x.body),
   independentOffDiagonalHoldouts:offDiagonal.map(x=>({
    anglesDeg:x.anglesDeg,frontVertices:x.front,bodyVertices:x.body
   })),
   frontIndices,bodyIndices,expectedFrontFaces:35262,
   expectedBodyFaces:109064,
   sourceWitness:{
    actualRigBoneCount:163,
    simultaneousMovingNamedBones:['spine03','spine04'],
    other161BoneLocalTransformsFrozen:frozenOther161(),
    independentOriginalSourceJointPoses:true,
    sourceCoordinatesReadFromOriginalPositionAttribute:true,
    originalSourceSkinnedMesh:x.mesh.isSkinnedMesh,
    originalJPEG_SHA256:payload.originalJPEGByteSHA256,
    actualLicensedRigSHA256:model.sha256
   }
  });
  // Independent research: bounding a WHOLE 2D angle domain, not merely the
  // previous single synchronized path. This reuses the TRUE licensed-source
  // grid already measured above; no second skinned-rig/photo mutation.
  const rectangle=evaluateTwoJointOriginalRectangle({
   frontGridPoses:grid.map(q=>q.front),bodyGridPoses:grid.map(q=>q.body),
   independentOffDiagonalHoldouts:offDiagonal.map(h=>({
    anglesDeg:h.anglesDeg,frontVertices:h.front,bodyVertices:h.body
   })),
   frontIndices,bodyIndices,expectedFrontFaces:35262,expectedBodyFaces:109064,
   sourceWitness:{
    actualRigBoneCount:163,
    simultaneousMovingNamedBones:['spine03','spine04'],
    other161BoneLocalTransformsFrozen:frozenOther161(),
    independentOriginalSourceJointPoses:true,
    sourceCoordinatesReadFromOriginalPositionAttribute:true,
    originalSourceSkinnedMesh:x.mesh.isSkinnedMesh,
    originalJPEG_SHA256:payload.originalJPEGByteSHA256,
    actualLicensedRigSHA256:model.sha256
   }
  });
  // One authentic indexed pair at the TRUE four original grid corners
  // and independent center of the blocked rectangle cell. Explicitly
  // DIFFERENT from whole-surface continuous contact certification.
  const originalRectangleWitnessTriage=
   triageOriginalTwoAngleRectangleFirstWitness({
    rectangleAudit:rectangle,
    frontGridPoses:grid.map(p=>p.front),bodyGridPoses:grid.map(p=>p.body),
    frontPathPoses:path.map(p=>p.front),bodyPathPoses:path.map(p=>p.body),
    independentOffDiagonalHoldouts:offDiagonal.map(h=>({
     anglesDeg:h.anglesDeg,frontVertices:h.front,bodyVertices:h.body
    })),
    frontIndices,bodyIndices,expectedFrontFaces:35262,
    expectedBodyFaces:109064
   });
  invariant(rectangle.decision===
   'BLOCKED_UNRESOLVED_ORIGINAL_TWO_ANGLE_RECTANGLE_ENVELOPE_OVERLAP'&&
   originalRectangleWitnessTriage.sourcePoseSamples===5&&
   originalRectangleWitnessTriage.genuineOriginalIndexedFacePairsExamined===1&&
   originalRectangleWitnessTriage.consumer3DAdmitted===false&&
   originalRectangleWitnessTriage.familyAlpha==='HOLD'&&
   originalRectangleWitnessTriage.decision.startsWith('BLOCKED_'),
   'original-rectangle-first-witness-must-require-genuine-pose-and-block');
  // Independently published REAL physical garment catalog dimensions.
  // P89 authenticates the original photographed part; this module only
  // binds that identity to the Met object's part A institutional record.
  // The museum did not publish camera extrinsics, owner fit or a mm/pixel map.
  const museumRealPhysicalPartA=institutionalPartAAnchor({
   source:{objectId:70759,imageId:payload.imageId,
    caption:payload.museumCaption,part:'a',accession:'1983.21a,b',
    originalJPEG_SHA256:payload.originalJPEGByteSHA256,
    decodedOriginalRGB_SHA256:payload.decodedOriginalRGBSHA256},
   trusted:{objectId:70759,imageId:2551406,
    sourcePhotoCaption:'a) front',
    originalJPEG_SHA256:payload.originalJPEGByteSHA256,
    decodedOriginalRGB_SHA256:required.sourceRGB,
    independentOriginalSourceVerifiedByCaller:true}
  });
  invariant(
   museumRealPhysicalPartA.reason==='REAL_CATALOGUED_GARMENT_PART_A_DIMENSIONS_ONLY'&&
   museumRealPhysicalPartA.physicalGarmentPartADimensionsMillimeters.length===990.6&&
   museumRealPhysicalPartA.physicalGarmentPartADimensionsMillimeters.bottomWidth===1333.5&&
   museumRealPhysicalPartA.physicalGarmentPartADimensionsMillimeters.waistBandWidthExcludingLoopButton===723.9&&
   museumRealPhysicalPartA.photoToOriginalRigUnitsPerMillimeter===null&&
   museumRealPhysicalPartA.localPhotoMillimetersPerPixel===null&&
   museumRealPhysicalPartA.consumer3DAdmitted===false&&
   museumRealPhysicalPartA.familyAlpha==='HOLD',
   'original-Met-published-dimensions-must-remain-unregistered-photo-to-rig');
  invariant(rectangle.consumer3DAdmitted===false&&
   rectangle.familyAlpha==='HOLD'&&
   (rectangle.decision.startsWith('BLOCKED_')||
    rectangle.decision.startsWith('RESEARCH_ONLY_')),
   'independent-original-angle-rectangle-must-remain-no-release');
  invariant(evaluator.consumer3DAdmitted===false&&
   evaluator.familyAlpha==='HOLD'&&
   evaluator.allSubmittedOriginalFacesIndexed===true&&
   evaluator.originalFrontFaceCount===35262&&
   evaluator.originalBodyFaceCount===109064,
   'two-original-bone-true-face-scope-or-no-release-broken');
  sourceSkinProvenanceUnchanged();
  assertModelUnchanged(model);
  return {
   schema:'M2-original-licensed-163bone-true-two-simultaneous-spine-joints-full-front-body-BVH/RESEARCH/v1',
   originalJPEG_SHA256:payload.originalJPEGByteSHA256,
   originalDecodedRGB_SHA256:required.sourceRGB,
   originalMachineUnreviewedMaskSHA256:required.conservativeMaskPNG,
   realOriginalLicensedRigKind:x.kind,
   originalLicensed163boneGLBSHA256:model.sha256,
   realOriginalFrontFaces:35262,realOriginalBodyFaces:109064,
   realOriginalFrontVertices:x.sourceFrontN,
   realOriginalBodyVertices:bodyVertexCount,
   originalGridRealJointAnglePairsDegrees:
    [-6,0,6].flatMap(a=>[-12,0,12].map(b=>[a,b])),
   originalSimultaneousPathJointAnglePairsDegrees:
    [[-6,-12],[-3,-6],[0,0],[3,6],[6,12]],
   independentOriginalOffDiagonalPosePairsDegrees:[[-3,6],[3,-6]],
   actualOriginalCorrectedXYZRatherThanZeroSeed:true,
   originalCorrectedVsHistoricalZeroSeedDistanceRigUnits:
    realOriginalVsIncorrectZeroSeedDistance,
   other161BoneLocalPoseTransformsImmutable:true,
   museumOriginalPartARealPhysicalDimensionEvidence:museumRealPhysicalPartA,
   originalRectangleFirstWitnessExactPoseContactTriage:originalRectangleWitnessTriage,
   independentTwoAngleRectangleOriginalFullFaceAudit:rectangle,
   trueSimultaneousTwoJointFullIndexedAudit:evaluator,
   sourcePhotoFrontFloatingWithoutPhysicalCalibratedFit:true,
   simultaneousMotionConstrainedToSingleDiagonalJointAnglePath:true,
   noSewingSeamTextilePhysicsOrUnknownReverseClaim:true,
   ownerRulerOrAnatomicalDimensionsNotMeasured:true,
   originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
   familyAlpha:'HOLD'
  };
 }finally{
  x.lowerBone.quaternion.copy(q3);
  x.posedBone.quaternion.copy(q4);
  model.root.updateMatrixWorld(true);
  x.body.skeleton.update();
 }
};
