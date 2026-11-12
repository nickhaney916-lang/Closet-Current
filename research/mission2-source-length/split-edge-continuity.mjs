/**
 * P2-C28: PRIVATE, read-only, source-photo UV split-edge witness.
 *
 * Find only pairs of independent ORIGINAL indexed edges sharing both neutral
 * 3D endpoints but carrying different UV endpoints. Their 3D proximity is
 * measured again after genuine 163-bone articulation and disposable fitting.
 * These are *candidate* UV split edges, NOT proven sewn seams: a texture atlas
 * cut or deliberately disconnected garment panel may be perfectly intentional.
 *
 * No UV/XYZ, source indices, owner IDs, photos or candidate arrays leave this
 * closure. Only bounded counts are exposed. Never weld source seams, admit a
 * garment, waive collisions or infer physical fabric dynamics from this audit.
 */
import * as THREE from 'three';

const validArray=a=>(a instanceof Float32Array||a instanceof Float64Array)&&a.every(Number.isFinite);
const fail=msg=>{throw Error('M2 C28 '+msg);};

export function preparePhotoUVSplitEdgeWitness(meshes,neutralWorld,{
 neutralTolerance=0.000001,openThreshold=0.001,changeThreshold=0.00025,
 maxTriangles=300000,maxEdgeGroups=900000,maxSplitPairs=100000
}={}){
 if(!Array.isArray(meshes)||meshes.length<1||meshes.length>8||
    new Set(meshes).size!==meshes.length||
    !Array.isArray(neutralWorld)||neutralWorld.length!==meshes.length||
    !Number.isFinite(neutralTolerance)||neutralTolerance<1e-8||neutralTolerance>1e-4||
    !Number.isFinite(openThreshold)||openThreshold<=0||openThreshold>0.02||
    !Number.isFinite(changeThreshold)||changeThreshold<=0||changeThreshold>0.01||
    !Number.isSafeInteger(maxTriangles)||maxTriangles<1||maxTriangles>3000000||
    !Number.isSafeInteger(maxEdgeGroups)||maxEdgeGroups<1||maxEdgeGroups>2000000||
    !Number.isSafeInteger(maxSplitPairs)||maxSplitPairs<1||maxSplitPairs>200000)
  fail('bounded original 163-bone UV split edge inputs required');
 const bones=meshes[0]?.skeleton?.bones;
 if(bones?.length!==163||meshes.some(m=>!m?.isSkinnedMesh||
    m.skeleton?.bones?.length!==163||
    m.skeleton.bones.some((bone,i)=>bone!==bones[i])))
  fail('one shared actual original 163-bone source rig required');
 const meshGeometry=meshes.map(m=>m.geometry);
 const sourcePositions=meshes.map(m=>m.geometry?.getAttribute('position')?.array);
 const map=new Map();
 let totalTriangles=0,meshesMissingUV=0,sourceDistinctEdgeGroups=0,
  zeroLengthSourceEdges=0,ambiguousSplitEdgeGroups=0,
  sourcePhotoSplitUVEdgePairs=0,uvContinuousDuplicateEdgeGroups=0,
  uvMissingDuplicateEdgeGroups=0;
 const neutralSnapshots=neutralWorld.map((arr,meshIndex)=>{
  const p=meshes[meshIndex].geometry?.getAttribute('position'),
   uv=meshes[meshIndex].geometry?.getAttribute('uv');
  if(!p?.isBufferAttribute||p.itemSize!==3||p.isInterleavedBufferAttribute||
     !validArray(p.array)||!validArray(arr)||arr.length!==p.count*3)
   fail('complete finite 163-bone source and neutral photographed vertices required');
  if(uv&&(!uv.isBufferAttribute||uv.itemSize!==2||
     uv.count!==p.count||uv.isInterleavedBufferAttribute||!validArray(uv.array)))
   fail('complete finite original UV mapping required');
  if(!uv)meshesMissingUV++;
  const index=meshes[meshIndex].geometry.index?.array;
  const faces=index?index.length/3:p.count/3;
  if(!Number.isSafeInteger(faces)||faces<1||totalTriangles+faces>maxTriangles)
   fail('complete bounded source triangle index required');
  totalTriangles+=faces;
  const coord=vertex=>{
   if(!Number.isSafeInteger(vertex)||vertex<0||vertex>=p.count)
    fail('out-of-range original split-edge vertex index');
   let parts=[];
   for(let axis=0;axis<3;axis++){
    const n=arr[vertex*3+axis];
    if(Math.abs(n)>100)fail('unbounded original neutral source coordinate');
    parts.push(Math.round(n/neutralTolerance));
   }
   return parts.join(',');
  };
  const addEdge=(one,two)=>{
   if(one===two){zeroLengthSourceEdges++;return;}
   const a=coord(one),b=coord(two);
   if(a===b){zeroLengthSourceEdges++;return;}
   const flip=a>b,lo=flip?two:one,hi=flip?one:two,
    key=flip?b+'|'+a:a+'|'+b,
    originalKey=meshIndex+':'+Math.min(one,two)+':'+Math.max(one,two);
   let group=map.get(key);
   if(!group){
    group=[];map.set(key,group);
    if(map.size>maxEdgeGroups)fail('neutral source edge-group budget exhausted');
   }
   if(group.some(e=>e.originalKey===originalKey))return;
   if(group.length<3)group.push({meshIndex,lo,hi,originalKey,uv});
  };
  for(let face=0;face<faces;face++){
   const i=index?index[face*3]:face*3,
     j=index?index[face*3+1]:face*3+1,
     k=index?index[face*3+2]:face*3+2;
   addEdge(i,j);addEdge(j,k);addEdge(k,i);
  }
  return arr.slice();
 });
 // Even ambiguous spatial duplicates are never called proven sewing.
 const pairs=[];
 for(const edges of map.values()){
  if(edges.length===1)continue;
  sourceDistinctEdgeGroups++;
  if(edges.length!==2){ambiguousSplitEdgeGroups++;continue;}
  const [a,b]=edges;
  if(!a.uv||!b.uv){uvMissingDuplicateEdgeGroups++;continue;}
  const first=a.uv.array,second=b.uv.array;
  const uvGap=Math.max(
   Math.hypot(first[a.lo*2]-second[b.lo*2],
              first[a.lo*2+1]-second[b.lo*2+1]),
   Math.hypot(first[a.hi*2]-second[b.hi*2],
              first[a.hi*2+1]-second[b.hi*2+1]));
  if(uvGap<=1e-6){uvContinuousDuplicateEdgeGroups++;continue;}
  pairs.push([a.meshIndex,a.lo,a.hi,b.meshIndex,b.lo,b.hi]);
  if(pairs.length>maxSplitPairs)fail('unresolved original UV split pair budget exceeded');
  sourcePhotoSplitUVEdgePairs++;
 }
 map.clear();
 const sourceSummary=Object.freeze({
  totalTriangles,meshesMissingUV,sourceDistinctEdgeGroups,
  zeroLengthSourceEdges,ambiguousSplitEdgeGroups,
  sourcePhotoSplitUVEdgePairs,uvContinuousDuplicateEdgeGroups,
  uvMissingDuplicateEdgeGroups,
  originalSplitPairsAreNotProvenSewnSeams:true,
  sourceOwnerPhotoNotExposed:true,
  releaseAuthorized:false
 });
 const maxGap=(arrays,ids)=>{
  const [ai,al,ah,bi,bl,bh]=ids;
  const a=arrays[ai],b=arrays[bi];
  const gap=(i,j)=>Math.hypot(
   a[i*3]-b[j*3],a[i*3+1]-b[j*3+1],a[i*3+2]-b[j*3+2]);
  return Math.max(gap(al,bl),gap(ah,bh));
 };
 return Object.freeze({
  sourceSummary,
  measure(root,posedBaselineWorld,overrides=new Map()){
   if(!root?.isObject3D||!Array.isArray(posedBaselineWorld)||
      posedBaselineWorld.length!==meshes.length||
      !(overrides instanceof Map)||
      [...overrides.keys()].some(mesh=>!meshes.includes(mesh)))
    fail('actual posed original source and private candidate witness required');
   for(let i=0;i<meshes.length;i++){
    const mesh=meshes[i],p=mesh.geometry?.getAttribute('position'),
      base=posedBaselineWorld[i],proposed=overrides.get(mesh);
    if(mesh.geometry!==meshGeometry[i]||
       p?.array!==sourcePositions[i]||!validArray(p.array)||
       !validArray(base)||base.length!==neutralSnapshots[i].length||
       proposed!==undefined&&(!validArray(proposed)||proposed.length!==p.array.length))
     fail('source geometry, actual pose or candidate has changed identity');
   }
   root.updateMatrixWorld(true);
   const actual=posedBaselineWorld.map(a=>a);
   const toDispose=[];
   try{
    for(const [mesh,override] of overrides){
     const index=meshes.indexOf(mesh);
     if(!override)continue;
     const attr=new THREE.BufferAttribute(new Float32Array(override),3);
     // Use the real THREE.SkinnedMesh bone influences, not an invented
     // camera/deformation, and never modify its original position buffer.
     const arr=new Float32Array(attr.count*3),v=new THREE.Vector3();
     mesh.updateWorldMatrix(true,false);
     mesh.skeleton.update();
     for(let i=0;i<attr.count;i++){
      v.fromBufferAttribute(attr,i);
      mesh.applyBoneTransform(i,v);
      v.applyMatrix4(mesh.matrixWorld);
      v.toArray(arr,i*3);
      if(![arr[i*3],arr[i*3+1],arr[i*3+2]].every(Number.isFinite))
       fail('nonfinite original skinned UV seam trial');
     }
     actual[index]=arr;
    }
    let originalAlreadyOpenPairs=0,afterOpenPairs=0,
     newlyOpenPairs=0,newlyWidenedPairs=0,improvedGapPairs=0,
     unchangedGapPairs=0;
    for(const ids of pairs){
     const before=maxGap(posedBaselineWorld,ids),
      after=maxGap(actual,ids);
     if(!Number.isFinite(before)||!Number.isFinite(after))
      fail('nonfinite original photo split-edge gap');
     if(before>openThreshold)originalAlreadyOpenPairs++;
     if(after>openThreshold)afterOpenPairs++;
     if(before<=openThreshold&&after>openThreshold)newlyOpenPairs++;
     if(after>before+changeThreshold)newlyWidenedPairs++;
     if(after+changeThreshold<before)improvedGapPairs++;
     if(Math.abs(after-before)<=changeThreshold)unchangedGapPairs++;
    }
    return Object.freeze({
     sourcePhotoSplitUVEdgePairs,originalAlreadyOpenPairs,afterOpenPairs,
     newlyOpenPairs,newlyWidenedPairs,improvedGapPairs,unchangedGapPairs,
     neutralMatchedIndexedSourceEdgesOnly:true,
     uvSplitIsNotSewnSeamProof:true,
     singleSourcePoseOnly:true,
     unobservedSplitEdgesNotCertifiedContinuous:true,
     noOriginalSourceMutation:true,
     noAutomaticGarment3DAdmission:true,
     originalOwnerTexturePixelsNotInspected:true,
     noContinuousMotionOrFabricDrapeCertificate:true,
     releaseAuthorized:false
    });
   }finally{
    toDispose.forEach(x=>x.dispose());
   }
  }
 });
}
