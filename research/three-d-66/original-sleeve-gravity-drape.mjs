/** Closet Current 3D-66 — independently skinned real photographed UPPER
 * sleeve textile articulation, after source-true 3D-64 shoulder crest.
 * Actual 163-joint shoulder/elbow axis determines relaxed gravity folds.
 * No baked/artificial texture, fabricated rear photo, avatar/body edits,
 * changed UV/source RGB/skin, or synthesized customer garment.
 *
 * This is opt-in, bounded quasi-static shaping, not a cloth simulator.
 * Swept collision, human aesthetic and physical-device acceptance: HOLD.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const smooth=THREE.MathUtils.smoothstep;
const srcAttrs=['panelPosition','panelNormal','skinIndex','skinWeight','uv'];
const key=v=>v.toArray().map(x=>x.toFixed(5)).join(':');

export function articulateOriginalUpperSleeveDrape(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.trueSourceShoulderTopSlope||
    !shirt?.stats?.independentArmholeCapPanels||
    !shirt?.stats?.sourceMeasuredNaturalSleeveHang)
  throw Error('3D66 requires real source-photographed 3D64 skinned original shirt, sewn caps and verified 3D55 sleeve');
 root.updateMatrixWorld(true);
 const arms={};
 for(const side of ['L','R']){
  const locate=(name)=>{
   let o;root.traverse(b=>{if(b.isBone&&b.name===name+side)o=b;});
   if(!o)throw Error('3D66 missing original anatomical 163-joint '+name+side);
   return o.getWorldPosition(new THREE.Vector3());
  };
  const shoulder=locate('upperarm01'),elbow=locate('lowerarm01');
  const axis=elbow.clone().sub(shoulder),len2=axis.lengthSq();
  if(len2<.018||len2>.35)throw Error('3D66 authentic upper-arm joint segment is nonanatomical');
  arms[side]={shoulder,elbow,axis,len2};
 }
 const meshes=shirt.meshes.filter(m=>m.isSkinnedMesh&&
  (m.name==='Work56-independent-shirt-shell'||m.userData.work45IndependentShoulderCap));
 if(!['L','R'].every(s=>meshes.some(m=>m.userData.work45IndependentShoulderCap===s))||
    !meshes.some(m=>m.name==='Work56-independent-shirt-shell'))
  throw Error('3D66 original seam-stitched bilateral cap and shell meshes unavailable');
 const groups=new Map(),snapshots=new Map();
 let protectedFront=0, protectedCuffs=0;
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),idx=g.index;
  if(!p||!idx||idx.count<3)throw Error('3D66 original indexed source garment triangles missing');
  const source=new Map();
  for(const name of srcAttrs){
   const attr=g.getAttribute(name);
   if(name==='uv'&&!attr)continue;
   if(!attr||attr.count!==p.count)
    throw Error('3D66 original source photo/UV or skinned weights unavailable '+name);
   source.set(name,attr.array.slice());
  }
  snapshots.set(mesh,source);
  const rendered=new Set();
  for(let j=0;j<idx.count;j++){
   const i=idx.getX(j);
   if(!Number.isInteger(i)||i<0||i>=p.count)throw Error('3D66 source triangle index invalid');
   rendered.add(i);
  }
  for(const i of rendered){
   const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('3D66 nonfinite original shirt');
   if(Math.abs(q.x)<.30)protectedFront++;
   const k=key(q);
   if(!groups.has(k))groups.set(k,{q,refs:[]});
   groups.get(k).refs.push({mesh,i});
  }
 }
 const stat={L:{capVertices:0,shellVertices:0,upperFold:0,lowerFold:0,max:0},
             R:{capVertices:0,shellVertices:0,upperFold:0,lowerFold:0,max:0}};
 let moved=0,maxMove=0,seamGap=0,sourceSeamWitnesses={L:0,R:0}, gravityTotal=0;
 for(const {q,refs} of groups.values()){
  const side=Math.sign(q.x)===Math.sign(arms.L.shoulder.x)?'L':'R',
    arm=arms[side],x=Math.abs(q.x);
  if(refs.some(r=>r.mesh.userData.work45IndependentShoulderCap)&&
     refs.some(r=>r.mesh.name==='Work56-independent-shirt-shell'))
   sourceSeamWitnesses[side]++;
  if(x<=.315){protectedFront+=refs.length;continue;}
  const t=q.clone().sub(arm.shoulder).dot(arm.axis)/arm.len2;
  // Only original upper-arm cloth. Protect shoulder neckline/crest and
  // original elbow/cuff; distal forearm belongs to independent 3D55 folds.
  if(t<=.16||t>=.84){protectedCuffs+=refs.length;continue;}
  const near=arm.shoulder.clone().addScaledVector(arm.axis,t);
  const r=q.distanceTo(near);
  if(r<.028||r>.235)continue;
  const taper=smooth(t,.16,.28)*(1-smooth(t,.72,.84));
  const radial=smooth(r,.028,.063)*(1-smooth(r,.195,.235));
  const weight=taper*radial;
  if(weight<.1)continue;
  // One broad sleeve easing fold follows the real upper-arm axis; the
  // second staggered fold is weaker. This is actual skinned cloth movement,
  // not a fake shadow, noise texture, or symmetrical painted creases.
  const upper=Math.exp(-Math.pow((t-.37)/.17,2));
  const lower=Math.exp(-Math.pow((t-.66)/.13,2));
  const amount=weight*(.0055*upper+.0033*lower);
  if(amount<.00035)continue;
  // Outward from the anatomical limb on x, with a small draping gravity
  // sag. NOT an inward squeeze into the body; preserve collision clearance.
  const outward=Math.sign(q.x)*amount;
  const gravity=-Math.min(.0026,amount*.34);
  const zEase=Math.sign(q.z-near.z)*Math.min(.0014,amount*.22)*smooth(Math.abs(q.z-near.z),.035,.12);
  const shift=new THREE.Vector3(outward,gravity,zEase);
  const len=shift.length();
  if(!Number.isFinite(len)||len>.01001)throw Error('3D66 bounded garment upper sleeve exceeded 10mm');
  const target=q.clone().add(shift);
  for(const {mesh,i} of refs){
   const local=target.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
   mesh.geometry.getAttribute('position').setXYZ(i,local.x,local.y,local.z);
   moved++;
   const st=stat[side];
   if(mesh.userData.work45IndependentShoulderCap)st.capVertices++;
   else st.shellVertices++;
   if(upper>=lower)st.upperFold++;else st.lowerFold++;
   st.max=Math.max(st.max,len);
  }
  gravityTotal+=Math.abs(gravity)*refs.length;
  maxMove=Math.max(maxMove,len);
 }
 for(const {refs} of groups.values()){
  if(new Set(refs.map(r=>r.mesh)).size<=1)continue;
  const first=refs[0];
  const ref=new THREE.Vector3().fromBufferAttribute(first.mesh.geometry.getAttribute('position'),first.i).applyMatrix4(first.mesh.matrixWorld);
  for(const {mesh,i} of refs.slice(1)){
   const pos=new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'),i).applyMatrix4(mesh.matrixWorld);
   seamGap=Math.max(seamGap,ref.distanceTo(pos));
  }
 }
 for(const mesh of meshes){
  const geo=mesh.geometry,p=geo.getAttribute('position');p.needsUpdate=true;
  geo.computeVertexNormals();smoothSurfaceNormals(geo,p.count);
  geo.computeBoundingBox();geo.computeBoundingSphere();
  for(const [name,bytes] of snapshots.get(mesh)){
   const after=geo.getAttribute(name)?.array;
   if(!after||after.length!==bytes.length||!after.every((v,i)=>v===bytes[i]))
    throw Error('3D66 illegally changed original photo/UV/anatomy skin source: '+name);
  }
 }
 if(moved<60||protectedFront<100||maxMove<.002||maxMove>.01001||
    gravityTotal<.02||seamGap>5e-5||!Number.isFinite(seamGap)||
    ['L','R'].some(s=>stat[s].capVertices<10||stat[s].shellVertices<10||
      stat[s].upperFold<8||stat[s].lowerFold<8||sourceSeamWitnesses[s]<3))
  throw Error('3D66 source-true natural upper sleeve fall insufficient or unsafe '+JSON.stringify({
   moved,maxMove,gravityTotal,seamGap,protectedFront,protectedCuffs,sourceSeamWitnesses,stat
  }));
 return {...shirt,stats:{...shirt.stats,
  sourceArticulatedUpperSleeveDrape:true,
  upperSleeveDrapeMovedOriginalVertices:moved,
  upperSleeveDrapeMaxMove:maxMove,
  upperSleeveDrapeGravityTotal:gravityTotal,
  upperSleeveDrapeSeamGap:seamGap,
  upperSleeveDrapeBySide:stat,
  upperSleeveDrapeShoulderJointsVerified:true,
  originalPhotoUVSkinAndColorUnmodified:true,
  upperSleeveDrapeMethod:'real 163-joint source upper-arm axis + bounded gravity/ease folds of real independently skinned photographed cap/shell',
  physicalPhonesApproved:false,continuousClothCollisionCertified:false,
  humanPhotorealismApproved:false,releaseAuthorized:false
 }};
}
