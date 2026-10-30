/** Research only: gravity-oriented, oblique elbow/forearm ease in actual
 * skinned world space, rebuilt from immutable rest geometry for each sampled
 * pose. This is pose-conditioned tailoring, NOT a cloth dynamics solver. */
import * as T from 'three';
import {setResearchPose} from '../three-d-43/intermediate-pose.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const key=q=>q.toArray().map(x=>x.toFixed(5)).join(':');
function inverseSkin(m,i){
 const g=m.geometry,skin=new T.Matrix4();skin.elements.fill(0);
 for(let k=0;k<4;k++){
  const id=g.attributes.skinIndex.getComponent(i,k),w=g.attributes.skinWeight.getComponent(i,k);
  const a=new T.Matrix4().multiplyMatrices(m.skeleton.bones[id].matrixWorld,m.skeleton.boneInverses[id]);
  for(let j=0;j<16;j++)skin.elements[j]+=a.elements[j]*w;
 }
 return skin.premultiply(m.bindMatrixInverse).multiply(m.bindMatrix).invert();
}
export function shapePosedSleeveEase(root,shirt){
 if(!shirt?.stats?.sourceMeasuredNaturalSleeveHang)throw Error('3D56 requires original verified 3D55 sleeve construction');
 root.updateMatrixWorld(true);const arms={};
 for(const side of ['L','R']){
  const bone=name=>{let b;root.traverse(o=>{if(o.isBone&&o.name===name+side)b=o;});if(!b)throw Error('Original source arm joint missing '+name+side);return b.getWorldPosition(new T.Vector3());};
  const elbow=bone('lowerarm01'),wrist=bone('wrist'),upper=bone('upperarm01'),axis=wrist.clone().sub(elbow),len=axis.length();
  if(len<.12)throw Error('Invalid original forearm length');axis.normalize();
  const down=new T.Vector3(0,-1,0),sag=down.clone().addScaledVector(axis,-down.dot(axis));
  const horizontal=sag.length();if(horizontal>.0001)sag.normalize();
  const cross=new T.Vector3().crossVectors(axis,new T.Vector3(0,0,1)).normalize();
  const flex=1-Math.abs(elbow.clone().sub(upper).normalize().dot(axis));
  arms[side]={elbow,wrist,axis,len,sag,cross,horizontal,flex};
 }
 const groups=new Map(),meshes=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell');
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();const p=mesh.geometry.attributes.position,used=new Set(mesh.geometry.index.array);
  for(const i of used){
   const rest=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   if(Math.abs(rest.x)<.31)continue; // photo front, neckline and torso stay pinned
   const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld),k=key(q);
   if(!groups.has(k))groups.set(k,{q,refs:[]});groups.get(k).refs.push({mesh,i,rest});
  }
 }
 const sides={L:{moved:0,max:0,elbow:0,forearm:0},R:{moved:0,max:0,elbow:0,forearm:0}};let maximum=0;
 for(const {q,refs} of groups.values()){
  const side=Math.sign(refs[0].rest.x)===Math.sign(arms.L.wrist.x)?'L':'R',a=arms[side];
  const offset=q.clone().sub(a.elbow),t=offset.dot(a.axis)/a.len;
  if(t<=-.08||t>=.86)continue; // real elbow boundary/cuff anchor never shifted
  const radial=offset.addScaledVector(a.axis,-t*a.len),radius=radial.length();
  if(radius<.025||radius>.17)continue;radial.normalize();
  const envelope=smooth(t,-.08,.12)*(1-smooth(t,.70,.86))*smooth(radius,.025,.05)*(1-smooth(radius,.13,.17));
  if(envelope<.04)continue;
  // Oblique, underside-weighted folds instead of concentric inflated tubes.
  // Their longitudinal location and ease change with the REAL posed axis.
  const around=radial.dot(a.cross),under=radial.dot(a.sag);
  const center=.19+.065*around+.035*a.horizontal;
  const elbowFold=Math.exp(-Math.pow((t-center)/.045,2));
  const crease=Math.exp(-Math.pow((t-(center+.085))/.045,2));
  const forearmFold=Math.exp(-Math.pow((t-(.54-.045*around))/.12,2));
  const response=.45+.55*a.horizontal;
  const ease=(.0015+.008*elbowFold*response-.0025*crease+.0025*forearmFold)*envelope*(.65+.35*smooth(under,-.25,.65));
  const delta=radial.clone().multiplyScalar(ease).addScaledVector(a.sag,.0035*envelope*a.horizontal);
  delta.clampLength(0,.015);const distance=delta.length();
  if(!Number.isFinite(distance))throw Error('Nonfinite actual posed cloth displacement');
  if(distance<.0001)continue;
  const target=q.clone().add(delta);
  for(const {mesh,i} of refs){
   const v=target.clone().applyMatrix4(mesh.matrixWorld.clone().invert()).applyMatrix4(inverseSkin(mesh,i));
   mesh.geometry.attributes.position.setXYZ(i,v.x,v.y,v.z);
   sides[side].moved++;sides[side][t<.40?'elbow':'forearm']++;sides[side].max=Math.max(sides[side].max,distance);
  }
  maximum=Math.max(maximum,distance);
 }
 for(const mesh of meshes){const g=mesh.geometry;g.attributes.position.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,g.attributes.position.count);g.computeBoundingBox();g.computeBoundingSphere();}
 if(maximum<.002||maximum>.01501||Object.values(sides).some(s=>s.elbow<8||s.forearm<8))throw Error('Missing real bilateral posed elbow/fabric ease '+JSON.stringify({maximum,sides}));
 return {maximum,sides,axes:Object.fromEntries(Object.entries(arms).map(([s,a])=>[s,{horizontal:a.horizontal,flex:a.flex}])),continuousMotionCertified:false,humanApproved:false};
}

