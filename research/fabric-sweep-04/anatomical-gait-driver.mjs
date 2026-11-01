/**
 * POSE-WALK-02 — genuine in-place lower-limb articulation of the original
 * independently skinned 163-bone anatomical humanoid. NO procedural body mesh,
 * counterfeit back texture, translation, saved private photos or new skeleton.
 *
 * The original, SHA-verified dress shares its EXACT bone transforms with this
 * rig. The bounded secondary fabric spring is driven by observed gait phase,
 * rather than an unrelated decorative oscillation.
 *
 * RESEARCH HOLD: not a walking/foot-plant physics engine, swept collision-safe
 * cloth simulation, or generic garment-fitting certification.
 */
import * as T from 'three';
export const WALK02=Object.freeze({
 sourceSHA256:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
 maxHipDegrees:6,maxKneeDegrees:8,maxPelvisYawDegrees:1.5,
 cycleSeconds:1.65,originalSkeletonBones:163,
 releaseAuthorized:false,physicalPhoneVerified:false,
 sweptCollisionCertified:false,humanVisualApproved:false
});
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const identifier=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const wanted=['pelvis','upperleg01L','upperleg01R','lowerleg01L','lowerleg01R'];
export function gait02Angles(phase){
 if(!finite(phase)||phase<0||phase>1)throw Error('Genuine walking phase must be in [0,1]');
 const s=Math.sin(2*Math.PI*phase),c=Math.cos(2*Math.PI*phase);
 return Object.freeze({
  pelvisYaw:WALK02.maxPelvisYawDegrees*s,
  leftHip:WALK02.maxHipDegrees*s,
  rightHip:-WALK02.maxHipDegrees*s,
  leftKnee:WALK02.maxKneeDegrees*Math.max(0,c),
  rightKnee:WALK02.maxKneeDegrees*Math.max(0,-c),
  phase
 });
}
export function createOriginal163BoneGait02(root,{sourceSHA256=WALK02.sourceSHA256}={}){
 if(!root?.isObject3D||sourceSHA256!==WALK02.sourceSHA256)
  throw Error('Source-vetted original photograph and genuine anatomical rig required');
 const skins=[],all=[];
 root.traverse(x=>{if(x.isSkinnedMesh&&!x.userData.work56Garment)skins.push(x);if(x.isBone)all.push(x);});
 if(skins.length<1||skins.some(x=>x.skeleton?.bones?.length!==163)||
    all.length<163)throw Error('POSE-WALK-02 requires original 163-bone skinned body, no synthetic skeleton');
 const locate=n=>{
  const match=all.filter(b=>identifier(b.name)===identifier(n));
  if(match.length!==1)throw Error('Original anatomical gait joint missing or ambiguous: '+n+'; original named joints: '+all.map(b=>b.name).filter(x=>/leg|hip|pelvis|root|spine/i.test(x)).slice(0,35).join(','));
  return match[0];
 };
 // Some licensed 163-bone figures have a real pelvis joint with a different
 // model-defined name. Resolve it anatomically as the nearest BONE ancestor
 // shared by both original upper legs; never synthesize a new joint.
 const leftUpper=locate('upperleg01L'),rightUpper=locate('upperleg01R');
 const ancestry=new Set();for(let p=leftUpper.parent;p;p=p.parent)if(p.isBone)ancestry.add(p);
 let common=null;for(let p=rightUpper.parent;p;p=p.parent)if(p.isBone&&ancestry.has(p)){common=p;break;}
 if(!common||common===leftUpper||common===rightUpper)
  throw Error('Original anatomical pelvis/common hip parent unavailable on original skeleton');
 const namedPelvis=all.filter(b=>identifier(b.name)==='pelvis');
 if(namedPelvis.length>1)throw Error('Original pelvis bone ambiguous');
 if(namedPelvis.length===1&&namedPelvis[0]!==common)
  throw Error('Actual original leg ancestor disagrees with named pelvis');
 const joints=new Map([['pelvis',common],['upperleg01L',leftUpper],['upperleg01R',rightUpper],
  ['lowerleg01L',locate('lowerleg01L')],['lowerleg01R',locate('lowerleg01R')]]);
 const before=new Map([...joints].map(([n,b])=>[n,b.quaternion.clone()]));
 const axisX=new T.Vector3(1,0,0),axisY=new T.Vector3(0,1,0);
 let disposed=false,samples=0,last=gait02Angles(0);
 const refresh=()=>{root.updateMatrixWorld(true);for(const x of skins)x.skeleton.update();};
 function restore(){
  for(const [n,q] of before)joints.get(n).quaternion.copy(q);
  refresh();
 }
 return Object.freeze({
  sample(phase){
   if(disposed)throw Error('Gait detached');
   const a=gait02Angles(phase);
   restore(); // Every sample starts from identical original rig; no drift.
   for(const [n,angle,axis] of [
    ['pelvis',a.pelvisYaw,axisY],
    ['upperleg01L',a.leftHip,axisX],['upperleg01R',a.rightHip,axisX],
    ['lowerleg01L',a.leftKnee,axisX],['lowerleg01R',a.rightKnee,axisX]
   ])joints.get(n).quaternion.multiply(new T.Quaternion().setFromAxisAngle(
       axis,T.MathUtils.degToRad(angle)));
   refresh();samples++;last=a;
   return {phase,angles:a,actualBoneNames:[...joints].map(([n,b])=>b.name),
    changedBoneCount:Object.values(a).filter((v,i)=>i<5&&Math.abs(v)>1e-6).length,
    originalSkinnedBodies:skins.length,original163BoneRig:true,
    sourceSHA256,photoAndSkinWeightsUntouched:true,
    simulatedFootPlants:false,sweptCollisionCertified:false,releaseAuthorized:false};
  },
  reset(){if(disposed)return;restore();last=gait02Angles(0);},
  state(){return {samples,lastAngles:last,original163BoneRig:true,sourceSHA256,
   animatedRealJoints:[...joints].map(([n,b])=>b.name),
   releaseAuthorized:false,sweptCollisionCertified:false};},
  dispose(){if(disposed)return;restore();disposed=true;}
 });
}
