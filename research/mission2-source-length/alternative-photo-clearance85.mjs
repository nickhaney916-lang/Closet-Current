/**
 * Mission 2 / parallel #85: independent, read-only photographed-dress trial.
 * Only call from C52's SHA-verified, original 163-bone source path.
 * Two alternatives to C60: a quintic-height radial envelope and a
 * welded, stretch-constrained positional solver. Neither is consumer 3D.
 * Pure browser/Node ESM; no network, owner images or source mutations.
 */
import {createDisposableUpperTorsoWorldTrial60} from './upper-torso-clearance-trial60.mjs';

const fail=(s)=>{throw Error('M2 P85 disposable photo geometry '+s);};
const q=t=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(6*x-15)+10);};
const key=(a,i)=>[0,1,2].map(k=>Math.round(a[3*i+k]/0.0000005)).join(':');
const length=(x,y,z)=>Math.hypot(x,y,z);
function verify(world,indices,neck,spine){
 if(!(world instanceof Float32Array)||world.length<9||world.length%3||
  !world.every(Number.isFinite)||
  !(indices===null||indices instanceof Uint16Array||indices instanceof Uint32Array)||
  (indices!==null&&(indices.length<3||indices.length%3||
   Array.from(indices).some(i=>i>=world.length/3)))||
  !Array.isArray(neck)||!Array.isArray(spine)||
  neck.length!==3||spine.length!==3||
  !neck.every(Number.isFinite)||!spine.every(Number.isFinite)||
  neck[1]<=spine[1]+.001)
  fail('finite original source triangles and upright neck01/spine04 required');
}
function summary(world,out,method,maxMeters,extra={}){
 let moved=0,maxAppliedMeters=0;
 for(let i=0;i<world.length;i+=3){
  const d=length(out[i]-world[i],out[i+1]-world[i+1],out[i+2]-world[i+2]);
  if(d>maxMeters+2e-6)fail('outward candidate exceeded bounded displacement');
  if(d>1e-8)moved++;
  maxAppliedMeters=Math.max(maxAppliedMeters,d);
 }
 return Object.freeze({
  schema:'M2-P85-disposable-licensed-world-candidate',
  method,limitMeters:maxMeters,
  movedVertices:moved,maxAppliedMeters,
  originalPhotoWorldAndRestNeverModified:true,
  sourceUVTextureSkinAndBonesNeverModified:true,
  originalIndicesNeverModified:true,
  noHumanReviewedPhotorealism:true,
  continuousCollisionNotMeasured:true,
  candidateNotInstalledInRenderer:true,
  releaseAuthorized:false,familyAlpha:'HOLD',
  ...extra,world:out
 });
}
function envelope(y,neck,spine){
 const h=neck[1]-spine[1],f=Math.min(.10,h/4);
 return q((y-(spine[1]-f))/(2*f))*
  (1-q((y-(neck[1]-f))/(2*f)));
}
function quintic(world,neck,spine,meters){
 const out=world.slice();
 for(let i=0;i<world.length;i+=3){
  const x=world[i],y=world[i+1],z=world[i+2],
   dx=x-spine[0],dz=z-spine[2],r=Math.hypot(dx,dz),
   w=envelope(y,neck,spine);
  if(r>1e-8&&w>0){
   out[i]=Math.fround(x+meters*w*dx/r);
   out[i+2]=Math.fround(z+meters*w*dz/r);
  }
 }
 return summary(world,out,'quintic-height-envelope',meters);
}
/**
 * Weld only vertices sharing signed skinned-WORLD positions within .5um.
 * No geometry is reindexed, no seam is sewn, original UVs are never read.
 * This graph is used solely for disposable displacement continuity.
 * Separate source positions always remain separate.
 */
