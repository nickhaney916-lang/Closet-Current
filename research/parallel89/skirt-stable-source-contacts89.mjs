/**
 * P89 genuine ORIGINAL source-face stable body/skirt crossing witness.
 *
 * IMPORTANT: The P84 research donor used new MeshBVH(geometry) without
 * indirect:true. three-mesh-bvh ordinarily REORDERS its indexed triangles
 * during BVH construction. The traversal i/j indices therefore do NOT
 * consistently name the same originally photographed skirt or original
 * 163-bone body faces across registrations, even with identical topology.
 * Relative collision-pair turnover and 6-band source localization would
 * then be wrong. We do NOT modify the immutable P84 donor.
 *
 * This independent auditor preserves BOTH source index buffers using
 * indirect:true. For each bvhcast callback, resolveTriangleIndex() maps
 * the BVH's transient leaf index back to the immutable original source
 * triangle index. This supports comparisons across poses and geometric
 * proposals without pretending to certify physical cloth clearance.
 *
 * Only genuine aligned indexed skinned source triangles should be passed;
 * this module does not construct or attest source rights on its own.
 */
import * as THREE from 'three';
import {MeshBVH} from '../../node_modules/three-mesh-bvh/build/index.module.js';

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const eq=(a,b)=>a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
const checkSource=(g,label)=>{
 if(!g?.isBufferGeometry||!g.index||
    !g.getAttribute('position')||
    g.index.count%3!==0||
    g.index.count<6||
    g.index.count>2_000_000||
    g.getAttribute('position').count<3||
    g.getAttribute('position').count>1_000_000)
  throw Error('authentic-original-indexed-'+label+'-source-geometry-required');
 const idx=g.index.array,pos=g.getAttribute('position').array;
 for(let i=0;i<idx.length;i++){
  if(!Number.isSafeInteger(idx[i])||idx[i]<0||idx[i]>=pos.length/3)
   throw Error('original-'+label+'-face-reference-out-of-range');
 }
 for(let i=0;i<pos.length;i++)if(!finite(pos[i]))
  throw Error('original-'+label+'-source-vertex-not-finite');
 return {indices:idx.slice(),positions:pos.slice(),faces:idx.length/3};
};
export function countStableOriginalBodyContacts89(originalSkirtGeometry,originalBodyGeometry){
 const skirt=checkSource(originalSkirtGeometry,'photographed-skirt');
 const body=checkSource(originalBodyGeometry,'anatomical-body');
 const a=new MeshBVH(originalSkirtGeometry,{indirect:true}),
  b=new MeshBVH(originalBodyGeometry,{indirect:true});
 if(!a.indirect||!b.indirect||
    typeof a.resolveTriangleIndex!=='function'||
    typeof b.resolveTriangleIndex!=='function')
  throw Error('true-original-face-index-preserving-BVH-required');
 // A deliberate source-integrity check: even transient index reordering is
 // prohibited, unlike the older donor audit. Original photo and GLB source
 // triangle locations are required for panel localization.
 if(!eq(originalSkirtGeometry.index.array,skirt.indices)||
    !eq(originalBodyGeometry.index.array,body.indices))
  throw Error('original-source-face-indices-mutated-by-BVH-construction');
 const line=new THREE.Line3(),normal=new THREE.Vector3(),
  pairs=new Set();
 let count=0,maxDepth=0;
 a.bvhcast(b,new THREE.Matrix4(),{
  intersectsTriangles:(ta,tb,ai,bi)=>{
   if(ta.intersectsTriangle(tb,line)&&line.distance()>1e-5){
    const si=a.resolveTriangleIndex(ai),bj=b.resolveTriangleIndex(bi);
    if(!Number.isSafeInteger(si)||si<0||si>=skirt.faces||
       !Number.isSafeInteger(bj)||bj<0||bj>=body.faces)
     throw Error('original-source-BVH-face-id-resolution-invalid');
    const key=si+'|'+bj;
    if(pairs.has(key))
     throw Error('original-source-duplicate-triangle-contact-key');
    pairs.add(key);count++;
    tb.getNormal(normal);
    const d=Math.max(0,...[ta.a,ta.b,ta.c].map(v=>
     -v.clone().sub(tb.a).dot(normal)));
    if(!finite(d)||d<0)
     throw Error('original-body-oriented-plane-contact-depth-invalid');
    maxDepth=Math.max(maxDepth,d);
   }
   return false;
  }
 });
 if(count!==pairs.size||
    !eq(originalSkirtGeometry.index.array,skirt.indices)||
    !eq(originalBodyGeometry.index.array,body.indices)||
    !eq(originalSkirtGeometry.getAttribute('position').array,skirt.positions)||
    !eq(originalBodyGeometry.getAttribute('position').array,body.positions))
  throw Error('original-licensed-photo-or-anatomical-source-geometry-mutated');
 return {
  count,pairs,maxDepth,
  trueOriginalSkirtTriangleIndexStable:true,
  trueOriginalBodyTriangleIndexStable:true,
  originalFaceSourceResolution:'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES',
  entireOriginalBodyStillAudited:true,
  releaseAuthorized:false
 };
}
