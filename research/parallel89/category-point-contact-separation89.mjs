/** Separate geometrically coincident, index-disconnected source grid corners
 * on a COPY. Retain the exact original texture and topology; UVs move with
 * the inset so the source-coordinate mapping remains consistent. This is an
 * explicit boundary modification, not approved silhouette ground truth.
 */
const hold={consumer3DAdmitted:false,maskGroundTruthApproved:false,physicalFitProved:false,originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'};
export function separateSourceCornerContacts89(volume){
 const f=volume?.sourcePlane,t=volume?.topology,p=f?.positions,uv=f?.uv,idx=f?.indices,n=p?.length/3;
 if(!(p instanceof Float32Array)||!(uv instanceof Float32Array)||!(idx instanceof Uint32Array)||!(t?.positions instanceof Float32Array)||!(t.indices instanceof Uint32Array)||!Number.isSafeInteger(n)||n<3||n>100000||uv.length!==n*2||t.positions.length!==p.length*2||idx.length%3||!p.every(Number.isFinite)||!uv.every(Number.isFinite)||!t.positions.every(Number.isFinite)||idx.some(i=>i>=n)||t.indices.some(i=>i>=2*n))throw Error('invalid-source-volume');
 const groups=new Map(),neighbors=Array.from({length:n},()=>new Set());
 for(let i=0;i<n;i++){
  if(p[3*i+2]!==0||t.positions[3*i]!==p[3*i]||t.positions[3*i+1]!==p[3*i+1]||t.positions[3*i+2]!==0||t.positions[3*(n+i)]!==p[3*i]||t.positions[3*(n+i)+1]!==p[3*i+1]||!(t.positions[3*(n+i)+2]<0))throw Error('unexpected-source-shell-layout');
  const key=p[3*i]+':'+p[3*i+1],g=groups.get(key)||[];g.push(i);groups.set(key,g);
 }
 for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];for(const [u,v] of [[a,b],[b,c],[c,a]]){neighbors[u].add(v);neighbors[v].add(u);}}
 const positions=t.positions.slice(),outUV=uv.slice();
 let cornerGroups=0,modifiedVertices=0,maxInset=0;
 for(const g of groups.values()){
  if(g.length===1)continue;cornerGroups++;
  const keys=new Set();
  for(const i of g){
   const adj=[...neighbors[i]];
   if(!adj.length||adj.some(j=>g.includes(j)))throw Error('coincident-corners-not-disconnected');
   let dx=0,dy=0,du=0,dv=0;
   for(const j of adj){dx+=p[j*3]-p[i*3];dy+=p[j*3+1]-p[i*3+1];du+=uv[j*2]-uv[i*2];dv+=uv[j*2+1]-uv[i*2+1];}
   const weight=.125/adj.length;dx*=weight;dy*=weight;du*=weight;dv*=weight;
   if(Math.hypot(dx,dy)<=1e-8)throw Error('corner-inset-direction-degenerate');
   for(const j of [i,i+n]){positions[j*3]+=dx;positions[j*3+1]+=dy;}
   outUV[i*2]+=du;outUV[i*2+1]+=dv;
   const k=positions[i*3]+':'+positions[i*3+1];if(keys.has(k))throw Error('corner-remains-coincident');keys.add(k);
   modifiedVertices++;maxInset=Math.max(maxInset,Math.hypot(dx,dy));
  }
 }
 const area=(a,u,v,w)=>(a[v*3]-a[u*3])*(a[w*3+1]-a[u*3+1])-(a[v*3+1]-a[u*3+1])*(a[w*3]-a[u*3]);
 let beforeArea=0,afterArea=0;
 for(let i=0;i<idx.length;i+=3){const u=idx[i],v=idx[i+1],w=idx[i+2],a=area(p,u,v,w),b=area(positions,u,v,w);if(!(a>0&&b>0&&b/a>.5))throw Error('corner-inset-triangle-collapse');beforeArea+=a;afterArea+=b;}
 if(!outUV.every(x=>x>=0&&x<=1))throw Error('inset-uv-out-of-range');
 return {status:'SOURCE_CORNER_INSET_RESEARCH_ONLY',positions,uv:outUV,indices:t.indices.slice(),cornerGroups,modifiedVertices,maxInset,originalProjectedArea:beforeArea/2,trialProjectedArea:afterArea/2,originalTextureUnmodified:true,sourceGeometryUnmodified:false,sourceOriginalGeometryRetained:true,...hold};
}
