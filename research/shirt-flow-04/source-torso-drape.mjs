/** SHIRT-FLOW-04 — original-photographed shirt yoke, chest and waist.
 * Opt-in 163-bone pose-responsive cloth relief in genuine independent shirt
 * triangles, never image compositing or altered JPEG/UV/RGB/skin indices.
 * Shoulder-cap, neckline, side seams and hem endpoints remain anchored.
 * Source-rest geometry is reconstructed by pose-conditioned-sleeves first.
 * Not real-time physics, unrestricted motion, or human visual approval.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const ramp=(x,a,b,c,d)=>smooth(x,a,b)*(1-smooth(x,c,d));
const key=v=>v.toArray().map(x=>x.toFixed(5)).join(':');
function inverseSkin(mesh,i){
 const g=mesh.geometry,sk=new T.Matrix4();sk.elements.fill(0);
 for(let k=0;k<4;k++){
  const index=g.attributes.skinIndex.getComponent(i,k),weight=g.attributes.skinWeight.getComponent(i,k);
  const matrix=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[index].matrixWorld,mesh.skeleton.boneInverses[index]);
  for(let j=0;j<16;j++)sk.elements[j]+=matrix.elements[j]*weight;
 }
 return sk.premultiply(mesh.bindMatrixInverse).multiply(mesh.bindMatrix).invert();
}
export function shapeSourceTrueYokeTorsoFlow(root,shirt){
 if(!shirt?.stats?.sourceMeasuredNaturalSleeveHang || !shirt?.stats?.naturalSourceShoulderSleeveTransition)
  throw Error('Source-photographed 3D55 independently sewn shirt required');
 const meshes=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell'&&m.isSkinnedMesh);
 if(!meshes.length)throw Error('Source independently skinned shirt shell required');
 root.updateMatrixWorld(true);
 const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o);});
 if(bones.length!==163)throw Error('Original 163-bone anatomical figure required');
 const bone=name=>{
  const node=bones.find(o=>o.name===name);
  if(!node)throw Error('Original source shoulder bone missing '+name);
  return node.getWorldPosition(new T.Vector3());
 };
 const a=bone('upperarm01L'),b=bone('upperarm01R'),eL=bone('lowerarm01L'),eR=bone('lowerarm01R');
 if(Math.sign(a.x)===Math.sign(b.x)||a.distanceTo(b)<.25)throw Error('Anatomical shoulder landmarks invalid');
 const shoulderY=(a.y+b.y)/2,spineZ=(a.z+b.z)/2,centerX=(a.x+b.x)/2;
 const leftAxis=eL.clone().sub(a),rightAxis=eR.clone().sub(b);
 if(leftAxis.length()<.12||rightAxis.length()<.12)throw Error('Anatomical arms too short');
 // Real 163-bone arm orientation shifts load on the photographed chest/yoke.
 const spread=(Math.abs(leftAxis.x/leftAxis.length())+Math.abs(rightAxis.x/rightAxis.length()))*.5;
 const asym=(leftAxis.y/leftAxis.length()-rightAxis.y/rightAxis.length());
 const response=.62+.38*spread;
 const stats={L:{yoke:0,chest:0,waist:0,max:0},R:{yoke:0,chest:0,waist:0,max:0}};
 let moved=0,maxMeters=0,protectedSeam=0;
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  const g=mesh.geometry,p=g.getAttribute('position'),ix=g.index;
  if(!p||!ix||!g.getAttribute('panelPosition')||!g.getAttribute('skinIndex')||!g.getAttribute('skinWeight'))
   throw Error('Genuine photographed panels/UV and original skin attributes mandatory');
  const before=new Map(['panelPosition','panelNormal','uv','skinIndex','skinWeight'].map(name=>[
   name,g.getAttribute(name)?.array.slice()]));
  const groups=new Map();
  for(const i of new Set(ix.array)){
   const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('Nonfinite skinned source photograph');
   const k=key(q);
   if(!groups.has(k))groups.set(k,{q,ids:[]});
   groups.get(k).ids.push(i);
  }
  const inv=mesh.matrixWorld.clone().invert();
  for(const {q,ids} of groups.values()){
   const x=Math.abs(q.x-centerX),dy=q.y-shoulderY;
   // By fading to zero before x=.31 we keep the actual separately sewn
   // shoulder cap boundaries, original neck, centerprint edge and hem.
   if(x>=.315||dy>=-.065||dy<=-.90){protectedSeam+=ids.length;continue;}
   const inner=ramp(x,.010,.045,.267,.315);
   const yoke=ramp(dy,-.41,-.30,-.18,-.065);
   const chest=ramp(dy,-.69,-.54,-.25,-.16);
   const waist=ramp(dy,-.89,-.75,-.47,-.33);
   const sign=q.x>=centerX?1:-1,side=sign===Math.sign(a.x-centerX)?'L':'R';
   // Separate oblique true-geometry fold ribbons, not painted shadows.
   // Original image pixels and source UV coordinates are *never* rewritten.
   const diagonal=dy+.41+.28*x+sign*.045*asym;
   const fold=Math.exp(-Math.pow(diagonal/.10,2));
   const vertical=Math.exp(-Math.pow((dy+.58+sign*.07*spread)/.14,2));
   const hemRipple=Math.sin(x*18.5+sign*.45);
   const frontBack=Math.sign(q.z-spineZ)||1;
   const yokeLoft=(.004+.008*fold)*yoke*inner;
   const chestLoft=(.004+.010*vertical)*chest*inner*response;
   const waistLoft=(.006+.008*Math.abs(hemRipple))*waist*inner*response;
   const distanceOut=yokeLoft+chestLoft+waistLoft;
   const gravityDown=(.002*yoke+.004*chest+.006*waist)*inner*response;
   const sideFlow=(.002*yoke+.004*waist)*inner*sign*(.5+.5*spread);
   const delta=new T.Vector3(sideFlow,-gravityDown,frontBack*distanceOut);
   delta.clampLength(0,.020);
   if(delta.length()<.0003)continue;
   // Same world target for duplicates; each original skin basis inverted
   // separately so no UV seam or mismatched weighted seam is introduced.
   for(const i of ids){
    const next=q.clone().add(delta).applyMatrix4(inv).applyMatrix4(inverseSkin(mesh,i));
    if(!Number.isFinite(next.x+next.y+next.z))throw Error('Nonfinite real-skinned shirt torso relief');
    p.setXYZ(i,next.x,next.y,next.z);
    const v=stats[side];v[yoke>=chest&&yoke>=waist?'yoke':chest>=waist?'chest':'waist']++;
    v.max=Math.max(v.max,delta.length());moved++;
   }
   maxMeters=Math.max(maxMeters,delta.length());
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);g.computeBoundingBox();g.computeBoundingSphere();
  for(const [name,old] of before){
   const attr=g.getAttribute(name);
   if(!old||!attr||attr.array.length!==old.length||!old.every((v,i)=>v===attr.array[i]))
    throw Error('Changed immutable original photograph, panel normal or skin '+name);
  }
 }
 if(moved<40||maxMeters<.003||maxMeters>.02001||
    Object.values(stats).some(v=>v.yoke<5||v.chest<8))
  throw Error('Insufficient true photographed bilateral shoulder/chest relief '+JSON.stringify({moved,maxMeters,stats,protectedSeam}));
 return {originalSourcePhotoAndUVPreserved:true,originalSkinWeightsPreserved:true,
  originalMaleFemaleRig163:true,realPoseResponse:true,shoulderY,spread,
  shiftedPhotographedVertices:moved,maxMeters,sides:stats,protectedSeam,
  trueSkinnedTriangleContactCheckedLater:true,unrestrictedClothPhysics:false,
  visualHumanApproval:false,physicalPhoneTested:false,releaseAuthorized:false};
}
