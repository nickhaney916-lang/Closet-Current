/**
 * PARALLEL #84 / HOLD — source-bone shoulder-yoke A/B realism research.
 *
 * Genuine P541 photographed-shirt, separately sewn THREE.SkinnedMesh garment
 * and actual licensed 163-bone anatomical body. Never invents photographed
 * rear cloth or changes original JPEG, source RGB, front UV, skin, GLB or
 * private wardrobe. Bounded reversible trial, NOT physics/realism approval.
 *
 * ONLY a disposable P541 donor calls this after existing garment/pose fits.
 * A changed sample is admitted to the research preview IFF it introduces no
 * newly witnessed real posed body contacts or shirt/jeans contacts. It does
 * not certify baseline collision freedom, continuing motion or appearance.
 */
import * as T from 'three';
import {posedGeometry,triangleContacts} from '../three-d-42/posed-contact.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const SHA='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const protectedAttributes=['panelPosition','panelNormal','skinIndex','skinWeight','uv'];
const code=reason=>({
 schema:'parallel84-source-bone-shoulder-yoke/v1',status:'REFUSED_UNCHANGED',
 reason,trialApplied:false,sourcePhotoPreserved:true,
 sourceSkinUVPreserved:true,originalBodyUnchanged:true,
 originalGarmentMeshTopologyUnchanged:true,
 newBodyContactsNotAllowed:true,newLayerContactsNotAllowed:true,
 sourceBackUnphotographed:true,continuousClothPhysicsValidated:false,
 humanVisualRealismApproved:false,releaseAuthorized:false
});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point84=(m,i)=>{
 const attr=m.geometry.getAttribute('position');
 return new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(m.matrixWorld);
};
const key84=p=>p.toArray().map(x=>x.toFixed(5)).join('|');
function contactCount(source,target){
 const audit=triangleContacts(source,target,{collect:true});
 return {count:audit.count,pairs:new Set(audit.pairs.map(p=>p.i+'|'+p.j)),
  maxDepth:audit.maximumLocalOrientedFaceDepth};
}
const newPairs=(before,after)=>{
 let newly=0;for(const id of after.pairs)if(!before.pairs.has(id))newly++;
 return newly;
};
export function trialSourceBoneShoulderYoke84({
 shirt,pants,root,avatar,requestedDropMeters=.014,enabled=true
}={}){
 if(!enabled)return code('opt-out');
 const initial=code('source-or-geometry-unverified');
 if(!['male','female'].includes(avatar)||!root?.isObject3D||
    !finite(requestedDropMeters)||requestedDropMeters<.003||
    requestedDropMeters>.025||
    shirt?.stats?.sourceSHA256!==SHA||
    shirt.stats?.trueSourceShoulderTopSlope!==true||
    shirt.stats?.sourceRigNaturalShoulderFall!==true||
    !Array.isArray(shirt?.meshes)||shirt.meshes.length<3||
    !Array.isArray(pants?.meshes)||pants.meshes.length!==1||
    pants.stats?.photoApplied!==true||
    !pants.stats?.sourceSHA256||
    !/^[a-f0-9]{64}$/.test(pants.stats.sourceSHA256)||
    pants.meshes[0]?.skeleton?.bones?.length!==163)
  return initial;
 const meshes=shirt.meshes.filter(m=>m?.isSkinnedMesh&&
  (m.name==='Work56-independent-shirt-shell'||m.userData.work45IndependentShoulderCap));
 if(!meshes.some(m=>m.userData.work45IndependentShoulderCap==='L')||
    !meshes.some(m=>m.userData.work45IndependentShoulderCap==='R')||
    !meshes.some(m=>m.name==='Work56-independent-shirt-shell')||
    meshes.some(m=>m.skeleton?.bones?.length!==163))
  return code('real-two-sided-source-shoulder-panels-required');
 const bones={};root.updateMatrixWorld(true);
 root.traverse(b=>{
  if(b.isBone&&['upperarm01L','upperarm01R'].includes(b.name))
   bones[b.name.slice(-1)]=b.getWorldPosition(new T.Vector3());
 });
 if(!bones.L||!bones.R||Math.sign(bones.L.x)===Math.sign(bones.R.x))
  return code('two-source-shoulder-bones-missing');
 const bodies=[];root.traverse(m=>{
  if(m.isSkinnedMesh&&!m.userData.work56Garment)bodies.push(m);
 });
 if(bodies.length<1||bodies.some(m=>m.skeleton?.bones?.length!==163))
  return code('genuine-source-anatomical-body-missing');
 const snapshot=new Map();
 let bodyPose,originalShirt,originalPants;
 const restore=()=>{
  for(const [m,s] of snapshot){
   const g=m.geometry,p=g.getAttribute('position'),normal=g.getAttribute('normal');
   p.array.set(s.position);p.needsUpdate=true;
   if(s.normal&&normal?.array.length===s.normal.length)
    {normal.array.set(s.normal);normal.needsUpdate=true;}
   g.computeBoundingBox();g.computeBoundingSphere();
  }
 };
 const auditIntegrity=()=>{
  for(const [m,s] of snapshot){
   const g=m.geometry;
   if(g!==s.geometry||g.index!==s.index||m.material!==s.material||
      g.getAttribute('position')!==s.positionAttribute||
      g.getAttribute('normal')!==s.normalAttribute)
    throw Error('source-mesh-object-or-topology-mutation');
   if(s.indexArray&&(!g.index||s.indexArray.length!==g.index.array.length||
     !s.indexArray.every((n,i)=>n===g.index.array[i])))
    throw Error('original-face-index-mutation');
   for(const [name,record] of s.protected){
    const now=g.getAttribute(name);
    if(now!==record.attribute||now.array.length!==record.bytes.length||
       !record.bytes.every((n,i)=>Object.is(now.array[i],n)))
     throw Error('original-photograph-source-or-skin-mutation');
   }
  }
 };
 try{
  const groups=new Map();
  for(const m of meshes){
   m.updateWorldMatrix(true,false);m.skeleton.update();
   const g=m.geometry,position=g.getAttribute('position'),normal=g.getAttribute('normal'),ix=g.index;
   if(!position||!normal||!ix||ix.count<3||
      protectedAttributes.slice(0,4).some(n=>g.getAttribute(n)?.count!==position.count)||
      (g.getAttribute('uv')&&g.getAttribute('uv').count!==position.count))
    return code('source-panel-uv-or-geometry-attributes-missing');
   const protectedRows=new Map(protectedAttributes.filter(n=>g.getAttribute(n)).
    map(n=>[n,{attribute:g.getAttribute(n),bytes:g.getAttribute(n).array.slice()}]));
   snapshot.set(m,{
    geometry:g,positionAttribute:position,normalAttribute:normal,
    position:position.array.slice(),normal:normal.array.slice(),
    protected:protectedRows,index:ix,indexArray:ix.array.slice(),material:m.material
   });
   const used=new Set(ix.array);
   for(const i of used){
    if(!Number.isSafeInteger(i)||i<0||i>=position.count)
     throw Error('invalid-original-source-face-index');
    const world=point84(m,i);
    if(!world.toArray().every(finite))throw Error('source-world-nonfinite');
    const id=key84(world);
    if(!groups.has(id))groups.set(id,{world,refs:[]});
    groups.get(id).refs.push([m,i]);
   }
  }
  const move=new Map(),stats={L:{caps:0,shells:0,moved:0,maxShift:0},R:{caps:0,shells:0,moved:0,maxShift:0}};
  let protectedPrintedChest=0,maximum=0,sampleCandidate=0;
  const seamSource={L:0,R:0};
  for(const item of groups.values()){
   const q=item.world,x=Math.abs(q.x),
    side=Math.sign(q.x)===Math.sign(bones.L.x)?'L':'R';
   const hasCap=item.refs.some(([m])=>m.userData.work45IndependentShoulderCap),
    hasShell=item.refs.some(([m])=>m.name==='Work56-independent-shirt-shell');
   if(hasCap&&hasShell)seamSource[side]++;
   if(x<=.26){protectedPrintedChest+=item.refs.length;continue;}
   // The A-pose shoulder bone and ORIGINAL fitted cloth give the actual
   // anatomy; this is not an arbitrary fake outer sleeve or printed front.
   // Constrain the upper-yoke band, leave distal cuffs, waist and neck.
   const dy=q.y-bones[side].y;
   if(x>=.595||dy<=-.26||dy>=.23)continue;
   const across=smooth(x,.26,.34)*(1-smooth(x,.485,.595));
   const high=smooth(dy,-.26,-.145)*(1-smooth(dy,.115,.23));
   const weight=across*high;
   if(weight<.065)continue;
   // Soften source yoke into the real upper-arm hang. A tiny OUTWARD
   // component avoids collapsing material into the deltoid. No fictive
   // reverse-photo color is added. All shared seam vertices move jointly.
   const drop=requestedDropMeters*(.55+.45*smooth(dy,-.10,.10))*weight;
   const outward=.0025*weight;
   const delta=new T.Vector3(Math.sign(q.x)*outward,-drop,0);
   const magnitude=delta.length();
   if(magnitude<.0004)continue;
   if(!finite(magnitude)||magnitude>.0255)
    throw Error('source-cloth-shoulder-movement-cap-exceeded');
   const target=q.clone().add(delta);
   move.set(item,target);
   sampleCandidate+=item.refs.length;maximum=Math.max(maximum,magnitude);
   for(const [m] of item.refs){
    stats[side].moved++;stats[side].maxShift=Math.max(stats[side].maxShift,magnitude);
    if(m.userData.work45IndependentShoulderCap)stats[side].caps++;
    else stats[side].shells++;
   }
  }
  if(sampleCandidate<24||maximum<.003||
     protectedPrintedChest<100||
     ['L','R'].some(s=>stats[s].caps<5||stats[s].shells<5||seamSource[s]<3))
   return code('source-bone-yoke-envelope-not-substantive');
  bodyPose=posedGeometry(bodies);
  originalShirt=posedGeometry(shirt.meshes);
  originalPants=posedGeometry(pants.meshes);
  const oldBody=contactCount(originalShirt.g,bodyPose.g);
  const oldLayer=contactCount(originalShirt.g,originalPants.g);
  // Actual full original-face, true skinned body+layer intersection sets,
  // not a made-up silhouette metric, drive bounded refusal/rollback.
  for(const [item,target] of move){
   for(const [m,i] of item.refs){
    const local=target.clone().applyMatrix4(m.matrixWorld.clone().invert());
    m.geometry.getAttribute('position').setXYZ(i,local.x,local.y,local.z);
   }
  }
  const seamGaps=[];
  for(const item of groups.values()){
   if(new Set(item.refs.map(v=>v[0])).size<2)continue;
   const actual=item.refs.map(([m,i])=>point84(m,i));
   for(const p of actual.slice(1))seamGaps.push(p.distanceTo(actual[0]));
  }
  const largestGap=seamGaps.length?Math.max(...seamGaps):0;
  for(const m of meshes){
   const g=m.geometry,p=g.getAttribute('position');
   p.needsUpdate=true;g.computeVertexNormals();
   smoothSurfaceNormals(g,p.count);
   g.computeBoundingBox();g.computeBoundingSphere();
  }
  auditIntegrity();
  if(!finite(largestGap)||largestGap>5e-5)
   throw Error('original-shoulder-seam-not-coincident');
  const candidate=posedGeometry(shirt.meshes);
  let newBody,newLayer;
  try{
   newBody=contactCount(candidate.g,bodyPose.g);
   newLayer=contactCount(candidate.g,originalPants.g);
  }finally{candidate.g.dispose();}
  const introducedBody=newPairs(oldBody,newBody);
  const introducedLayer=newPairs(oldLayer,newLayer);
  const base=Object.freeze({
   schema:'parallel84-source-bone-shoulder-yoke/v1',
   avatar,requestedDropMeters,
   movedOriginalRenderedVertices:sampleCandidate,
   maxShoulderWorldDisplacementMeters:maximum,
   protectedFrontCenterOriginalVertices:protectedPrintedChest,
   actualSeamMaxWorldGapMeters:largestGap,
   shoulderCounts:stats,seamSourceWitnesses:seamSource,
   bodyCrossingPairsBefore:oldBody.count,
   bodyCrossingPairsTrial:newBody.count,
   newlyIntroducedBodyTrianglePairs:introducedBody,
   layerCrossingPairsBefore:oldLayer.count,
   layerCrossingPairsTrial:newLayer.count,
   newlyIntroducedLayerTrianglePairs:introducedLayer,
   sourcePhotoPreserved:true,sourceSkinUVPreserved:true,
   originalBodyUnchanged:true,originalGarmentMeshTopologyUnchanged:true,
   newBodyContactsNotAllowed:true,newLayerContactsNotAllowed:true,
   sourceBackUnphotographed:true,
   continuousClothPhysicsValidated:false,
   humanVisualRealismApproved:false,
   releaseAuthorized:false
  });
  if(introducedBody||introducedLayer||
     newBody.maxDepth>oldBody.maxDepth+.0005||
     newLayer.maxDepth>oldLayer.maxDepth+.0005){
   restore();auditIntegrity();
   return Object.freeze({...base,status:'REFUSED_NEW_CONTACT',
    trialApplied:false,sourceGeometryRestored:true});
  }
  return Object.freeze({...base,status:'SAMPLED_CONTACT_NONWORSENING_ONLY',
   trialApplied:true,sourceGeometryRestored:false});
 }catch(e){
  restore();
  // Only vetted internal codes, never original owner tokens/face locations.
  const allowed=new Set(['source-mesh-object-or-topology-mutation',
   'original-face-index-mutation','original-photograph-source-or-skin-mutation',
   'invalid-original-source-face-index','source-world-nonfinite',
   'source-cloth-shoulder-movement-cap-exceeded',
   'original-shoulder-seam-not-coincident']);
  return code(allowed.has(e?.message)?e.message:'source-pose-contact-audit-failed');
 }finally{
  bodyPose?.g.dispose();originalShirt?.g.dispose();originalPants?.g.dispose();
 }
}
