/**
 * M2 P89 | Indexed closed-shell topology witness, RESEARCH ONLY.
 * Edge incidence=2 does NOT prove a connected garment or a manifold vertex fan.
 * No claim of source-backed reverse, metric dimensions, sewn fabric, rigging,
 * cloth collision, account approval, consumer 3D, or Family Alpha readiness.
 */
import {createHash} from 'node:crypto';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rejection = reason => Object.freeze({
  schema:'M2-P89-indexed-manifold-research/v1',status:'TOPOLOGY_INVALID_2D_ONLY',
  reason,sourcePhoto2DFallbackRequired:true,consumer3DAdmitted:false,
  singlePieceAvatarFitEligible:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const key=(a,b)=>a<b?a+':'+b:b+':'+a;
function dsu(n){
 const p=Uint32Array.from({length:n},(_,i)=>i),size=new Uint32Array(n).fill(1);
 const find=i=>{while(p[i]!==i){p[i]=p[p[i]];i=p[i];}return i;};
 const join=(a,b)=>{a=find(a);b=find(b);if(a===b)return; if(size[a]<size[b]){const t=a;a=b;b=t;} p[b]=a;size[a]+=size[b];};
 return {find,join};
}

/**
 * Structural audit only. An index-space closed, orientable manifold can still
 * self-intersect, collide with a body or represent separate disconnected scraps.
 * Source eligibility is verified separately by the Met-specific wrapper.
 */
export function auditIndexedClosedSurface89(positions,indices){
 if(!(positions instanceof Float32Array)||!(indices instanceof Uint32Array)||
   positions.length<12||positions.length%3!==0||
   indices.length<12||indices.length%3!==0)
  return rejection('invalid-indexed-typed-array-layout');
 const n=positions.length/3,nf=indices.length/3;
 if(n>150000||nf>350000)return rejection('geometry-bound-exceeded');
 if(!positions.every(Number.isFinite))return rejection('nonfinite-3d-vertex');
 const edges=new Map(),incident=Array.from({length:n},()=>[]);
 const union=dsu(n);
 for(let face=0;face<nf;face++){
  const i=face*3,a=indices[i],b=indices[i+1],c=indices[i+2];
  if(a>=n||b>=n||c>=n||a===b||a===c||b===c)
   return rejection('out-of-range-or-degenerate-face-index');
  const ax=positions[3*a],ay=positions[3*a+1],az=positions[3*a+2];
  const ux=positions[3*b]-ax,uy=positions[3*b+1]-ay,uz=positions[3*b+2]-az;
  const vx=positions[3*c]-ax,vy=positions[3*c+1]-ay,vz=positions[3*c+2]-az;
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  if(!(nx*nx+ny*ny+nz*nz>1e-24))
   return rejection('zero-or-subprecision-triangle-area');
  union.join(a,b);union.join(b,c);
  incident[a].push(face);incident[b].push(face);incident[c].push(face);
  for(const [from,to] of [[a,b],[b,c],[c,a]]){
   const k=key(from,to),entry=edges.get(k);
   if(!entry)edges.set(k,{from,to,faces:[face]});
   else{
    if(entry.faces.length!==1)return rejection('more-than-two-faces-at-edge');
    if(entry.from!==to||entry.to!==from)
     return rejection('same-direction-shared-edge-or-inconsistent-winding');
    entry.faces.push(face);
   }
  }
 }
 for(const e of edges.values())if(e.faces.length!==2)
  return rejection('open-boundary-edge');
 let components=0;
 const roots=new Set();
 for(let v=0;v<n;v++){
  if(incident[v].length===0)return rejection('unreferenced-vertex');
  roots.add(union.find(v));
  // Connected cyclic fan is essential: two tetrahedra can share a single
  // vertex while every indexed edge still has exactly two incident faces.
  const faceList=incident[v],local=new Map(faceList.map((f,j)=>[f,j]));
  const ring=dsu(faceList.length),degree=new Uint8Array(faceList.length);
  for(const e of edges.values()){
   if(e.from!==v&&e.to!==v)continue;
   const f0=local.get(e.faces[0]),f1=local.get(e.faces[1]);
   if(f0===undefined||f1===undefined)return rejection('vertex-edge-face-incidence-mismatch');
   ring.join(f0,f1);degree[f0]++;degree[f1]++;
  }
  if(degree.some(x=>x!==2))return rejection('noncyclic-vertex-fan');
  const first=ring.find(0);
  for(let j=1;j<faceList.length;j++)
   if(ring.find(j)!==first)return rejection('pinched-disconnected-vertex-fans');
 }
 components=roots.size;
 const chi=n-edges.size+nf,twiceGenus=2*components-chi;
 if(twiceGenus<0||twiceGenus%2!==0)return rejection('invalid-closed-orientable-euler-characteristic');
 return Object.freeze({
  schema:'M2-P89-indexed-manifold-research/v1',
  status:components===1?'INDEXED_CLOSED_MANIFOLD_SINGLE_COMPONENT_RESEARCH_ONLY':
   'INDEXED_CLOSED_BUT_MULTIPLE_COMPONENTS_2D_ONLY',
  indexedClosedOrientableManifold:true,
  connectedComponents:components,vertexCount:n,edgeCount:edges.size,
  faceCount:nf,eulerCharacteristic:chi,totalTopologicalGenus:twiceGenus/2,
  // An indexed manifold is NOT physically sewn cloth or a wearable garment.
  physicalClothOrSelfIntersectionVerified:false,
  singlePieceAvatarFitEligible:false,sourcePhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}

/**
 * Adds exact-source, material partition and neutral-back checks to the
 * generic indexed-surface topology audit. This never promotes consumer 3D.
 */
export function auditMetSourceShellForSinglePiece89(shell){
 if(!shell||shell.status!=='EDGE_CLOSED_SOURCE_SILHOUETTE_SHELL_INFERRED_REAR_UNAPPROVED'||
   shell.imageId!==2551406||shell.originalMuseumExactCaption!=='a) front'||
   shell.consumer3DAdmitted!==false||shell.sourcePhoto2DFallbackRequired!==true||
   shell.realGarmentBackObserved!==false||shell.approvedSourceMaskHumanReviewed!==false)
  return rejection('unverified-museum-front-or-unsafe-source-status');
 const {positions,indices,uv,originalRGBAFront,drawRanges}=shell;
 if(!(uv instanceof Float32Array)||!(positions instanceof Float32Array)||
   uv.length!==positions.length/3*2||!uv.every(Number.isFinite))
  return rejection('uv-layout-invalid');
 if(!(originalRGBAFront instanceof Uint8Array)||
   !/^[a-f0-9]{64}$/.test(shell.sourceMaskedOriginalRGBTexSHA256||'')||
   sha(originalRGBAFront)!==shell.sourceMaskedOriginalRGBTexSHA256)
  return rejection('original-front-rgb-texture-sha-mismatch');
 const front=drawRanges?.sourcePhotoFront,back=drawRanges?.unobservedNeutralBack,
  sides=drawRanges?.inferredNeutralSideWalls;
 if(!front||!back||!sides||front.observed!==true||
   back.observed!==false||sides.observed!==false||
   front.start!==0||front.count!==shell.frontOriginalTriangles*3||
   back.start!==front.count||back.count!==shell.inferredRearTriangles*3||
   sides.start!==back.start+back.count||
   sides.count!==shell.inferredSideTriangles*3||
   sides.start+sides.count!==indices?.length)
  return rejection('untrusted-material-partitions-or-source-photo-on-back');
 const half=positions.length/6;
 if(half!==Math.floor(half)||half*2!==uv.length/2)
  return rejection('front-rear-correspondence-size-mismatch');
 for(let i=0;i<half;i++){
  if(positions[3*i]!==positions[3*(i+half)]||
     positions[3*i+1]!==positions[3*(i+half)+1]||
     positions[3*i+2]!==0||!(positions[3*(i+half)+2]<0)||
     uv[2*(i+half)]!==0||uv[2*(i+half)+1]!==0)
   return rejection('unobserved-rear-geometry-or-uv-not-neutral');
 }
 const audit=auditIndexedClosedSurface89(positions,indices);
 if(!audit.indexedClosedOrientableManifold)return audit;
 return Object.freeze({
  ...audit,originalFrontJPEGByteSHA256:shell.originalJPEGByteSHA256,
  originalFullDecodedRGBSHA256:shell.originalDecodedRGBSHA256,
  originalConservativeMachineMaskSHA256:shell.originalSourceConservativeMaskSHA256,
  originalFrontRGBATextureSHA256:shell.sourceMaskedOriginalRGBTexSHA256,
  sourceFrontCaptionVerified:true,unobservedBackNeutral:true,
  machineMaskHumanApproved:false,sourceDepthMetric:false,
  sourceAnatomicalFitProven:false,
  sourceIndependentHumanRealismApproved:false
 });
}
