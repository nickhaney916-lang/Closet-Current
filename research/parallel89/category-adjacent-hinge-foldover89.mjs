/** Shared-edge foldover research audit. This checks the two triangles
 * incident to each indexed edge; vertex-only adjacency and swept motion
 * remain explicitly uncertified. Do not suppress nonlocal contacts.
 */
const hold={consumer3DAdmitted:false,physicalFitProved:false,clothDrapeProved:false,continuousMotionProved:false,vertexOnlyAdjacencyCleared:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function auditSharedEdgeFoldover89({positions,indices}={}){
 if(!(positions instanceof Float32Array||positions instanceof Float64Array)||positions.length<9||positions.length%3||positions.length/3>200000||!positions.every(Number.isFinite)||!(indices instanceof Uint32Array)||indices.length<3||indices.length%3||indices.length/3>150000||indices.some(i=>i>=positions.length/3))throw Error('invalid-foldover-geometry');
 const edges=new Map(),point=i=>[positions[i*3],positions[i*3+1],positions[i*3+2]];
 let degenerateFaces=0,unpairedEdges=0,nonmanifoldEdges=0,orientationErrors=0,checkedHinges=0,foldovers=0,nearFoldovers=0,maxHingeAngle=0,firstFoldover=null;
 for(let i=0;i<indices.length;i+=3){
  const [a,b,c]=indices.subarray(i,i+3);
  if(norm(cross(sub(point(b),point(a)),sub(point(c),point(a))))<=1e-12)degenerateFaces++;
  for(const [u,v,w] of [[a,b,c],[b,c,a],[c,a,b]]){
   const key=u<v?u+':'+v:v+':'+u,entry=edges.get(key)||[];
   entry.push({u,v,w,face:i/3});edges.set(key,entry);
  }
 }
 for(const pair of edges.values()){
  if(pair.length===1){unpairedEdges++;continue}
  if(pair.length!==2){nonmanifoldEdges++;continue}
  const [a,b]=pair;
  if(a.u!==b.v||a.v!==b.u){orientationErrors++;continue}
  const u=point(a.u),v=point(a.v),edge=sub(v,u),len=norm(edge);
  if(len<=1e-12)continue;
  const unit=edge.map(x=>x/len);
  const perp=w=>{const x=sub(point(w),u),d=dot(x,unit);return x.map((k,i)=>k-d*unit[i]);};
  const x=perp(a.w),y=perp(b.w),lx=norm(x),ly=norm(y);
  if(lx<=1e-12||ly<=1e-12)continue;
  const nx=x.map(k=>k/lx),ny=y.map(k=>k/ly);
  const d=Math.max(-1,Math.min(1,dot(nx,ny))),s=norm(cross(nx,ny));
  // On opposite sides of a flat shared edge, d=-1. On the same
  // side of its line, coplanar faces overlap over positive area.
  const hinge=Math.atan2(s,-d);maxHingeAngle=Math.max(maxHingeAngle,hinge);checkedHinges++;
  if(d>0&&s<=1e-10){foldovers++;firstFoldover??={faceA:a.face,faceB:b.face,edge:[a.u,a.v]};}
  else if(d>0&&s<=1e-5)nearFoldovers++;
 }
 const complete=checkedHinges===edges.size&&degenerateFaces===0&&unpairedEdges===0&&nonmanifoldEdges===0&&orientationErrors===0;
 const status=foldovers?'SHARED_EDGE_FOLDOVER_VETO':!complete||nearFoldovers?'SHARED_EDGE_FOLDOVER_UNRESOLVED':'NO_SHARED_EDGE_FOLDOVER_DETECTED';
 return {status,facesSubmitted:indices.length/3,indexedEdges:edges.size,checkedHinges,completeClosedEdgeScope:complete,foldovers,nearFoldovers,degenerateFaces,unpairedEdges,nonmanifoldEdges,orientationErrors,maxHingeAngleRadians:maxHingeAngle,firstFoldover,sourceGeometryUnmodified:true,...hold};
}
