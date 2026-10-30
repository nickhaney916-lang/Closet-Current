/** 3D54 research only. Rounded textile shoulder crest plus a sewn, continuous
 * cap/shell shading field. Original photo coordinates, UVs, skin and triangles
 * stay intact. The actual posed contact solver still runs after construction.
 * Bounded tailoring, not cloth physics or continuous collision certification. */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const sm=T.MathUtils.smoothstep;
const key=q=>q.toArray().map(v=>v.toFixed(5)).join(':');
const cloth=shirt=>shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell'||m.userData.work45IndependentShoulderCap);
function groupsFor(meshes){
 const groups=new Map();
 for(const mesh of meshes){mesh.updateWorldMatrix(true,false);const p=mesh.geometry.attributes.position;
  const used=new Set(mesh.geometry.index.array);
  for(const i of used){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),k=key(q);
   if(!groups.has(k))groups.set(k,{q,refs:[],neighbors:new Set()});groups.get(k).refs.push({mesh,i});}
 }
 return groups;
}
export function roundShoulderSleeveTransition(shirt,root){
 if(!shirt?.stats?.upperArmFabricVolumeTailored)throw Error('3D54 requires verified independent upper-arm construction');
 root.updateMatrixWorld(true);const meshes=cloth(shirt),groups=groupsFor(meshes),arms={};
 root.traverse(o=>{if(o.isBone&&/^upperarm01[LR]$/.test(o.name))arms[o.name.slice(-1)]=o.getWorldPosition(new T.Vector3());});
 if(!arms.L||!arms.R)throw Error('3D54 missing original anatomical shoulder landmarks');
 const original=new Map([...groups].map(([k,g])=>[k,g.q.clone()]));
 for(const mesh of meshes){const p=mesh.geometry.attributes.position,ix=mesh.geometry.index;
  for(let t=0;t<ix.count;t+=3){const keys=[0,1,2].map(j=>key(new T.Vector3().fromBufferAttribute(p,ix.getX(t+j)).applyMatrix4(mesh.matrixWorld)));
   for(let j=0;j<3;j++)for(let h=0;h<3;h++)if(j!==h&&keys[j]!==keys[h])groups.get(keys[j]).neighbors.add(keys[h]);}
 }
 const perSide={L:{cap:0,torso:0,moved:0},R:{cap:0,torso:0,moved:0}};let max=0;
 // Tighten the high shoulder crest before rounding local polygonal transitions.
 // Keep neck/chest print, cuff and lower torso outside the edit region.
 for(const g of groups.values()){
  const x=Math.abs(g.q.x),side=g.q.x<0?'R':'L',a=arms[side];
  const crest=sm(x,.145,.195)*(1-sm(x,Math.abs(a.x)+.035,Math.abs(a.x)+.115))*
   sm(g.q.y-a.y,.025,.075)*(1-sm(g.q.y-a.y,.125,.19));
  g.q.y-=.024*crest;
 }
 for(let pass=0;pass<3;pass++){
  const next=new Map();
  for(const [k,g] of groups){const q=g.q,x=Math.abs(q.x),a=arms[q.x<0?'R':'L'];
   const weight=sm(x,.155,.215)*(1-sm(x,.43,.52))*sm(q.y-a.y,-.34,-.22)*(1-sm(q.y-a.y,.12,.20));
   if(weight<=0||g.neighbors.size<3)continue;
   const mean=new T.Vector3();for(const n of g.neighbors)mean.add(groups.get(n).q);mean.multiplyScalar(1/g.neighbors.size);
   const delta=mean.sub(q).multiplyScalar(.30*weight);delta.clampLength(0,.004);
   const target=q.clone().add(delta),move=target.clone().sub(original.get(k)).clampLength(0,.028);
   next.set(k,original.get(k).clone().add(move));
  }
  for(const [k,q] of next)groups.get(k).q.copy(q);
 }
 for(const [k,g] of groups){const distance=g.q.distanceTo(original.get(k));if(distance<1e-7)continue;
  const side=g.q.x<0?'R':'L';max=Math.max(max,distance);
  for(const {mesh,i} of g.refs){const p=mesh.geometry.attributes.position,v=g.q.clone().applyMatrix4(mesh.matrixWorld.clone().invert());p.setXYZ(i,v.x,v.y,v.z);perSide[side].moved++;perSide[side][mesh.userData.work45IndependentShoulderCap?'cap':'torso']++;}
 }
 if(!Number.isFinite(max)||max>.02801||max<.002||Object.values(perSide).some(s=>s.cap<5||s.torso<5))throw Error('3D54 missing actual bilateral bounded tailoring '+JSON.stringify({max,perSide}));
 for(const m of meshes){m.geometry.attributes.position.needsUpdate=true;m.geometry.computeVertexNormals();smoothSurfaceNormals(m.geometry,m.geometry.attributes.position.count);m.geometry.computeBoundingBox();m.geometry.computeBoundingSphere();}
 return {...shirt,stats:{...shirt.stats,roundedShoulderSleeveTransition:true,shoulder54MaxMove:max,shoulder54BySide:perSide,humanVisualApproved:false,continuousFabricMotionCertified:false,releaseAuthorized:false}};
}
/** Recompute a common rest-space seam normal AFTER each actual contact solve.
 * Never weld mesh topology, alter weights, or conceal a physical gap. */
export function joinShoulderSeamNormals(shirt,root){
 root.updateMatrixWorld(true);const groups=groupsFor(cloth(shirt));let joined=0;const bySide={L:0,R:0};
 for(const g of groups.values()){
  if(!g.refs.some(r=>r.mesh.userData.work45IndependentShoulderCap)||!g.refs.some(r=>!r.mesh.userData.work45IndependentShoulderCap))continue;
  const n=new T.Vector3();for(const {mesh,i} of g.refs)n.add(new T.Vector3().fromBufferAttribute(mesh.geometry.attributes.normal,i).applyMatrix3(new T.Matrix3().getNormalMatrix(mesh.matrixWorld)).normalize());
  if(n.lengthSq()<1e-10)throw Error('3D54 invalid shared shoulder seam normal');n.normalize();
  for(const {mesh,i} of g.refs){const local=n.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(mesh.matrixWorld).invert()).normalize();mesh.geometry.attributes.normal.setXYZ(i,local.x,local.y,local.z);mesh.geometry.attributes.normal.needsUpdate=true;}joined++;for(const side of ['L','R'])if(g.refs.some(r=>r.mesh.userData.work45IndependentShoulderCap===side))bySide[side]++;
 }
 if(joined<6||bySide.L<3||bySide.R<3)throw Error('3D54 real sewn cap/shell shading witnesses missing');
 shirt.stats.shoulder54JoinedNormalGroups=joined;shirt.stats.shoulder54SeamNormalGroupsBySide=bySide;
}