function joinCapNormals(shirt,root){
 root.updateMatrixWorld(true);const groups=new Map();
 for(const m of shirt.meshes){if(m.name!=='Work56-independent-shirt-shell'&&!m.userData.work45IndependentShoulderCap)continue;
  const g=m.geometry,p=g.attributes.position;for(const i of new Set(g.index.array)){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld),k=key(q);if(!groups.has(k))groups.set(k,[]);groups.get(k).push([m,i]);}
 }
 const sides={L:0,R:0};for(const refs of groups.values()){
  if(!refs.some(([m])=>m.userData.work45IndependentShoulderCap)||!refs.some(([m])=>m.name==='Work56-independent-shirt-shell'))continue;
  const n=new T.Vector3();for(const [m,i] of refs)n.add(new T.Vector3().fromBufferAttribute(m.geometry.attributes.normal,i).applyMatrix3(new T.Matrix3().getNormalMatrix(m.matrixWorld)).normalize());
  if(n.lengthSq()<1e-10)throw Error('Invalid actual cap/sleeve normal');n.normalize();
  for(const [m,i] of refs){const local=n.clone().applyMatrix3(new T.Matrix3().getNormalMatrix(m.matrixWorld).invert()).normalize();m.geometry.attributes.normal.setXYZ(i,local.x,local.y,local.z);m.geometry.attributes.normal.needsUpdate=true;}
  for(const side of ['L','R'])if(refs.some(([m])=>m.userData.work45IndependentShoulderCap===side))sides[side]++;
 }
 if(sides.L<3||sides.R<3)throw Error('Missing actual bilateral sewn shading witnesses');return sides;
}

export function createPoseConditionedSleeveContact(root,shirt,pants,contactFactory){
 if(typeof contactFactory!=='function')throw Error('Real triangle contact factory required');
 const meshes=shirt.meshes,base=new Map(meshes.map(m=>[m,m.geometry.attributes.position.array.slice()])),cache=new Map();
 const capture=()=>meshes.map(m=>({position:m.geometry.attributes.position.array.slice(),normal:m.geometry.attributes.normal.array.slice()}));
 const restore=snapshot=>meshes.forEach((m,i)=>{const g=m.geometry;g.attributes.position.array.set(snapshot[i].position);g.attributes.normal.array.set(snapshot[i].normal);g.attributes.position.needsUpdate=g.attributes.normal.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();});
 function fit(pose){
  setResearchPose(root,pose);
  if(cache.has(pose)){const c=cache.get(pose);restore(c.meshes);shirt.stats.poseTriangleContact=c.contact;shirt.stats.poseConditionedSleeveDrape=c.ease;return;}
  for(const m of meshes){m.geometry.attributes.position.array.set(base.get(m));m.geometry.attributes.position.needsUpdate=true;}
  const ease=shapePosedSleeveEase(root,shirt),contact=contactFactory(root,shirt,pants);
  try{contact.fit(pose);}finally{contact.dispose();}
  shirt.stats.poseConditionedSleeveDrape={...ease,sewnNormalGroups:joinCapNormals(shirt,root),pose,sourceRebuilt:true};
  cache.set(pose,{meshes:capture(),contact:shirt.stats.poseTriangleContact,ease:shirt.stats.poseConditionedSleeveDrape});
 }
 return {fit,dispose(){base.clear();cache.clear();}};
}
