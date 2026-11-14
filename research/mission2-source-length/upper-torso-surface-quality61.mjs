/**
 * Mission 2 C61 - original public-photograph 163-bone garment temporary
 * 6mm torso proposal source-face strain/normal diagnostic. Read-only.
 *
 * Run on original world-coordinate photo source BEFORE and AFTER the
 * disposable C60 candidate (never on modified garment/owner attributes).
 * Aggregate counts only: no individual triangle, UV, XYZ, photo pixel,
 * source face ID, or body pose matrix escapes.
 * Browser-compatible: no Node APIs or external imports.
 */
const fail=msg=>{throw Error('M2 C61 original photographed cloth source '+msg);};
const vec=(a,i)=>[a[3*i],a[3*i+1],a[3*i+2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a,b)=>[
 a[1]*b[2]-a[2]*b[1],
 a[2]*b[0]-a[0]*b[2],
 a[0]*b[1]-a[1]*b[0]
];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const len=v=>Math.hypot(...v);
export function measureDisposableSourceSurfaceStrain61(
 originalWorld,trialWorld,indices=null
){
 if(!(originalWorld instanceof Float32Array)||
    !(trialWorld instanceof Float32Array)||
    originalWorld.length!==trialWorld.length||
    originalWorld.length<9||originalWorld.length%3!==0||
    indices!==null&&!(indices instanceof Uint16Array||
     indices instanceof Uint32Array))
  fail('same signed source and disposable world buffer shape required');
 const vertices=originalWorld.length/3;
 const n=indices?.length??vertices;
 if(n<3||n%3!==0||n/3>100000||
    (indices&&Array.from(indices).some(x=>x>=vertices)))
  fail('original garment complete source triangles and valid indices required');
 for(const v of [originalWorld,trialWorld])
  if(!v.every(Number.isFinite))fail('nonfinite original photo-linked face');
 let maxEdgeStrain=0,maxNormalTurnDegrees=0,maxAreaFraction=0,
  normalFlipped=0,over2PercentEdge=0,over5PercentEdge=0,
  over10DegreeNormals=0,over10PercentArea=0,changedFaces=0,
  degenerateOrCollapsed=0;
 for(let f=0;f<n/3;f++){
  const ids=[0,1,2].map(k=>indices?indices[3*f+k]:3*f+k);
  const before=ids.map(i=>vec(originalWorld,i));
  const after=ids.map(i=>vec(trialWorld,i));
  const e0=[sub(before[1],before[0]),sub(before[2],before[1]),
   sub(before[0],before[2])];
  const e1=[sub(after[1],after[0]),sub(after[2],after[1]),
   sub(after[0],after[2])];
  const oldN=cross(e0[0],sub(before[2],before[0])),
   newN=cross(e1[0],sub(after[2],after[0]));
  const area0=len(oldN),area1=len(newN);
  if(area0<=1e-12||area1<=1e-12){
   degenerateOrCollapsed++;
   continue;
  }
  const dotNormalized=dot(oldN,newN)/(area0*area1);
  const angle=Math.acos(Math.min(1,Math.max(-1,dotNormalized)))*180/Math.PI;
  const areaDelta=Math.abs(area1/area0-1);
  const maxStrain=Math.max(...e0.map((edge,k)=>{
   const oldLen=len(edge),newLen=len(e1[k]);
   if(oldLen<=1e-12)fail('degenerate original photographed source edge');
   return Math.abs(newLen/oldLen-1);
  }));
  maxEdgeStrain=Math.max(maxEdgeStrain,maxStrain);
  maxNormalTurnDegrees=Math.max(maxNormalTurnDegrees,angle);
  maxAreaFraction=Math.max(maxAreaFraction,areaDelta);
  if(dotNormalized<0)normalFlipped++;
  if(maxStrain>.02)over2PercentEdge++;
  if(maxStrain>.05)over5PercentEdge++;
  if(angle>10)over10DegreeNormals++;
  if(areaDelta>.10)over10PercentArea++;
  if(ids.some(id=>Array.from({length:3},(_,k)=>
   originalWorld[3*id+k]!==trialWorld[3*id+k]).some(Boolean)))
   changedFaces++;
 }
 const allFaces=n/3;
 return Object.freeze({
  schema:'M2-C61-disposable-original-photo-source-triangle-strain',
  signedOriginalSourceFacesAnalyzed:allFaces,
  sourceFacesWithTemporaryPositionDifferences:changedFaces,
  facesWithMaxEdgeStrainAbove2Percent:over2PercentEdge,
  facesWithMaxEdgeStrainAbove5Percent:over5PercentEdge,
  facesWithNormalTurnAbove10Degrees:over10DegreeNormals,
  facesWithAreaChangeAbove10Percent:over10PercentArea,
  facesWithReversedOrientation:normalFlipped,
  sourceFacesDegenerateOrCollapsed:degenerateOrCollapsed,
  maxOriginalPhotoWorldEdgeRelativeStrain:maxEdgeStrain,
  maxOriginalPhotoFaceNormalTurnDegrees:maxNormalTurnDegrees,
  maxOriginalPhotoFaceAreaRelativeChange:maxAreaFraction,
  provisionalMeshDistortionGuardPassed:
   degenerateOrCollapsed===0&&normalFlipped===0&&
   over5PercentEdge===0&&over10DegreeNormals===0&&
   over10PercentArea===0,
  originalPhotoTextureRestUVAndSkinNeverEdited:true,
  sourceFaceLocationsOrIdentifiersWithheld:true,
  noActualRenderedPhotorealismOrFabricPhysicsCertificate:true,
  candidateNotAllowedInConsumer3D:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
