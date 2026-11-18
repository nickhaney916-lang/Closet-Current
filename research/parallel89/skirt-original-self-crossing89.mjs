/**
 * Original public photographed P89 skirt: TRUE source-indexed, posed-surface
 * self-crossing audit on the actual original P541 163-bone male/female rig.
 *
 * A valid 3D garment cannot slice through distant parts of itself. Previous
 * BVH tests considered ONLY anatomical-body x garment intersections. This
 * additional strict nonlocal triangle-pair witness fills that missing gate.
 *
 * The 343-vertex, 576-triangle skinned photographed-source shell is a
 * provisional *closed-cylinder research approximation*, NOT physical Qing
 * garment panels, rear/closure/drape or owner-approved clothing.
 *
 * IMPORTANT: Excludes only immediate 2D original-quadrangulation neighbors
 * (including the DUPLICATED j=0/j=48 texture seam). A triangle can share a
 * true edge or UV duplicate line with a neighbor without cloth penetration.
 * This reports unambiguous nonlocal TRANSVERSE self-intersections with
 * nonzero line segment lengths, not coplanar overlap, near-contact, swept
 * collision, watertightness or true cloth dynamics.
 */
import * as THREE from 'three';
import {ExtendedTriangle} from '../../node_modules/three-mesh-bvh/build/index.module.js';
const PHOTO_SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const SECTORS=48, ROWS=7, COUNT=ROWS*(SECTORS+1), FACES=(ROWS-1)*SECTORS*2;
const fail=why=>{throw Error('P89-original-source-cloth-self-crossing: '+why);};
const finite=Number.isFinite;
function geomSource(source){
 const idx=source?.index?.array,position=source?.getAttribute?.('position')?.array;
 if(!source?.isBufferGeometry||!(idx instanceof Uint16Array||idx instanceof Uint32Array)||
  !(position instanceof Float32Array)||idx.length!==FACES*3||
  position.length!==COUNT*3)
  fail('authentic-343-vertex-576-face-original-skirt-source-required');
 for(const n of position)if(!finite(n)||Math.abs(n)>10)
  fail('nonfinite-or-unbounded-original-skinned-source-vertex');
 for(let r=0;r<ROWS-1;r++)for(let j=0;j<SECTORS;j++){
  const id=(r*SECTORS+j)*6,p=r*(SECTORS+1)+j,q=p+SECTORS+1,
   expected=[p,q,p+1,p+1,q,q+1];
  for(let k=0;k<6;k++)if(idx[id+k]!==expected[k])
   fail('original-outward-576-face-index-order-not-attested');
 }
 for(let r=0;r<ROWS;r++){
  const a=3*r*(SECTORS+1),b=a+3*SECTORS;
  if(Math.hypot(position[a]-position[b],
   position[a+1]-position[b+1],position[a+2]-position[b+2])>3e-5)
   fail('source-photographic-UV-split-positional-seam-not-continuous');
 }
 return {idx,position};
}
function makeFace({idx,position},i){
 const v=[],mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
 for(let k=0;k<3;k++){
  const at=idx[i*3+k]*3;
  const coords=[position[at],position[at+1],position[at+2]];
  for(let a=0;a<3;a++){
   mins[a]=Math.min(mins[a],coords[a]);
   maxs[a]=Math.max(maxs[a],coords[a]);
  }
  v.push(new THREE.Vector3(...coords));
 }
 const n=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));
 if(n.lengthSq()<1e-16)fail('degenerate-original-photo-skirt-face');
 return {face:i,band:Math.floor(i/96),sector:Math.floor((i%96)/2),
  front:Math.floor((i%96)/2)<12||Math.floor((i%96)/2)>=36,
  t:new ExtendedTriangle(...v),min:mins,max:maxs};
}
function nearGrid(a,b){
 const deltaSector=Math.abs(a.sector-b.sector),around=Math.min(deltaSector,48-deltaSector);
 return Math.abs(a.band-b.band)<=1&&around<=1;
}
function boxTouch(a,b){
 return a.min[0]<=b.max[0]&&a.max[0]>=b.min[0]&&
  a.min[1]<=b.max[1]&&a.max[1]>=b.min[1]&&
  a.min[2]<=b.max[2]&&a.max[2]>=b.min[2];
}
export function auditOriginalSkirtSourceSelfCrossings89({
 source,avatar,pose,originalPhotoSHA256,sourceAttestationStatus,
 originalSource163BoneRigVerified
}={}){
 if(!['female','male'].includes(avatar)||!POSES.has(pose)||
  originalPhotoSHA256!==PHOTO_SHA||
  sourceAttestationStatus!=='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'||
  originalSource163BoneRigVerified!==true)
  fail('actual-photo-licensed-163bone-original-rig-required');
 const {idx,position}=geomSource(source);
 const beforeIndex=idx.slice(),beforePos=position.slice();
 const faces=Array.from({length:FACES},(_,i)=>makeFace({idx,position},i));
 const line=new THREE.Line3();
 let ignoredLocalGridPairs=0,nonlocalAabbPairs=0,strict=0,coplanarOrTouchAmbiguous=0;
 const pairBySurface={photoFrontToPhotoFront:0,photoFrontToInferredRear:0,
  inferredRearToInferredRear:0},byBand=Array(6).fill(0),byBandFront=Array(6).fill(0);
 for(let i=0;i<FACES;i++){
  const a=faces[i];
  for(let j=i+1;j<FACES;j++){
   const b=faces[j];
   if(nearGrid(a,b)){ignoredLocalGridPairs++;continue;}
   if(!boxTouch(a,b))continue;
   nonlocalAabbPairs++;
   if(a.t.intersectsTriangle(b.t,line)&&line.distance()>1e-5){
    strict++;
    byBand[a.band]++;byBand[b.band]++;
    if(a.front)byBandFront[a.band]++;
    if(b.front)byBandFront[b.band]++;
    if(a.front&&b.front)pairBySurface.photoFrontToPhotoFront++;
    else if(a.front||b.front)pairBySurface.photoFrontToInferredRear++;
    else pairBySurface.inferredRearToInferredRear++;
   }else coplanarOrTouchAmbiguous++;
  }
 }
 if(strict>nonlocalAabbPairs||
  strict!==Object.values(pairBySurface).reduce((s,n)=>s+n,0)||
  2*strict!==byBand.reduce((s,n)=>s+n,0)||
  !Array.from(idx).every((v,i)=>v===beforeIndex[i])||
  !Array.from(position).every((v,i)=>Object.is(v,beforePos[i])))
  fail('original-photo-or-geometry-mutated-or-self-crossing-count-inconsistent');
 return Object.freeze({
  schema:'P89-licensed-source-163bone-photographed-skirt-strict-self-crossings/v1',
  status:strict>0?'ORIGINAL_SOURCE_SKIRT_SELF_INTERSECTION_WITNESSED_BLOCKED':
   'NO_STRICT_NONLOCAL_SELF_CROSSING_WITNESSED_NOT_REAL_CLOTH_CERTIFIED',
  sourceId:'commons-0043',avatar,pose,
  original163BoneGenuineRig:true,
  originalPhotoTriangleCount:FACES,sourceRingCount:ROWS,
  originalSourceUVSplitSeamPairs:ROWS,
  excludedOnlySourceLocalNeighborGridFacePairs:ignoredLocalGridPairs,
  originalSourceNonlocalTriangleAabbCandidatePairs:nonlocalAabbPairs,
  originalStrictNonlocalTriangleSelfCrossings:strict,
  originalPossibleCoplanarOrTouchingUnresolvedPairs:coplanarOrTouchAmbiguous,
  originalSelfCrossingPairsBySourceSurface:pairBySurface,
  originalSelfCrossingFaceHitsBySixSourceBands:byBand,
  originalPhotographedFrontFaceHitsBySixSourceBands:byBandFront,
  originalSourceIndexAndSkinnedPositionArraysUntouched:true,
  originalPhotoAndSkinnedRigNotExported:true,
  rawSourceTrianglePairIDsNotExported:true,
  structuralUVSeamTouchNotMisrepresentedAsSelfCrossing:true,
  phototexturedSourceFrontNotTheActualRear:true,
  actualHistoricalGarmentClosureUnknown:true,
  coplanarFoldsAndNearContactsNotResolved:true,
  continuousNonlinearBoneMotionAndClothDrapeNotCertified:true,
  actualGarmentPhysicalDimensionsUnverified:true,
  independentOwner3DApproved:false,consumer3DAdmitted:false,
  originalPhoto2DFallbackRequired:true,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
}
