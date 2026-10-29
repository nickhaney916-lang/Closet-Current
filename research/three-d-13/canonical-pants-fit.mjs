/** Snapshot source normals before presentation smoothing, as Work59 does for shirts.
 * Display-only shading normals must never steer lower-body fit geometry.
 */
import {setFashionPose} from '../three-d-09/pose-source.mjs';
import {buildResearchPants} from './pants-shell.mjs';
export function createPantsFitter(root){
 const rows=[];root.traverse(mesh=>{if(mesh.isSkinnedMesh&&!mesh.userData.work56Garment)rows.push({mesh,source:mesh.geometry.attributes.normal});});
 return function attach({pose='relaxed'}={}){
  if(!['source','relaxed'].includes(pose))throw Error('Unsupported pants pose');
  const presented=rows.map(({mesh})=>mesh.geometry.attributes.normal);setFashionPose(root,'source');
  try{rows.forEach(({mesh,source})=>mesh.geometry.setAttribute('normal',source));return buildResearchPants(root);}
  finally{rows.forEach(({mesh},i)=>mesh.geometry.setAttribute('normal',presented[i]));setFashionPose(root,pose);}
 };
}
