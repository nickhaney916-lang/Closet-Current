/** Nonmetric placement trial for six automatic source volumes on the exact
 * licensed original male/female rig REST joint hierarchy. No skin binding,
 * garment-region correspondence, collision or physical fit is certified.
 */
import {createHash} from 'node:crypto';
import {Matrix4,Vector3,Quaternion} from 'three';
import {buildCategorySourceVolume89} from './category-source-volume89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const RIGS=Object.freeze({female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'});
const hold={consumer3DAdmitted:false,physicalFitProved:false,sourceViewIndependentlyVerified:false,originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'};
const refusal=reason=>({status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,...hold});
const priors=Object.freeze({shirt:{height:.32,waistOffset:-.045},blouse:{height:.32,waistOffset:-.045},jeans:{height:.48,waistOffset:-.48},skirt:{height:.35,waistOffset:-.35},dress:{height:.57,waistOffset:-.37}});
function readRig(kind,bytes){
 if(!Object.hasOwn(RIGS,kind)||!(bytes instanceof Uint8Array)||bytes.length<150000||bytes.length>64*1024*1024||sha(bytes)!==RIGS[kind])throw Error('original-rig-byte-identity-required');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==bytes.length||view.getUint32(16,true)!==0x4e4f534a)throw Error('invalid-glb');
 const size=view.getUint32(12,true);
 if(size>bytes.length-20)throw Error('invalid-glb-json');
 const gltf=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+size)));
 const nodes=gltf.nodes,skins=gltf.skins;
 if(!Array.isArray(nodes)||!Array.isArray(skins)||!skins.length||!skins.every(s=>Array.isArray(s.joints)&&s.joints.length===163))throw Error('original-163-joints-required');
 const joints=skins[0].joints;
 if(new Set(joints).size!==163)throw Error('duplicate-joints');
 const parent=new Map();
 for(let i=0;i<nodes.length;i++)for(const c of nodes[i].children??[]){if(parent.has(c))throw Error('duplicate-parent');parent.set(c,i);}
 const world=new Map(),visiting=new Set();
 function get(i){
  if(world.has(i))return world.get(i);
  if(visiting.has(i)||!nodes[i])throw Error('invalid-hierarchy');
  visiting.add(i);const n=nodes[i],m=n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3(...(n.translation??[0,0,0])),new Quaternion(...(n.rotation??[0,0,0,1])),new Vector3(...(n.scale??[1,1,1])));
  if(parent.has(i))m.premultiply(get(parent.get(i)));
  visiting.delete(i);if(!m.elements.every(Number.isFinite))throw Error('invalid-rest-transform');world.set(i,m);return m;
 }
 const points=joints.map(i=>({name:String(nodes[i].name??'').replaceAll('.',''),p:new Vector3().setFromMatrixPosition(get(i))}));
 const spine=points.filter(x=>x.name==='spine04');
 if(spine.length!==1)throw Error('unique-original-spine04-required');
 const minY=Math.min(...points.map(x=>x.p.y)),maxY=Math.max(...points.map(x=>x.p.y)),span=maxY-minY;
 if(!(span>.05&&span<20))throw Error('invalid-rest-joint-span');
 return {kind,sha256:RIGS[kind],boneCount:joints.length,span,anchor:spine[0].p.toArray()};
}
export async function trialCategoryRigAlignment89(args={}){
 try{
  if(!args||Object.keys(args).some(k=>!['sourceId','originalBytes','lockedRecord','rigKind','rigBytes'].includes(k)))return refusal('unsupported-alignment-input');
  const {rigKind,rigBytes,sourceId,originalBytes,lockedRecord}=args;
  if(!(rigBytes instanceof Uint8Array)||rigBytes.length>64*1024*1024)return refusal('invalid-rig-bytes');
  const rig=readRig(rigKind,Buffer.from(rigBytes));
  const r=await buildCategorySourceVolume89({sourceId,originalBytes,lockedRecord});
  if(r.status!=='CATEGORY_DEPTH_HYPOTHESIS_RESEARCH_ONLY')return refusal(r.reason??'source-volume-refused');
  const p=r.sourcePlane.positions,prior=priors[r.category];
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(let i=0;i<p.length;i+=3){minX=Math.min(minX,p[i]);maxX=Math.max(maxX,p[i]);minY=Math.min(minY,p[i+1]);maxY=Math.max(maxY,p[i+1]);}
  const span=maxY-minY;
  if(!(span>0&&maxX>minX)||!prior)return refusal('invalid-source-outline-span');
  const scale=rig.span*prior.height/span;
  const translation=[rig.anchor[0]-scale*(minX+maxX)/2,rig.anchor[1]+rig.span*prior.waistOffset-minY*scale,rig.anchor[2]+rig.span*.25];
  if(![scale,...translation].every(Number.isFinite)||!(scale>0))return refusal('invalid-alignment-transform');
  // Keep all source and inferred geometry in original coordinates. A single
  // external similarity transform is the only placement change.
  return {status:'LICENSED_RIG_LANDMARK_PLACEMENT_TRIAL_ONLY',sourceId,category:r.category,originalSHA256:r.originalSHA256,
   rig,placement:{scale,translation,anchorName:'spine04',assumedRelativeHeight:prior.height,assumedBottomOffset:prior.waistOffset},
   sourceVolume:r,sourceGeometryUnmodified:true,uniformScaleOnly:true,rigJointHierarchyOnly:true,
   sourceGarmentLandmarkVerified:false,sourcePhysicalScaleKnown:false,bodyMeshContactProved:false,skinBindingProved:false,...hold};
 }catch{return refusal('licensed-rig-or-source-placement-refused');}
}
