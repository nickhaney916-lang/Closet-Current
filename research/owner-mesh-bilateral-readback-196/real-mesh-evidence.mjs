/**
 * Closet Current MAIN P196 — real staged skinned-mesh geometry witness.
 *
 * P195 proved source-bound distinct owner alpha edges and calculated a
 * sample physical asymmetry; it did not independently compare actual old
 * versus new BufferAttribute vertices for the torso AND both sewn caps.
 *
 * This accepts ONLY actual arrays staged by P190, before any atomic mesh
 * mutation, with the exact current P195 source and owner PNG SHA. It never
 * handles original owner pixels and cannot certify garment realism.
 */
const SRC='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const HEX=/^[0-9a-f]{64}$/;
const fail=x=>{throw Error('P196 '+x);};
const validArray=x=>x instanceof Float32Array||x instanceof Float64Array;
const finite=x=>Number.isFinite(x);
const round=x=>Math.round(x*1e8)/1e8;
export function verifyPhysicalBilateralMesh196({
 panels,profile,sourceSHA256,ownerMaskSHA256
}={}){
 if(sourceSHA256!==SRC||profile?.sourceSHA256!==SRC||
    !HEX.test(ownerMaskSHA256||'')||
    profile?.ownerMaskSHA256!==ownerMaskSHA256||
    profile?.maskSHA256!==ownerMaskSHA256||
    profile?.ownerMaskTopologyVerified191!==true||
    profile?.ownerBilateralContourMeasured195!==true||
    !Array.isArray(profile.leftRatioBands195)||
    !Array.isArray(profile.rightRatioBands195)||
    !Array.isArray(panels)||panels.length<3)
  fail('genuine current source and independently SHA-bound P195 side profile plus staged 163-bone meshes required');
 let torso=0,left=0,right=0,capL=0,capR=0;
 let sumL=0,sumR=0,ratioL=0,ratioR=0;
 let maxLeft=0,maxRight=0,capMaxL=0,capMaxR=0;
 let shapeCells=0;
 const roles=new Set();
 for(const row of panels){
  const mesh=row?.mesh,p=row?.p,panel=row?.panel;
  const planned=row?.positions,staged=row?.pan;
  const side=mesh?.userData?.work45IndependentShoulderCap;
  const role=mesh?.name==='Work56-independent-shirt-shell'?'torso':
   side==='L'?'cap-L':side==='R'?'cap-R':null;
  if(!role||mesh?.isSkinnedMesh!==true||
     mesh?.skeleton?.bones?.length!==163||
     !p||!panel||!Number.isInteger(p.count)||p.count<100||
     panel.count!==p.count||
     !validArray(p.array)||!validArray(panel.array)||
     !validArray(planned)||!validArray(staged)||
     planned.length!==p.count*3||staged.length!==p.count*3||
     p.array.length!==planned.length||panel.array.length!==staged.length)
   fail('real distinct torso and both 163-bone shoulder-cap vertex buffers required');
  // The real source blouse can have more than one sewn panel per cap side.
  // Count every real panel but require both cap roles and the actual torso.
  roles.add(role);
  for(let i=0;i<p.count;i++){
   const k=i*3,x=panel.array[k],dx=staged[k]-x;
   const vx=planned[k]-p.array[k],vy=planned[k+1]-p.array[k+1],
    vz=planned[k+2]-p.array[k+2];
   if(![x,dx,vx,vy,vz,staged[k],staged[k+1],staged[k+2],
        planned[k],planned[k+1],planned[k+2]].every(finite))
    fail('nonfinite actual source or staged physical vertex');
   if(Math.abs(dx)<.0001)continue;
   shapeCells++;
   const euclidean=Math.hypot(vx,vy,vz);
   // Counts or predicted shifts do not establish a real skinned vertex:
   // the staged physical position must actually move in 3D.
   if(euclidean<.000025||euclidean>.03)
    fail('calculated source edge changed but actual skinned mesh vertex did not');
   if(role==='torso')torso++;
   else if(role==='cap-L'){capL++;capMaxL=Math.max(capMaxL,euclidean);}
   else {capR++;capMaxR=Math.max(capMaxR,euclidean);}
   if(Math.abs(x)<.025)continue;
   const contraction=-dx/x;
   if(!finite(contraction)||contraction<-.03||contraction>.14)
    fail('unexpected expanding/skewed owner source edge not physically supported');
   if(x<0){left++;sumL+=contraction;ratioL++;maxLeft=Math.max(maxLeft,euclidean);}
   else {right++;sumR+=contraction;ratioR++;maxRight=Math.max(maxRight,euclidean);}
  }
 }
 const meanL=sumL/ratioL,meanR=sumR/ratioR;
 const difference=Math.abs(meanL-meanR);
 if(!['torso','cap-L','cap-R'].every(v=>roles.has(v))||
    torso<20||capL<1||capR<1||left<20||right<20||
    !finite(difference)||difference<.001||
    meanL<.0005||meanR<.0005||
    maxLeft<.0001||maxRight<.0001||
    capMaxL<.0001||capMaxR<.0001)
  fail('original 163-bone shell and both caps lack independently measured unequal side deformation');
 return Object.freeze({
  ownerPhysicalBilateralReadbackVerified196:true,
  sourceSHA256:SRC,ownerMaskSHA256,
  ownerTorsoReadbackMovedVertices196:torso,
  ownerLeftReadbackMovedVertices196:left,
  ownerRightReadbackMovedVertices196:right,
  ownerLeftCapReadbackMovedVertices196:capL,
  ownerRightCapReadbackMovedVertices196:capR,
  ownerLeftMeanRelativeContraction196:round(meanL),
  ownerRightMeanRelativeContraction196:round(meanR),
  ownerMeasuredBilateralRatioDifference196:round(difference),
  ownerLeftPhysicalMaxMoveMeters196:round(maxLeft),
  ownerRightPhysicalMaxMoveMeters196:round(maxRight),
  ownerLShoulderPhysicalMaxMoveMeters196:round(capMaxL),
  ownerRShoulderPhysicalMaxMoveMeters196:round(capMaxR),
  sampledActualSourcePanelVertices196:shapeCells,
  sourcePinnedBlouseOnly:true,
  humanGarmentSegmentationVerified:false,
  independentlyPhotographedBack:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
