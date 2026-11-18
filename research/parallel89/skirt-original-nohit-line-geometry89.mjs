/**
 * Mission 2 P89 — TRUE original source-indexed anatomical skirt NO-HIT
 * ray geometry disambiguation. Read-only exact original skin/source IDs.
 * For a ray with NO forward original-body source contour (0 <= t <= 3),
 * classify the genuine same-plane original line intersection:
 * - forward beyond the original 3m methodological cap
 * - original source face behind the photographed skirt's measured ring center
 * - original source face collinear/edge tangent only (ambiguous)
 * - no indexed source plane segment intersecting the infinite angular line.
 *
 * Original source skinned body is NOT a closed volume. A backside line
 * witness, changed origin or missing angular line does NOT mean skirt fit.
 * Body GLB and original photograph/UV/owner private data are never changed.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const classes=Object.freeze([
 'SOURCE_FORWARD_BEYOND_RAY_CAP',
 'SOURCE_BEHIND_ORIGINAL_SKIRT_CENTER',
 'SOURCE_COLLINEAR_OR_DEGENERATE_LINE',
 'NO_ORIGINAL_SOURCE_PLANE_LINE_INTERSECTION'
]);
const indexArray=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const printable=x=>typeof x==='string'&&x.length>0&&x.length<=96&&/^[\x20-\x7e]+$/.test(x);
const zeros=()=>Object.fromEntries(classes.map(k=>[k,0]));
const sum=x=>Object.values(x).reduce((n,v)=>n+v,0);
const error=reason=>Object.freeze({
 schema:'P89-locked-original-nohit-anatomy-plane-line/v1',
 status:'ORIGINAL_SKIRT_SOURCE_LINE_ANALYSIS_UNVERIFIABLE',reason,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 signedBodyContainmentCertified:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
function kind(n){
 const s=n.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(s))
  return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(s))
  return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(s))
  return 'CORE_TORSO_HIPS';
 return 'UNCLASSIFIED_BONE';
}
function validate(a){
 const {bodyPositions:p,bodyIndices:idx,skirtPositions:s,skirtIndices:si,
  coreBodyFaceMask:m,skinIndices:bi,skinWeights:bw,
  sourceMeshIds:mi,sourceMeshNames:mn,sourceBoneNamesByMesh:bn}=a;
 if(!(p instanceof Float32Array)||p.length<12||p.length%3!==0||
  p.length>2_100_000||!indexArray(idx)||idx.length<6||
  idx.length%3!==0||idx.length>3_000_000||
  !(s instanceof Float32Array)||s.length!==343*3||
  !indexArray(si)||si.length!==576*3||
  !(m instanceof Uint8Array)||m.length!==idx.length/3||
  !(bi instanceof Uint16Array)||bi.length!==p.length/3*4||
  !(bw instanceof Float32Array)||bw.length!==bi.length||
  !(mi instanceof Uint16Array)||mi.length!==p.length/3||
  !Array.isArray(mn)||mn.length===0||mn.length>256||mn.some(x=>!printable(x))||
  !Array.isArray(bn)||bn.length!==mn.length||
  bn.some(v=>!Array.isArray(v)||v.length!==163||v.some(x=>!printable(x))))
  throw Error('original-indexed-163bone-source-geometry-required');
 for(const v of p)if(!finite(v))throw Error('invalid-original-body-source-position');
 for(const v of s)if(!finite(v))throw Error('invalid-original-skirt-source-position');
 for(const i of idx)if(i>=p.length/3)throw Error('invalid-original-indexed-body-face');
 for(const i of si)if(i>=343)throw Error('invalid-original-indexed-skirt-face');
 if(m.some(x=>x!==0&&x!==1))throw Error('invalid-original-source-core-face-mask');
 for(const x of mi)if(x>=mn.length)throw Error('invalid-original-source-mesh-id');
 for(let i=0;i<p.length/3;i++){
  let total=0;
  for(let k=0;k<4;k++){
   const w=bw[i*4+k],bone=bi[i*4+k];
   if(!finite(w)||w<0||w>1||bone>=163)
    throw Error('invalid-original-source-skin-weight-or-bone');
   total+=w;
  }
  if(Math.abs(total-1)>.003)
   throw Error('unnormalized-original-source-skin-weights');
 }
 let min=Infinity,max=-Infinity;
 for(let i=1;i<s.length;i+=3){min=Math.min(min,s[i]);max=Math.max(max,s[i]);}
 if(max-min<.06||max-min>2.5)throw Error('invalid-original-photo-skirt-span');
}
function section(p,a,b,c,y){
 const ids=[a,b,c],points=[];
 for(let k=0;k<3;k++){
  const s=ids[k],t=ids[(k+1)%3],y0=p[s*3+1],y1=p[t*3+1];
  if(Math.abs(y1-y0)<1e-10)continue;
  const f=(y-y0)/(y1-y0);
  if(f<0||f>1)continue;
  const x=p[s*3]+f*(p[t*3]-p[s*3]),
   z=p[s*3+2]+f*(p[t*3+2]-p[s*3+2]);
  if(!points.some(q=>Math.hypot(q[0]-x,q[1]-z)<1e-7))points.push([x,z]);
 }
 return points.length===2?
  [points[0][0],points[0][1],points[1][0],points[1][1]]:null;
}
function ray(segs,cx,cz,ux,uz){
 let far=-1,parallelAmbiguous=false;
 for(const [ax,az,bx,bz] of segs){
  const ex=bx-ax,ez=bz-az,px=ax-cx,pz=az-cz,
   det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)parallelAmbiguous=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,v=(px*uz-pz*ux)/det;
  if(t>=0&&t<=3&&v>=-1e-9&&v<=1+1e-9)
   far=Math.max(far,t);
 }
 return {hit:far>=0,far,parallelAmbiguous};
}
function infiniteLine(segs,cx,cz,ux,uz){
 let forwardBeyond=false,behind=false,collinear=false,intersectionCount=0,
  nearestBehind=Infinity,nearestForward=Infinity;
 for(const [ax,az,bx,bz] of segs){
  const ex=bx-ax,ez=bz-az,px=ax-cx,pz=az-cz,
   det=ux*ez-uz*ex;
  if(Math.abs(det)<1e-11){
   if(Math.abs(px*uz-pz*ux)<1e-9)collinear=true;
   continue;
  }
  const t=(px*ez-pz*ex)/det,v=(px*uz-pz*ux)/det;
  if(v< -1e-9||v>1+1e-9)continue;
  intersectionCount++;
  if(t>3){forwardBeyond=true;nearestForward=Math.min(nearestForward,t);}
  else if(t<0){behind=true;nearestBehind=Math.min(nearestBehind,-t);}
  // A forward hit inside 0..3 would be a provenance disagreement for
  // genuine prior no-hit unless strict collinear priority caused UNKNOWN.
 }
 return {forwardBeyond,behind,collinear,intersectionCount,
  nearestBehind,nearestForward};
}
export function summarizeOriginalNoHitLineGeometry89(a={}){
 validate(a);
 const {bodyPositions:p,bodyIndices:idx,skirtPositions:s,
  coreBodyFaceMask:m,skinIndices:bi,skinWeights:bw,
  sourceMeshIds:mi,sourceMeshNames:mn,sourceBoneNamesByMesh:bn}=a;
 const vertices=p.length/3,faces=idx.length/3,regs=new Array(vertices);
 for(let i=0;i<vertices;i++){
  const base=i*4,mesh=mi[i];
  let max=-1,dominantBone=0;
  for(let k=0;k<4;k++)if(bw[base+k]>max){max=bw[base+k];dominantBone=bi[base+k];}
  regs[i]=max<.5?'UNCLASSIFIED_BONE':kind(bn[mesh][dominantBone]);
 }
 const sourceFaces=new Array(faces);
 for(let f=0;f<faces;f++){
  const a0=idx[f*3],b=idx[f*3+1],c=idx[f*3+2],
   ids=[a0,b,c],sameMesh=mi[a0]===mi[b]&&mi[b]===mi[c],
   strictlyAllowed=sameMesh&&m[f]===1&&ids.every(v=>
    regs[v]==='CORE_TORSO_HIPS'||regs[v]==='CORE_LEGS');
  sourceFaces[f]={a:a0,b,c,strictlyAllowed,
   sourceMeshName:sameMesh?mn[mi[a0]]:'CROSS_ORIGINAL_MESH'};
 }
 let strictInward=0,strictOutward=0,strictNear=0,strictUnknown=0,
  originalExcluded=0,originalNoHit=0,originalCollinear=0;
 const reasons=zeros(),bandTotals=[],behindByMesh=new Map();
 let ringsWithNoAnatomySegments=0;
 for(let row=0;row<7;row++){
  let cx=0,cz=0,y=0;
  for(let i=0;i<48;i++){
   const off=3*(row*49+i);
   cx+=s[off];cz+=s[off+2];y+=s[off+1];
  }
  cx/=48;cz/=48;y/=48;
  const core=[],excluded=[],all=[],byMesh=new Map();
  for(const f of sourceFaces){
   const xy=section(p,f.a,f.b,f.c,y);
   if(!xy)continue;
   if(f.strictlyAllowed)core.push(xy);else excluded.push(xy);
   all.push(xy);
   if(!byMesh.has(f.sourceMeshName))byMesh.set(f.sourceMeshName,[]);
   byMesh.get(f.sourceMeshName).push(xy);
  }
  if(!all.length)ringsWithNoAnatomySegments++;
  const counts=zeros();
  let bUnknown=0,bExcluded=0,bNoHit=0,bIn=0,bOut=0,bNear=0;
  const noHitSectors=[];
  for(let i=0;i<48;i++){
   const off=3*(row*49+i),dx=s[off]-cx,dz=s[off+2],
    radius=Math.hypot(dx,dz);
   if(!(radius>.005&&radius<3)){
    strictUnknown++;bUnknown++;originalNoHit++;bNoHit++;
    reasons.NO_ORIGINAL_SOURCE_PLANE_LINE_INTERSECTION++;
    counts.NO_ORIGINAL_SOURCE_PLANE_LINE_INTERSECTION++;
    noHitSectors.push(i);
    continue;
   }
   const ux=dx/radius,uz=dz/radius,
    original=ray(core,cx,cz,ux,uz);
   if(!original.parallelAmbiguous&&core.length&&original.hit){
    const gap=radius-original.far;
    if(gap<-.002){strictInward++;bIn++;}
    else if(gap<=.002){strictNear++;bNear++;}
    else{strictOutward++;bOut++;}
    continue;
   }
   strictUnknown++;bUnknown++;
   const other=ray(excluded,cx,cz,ux,uz);
   if(other.hit){originalExcluded++;bExcluded++;continue;}
   originalNoHit++;bNoHit++;
   noHitSectors.push(i);
   const line=infiniteLine(all,cx,cz,ux,uz);
   // Full original line, not just a 3m outward ray; mutually exclusive
   // geometric cause labels. These are NOT inferred garment clearances.
   const reason=line.forwardBeyond?'SOURCE_FORWARD_BEYOND_RAY_CAP':
    line.behind?'SOURCE_BEHIND_ORIGINAL_SKIRT_CENTER':
    line.collinear?'SOURCE_COLLINEAR_OR_DEGENERATE_LINE':
    'NO_ORIGINAL_SOURCE_PLANE_LINE_INTERSECTION';
   counts[reason]++;reasons[reason]++;
   if(line.collinear||original.parallelAmbiguous)originalCollinear++;
   if(reason==='SOURCE_BEHIND_ORIGINAL_SKIRT_CENTER'){
    // Named public original source mesh witnesses only. Do not emit XYZ.
    for(const [name,segs] of byMesh){
     if(infiniteLine(segs,cx,cz,ux,uz).behind)
      behindByMesh.set(name,(behindByMesh.get(name)||0)+1);
    }
   }
  }
  if(bIn+bOut+bNear+bUnknown!==48||bExcluded+bNoHit!==bUnknown||
   sum(counts)!==bNoHit)
   throw Error('source-original-nohit-ring-ray-accounting-failed');
  bandTotals.push(Object.freeze({
   originalPhotoSkirtBand:row,originalBodyPlaneSegments:all.length,
   originalStrictInward:bIn,originalStrictOutward:bOut,originalStrictNear:bNear,
   originalStrictUnknown:bUnknown,originalExcludedBodySourceHit:bExcluded,
   originalNoForwardBodySourceRayHit:bNoHit,
   noHitLineGeometryReasons:counts,
   noHitSourceAngularSectors:noHitSectors // 0..47 ONLY, source world frame
  }));
 }
 if(strictInward+strictOutward+strictNear+strictUnknown!==336||
  strictUnknown!==originalExcluded+originalNoHit||
  sum(reasons)!==originalNoHit||
  bandTotals.reduce((n,b)=>n+b.originalNoForwardBodySourceRayHit,0)!==originalNoHit)
  throw Error('source-original-nohit-line-reason-conservation-failed');
 return Object.freeze({
  schema:'P89-true-original-skirt-nohit-line-geometry/v1',
  originalSourceIndexedBodyFaceCount:faces,
  originalPhotoSkirtSourceRayCount:336,
  originalStrictCoreInward:strictInward,
  originalStrictCoreOutward:strictOutward,
  originalStrictCoreNear:strictNear,
  originalStrictCoreUnknown:strictUnknown,
  originalSourceExcludedFaceRayHits:originalExcluded,
  originalSourceNoForwardFaceRayHits:originalNoHit,
  exclusiveNoHitLineGeometryReasons:reasons,
  sevenOriginalSkirtBandLineReasons:bandTotals,
  originalSourceMeshBehindCenterRayWitnesses:[...behindByMesh.entries()]
   .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
   .map(([sourceMeshName,sourceRayCount])=>({sourceMeshName,sourceRayCount})),
  sourceAnatomyPlaneRowsWithZeroFaces:ringsWithNoAnatomySegments,
  sourceNoHitCollinearPossibleDirections:originalCollinear,
  originalPhoto2DFallbackRequired:true,
  lineBehindSkirtCenterIsNotBodyOrGarmentClearance:true,
  sourceOnlyUnobservedAngularDirectionsNotSignedVolume:true,
  sourceOriginalPublicAnatomyAndPhotoUnmodified:true,
  newRealWorldBodyGarmentDimensionsInferred:false,
  sourceMeshEdgesNotWeldedOrFabricated:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
export function auditOriginalNoHitLineGeometry89(a={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  independentlyVerifiedSkinSensitivityReceipt}=a;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  independentlyVerifiedSkinSensitivityReceipt?.schema!==
   'P89-original-anatomy-skin-core-sensitivity-source-indexed/v1'||
  independentlyVerifiedSkinSensitivityReceipt?.sourceSkirtSpokeCount!==336||
  independentlyVerifiedSkinSensitivityReceipt?.counterfactualsMayNotChangeOriginalStrictCoreMask!==true)
  return error('genuine-original-source-skin-and-selected-photo-provenance-required');
 try{
  const x=summarizeOriginalNoHitLineGeometry89(a),p=independentlyVerifiedSkinSensitivityReceipt;
  if(x.originalSourceIndexedBodyFaceCount!==p.sourceIndexedBodyTriangles||
   x.originalStrictCoreInward!==p.baselineStrictCoreInward||
   x.originalStrictCoreOutward!==p.baselineStrictCoreOutward||
   x.originalStrictCoreNear!==p.baselineStrictCoreNear||
   x.originalStrictCoreUnknown!==p.baselineStrictCoreUnknown||
   x.originalSourceExcludedFaceRayHits!==p.baselineUnknownExcludedOriginalFaceRayHits||
   x.originalSourceNoForwardFaceRayHits!==p.baselineUnknownNoOriginalFaceRayHits||
   x.sevenOriginalSkirtBandLineReasons.some((v,i)=>
    v.originalStrictUnknown!==p.originalStrictCoreSourceBandReceipts[i]?.strictCoreUnknown||
    v.originalExcludedBodySourceHit!==
     p.originalStrictCoreSourceBandReceipts[i]?.originalExcludedFaceIntersection||
    v.originalNoForwardBodySourceRayHit!==
     p.originalStrictCoreSourceBandReceipts[i]?.noObservedOriginalFaceIntersection))
   return error('original-skirt-line-analysis-disagrees-with-independent-336-ray-evidence:'+
    JSON.stringify({
     observed:[x.originalStrictCoreInward,x.originalStrictCoreOutward,
      x.originalStrictCoreNear,x.originalStrictCoreUnknown,
      x.originalSourceExcludedFaceRayHits,x.originalSourceNoForwardFaceRayHits],
     independent:[p.baselineStrictCoreInward,p.baselineStrictCoreOutward,
      p.baselineStrictCoreNear,p.baselineStrictCoreUnknown,
      p.baselineUnknownExcludedOriginalFaceRayHits,p.baselineUnknownNoOriginalFaceRayHits],
     originalBandObserved:x.sevenOriginalSkirtBandLineReasons.map(v=>[
      v.originalStrictUnknown,v.originalExcludedBodySourceHit,
      v.originalNoForwardBodySourceRayHit]),
     originalBandIndependent:p.originalStrictCoreSourceBandReceipts.map(v=>[
      v.strictCoreUnknown,v.originalExcludedFaceIntersection,
      v.noObservedOriginalFaceIntersection])
    }));
  return Object.freeze({
   schema:'P89-locked-original-nohit-anatomy-plane-line/v1',
   status:'SOURCE_NOHIT_LINE_REASONS_EVIDENCED_NOT_WEARABLE_FIT',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   exactSourceNoHitLineGeometryEvidence:x,
   sourceSkinSensitivityIndependentlyCrossChecked336:true,
   originalPhoto2DFallbackRequired:true,
   closedSignedBodyVolumeVerified:false,consumer3DAdmitted:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const expected=[
   'original-indexed-163bone-source-geometry-required',
   'invalid-original-body-source-position',
   'invalid-original-skirt-source-position',
   'invalid-original-indexed-body-face',
   'invalid-original-indexed-skirt-face',
   'invalid-original-source-core-face-mask',
   'invalid-original-source-mesh-id',
   'invalid-original-source-skin-weight-or-bone',
   'unnormalized-original-source-skin-weights',
   'invalid-original-photo-skirt-span',
   'source-original-nohit-ring-ray-accounting-failed',
   'source-original-nohit-line-reason-conservation-failed'
  ];
  return error(expected.includes(e.message)?e.message:
   'source-original-nohit-line-geometry-unverifiable');
 }
}