function welded(world,indices){
 const groups=[],map=new Map(),of=new Uint32Array(world.length/3);
 for(let i=0;i<of.length;i++){
  const k=key(world,i);let g=map.get(k);
  if(g===undefined){
   g=groups.length;map.set(k,g);
   groups.push({ids:[],p:[world[3*i],world[3*i+1],world[3*i+2]]});
  }
  groups[g].ids.push(i);of[i]=g;
 }
 const count=(indices?.length??of.length),seen=new Set(),edges=[];
 for(let f=0;f<count;f+=3){
  const t=[0,1,2].map(k=>of[indices?indices[f+k]:f+k]);
  for(let j=0;j<3;j++){
   const u=Math.min(t[j],t[(j+1)%3]),v=Math.max(t[j],t[(j+1)%3]);
   if(u===v)continue;
   const k=u+':'+v;
   if(!seen.has(k)){seen.add(k);edges.push([u,v]);}
  }
 }
 return {groups,of,edges};
}
function constrained(world,indices,neck,spine,meters,
 targetOverride=null,method='welded-edge-strain-projection'){
 // C60 is an immutable control; optionally optimize a witness-localized
 // disposable target without ever applying it to original renderer assets.
 const target=targetOverride??createDisposableUpperTorsoWorldTrial60(world,{
  neck,spine,outwardMeters:meters}).world;
 if(!(target instanceof Float32Array)||target.length!==world.length||
  !target.every(Number.isFinite))fail('invalid temporary localized target');
 const {groups,of,edges}=welded(world,indices);
 const base=groups.map(g=>g.p);
 const delta=groups.map(g=>{
  const i=g.ids[0]*3;
  return [target[i]-world[i],target[i+1]-world[i+1],target[i+2]-world[i+2]];
 });
 const p=base.map((v,i)=>v.map((a,k)=>a+delta[i][k]));
 const mobile=delta.map(d=>Math.hypot(...d)>1e-9);
 let iterations=0,projectedEdges=0;
 // Bounded strain energy projection, NOT a collision resolver: actual
 // collisions must be checked later by untouched C58 strict triangle test.
 for(let iter=0;iter<22;iter++){
  let projections=0;
  for(const [u,v] of edges){
   const a=p[u],b=p[v],A=base[u],B=base[v];
   const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],
    L=length(dx,dy,dz),
    L0=length(B[0]-A[0],B[1]-A[1],B[2]-A[2]);
   if(!(L0>1e-10)||!(L>1e-10))continue;
   const ideal=Math.max(L0*.97,Math.min(L0*1.03,L));
   if(Math.abs(L-ideal)<1e-9)continue;
   const coeff=.75*(L-ideal)/L;
   const wU=mobile[u]?1:0,wV=mobile[v]?1:0,sum=wU+wV;
   if(!sum)continue;
   for(let k=0;k<3;k++){
    const d=coeff*(k===0?dx:k===1?dy:dz);
    a[k]+=d*wU/sum;b[k]-=d*wV/sum;
   }
   projections++;
  }
  // Small target spring avoids unbounded drift and keeps start localized.
  for(let i=0;i<p.length;i++){
   if(!mobile[i]){p[i]=base[i].slice();continue;}
   const v=p[i],orig=base[i],goal=delta[i];
   for(let k=0;k<3;k++)v[k]=orig[k]+.94*(v[k]-orig[k])+.06*goal[k];
   let dx=v[0]-orig[0],dy=v[1]-orig[1],dz=v[2]-orig[2];
   const r=length(dx,dy,dz),cap=Math.min(meters,Math.hypot(...goal)+.001);
   if(r>cap){const s=cap/r;dx*=s;dy*=s;dz*=s;}
   // Never force an originally outward vertex inward to 'fix' quality.
   if(dx*goal[0]+dy*goal[1]+dz*goal[2]<0){dx=dy=dz=0;}
   v[0]=orig[0]+dx;v[1]=orig[1]+dy;v[2]=orig[2]+dz;
  }
  iterations++;projectedEdges+=projections;
  if(projections===0)break;
 }
 const out=world.slice();
 for(let i=0;i<of.length;i++){
  const g=of[i],at=groups[g].p,sol=p[g];
  for(let k=0;k<3;k++)out[3*i+k]=Math.fround(
   world[3*i+k]+sol[k]-at[k]);
 }
 let maxCoincidentSeamDeltaMeters=0;
 for(const g of groups){
  if(g.ids.length<2)continue;
  const i=g.ids[0];
  for(const j of g.ids.slice(1)){
   const dr=length(
    (out[3*j]-out[3*i])-(world[3*j]-world[3*i]),
    (out[3*j+1]-out[3*i+1])-(world[3*j+1]-world[3*i+1]),
    (out[3*j+2]-out[3*i+2])-(world[3*j+2]-world[3*i+2]));
   maxCoincidentSeamDeltaMeters=Math.max(maxCoincidentSeamDeltaMeters,dr);
  }
 }
 return summary(world,out,method,meters,{
  projectionIterations:iterations,projectedEdges,
  sourcePositionGroupCount:groups.length,
  maxCoincidentSeamDeltaMeters,
  actualUVSeamAndVisualHoleAcceptanceNotMeasured:true
 });
}
export function createDisposableClothAlternatives85(
 originalWorld,indices=null,{neck,spine}={}
){
 verify(originalWorld,indices,neck,spine);
 const copy=originalWorld.slice();
 const candidates=[
  quintic(originalWorld,neck,spine,.0045),
  quintic(originalWorld,neck,spine,.006),
  constrained(originalWorld,indices,neck,spine,.0045),
  constrained(originalWorld,indices,neck,spine,.006)
 ];
 if(!originalWorld.every((v,i)=>v===copy[i]))
  fail('original authenticated world source was mutated');
 return Object.freeze(candidates);
}

