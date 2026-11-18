/**
 * P89 source-photo skirt x true P541 original skinned 163-bone anatomy:
 * conservative BROAD-PHASE collision *possibility* over vertex-LINEAR
 * interpolation between two fully sampled, source-index-preserved poses.
 *
 * If a linear vertex trajectory's two triangles intersect at any time,
 * their endpoint-union 3D AABBs must overlap. This is a necessary condition,
 * never a sufficient one. Bone rotation in the actual model can follow
 * NONLINEAR trajectories and is deliberately NOT certified by this bound.
 *
 * No original photo, anatomical vertex positions, contact pair IDs, UV, body
 * model, or owner information is retained or emitted. This only blocks
 * optimistic inference of contact safety from sparse static pose samples.
 */
const SKIRT_SHA='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const POSES=['source','blend-25','blend-50','blend-75','relaxed'];
const fail=why=>{throw Error('P89-linear-sweep-original-source: '+why);};
const finite=Number.isFinite;
const idxOK=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const eq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
function validatedGeometry(x,label,expected){
 if(!x||!(x.positions instanceof Float32Array)||!idxOK(x.indices)||
   x.positions.length%3!==0||x.indices.length%3!==0||
   x.positions.length<9||x.positions.length>1_500_000||
   x.indices.length<3||x.indices.length>3_000_000||
   (expected&& (x.positions.length!==343*3||x.indices.length!==576*3)))
  fail(label+'-original-indexed-geometry-shape-missing');
 const n=x.positions.length/3;
 for(const p of x.positions)if(!finite(p)||Math.abs(p)>10)
  fail(label+'-nonfinite-or-unbounded-original-skinned-point');
 for(const id of x.indices)if(id>=n)
  fail(label+'-out-of-range-original-indexed-face');
 return {faces:x.indices.length/3,vertices:n};
}
function faceBox(first,second,face){
 const indices=first.indices,pi=first.positions,qi=second.positions;
 let lx=Infinity,ly=Infinity,lz=Infinity,hx=-Infinity,hy=-Infinity,hz=-Infinity;
 for(let j=0;j<3;j++){
  const offset=indices[3*face+j]*3;
  for(const v of [pi,qi]){
   const x=v[offset],y=v[offset+1],z=v[offset+2];
   lx=Math.min(lx,x);ly=Math.min(ly,y);lz=Math.min(lz,z);
   hx=Math.max(hx,x);hy=Math.max(hy,y);hz=Math.max(hz,z);
  }
 }
 return {lx,ly,lz,hx,hy,hz,face};
}
function intersects(a,b){
 return a.lx<=b.hx&&b.lx<=a.hx&&
  a.ly<=b.hy&&b.ly<=a.hy&&a.lz<=b.hz&&b.lz<=a.hz;
}
function validateContacts(frame,bodyCount){
 const pairs=frame.strictPairs;
 if(!(pairs instanceof Set)||pairs.size>1_000_000)
  fail('immutable-original-face-BVH-pair-witness-required');
 const seen=new Set();
 for(const key of pairs){
  if(typeof key!=='string'||!/^(0|[1-9][0-9]*)\|(0|[1-9][0-9]*)$/.test(key))
   fail('malformed-original-face-BVH-pair-ID');
  const [s,b]=key.split('|').map(Number);
  if(!Number.isSafeInteger(s)||s>=576||!Number.isSafeInteger(b)||b>=bodyCount)
   fail('out-of-bounds-original-face-BVH-pair-ID');
  seen.add(key);
 }
 return seen;
}
/** Strictly two consecutive observed source poses. Refuse fake metadata. */
export function auditOriginalPhotoSkirtLinearSweep89({
 start,end,fromPose,toPose,avatar,sourcePhotoSHA256,sourceAttestationStatus
}={}){
 if(!['male','female'].includes(avatar)||sourcePhotoSHA256!==SKIRT_SHA||
  sourceAttestationStatus!=='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'||
  POSES.indexOf(fromPose)<0||POSES.indexOf(toPose)!==POSES.indexOf(fromPose)+1)
  fail('licensed-source-ordered-consecutive-original-poses-required');
 const s=validatedGeometry(start?.skirt,'start-skirt',true),
  t=validatedGeometry(end?.skirt,'end-skirt',true),
  b=validatedGeometry(start?.body,'start-body',false),
  d=validatedGeometry(end?.body,'end-body',false);
 if(b.faces<1000||b.faces>500000||b.vertices<300||
   s.vertices!==t.vertices||b.vertices!==d.vertices||
   b.faces!==d.faces||s.faces!==t.faces||
   !eq(start.skirt.indices,end.skirt.indices)||
   !eq(start.body.indices,end.body.indices))
  fail('unchanged-authentic-original-source-face-identity-and-body-required');
 const contactsA=validateContacts(start,b.faces),
  contactsB=validateContacts(end,b.faces);
 // One box per original triangle, never BVH transient leaf IDs.
 const bodyBox=Array.from({length:b.faces},(_,i)=>faceBox(start.body,end.body,i));
 const skirtBox=Array.from({length:s.faces},(_,i)=>faceBox(start.skirt,end.skirt,i));
 // Every recorded actual original endpoint crossing MUST be contained in
 // our inflated interval broadphase, even in a degenerate static transition.
 for(const [pairs,label] of [[contactsA,'start'],[contactsB,'end']]){
  for(const key of pairs){
   const [si,bi]=key.split('|').map(Number);
   if(!intersects(skirtBox[si],bodyBox[bi]))
    fail(label+'-real-static-source-BVH-crossing-not-covered-by-sweep');
  }
 }
 const sorted=bodyBox.slice().sort((a,c)=>a.lx-c.lx);
 let count=0,front=0,rear=0,possibleWithoutEndpointStrictProof=0;
 const byBand=Array(6).fill(0),byBandFront=Array(6).fill(0),byBandRear=Array(6).fill(0);
 for(const sbox of skirtBox){
  // Only boxes whose x minimum lies inside the garment interval's x maximum
  // can possibly overlap, retaining all original face IDs.
  let lo=0,hi=sorted.length;
  while(lo<hi){const mid=(lo+hi)>>>1;
   if(sorted[mid].lx<=sbox.hx)lo=mid+1;else hi=mid;
  }
  const band=Math.floor(sbox.face/96),
    sector=Math.floor((sbox.face%96)/2),
    photographicFront=sector<12||sector>=36;
  for(let j=0;j<lo;j++)if(intersects(sbox,sorted[j])){
   count++;byBand[band]++;
   if(photographicFront){front++;byBandFront[band]++;}
   else{rear++;byBandRear[band]++;}
   const key=sbox.face+'|'+sorted[j].face;
   if(!contactsA.has(key)&&!contactsB.has(key))possibleWithoutEndpointStrictProof++;
   if(count>2_000_000)
    fail('too-many-bounded-motion-possibilities-to-audit');
  }
 }
 if(count<contactsA.size||count<contactsB.size||
   count!==front+rear||
   byBand.reduce((a,c)=>a+c,0)!==count||
   byBandFront.reduce((a,c)=>a+c,0)!==front||
   byBandRear.reduce((a,c)=>a+c,0)!==rear)
  fail('conservative-original-skirt-linear-motion-broadphase-invariant');
 return Object.freeze({
  schema:'P89-licensed-original-skirt-linear-endpoint-union-broadphase/v1',
  status:count>0?'POTENTIAL_OR_ACTUAL_SKIRT_BODY_MOTION_CONTACT_BLOCKED':
   'NO_LINEAR_SWEPT_AABB_OVERLAP_OBSERVED_NOT_A_TRUE_BONE_MOTION_CERTIFICATE',
  sourceId:'commons-0043',avatar,fromPose,toPose,
  exactOriginalSkirtSourceFaceCount:576,
  originalBodyIndexedFaceCount:b.faces,
  original163BonePosesSampledAtBothEndpoints:true,
  originalSourceFaceIDsImmutable:true,
  originalEndpointStrictBVHPairCounts:[contactsA.size,contactsB.size],
  conservativeSourceTrianglePairAABBOverlapCount:count,
  potentialPairsNotAlreadyConfirmedByEitherEndpoint:possibleWithoutEndpointStrictProof,
  photoFacingSourcePotentialPairs:front,
  unobservedRearSourcePotentialPairs:rear,
  sourcePhotoBandPotentialPairs:byBand,
  sourcePhotoBandFrontPotentialPairs:byBandFront,
  sourcePhotoBandUnobservedRearPotentialPairs:byBandRear,
  endpointStaticBVHStrictCrossingsContainedInConservativeBroadphase:true,
  originalFacePairIDsPersistedOrEmitted:false,
  originalSkirtAndBodyGeometryPersistedOrEmitted:false,
  linearVertexTrajectoryOnly:true,
  nonlinearActualBoneMotionAndClothDrapeUnverified:true,
  continuousTrueSkeletalMotionSafetyCertified:false,
  wholeBodyInsideOutsideSignCertified:false,
  physicalSourceGarmentDimensionsMeasured:false,
  unseenSkirtRearAndHistoricalWaistClosureVerified:false,
  ownerRealismApproved:false,
  consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
