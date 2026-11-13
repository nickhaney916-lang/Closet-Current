/**
 * M2 P2-C52: exact licensed, photographed P61 / P175 163-bone fabric
 * contact DIAGNOSTIC, read-only and research-only.
 *
 * Only source-verified original Commons 0053 may run. This module is
 * installed exclusively in a detached P541 browser donor. It never
 * constructs clothing from a photo, edits any mesh attribute, claims
 * full real-world drape, or exports owner, RGB, XYZ, indices or UV.
 *
 * A 3D sweep-and-prune AABB pass finds posed source face candidates.
 * A strictly interior edge-plane hit proves a transverse 3D crossing
 * for one nonadjacent original face pair. All other close AABB pairs are
 * UNCERTAIN, not certified contacts. Independent full C44/C40 tests
 * remain the authoritative fail-closed research admission checks.
 */
import * as THREE from 'three';
const SOURCE_ID='commons-0053';
const SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const fail=msg=>{throw Error('M2 C52 original-photo diagnostic '+msg);};
const finite=a=>a.every(Number.isFinite);
function strictFaceCrossing52(A,B,eps){
 const n=t=>new THREE.Vector3().subVectors(t[1],t[0])
  .cross(new THREE.Vector3().subVectors(t[2],t[0]));
 const plane=(p,t)=>{
  const normal=n(t),len=normal.length();
  if(!(len>1e-10))return null;
  return normal.dot(new THREE.Vector3().subVectors(p,t[0]))/len;
 };
 const test=(a,b,t)=>{
  const d0=plane(a,t),d1=plane(b,t);
  if(d0===null||d1===null||
    !((d0>eps&&d1< -eps)||(d0< -eps&&d1>eps)))return false;
  const k=d0/(d0-d1);
  if(!(k>eps&&k<1-eps))return false;
  const point=a.clone().lerp(b,k),u=t[1].clone().sub(t[0]),
   v=t[2].clone().sub(t[0]),w=point.sub(t[0]);
  const uu=u.dot(u),uv=u.dot(v),vv=v.dot(v),
   wu=w.dot(u),wv=w.dot(v),den=uu*vv-uv*uv;
  if(!(den>1e-22))return false;
  const x=(vv*wu-uv*wv)/den,y=(uu*wv-uv*wu)/den;
  return x>1e-5&&y>1e-5&&x+y<1-1e-5;
 };
 for(const [a,b] of [[A,B],[B,A]])
  for(const [i,j] of [[0,1],[1,2],[2,0]])
   if(test(a[i],a[j],b))return true;
 return false;
}
function analyze52(coordinates,indices,faceCount,tolerance,budgets){
 const list=[];
 const v=(j)=>new THREE.Vector3(
  coordinates[3*j],coordinates[3*j+1],coordinates[3*j+2]);
 for(let f=0;f<faceCount;f++){
  const ids=[0,1,2].map(k=>indices?indices[3*f+k]:3*f+k);
  const tri=ids.map(v);
  if(tri.some(p=>!finite(p.toArray())))fail('nonfinite source triangle');
  const area=tri[1].clone().sub(tri[0]).cross(
   tri[2].clone().sub(tri[0])).length();
  if(area<1e-10)fail('degenerate authentic garment face');
  const box=new THREE.Box3().setFromPoints(tri);
  list.push({ids,tri,minX:box.min.x,maxX:box.max.x,
   minY:box.min.y,maxY:box.max.y,minZ:box.min.z,maxZ:box.max.z});
 }
 list.sort((a,b)=>a.minX-b.minX);
 let boundsOverlaps=0,strictCrossings=0,compared=0,
  sharedIndexExcluded=0,firstStrict=false,firstUncertain=false;
 let complete=true;const active=[];
 outer:for(const candidate of list){
  for(let i=active.length-1;i>=0;i--)
   if(active[i].maxX+tolerance<candidate.minX)active.splice(i,1);
  for(const other of active){
   if(++compared>budgets.maxComparisons){complete=false;break outer;}
   if(other.maxY+tolerance<candidate.minY||
      candidate.maxY+tolerance<other.minY||
      other.maxZ+tolerance<candidate.minZ||
      candidate.maxZ+tolerance<other.minZ)continue;
   if(other.ids.some(i=>candidate.ids.includes(i))){
    sharedIndexExcluded++;continue;
   }
   if(++boundsOverlaps>budgets.maxCandidatePairs){
    complete=false;break outer;
   }
   const strict=strictFaceCrossing52(other.tri,candidate.tri,1e-7);
   if(strict){strictCrossings++;firstStrict=true;}
   else firstUncertain=true;
   if(strictCrossings>=budgets.maxStrictCrossings){
    complete=false;break outer;
   }
  }
  active.push(candidate);
 }
 return {complete,compared,boundsOverlaps,strictCrossings,
  sharedIndexExcluded,firstStrict,firstUncertain};
}
export function auditActualPhotographedDressSurfaces52({
 root,dress,toleranceMeters=.00002,
 maxSourceFaces=100000,maxComparisons=800000,
 maxCandidatePairs=100000,maxStrictCrossings=64
}={}){
 const mesh=dress?.mesh,g=mesh?.geometry;
 if(!root?.isObject3D||!mesh?.isSkinnedMesh||
    mesh.skeleton?.bones?.length!==163||
    dress?.stats?.sourceId!==SOURCE_ID||
    dress.stats.sourceSHA256!==SHA||
    dress.stats.photographedDressDrape61!==true||
    dress.stats.originalRestPhotoCoordinatesUnchanged61!==true||
    dress.stats.skinIndicesAndWeightsPreserved61!==true||
    dress.stats.sourceTextureAndMaterialPreserved61!==true||
    dress.stats.releaseAuthorized!==false||
    dress.stats.collisionValidated!==false||
    !Number.isFinite(toleranceMeters)||toleranceMeters<0||
    toleranceMeters>.002||
    !Number.isSafeInteger(maxSourceFaces)||maxSourceFaces<1||
    maxSourceFaces>100000||
    !Number.isSafeInteger(maxComparisons)||maxComparisons<1||
    maxComparisons>3000000||
    !Number.isSafeInteger(maxCandidatePairs)||maxCandidatePairs<1||
    maxCandidatePairs>500000||
    !Number.isSafeInteger(maxStrictCrossings)||maxStrictCrossings<1||
    maxStrictCrossings>1024)
  fail('real original licensed SHA-pinned 163-bone P61 dress required');
 const p=g?.getAttribute('position'),rest=g?.getAttribute('dressRest'),
  si=g?.getAttribute('skinIndex'),sw=g?.getAttribute('skinWeight');
 if(!p?.isBufferAttribute||p.itemSize!==3||p.count<3||
    !rest||rest.count!==p.count||!si||!sw||
    si.count!==p.count||sw.count!==p.count)
  fail('original full photo dress/UV/rest/skin surface required');
 // P61's original photographic shader projects the authenticated image\n // directly from dressRest; it does NOT require a fabricated UV or custom\n // photoProjection BufferAttribute. Snapshot and verify all actual fields.\n const indices=g.index?.array??null,
  triangles=(indices?.length??p.count)/3;
 if(!Number.isSafeInteger(triangles)||triangles<1||
    triangles>maxSourceFaces||
    indices&&!Array.from(indices).every(i=>i<p.count))
  fail('original photo face budget or indices invalid');
 const immutable=Object.entries(g.attributes).map(([name,attr])=>
  [name,attr,attr.array.slice()]);
 const indexBefore=indices?.slice()??null,
  source=p.array.slice();
 let bodies=0;
 root.updateMatrixWorld(true);
 root.traverse(obj=>{
  if(obj!==mesh&&obj.isSkinnedMesh&&!obj.userData?.work56Garment&&
     obj.skeleton?.bones?.length===163)bodies++;
 });
 if(bodies<1||bodies>16)
  fail('genuine original anatomical model required');
 mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
 const skinned=new Float32Array(source.length),v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){
  v.fromArray(source,3*i);mesh.applyBoneTransform(i,v);
  v.applyMatrix4(mesh.matrixWorld);
  if(!finite(v.toArray()))fail('invalid genuine source-skinned pose');
  skinned[3*i]=v.x;skinned[3*i+1]=v.y;skinned[3*i+2]=v.z;
 }
 const budget={maxComparisons,maxCandidatePairs,maxStrictCrossings};
 const original=analyze52(source,indices,triangles,toleranceMeters,budget),
  posed=analyze52(skinned,indices,triangles,toleranceMeters,budget);
 for(const [name,attr,bytes] of immutable)
  if(g.getAttribute(name)!==attr||
     attr.array.length!==bytes.length||
     !bytes.every((x,i)=>x===attr.array[i]))
   fail('original source photo, skin or mesh attribute altered: '+name);
 if(indexBefore&&(g.index?.array.length!==indexBefore.length||
    !indexBefore.every((x,i)=>x===g.index.array[i])))
  fail('original photo index buffer changed');
 return Object.freeze({
  schema:'M2-real-original-photo-surface-diagnostic-C52',
  source:'licensed-original-Commons-0053-P61-P175',
  authenticOriginalLicensedDress:true,
  actuallySkinned163Bones:true,
  anatomicalBodyMeshes:bodies,
  originalSourceFaces:triangles,
  sourceFacePairBudget:maxComparisons,
  sourceAndPosedFullPairSweepCompleted:original.complete&&posed.complete,
  originalSourceBoxPairs:original.boundsOverlaps,
  originalSourceStrictCrossings:original.strictCrossings,
  originalSourceUncertainBoxPairs:
   original.boundsOverlaps-original.strictCrossings,
  posedBoxPairs:posed.boundsOverlaps,
  posedStrictCrossings:posed.strictCrossings,
  posedUncertainBoxPairs:posed.boundsOverlaps-posed.strictCrossings,
  sourcePairComparisons:original.compared,
  posedPairComparisons:posed.compared,
  sourceSweepExhausted:!original.complete,
  posedSweepExhausted:!posed.complete,
  anyStrictSourceCrossing:original.firstStrict,
  anyStrictPosedCrossing:posed.firstStrict,
  originalSourcePhotoUVRestSkinAndIndicesUntouched:true,
  noRawGeometryOrPhotoExposed:true,
  boundingBoxOverlapNotProofOfContact:true,
  nonCrossingNotProofOfClearance:true,
  anyContactMustRemainBlocked:true,
  noContinuousSelfCollisionCertificate:true,
  realClothPhysics:false,humanPhotorealismApproval:false,
  realPhoneAcceptance:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
}
