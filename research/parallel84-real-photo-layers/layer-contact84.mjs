/**
 * Parallel #84 — source-gated, READ-ONLY distinct-garment posed surface audit.
 * Never reconstructs a garment, changes source bytes / UVs / 163-bone rig,
 * authorizes 3D release, or returns private original-photo/mesh coordinates.
 * Input posed triangle arrays come from the separate skinned adapter. AABB
 * overlap is UNCERTAINTY, not proof of penetration or valid fabric clearance.
 * Only strict transverse interior crossings are positive witnesses.
 */
export const PARALLEL84_SOURCE_REGISTRY = Object.freeze({
  'commons-0016': Object.freeze({
    sha:'e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24',
    category:'blouse',slot:'top',provenance:'licensed source; provisional cutout REVIEW'
  }),
  'commons-0053': Object.freeze({
    sha:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
    category:'dress',slot:'top',provenance:'licensed dress, photographed FRONT only'
  }),
  'licensed-shirt': Object.freeze({
    sha:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
    category:'shirt',slot:'top',provenance:'existing P110 public research source'
  }),
  'licensed-jeans-1': Object.freeze({
    sha:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
    category:'jeans',slot:'bottom',provenance:'existing P110 public research source'
  }),
  'licensed-jeans-2': Object.freeze({
    sha:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
    category:'jeans',slot:'bottom',provenance:'existing P110 public research source'
  })
});
const fail=(reason)=>Object.freeze({
  schema:'parallel84-distinct-source-layer-contact/v1',
  status:'ORIGINAL_PHOTO_2D_FALLBACK',reason,
  safe3D:false,releaseAuthorized:false,humanRealismApproved:false,
  contactClearanceProved:false,originalGarmentGeometryEdited:false
});
const finite=x=>Number.isFinite(x);
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function segmentThroughFace(a,b,t){
  const u=sub(t[1],t[0]),v=sub(t[2],t[0]),n=cross(u,v);
  const norm=Math.sqrt(dot(n,n));
  if(!(norm>1e-10))return false;
  const d0=dot(n,sub(a,t[0]))/norm,d1=dot(n,sub(b,t[0]))/norm;
  if(!((d0>1e-7&&d1< -1e-7)||(d0< -1e-7&&d1>1e-7)))return false;
  const f=d0/(d0-d1);
  if(!(f>1e-7&&f<1-1e-7))return false;
  const p=[a[0]+f*(b[0]-a[0]),a[1]+f*(b[1]-a[1]),a[2]+f*(b[2]-a[2])];
  const w=sub(p,t[0]),uu=dot(u,u),uv=dot(u,v),vv=dot(v,v);
  const wu=dot(w,u),wv=dot(w,v),den=uu*vv-uv*uv;
  if(!(den>1e-22))return false;
  const x=(vv*wu-uv*wv)/den,y=(uu*wv-uv*wu)/den;
  return x>1e-5&&y>1e-5&&x+y<1-1e-5;
}
function strictTransverseCrossing(a,b){
  for(const [x,y] of [[a,b],[b,a]]){
    for(const [i,j] of [[0,1],[1,2],[2,0]])
      if(segmentThroughFace(x[i],x[j],y))return true;
  }
  return false;
}
function preparedFaces(triangles,part,maxFaces,faceCounter){
  if(!(triangles instanceof Float32Array||triangles instanceof Float64Array)||
      triangles.length===0||triangles.length%9!==0||
      triangles.length/9>maxFaces)throw Error('unsupported-face-input');
  faceCounter.count+=triangles.length/9;
  if(faceCounter.count>maxFaces)throw Error('face-budget');
  const result=[];
  for(let i=0;i<triangles.length;i+=9){
    const tri=[[triangles[i],triangles[i+1],triangles[i+2]],
      [triangles[i+3],triangles[i+4],triangles[i+5]],
      [triangles[i+6],triangles[i+7],triangles[i+8]]];
    if(!tri.flat().every(finite))throw Error('nonfinite-face');
    const v=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0]));
    if(!(dot(v,v)>1e-20))throw Error('degenerate-face');
    result.push({part,tri,
      lo: [0,1,2].map(k=>Math.min(...tri.map(p=>p[k]))),
      hi: [0,1,2].map(k=>Math.max(...tri.map(p=>p[k])))});
  }
  return result;
}
const optionsOK=(m,c,f,t)=>Number.isSafeInteger(m)&&m>=1&&m<=3000000&&
 Number.isSafeInteger(c)&&c>=1&&c<=500000&&
 Number.isSafeInteger(f)&&f>=2&&f<=60000&&
 finite(t)&&t>=0&&t<=.002;
