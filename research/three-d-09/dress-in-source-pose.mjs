/** Work58 bridge: reuse Work56 geometry and Work57 bone pose without rebinding.
 * Body presentation normals are never used to fit the photographed garment.
 */
import {Float32BufferAttribute,Vector3} from 'three';
import {buildGarmentShell} from '../three-d-08/garment-shell.mjs';
import {setFashionPose,softenNormalSeams} from './pose-source.mjs';
const sourceNormals=new WeakMap();
export function prepareBodyPresentation(root){
 if(sourceNormals.has(root))throw Error('Body presentation already prepared');
 root.updateMatrixWorld(true);
 const rows=[];root.traverse(mesh=>{if(mesh.isSkinnedMesh&&!mesh.userData.work56Garment)rows.push({mesh,normal:mesh.geometry.attributes.normal});});
 sourceNormals.set(root,rows);setFashionPose(root,'source');softenNormalSeams(root);
 for(const {mesh} of rows){const p=mesh.geometry.attributes.position,data=[];for(let i=0;i<p.count;i++)data.push(...new Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).toArray());mesh.geometry.setAttribute('studioRestPosition',new Float32BufferAttribute(data,3));}
 return rows.length;
}
export function attachReviewedShirt(root,candidate,{acknowledged=false,pose='relaxed'}={}){
 if(!['source','relaxed'].includes(pose)||!sourceNormals.has(root))throw Error('Prepared body and supported pose required');
 const rows=sourceNormals.get(root),present=rows.map(({mesh})=>mesh.geometry.attributes.normal);
 let shirt;
 setFashionPose(root,'source');
 try{
  rows.forEach(({mesh,normal})=>mesh.geometry.setAttribute('normal',normal));
  shirt=buildGarmentShell(root,candidate,{acknowledged});
 }finally{
  rows.forEach(({mesh},i)=>mesh.geometry.setAttribute('normal',present[i]));
  setFashionPose(root,pose);
 }
 const shared=shirt.meshes.every(m=>rows.some(({mesh})=>mesh.skeleton===m.skeleton));
 if(!shared){shirt.dispose();throw Error('Garment/body skeleton mismatch');}
 return {...shirt,fitPose:'source',sharedSkeleton:true};
}
export function releaseBodyPresentation(root){sourceNormals.delete(root);}
