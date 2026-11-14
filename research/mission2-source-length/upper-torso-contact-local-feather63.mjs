/**
 * M2 C63: source-only temporary, local corrective radial field centered
 * at ACTUALLY strict-crossing cloth triangle source vertex positions.
 * This module never exposes source triangle IDs, UV/XYZ, JPEG or owner data.
 * Imported by Chromium; no Node API; original source mesh is NOT changed.
 */
const bad=x=>{throw Error('M2 C63 authenticated photographed source contact '+x);};
const smooth=t=>{const k=Math.max(0,Math.min(1,t));return k*k*(3-2*k);};
export const LOCAL_TRIALS63=Object.freeze([
 Object.freeze({boostMeters:.002,radiusMeters:.25}),
 Object.freeze({boostMeters:.004,radiusMeters:.45}),
 Object.freeze({boostMeters:.004,radiusMeters:.75})
]);
export function makeSourceOnlyLocalContactTrial63({
 originalWorld,base2mmWorld,indices=null,
 originalCrossingClothFaceIds,spine,boostMeters,radiusMeters
}={}){
 if(!(originalWorld instanceof Float32Array)||
    !(base2mmWorld instanceof Float32Array)||
    originalWorld.length!==base2mmWorld.length||
    originalWorld.length<9||originalWorld.length%3!==0||
    !(originalCrossingClothFaceIds instanceof Set)||
    originalCrossingClothFaceIds.size<1||
    originalCrossingClothFaceIds.size>4000||
    !(Array.isArray(spine)&&spine.length===3&&spine.every(Number.isFinite))||
    !Number.isFinite(boostMeters)||boostMeters<=0||boostMeters>.004||
    !Number.isFinite(radiusMeters)||radiusMeters<.08||radiusMeters>.9||
    (indices!==null&&!(indices instanceof Uint16Array||
      indices instanceof Uint32Array)))
  bad('complete source 2mm intersecting faces and bounded local original body trial required');
 const before=originalWorld.slice(),base=base2mmWorld.slice();
 const faces=(indices?.length??base.length/3)/3,
  n=base.length/3,sourceFaceVertices=[];
 if(!Number.isSafeInteger(faces)||faces<1||faces>100000||
    (indices&&indices.length%3!==0))bad('original full triangulated source required');
 for(const f of originalCrossingClothFaceIds){
  if(!Number.isSafeInteger(f)||f<0||f>=faces)
   bad('strictly crossed authentic original triangle reference invalid');
  for(let k=0;k<3;k++){
   const v=indices?indices[3*f+k]:3*f+k;
   if(v<0||v>=n||!Number.isSafeInteger(v))
    bad('original skinned triangle source vertex invalid');
   sourceFaceVertices.push(v);
  }
 }
 const targetIds=[...new Set(sourceFaceVertices)];
 const centers=targetIds.map(i=>
  [base[3*i],base[3*i+1],base[3*i+2]]);
 if(!centers.every(v=>v.every(Number.isFinite))||
    !before.every(Number.isFinite)||!base.every(Number.isFinite))
  bad('original photo source and actual photographed cloth intersection finite XYZ required');
 const result=base.slice();
 let changed=0,maxExtra=0,maxOriginalDisplacement=0;
 const radiusSquared=radiusMeters*radiusMeters;
 for(let i=0;i<n;i++){
  const j=3*i,x=base[j],y=base[j+1],z=base[j+2];
  let nearestSquared=Infinity;
  for(const p of centers){
   const d=(p[0]-x)**2+(p[1]-y)**2+(p[2]-z)**2;
   if(d<nearestSquared)nearestSquared=d;
  }
  if(nearestSquared>=radiusSquared)continue;
  const r=Math.hypot(x-spine[0],z-spine[2]);
  if(r<=1e-8)continue;
  const added=boostMeters*(1-smooth(Math.sqrt(nearestSquared)/radiusMeters));
  const nx=Math.fround(x+(x-spine[0])/r*added),
   nz=Math.fround(z+(z-spine[2])/r*added);
  const d=Math.hypot(nx-x,nz-z);
  if(d>boostMeters+2e-6)bad('local world position exceeds 4mm additional displacement bound');
  if(d>1e-8)changed++;
  maxExtra=Math.max(d,maxExtra);
  result[j]=nx;result[j+2]=nz;
  maxOriginalDisplacement=Math.max(maxOriginalDisplacement,
   Math.hypot(nx-originalWorld[j],y-originalWorld[j+1],nz-originalWorld[j+2]));
 }
 if(!originalWorld.every((v,i)=>v===before[i])||
    !base2mmWorld.every((v,i)=>v===base[i]))
  bad('original source or accepted source-2mm world baseline mutated');
 if(maxOriginalDisplacement>.006002)
  bad('all source 6mm total world displacement bound exceeded');
 return Object.freeze({
  proposalWorld:result,
  strictSourceClothTriangleCount:originalCrossingClothFaceIds.size,
  actualUniqueWorldTargetVertexReferences:targetIds.length,
  affectedVertexReferences:changed,
  maximumAdditionalWorldDisplacementMeters:maxExtra,
  maximumOriginalWorldDisplacementMeters:maxOriginalDisplacement,
  boostMeters,radiusMeters,
  originalSourcePhotoClothAnd2mmBaselineBuffersUnchanged:true,
  noActualGarmentGeometryOrPhotoUVOrSkinWritten:true,
  rawWorldCoordinatesAndSourceClothFaceIdsNotExported:true,
  candidateNotRenderedOrHumanPhotorealismApproved:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
