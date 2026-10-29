/** Integration-only edge finish; original PR415 builder and photo shader unchanged. */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
export function finishDressEdges(dress){
 const original=dress.mesh;original.updateWorldMatrix(true,false);const g=original.geometry,p=g.attributes.position;
 smoothSurfaceNormals(g,p.count); // weld lighting normals at the duplicated front seam
 const stride=p.count/dress.stats.ringCount,segments=stride-1;
 if(!Number.isInteger(segments)||segments<24)throw Error('Unexpected verified dress topology');
 const normals=g.attributes.normal;for(let row=0;row<dress.stats.ringCount;row++){const a=row*stride,b=a+segments,n=new T.Vector3().fromBufferAttribute(normals,a).add(new T.Vector3().fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}normals.needsUpdate=true;
 const inverse=original.matrixWorld.clone().invert(),normalMatrix=new T.Matrix3().getNormalMatrix(original.matrixWorld);
 const positions=[],skin=[],weights=[],rest=[],indices=[];
 for(const row of [0,dress.stats.ringCount-1])for(let j=0;j<segments;j++){
  const a=row*stride+j,b=a+1,start=positions.length/3;
  for(const [id,inward] of [[a,false],[b,false],[a,true],[b,true]]){
   const point=new T.Vector3().fromBufferAttribute(p,id);
   if(inward){const n=new T.Vector3().fromBufferAttribute(g.attributes.normal,id).applyMatrix3(normalMatrix).normalize();point.applyMatrix4(original.matrixWorld).addScaledVector(n,-.003).applyMatrix4(inverse);}
   positions.push(...point.toArray());
   for(let k=0;k<4;k++){skin.push(g.attributes.skinIndex.array[id*4+k]);weights.push(g.attributes.skinWeight.array[id*4+k]);}
   // Edge thickness is explicitly neutral, never a second photo/logo surface.
   rest.push(0,-99,0);
  }
  indices.push(start,start+1,start+2,start+1,start+3,start+2);
 }
 const edge=new T.BufferGeometry();edge.setAttribute('position',new T.Float32BufferAttribute(positions,3));edge.setAttribute('skinIndex',new T.Uint16BufferAttribute(skin,4));edge.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));edge.setAttribute('dressRest',new T.Float32BufferAttribute(rest,3));edge.setIndex(indices);edge.computeVertexNormals();
 const mesh=new T.SkinnedMesh(edge,original.material);mesh.name='Work61-neutral-dress-opening-rims';mesh.userData.work56Garment=true;mesh.userData.experimentalDress14=true;
 mesh.position.copy(original.position);mesh.quaternion.copy(original.quaternion);mesh.scale.copy(original.scale);original.parent.add(mesh);mesh.bind(original.skeleton,original.bindMatrix);mesh.frustumCulled=false;
 const dispose=dress.dispose;return {...dress,meshes:[original,mesh],stats:{...dress.stats,edgeRimTriangles:indices.length/3,triangles:dress.stats.triangles+indices.length/3,neutralOpeningThickness:.003,frontNormalSeamSmoothed:true},dispose(){mesh.removeFromParent();edge.dispose();dispose();}};
}
