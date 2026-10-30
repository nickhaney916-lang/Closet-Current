/** 3D46 research/HOLD: reprofile the outer cloth SHOULDER silhouette.
 * The 3D45 cap is already a physically separate skinned garment component.
 * Move its shared yoke seam AND matching torso shell vertices together, using
 * source-rig landmarks and a symmetric eased textile profile. Never move
 * original source panel attributes, UV projections, bone weights, body or jeans.
 *
 * Not cloth dynamics or all-pose signed collision certification.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const sm=T.MathUtils.smoothstep;
const k=p=>p.toArray().map(v=>v.toFixed(5)).join(':');
export function reprofileIndependentShoulderSilhouette(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.independentArmholeCapPanels||!shirt.stats?.sourceVerifiedUpperSleeveTailoring)
  throw Error('3D46 requires genuinely separate source-true skinned 3D45 shoulder caps');
 root.updateMatrixWorld(true);
 const arms=['L','R'].map(side=>{
  let shoulder;root.traverse(o=>{if(o.isBone&&o.name==='upperarm01'+side)shoulder=o;});
  if(!shoulder)throw Error('Original anatomical shoulder joint missing '+side);
  return {side,q:shoulder.getWorldPosition(new T.Vector3())};
 });
 const meshes=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell'||m.userData.work45IndependentShoulderCap);
 if(!meshes.some(m=>m.userData.work45IndependentShoulderCap==='L')||
    !meshes.some(m=>m.userData.work45IndependentShoulderCap==='R'))throw Error('3D46 requires distinct left/right real shirt shoulder meshes');
 const groups=new Map(),attributes=new Map();
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position');
  const protectedNames=['panelPosition','panelNormal','skinIndex','skinWeight'];
  if(!p||protectedNames.some(name=>g.getAttribute(name)?.count!==p.count))throw Error('Original garment photo/rig vertex attributes unavailable');
  attributes.set(mesh,protectedNames.map(name=>({name,bytes:g.getAttribute(name).array.slice()})));
  for(let i=0;i<p.count;i++){
   const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),name=k(q);
   if(!groups.has(name))groups.set(name,{q,refs:[]});
   groups.get(name).refs.push({mesh,index:i});
  }
 }
 const count={L:{vertices:0,capVertices:0,torsoVertices:0,max:0},R:{vertices:0,capVertices:0,torsoVertices:0,max:0}};
 let changed=0,maxMove=0,seamGroups=0,seamGap=0,protectedFront=0;
 for(const g of groups.values()){
  const q=g.q,x=Math.abs(q.x);
  if(x<.275){protectedFront+=g.refs.length;continue;}
  if(x>.64)continue;
  const arm=arms.find(a=>Math.sign(a.q.x)===Math.sign(q.x));
  if(!arm)continue;
  const t=(q.y-arm.q.y);
  // Continuous shape: retain the actual source neckline/upper chest, flatten
  // the inflated deltoid shoulder peak and fold excess outer material into
  // the upper sleeve. Close seam coordinates EXACTLY, no synthetic photo.
  const xFade=sm(x,.275,.35)*(1-sm(x,.52,.64));
  const yFade=sm(t,-.115,.025)*(1-sm(t,.16,.23));
  const amount=xFade*yFade;
  if(amount<.09)continue;
  const shoulderLine=arm.q.y+.055-.07*sm(x,.31,.53);
  const over=Math.max(0,q.y-shoulderLine);
  const lower=(.017+Math.min(.025,over*.55))*amount;
  const inward=.024*amount;
  const delta=new T.Vector3(-Math.sign(q.x)*inward,-lower,0);
  const len=delta.length();
  if(len<.002)continue;
  if(len>.047)throw Error('3D46 original shoulder source profile moved outside bounded garment envelope');
  const post=g.q.clone().add(delta);
  for(const {mesh,index} of g.refs){
   const p=mesh.geometry.getAttribute('position');
   const local=post.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
   p.setXYZ(index,local.x,local.y,local.z);
   const d=count[arm.side];d.vertices++;
   if(mesh.userData.work45IndependentShoulderCap)d.capVertices++;else d.torsoVertices++;
   d.max=Math.max(d.max,len);
   changed++;
  }
  maxMove=Math.max(maxMove,len);
  if(new Set(g.refs.map(r=>r.mesh)).size>1){
   seamGroups++;
   const match=g.refs.map(r=>new T.Vector3().fromBufferAttribute(r.mesh.geometry.getAttribute('position'),r.index).applyMatrix4(r.mesh.matrixWorld));
   for(const m of match)seamGap=Math.max(seamGap,m.distanceTo(match[0]));
  }
 }
 for(const mesh of meshes){
  const g=mesh.geometry,p=g.getAttribute('position');
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const {name,bytes} of attributes.get(mesh)){
   const current=g.getAttribute(name).array;
   if(current.length!==bytes.length||!current.every((v,i)=>v===bytes[i]))
    throw Error('3D46 original garment source photograph coordinate or rig changed: '+name);
  }
 }
 if(changed<80||maxMove<.008||maxMove>.047||seamGap>5e-5||arms.some(a=>count[a.side].capVertices<20||count[a.side].torsoVertices<10))
  throw Error('3D46 natural bilateral cloth-shoulder profile incomplete '+JSON.stringify({changed,maxMove,seamGap,count,seamGroups,protectedFront}));
 return {...shirt,stats:{...shirt.stats,
   independentShoulderClothContour:true,
   shoulderContourEditedVertices:changed,
   shoulderContourMaximumMove:maxMove,
   shoulderContourSeamGroups:seamGroups,
   shoulderContourMaximumSeamGap:seamGap,
   shoulderContourProtectedFrontVertices:protectedFront,
   shoulderContourBySide:count,
   shoulderContourMethod:'source-rig deltoid crest reprofiling over genuine separate cap/yoke geometry with identical shared-seam movement',
   originalPhotographicSourcePixelsAndUVUnchanged:true,
   originalShirtRigWeightsUnchanged:true,
   bodyGeometryAndOriginalDenimUnchanged:true,
   fullSignedCollisionValidated:false,
   continuousSweptCollisionValidated:false,
   humanVisualApproved:false,
   releaseAuthorized:false}};
}
