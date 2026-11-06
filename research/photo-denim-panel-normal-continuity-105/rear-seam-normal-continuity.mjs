/**
 * PHOTO105 — stitch source-neutral photographed-denim REAR shading normals
 * along physically coincident skinned garment triangle vertices.
 *
 * Real source-photographed front stays untouched: never write source JPEG,
 * original UVs, immutable rest, skin indices/weights, normals on visible
 * front, or coordinates. No invented rear photograph; no cloth physics.
 *
 * Runs AFTER PHOTO104 safe actual pose-conditioned geometry and P77 sampled
 * body-triangle contact check. Corrects only the source-neutral rear where
 * independently sewn triangle patches share their original 3D position.
 */
import * as T from 'three';
const ATTRS=['position','pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const FIRST='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
const SECOND='aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a';
const fail=msg=>{throw Error('PHOTO105 '+msg);};
const rounded=v=>Math.round(v*100000); // same real-source sewn vertex, 10 micron scale
const key=(a,i)=>[rounded(a.getX(i)),rounded(a.getY(i)),rounded(a.getZ(i))].join(':');
export const sourceRearNormalSpread105=(ids,n)=>{
 const out=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3();
 for(const i of ids)out.add(a.fromBufferAttribute(n,i));
 const length=out.length();
 if(length<.00001||!Number.isFinite(length))return {target:null,loss:Infinity};
 out.divideScalar(length);
 let loss=0;
 for(const i of ids){
  b.fromBufferAttribute(n,i);
  if(b.lengthSq()<.00001||!b.toArray().every(Number.isFinite))
   return {target:null,loss:Infinity};
  b.normalize();
  loss+=Math.max(0,1-b.dot(out));
 }
 return {target:out.clone(),loss};
};
export function smoothActualPhotoDenimPanelNormals105(pants,{maxAngleDegrees=75}={}){
 if(typeof maxAngleDegrees!=='number'||!Number.isFinite(maxAngleDegrees)||
  maxAngleDegrees<10||maxAngleDegrees>85)
  fail('allowed coincident rear seam angle 10..85 deg required');
 const mesh=pants?.meshes?.[0],g=mesh?.geometry;
 const pos=g?.getAttribute('position'),norm=g?.getAttribute('normal'),
  front=g?.getAttribute('pantsSourceFront');
 if(pants?.meshes?.length!==1||!mesh?.isSkinnedMesh||
  mesh.skeleton?.bones?.length!==163||
  !pants.stats?.poseResponsiveDenim104||
  !pants.stats?.originalDenimFrontSourceAndSkinProtected104||
  !pants.stats?.originalPhotoUVRestFrontSkinPositionsBytePreserved77||
  !pants.stats?.sampledPhotoDenimKnee103||
  !pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
  ![FIRST,SECOND].includes(pants.stats?.sourceSHA256)||
  !pos||!norm||!front||pos.count<400||
  norm.count!==pos.count||
  ATTRS.some(field=>g.getAttribute(field)?.count!==pos.count))
  fail('exact source-SHA-verified original CC0 163-bone PHOTO104 garment required');
 const protectedData=new Map(ATTRS.map(n=>[n,g.getAttribute(n).array.slice()]));
 const knees=pants.stats.landmarks?.map(k=>new T.Vector3(...k.knee));
 const angles=pants.stats.real163BoneSampledKnee103;
 if(knees?.length!==2||knees.some(k=>!k.toArray().every(Number.isFinite))||
  !angles||![angles.leftDegrees,angles.rightDegrees].every(v=>
   typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=16))
  fail('genuine SHA-verified source anatomical knee positions and bounded actual P103 poses required');
 // Source-rest 0° requires NO additional rear shading, exactly matching the
 // approved source photograph/render; no invented decorative crease at rest.
 const hasKneeFlex=angles.leftDegrees>0||angles.rightDegrees>0;
 mesh.updateWorldMatrix(true,false);
 const originalNormals=norm.array.slice();
 const groups=new Map();
 for(let i=0;i<pos.count;i++){
  const id=key(pos,i);
  if(!groups.has(id))groups.set(id,{ids:[],maxFront:0});
  const node=groups.get(id);
  node.ids.push(i);
  node.maxFront=Math.max(node.maxFront,front.getX(i));
 }
 const threshold=Math.cos(T.MathUtils.degToRad(maxAngleDegrees));
 const clamp=T.MathUtils.clamp;
 const normalX=new T.Vector3(),normalY=new T.Vector3();
 let accepted=0,changed=0,skippedFront=0,skippedUnmatched=0,
  rejectedHardEdges=0,energyBefore=0,energyAfter=0,
  peakChangedNormal=0,sourceKneeProfileGroups105=0;
 const left=new T.Vector3();
 const right=new T.Vector3();
 try{
  for(const node of groups.values()){
   if(node.maxFront>=.16){skippedFront+=node.ids.length;continue;}
   if(node.ids.length<2)skippedUnmatched++; // Still shade real single rear triangles; paired seams share one normal.
   if(!hasKneeFlex)continue;
   const before=sourceRearNormalSpread105(node.ids,norm);
   if(!before.target)continue;
   const q=normalX.fromBufferAttribute(pos,node.ids[0]).applyMatrix4(mesh.matrixWorld);
   const side=q.x>=0?0:1,landmark=knees[side],
    degrees=side===0?angles.leftDegrees:angles.rightDegrees;
   const across=q.x-landmark.x,dy=q.y-landmark.y;
   // Only the actual unphotographed neutral rear near the anatomical knee.
   // Its SOURCE front photo and even the side seam stay unmodified. The
   // shaping is conditioned by actual source-verified P104 bent knee geometry,
   // not invented rear-camera texture or a fake source photograph.
   if(!degrees||Math.abs(across)>.24||dy<-.16||dy>.085||
      q.z>landmark.z+.055)continue;
   const rear=clamp((landmark.z+.055-q.z)/.16,0,1);
   const ridge=Math.exp(-.5*((dy+.026)/.076)**2);
   const taper=clamp((.16-node.maxFront)/.16,0,1);
   const bend=Math.sin(T.MathUtils.degToRad(degrees)*Math.PI/(2*T.MathUtils.degToRad(16)));
   const influence=rear*ridge*taper*bend;
   if(influence<.06)continue;
   // At most ~7° gentle normal-only relief. No position, UV, image or
   // anatomical skinning deformation; this complements P104's real folds.
   const phase=(dy+.026)*13+across*3.2;
   const dx=clamp(.042*influence*Math.cos(phase),-.05,.05);
   const dyNormal=clamp(.10*influence*Math.sin(phase),-.11,.11);
   if(Math.hypot(dx,dyNormal)<.001)continue;
   // Avoid merging fundamentally different opposing/material-seam normal
   // orientations: preserve deliberate >75° hard edges on sewn rear shell.
   const valid=node.ids.every(i=>{
    const dot=left.fromBufferAttribute(norm,i).normalize().dot(before.target);
    return dot>=threshold;
   });
   if(!valid){rejectedHardEdges++;continue;}
   // All coincident rear triangles get the SAME bounded normal. This
   // preserves their already-good seam consistency while reshaping the
   // lighting along measured SOURCE knee fabric folds.
   const copy=before.target.clone().add(normalY.set(dx,dyNormal,0)).normalize();
   if(copy.distanceTo(before.target)>.14)
    fail('PHOTO105 neutral rear shading normal tilt exceeded fourteen percent');
   sourceKneeProfileGroups105++;
   for(const i of node.ids){
    const old=right.fromBufferAttribute(norm,i);
    const change=old.distanceTo(copy);
    if(change>.00001){
     norm.setXYZ(i,copy.x,copy.y,copy.z);
     changed++;
     peakChangedNormal=Math.max(peakChangedNormal,change);
    }
   }
   accepted++;
   energyBefore+=before.loss;
   const after=sourceRearNormalSpread105(node.ids,norm);
   energyAfter+=after.loss;
  }
  if(!Number.isFinite(energyBefore)||!Number.isFinite(energyAfter)||
   energyAfter>energyBefore+.00005)
   fail('real same-position rear panel normals became less consistent '+JSON.stringify({energyBefore,energyAfter}));
  if(hasKneeFlex&&(changed<8||accepted<3||sourceKneeProfileGroups105<3||peakChangedNormal<.001))
   fail('genuine original source knee flex gave no measurable rear shading response '+JSON.stringify({
    changed,accepted,sourceKneeProfileGroups105,peakChangedNormal,
    skippedFront,rejectedHardEdges
   }));
  if(!hasKneeFlex&&(changed!==0||accepted!==0))
   fail('source straight knee must never receive artificial new fabric lighting');
  norm.needsUpdate=true;
  for(const [name,expected] of protectedData){
   const actual=g.getAttribute(name)?.array;
   if(!actual||actual.length!==expected.length||
    !actual.every((v,i)=>v===expected[i]))
    fail('source photo/rest/UV/source-front/skin changed while smoothing normals: '+name);
  }
  // Every original photographed front vertex's normal must be EXACTLY its
  // inherited PHOTO104 value; not just texture bytes. No front smoothing.
  for(let i=0;i<pos.count;i++)if(front.getX(i)>=.16)
   for(let axis=0;axis<3;axis++)
    if(norm.array[i*3+axis]!==originalNormals[i*3+axis])
     fail('original photographed front lighting normal changed');
  return {...pants,stats:{...pants.stats,
   originalPhotographedDenimNormalContinuity105:true,
   rearSourceNeutralSeamGroupsSmoothed105:accepted,
   rearSourceNeutralNormalsAdjusted105:changed,
   rearSourceNeutralNormalVarianceBefore105:energyBefore,
   rearSourceNeutralNormalVarianceAfter105:energyAfter,
   sourceKneeNormalProfileGroups105:sourceKneeProfileGroups105,
   originalStraightKneeShadingUnchanged105:!hasKneeFlex,
   actualKneeMeasuredNormalGradientOnly105:true,
   sourceNeutralPanelNormalPeakDifference105:peakChangedNormal,
   rearNormalUntouchedHardEdgeGroups105:rejectedHardEdges,
   protectedOriginalFrontNormalVertices105:skippedFront,
   originalSourcePhotoUVRestSkinAndFrontNormalsUnchanged105:true,
   originalJPEGAndPhotographedFrontLightingPreserved105:true,
   genuine163BoneOriginalSkinnedMesh105:true,
   sourcePhotographedRearProvided105:false,
   physicalClothSimulation105:false,
   noInventedRearPhotographShading105:true,
   independentHumanVisualRealismAcceptance105:false,
   physicalMobilePhonesVerified105:false,
   realSignedCloudRLSVerified105:false,
   releaseAuthorized:false,familyAlpha:'HOLD'
  }};
 }catch(e){
  norm.array.set(originalNormals);norm.needsUpdate=true;
  throw e;
 }
}
