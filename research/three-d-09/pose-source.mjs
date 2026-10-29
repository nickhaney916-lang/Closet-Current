/** Reversible presentation pose. No resculpting, vertex edits or measurements. */
import {Quaternion,Vector3,Matrix3,MathUtils} from 'three';
const saved=new WeakMap();
export function setFashionPose(root,mode='relaxed'){
 if(!['relaxed','source'].includes(mode))throw Error('Unsupported presentation pose');
 let original=saved.get(root);
 if(!original){original=[];root.traverse(o=>{if(o.isBone)original.push([o,o.quaternion.clone()]);});saved.set(root,original);}
 for(const [b,q] of original)b.quaternion.copy(q);
 root.updateMatrixWorld(true);
 const find=name=>original.find(([b])=>b.name.replaceAll('.','')===name)?.[0];
 const rotate=(name,axis,degrees)=>{
  const b=find(name);if(!b)throw Error('Missing source skeleton landmark: '+name);
  const parent=b.parent.getWorldQuaternion(new Quaternion());
  const local=parent.clone().invert().multiply(new Quaternion().setFromAxisAngle(axis,MathUtils.degToRad(degrees))).multiply(parent);
  b.quaternion.premultiply(local);root.updateMatrixWorld(true);
 };
 if(mode==='relaxed'){
  // Conservative symmetric lowering keeps hands outside hips and leaves
  // pelvis, leg lengths, feet and original body proportions untouched.
  for(const [side,sign] of [['L',-1],['R',1]]){
   rotate('upperarm01'+side,new Vector3(0,0,1),sign*19);
   rotate('lowerarm01'+side,new Vector3(1,0,0),-5);
   rotate('wrist'+side,new Vector3(0,1,0),sign*3);
  }
 }
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 return {mode,bones:original.length,sourceGeometryUnchanged:true,measurementFit:false};
}
/** Average coincident seam normals, without welding topology or moving vertices. */
export function softenNormalSeams(root){
 const buckets=new Map(),clones=[];
 root.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  o.geometry=o.geometry.clone();clones.push(o.geometry);
  const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;
  for(let i=0;i<p.count;i++){
   const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');
   if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push([n,i]);
  }
 });
 for(const rows of buckets.values())if(rows.length>1){
  const sum=new Vector3();for(const [n,i] of rows)sum.add(new Vector3().fromBufferAttribute(n,i));
  if(sum.lengthSq()<.00001)continue;sum.normalize();
  for(const [n,i] of rows)n.setXYZ(i,sum.x,sum.y,sum.z);
 }
 // Suppress fine anatomical relief in the opaque presentation basewear by
 // blending NORMALS only toward a broad torso/pelvis envelope. Positions,
 // proportions, silhouette, UVs and all skin weights stay byte-identical.
 root.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;
  const normalMatrix=new Matrix3().getNormalMatrix(o.matrixWorld),inverse=normalMatrix.clone().invert();
  const band=(y,a,b,c,d)=>MathUtils.smoothstep(y,a,b)*(1-MathUtils.smoothstep(y,c,d));
  for(let i=0;i<p.count;i++){
   const v=new Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
   const area=Math.max(band(v.y,1.22,1.30,1.49,1.55),band(v.y,.83,.90,1.12,1.18));
   const center=1-MathUtils.smoothstep(Math.abs(v.x),.14,.24);
   const mix=area*center*.92;if(mix<.001)continue;
   const broad=new Vector3(v.x/(.24*.24),0,(v.z+.065)/(.17*.17)).normalize();
   const old=new Vector3().fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();
   old.lerp(broad,mix).normalize().applyMatrix3(inverse).normalize();n.setXYZ(i,old.x,old.y,old.z);
  }
 });
 for(const g of clones)g.attributes.normal.needsUpdate=true;
 return clones.length;
}
