/**
 * 3D-08: a REAL separate SkinnedMesh shell above existing CC0 anatomy.
 * The shirt borrows exactly the already-verified human skeleton weights;
 * it does NOT pretend to reconstruct garment shape or any unseen back.
 */
import * as THREE from 'three';
export const LIMITS=Object.freeze({
 torsoLow:1.105,torsoHigh:1.635,
 maxTorsoX:.405, maxSleeveX:.79,
 wristLow:1.055, offset:.013,
 maxTriangles:120000,minTriangles:450
});
export const isShirtArea=(x,y)=>{
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 const a=Math.abs(x);
 return (a<LIMITS.maxTorsoX&&y>=LIMITS.torsoLow&&y<=LIMITS.torsoHigh)||
  (a>=.29&&a<LIMITS.maxSleeveX&&y>=LIMITS.wristLow&&y<=LIMITS.torsoHigh);
};
const cachePosition=(mesh)=>{
 const attr=mesh.geometry.attributes.position,cache=new Map(),v=new THREE.Vector3();
 return i=>{
  if(!cache.has(i)){
   mesh.getVertexPosition(i,v);
   cache.set(i,v.clone().applyMatrix4(mesh.matrixWorld));
  }
  return cache.get(i);
 };
};
export function selectedShirtIndices(mesh){
 if(!mesh?.isSkinnedMesh||!mesh.geometry?.attributes?.position||
  !mesh.geometry.attributes.skinIndex||!mesh.geometry.attributes.skinWeight)
  throw Error('Only source-skinned anatomical CC0 geometry may be used');
 const g=mesh.geometry,at=g.attributes.position,idx=g.index;
 const triangles=Math.floor((idx?idx.count:at.count)/3);
 if(triangles<20||triangles>LIMITS.maxTriangles)throw Error('Unexpected anatomical mesh size');
 const position=cachePosition(mesh),indices=[];
 for(let t=0;t<triangles;t++){
  const a=idx?idx.getX(t*3):t*3;
  const b=idx?idx.getX(t*3+1):t*3+1;
  const c=idx?idx.getX(t*3+2):t*3+2;
  const pa=position(a),pb=position(b),pc=position(c);
  const x=(pa.x+pb.x+pc.x)/3,y=(pa.y+pb.y+pc.y)/3;
  if(isShirtArea(x,y))indices.push(a,b,c);
 }
 return indices;
}
export function buildSkinnedShirtShell(root,source,makeMaterial){
 if(!root||!source?.verified||source.releaseAuthorized!==false||
  typeof makeMaterial!=='function')throw Error('Reviewed research source and rig required');
 root.updateMatrixWorld(true);
 const candidates=[];let selected=0,bodyMeshes=0;
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||!mesh.geometry?.attributes?.skinIndex)return;
  const indices=selectedShirtIndices(mesh);
  if(indices.length/3<LIMITS.minTriangles) return;
  candidates.push({mesh,indices});selected+=indices.length/3;bodyMeshes++;
 });
 if(!candidates.length||selected<700||selected>LIMITS.maxTriangles*2)
  throw Error('No safe separate shirt region on the anatomical skeleton');
 const shells=[];
 try{
  for(const {mesh,indices} of candidates){
   const geometry=mesh.geometry.clone();
   geometry.setIndex(indices);
   geometry.clearGroups();
   geometry.computeBoundingSphere();
   const material=makeMaterial();
   const shell=new THREE.SkinnedMesh(geometry,material);
   shell.name='Closet Current · independently skinned reviewed shirt shell';
   shell.position.copy(mesh.position);
   shell.quaternion.copy(mesh.quaternion);
   shell.scale.copy(mesh.scale);
   shell.bindMode=mesh.bindMode;
   shell.bind(mesh.skeleton,mesh.bindMatrix.clone());
   shell.frustumCulled=false; // original local skeleton can exceed static bounds
   shell.userData.originalSkinUUID=mesh.skeleton.uuid;
   shell.userData.researchOnly=true;
   mesh.parent.add(shell);
   shells.push(shell);
  }
 }catch(error){
  for(const shell of shells){
   shell.parent?.remove(shell);shell.geometry.dispose();shell.material.dispose();
  }
  throw error;
 }
 return Object.freeze({shells,shellCount:shells.length,triangles:selected,
  originalSkeletonsReused:bodyMeshes,sourceSHA256:source.sourceSHA256,
  separateSkinnedMesh:true,physicalClothSimulation:false,
  sourceRearReconstruction:false,releaseAuthorized:false,humanVisualApproval:false});
}

