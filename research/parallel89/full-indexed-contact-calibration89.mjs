/**
 * M2 P89 — research-only complete indexed-face broad-phase contact audit.
 * Inputs are authentic *posed* original indexed triangles in rig units.
 * Tests contact, not physical fit. The source back/mask/calibration remain UNKNOWN.
 * No production admission/consumer render or network access.
 */
const EPS=1e-7;
const vsub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=a=>Math.hypot(...a);
const area2=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const allFinite=t=>Array.isArray(t)&&t.length===3&&t.every(p=>
 Array.isArray(p)&&p.length===3&&p.every(Number.isFinite));
const bbox=t=>{
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const p of t)for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}
 return {min,max};
};
const boxesOverlap=(a,b,epsilon=EPS)=>{
 for(let i=0;i<3;i++)if(a.min[i]>b.max[i]+epsilon||a.max[i]+epsilon<b.min[i])return false;
 return true;
};
const project=(p,axis)=>axis===0?[p[1],p[2]]:axis===1?[p[0],p[2]]:[p[0],p[1]];
const dominant=n=>Math.abs(n[0])>Math.abs(n[1])?
 (Math.abs(n[0])>Math.abs(n[2])?0:2):
 (Math.abs(n[1])>Math.abs(n[2])?1:2);
const inside2=(p,t,strict=false)=>{
 const s=[area2(t[0],t[1],p),area2(t[1],t[2],p),area2(t[2],t[0],p)];
 const hasPos=s.some(x=>x>EPS),hasNeg=s.some(x=>x<-EPS);
 if(hasPos&&hasNeg)return false;
 return strict?s.every(x=>Math.abs(x)>EPS):true;
};
const pointOnSeg=(p,a,b)=>{
 if(Math.abs(area2(a,b,p))>EPS)return false;
 return p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&
  p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS;
};
const intersect2=(a,b,c,d)=>{
 const s1=area2(a,b,c),s2=area2(a,b,d),s3=area2(c,d,a),s4=area2(c,d,b);
 const proper=((s1>EPS&&s2< -EPS)||(s1< -EPS&&s2>EPS))&&
  ((s3>EPS&&s4< -EPS)||(s3< -EPS&&s4>EPS));
 const touching=proper||pointOnSeg(c,a,b)||pointOnSeg(d,a,b)||
  pointOnSeg(a,c,d)||pointOnSeg(b,c,d);
 return {proper,touching};
};
const clipArea=(subject,clip)=>{
 // Convex Sutherland–Hodgman, area is positive only when coplanar
 // triangle interiors overlap (collinear edge touch is zero-area).
 let out=subject.map(p=>p.slice());
 const sign=area2(clip[0],clip[1],clip[2])>=0?1:-1;
 for(let i=0;i<3;i++){
  const a=clip[i],b=clip[(i+1)%3],input=out;out=[];
  if(!input.length)break;
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],dp=sign*area2(a,b,p),
    dq=sign*area2(a,b,q),inp=dp>=-EPS,inq=dq>=-EPS;
   if(inp)out.push(p);
   if(inp!==inq){
    const denominator=dp-dq;
    if(Math.abs(denominator)>1e-16){
     const t=Math.max(0,Math.min(1,dp/denominator));
     out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);
    }
   }
  }
 }
 if(out.length<3)return 0;
 let double=0;
 for(let i=0;i<out.length;i++){
  const p=out[i],q=out[(i+1)%out.length];
  double+=p[0]*q[1]-p[1]*q[0];
 }
 return Math.abs(double)*.5;
};
const coplanarContact=(a,b,n)=>{
 const axis=dominant(n),ap=a.map(p=>project(p,axis)),bp=b.map(p=>project(p,axis));
 if(clipArea(ap,bp)>EPS*EPS*10)return 'COPLANAR_OVERLAP';
 if(ap.some(p=>inside2(p,bp))||bp.some(p=>inside2(p,ap)))return 'TOUCHING';
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)
  if(intersect2(ap[i],ap[(i+1)%3],bp[j],bp[(j+1)%3]).touching)return 'TOUCHING';
 return 'NONE';
};
const in3=(p,tri)=>{
 const a=vsub(tri[1],tri[0]),b=vsub(tri[2],tri[0]),v=vsub(p,tri[0]);
 const aa=dot(a,a),bb=dot(b,b),ab=dot(a,b),av=dot(a,v),bv=dot(b,v),den=aa*bb-ab*ab;
 if(den<=1e-20)return {inside:false,strict:false};
 const u=(bb*av-ab*bv)/den,w=(aa*bv-ab*av)/den;
 return {inside:u>=-EPS&&w>=-EPS&&u+w<=1+EPS,
  strict:u>EPS&&w>EPS&&u+w<1-EPS};
};
export function classifyExactTriangleContact(a,b){
 if(!allFinite(a)||!allFinite(b))return 'INDETERMINATE';
 if(!boxesOverlap(bbox(a),bbox(b)))return 'NONE';
 const na=cross(vsub(a[1],a[0]),vsub(a[2],a[0])),
  nb=cross(vsub(b[1],b[0]),vsub(b[2],b[0])),
  la=len(na),lb=len(nb);
 if(la<EPS*EPS||lb<EPS*EPS)return 'INDETERMINATE';
 const normals=[na.map(x=>x/la),nb.map(x=>x/lb)];
 const da=b.map(p=>dot(normals[0],vsub(p,a[0]))),
  db=a.map(p=>dot(normals[1],vsub(p,b[0])));
 if(da.every(x=>x>EPS)||da.every(x=>x< -EPS)||
  db.every(x=>x>EPS)||db.every(x=>x< -EPS))return 'NONE';
 const parallel=len(cross(normals[0],normals[1]))<=EPS;
 if(parallel){
  if(da.some(x=>Math.abs(x)>EPS*2)||db.some(x=>Math.abs(x)>EPS*2))
   return 'INDETERMINATE';
  return coplanarContact(a,b,na);
 }
 let touching=false;
 const edgeHit=(tri,other,normal)=>{
  for(let i=0;i<3;i++){
   const p=tri[i],q=tri[(i+1)%3],d0=dot(normal,vsub(p,other[0])),
    d1=dot(normal,vsub(q,other[0]));
   if(Math.abs(d0)<EPS&&Math.abs(d1)<EPS){
    const axis=dominant(normal),pp=project(p,axis),qq=project(q,axis),
     ot=other.map(x=>project(x,axis));
    if(inside2(pp,ot)||inside2(qq,ot)){touching=true;continue;}
    for(let k=0;k<3;k++)if(intersect2(pp,qq,ot[k],ot[(k+1)%3]).touching)
     touching=true;
    continue;
   }
   if((d0>EPS&&d1>EPS)||(d0< -EPS&&d1< -EPS))continue;
   const den=d0-d1;
   if(Math.abs(den)<1e-20)continue;
   const t=d0/den;
   if(t< -EPS||t>1+EPS)continue;
   const hit=p.map((x,j)=>x+(q[j]-x)*t);
   const inside=in3(hit,other);
   if(!inside.inside)continue;
   if(t>EPS&&t<1-EPS&&inside.strict&&d0*d1< -EPS*EPS)
    return 'CROSSING';
   touching=true;
  }
  return null;
 };
 if(edgeHit(a,b,normals[1])==='CROSSING'||edgeHit(b,a,normals[0])==='CROSSING')
  return 'CROSSING';
 return touching?'TOUCHING':'NONE';
}
export function evaluateFullIndexedContact(bodyFaces,frontFaces,{maxPairs=30000000}={}){
 if(!Array.isArray(bodyFaces)||!Array.isArray(frontFaces)||!bodyFaces.length||!frontFaces.length)
  throw Error('real-original-full-face-counts-required');
 // This checker may audit actual full geometry only. No skip/stride/cap of
 // source faces or body submeshes: a truncated evaluation is FAIL, not PASS.
 if(bodyFaces.length>150000||frontFaces.length>150000)
  throw Error('original-face-scope-exceeds-safe-resource-budget');
 const bodyBoxes=bodyFaces.map(bbox),frontBoxes=frontFaces.map(bbox);
 // A genuine bounded-volume hierarchy over EVERY original indexed body face.
 // Branch union boxes conservatively contain all descendants. Traversing
 // exact overlapping nodes cannot omit a contact, unlike stride/sampling.
 const allIndices=Uint32Array.from(bodyFaces,(_,i)=>i);
 let bvhNodes=0,bvhLeaves=0;
 const build=ids=>{
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity],
   cmin=[Infinity,Infinity,Infinity],cmax=[-Infinity,-Infinity,-Infinity];
  for(const i of ids){
   const b=bodyBoxes[i];
   for(let a=0;a<3;a++){
    lo[a]=Math.min(lo[a],b.min[a]);hi[a]=Math.max(hi[a],b.max[a]);
    const center=(b.min[a]+b.max[a])*.5;
    cmin[a]=Math.min(cmin[a],center);cmax[a]=Math.max(cmax[a],center);
   }
  }
  const node={box:{min:lo,max:hi}};bvhNodes++;
  if(ids.length<=12){node.faces=ids;bvhLeaves++;return node;}
  let axis=0;
  for(let a=1;a<3;a++)if(cmax[a]-cmin[a]>cmax[axis]-cmin[axis])axis=a;
  ids.sort((a,b)=>(bodyBoxes[a].min[axis]+bodyBoxes[a].max[axis])-
   (bodyBoxes[b].min[axis]+bodyBoxes[b].max[axis]));
  const mid=Math.floor(ids.length/2);
  node.left=build(ids.slice(0,mid));node.right=build(ids.slice(mid));
  return node;
 };
 const root=build(allIndices);
 const counts={
  CROSSING:0,COPLANAR_OVERLAP:0,TOUCHING:0,INDETERMINATE:0,NONE:0
 };
 let pairs=0,aabbPairs=0,firstContact=null,bodySwept=0,nodeVisits=0;
 for(let i=0;i<frontFaces.length;i++){
  const box=frontBoxes[i],stack=[root];
  while(stack.length){
   const node=stack.pop();nodeVisits++;
   if(!boxesOverlap(box,node.box))continue;
   if(node.faces){
    for(const j of node.faces){
     pairs++;
     if(pairs>maxPairs)throw Error('original-full-indexed-audit-resource-bound-reached '+
      JSON.stringify({bodyFaces:bodyFaces.length,photoFaces:frontFaces.length,
       broadphaseCandidatePairs:pairs,actualAABBOverlaps:aabbPairs,
       maxPairs,bvhNodes,visitedNodes:nodeVisits}));
     if(!boxesOverlap(box,bodyBoxes[j]))continue;
     aabbPairs++;
     if(aabbPairs>3000000)throw Error('original-full-indexed-exact-contact-resource-bound '+
      JSON.stringify({bodyFaces:bodyFaces.length,photoFaces:frontFaces.length,
       actualAABBOverlaps:aabbPairs,broadphaseCandidatePairs:pairs}));
     const result=classifyExactTriangleContact(frontFaces[i],bodyFaces[j]);
     counts[result]++;
     if(result!=='NONE'&&!firstContact)
      firstContact={frontFace:i,bodyFace:j,class:result};
    }
   }else{stack.push(node.left,node.right);}
  }
  bodySwept=i+1;
 }
 return {
  originalBodyIndexedFacesAudited:bodyFaces.length,
  originalPhotoFrontIndexedFacesAudited:frontFaces.length,
  fullOriginalIndexedScopeEvaluated:bodySwept===frontFaces.length,
  originalBodyFaceSubsetUsed:false,originalPhotoFaceSubsetUsed:false,
  fullBroadphaseUniqueCandidatePairs:pairs,
  actualAABBOverlappingPairs:aabbPairs,
  allOriginalBodyIndexedFacesPresentInBVH:true,
  originalBodyBVHNodes:bvhNodes,originalBodyBVHLeaves:bvhLeaves,
  completeSourceFrontBVHVisits:nodeVisits,
  classifications:counts,
  firstObservedContactFaceIndices:firstContact,
  strictGeometricContactObserved:counts.CROSSING+counts.COPLANAR_OVERLAP+counts.TOUCHING>0,
  unresolvedDegenerateOrNearParallelPairs:counts.INDETERMINATE,
  garmentPhysicalFitCertified:false,
  fullMotionSweepCertified:false,
  originalUnobservedRearCertified:false,
  familyAlpha:'HOLD'
 };
}
export function controlledFullContactFixtures(){
 const t=(a,b,c)=>[a,b,c],v=(x,y,z)=>[x,y,z];
 const base=t(v(-1,-1,0),v(1,-1,0),v(0,1,0));
 const cutting=t(v(0,-.25,-1),v(0,.25,1),v(0,.25,-1));
 const apart=t(v(4,4,1),v(5,4,1),v(4,5,1));
 const same=t(v(-1,-1,0),v(1,-1,0),v(0,1,0));
 const coplanarShift=t(v(-.2,-.2,0),v(1.1,-.2,0),v(.2,.7,0));
 const edgeTouch=t(v(-1,-1,0),v(1,-1,0),v(0,-2,0));
 const endpointTouch=t(v(0,1,0),v(0,1,1),v(1,2,1));
 const cases={
  crossing:classifyExactTriangleContact(base,cutting),
  separated:classifyExactTriangleContact(base,apart),
  identicalCoplanar:classifyExactTriangleContact(base,same),
  shiftedCoplanar:classifyExactTriangleContact(base,coplanarShift),
  sharedCoplanarEdge:classifyExactTriangleContact(base,edgeTouch),
  endpoint:classifyExactTriangleContact(base,endpointTouch),
  degenerate:classifyExactTriangleContact(base,t(v(0,0,0),v(0,0,0),v(0,0,0)))
 };
 const result=evaluateFullIndexedContact([base,apart],[cutting,same,edgeTouch]);
 return {cases,indexedResult:result};
}
