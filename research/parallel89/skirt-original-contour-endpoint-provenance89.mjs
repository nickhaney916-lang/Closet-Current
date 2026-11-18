/**
 * P89 genuine 163bone original selected-core contour ENDPOINT provenance.
 * Uses exact ORIGINAL indexed face/edge identity for "masked neighbor"
 * evidence. Positional coincidence is never welded: original rest
 * coordinates, 163bone weights and source mesh must agree even to call
 * a candidate "source-provenance compatible", NOT physically sewn.
 * All original source models, photo, skin, faces remain read-only.
 */
const PHOTO='c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344';
const RIG=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbcc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const POSES=new Set(['source','blend-25','blend-50','blend-75','relaxed']);
const validIndex=x=>x instanceof Uint16Array||x instanceof Uint32Array;
const finite=Number.isFinite;
const ascii=x=>typeof x==='string'&&x.length>0&&x.length<=96&&/^[\x20-\x7e]+$/.test(x);
const sum=x=>x.reduce((a,b)=>a+b,0);
const reasonKeys=Object.freeze([
 'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MASK',
 'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_ANATOMY',
 'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MIXED_WEIGHT',
 'POSSIBLE_ORIGINAL_UV_SPLIT_REST_SKIN_AND_MESH_COMPATIBLE',
 'POSED_COINCIDENT_DIFFERENT_ORIGINAL_REST',
 'POSED_COINCIDENT_DIFFERENT_ORIGINAL_SKIN',
 'POSED_COINCIDENT_DIFFERENT_ORIGINAL_MESH',
 'POSED_COINCIDENT_AMBIGUOUS_MULTI_SOURCE_CANDIDATES',
 'NO_SOURCE_INDEX_OR_PROVENANCE_COMPATIBLE_NEIGHBOR'
]);
const empty=()=>Object.fromEntries(reasonKeys.map(k=>[k,0]));
const fail=reason=>Object.freeze({
 schema:'P89-original-photo-contour-endpoint-source-provenance/v1',
 status:'ORIGINAL_SOURCE_CONTOUR_ENDPOINT_PROVENANCE_UNVERIFIABLE',reason,
 originalPhoto2DFallbackRequired:true,originalBodySignedVolumeCertified:false,
 originalGarmentPhysicalSizeVerified:false,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const region=name=>{
 const s=name.toLowerCase();
 if(/hand|finger|thumb|arm|forearm|shoulder|clavic|elbow|wrist|head|neck|eye|ear|face|jaw/.test(s))return 'EXCLUDED_HEAD_ARMS';
 if(/foot|toe|ankle|knee|calf|shin|thigh|upleg|lowleg|leg|heel/.test(s))return 'CORE_LEGS';
 if(/pelv|hip|spine|chest|torso|abdomen|back|waist|butt|root/.test(s))return 'CORE_TORSO_HIPS';
 return 'UNKNOWN_ORIGINAL_BONE';
};
function sourceCut(p,rest,index,weights,meshId,a,b,c,y){
 const ids=[a,b,c],hits=[];
 for(let j=0;j<3;j++){
  const s=ids[j],t=ids[(j+1)%3],y0=p[3*s+1],y1=p[3*t+1];
  if(Math.abs(y1-y0)<1e-10)continue;
  const f=(y-y0)/(y1-y0);if(f<0||f>1)continue;
  const x=p[3*s]+f*(p[3*t]-p[3*s]),z=p[3*s+2]+f*(p[3*t+2]-p[3*s+2]),
   key=f<1e-9?'v:'+s:f>1-1e-9?'v:'+t:
    s<t?'e:'+s+':'+t:'e:'+t+':'+s,
   restPoint=[0,1,2].map(k=>rest[3*s+k]+f*(rest[3*t+k]-rest[3*s+k]));
  const skin=new Map();
  for(const [i,w] of [[s,1-f],[t,f]]){
   for(let k=0;k<4;k++){
    const joint=index[4*i+k],weight=weights[4*i+k]*w;
    if(weight>1e-10)skin.set(joint,(skin.get(joint)||0)+weight);
   }
  }
  const influence=Array.from(skin).filter(([,w])=>w>1e-8)
   .sort((m,n)=>m[0]-n[0]);
  if(!hits.some(h=>Math.hypot(x-h.x,z-h.z)<1e-7))
   hits.push({x,z,key,mesh:meshId,rest:restPoint,influence});
 }
 return hits.length===2?hits:null;
}
function compatible(a,b){
 if(a.mesh!==b.mesh)return 'POSED_COINCIDENT_DIFFERENT_ORIGINAL_MESH';
 if(Math.hypot(...a.rest.map((v,i)=>v-b.rest[i]))>1e-6)
  return 'POSED_COINCIDENT_DIFFERENT_ORIGINAL_REST';
 if(a.influence.length!==b.influence.length||
  a.influence.some((t,i)=>t[0]!==b.influence[i][0]||
   Math.abs(t[1]-b.influence[i][1])>1e-6))
  return 'POSED_COINCIDENT_DIFFERENT_ORIGINAL_SKIN';
 return 'POSSIBLE_ORIGINAL_UV_SPLIT_REST_SKIN_AND_MESH_COMPATIBLE';
}
function counterpart(nodes,me){
 const q=1e-7,x=Math.round(me.x/q),z=Math.round(me.z/q),others=[];
 for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
  for(const t of nodes.get((x+i)+'|'+(z+j))||[]){
   if(t.key!==me.key&&Math.hypot(t.x-me.x,t.z-me.z)<=1e-7)
    others.push(t);
  }
 }
 return others;
}
export function summarizeSourceContourEndpointProvenance89({
 bodyPositions,restPositions,bodyIndices,skirtPositions,skirtIndices,
 coreBodyFaceMask,skinIndices,skinWeights,sourceMeshIds,
 sourceMeshNames,sourceBoneNamesByMesh
}={}){
 if(!(bodyPositions instanceof Float32Array)||bodyPositions.length<12||
  bodyPositions.length%3||bodyPositions.length>2100000||
  !(restPositions instanceof Float32Array)||restPositions.length!==bodyPositions.length||
  !validIndex(bodyIndices)||bodyIndices.length<6||bodyIndices.length%3||
  bodyIndices.length>3000000||
  !(skirtPositions instanceof Float32Array)||skirtPositions.length!==1029||
  !validIndex(skirtIndices)||skirtIndices.length!==1728||
  !(coreBodyFaceMask instanceof Uint8Array)||coreBodyFaceMask.length!==bodyIndices.length/3||
  !(skinIndices instanceof Uint16Array)||skinIndices.length!==bodyPositions.length/3*4||
  !(skinWeights instanceof Float32Array)||skinWeights.length!==skinIndices.length||
  !(sourceMeshIds instanceof Uint16Array)||sourceMeshIds.length!==bodyPositions.length/3||
  !Array.isArray(sourceMeshNames)||!sourceMeshNames.length||sourceMeshNames.length>256||
  sourceMeshNames.some(x=>!ascii(x))||
  !Array.isArray(sourceBoneNamesByMesh)||sourceBoneNamesByMesh.length!==sourceMeshNames.length||
  sourceBoneNamesByMesh.some(a=>!Array.isArray(a)||a.length!==163||a.some(s=>!ascii(s))))
  throw Error('genuine-indexed-source-rest-skin-face-and-original-skirt-required');
 for(const v of bodyPositions)if(!finite(v))throw Error('posed-original-body-nonfinite');
 for(const v of restPositions)if(!finite(v))throw Error('rest-original-body-nonfinite');
 for(const v of skirtPositions)if(!finite(v))throw Error('photographed-original-skirt-nonfinite');
 const nv=bodyPositions.length/3;
 for(const v of bodyIndices)if(v>=nv)throw Error('original-body-face-index-invalid');
 for(const v of skirtIndices)if(v>=343)throw Error('original-skirt-face-index-invalid');
 if(coreBodyFaceMask.some(x=>x!==0&&x!==1))
  throw Error('original-indexed-eligibility-mask-invalid');
 const vertices=[];
 for(let v=0;v<nv;v++){
  const m=sourceMeshIds[v];if(m>=sourceMeshNames.length)
   throw Error('original-source-mesh-index-invalid');
  let total=0,max=-1,top=0,core=0,arms=0,other=0,nCore=0;
  for(let k=0;k<4;k++){
   const i=4*v+k,w=skinWeights[i],bone=skinIndices[i];
   if(!finite(w)||w<0||w>1||bone>=163)
    throw Error('original-163bone-skin-index-weight-invalid');
   total+=w;if(w>max){max=w;top=bone;}
   if(w<=1e-7)continue;
   const kind=region(sourceBoneNamesByMesh[m][bone]);
   if(kind==='EXCLUDED_HEAD_ARMS')arms+=w;
   else if(kind==='UNKNOWN_ORIGINAL_BONE')other+=w;
   else{core+=w;nCore++;}
  }
  if(Math.abs(total-1)>.003)throw Error('original-skin-weights-not-normalized');
  vertices.push({mesh:m,core,arms,other,nCore,strict:max<.5?
   'UNKNOWN_ORIGINAL_BONE':region(sourceBoneNamesByMesh[m][top])});
 }
 const faces=[];
 let strict=0,hypothetical=0;
 for(let f=0;f<bodyIndices.length/3;f++){
  const a=bodyIndices[3*f],b=bodyIndices[3*f+1],c=bodyIndices[3*f+2],
   vs=[vertices[a],vertices[b],vertices[c]],mesh=vs[0].mesh;
  const allSame=vs.every(v=>v.mesh===mesh),
   head=vs.some(v=>v.strict==='EXCLUDED_HEAD_ARMS'),
   allCore=vs.every(v=>v.strict==='CORE_LEGS'||v.strict==='CORE_TORSO_HIPS'),
   unknown=vs.some(v=>v.strict==='UNKNOWN_ORIGINAL_BONE');
  const selected=allSame&&!head&&coreBodyFaceMask[f]===1&&(
   allCore||(unknown&&vs.every(v=>v.core>=.95-1e-7&&v.arms<=.05+1e-7&&
    v.other<=.05+1e-7&&(v.strict!=='UNKNOWN_ORIGINAL_BONE'||v.nCore>=2))));
  if(selected){
   if(allCore)strict++;else hypothetical++;
  }
  const excludedReason=coreBodyFaceMask[f]===0?
   'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MASK':
   !allSame||head||!unknown?
   'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_ANATOMY':
   'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MIXED_WEIGHT';
  faces.push({a,b,c,mesh,selected,excludedReason});
 }
 const totals=empty(),rings=[];
 let openTotal=0,supportTotal=0,poseCoincidentTotal=0,noneTotal=0;
 for(let row=0;row<7;row++){
  let y=0;for(let j=0;j<48;j++)y+=skirtPositions[3*(row*49+j)+1];y/=48;
  const nodes=new Map(),excluded=new Map(),meshHist=Object.create(null);
  let selectedSegments=0,excludedSegments=0;
  for(const f of faces){
   const v=sourceCut(bodyPositions,restPositions,skinIndices,skinWeights,
    f.mesh,f.a,f.b,f.c,y);
   if(!v)continue;
   if(f.selected){
    selectedSegments++;
    for(const p of v){
     const prev=nodes.get(p.key);
     if(prev){
      if(Math.hypot(prev.x-p.x,prev.z-p.z)>1e-6)
       throw Error('original-source-index-cut-identity-conflict');
      prev.degree++;
     }else nodes.set(p.key,{...p,degree:1});
    }
   }else{
    excludedSegments++;
    for(const p of v){
     if(!excluded.has(p.key))excluded.set(p.key,[]);
     excluded.get(p.key).push(f.excludedReason);
    }
   }
  }
  const open=Array.from(nodes.values()).filter(x=>x.degree===1);
  const buckets=new Map(),q=1e-7;
  for(const n of open){
   const key=Math.round(n.x/q)+'|'+Math.round(n.z/q);
   if(!buckets.has(key))buckets.set(key,[]);
   buckets.get(key).push(n);
  }
  const counts=empty();
  for(const n of open){
   let cause;
   const sameIndex=excluded.get(n.key);
   if(sameIndex?.length){
    cause=sameIndex.includes('ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MASK')?
     'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MASK':
     sameIndex.includes('ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_ANATOMY')?
     'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_ANATOMY':
     'ORIGINAL_INDEX_SHARED_FACE_EXCLUDED_BY_MIXED_WEIGHT';
   }else{
    const pairs=counterpart(buckets,n);
    if(!pairs.length)cause='NO_SOURCE_INDEX_OR_PROVENANCE_COMPATIBLE_NEIGHBOR';
    else if(pairs.length>1)cause='POSED_COINCIDENT_AMBIGUOUS_MULTI_SOURCE_CANDIDATES';
    else cause=compatible(n,pairs[0]);
   }
   counts[cause]++;totals[cause]++;
   const meshName=n.mesh+':'+sourceMeshNames[n.mesh];
   meshHist[meshName]=(meshHist[meshName]||0)+1;
  }
  if(sum(Object.values(counts))!==open.length)throw Error('source-ring-endpoint-reasons-not-conserved');
  const supported=sum(reasonKeys.slice(0,4).map(k=>counts[k]));
  const posedOnly=sum(reasonKeys.slice(4,8).map(k=>counts[k]));
  const unsupported=counts.NO_SOURCE_INDEX_OR_PROVENANCE_COMPATIBLE_NEIGHBOR;
  openTotal+=open.length;supportTotal+=supported;
  poseCoincidentTotal+=posedOnly;noneTotal+=unsupported;
  rings.push({
   originalSkirtRing:row,
   sourceOriginal95ContourSegments:selectedSegments,
   sourceExcludedFacePlaneSegments:excludedSegments,
   indexedGraphOpenEndpoints:open.length,
   disjointIndexedEndpointProvenance:counts,
   originalIndexNeighborOrSupportedVirtualCandidateEndpoints:supported,
   posedCoordinateOnlyCandidateEndpoints:posedOnly,
   missingOriginalIndexedOrVirtualNeighborEndpoints:unsupported,
   originalSourceMeshEndpointCounts:Object.entries(meshHist)
    .sort((a,b)=>a[0].localeCompare(b[0])).map(([label,endpoints])=>({label,endpoints})),
   originalSourceFaceIndexNotRepaired:true
  });
 }
 if(sum(Object.values(totals))!==openTotal||
  supportTotal+poseCoincidentTotal+noneTotal!==openTotal)
  throw Error('original-source-ring-endpoint-provenance-nonconservative');
 return Object.freeze({
  schema:'P89-pure-original-source-contour-endpoint-rest-skin-face-proof/v1',
  originalSourceBodyIndexedTriangles:bodyIndices.length/3,
  originalSourcePhotographedSkirtTriangles:skirtIndices.length/3,
  sourceOriginalStrictCoreFaces:strict,
  source95CounterfactualExtraFaces:hypothetical,
  originalSourceIndexedOpenEndpointTotal:openTotal,
  sourceIndexOrRestSkinCandidateEndpointTotal:supportTotal,
  posedOnlyCoincidenceUntrustedEndpointTotal:poseCoincidentTotal,
  originalNoMatchingEndpointTotal:noneTotal,
  originalEndpointCauseTotals:totals,
  originalSevenSourceSkirtEndpointRings:rings,
  sourceVirtualRestAndSkinEvidenceNeverSewn:true,
  sourceOriginalFaceMaskExclusionsNeverPromoted:true,
  originalOnlyWorldCoordinateMatchNotStitchable:true,
  sourceModelSignedBodyVolumeUnproved:true,
  originalGarmentSizeAndRearNotObserved:true,
  originalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false
 });
}
export function auditSourceContourEndpointProvenance89(args={}){
 const {avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
  originalRig163Bones,selectedMeasuredFivePoseBvh,selectedActualWebGLPreview,
  priorOriginalIndexedContourGraph}=args;
 if(!Object.hasOwn(RIG,avatar)||!POSES.has(pose)||
  sourcePhotoSHA256!==PHOTO||sourceAnatomyGLBSHA256!==RIG[avatar]||
  originalRig163Bones!==true||selectedMeasuredFivePoseBvh!==true||
  selectedActualWebGLPreview!==true||
  priorOriginalIndexedContourGraph?.schema!==
   'P89-original-indexed-skirt-ring-contour-graph-connectivity/v1'||
  priorOriginalIndexedContourGraph?.originalSourceSkirtSpokeRayCount!==336||
  priorOriginalIndexedContourGraph?.originalSourceSevenRingContourConnectivity?.length!==7||
  priorOriginalIndexedContourGraph?.virtualIndexTwinCoordinatesNotWelded!==true)
  return fail('authentic-original-skinned-indexed-contour-and-source-JPEG-receipt-required');
 try{
  const proof=summarizeSourceContourEndpointProvenance89(args),p=priorOriginalIndexedContourGraph;
  if(proof.originalSourceBodyIndexedTriangles!==p.originalBodyIndexedTriangleCount||
   proof.sourceOriginalStrictCoreFaces!==p.genuineOriginalStrictCoreSourceFaceCount||
   proof.source95CounterfactualExtraFaces!==p.hypothetical95AddedOriginalSourceFaces||
   proof.originalSourceIndexedOpenEndpointTotal!==p.totalOriginalIndexGraphOpenEndpointsAcrossSevenRings||
   proof.originalSevenSourceSkirtEndpointRings.some((v,i)=>{
    const q=p.originalSourceSevenRingContourConnectivity[i];
    return v.originalSkirtRing!==q?.originalSkirtSourceRing||
     v.sourceOriginal95ContourSegments!==q?.original95NamedSourceContourSegments||
     v.indexedGraphOpenEndpoints!==q?.original95OriginalIndexTopology?.genuineIndexedOpenEndpoints;
   }))
   return fail('true-original-source-rest-skin-endpoints-do-not-reconcile-with-prior-graph');
  return Object.freeze({
   schema:'P89-original-photo-contour-endpoint-source-provenance/v1',
   status:'ORIGINAL_SOURCE_ENDPOINT_PROVENANCE_RESOLVED_RESEARCH_ONLY',
   avatar,pose,sourcePhotoSHA256,sourceAnatomyGLBSHA256,
   sourceEndpointProvenanceProof:proof,
   originalSourceIndexedEndpointCountsIndependentlyReconciled:true,
   originalBodySignedVolumeCertified:false,originalPhoto2DFallbackRequired:true,
   consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  const whitelist=new Set([
   'genuine-indexed-source-rest-skin-face-and-original-skirt-required',
   'posed-original-body-nonfinite','rest-original-body-nonfinite',
   'photographed-original-skirt-nonfinite','original-body-face-index-invalid',
   'original-skirt-face-index-invalid','original-indexed-eligibility-mask-invalid',
   'original-source-mesh-index-invalid','original-163bone-skin-index-weight-invalid',
   'original-skin-weights-not-normalized',
   'original-source-index-cut-identity-conflict',
   'source-ring-endpoint-reasons-not-conserved',
   'original-source-ring-endpoint-provenance-nonconservative'
  ]);
  return fail(whitelist.has(e.message)?e.message:'source-original-index-skin-rest-provenance-failed-closed');
 }
}