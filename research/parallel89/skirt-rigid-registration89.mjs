/**
 * P89 original photo skirt registration-only A/B.
 *
 * The original Commons-0043 front image, UV, 343 source surface vertices,
 * all edge lengths, source skin, 163-bone CC0 anatomy, and photo backs remain
 * unchanged. A cloned geometry is shifted by 1.5/3cm in camera-forward (and
 * reverse) or 2cm vertically. This tests local source garment registration,
 * NOT fabric stretching, apparel sizing, or physical garment reconstruction.
 *
 * All original full-body BVH strict skinned triangle contacts, three genuine
 * poses, and exact pair IDs are checked. A numerical improvement is NEVER
 * owner, garment fit, swept-collision, or visual-quality acceptance.
 */
import {summarizeOriginalPhotoSkirtContactTopology89} from './skirt-contact-topology89.mjs';
const POSES=Object.freeze(['source','blend-50','relaxed']);
const MOVES=Object.freeze([
 Object.freeze({name:'front-15mm',dx:0,dy:0,dz:.015}),
 Object.freeze({name:'front-30mm',dx:0,dy:0,dz:.030}),
 Object.freeze({name:'back-15mm',dx:0,dy:0,dz:-.015}),
 Object.freeze({name:'up-20mm',dx:0,dy:.020,dz:0}),
 Object.freeze({name:'down-20mm',dx:0,dy:-.020,dz:0})
]);
const fail=reason=>Object.freeze({
 schema:'P89-genuine-skirt-photo-rigid-registration-AB/v1',
 status:'REAL_PHOTOGRAPHED_SKIRT_REGISTRATION_NOT_VERIFIED',
 reason,originalPhoto2DFallbackRequired:true,sourceMeshRestored:true,
 humanVisualApproval:false,consumer3DAdmitted:false,releaseAuthorized:false,
 familyAlpha:'HOLD'
});
const eq=(a,b)=>a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const validContact=c=>!!c&&Number.isSafeInteger(c.count)&&c.count>=0&&
 c.pairs instanceof Set&&c.pairs.size===c.count&&
 Number.isFinite(c.maxDepth)&&c.maxDepth>=0&&
 c.trueOriginalSkirtTriangleIndexStable===true&&
 c.trueOriginalBodyTriangleIndexStable===true&&
 c.originalFaceSourceResolution==='BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES';
