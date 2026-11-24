/** Automatic source-photo plane to dimensionless volume research adapter.
 * No body scale, observed rear, sewn garment, or physical fit is asserted.
 * Keep inferred surfaces in a separate untextured geometry/material group.
 */
import {buildPhotoDerivedResearchMesh89} from './source-photo-to-mesh89.mjs';
import {createHash} from 'node:crypto';
const sha=a=>createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const hold={consumer3DAdmitted:false,physicalDepthMeasured:false,wearableFitProved:false,maskGroundTruthApproved:false,originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'};
const refuse=(reason,source={})=>({status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,...source,...hold});
const key=(a,b)=>a<b?a+':'+b:b+':'+a;
function edgesOf(indices,n){
 const edges=new Map();
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i],b=indices[i+1],c=indices[i+2];
  if(a>=n||b>=n||c>=n||a===b||b===c||c===a)return null;
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   const k=key(u,v),e=edges.get(k);
   if(!e)edges.set(k,{u,v,count:1});
   else if(e.count===1&&e.u===v&&e.v===u)e.count=2;
   else return null;
  }
 }
 return edges;
}
export async function buildAutomaticSourceVolume89(args={}){
 try{
  const r=await buildPhotoDerivedResearchMesh89(args);
  const identity={sourceId:r.sourceId,category:r.category,originalSHA256:r.originalSHA256};
  if(r.status!=='SOURCE_DERIVED_TEXTURED_VIEW_PLANE_RESEARCH_ONLY')return refuse(r.reason??'source-plane-refused',identity);
  const m=r.mesh,p=m.positions,uv=m.uv,idx=m.indices,n=p.length/3;
  if(!(p instanceof Float32Array)||!(uv instanceof Float32Array)||!(idx instanceof Uint32Array)||!Number.isSafeInteger(n)||n<3||n>100000||uv.length!==n*2||idx.length%3||idx.length<3||idx.length>350000||!p.every(Number.isFinite)||!uv.every(Number.isFinite))return refuse('invalid-source-plane',identity);
  for(let j=2;j<p.length;j+=3)if(p[j]!==0)return refuse('source-plane-depth-not-zero',identity);
  const sourceEdges=edgesOf(idx,n);
  if(!sourceEdges)return refuse('source-plane-edge-orientation-invalid',identity);
  const boundary=[...sourceEdges.values()].filter(e=>e.count===1);
  const degree=new Map();
  for(const {u,v} of boundary)for(const i of [u,v])degree.set(i,(degree.get(i)||0)+1);
  if(!boundary.length||[...degree.values()].some(v=>v!==2))return refuse('source-boundary-not-disjoint-loops',identity);
  const depth=.02,positions=new Float32Array(p.length*2);
  positions.set(p);
  for(let i=0;i<n;i++)positions.set([p[i*3],p[i*3+1],-depth],(n+i)*3);
  const indices=new Uint32Array(idx.length*2+boundary.length*6);
  indices.set(idx);
  for(let i=0;i<idx.length;i+=3)indices.set([idx[i+2]+n,idx[i+1]+n,idx[i]+n],idx.length+i);
  for(let j=0;j<boundary.length;j++){const {u,v}=boundary[j];indices.set([v,u,u+n,v,u+n,v+n],idx.length*2+j*6);}
  const edges=edgesOf(indices,n*2);
  if(!edges||[...edges.values()].some(e=>e.count!==2))return refuse('volume-edge-closure-invalid',identity);
  // Renderers must use these independent buffers: only observed view plane
  // has texture coordinates or photo bytes. Neutral group has no UV at all.
  const neutralIndices=indices.slice(idx.length);
  const neutralPositions=positions.slice();
  const result={status:'PROVISIONAL_SOURCE_VOLUME_RESEARCH_ONLY',...identity,
   sourceMaskSHA256:r.maskSHA256,sourceViewIndependentlyVerified:false,
   sourcePlane:{positions:p.slice(),uv:uv.slice(),indices:idx.slice(),textureRGBA:m.textureRGBA.slice(),textureDimensions:m.textureDimensions.slice(),textureSHA256:m.textureSHA256,material:'observed-source-photo'},
   inferredNeutral:{positions:neutralPositions,indices:neutralIndices,material:'unobserved-neutral',photoTextureAllowed:false},
   topology:{positions,indices,positionSHA256:sha(positions),indexSHA256:sha(indices),allIndexedEdgesPaired:true,sourceTriangles:idx.length/3,inferredRearTriangles:idx.length/3,inferredSideTriangles:boundary.length*2},
   dimensionlessTrialDepth:depth,unobservedRearAndSides:true,sewnGarmentProved:false,bodyCollisionProved:false,...hold};
  return result;
 }catch{return refuse('source-volume-processing-failed');}
}
