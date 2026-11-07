import {applyDualHumanoidRealism118} from '../dual-humanoid-photorealism-118/realism.mjs';
import {applyDualHumanoidFace131} from '../dual-humanoid-face-definition-131/face-definition.mjs';

const GROUPS=['research-procedural-hair-118','research-face-definition-131'];
function retainSafeHairCap(root){
 const hair=root.getObjectByName('research-procedural-hair-118');
 if(!hair)return 0;
 const removed=[];
 for(const strand of hair.children.slice(1)){
  if(strand.geometry)strand.geometry.dispose();
  for(const material of Array.isArray(strand.material)?strand.material:(strand.material?[strand.material]:[]))
   if(material.userData?.ownedMaterial||strand.userData?.ownedMaterial)material.dispose();
  removed.push(strand);
 }
 for(const strand of removed)hair.remove(strand);
 return removed.length;
}
function disposeGroup(root,name){
 const group=root.getObjectByName(name);if(!group)return false;
 const geometries=new Set(),materials=new Set();
 group.traverse(node=>{
  if(node.geometry)geometries.add(node.geometry);
  for(const material of Array.isArray(node.material)?node.material:(node.material?[node.material]:[]))
   if(material.userData?.ownedMaterial||node.userData?.ownedMaterial)materials.add(material);
 });
 group.parent?.remove(group);
 geometries.forEach(geometry=>geometry.dispose());
 materials.forEach(material=>material.dispose());
 return true;
}
export function clearDualHumanoid150(root){
 if(!root?.traverse)return false;
 for(const name of GROUPS)disposeGroup(root,name);
 return true;
}
export function applyDualHumanoid150(root,figure){
 if(!root||!['female','male'].includes(figure))throw Error('P150 female/male skinned mannequin required');
 clearDualHumanoid150(root);
 const initialHair=applyDualHumanoidRealism118(root,figure);
 // Preserve the source-derived crown cap and avoid unstable generated flyaway
 // tubes that obscured the face on the actual app camera.
 const prunedHairStrands=retainSafeHairCap(root);
 const skinHair=Object.freeze({...initialHair,hairMeshes:1,prunedHairStrands});
 const face=applyDualHumanoidFace131(root,figure);
 if(skinHair.sourceRigBones!==163||face.sourceRigBones!==163||
    face.sourceGeometryChanged||face.sourceGarmentGeometryChanged)
  throw Error('P150 enhancement changed source rig or garment geometry');
 return Object.freeze({priority:'DUAL-HUMANOID-PHOTOREALISTIC-INTEGRATION-150',
  figure,sourceRigBones:163,skinHair,face,
  photorealismProven:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