/**
 * Items describe existing SHA-verified public research PHOTO-TO-MESH sources,
 * not arbitrary owner wardrobe entries. Existing owner session, texture, skin
 * and source identity checks must pass BEFORE constructing these read-only
 * world-space pose samples; metadata here is a defense in depth, not a proof
 * of cryptographic or human review. Only top+bottom is presently testable.
 */
export function auditDistinctPhotoLayers84({
 items,avatar,pose='neutral',maxComparisons=800000,
 maxCandidatePairs=100000,maxFaces=30000,toleranceMeters=.00002
}={}){
 if(!['female','male'].includes(avatar)||
    !['neutral','arms-raised','walking'].includes(pose)||
    !optionsOK(maxComparisons,maxCandidatePairs,maxFaces,toleranceMeters))
   return fail('avatar-pose-or-budget-invalid');
 if(!Array.isArray(items)||items.length!==2||items.some(x=>!x||typeof x!=='object'))
   return fail('exactly-two-distinct-sourced-garments-required');
 const [a,b]=items,srcA=PARALLEL84_SOURCE_REGISTRY[a.sourceId],
  srcB=PARALLEL84_SOURCE_REGISTRY[b.sourceId];
 const match=(item,registry)=>registry&&registry.sha===item.sourceSHA256&&
  registry.slot===item.slot&&item.originalPhotoSHA256Verified===true&&
  item.actualPhotoTexelsOnSkinnedMesh===true&&
  item.actual163BoneSourceMesh===true&&
  item.originalSourceGeometryUnmodified===true&&
  item.rearViewPhotographed!==true&&
  (item.triangles instanceof Float32Array||item.triangles instanceof Float64Array);
 if(!match(a,srcA)||!match(b,srcB)||a.sourceId===b.sourceId)
   return fail('source-photo-texture-rig-or-identity-unverified');
 if(!(a.slot==='top'&&b.slot==='bottom'&&
      ['shirt','blouse'].includes(srcA.category)&&srcB.category==='jeans'))
   return fail('category-or-layer-not-supported-by-real-source-mesh');
 let faces=[],counter={count:0};
 try{
  faces=[...preparedFaces(a.triangles,0,maxFaces,counter),
         ...preparedFaces(b.triangles,1,maxFaces,counter)];
 }catch(e){return fail(String(e.message).replace(/[^a-z-]/g,''));}
 faces.sort((x,y)=>x.lo[0]-y.lo[0]);
 const active=[];
 let comparisons=0,candidates=0,crossings=0,uncertain=0,complete=true;
 outer:for(const candidate of faces){
  for(let k=active.length-1;k>=0;k--)
   if(active[k].hi[0]+toleranceMeters<candidate.lo[0])active.splice(k,1);
  for(const previous of active){
   if(previous.part===candidate.part)continue;
   if(++comparisons>maxComparisons){complete=false;break outer;}
   if(previous.hi[1]+toleranceMeters<candidate.lo[1]||
      candidate.hi[1]+toleranceMeters<previous.lo[1]||
      previous.hi[2]+toleranceMeters<candidate.lo[2]||
      candidate.hi[2]+toleranceMeters<previous.lo[2])continue;
   if(++candidates>maxCandidatePairs){complete=false;break outer;}
   if(strictTransverseCrossing(previous.tri,candidate.tri))crossings++;
   else uncertain++;
  }
  active.push(candidate);
 }
 const status=!complete?'INCOMPLETE_BUDGET':
   crossings?'STRICT_CROSSING_VETO':'UNCERTAIN_NOT_CLEARANCE';
 // Bounds overlap and zero strict crossings never certify layered cloth safety:
 // coplanar overlaps, containment and unobserved motion remain unresolved.
 return Object.freeze({
  schema:'parallel84-distinct-source-layer-contact/v1',
  status,reason:status,avatar,pose,
  distinctSourcePhotoMeshClaims:2,
  originalSourceFaceCount:counter.count,
  sourcePair:'top-bottom',
  bboxComparisonCount:Math.min(comparisons,maxComparisons),
  aabbCandidatePairs:Math.min(candidates,maxCandidatePairs),
  strictTransverseCrossings:crossings,uncertainAabbPairs:uncertain,
  budgetComplete:complete,unobservedBacks:2,
  anyCrossingVeto:crossings>0,
  safe3D:false,releaseAuthorized:false,humanRealismApproved:false,
  contactClearanceProved:false,originalGarmentGeometryEdited:false,
  measurementsAreSinglePoseOnly:true
 });
}