/**
 * Parallel #85 continued research: true C58 strict ORIGINAL body crossing
 * cloth-face witnesses are given ONLY in-memory, from a COMPLETE source
 * audit. P85 never exports face IDs/XYZ, never exempts collisions, never
 * rewrites original photo/shader/UV/rest/skin/rig or applies trial geometry.
 *
 * Distances are original mesh graph edge hops (NOT Euclidean penetration
 * depths). This localizes radial relief to actual witnessed topology rather
 * than globally translating an anatomical torso height band.
 */
export function createDisposableWitnessLocalized85(
 originalWorld,indices=null,{neck,spine,strictClothFaceIndices}={}
){
 verify(originalWorld,indices,neck,spine);
 const faces=(indices?.length??originalWorld.length/3)/3;
 if(!Array.isArray(strictClothFaceIndices)||
  strictClothFaceIndices.length>faces||
  strictClothFaceIndices.some(i=>!Number.isSafeInteger(i)||
   i<0||i>=faces)||
  new Set(strictClothFaceIndices).size!==strictClothFaceIndices.length)
  fail('actual original-source strict cloth witness face IDs required in memory');
 const before=originalWorld.slice(),graph=welded(originalWorld,indices),
  {groups,of,edges}=graph,adj=groups.map(()=>[]);
 for(const [u,v] of edges){adj[u].push(v);adj[v].push(u);}
 const dist=new Int16Array(groups.length).fill(-1),queue=[];
 for(const face of strictClothFaceIndices){
  for(let k=0;k<3;k++){
   const vertex=indices?indices[3*face+k]:3*face+k,g=of[vertex];
   if(dist[g]===-1){dist[g]=0;queue.push(g);}
  }
 }
 let head=0;
 while(head<queue.length){
  const u=queue[head++];
  if(dist[u]>=44)continue;
  for(const v of adj[u])if(dist[v]===-1){
   dist[v]=dist[u]+1;queue.push(v);
  }
 }
 function localized(radius,constrain){
  const out=originalWorld.slice();
  let active=0,maxHop=-1;
  for(let g=0;g<groups.length;g++){
   const hop=dist[g];
   if(hop<0||hop>=radius)continue;
   const [x,y,z]=groups[g].p,
    dx=x-spine[0],dz=z-spine[2],r=Math.hypot(dx,dz);
   if(r<=1e-8)continue;
   // Full 6 mm in original-crossing neighborhood; C1 quintic graph
   // falloff to zero at the selected radius, feathered anatomically.
   const topoWeight=hop<=2?1:q((radius-hop)/(radius-2));
   const meters=.006*topoWeight*envelope(y,neck,spine);
   if(!(meters>1e-9))continue;
   active++;maxHop=Math.max(maxHop,hop);
   for(const i of groups[g].ids){
    out[3*i]=Math.fround(originalWorld[3*i]+dx/r*meters);
    out[3*i+2]=Math.fround(originalWorld[3*i+2]+dz/r*meters);
   }
  }
  const method=constrain?
   'strict-witness-local-edge-projection':
   'strict-witness-local-radial';
  const recipe=constrain?
   constrained(originalWorld,indices,neck,spine,.006,out,method):
   summary(originalWorld,out,method,.006);
  return Object.freeze({
   ...recipe,
   originalStrictWitnessFaceCount85:strictClothFaceIndices.length,
   localGraphRadiusHops85:radius,
   localizedSourcePositionGroups85:active,
   furthestMovedGraphHop85:maxHop,
   originalSourceFaceIdsNeverExported85:true,
   sourceWitnessNotPhysicalDepthOrContinuousContact:true,
   bodyCollisionAndC61QualityMustBeRemeasured:true
  });
 }

 function shapeRegularized(radius,passes=18,neighborBlend=.35){
  // Experimental triangle-shape preservation: regularize displacement
  // between real adjacent source-position groups while hard-pinning the
  // witnessed contact core and the outer original mesh boundaries.
  // Nonlinear C61 normal/area/edge metrics remain authoritative.
  const seed=localized(radius,true),initial=seed.world,
   delta=groups.map(g=>{
    const i=3*g.ids[0];
    return [initial[i]-originalWorld[i],
     initial[i+1]-originalWorld[i+1],
     initial[i+2]-originalWorld[i+2]];
   });
  let state=delta.map(d=>d.slice());
  for(let pass=0;pass<passes;pass++){
   const next=state.map(v=>v.slice());
   for(let g=0;g<groups.length;g++){
    if(dist[g]<=2||dist[g]>=radius)continue;
    const near=adj[g];if(near.length<1)continue;
    const mean=[0,0,0];
    for(const u of near)
     for(let k=0;k<3;k++)mean[k]+=state[u][k]/near.length;
    const d=next[g],start=delta[g];
    for(let k=0;k<3;k++)
     d[k]=(.95-neighborBlend)*state[g][k]+neighborBlend*mean[k]+.05*start[k];
    const m=Math.hypot(...d);
    if(m>.006){
     for(let k=0;k<3;k++)d[k]*=.006/m;
    }
   }
   state=next;
  }
  const target=originalWorld.slice();
  for(let g=0;g<groups.length;g++){
   for(const i of groups[g].ids)
    for(let k=0;k<3;k++)
     target[3*i+k]=Math.fround(originalWorld[3*i+k]+state[g][k]);
  }
  const result=constrained(originalWorld,indices,neck,spine,
   .006,target,'strict-witness-local-shape-regularized');
  return Object.freeze({...result,
   originalStrictWitnessFaceCount85:strictClothFaceIndices.length,
   localGraphRadiusHops85:radius,
   localizedSourcePositionGroups85:seed.localizedSourcePositionGroups85,
   furthestMovedGraphHop85:seed.furthestMovedGraphHop85,
   shapeSmoothingPasses85:passes,
   shapeNeighborBlend85:neighborBlend,
   contactCoreHeldDuringSmoothing85:true,
   originalSourceFaceIdsNeverExported85:true,
   sourceWitnessNotPhysicalDepthOrContinuousContact:true,
   bodyCollisionAndC61QualityMustBeRemeasured:true
  });
 }
 const candidates=[
  localized(12,false),localized(24,false),
  localized(12,true),localized(24,true),
  localized(32,true),localized(40,true),
  shapeRegularized(24),shapeRegularized(32),
  shapeRegularized(24,36),shapeRegularized(24,60),
  shapeRegularized(24,36,.50)
 ];
 if(!originalWorld.every((v,i)=>v===before[i]))
  fail('P85 original source-skinned world buffer altered');
 return Object.freeze(candidates);
}
