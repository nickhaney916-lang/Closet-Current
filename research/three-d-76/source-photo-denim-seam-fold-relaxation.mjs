/**
 * Closet Current 3D-76 — source-neutral fold continuity on genuine, separate,
 * licensed-photo 3D jeans; NOT an invented rear texture or physical simulation.
 *
 * Previous 3D75 fold ridges were visibly periodic/abrupt. Soften *existing*
 * actual sewn-mesh fold geometry along its real triangle adjacency. The front
 * of the licensed original photographed jeans and original source/UV/rest/skin
 * attributes remain exactly unchanged; no arbitrary new image is generated.
 * Source-pose anatomical nearest-triangle guard is deliberately conservative.
 *
 * Strictly local research. OFF by default. Family Alpha HOLD.
 */
import * as THREE from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';

const clamp=THREE.MathUtils.clamp;
const smooth=THREE.MathUtils.smoothstep;
const fields=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const stamp=q=>q.toArray().map(n=>n.toFixed(5)).join(':');

/** One step of bounded graph diffusion on measured original triangle links.
 * Indices and coordinates are from the already-sewn actual garment, not a
 * heightfield pretending to be jeans or a fixed 2D image warp.
 */
export function relaxMeshFoldHeights76(heights,neighbors,eligible,{strength=.38}={}){
 if(!Array.isArray(heights)||!Array.isArray(neighbors)||!Array.isArray(eligible)||
   heights.length!==neighbors.length||heights.length!==eligible.length||
   !Number.isFinite(strength)||strength<0||strength>.55)
  throw Error('3D76 finite original denim mesh graph required');
 return heights.map((z,i)=>{
  if(!Number.isFinite(z))throw Error('3D76 nonfinite licensed original cloth geometry');
  if(!eligible[i])return z;
  const adj=neighbors[i];
  if(!Array.isArray(adj)||adj.length<2)return z;
  let sum=0,count=0;
  for(const v of adj){
   if(!Number.isInteger(v)||v<0||v>=heights.length||!Number.isFinite(heights[v]))
    throw Error('3D76 broken original triangle edge');
   sum+=heights[v];count++;
  }
  return z+strength*(sum/count-z);
 });
}
function edgeEnergy(heights,neighbors,active){
 let sum=0,edges=0;
 for(let i=0;i<heights.length;i++){
  if(!active[i])continue;
  for(const j of neighbors[i]){
   if(j<=i||!active[j])continue;
   const d=heights[i]-heights[j];
   sum+=d*d;edges++;
  }
 }
 return {sum,edges};
}

