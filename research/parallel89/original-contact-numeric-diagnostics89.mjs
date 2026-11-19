/**
 * Independent, research-only numerical root-cause witness for M2 original
 * photographic front vs real posed 163-bone body triangle classifications.
 * Deliberately never certifies fit, clearance, mask approval or motion.
 */
const EPS=1e-7,AREA_FLOOR=EPS*EPS;
const finite=t=>Array.isArray(t)&&t.length===3&&t.every(p=>
 Array.isArray(p)&&p.length===3&&p.every(Number.isFinite));
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],
 a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=x=>Math.hypot(x[0],x[1],x[2]);
const magnitude=t=>length(cross(sub(t[1],t[0]),sub(t[2],t[0])));
const box=t=>{
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const p of t)for(let a=0;a<3;a++){
  lo[a]=Math.min(lo[a],p[a]);hi[a]=Math.max(hi[a],p[a]);
 }
 return [lo,hi];
};
const overlap=(a,b)=>![0,1,2].some(k=>a[0][k]>b[1][k]+EPS||
 a[1][k]+EPS<b[0][k]);
export function numericalContactReason(front,body){
 if(!finite(front)||!finite(body))return {reason:'NONFINITE_INPUT',ambiguous:true};
 const fa=magnitude(front),ba=magnitude(body);
 if(fa<AREA_FLOOR||ba<AREA_FLOOR)return {
  reason:fa<AREA_FLOOR&&ba<AREA_FLOOR?'BOTH_FACES_DEGENERATE':
   fa<AREA_FLOOR?'FRONT_FACE_DEGENERATE':'BODY_FACE_DEGENERATE',
  ambiguous:true,frontDoubleArea:fa,bodyDoubleArea:ba
 };
 const a=cross(sub(front[1],front[0]),sub(front[2],front[0])).map(x=>x/fa);
 const b=cross(sub(body[1],body[0]),sub(body[2],body[0])).map(x=>x/ba);
 const frontSigned=body.map(p=>dot(a,sub(p,front[0])));
 const bodySigned=front.map(p=>dot(b,sub(p,body[0])));
 const separated=v=>v.every(x=>x>EPS)||v.every(x=>x< -EPS);
 if(separated(frontSigned)||separated(bodySigned))return {
  reason:'CLEAR_BY_SEPARATING_FACE_PLANE',ambiguous:false,
  frontDoubleArea:fa,bodyDoubleArea:ba
 };
 const angle=length(cross(a,b));
 if(angle<=EPS){
  if(frontSigned.some(x=>Math.abs(x)>EPS*2)||
     bodySigned.some(x=>Math.abs(x)>EPS*2))
   return {reason:'NEAR_PARALLEL_OFFSET_UNRESOLVED',ambiguous:true,
    frontDoubleArea:fa,bodyDoubleArea:ba,normalCrossMagnitude:angle};
  return {reason:'COPLANAR_CANDIDATE',ambiguous:false,
   frontDoubleArea:fa,bodyDoubleArea:ba,normalCrossMagnitude:angle};
 }
 return {reason:'NONPARALLEL_CANDIDATE',ambiguous:false,
  frontDoubleArea:fa,bodyDoubleArea:ba,normalCrossMagnitude:angle};
}
export function auditOriginalContactNumerics(bodyFaces,frontFaces,
 {maxObservedPairs=512,prefixFront=12,distributedFront=12}={}){
 if(!Array.isArray(bodyFaces)||!Array.isArray(frontFaces)||
  !bodyFaces.length||!frontFaces.length)throw Error('actual-original-faces-required');
 if(!Number.isSafeInteger(maxObservedPairs)||maxObservedPairs<1||
   maxObservedPairs>8192)throw Error('bounded-numerical-diagnostic-required');
 const describe=faces=>{
  let degenerate=0,exactZero=0,min=Infinity,max=0,invalid=0;
  for(const t of faces){
   if(!finite(t)){invalid++;continue;}
   const area=magnitude(t);
   if(area<AREA_FLOOR)degenerate++;
   if(area===0)exactZero++;
   min=Math.min(min,area);max=Math.max(max,area);
  }
  return {actualIndexedFaces:faces.length,nonfiniteFaces:invalid,
   doubleAreaBelowOriginalThreshold:degenerate,
   exactZeroAreaFaces:exactZero,
   minimumDoubleArea:Number.isFinite(min)?min:null,
   maximumDoubleArea:max,
   originalDegeneracyThreshold:AREA_FLOOR};
 };
 const frontProfile=describe(frontFaces),bodyProfile=describe(bodyFaces);
 const bodyBoxes=bodyFaces.map(finite).every(Boolean)?bodyFaces.map(box):[];
 // No claim of contact if source/body are nonfinite. They are separately
 // reported and MUST keep all downstream clearance/refusal decisions blocked.
 const frontIndices=new Set();
 for(let i=0;i<Math.min(prefixFront,frontFaces.length);i++)frontIndices.add(i);
 for(let i=0;i<Math.min(distributedFront,frontFaces.length);i++)
  frontIndices.add(Math.floor((i+.5)*frontFaces.length/distributedFront));
 const reasons={},examples={},boundedFronts=[...frontIndices].sort((a,b)=>a-b);
 let observed=0,visitedFronts=0;
 if(bodyBoxes.length===bodyFaces.length){
  outer:for(const fi of boundedFronts){
   visitedFronts++;
   if(!finite(frontFaces[fi]))continue;
   const sourceBox=box(frontFaces[fi]);
   let observedThisFace=0;
   for(let bi=0;bi<bodyFaces.length;bi++){
    if(!overlap(sourceBox,bodyBoxes[bi]))continue;
    const x=numericalContactReason(frontFaces[fi],bodyFaces[bi]);
    reasons[x.reason]=(reasons[x.reason]||0)+1;
    if(!examples[x.reason])examples[x.reason]={
     sourceFrontFaceIndex:fi,originalBodyFaceIndex:bi,
     frontDoubleArea:x.frontDoubleArea??null,
     bodyDoubleArea:x.bodyDoubleArea??null,
     normalCrossMagnitude:x.normalCrossMagnitude??null};
    observed++;observedThisFace++;
    if(observed>=maxObservedPairs)break outer;
    if(observedThisFace>=32)break;
   }
  }
 }
 return {
  originalFrontFaceProfile:frontProfile,originalBodyFaceProfile:bodyProfile,
  auditedReasonCodes:reasons,firstReasonWitness:examples,
  originalFrontIndicesProposedForDiagnostics:boundedFronts,
  originalFrontIndicesActuallyVisited:visitedFronts,
  actualAABBOverlapPairsProfiled:observed,
  stoppedAtDiagnosticLimit:observed>=maxObservedPairs,
  diagnosticSamplesOnly:true,notFullIndexedPairCoverage:true,
  noActualOriginalSourcePhysicalScale:true,
  noCertifiedOriginalBodyClothCollisionClearance:true,
  noUnobservedRearOrClothDrapeProof:true,
  consumer3DAdmitted:false,sourceOriginalPhoto2DFallbackRequired:true,
  familyAlpha:'HOLD'
 };
}
export function controlledOriginalNumericReasonFixtures(){
 const a=[[0,0,0],[1,0,0],[0,1,0]];
 const z=a.map(p=>[p[0],p[1],.3]);
 const small=[[0,0,0],[1e-10,0,0],[0,1e-10,0]];
 const crossing=[[.25,.25,-1],[.25,.25,1],[.5,.25,0]];
 const collinear=[[0,0,0],[1,1,1],[2,2,2]];
 return {
  realCrossingCandidate:numericalContactReason(a,crossing).reason,
  parallelOffset:numericalContactReason(a,z).reason,
  tinyRealisticFace:numericalContactReason(a,small).reason,
  zeroArea:numericalContactReason(a,collinear).reason,
  nonfinite:numericalContactReason(a,[[0,0,0],[Infinity,0,0],[0,1,0]]).reason
 };
}
