/**
 * DENIM-FIT-06: source-photographed jeans static gravity rest (NO DEPLOY).
 *
 * Uses only the original SHA-verified, independently sewn, 163-bone skinned
 * jeans, 3D76 denim geometry and true 3D77 source-body collision audit.
 * The front photo, UV, rest coordinates, skin indices/weights, JPEG/RGB and
 * all previously matched photo pixels are immutable. Only side/rear lower
 * calf/hem geometry settles into a bounded nonzero source-neutral rest.
 *
 * This is a geometry fitter, not full fabric physics, and does NOT invent
 * anything about unseen fabric.
 */
import * as T from 'three';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';
import {sourcePhotoCalibratedCalfEase17,sourceMeasuredLegRelief18} from './original-photo-leg-width-17.mjs';
import {sourcePhotoSignedCalf19} from './source-photo-signed-calf-19.mjs';
import {sourceNeutralThighLine20,sourceNeutralCalfLine20} from './source-neutral-anatomical-line-20.mjs';
import {sourceNeutralKneeBreak21} from './source-neutral-knee-break-21.mjs';
import {sourceNeutralCuffStack22} from './source-neutral-cuff-stack-22.mjs';
import {sourceNeutralHipKneeHang26,DENIM_ANATOMICAL_HANG26} from './source-neutral-hip-knee-hang-26.mjs';
import {sourceNeutralSideSeamFlow28,DENIM_SEAM_FLOW28} from './source-neutral-side-seam-flow-28.mjs';
export const DENIM_FIT06=Object.freeze({
 targetMeters:.0058,maxWorldShiftMeters:.0085,maxSteps:100,
 stableSteps:6,velocityTolerance:.000012,positionTolerance:.00002,
 timestepSeconds:1/60,physicalPhoneApproved:false,releaseAuthorized:false
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const q=clamp((v-a)/(b-a),0,1);return q*q*(3-2*q);};
const protectedFields=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
export function sourceDenimTaperWeights07(phase){
 if(!Number.isFinite(phase)||phase<0||phase>1)
  throw Error('Anatomical denim source calf phase must be finite within observed geometry');
 // smooth(start,end,value): measured lower calf should be near zero knee ease,
 // while actual knee-side rear vertices receive a visible nonzero gentle break.
 // Fade the inward calf silhouette in at its observed lower source row,
 // avoiding a sharp band where F06 source-neutral geometry resumes.
 return Object.freeze({
  kneeEase:smooth(.10,.60,phase),
  hemEase:smooth(0,.12,phase)*(1-smooth(.25,.70,phase))
 });
}
// F08 uses the real source lower-calf span, with a zero-displacement entry and exit.
// This only modifies already source-neutral side/rear vertices; no new fabric image.
export function sourceDenimCuffRelease08(phase){
 if(!Number.isFinite(phase)||phase<0||phase>1)
  throw Error('Source calf cuff phase must be finite within observed geometry');
 // Restore the verified original F07 lower-hem inward taper (phase <.28):
 // extra fairing MUST be zero there. Extend relief UP the source calf rather
 // than cancel the legitimate hem contour. Upper rows fade back to unchanged.
 return smooth(.28,.38,phase)*(1-smooth(.70,.92,phase));
}
// R14: broad, seam-compatible posterior upper-thigh fabric relief derived
// ONLY from the original skinned anatomical hip/knee span. No new wrinkles,
// rear image, dye, labels, UV coordinates or generated pixels.
export function sourceNeutralRearThighEnvelope14(phase){
 if(!Number.isFinite(phase)||phase<0||phase>1)
  throw Error('Genuine source measured hip-to-knee phase must be finite in [0,1]');
 return smooth(.04,.27,phase)*(1-smooth(.72,.96,phase));
}
// S15: bounded outward modeled thigh seam ease on original source-neutral
// panels only. Uses the same real hip/knee span as R14; no photographic rear.
export function sourceNeutralSideThighEnvelope15(phase){
 if(!Number.isFinite(phase)||phase<0||phase>1)
  throw Error('Genuine original anatomical side-thigh phase must be finite in [0,1]');
 return smooth(.07,.29,phase)*(1-smooth(.71,.94,phase));
}
// P16: source-neutral posterior fabric contour from the ORIGINAL 163-bone
// hip-knee span. Changes sewn rear geometry, never creates unseen photo detail.
// The broad low-order envelope has zero-displacement knee and seat boundaries.
export function sourceNeutralPosteriorContour16(phase){
 if(!Number.isFinite(phase)||phase<0||phase>1)
  throw Error('Original anatomical posterior contour phase must be finite in [0,1]');
 return smooth(.08,.30,phase)*(1-smooth(.67,.93,phase));
}
export function settleDenimRest06(target=DENIM_FIT06.targetMeters){
 if(!Number.isFinite(target)||target<.002||target>DENIM_FIT06.maxWorldShiftMeters)
  throw Error('Finite bounded nonzero photographed denim gravity target required');
 let x=0,v=0,stable=0,n=0;
 for(;n<DENIM_FIT06.maxSteps;n++){
  v=.72*v+.16*(target-x);
  x=clamp(x+v,-DENIM_FIT06.maxWorldShiftMeters,DENIM_FIT06.maxWorldShiftMeters);
  if(Math.abs(x-target)<=DENIM_FIT06.positionTolerance&&
     Math.abs(v)<=DENIM_FIT06.velocityTolerance)stable++;
  else stable=0;
  if(stable>=DENIM_FIT06.stableSteps)break;
 }
 if(stable<DENIM_FIT06.stableSteps)throw Error('Real source denim gravity rest failed to settle');
 return Object.freeze({staticNonzeroGravityRest:true,steps:n+1,meters:x,
  fixedStepSeconds:DENIM_FIT06.timestepSeconds,releaseAuthorized:false});
}
function same(a,b){return a?.length===b?.length&&a.every((x,i)=>x===b[i]);}
export function createPhotoDenimStaticFitter06(pants,root,{sourceSilhouette07=false,sourceFairing08=false,sourceRearThigh14=false,sourceSideThigh15=false,sourcePosteriorContour16=false,sourcePhotoWidth17=false,originalPhotoWidth17=null,sourcePhotoProfile18=false,sourcePhotoSigned19=false,sourceAnatomicalLine20=false,sourceKneeBreak21=false,sourceCuffStack22=false,sourceHipKneeHang26=false,sourceSideSeamFlow28=false}={}){
 if(typeof sourceSideSeamFlow28!=='boolean'||(sourceSideSeamFlow28&&(!sourceHipKneeHang26||!sourceCuffStack22)))
  throw Error('P28 requires verified P26 163-bone source neutral garment fit');
 if(typeof sourceHipKneeHang26!=='boolean'||(sourceHipKneeHang26&&(!sourceCuffStack22||!sourceAnatomicalLine20||!sourcePosteriorContour16)))
  throw Error('P26 requires exact verified P25/P22 anatomical source-neutral hip and knee fit');
 if(typeof sourceCuffStack22!=='boolean'||(sourceCuffStack22&&!sourceKneeBreak21))
  throw Error('P22 requires exact verified opt-in P21 source-grounded anatomical cloth fit');
 if(typeof sourceKneeBreak21!=='boolean'||(sourceKneeBreak21&&!sourceAnatomicalLine20))
  throw Error('P21 requires verified P20 photo/anatomy and explicit opt-in');
 if(typeof sourceAnatomicalLine20!=='boolean'||(sourceAnatomicalLine20&&!sourcePhotoSigned19))
  throw Error('P20 requires opt-in signed P19 and genuine original photographed bone-aligned fit');
 if(typeof sourcePhotoSigned19!=='boolean'||(sourcePhotoSigned19&&!sourcePhotoProfile18))
  throw Error('P19 requires the exact previously verified five-photo-station P18 fit');
 if(typeof sourcePhotoProfile18!=='boolean'||(sourcePhotoProfile18&&!sourcePhotoWidth17))
  throw Error('P18 requires exact source-measured W17 original cutout and P16 ancestry');
 if(typeof sourcePhotoWidth17!=='boolean'||(sourcePhotoWidth17&&!sourcePosteriorContour16))
  throw Error('W17 photo-measured cuff requires fully verified original P16 model');
 if(typeof sourcePosteriorContour16!=='boolean'||(sourcePosteriorContour16&&!sourceSideThigh15))
  throw Error('Posterior contour P16 requires exact original S15 photographed-source anatomy');
 if(typeof sourceSideThigh15!=='boolean'||(sourceSideThigh15&&!sourceRearThigh14))
  throw Error('Side-thigh S15 requires explicit source-neutral R14 with original F07/F08');
 if(typeof sourceRearThigh14!=='boolean'||(sourceRearThigh14&&(!sourceSilhouette07||!sourceFairing08)))
  throw Error('Source-rear R14 must opt in to fully verified original F07/F08 source silhouette/cuff');
 if(typeof sourceFairing08!=='boolean'||(sourceFairing08&&!sourceSilhouette07))
  throw Error('Source-true photographed cuff fairing requires explicit approved silhouette');
 if(typeof sourceSilhouette07!=='boolean')throw Error('Photographed source silhouette feature gate must be boolean');
 const mesh=pants?.meshes?.[0],g=mesh?.geometry,p=g?.getAttribute('position');
 if(!root?.isObject3D||pants?.meshes?.length!==1||
  !mesh?.isSkinnedMesh||mesh?.skeleton?.bones?.length!==163||
  !pants.stats?.photoApplied||!pants.stats?.sourcePhotoDenimSeamContinuity76||
  !pants.stats?.auditedTrueSkinnedBodyToSourcePhotoDenim77||
  !pants.stats?.independentSewnPattern||
  !isSourceVerifiedDenimId(pants.stats?.sourceId)||
  !/^[a-f0-9]{64}$/.test(pants.stats?.sourceSHA256||'')||
  !p||p.count<400||!g.index||
  protectedFields.some(k=>g.getAttribute(k)?.count!==p.count))
  throw Error('Exactly one source-SHA approved actual 163-bone independently sewn jeans mesh required');
 if(sourcePhotoWidth17&&(!originalPhotoWidth17?.originalPhotographedCutoutMeasured17||
  originalPhotoWidth17?.sourceId!==pants.stats.sourceId||
  originalPhotoWidth17?.sourceSHA256!==pants.stats.sourceSHA256||
  originalPhotoWidth17?.cutoutSHA256!==pants.stats.cutoutSHA256||
  originalPhotoWidth17?.releaseAuthorized!==false||
  originalPhotoWidth17?.syntheticReverseImage!==false||
  !Array.isArray(originalPhotoWidth17?.originalPhotoWidthRatios17)||
  originalPhotoWidth17.originalPhotoWidthRatios17.length!==2||
  originalPhotoWidth17.originalPhotoWidthRatios17.some(x=>!Number.isFinite(x)||x<.26||x>2.5)))
  throw Error('W17 photographed cuff measurement must come from the exact original source cutout and SHA');
 if(sourcePhotoProfile18&&
  (!originalPhotoWidth17.sourceMeasuredLegProfiles18||
   !Array.isArray(originalPhotoWidth17.originalPhotoCalfProfileStations18)||
   originalPhotoWidth17.originalPhotoCalfProfileStations18.length!==2||
   originalPhotoWidth17.originalPhotoCalfProfileStations18.some(stations=>
    !Array.isArray(stations)||stations.length!==5||
    stations.some(x=>!Number.isFinite(x)||x<.26||x>2.5))))
  throw Error('P18 source photo requires five verified original RGBA width stations per leg');
 const start=Float32Array.from(p.array),normals=g.getAttribute('normal');
 const originalNormals=normals?Float32Array.from(normals.array):null;
 const guard=new Map(protectedFields.map(k=>[k,g.getAttribute(k).array.slice()]));
 const front=g.getAttribute('pantsSourceFront');
 const legs=pants.stats.landmarks;
 const silhouette07=Object.freeze({maxShiftMeters:.024,minimumAddedKneeEaseMeters:.010});
 if(legs?.length!==2||legs.some(x=>!Array.isArray(x.knee)||!Array.isArray(x.ankle)))
  throw Error('True original photographed knee/ankle reference required');
 root.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const origin=new T.Vector3(),inv=mesh.matrixWorld.clone().invert();
 const rows=new Map();
 for(let i=0;i<p.count;i++){
  origin.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
  if(!Number.isFinite(origin.x+origin.y+origin.z))throw Error('Nonfinite source-denim vertex');
  const key=origin.toArray().map(v=>v.toFixed(5)).join(':');
  if(!rows.has(key))rows.set(key,{q:origin.clone(),ids:[],front:0});
  const row=rows.get(key);row.ids.push(i);row.front=Math.max(row.front,front.getX(i));
 }
 let untouched=0;const eligible=[],protectedIds=[];
 for(const row of rows.values()){
  if(row.front>=.18){protectedIds.push(...row.ids);untouched+=row.ids.length;continue;}
  const side=row.q.x>=0?0:1,landmark=legs[side],
    knee=new T.Vector3(...landmark.knee),ankle=new T.Vector3(...landmark.ankle);
  if(knee.y-ankle.y<.22)throw Error('True denim ankle/knee vertical placement missing');
  const height=(row.q.y-ankle.y)/(knee.y-ankle.y),
    blend=smooth(height,.06,.22)*(1-smooth(height,.53,.79));
  const legX=T.MathUtils.lerp(ankle.x,knee.x,clamp(height,0,1));
  const dx=row.q.x-legX,radial=Math.hypot(dx,row.q.z);
  if(height<.04||height>.82||radial<.035||radial>.31||blend<.025)continue;
  // 07 uses ORIGINAL anatomical knee/ankle positions to create a
  // calf-to-knee volume transition; no guessed texture or repeating
  // decorative waves. Source 3D75/76 already carries the real folds.
  // Protect the original photograph's front and its actual colors.
  eligible.push({...row,side,height,blend,
    radialX:dx/radial,radialZ:row.q.z/radial});
 }
 // R14 uses ORIGINAL source-sewn rear thigh rows, independent of calf
 // eligibility, and the actual rig's true hip/knee reference. Never
 // extrapolate unseen colors or add procedural/repetitive fold textures.
 const rearThigh14=[];
 if(sourceRearThigh14){
  if(legs.some(l=>!Array.isArray(l.hip)||l.hip[1]-l.knee[1]<.25))
   throw Error('R14 missing authentic hip/knee source anatomy');
  for(const row of rows.values()){
   if(row.front>=.12||row.q.z>-.025)continue;
   const side=row.q.x>=0?0:1,leg=legs[side];
   const phase=(row.q.y-leg.knee[1])/(leg.hip[1]-leg.knee[1]);
   if(phase<=.04||phase>=.96)continue;
   const centerX=T.MathUtils.lerp(leg.knee[0],leg.hip[0],phase);
   if(Math.abs(row.q.x-centerX)>.29)continue;
   const weight=sourceNeutralRearThighEnvelope14(phase);
   if(weight<=.05)continue;
   rearThigh14.push({...row,side,phase,weight});
  }
  if(rearThigh14.length<35||
   rearThigh14.filter(x=>x.side===0).length<12||
   rearThigh14.filter(x=>x.side===1).length<12)
   throw Error('R14 genuine rear upper-thigh original sewn mesh rows unavailable');
 }
 if(eligible.length<35||untouched<100||eligible.filter(x=>x.side===0).length<12||
   eligible.filter(x=>x.side===1).length<12)
  throw Error('Source-neutral original photo calf/hem surface missing; cannot fit jeans');
 // Licensed denim meshes expose different portions of actual calf geometry.
 // Calibrate from observable sewn 163-bone source, not assumed missing hem rows.
 const sourceRanges=[0,1].map(side=>{
  const heights=eligible.filter(row=>row.side===side).map(row=>row.height);
  return {min:Math.min(...heights),max:Math.max(...heights)};
 });
 if(sourceSilhouette07&&sourceRanges.some(x=>!Number.isFinite(x.min+x.max)||
    x.max-x.min<.08||x.max-x.min>.85))
  throw Error('Measured source-photographed lower leg insufficient for anatomical taper');
 for(const row of eligible){
  const r=sourceRanges[row.side],phase=(row.height-r.min)/(r.max-r.min);
  row.sourceCalfPhase=phase;
  const weights=sourceDenimTaperWeights07(phase);
  row.kneeEase=weights.kneeEase;row.hemEase=weights.hemEase;
 }
 let frozen=false,proof=null,closed=false;
 function audit(){
  if(closed||mesh.geometry!==g)throw Error('Authenticated source denim geometry detached');
  for(const [key,before] of guard)if(!same(g.getAttribute(key)?.array,before))
   throw Error('Original denim photograph UV, front, rest or 163-bone skin altered: '+key);
  for(const i of protectedIds)if(p.getX(i)!==start[i*3]||
    p.getY(i)!==start[i*3+1]||p.getZ(i)!==start[i*3+2])
   throw Error('Photographed front denim vertex changed');
 }
 function restore(){
  if(closed)return;
  p.array.set(start);p.needsUpdate=true;
  if(normals&&originalNormals){normals.array.set(originalNormals);normals.needsUpdate=true;}
  g.computeBoundingBox();g.computeBoundingSphere();frozen=false;proof=null;audit();
 }
 function freeze(){
  restore();const eq=settleDenimRest06();
  let changed=0,max=0;const perLeg=[0,0],q=new T.Vector3();
  let kneeMoved=0,hemMoved=0,kneeEaseTotal=0,hemEaseTotal=0,sourceKneeRearGroups=0;
  let cuffMoved=0,maxCuffRelease=0;
  let rear14Moved=0,rear14Max=0;const rear14PerLeg=[0,0];
  let rear15Moved=0,rear15Max=0;const rear15PerLeg=[0,0];
  let posterior16Moved=0,posterior16Max=0;const posterior16PerLeg=[0,0];
  let width17Moved=0,width17Max=0;const width17PerLeg=[0,0];
  let profile18Moved=0,profile18Max=0;const profile18PerLeg=[0,0];
  let signed19Moved=0,signed19Max=0;const signed19PerLeg=[0,0];
  let calf20Moved=0,calf20Max=0;const calf20PerLeg=[0,0];
  let thigh20Moved=0,thigh20Max=0;const thigh20PerLeg=[0,0];
  let fold21Moved=0,fold21Max=0;const fold21PerLeg=[0,0];
  let stack22Moved=0,stack22Max=0;const stack22PerLeg=[0,0];
  let hang26Moved=0,hang26RearMax=0,hang26SideMax=0,hang26DropMax=0;const hang26PerLeg=[0,0];
  let flow28Moved=0,flow28SideMax=0,flow28RearMax=0;const flow28PerLeg=[0,0];
  for(const row of eligible){
   const kneeRest=sourceSilhouette07 ? .0015*row.kneeEase : 0;
   // Fit the lower source-neutral calf closer to its anatomical form.
   // Do NOT manufacture a rounded 'knee bubble' or move the JPEG front.
   const hemRest=sourceSilhouette07 ? -.016*row.hemEase : 0;
   // More legible licensed side/rear garment relief; bounded to the same 24mm
   // original-source-neutral fit budget, with original front/UV/skin unchanged.
   const cuffRelease=sourceFairing08?.0085*sourceDenimCuffRelease08(row.sourceCalfPhase):0;
   const dy=-eq.meters*.22*row.blend;
   // Smooth lower-calf taper into the original real sewn upper knee geometry.
   // The source photo front, authentic pattern and cloth folds remain intact.
   const photoWidth17=sourcePhotoWidth17?
    sourcePhotoCalibratedCalfEase17(row.sourceCalfPhase,
      originalPhotoWidth17.originalPhotoWidthRatios17[row.side]):0;
   const baseRadius=eq.meters*.92*row.blend+kneeRest+hemRest+cuffRelease+photoWidth17;
   const sourceProfile18=sourcePhotoProfile18?
    sourceMeasuredLegRelief18(row.sourceCalfPhase,
      originalPhotoWidth17.originalPhotoCalfProfileStations18[row.side]):0;
   // Respect inherited 24 mm total fit bound, including real-photo widths.
   const radius18=sourcePhotoProfile18?
    clamp(baseRadius+sourceProfile18,-.0235,.0235):baseRadius;
   const signed19=sourcePhotoSigned19?
    sourcePhotoSignedCalf19(row.sourceCalfPhase,
      originalPhotoWidth17.originalPhotoCalfProfileStations18[row.side]):0;
   const radius19=sourcePhotoSigned19?clamp(radius18+signed19,-.0235,.0235):radius18;
   // Reduce an over-rounded modeled calf surface while honoring true
   // hem-to-knee PHOTO width and leaving original front pixels immutable.
   const calf20=sourceAnatomicalLine20?
    sourceNeutralCalfLine20(row.sourceCalfPhase,
      originalPhotoWidth17.originalPhotoWidthRatios17[row.side]):0;
   const radius20=sourceAnatomicalLine20?clamp(radius19-calf20,-.0235,.0235):radius19;
   // One broad authentic-bone-anchored modeled knee break / calf tuck,
   // tuned with the SHA-bound photographed cutout's five width stations.
   // These folds are NOT falsely labeled an observed rear photograph.
   const fold21=sourceKneeBreak21?
    sourceNeutralKneeBreak21(row.sourceCalfPhase,
      originalPhotoWidth17.originalPhotoCalfProfileStations18[row.side],row.side).radialMeters:0;
   const radius21=sourceKneeBreak21?clamp(radius20+fold21,-.0235,.0235):radius20;
   // Source-authenticated lower-leg orientation tilts a single 3D modeled
   // cuff fold. Outward only, so it never pushes cloth into the mannequin.
   // Original photograph/UV/rest/skin and all front vertices are immutable.
   const stack22=sourceCuffStack22?
    sourceNeutralCuffStack22(row.sourceCalfPhase,row.radialX,row.radialZ,
      originalPhotoWidth17.originalPhotoWidthRatios17[row.side],row.side).outwardMeters:0;
   const radius=sourceCuffStack22?clamp(radius21+stack22,-.0235,.0235):radius21;
   const applied22=Math.abs(radius-radius21);
   const applied21=Math.abs(radius21-radius20);
   const applied18=Math.abs(radius18-baseRadius);
   const applied19=Math.abs(radius19-radius18);
   const applied20=Math.abs(radius20-radius19);
   const dx=radius*row.radialX,dz=radius*row.radialZ,
     shift=Math.hypot(dx,dy,dz);
   const budget=sourceSilhouette07?silhouette07.maxShiftMeters:DENIM_FIT06.maxWorldShiftMeters;
   if(!Number.isFinite(shift)||shift>budget)
    throw Error('Photographed denim rest outside source-neutral fit bounds');
   if(shift<.00005)continue;
   q.copy(row.q).add(new T.Vector3(dx,dy,dz)).applyMatrix4(inv);
   for(const i of row.ids){p.setXYZ(i,q.x,q.y,q.z);changed++;perLeg[row.side]++;}
   max=Math.max(max,shift);
   if(sourceFairing08&&cuffRelease>.001){cuffMoved++;maxCuffRelease=Math.max(maxCuffRelease,cuffRelease);}
   if(applied18>.0004){profile18Moved+=row.ids.length;profile18PerLeg[row.side]+=row.ids.length;
    profile18Max=Math.max(profile18Max,applied18);}
   if(applied20>.0004){calf20Moved+=row.ids.length;calf20PerLeg[row.side]+=row.ids.length;
    calf20Max=Math.max(calf20Max,applied20);}
   if(applied21>.0004){fold21Moved+=row.ids.length;fold21PerLeg[row.side]+=row.ids.length;
    fold21Max=Math.max(fold21Max,applied21);}
   if(applied22>.0004){stack22Moved+=row.ids.length;stack22PerLeg[row.side]+=row.ids.length;
    stack22Max=Math.max(stack22Max,applied22);}
   if(applied19>.0004){signed19Moved+=row.ids.length;signed19PerLeg[row.side]+=row.ids.length;
    signed19Max=Math.max(signed19Max,applied19);}
   if(photoWidth17>.0004){width17Moved+=row.ids.length;width17PerLeg[row.side]+=row.ids.length;
    width17Max=Math.max(width17Max,photoWidth17);}
   if(sourceSilhouette07){
    if(row.sourceCalfPhase>=.38&&row.sourceCalfPhase<=1.001){
      kneeMoved++;kneeEaseTotal+=kneeRest;sourceKneeRearGroups++;
    }
    if(row.sourceCalfPhase<.38){
      hemMoved++;hemEaseTotal+=hemRest;
    }
   }
  }
  // Measured source-rear 163-bone thigh is a continuous modeled fabric
  // surface. Add a single smoothly bounded outward rest ease (<=10 mm).
  // Keep hip/knee and the original photographed front exactly fixed.
  if(sourceRearThigh14){
   for(const row of rearThigh14){
    const delta=-.010*row.weight;
    const lateral=sourceSideThigh15?.0065*sourceNeutralSideThighEnvelope15(row.phase):0;
    // Upper leg needs a continuous cloth volume, not a uniform rear tube.
    // The broad posterior ease complements existing R14 and S15 and dies
    // smoothly into measured anatomical hip/knee rows. Source front never moves.
    const posterior=sourcePosteriorContour16?.0115*sourceNeutralPosteriorContour16(row.phase):0;
    // True 163-bone hip/knee, ORIGINAL source-neutral side/rear sewn rows only.
    const hang26=sourceHipKneeHang26?sourceNeutralHipKneeHang26(row.phase,row.side):null;
    const rear26=hang26?.rearMeters||0,side26=hang26?.sideMeters||0,drop26=hang26?.dropMeters||0;
    if(Math.abs(delta)<.0004&&lateral<.0004&&posterior<.0004&&rear26<.0004)continue;
    // Draw back excess *modeled* posterior and lateral cloth volume, with
    // exact zero at hip/knee. No reverse-side photo is fabricated.
    const line20=sourceAnatomicalLine20?sourceNeutralThighLine20(row.phase):null;
    // P28 redistributes modeled rear/side fabric relief toward the genuine
    // skinned leg's LATERAL seam rather than adding a periodic cosmetic wrinkle.
    // Never touch original photographed front rows or their UV/rest/skin data.
    const leg28=legs[row.side],center28=T.MathUtils.lerp(
     leg28.knee[0],leg28.hip[0],row.phase);
    const seam28=sourceSideSeamFlow28?sourceNeutralSideSeamFlow28(
     row.phase,row.side,Math.min(.29,Math.abs(row.q.x-center28))):null;
    const rearShift=delta-posterior+(line20?.rearMeters||0)-rear26+
     (seam28?.rearReleaseMeters||0);
    const sideShift=lateral-(line20?.sideMeters||0)+side26+
     (seam28?.lateralMeters||0);
    const totalShift=Math.hypot(rearShift,sideShift,drop26);
    if((sourceHipKneeHang26||sourceSideSeamFlow28)&&(!Number.isFinite(totalShift)||
       totalShift>DENIM_SEAM_FLOW28.maxTotalLocalShiftMeters))
     throw Error('P26 upper thigh drape exceeds actual source-authenticated fit budget');
    const world=row.q.clone();world.z+=rearShift;
    world.x+=(row.side===0?1:-1)*sideShift;world.y-=drop26;
    if(line20&&(line20.rearMeters>.0004||line20.sideMeters>.0004)){
     thigh20Moved+=row.ids.length;thigh20PerLeg[row.side]+=row.ids.length;
     thigh20Max=Math.max(thigh20Max,Math.hypot(line20.rearMeters,line20.sideMeters));
    }
    const local=world.applyMatrix4(inv);
    for(const i of row.ids){p.setXYZ(i,local.x,local.y,local.z);changed++;rear14Moved++;rear14PerLeg[row.side]++;
     if(lateral>.0004){rear15Moved++;rear15PerLeg[row.side]++;}
     if(posterior>.0004){posterior16Moved++;posterior16PerLeg[row.side]++;}
    }
    if(rear26>.0004){
     hang26Moved+=row.ids.length;hang26PerLeg[row.side]+=row.ids.length;
     hang26RearMax=Math.max(hang26RearMax,rear26);
     hang26SideMax=Math.max(hang26SideMax,side26);
     hang26DropMax=Math.max(hang26DropMax,drop26);
    }
    if(seam28&&seam28.lateralMeters>.0004){
     flow28Moved+=row.ids.length;flow28PerLeg[row.side]+=row.ids.length;
     flow28SideMax=Math.max(flow28SideMax,seam28.lateralMeters);
     flow28RearMax=Math.max(flow28RearMax,seam28.rearReleaseMeters);
    }
    rear14Max=Math.max(rear14Max,Math.abs(delta));
    rear15Max=Math.max(rear15Max,lateral);
    posterior16Max=Math.max(posterior16Max,posterior);
    max=Math.max(max,totalShift);
   }
   if(rear14Moved<40||Math.min(...rear14PerLeg)<15||rear14Max<.008||rear14Max>.0100001)
    throw Error('R14 actual source-neutral modeled thigh drape not visible/bounded: '+
     JSON.stringify({rear14Moved,rear14PerLeg,rear14Max}));
   if(sourceSideThigh15&&(rear15Moved<40||Math.min(...rear15PerLeg)<15||
      rear15Max<.006||rear15Max>.0065001))
    throw Error('S15 source-neutral original side-thigh seam ease unavailable or out of bounds: '+
     JSON.stringify({rear15Moved,rear15PerLeg,rear15Max}));
   if(sourcePosteriorContour16&&(posterior16Moved<40||
     Math.min(...posterior16PerLeg)<15||posterior16Max<.0105||posterior16Max>.0115001))
    throw Error('P16 missing true source-neutral posterior thigh geometry or excessive displacement: '+
     JSON.stringify({posterior16Moved,posterior16PerLeg,posterior16Max}));
   if(sourceSideSeamFlow28&&(flow28Moved<30||Math.min(...flow28PerLeg)<12||
     flow28SideMax<.005||flow28SideMax>DENIM_SEAM_FLOW28.maxLateralMeters+.000001))
    throw Error('P28 original 163-bone lateral-seam modeled cloth adjustment not genuinely present');
   if(sourceHipKneeHang26&&(hang26Moved<30||Math.min(...hang26PerLeg)<12||
      hang26RearMax<.003||hang26RearMax>DENIM_ANATOMICAL_HANG26.maxRearMeters+.000001||
      hang26SideMax>DENIM_ANATOMICAL_HANG26.maxSideMeters+.000001||
      hang26DropMax>DENIM_ANATOMICAL_HANG26.maxVerticalMeters+.000001))
    throw Error('P26 original 163-bone hip-to-knee neutral drape missing or excessive: '+
      JSON.stringify({hang26Moved,hang26PerLeg,hang26RearMax,hang26SideMax,hang26DropMax}));
  }
  p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  audit();
  const budget=sourceSilhouette07?silhouette07.maxShiftMeters:DENIM_FIT06.maxWorldShiftMeters;
  if(changed<60||Math.min(...perLeg)<20||max<.002||max>budget)
   throw Error('Genuine photographed denim static hem drape not achieved: '+JSON.stringify({changed,perLeg,max}));
  const taperAdditionalMean=(kneeMoved?kneeEaseTotal/kneeMoved:0)-
   (hemMoved?hemEaseTotal/hemMoved:0);
  if(sourceSilhouette07&&(kneeMoved<15||hemMoved<15||
    taperAdditionalMean<.008||max<silhouette07.minimumAddedKneeEaseMeters))
   throw Error('Photographed knee-to-hem taper not measurably improved: '+JSON.stringify({
    kneeMoved,hemMoved,taperAdditionalMean,max}));

  if(sourceCuffStack22&&(stack22Moved<25||Math.min(...stack22PerLeg)<9||
    stack22Max<.001||stack22Max>.009157))
   throw Error('P22 photographic hem-ratio, anatomical diagonal modeled cuff stack unavailable/beyond bounds: '+
    JSON.stringify({stack22Moved,stack22PerLeg,stack22Max}));
  if(sourceKneeBreak21&&(fold21Moved<25||Math.min(...fold21PerLeg)<9||
    fold21Max<.001||fold21Max>.0054001))
   throw Error('P21 original bone conditioned photo-width modeled knee fold missing/out of bounds: '+
    JSON.stringify({fold21Moved,fold21PerLeg,fold21Max}));
  if(sourceAnatomicalLine20&&(calf20Moved<25||Math.min(...calf20PerLeg)<10||
    thigh20Moved<30||Math.min(...thigh20PerLeg)<12||
    calf20Max<.0005||calf20Max>.0030001||
    thigh20Max<.002||thigh20Max>.0048501))
   throw Error('P20 bone-anchored source-neutral anatomical denim silhouette missing or excessive: '+
    JSON.stringify({calf20Moved,calf20PerLeg,calf20Max,thigh20Moved,thigh20PerLeg,thigh20Max}));
  if(sourcePhotoSigned19&&(signed19Moved<25||Math.min(...signed19PerLeg)<10||
     signed19Max<.001||signed19Max>.0115001))
   throw Error('P19 signed original-photo hem direction not applied to both modeled legs: '+
    JSON.stringify({signed19Moved,signed19PerLeg,signed19Max}));
  if(sourcePhotoProfile18&&(profile18Moved<40||Math.min(...profile18PerLeg)<15||
     profile18Max<.004||profile18Max>.0180001))
   throw Error('P18 original photographed five-station calf drape missing/beyond source-neutral bound: '+
    JSON.stringify({profile18Moved,profile18PerLeg,profile18Max}));
  if(sourcePhotoWidth17&&(width17Moved<40||Math.min(...width17PerLeg)<15||
     width17Max<.007||width17Max>.0180001))
   throw Error('W17 source photographed calibrated calf silhouette not achieved or out of bounds: '+
    JSON.stringify({width17Moved,width17PerLeg,width17Max}));
  if(sourceFairing08&&(cuffMoved<8||maxCuffRelease<.008))
   throw Error('Genuine original-photo cuff geometry not measurably fairing: '+JSON.stringify({cuffMoved,maxCuffRelease}));
  frozen=true;
  proof=Object.freeze({actualPhotoDenimFrozenFit:true,
   originalPhotoSHA256:pants.stats.sourceSHA256,originalDenimId:pants.stats.sourceId,
   authentic163BoneMannequin:true,changedVertices:changed,perLeg,
   maxWorldShiftMeters:max,rest:eq,frontPhotographUnchanged:true,
   sourceMeasuredAnatomicalSilhouette07:sourceSilhouette07,
   originalSkinnedKneeHemTaperImproved07:sourceSilhouette07,
   sourceNeutralKneeRearGroups07:sourceKneeRearGroups,
   actualSourceCalfCoverage07:sourceSilhouette07?sourceRanges:null,
   additionalKneeVsHemEaseMeters07:sourceSilhouette07?taperAdditionalMean:0,
   actualSeamFoldTopologyPreserved07:true,
   originalPhotoTextureRGBAndUVUnmodified07:true,
   originalSourceNeutralCuffFairing08:sourceFairing08,
   cuffReleasedVertices08:cuffMoved,maxCuffReleaseMeters08:maxCuffRelease,
   originalPhotoTextureRGBAndUVUnmodified08:true,
   sourceMeasuredRearThighRelief14:sourceRearThigh14,
   rearThighSourceNeutralVertices14:rear14Moved,
   rearThighPerLeg14:rear14PerLeg,
   rearThighMaximumWorldMoveMeters14:rear14Max,
   actual163BoneHipKneeSourceAnchors14:sourceRearThigh14,
   originalPhotographedFrontProtected14:true,
   sourcePhotoRGBUVRestAndSkinUnchanged14:true,
   noInventedPhotographicRear14:true,
   sourceMeasuredSideThighRelief15:sourceSideThigh15,
   sideThighSourceNeutralVertices15:rear15Moved,
   sideThighPerLeg15:rear15PerLeg,
   sideThighMaximumWorldMoveMeters15:rear15Max,
   actual163BoneHipKneeSourceAnchors15:sourceSideThigh15,
   originalPhotographedFrontProtected15:true,
   sourcePhotoRGBUVRestAndSkinUnchanged15:true,
   noInventedPhotographicRear15:true,
   sourceMeasuredPosteriorContour16:sourcePosteriorContour16,
   posteriorSourceNeutralVertices16:posterior16Moved,
   posteriorPerLeg16:posterior16PerLeg,
   posteriorMaximumWorldMoveMeters16:posterior16Max,
   original163BoneHipKneeAnchor16:sourcePosteriorContour16,
   frontPhotographUVRestSkinProtected16:true,
   rearIsModeledNotPhotographed16:true,
   originalPhotoCalibratedCalfWidth17:sourcePhotoWidth17,
   sourceCutoutLegWidthRatios17:sourcePhotoWidth17?originalPhotoWidth17.originalPhotoWidthRatios17:null,
   sourceCalfWidthMovedVertices17:width17Moved,
   sourceCalfWidthPerLeg17:width17PerLeg,
   sourceCalfWidthMaxShiftMeters17:width17Max,
   frontJPEGUVRestSkinUnchanged17:true,
   unseenRearPhotoSynthesized17:false,
   sourceMeasuredOriginalCalfProfile18:sourcePhotoProfile18,
   originalPhotoFiveLegStations18:sourcePhotoProfile18?originalPhotoWidth17.originalPhotoCalfProfileStations18:null,
   photographedCalfProfileMovedVertices18:profile18Moved,
   photographedCalfProfilePerLeg18:profile18PerLeg,
   photographedCalfProfileMaxShiftMeters18:profile18Max,
   originalFrontSHAUVRestAndSkinProtected18:true,
   noUnphotographedRearTexture18:true,
   originalPhotoDirectionalCalf19:sourcePhotoSigned19,
   originalPhotoSignedRatios19:sourcePhotoSigned19?originalPhotoWidth17.originalPhotoCalfProfileStations18.map(s=>s[4]):null,
   signedSourceCalfMovedVertices19:signed19Moved,
   signedSourceCalfPerLeg19:signed19PerLeg,
   sourcePhotoSignedShiftMaxMeters19:signed19Max,
   originalPhotoFrontUnchanged19:true,unphotographedRearUnchanged19:true,
   sourceNeutralAnatomicalLine20:sourceAnatomicalLine20,
   photoAnatomicalThighMovedVertices20:thigh20Moved,
   photoAnatomicalThighPerLeg20:thigh20PerLeg,
   photoAnatomicalThighMaxMeters20:thigh20Max,
   photoAnatomicalCalfMovedVertices20:calf20Moved,
   photoAnatomicalCalfPerLeg20:calf20PerLeg,
   photoAnatomicalCalfMaxMeters20:calf20Max,
   originalJPEGUVRestSkinProtected20:true,noInventedPhotographicRear20:true,
   sourceNeutralKneeBreak21:sourceKneeBreak21,
   sourceKneeBreakMovedVertices21:fold21Moved,
   sourceKneeBreakPerLeg21:fold21PerLeg,
   sourceKneeBreakMaxMeters21:fold21Max,
   originalJPEGUVRestSkinProtected21:true,
   rearFoldIsModeledNotPhotographed21:true,
   sourceNeutralCuffStack22:sourceCuffStack22,
   sourceCuffStackMovedVertices22:stack22Moved,
   sourceCuffStackPerLeg22:stack22PerLeg,
   sourceCuffStackMaxMeters22:stack22Max,
   originalJPEGUVRestSkinProtected22:true,
   modeledCuffStackNotPhotographed22:true,
   sourceNeutralSeamFlow28:sourceSideSeamFlow28,
   sourceSeamFlowMovedVertices28:flow28Moved,
   sourceSeamFlowPerLeg28:flow28PerLeg,
   sourceSeamFlowLateralMaxMeters28:flow28SideMax,
   sourceSeamFlowRearReleaseMaxMeters28:flow28RearMax,
   sourceSeamFlowModelledNotPhotographed28:true,
   sourceJPEGUVSkinRestProtected28:true,
   sourceNeutralHipKneeHang26:sourceHipKneeHang26,
   sourceHipKneeHangMovedVertices26:hang26Moved,
   sourceHipKneeHangPerLeg26:hang26PerLeg,
   sourceHipKneeHangRearMaxMeters26:hang26RearMax,
   sourceHipKneeHangSideMaxMeters26:hang26SideMax,
   sourceHipKneeHangDropMaxMeters26:hang26DropMax,
   originalSourceFrontJPEGUVRestSkinUnchanged26:true,
   sideRearDrapeModeledNotPhotographed26:true,
   actual163BoneHipKneeAnchors26:sourceHipKneeHang26,
   sourceUVRestAndSkinByteIdentical:true,realBVHVerifiedByCaller:false,
   noUnseenTextureInvented:true,physicalPhoneApproved:false,
   humanPhotorealismApproved:false,releaseAuthorized:false});
  return proof;
 }
 return Object.freeze({freeze,restore,state:()=>({frozen,proof}),
  dispose(){if(closed)return;restore();closed=true;}});
}
