/**
 * P89 163-bone source: ORIGINAL unmodified GLB's hypothetical UV/index
 * seam loops cannot prove a human exterior merely by forming simple rings.
 * Audit intersection, nesting, and the original photographed SKIRT CENTER
 * (not a certified anatomical interior marker). Returns bounded aggregates
 * only; never owner photos or model coordinates.
 */
import {auditVirtualContourPlanarity89} from './skirt-virtual-loop-planarity89.mjs';
const tol=1e-7, finite=Number.isFinite;
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-
 (b[1]-a[1])*(c[0]-a[0]);
const range=(x,a,b,t)=>x>=Math.min(a,b)-t&&x<=Math.max(a,b)+t;
const on=(p,a,b)=>{
 const len=dist(a,b);
 if(len<=tol)return dist(p,a)<=tol;
 return Math.abs(cross(a,b,p))/len<=tol&&
  range(p[0],a[0],b[0],tol)&&range(p[1],a[1],b[1],tol);
};
const hit=(a,b,c,d)=>{
 const abC=cross(a,b,c),abD=cross(a,b,d),
  cdA=cross(c,d,a),cdB=cross(c,d,b);
 if(abC*abD<0&&cdA*cdB<0&&
  Math.abs(abC)>1e-14&&Math.abs(abD)>1e-14&&
  Math.abs(cdA)>1e-14&&Math.abs(cdB)>1e-14)return true;
 return on(c,a,b)||on(d,a,b)||on(a,c,d)||on(b,c,d);
};
function normalize(points){
 const out=[];
 for(const p of points)if(!out.length||dist(out.at(-1),p)>tol)
  out.push([p[0],p[1]]);
 if(out.length>1&&dist(out[0],out.at(-1))<=tol)out.pop();
 return out;
}
function relation(p,loop){
 let inside=false;
 for(let i=0,j=loop.length-1;i<loop.length;j=i++){
  const a=loop[j],b=loop[i];
  if(on(p,a,b))return 'ON_EDGE';
  if((a[1]>p[1])!==(b[1]>p[1])&&
   p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])
   inside=!inside;
 }
 return inside?'INSIDE':'OUTSIDE';
}
function intersectLoops(a,b){
 for(let i=0;i<a.length;i++){
  const x=a[i],y=a[(i+1)%a.length];
  for(let j=0;j<b.length;j++){
   if(hit(x,y,b[j],b[(j+1)%b.length]))return true;
  }
 }
 return false;
}
export function auditVirtualContourArrangement89(contours,sourceSkirtCenter){
 if(!Array.isArray(contours)||contours.length>48||
  !Array.isArray(sourceSkirtCenter)||sourceSkirtCenter.length!==2||
  sourceSkirtCenter.some(x=>!finite(x)||Math.abs(x)>1e6))
  throw Error('bounded-original-source-skirt-center-and-counterfactual-loops-required');
 let totalVertices=0,ccw=0,cw=0;
 const loops=[];
 for(const points of contours){
  if(!Array.isArray(points)||points.length>4096||
   (totalVertices+=points.length)>12000)
   throw Error('counterfactual-source-loop-size-unbounded');
  const report=auditVirtualContourPlanarity89(points);
  if(report.classification!=='SIMPLE_NONZERO_AREA')
   throw Error('source-hypothetical-loop-not-planar-simple');
  loops.push(normalize(points));
  if(report.signedArea>0)ccw++;else cw++;
 }
 const center={INSIDE:0,OUTSIDE:0,ON_EDGE:0};
 for(const loop of loops)center[relation(sourceSkirtCenter,loop)]++;
 let intersects=0,nested=0,disjoint=0;
 for(let i=0;i<loops.length;i++)for(let j=i+1;j<loops.length;j++){
  const a=loops[i],b=loops[j];
  if(intersectLoops(a,b)){intersects++;continue;}
  const bInA=relation(b[0],a)==='INSIDE',
   aInB=relation(a[0],b)==='INSIDE';
  if(bInA&&aInB)
   throw Error('counterfactual-source-loop-impossible-mutual-containment');
  if(bInA||aInB)nested++;else disjoint++;
 }
 // n=0 must yield +0: -0 violates strict conservative source receipts.
 const n=loops.length,pairs=n<2?0:n*(n-1)/2;
 if(center.INSIDE+center.OUTSIDE+center.ON_EDGE!==n||
  intersects+nested+disjoint!==pairs||cw+ccw!==n)
  throw Error('counterfactual-source-loop-arrangement-nonconservative');
 return Object.freeze({
  schema:'P89-genuine-source-virtual-seam-2d-arrangement/v1',
  classification:'COUNTERFACTUAL_2D_CONTOUR_RELATIONS_NOT_BODY_EXTERIOR',
  simpleVirtualIndexLoopCount:n,
  sourceRingCenterInsideCandidateLoops:center.INSIDE,
  sourceRingCenterOutsideCandidateLoops:center.OUTSIDE,
  sourceRingCenterOnCandidateBoundary:center.ON_EDGE,
  loopPairCount:pairs,intersectingOrTouchingLoopPairs:intersects,
  containedNestedLoopPairs:nested,disjointLoopPairs:disjoint,
  counterclockwiseCandidateLoops:ccw,clockwiseCandidateLoops:cw,
  uniqueSourceRingCenterEnclosingCandidateOnly:
   n>0&&center.INSIDE===1&&center.ON_EDGE===0&&intersects===0,
  originalSourceIndexedBodyExteriorProven:false,
  sourceSkirtCenterNotAnatomicalInteriorProof:true,
  originalUnobservedSkirtSpokeDirectionsUnresolved:true,
  sealedSigned3DBodyProven:false,
  measuredPhysicalGarmentFitProven:false,
  releaseAuthorized:false,consumer3DAdmitted:false,
  originalPhoto2DFallbackRequired:true
 });
}