export function relaxOriginalPhotoDenimFoldContinuity76(pants,body,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],old=mesh?.geometry,pos=old?.getAttribute('position');
 if(!mesh?.isSkinnedMesh||pants?.meshes?.length!==1||
   !pants.stats?.sourcePhotoDenimStructuralFolds75||
   !pants.stats?.sourcePhotographedDenimCalfHang74||
   !pants.stats?.sourcePhotographedDenimRearDrape73||
   pants.stats?.photoApplied!==true||pants.stats?.independentSewnPattern!==true||
   !isSourceVerifiedDenimId(pants.stats?.sourceId)||
   !/^[a-f0-9]{64}$/.test(pants.stats?.sourceSHA256||'')||
   !body?.isObject3D||!pos||pos.count<400||
   fields.some(n=>old.getAttribute(n)?.count!==pos.count))
  throw Error('3D76 needs true SHA-verified source-photographed skinned sewn 3D75 denim');
 const l=pants.stats.landmarks?.map(r=>({
  knee:new THREE.Vector3(...r.knee),ankle:new THREE.Vector3(...r.ankle)
 }));
 if(l?.length!==2||l.some(r=>[r.knee,r.ankle].some(q=>!q.toArray().every(Number.isFinite))||
    r.knee.y-r.ankle.y<.22))
  throw Error('3D76 actual ankle/knee bones and source landmarks required');
 const snapshot=new Map(fields.map(n=>[n,old.getAttribute(n).array.slice()]));
 body.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const originalFront=old.getAttribute('pantsSourceFront');
 const groups=[],lookup=new Map(),vertexGroup=new Int32Array(pos.count);
 for(let i=0;i<pos.count;i++){
  const q=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
  if(!q.toArray().every(Number.isFinite))throw Error('3D76 invalid authentic 3D denim position');
  const key=stamp(q);
  let k=lookup.get(key);
  if(k===undefined){k=groups.length;lookup.set(key,k);groups.push({q,ids:[],front:0,adj:new Set()});}
  const n=groups[k];n.ids.push(i);n.front=Math.max(n.front,originalFront.getX(i));vertexGroup[i]=k;
 }
 if(groups.length<250)throw Error('3D76 source denim not independently sewn');
 const indices=old.index?.array,triangleCount=indices?indices.length/3:pos.count/3;
 if(!Number.isInteger(triangleCount)||triangleCount<150)throw Error('3D76 original triangle topology missing');
 let links=0;
 for(let t=0;t<triangleCount;t++){
  const a=vertexGroup[indices?indices[3*t]:3*t],
   b=vertexGroup[indices?indices[3*t+1]:3*t+1],
   c=vertexGroup[indices?indices[3*t+2]:3*t+2];
  for(const [i,j] of [[a,b],[b,c],[c,a]]){
   if(i===j)continue;
   const p=groups[i].q,q=groups[j].q;
   if(p.distanceToSquared(q)>.075*.075)continue; // no cross-leg/long-edge diffusion
   if((p.x>=0)!==(q.x>=0))continue;
   groups[i].adj.add(j);groups[j].adj.add(i);links++;
  }
 }
 if(links<400)throw Error('3D76 genuine sewn surface lacks continuous triangles');
 const eligible=groups.map(n=>{
  if(n.front>=.18)return false;
  const side=n.q.x>=0?0:1,leg=l[side];
  const min=leg.ankle.y+.065,max=leg.knee.y+.17;
  const f=clamp((n.q.y-leg.ankle.y)/(leg.knee.y-leg.ankle.y),0,1);
  const cx=THREE.MathUtils.lerp(leg.ankle.x,leg.knee.x,f);
  return n.q.y>=min&&n.q.y<=max&&Math.abs(n.q.x-cx)<.27&&
   n.adj.size>=2;
 });
 const heights=groups.map(n=>n.q.z),adj=groups.map(n=>[...n.adj]);
 const candidate=eligible.filter(Boolean).length;
 if(candidate<100||eligible.slice().filter(Boolean).length<100)
  throw Error('3D76 licensed original rear fold region too small');
 const energyBefore=edgeEnergy(heights,adj,eligible);
 if(energyBefore.edges<140||energyBefore.sum<1e-7)
  throw Error('3D76 no measured rear original-geometry edge relief');
 let next=heights;
 for(let i=0;i<4;i++)next=relaxMeshFoldHeights76(next,adj,eligible,{strength:.32});
 const geometry=old.clone(),out=geometry.getAttribute('position'),
  inverse=mesh.matrixWorld.clone().invert(),nearest=bodySurface(body);
 let moved=0,maxShift=0,contactLimited=0,frontProtected=0;
 const perLeg=[0,0];const final=heights.slice();
 for(let i=0;i<groups.length;i++){
  const n=groups[i];
  if(n.front>=.18){frontProtected+=n.ids.length;continue;}
  if(!eligible[i])continue;
  const side=n.q.x>=0?0:1,leg=l[side],f=(n.q.y-leg.ankle.y)/(leg.knee.y-leg.ankle.y);
  const envelope=smooth(f,.10,.25)*(1-smooth(f,1.09,1.37));
  if(envelope<=.015)continue;
  // 14 mm per original position maximum, conservative source-neutral rear only.
  let delta=clamp((next[i]-heights[i])*envelope,-.014,.014);
  if(Math.abs(delta)<.00014)continue;
  const hit=nearest(n.q);
  if(!hit?.point||!hit.normal||![...hit.point.toArray(),...hit.normal.toArray()].every(Number.isFinite)){
   geometry.dispose();throw Error('3D76 anatomical original body contact unavailable');
  }
  const before=n.q.clone().sub(hit.point).dot(hit.normal),floor=Math.min(before,.005);
  if(!Number.isFinite(before)){geometry.dispose();throw Error('3D76 nonfinite anatomical clearance');}
  if(before+delta*hit.normal.z<floor){
   if(hit.normal.z>1e-8)delta=Math.max(delta,(floor-before)/hit.normal.z);
   else if(hit.normal.z< -1e-8)delta=Math.min(delta,(floor-before)/hit.normal.z);
   else delta=0;
   contactLimited++;
  }
  if(before+delta*hit.normal.z<floor-.00030){
   geometry.dispose();throw Error('3D76 worsened source-pose closest-body gap');
  }
  if(Math.abs(delta)<.00014)continue;
  final[i]+=delta;
  const local=n.q.clone().add(new THREE.Vector3(0,0,delta)).applyMatrix4(inverse);
  for(const k of n.ids)out.setXYZ(k,local.x,local.y,local.z);
  moved+=n.ids.length;perLeg[side]+=n.ids.length;maxShift=Math.max(maxShift,Math.abs(delta));
 }
 if(moved<65||perLeg.some(x=>x<20)||maxShift<.00055||maxShift>.014001||frontProtected<100){
  geometry.dispose();throw Error('3D76 continuous original denim cloth relaxation not observed '+JSON.stringify({
   moved,perLeg,maxShift,frontProtected,contactLimited,candidate}));
 }
 const energyAfter=edgeEnergy(final,adj,eligible),ratio=energyAfter.sum/energyBefore.sum;
 if(!Number.isFinite(ratio)||ratio>1.005){
  geometry.dispose();throw Error('3D76 original seam edge roughness did not improve '+JSON.stringify({ratio,energyBefore,energyAfter}));
 }
 out.needsUpdate=true;geometry.computeVertexNormals();
 smoothSurfaceNormals(geometry,out.count);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 for(const name of fields){
  const before=snapshot.get(name),after=geometry.getAttribute(name)?.array;
  if(!after||before.length!==after.length||!after.every((v,i)=>v===before[i])){
   geometry.dispose();throw Error('3D76 original photograph front, UV/rest or 163-bone skin changed: '+name);
  }
 }
 mesh.geometry=geometry;
 let disposed=false;
 return {...pants,stats:{...pants.stats,
  sourcePhotoDenimSeamContinuity76:true,
  sourcePhotoDenimSeamContinuityMethod:'real source skinned sewn triangulation, bounded posterior knee/calf anisotropic diffusion',
  sourcePhotoDenimSmoothedVertices:moved,sourcePhotoDenimSmoothedPerLeg:perLeg,
  sourcePhotoDenimMaxSmoothing:maxShift,sourcePhotoDenimRearEdgeEnergyRatio:ratio,
  sourcePhotoDenimProtectedFrontVertices:frontProtected,
  sourcePhotoDenimTriangleEdges:links,sourcePhotoDenimContactLimited:contactLimited,
  originalPhotoJPEGAndRGBAlphaUnmodified:true,
  originalPhotoUVRestFrontSkinByteIdentical:true,
  unphotographedRearStillSourceNeutral:true,physicalPhonesVerified:false,
  dynamicFabricPhysicsVerified:false,continuousCollisionCertified:false,
  independentHumanPhotorealismApproved:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;mesh.geometry=old;geometry.dispose();pants.dispose();}
 };
}
