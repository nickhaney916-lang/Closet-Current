/**
 * Closet Current 3D77 — actual posed 163-bone anatomical body-to-photographed
 * jeans triangle intersection audit.  Research only.  No collision "fix"
 * is implied by measuring intersections; source/rear imagery untouched.
 *
 * Earlier bodySurface() nearest source-rest triangle guards do NOT prove
 * deformed skinned mesh collision freedom. This module tests full actual
 * skinned-world triangles from poseGeometry and true MeshBVH intersection.
 * Classification is front-source-sensitive versus source-neutral-rear.
 */
import {posedGeometry,triangleContacts} from '../three-d-42/posed-contact.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
const protectedFields=['position','pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];

export function classifyTrueDenimContacts77(pairs,triangleIndex,frontAttribute,worldPositions){
 if(!Array.isArray(pairs)||!triangleIndex||!frontAttribute||!worldPositions)
  throw Error('3D77 original skinned triangle mapping required');
 const result={sourcePhotoFront:0,sourceNeutralRear:0,left:0,right:0,
  upperLeg:0,lowerLeg:0,unlocated:0,reviewedSegments:0};
 for(const row of pairs){
  const id=row.i;
  if(!Number.isInteger(id)||id<0||3*id+2>=triangleIndex.length)
   throw Error('3D77 source denim collision triangle unmapped');
  const indices=[triangleIndex[3*id],triangleIndex[3*id+1],triangleIndex[3*id+2]];
  if(indices.some(v=>!Number.isInteger(v)||v<0||v>=frontAttribute.count||v>=worldPositions.count))
   throw Error('3D77 source denim triangle index invalid');
  const photo=Math.max(...indices.map(i=>frontAttribute.getX(i)));
  if(photo>=.30)result.sourcePhotoFront++;else result.sourceNeutralRear++;
  const mid=indices.reduce((a,i)=>a+worldPositions.getX(i),0)/3;
  if(mid>=0)result.right++;else result.left++;
  const y=indices.reduce((a,i)=>a+worldPositions.getY(i),0)/3;
  if(y>=.55)result.upperLeg++;else if(y>=.07)result.lowerLeg++;else result.unlocated++;
  result.reviewedSegments++;
 }
 if(result.sourcePhotoFront+result.sourceNeutralRear!==pairs.length||
   result.left+result.right!==pairs.length)
  throw Error('3D77 body contact attribution incomplete');
 return result;
}

export function auditTrueSkinnedPhotographedDenimContact77(pants,root,{pose='source',enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],geometry=mesh?.geometry,position=geometry?.getAttribute('position');
 if(!mesh?.isSkinnedMesh||pants?.meshes?.length!==1||
  !pants.stats?.sourcePhotoDenimSeamContinuity76||
  !pants.stats?.sourcePhotoDenimStructuralFolds75||
  !pants.stats?.independentSewnPattern||
  pants.stats?.photoApplied!==true||
  !isSourceVerifiedDenimId(pants.stats?.sourceId)||
  !/^[a-f0-9]{64}$/.test(pants.stats?.sourceSHA256||'')||
  mesh.skeleton?.bones?.length!==163||
  !root?.isObject3D||!position||position.count<400||
  protectedFields.some(name=>geometry.getAttribute(name)?.count!==position.count))
  throw Error('3D77 requires source SHA-vetted true 163-bone independently skinned 3D76 photographed denim');
 const snapshots=new Map(protectedFields.map(name=>[name,geometry.getAttribute(name).array.slice()]));
 const bodyMeshes=[];root.traverse(m=>{
  if(m.isSkinnedMesh&&!m.userData.work56Garment)bodyMeshes.push(m);
 });
 if(bodyMeshes.length<1||bodyMeshes.some(m=>m.skeleton?.bones?.length!==163))
  throw Error('3D77 needs actual original CC0 163-bone body skinned meshes');
 let body,jeans,contacts;const started=performance.now();
 try{
  body=posedGeometry(bodyMeshes);
  jeans=posedGeometry([mesh]);
  const gp=jeans.g.getAttribute('position');
  const bodyTriangles=(body.g.index?.count||body.g.getAttribute('position').count)/3;
  const garmentTriangles=(jeans.g.index?.count||gp.count)/3;
  if(bodyTriangles<10000||garmentTriangles<200)
   throw Error('3D77 source skinned anatomical triangle surface missing');
  contacts=triangleContacts(jeans.g,body.g,{collect:true});
  const classification=classifyTrueDenimContacts77(
   contacts.pairs,jeans.g.index.array,geometry.getAttribute('pantsSourceFront'),gp);
  for(const name of protectedFields){
   const old=snapshots.get(name),now=geometry.getAttribute(name)?.array;
   if(!now||now.length!==old.length||!now.every((v,i)=>v===old[i]))
    throw Error('3D77 original photo source/UV/rest/position/skin altered: '+name);
  }
  const count=contacts.count;
  if(classification.reviewedSegments!==count)
   throw Error('3D77 real body-to-source denim triangle count incomplete');
  return {...pants,stats:{...pants.stats,
   auditedTrueSkinnedBodyToSourcePhotoDenim77:true,
   poseDenimBodyContactAudit77:pose,
   actualSkinnedBodyTriangles77:bodyTriangles,
   actualSkinnedGarmentTriangles77:garmentTriangles,
   actualSkinnedDenimBodyCrossingSegments77:count,
   actualSkinnedDenimBodyCrossingCategories77:classification,
   actualSkinnedDenimBodyBounds77:contacts.bounds,
   actualSkinnedDenimBodyMaximumLocalOrientedFaceDepth77:contacts.maximumLocalOrientedFaceDepth,
   actualSkinnedDenimBodyLocalDepthNotSigned77:!contacts.depthIsWatertightSigned,
   originalPhotoUVRestFrontSkinPositionsBytePreserved77:true,
   bodyContactAuditMilliseconds77:performance.now()-started,
   bodyContactAssessment77:count?'REVIEW_ACTUAL_TRIANGLE_CROSSINGS':'PASS_SAMPLED_POSE_TRIANGLE_CROSSINGS_ONLY',
   dynamicClothCollisionCertified:false,contactClearanceIsNotVolumeSigned:true,
   humanVisualPhotorealismApproved:false,physicalAndroidIphoneTested:false,
   originalPhotographicBackInvented:false,releaseAuthorized:false}
  };
 }finally{
  jeans?.g?.dispose();body?.g?.dispose();
 }
}
