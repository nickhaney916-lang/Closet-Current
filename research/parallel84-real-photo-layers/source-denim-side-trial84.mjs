/**
 * Parallel #84 isolated research: reversible SOURCE-NEUTRAL denim thigh/side
 * hanging panel trial on authentic Commons JPEG-backed, independently sewn,
 * 163-bone THREE.SkinnedMesh jeans.
 *
 * No photographed back is invented. Source RGB/JPEG SHA, photo UV/front/rest,
 * rig skin, body vertices, image resources, indices, and materials preserved.
 * Actual AFTER full posed-triangle BODY and SHIRT contact sets may only be
 * equal or safer than before. Else exact original geometry rollback.
 * A zero-new-contact result for ONE pose is not cloth dynamics/signed volume
 * clearance/human realism/physical-phone approval. Family Alpha HOLD.
 */
import * as T from 'three';
import {posedSource84,countSourceContacts84} from './source-bone-yoke-trial84.mjs';
const smooth=T.MathUtils.smoothstep,lerp=T.MathUtils.lerp;
const shaDenim=Object.freeze({
 'commons-public-domain-jeans-2005':'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'commons-cc-by-sa-denimjeans2-2008':'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
});
const fields=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const key=p=>p.toArray().map(n=>n.toFixed(5)).join('|');
const pct=(a,q)=>{const v=a.slice().sort((a,b)=>a-b);return v[Math.floor((v.length-1)*q)];};
const base={schema:'P84-original-denim-source-neutral-side-AB/v1',
 photoAndSourceAttributesUnchanged:true,originalBodyGeometryUnchanged:true,
 original163BoneSkinUnchanged:true,photoReverseInvented:false,
 sourceFrontPhotographProtected:true,continuousMotionCertified:false,
 humanRealismApproved:false,physicalDeviceTested:false,releaseAuthorized:false};
const reject=reason=>Object.freeze({...base,status:'REFUSED_UNCHANGED',
 reason,trialApplied:false,sourceGeometryRestored:true});