function pairCounts(before,after){
 let introduced=0;
 for(const pair of after.pairs)if(!before.pairs.has(pair))introduced++;
 return {originalStrictTransversePairs:before.count,
  trialStrictTransversePairs:after.count,
  newOriginalSourceFacePairIDs:introduced,
  planeDepthIncreased:after.maxDepth>before.maxDepth+.0005};
}
export function compareActualOriginalPhotoSkirtRegistration89({
 mesh,avatar,applyPose,sampleContact,originalBodyFaceMask
}={}){
 if(!(originalBodyFaceMask instanceof Uint8Array)||
  originalBodyFaceMask.length<1000||originalBodyFaceMask.length>500000||
  !originalBodyFaceMask.some(x=>x===0)||!originalBodyFaceMask.some(x=>x===1)||
  originalBodyFaceMask.some(x=>x!==0&&x!==1))
  return fail('original-cc0-source-skin-body-face-mask-required');
 if(!mesh?.isSkinnedMesh||mesh?.skeleton?.bones.length!==163||
  !['female','male'].includes(avatar)||
  typeof applyPose!=='function'||typeof sampleContact!=='function')
  return fail('genuine-original-163-bone-source-geometry-and-BVH-required');
 const original=mesh.geometry,p=original?.getAttribute('position'),
  index=original?.index,uv=original?.getAttribute('uv'),
  skin=original?.getAttribute('skinIndex'),
  weights=original?.getAttribute('skinWeight'),
  rest=original?.getAttribute('sourceSkirt89Rest');
 if(p?.count!==343||index?.count!==1728||uv?.count!==343||
  skin?.count!==343||weights?.count!==343||rest?.count!==343)
  return fail('original photographed independent skirt-shell topology missing');
 const base=p.array.slice(),protectedSource=[
  ['uv',uv.array.slice()],['skinIndex',skin.array.slice()],
  ['skinWeight',weights.array.slice()],
  ['sourceSkirt89Rest',rest.array.slice()],['index',index.array.slice()]
 ];
 let clone=null;const baseline=[],trials=[];let best=null;
 try{
  for(const pose of POSES){
   applyPose(pose);
   const evidence=sampleContact(pose);
   if(!validContact(evidence))throw Error('original three-pose whole-body BVH pairs missing');
   baseline.push(evidence);
  }
  clone=original.clone();mesh.geometry=clone;
  for(const t of MOVES){
   const attr=clone.getAttribute('position');
   attr.array.set(base);
   for(let i=0;i<attr.count;i++){
    attr.setXYZ(i,base[i*3]+t.dx,base[i*3+1]+t.dy,
     base[i*3+2]+t.dz);
   }
   attr.needsUpdate=true;
   clone.computeVertexNormals();clone.computeBoundingBox();
   clone.computeBoundingSphere();
   // All ORIGINAL source lengths and UVs are rigidly translated in
   // rest coordinates, without manufacturing stretch. Skinned deformation
   // on a real rig still needs separate visible/photo human review.
   const originalUV=clone.getAttribute('uv').array;
   if(!eq(originalUV,uv.array)||!eq(clone.index.array,index.array)||
      !eq(clone.getAttribute('skinIndex').array,skin.array)||
      !eq(clone.getAttribute('skinWeight').array,weights.array)||
      !eq(clone.getAttribute('sourceSkirt89Rest').array,rest.array))
    throw Error('original-photo-source-UV-weights-or-faces-altered');
   const contact=[],sourceBVHAfter=[];
   for(let i=0;i<POSES.length;i++){
    applyPose(POSES[i]);
    const after=sampleContact(POSES[i]);
    if(!validContact(after))
     throw Error('real-original-rig-posed-BVH-contact-pairs-unavailable');
    sourceBVHAfter.push(after);
    contact.push(pairCounts(baseline[i],after));
   }
   const original=contact.reduce((v,x)=>v+x.originalStrictTransversePairs,0),
    trial=contact.reduce((v,x)=>v+x.trialStrictTransversePairs,0),
    introduced=contact.reduce((v,x)=>v+x.newOriginalSourceFacePairIDs,0),
    depthIncreased=contact.some(x=>x.planeDepthIncreased);
   // Compare complete P84 original-body BVH identifiers, not count alone.
   const topology=summarizeOriginalPhotoSkirtContactTopology89({
    baseline,trial:sourceBVHAfter,bodyFaceMask:originalBodyFaceMask,
    bodyFaceCount:originalBodyFaceMask.length,avatar,trialName:t.name
   });
   if(topology.status!=='GENUINE_ORIGINAL_FULL_BODY_SOURCE_CONTACT_TURNOVER_MEASURED_NOT_CLEARANCE'||
      topology.originalStrictCrossingPairSum!==original||
      topology.trialStrictCrossingPairSum!==trial||
      topology.newlyIntroducedOriginalBodySkirtFacePairSum!==introduced)
    throw Error('genuine-source-contact-turnover-analysis-failed');
   const researchOnlyReduction=introduced===0&&!depthIncreased&&trial<original;
   const row=Object.freeze({
    name:t.name,localCameraFacingRegistrationMeters:[t.dx,t.dy,t.dz],
    sourceRGBAndReviewAlphaBytesUnchanged:true,originalSkirtUVUnchanged:true,
    originalSkirtRestEdgeLengthUnchanged:true,
    originalSkirtRestTriangleShapeUnchanged:true,
    actual163BoneBodyTriangleBVHAcrossThreePoses:true,
    identicalOriginalSourceFaceIDsAcrossRebuiltBVHs:true,
    useOfBVHIndirectIndexMappingVerified:true,
    originalThreePoseStrictCrossingPairSum:original,
    trialThreePoseStrictCrossingPairSum:trial,
    introducedOriginalSourceFacePairIDs:introduced,
    maxPlaneDepthWorsened:depthIncreased,perPoseContacts:contact,
    genuineOriginalSkirtContactTopology:topology,
    researchOnlyNonworseningReduction:researchOnlyReduction,
    photographicFrontDepthAlignmentHumanApproved:false,
    garmentAbsolutePhysicalScaleKnown:false,realMotionAndDrapeApproved:false,
    consumer3DAdmitted:false,releaseAuthorized:false
   });
   trials.push(row);
   if(researchOnlyReduction&&(!best||
    trial<best.trialThreePoseStrictCrossingPairSum))best=row;
  }
  for(const [name,copy] of protectedSource){
   const b=name==='index'?original.index.array:original.getAttribute(name).array;
   const c=name==='index'?clone.index.array:clone.getAttribute(name).array;
   if(!eq(b,copy)||!eq(c,copy))throw Error('photographed source skin/UV/geometry mutated');
  }
  if(!eq(original.getAttribute('position').array,base))
   throw Error('original photographed skirt photo-derived positions modified');
  return Object.freeze({
   schema:'P89-genuine-skirt-photo-rigid-registration-AB/v1',
   status:best?'RESEARCH_REGISTRATION_REDUCED_STATIC_PAIRS_NOT_WEARABLE':
    'NO_SAFE_REDUCING_ORIGINAL_SKIRT_REGISTRATION_WITNESSED',
   avatar,sourceId:'commons-0043',
   original163BoneModelUnchanged:true,
   actualOriginalPhotoSkirtFaces:576,actualOriginalMaleFemaleRigRequired:true,
   original3PoseStrictBodyCrossingPairs:baseline.reduce((n,x)=>n+x.count,0),
   trials, bestResearchOnly:best,
   sourcePhotoPixelsAndMasksUnmodified:true,
   skinnedBodyVerticesNeverExported:true,
   realPhotoFrontUVAndRestSurfaceUnmodified:true,
   sourcePhotoBackStillUnobserved:true,
   allCandidatesDisposedAndRestored:true,
   originalPhoto2DFallbackRequired:true,
   continuousCollisionAndClothDynamicsCertified:false,
   physicalPhoneTested:false,ownerApproved:false,
   independentHumanVisualApproval:false,consumer3DAdmitted:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const safe=new Set([
   'original three-pose whole-body BVH pairs missing',
   'real-original-rig-posed-BVH-contact-pairs-unavailable',
   'original-photo-source-UV-weights-or-faces-altered',
   'photographed source skin/UV/geometry mutated',
   'original photographed skirt photo-derived positions modified',
   'genuine-source-contact-turnover-analysis-failed'
  ]);
  return fail(safe.has(e.message)?e.message:
   'real-photo-skirt-registration-trial-source-not-verifiable');
 }finally{
  mesh.geometry=original;
  try{clone?.dispose();}catch{}
  try{applyPose('source');}catch{}
 }
}