/**
 * A source-clothed, independent WebGL SkinnedMesh material. The underlying
 * anatomy keeps its own matte modesty material unchanged.
 */
export function createSourceShirtMaterial(image,crop,rgb){
 if(!image||!Array.isArray(crop)||crop.length!==4||
  !Array.isArray(rgb)||rgb.length!==3||rgb.some(x=>!Number.isFinite(x)||x<0||x>1))
  throw Error('Reviewed garment source, bounds and fabric color required');
 const texture=new THREE.Texture(image);
 texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=true;
 texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;
 texture.needsUpdate=true;
 const uniforms={
  sourceTexture:{value:texture},
  crop:{value:new THREE.Vector4(...crop)},
  fabric:{value:new THREE.Color().setRGB(...rgb,THREE.SRGBColorSpace)}
 };
 const material=new THREE.MeshStandardMaterial({
  color:0xffffff,metalness:0,roughness:.83,side:THREE.DoubleSide
 });
 material.onBeforeCompile=shader=>{
  shader.uniforms.uSourceTexture=uniforms.sourceTexture;
  shader.uniforms.uSourceCrop=uniforms.crop;
  shader.uniforms.uSourceFabric=uniforms.fabric;
  shader.vertexShader=shader.vertexShader.replace('void main() {',
   'varying vec3 vShirtWorld;\nvarying float vShirtFacing;\nvoid main() {');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\ntransformed += normalize(objectNormal)*0.013;');
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
   '#include <project_vertex>\nvShirtWorld=(modelMatrix*vec4(transformed,1.)).xyz;\nvShirtFacing=dot(normalize(mat3(modelMatrix)*transformedNormal),vec3(0.,0.,1.));');
  shader.fragmentShader=shader.fragmentShader.replace('void main() {',
   'varying vec3 vShirtWorld;\nvarying float vShirtFacing;\nuniform sampler2D uSourceTexture;\nuniform vec4 uSourceCrop;\nuniform vec3 uSourceFabric;\nvoid main() {');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',[
   '#include <color_fragment>',
   'float ax=abs(vShirtWorld.x);',
   'float torso=step(ax,.405)*step(1.105,vShirtWorld.y)*step(vShirtWorld.y,1.635);',
   'float sleeve=step(.29,ax)*step(ax,.79)*step(1.055,vShirtWorld.y)*step(vShirtWorld.y,1.635);',
   'if(max(torso,sleeve)<.5)discard;',
   'diffuseColor.rgb=uSourceFabric;',
   'vec2 pos=vec2(.5+vShirtWorld.x/.73,(vShirtWorld.y-1.12)/.49);',
   'if(pos.x>=0.&&pos.x<=1.&&pos.y>=0.&&pos.y<=1.){',
   'vec2 uv=vec2(uSourceCrop.x+pos.x*uSourceCrop.z,',
   '1.-uSourceCrop.y-uSourceCrop.w+pos.y*uSourceCrop.w);',
   'vec4 px=texture2D(uSourceTexture,uv);',
   'float front=max(smoothstep(.015,.09,vShirtWorld.z),',
   'smoothstep(.17,.61,vShirtFacing));',
   'float chest=(1.-smoothstep(.31,.40,ax))*smoothstep(1.115,1.18,vShirtWorld.y)*',
   '(1.-smoothstep(1.52,1.61,vShirtWorld.y));',
   'diffuseColor.rgb=mix(diffuseColor.rgb,px.rgb,px.a*front*chest);',
   '}'
  ].join('\n'));
 };
 return {material,texture};
}