function newPairs(before,after){
 let n=0;for(const k of after.pairs)if(!before.pairs.has(k))n++;return n;
}
function normals(geometry){
 const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
 geometry.computeVertexNormals();
 const groups=new Map();
 for(let i=0;i<p.count;i++){
  const k=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>x.toFixed(5)).join(':');
  if(!groups.has(k))groups.set(k,[]);
  groups.get(k).push(i);
 }
 for(const ids of groups.values()){
  const avg=new T.Vector3();
  for(const i of ids)avg.add(new T.Vector3().fromBufferAttribute(n,i));
  if(avg.lengthSq()<1e-10)continue;
  avg.normalize();
  for(const i of ids)n.setXYZ(i,avg.x,avg.y,avg.z);
 }
 n.needsUpdate=true;
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
}
export function trialSourceMeasuredDenimSide84({
 pants,shirt,root,avatar,sideEaseMeters=.018,rearEaseMeters=.009,enabled=true
}={}){
 if(!enabled)return reject('explicit-opt-out');
 const mesh=pants?.meshes?.[0],g=mesh?.geometry,p=g?.getAttribute('position');
 if(!['male','female'].includes(avatar)||!root?.isObject3D||
   !finite(sideEaseMeters)||sideEaseMeters<.002||sideEaseMeters>.025||
   !finite(rearEaseMeters)||rearEaseMeters<0||rearEaseMeters>.018||
   !pants?.stats?.independentSewnPattern||!pants.stats?.photoApplied||
   !Object.hasOwn(shaDenim,pants.stats.sourceId)||
   pants.stats.sourceSHA256!==shaDenim[pants.stats.sourceId]||
   pants.meshes.length!==1||!mesh.isSkinnedMesh||
   mesh.skeleton.bones.length!==163||
   !g.index||g.index.count<300||!p||p.count<400||
   fields.some(name=>g.getAttribute(name)?.count!==p.count)||
   !Array.isArray(shirt?.meshes)||!shirt.meshes.length||
   shirt.meshes.some(m=>!m.isSkinnedMesh||m.skeleton?.bones.length!==163))
  return reject('genuine-source-original-pants-or-shirt-unverified');
 const landmarks=pants.stats.landmarks?.map(x=>({
  hip:new T.Vector3(...x.hip),knee:new T.Vector3(...x.knee),
  ankle:new T.Vector3(...x.ankle)
 }));
 if(landmarks?.length!==2||
   landmarks.some(x=>[x.hip,x.knee,x.ankle].some(v=>
    !v.toArray().every(finite))||x.hip.y-x.knee.y<.2||
    x.knee.y-x.ankle.y<.17))
  return reject('original-source-hip-knee-ankle-missing');
 const bodies=[];root.traverse(m=>{
  if(m.isSkinnedMesh&&!m.userData.work56Garment)bodies.push(m);
 });
 if(!bodies.length||bodies.some(m=>m.skeleton?.bones.length!==163))
  return reject('actual-source-163-joint-body-missing');
 const originals=new Map(fields.concat('uv').filter(name=>g.getAttribute(name))
  .map(name=>[name,{attribute:g.getAttribute(name),data:g.getAttribute(name).array.slice()}]));
 const sourceIndex=g.index,oldIndices=sourceIndex.array.slice();
 const positionAttribute=p,normalAttribute=g.getAttribute('normal');
 if(!normalAttribute||normalAttribute.count!==p.count)
  return reject('original-source-normal-missing');
 const oldPosition=p.array.slice(),oldNormal=normalAttribute.array.slice(),oldMaterial=mesh.material;
 let bodyPose,shirtPose,pantsPose;
 const restore=()=>{
  p.array.set(oldPosition);normalAttribute.array.set(oldNormal);
  p.needsUpdate=normalAttribute.needsUpdate=true;
  g.computeBoundingBox();g.computeBoundingSphere();
 };
 const check=()=>{
  if(g!==mesh.geometry||p!==g.getAttribute('position')||
     normalAttribute!==g.getAttribute('normal')||
     sourceIndex!==g.index||mesh.material!==oldMaterial||
     !oldIndices.every((n,i)=>n===sourceIndex.array[i]))
   throw Error('source-denim-mesh-or-topology-mutation');
  for(const [name,record] of originals){
   const now=g.getAttribute(name);
   if(now!==record.attribute||now.array.length!==record.data.length||
     !record.data.every((n,i)=>Object.is(now.array[i],n)))
    throw Error('immutable-original-denim-pixel-uv-rest-skin-mutation');
  }
  const front=g.getAttribute('pantsSourceFront');
  for(let i=0;i<p.count;i++){
   if(front.getX(i)<.18)continue;
   for(let k=0;k<3;k++)if(!Object.is(p.array[i*3+k],oldPosition[i*3+k]))
    throw Error('photographed-original-front-vertex-position-mutation');
  }
 };
 try{
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  const map=new Map(),sourceFront=g.getAttribute('pantsSourceFront');
  for(const i of new Set(g.index.array)){
   if(!Number.isSafeInteger(i)||i<0||i>=p.count)
    throw Error('source-face-index-invalid');
   const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   if(!q.toArray().every(finite))throw Error('source-position-nonfinite');
   const k=key(q);
   if(!map.has(k))map.set(k,{q,ids:[],front:0});
   const node=map.get(k);node.ids.push(i);
   node.front=Math.max(node.front,sourceFront.getX(i));
  }
  const nodes=[...map.values()];
  if(nodes.length<300)return reject('insufficient-real-sourced-denim-surface');
  const bands=landmarks.map((leg,which)=>{
   const min=leg.knee.y+.05,max=leg.hip.y-.055,rows=new Map();
   for(const n of nodes){
    if((n.q.x>=0?0:1)!==which||n.front>=.18||
      n.q.y<min||n.q.y>max)continue;
    const t=(n.q.y-leg.knee.y)/(leg.hip.y-leg.knee.y);
    const center=lerp(leg.knee.x,leg.hip.x,t);
    const bin=Math.max(0,Math.floor((n.q.y-min)/.045));
    if(!rows.has(bin))rows.set(bin,{widths:[],backs:[]});
    const row=rows.get(bin);
    row.widths.push(Math.abs(n.q.x-center));
    row.backs.push(n.q.z);
   }
   const station=[...rows.entries()].filter(([,v])=>v.widths.length>=9)
    .map(([bin,v])=>({y:min+(bin+.5)*.045,
     outer:pct(v.widths,.84),rear:pct(v.backs,.12),
     sourceVertexSamples:v.widths.length}))
    .sort((a,b)=>a.y-b.y);
   if(station.length<4)throw Error('original-denim-rear-side-stations-insufficient');
   return {min,max,leg,station};
  });
  const changes=[],byLeg=[0,0];let protectedFront=0,maxShift=0;
  for(const n of nodes){
   if(n.front>=.18){protectedFront+=n.ids.length;continue;}
   const which=n.q.x>=0?0:1,band=bands[which],{leg,min,max}=band,q=n.q;
   if(q.y<min||q.y>max)continue;
   const row=band.station.reduce((best,current)=>
    Math.abs(current.y-q.y)<Math.abs(best.y-q.y)?current:best,band.station[0]);
   const t=(q.y-leg.knee.y)/(leg.hip.y-leg.knee.y);
   const center=lerp(leg.knee.x,leg.hip.x,t),radius=Math.abs(q.x-center);
   const span=smooth(q.y,min,min+.09)*(1-smooth(q.y,max-.09,max));
   // The source original sewn shell determines the side seam envelope.
   // At the back, *only* actual neutral source mesh is reshaped; no guessed
   // pocket details, new pants photograph, or unobserved texture.
   const side=smooth(radius,Math.max(.018,row.outer*.45),
    Math.max(.048,row.outer*.83));
   const rear=1-smooth(q.z-row.rear,.025,.145);
   const neutral=1-smooth(n.front,.025,.175);
   const outward=sideEaseMeters*span*side*neutral;
   const back=rearEaseMeters*span*rear*neutral;
   const delta=new T.Vector3(Math.sign(q.x)*outward,0,-back);
   const len=delta.length();
   if(len<.00035)continue;
   if(!finite(len)||len>.032)throw Error('source-denim-bounded-panel-exceeded');
   changes.push({n,delta});
   byLeg[which]+=n.ids.length;maxShift=Math.max(maxShift,len);
  }
  if(changes.length<85||byLeg.some(n=>n<25)||maxShift<.004||
    protectedFront<100)
   return reject('genuine-sourced-neutral-side-panel-not-substantive');
  bodyPose=posedSource84(bodies);shirtPose=posedSource84(shirt.meshes);
  pantsPose=posedSource84([mesh]);
  const oldBody=countSourceContacts84(pantsPose.g,bodyPose.g);
  const oldLayer=countSourceContacts84(pantsPose.g,shirtPose.g);
  let accepted=null;const trials=[];
  for(const amplitude of [1,.5,.25,.125]){
   if(amplitude*maxShift<.0028)break;
   restore();
   const inverse=mesh.matrixWorld.clone().invert();
   for(const {n,delta} of changes){
    const target=n.q.clone().addScaledVector(delta,amplitude).applyMatrix4(inverse);
    for(const i of n.ids)p.setXYZ(i,target.x,target.y,target.z);
   }
   p.needsUpdate=true;normals(g);check();
   const scene=posedSource84([mesh]);let newBody,newLayer;
   try{
    newBody=countSourceContacts84(scene.g,bodyPose.g);
    newLayer=countSourceContacts84(scene.g,shirtPose.g);
   }finally{scene.g.dispose();}
   const introducedBody=newPairs(oldBody,newBody),
    introducedLayer=newPairs(oldLayer,newLayer),
    depthWorsened=newBody.maxDepth>oldBody.maxDepth+.0005||
     newLayer.maxDepth>oldLayer.maxDepth+.0005;
   const trial=Object.freeze({amplitude,
    newlyIntroducedBodyTrianglePairs:introducedBody,
    newlyIntroducedShirtTrianglePairs:introducedLayer,
    bodyContactCount:newBody.count,shirtContactCount:newLayer.count,
    localPlaneDepthWorsened:depthWorsened});
   trials.push(trial);
   if(!introducedBody&&!introducedLayer&&!depthWorsened){
    accepted=trial;break;
   }
  }
  if(!accepted){restore();check();}
  return Object.freeze({...base,
   status:accepted?'SAMPLED_SOURCE_PANEL_CONTACT_NONWORSENING_ONLY':'REFUSED_NEW_CONTACT',
   trialApplied:!!accepted,sourceGeometryRestored:!accepted,
   sourceId:pants.stats.sourceId,
   avatar,sourceMeasuredNeutralSideStations:bands.map(x=>x.station.length),
   sourceNeutralRearSideVerticesCandidate:changes.length,
   movedSourceVertexReferences:accepted?byLeg.reduce((a,b)=>a+b,0):0,
   sourceOriginalPhotographFrontProtectedReferences:protectedFront,
   maxAppliedWorldShiftMeters:accepted?maxShift*accepted.amplitude:0,
   selectedSourcePanelAmplitude:accepted?.amplitude??0,
   bodyCrossingPairsBefore:oldBody.count,
   shirtCrossingPairsBefore:oldLayer.count,
   newlyIntroducedBodyTrianglePairs:accepted?.newlyIntroducedBodyTrianglePairs??
    trials[0]?.newlyIntroducedBodyTrianglePairs??0,
   newlyIntroducedShirtTrianglePairs:accepted?.newlyIntroducedShirtTrianglePairs??
    trials[0]?.newlyIntroducedShirtTrianglePairs??0,
   firstFullAmplitudeIntroducedBodyPairs:trials[0]?.newlyIntroducedBodyTrianglePairs??0,
   firstFullAmplitudeIntroducedShirtPairs:trials[0]?.newlyIntroducedShirtTrianglePairs??0,
   attemptedSourceAmplitudes:trials,
   requestedSideEaseMeters:sideEaseMeters,requestedRearEaseMeters:rearEaseMeters
  });
 }catch(e){
  restore();check();
  const reasons=new Set(['source-face-index-invalid','source-position-nonfinite',
   'original-denim-rear-side-stations-insufficient','source-denim-bounded-panel-exceeded']);
  return reject(reasons.has(e.message)?e.message:'actual-skinned-source-contact-evaluation-failed');
 }finally{
  bodyPose?.g.dispose();shirtPose?.g.dispose();pantsPose?.g.dispose();
 }
}
