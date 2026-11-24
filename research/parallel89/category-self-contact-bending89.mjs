/** Static garment self-contact and indexed-hinge bending research.
 * Nonlocal means triangles with no shared vertex index. Adjacent pairs are
 * inventoried separately; neither result certifies a sewn wearable cloth,
 * signed containment, adjacent-face foldover or continuous motion.
 */
import {classifyExactTriangleContact} from './full-indexed-contact-calibration89.mjs';
const EPS=1e-7;
const hold={consumer3DAdmitted:false,physicalFitProved:false,clothDrapeProved:false,continuousMotionProved:false,adjacentFoldoverCleared:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const normal=(p,a,b,c)=>{
 const x=p[3*b]-p[3*a],y=p[3*b+1]-p[3*a+1],z=p[3*b+2]-p[3*a+2],u=p[3*c]-p[3*a],v=p[3*c+1]-p[3*a+1],w=p[3*c+2]-p[3*a+2];
 const n=[y*w-z*v,z*u-x*w,x*v-y*u],l=Math.hypot(...n);
 return l>1e-12?n.map(k=>k/l):null;
};
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b))));
export function auditCategorySelfContact89({rest,posed,indices,maxLeafPairs=8000000,maxNodeVisits=12000000}={}){
 if(![rest,posed].every(p=>(p instanceof Float32Array||p instanceof Float64Array)&&p.length>=9&&p.length%3===0&&p.every(Number.isFinite))||rest.length!==posed.length||rest.length/3>200000||!(indices instanceof Uint32Array)||indices.length<3||indices.length%3||indices.length/3>150000||indices.some(i=>i>=rest.length/3)||![maxLeafPairs,maxNodeVisits].every(n=>Number.isSafeInteger(n)&&n>=1))throw Error('invalid-self-audit-input');
 const n=indices.length/3,boxes=new Float64Array(n*6),restNormals=[],poseNormals=[],edges=new Map();
 let degenerateFaces=0,nonmanifoldEdges=0,sharedHinges=0,maxHingeChange=0,hingeChangeSquared=0;
 for(let i=0;i<n;i++){
  const a=indices[3*i],b=indices[3*i+1],c=indices[3*i+2],rn=normal(rest,a,b,c),pn=normal(posed,a,b,c);
  restNormals.push(rn);poseNormals.push(pn);
  if(!rn||!pn)degenerateFaces++;
  for(let k=0;k<3;k++){boxes[i*6+k]=Math.min(posed[a*3+k],posed[b*3+k],posed[c*3+k]);boxes[i*6+k+3]=Math.max(posed[a*3+k],posed[b*3+k],posed[c*3+k]);}
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   const key=u<v?u+':'+v:v+':'+u,entry=edges.get(key);
   if(!entry)edges.set(key,{first:i,count:1});
   else {entry.count++;if(entry.count===2&&rn&&pn&&restNormals[entry.first]&&poseNormals[entry.first]){
    const d=Math.abs(angle(rn,restNormals[entry.first])-angle(pn,poseNormals[entry.first]));sharedHinges++;maxHingeChange=Math.max(maxHingeChange,d);hingeChangeSquared+=d*d;
   }}
  }
 }
 for(const e of edges.values())if(e.count>2)nonmanifoldEdges++;
 const ids=Array.from({length:n},(_,i)=>i);
 function build(lo,hi){
  const b=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];let maxId=-1;
  for(let j=lo;j<hi;j++){const i=ids[j];maxId=Math.max(maxId,i);for(let k=0;k<3;k++){b[k]=Math.min(b[k],boxes[6*i+k]);b[k+3]=Math.max(b[k+3],boxes[6*i+k+3]);}}
  if(hi-lo<=8)return {b,lo,hi,maxId};
  let axis=0;for(let k=1;k<3;k++)if(b[k+3]-b[k]>b[axis+3]-b[axis])axis=k;
  const sorted=ids.slice(lo,hi).sort((a,c)=>boxes[a*6+axis]+boxes[a*6+axis+3]-boxes[c*6+axis]-boxes[c*6+axis+3]);
  for(let j=lo;j<hi;j++)ids[j]=sorted[j-lo];
  const mid=(lo+hi)>>1;return {b,maxId,left:build(lo,mid),right:build(mid,hi)};
 }
 const root=build(0,n),overlap=(a,off,b,bo)=>a[off]<=b[bo+3]+EPS&&b[bo]<=a[off+3]+EPS&&a[off+1]<=b[bo+4]+EPS&&b[bo+1]<=a[off+4]+EPS&&a[off+2]<=b[bo+5]+EPS&&b[bo+2]<=a[off+5]+EPS;
 const face=i=>[0,1,2].map(j=>{const p=indices[i*3+j]*3;return [posed[p],posed[p+1],posed[p+2]]});
 const shared=(a,b)=>{for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(indices[a*3+i]===indices[b*3+j])return true;return false;};
 const counts={CROSSING:0,COPLANAR_OVERLAP:0,TOUCHING:0,INDETERMINATE:0,NONE:0};let visits=0,pairs=0,adjacentExcluded=0,exactPairs=0,first=null,complete=true;
 outer:for(let i=0;i<n;i++){
  const stack=[root];let f=null;
  while(stack.length){
   const node=stack.pop();if(++visits>maxNodeVisits){complete=false;break outer;}
   if(node.maxId<=i||!overlap(boxes,i*6,node.b,0))continue;
   if(node.left){stack.push(node.left,node.right);continue;}
   for(let j=node.lo;j<node.hi;j++){
    const k=ids[j];if(k<=i)continue;
    if(++pairs>maxLeafPairs){complete=false;break outer;}
    if(!overlap(boxes,i*6,boxes,k*6))continue;
    if(shared(i,k)){adjacentExcluded++;continue;}
    exactPairs++;f??=face(i);
    const c=classifyExactTriangleContact(f,face(k),true);counts[c]++;
    if(c!=='NONE'&&!first)first={faceA:i,faceB:k,classification:c};
   }
  }
 }
 const strict=counts.CROSSING+counts.COPLANAR_OVERLAP;
 const status=strict?'NONLOCAL_SELF_INTERSECTION_VETO':!complete||degenerateFaces||nonmanifoldEdges||counts.INDETERMINATE||counts.TOUCHING?'NONLOCAL_SELF_CONTACT_UNRESOLVED':'NO_NONLOCAL_SELF_CONTACT_DETECTED';
 return {status,facesSubmitted:n,allFacesIndexed:true,completeNonlocalAudit:complete,adjacentSharedVertexPairsExcluded:adjacentExcluded,exactNonlocalPairs:exactPairs,leafPairs:pairs,nodeVisits:visits,classifications:counts,firstCandidate:first,degenerateFaces,nonmanifoldEdges,sharedHinges,maxHingeChangeRadians:maxHingeChange,rmsHingeChangeRadians:sharedHinges?Math.sqrt(hingeChangeSquared/sharedHinges):0,sourceGeometryUnmodified:true,...hold};
}
