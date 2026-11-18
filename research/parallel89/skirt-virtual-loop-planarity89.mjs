/**
 * Mission 2 / P89: geometrical disqualification of purely HYPOTHETICAL
 * original-UV-seam 2D loops. These are NOT stitched original GLB indices,
 * signed human volume, physically measured garment size or 3D fit.
 * Caller retains all original 163-bone model/source material unchanged.
 */
const coordTol=1e-7;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-
 (b[1]-a[1])*(c[0]-a[0]);
const inRange=(v,a,b,t)=>v>=Math.min(a,b)-t&&v<=Math.max(a,b)+t;

function intersectsInclusive(a,b,c,d,areaTol,linearTol){
 const abC=cross(a,b,c),abD=cross(a,b,d),
  cdA=cross(c,d,a),cdB=cross(c,d,b);
 if(abC*abD<0&&cdA*cdB<0&&
  Math.abs(abC)>areaTol&&Math.abs(abD)>areaTol&&
  Math.abs(cdA)>areaTol&&Math.abs(cdB)>areaTol)return true;
 const on=(p,u,v)=>
  Math.abs(cross(u,v,p))<=areaTol&&
  inRange(p[0],u[0],v[0],linearTol)&&
  inRange(p[1],u[1],v[1],linearTol);
 return on(c,a,b)||on(d,a,b)||on(a,c,d)||on(b,c,d);
}

export function auditVirtualContourPlanarity89(points){
 if(!Array.isArray(points)||points.length<3||points.length>4096||
  points.some(p=>!Array.isArray(p)||p.length!==2||
   !p.every(Number.isFinite)||p.some(x=>Math.abs(x)>1e6)))
  throw Error('bounded-finite-original-virtual-contour-points-required');
 // Only adjacent exact-position virtual twin endpoints are collapsed.
 // Do not remove non-adjacent coincidences: those are self-touching.
 const vertices=[];
 for(const p of points)if(!vertices.length||
  distance(vertices[vertices.length-1],p)>coordTol)
  vertices.push([p[0],p[1]]);
 if(vertices.length>1&&distance(vertices[0],vertices.at(-1))<=coordTol)
  vertices.pop();
 const result=(classification,signedArea=0)=>Object.freeze({
  schema:'P89-counterfactual-virtual-loop-2d-planarity/v1',
  classification,signedArea,
  originalIndexedGLBModified:false,
  hypotheticalVirtualSeamOnly:true,
  sourceBodySignedVolumeCertified:false,
  continuousGarmentContactProven:false,
  consumer3DAdmitted:false,
  originalPhoto2DFallbackRequired:true
 });
 if(vertices.length<3)return result('DEGENERATE_ZERO_AREA');
 const xmin=Math.min(...vertices.map(p=>p[0])),
  xmax=Math.max(...vertices.map(p=>p[0])),
  ymin=Math.min(...vertices.map(p=>p[1])),
  ymax=Math.max(...vertices.map(p=>p[1])),
  scale=Math.max(xmax-xmin,ymax-ymin,1e-5),
  areaTol=Math.max(1e-15,scale*scale*1e-10),
  linearTol=Math.max(1e-9,scale*1e-10);
 let twiceArea=0;
 const n=vertices.length;
 for(let i=0;i<n;i++){
  const a=vertices[i],b=vertices[(i+1)%n];
  if(distance(a,b)<=coordTol)return result('DEGENERATE_ZERO_AREA');
  twiceArea+=a[0]*b[1]-b[0]*a[1];
 }
 // Test intersection BEFORE zero-area classification. A bow-tie loop
 // has zero signed area but its real failure is self-crossing.
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
  if(j===i+1||(i===0&&j===n-1))continue;
  const a=vertices[i],b=vertices[(i+1)%n],
   c=vertices[j],d=vertices[(j+1)%n];
  if(intersectsInclusive(a,b,c,d,areaTol,linearTol))
   return result('SELF_CROSSING_OR_TOUCHING');
 }
 const area=twiceArea/2;
 if(Math.abs(area)<=areaTol)return result('DEGENERATE_ZERO_AREA');
 return result('SIMPLE_NONZERO_AREA',area);
}
