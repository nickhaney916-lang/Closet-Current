/**
 * 3D-08: actual separately drawn skinned garment shell duplicated from the
 * verified CC0 anatomical surface. The body remains intact and beneath it.
 * No invented photographed rear, no tailoring, no body-specific measurements.
 */
import * as THREE from 'three';
export const SHELL_LIMITS=Object.freeze({
 torsoBottom:1.08,shirtTop:1.67,outerArm:.77,neckOpening:.105,
 baseFront:1.12,printTop:1.58,halfPhotoChest:.37
});
function shellMaterial(source){
 const uniforms={
  uImage:{value:new THREE.Texture(source.textureImage)},
  uCrop:{value:new THREE.Vector4(...source.cropRect)},
  uFallback:{value:new THREE.Color().setRGB(...source.baseColor,THREE.SRGBColorSpace)}
 };
 const tex=uniforms.uImage.value;
 tex.colorSpace=THREE.SRGBColorSpace;tex.flipY=true;tex.needsUpdate=true;
 tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
 const material=new THREE.MeshStandardMaterial({
  color:0xffffff,metalness:0,roughness:.9,side:THREE.DoubleSide
 });
 material.onBeforeCompile=shader=>{
  shader.uniforms.uImage=uniforms.uImage;
  shader.uniforms.uCrop=uniforms.uCrop;
  shader.uniforms.uFallback=uniforms.uFallback;
  shader.vertexShader=shader.vertexShader.replace('void main() {',
    'varying vec3 vShellPoint;\nvarying float vShellFacing;\nvoid main() {');
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
    '#include <worldpos_vertex>\nvShellPoint=(modelMatrix*vec4(transformed,1.0)).xyz;\nvShellFacing=dot(normalize(mat3(modelMatrix)*transformedNormal),vec3(0.,0.,1.));');
  shader.fragmentShader=shader.fragmentShader.replace('void main() {',
    'varying vec3 vShellPoint;\nvarying float vShellFacing;\nuniform sampler2D uImage;\nuniform vec4 uCrop;\nuniform vec3 uFallback;\nvoid main() {');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',[
    '#include <color_fragment>',
    '// Separate real skinned mesh above rigged anatomy; trim to top/arms.',
    'float absX=abs(vShellPoint.x);',
    'float torso=step(1.08,vShellPoint.y)*(1.-step(1.68,vShellPoint.y))*(1.-step(.388,absX));',
    'float sleeves=step(1.105,vShellPoint.y)*(1.-step(1.655,vShellPoint.y))*step(.31,absX)*(1.-step(.68,absX));',
    'float neckEdge=1.61+.10*smoothstep(.02,.21,absX);',
    'float neckCut=step(neckEdge,vShellPoint.y)*(1.-step(.33,absX));',
    'float present=max(torso,sleeves)*(1.-neckCut);',
    'if(present<.5)discard;',
    'diffuseColor.rgb=uFallback;',
    '// Only the front can use source photograph; rear is inferred plain fabric.',
    'float chest=(1.-smoothstep(.29,.37,absX))*smoothstep(1.12,1.18,vShellPoint.y)*(1.-smoothstep(1.54,1.60,vShellPoint.y));',
    'float facing=max(smoothstep(.01,.09,vShellPoint.z),smoothstep(.2,.6,vShellFacing));',
    'vec2 p=vec2(.5+vShellPoint.x/.73,(vShellPoint.y-1.12)/.49);',
    'if(p.x>=0.&&p.x<=1.&&p.y>=0.&&p.y<=1.&&chest>.005&&facing>.005){',
    'vec2 uv=vec2(uCrop.x+p.x*uCrop.z,1.-uCrop.y-uCrop.w+p.y*uCrop.w);',
    'vec4 photo=texture2D(uImage,uv);',
    'diffuseColor.rgb=mix(diffuseColor.rgb,photo.rgb,photo.a*chest*facing);',
    '}'
   ].join('\n'));
 };
 material.customProgramCacheKey=()=> 'closet-current-3d08-source-bound-skin-v1';
 return {material,tex};
}
export function buildAnatomicalGarmentShell(root,source){
 if(!root?.traverse||!source?.verified||!source?.textureImage||
  source?.ownerApproved!==false||source?.releaseAuthorized!==false)
  throw Error('Cannot build shirt shell without reviewed source-bound image');
 const all=[],meshes=[];
 root.traverse(obj=>{
  if(obj.isSkinnedMesh&&obj.geometry?.attributes?.skinIndex&&
   obj.geometry.attributes.skinWeight&&obj.geometry.attributes.normal&&
   obj.skeleton?.bones?.length>=25&&!obj.userData.garmentShell)
   all.push(obj);
 });
 if(all.length===0)throw Error('No real skinned body meshes for garment shell');
 const {material,tex}=shellMaterial(source);
 try{
  for(const src of all){
   const geometry=src.geometry.clone();
   // Small finite geometric offset follows actual rig, not a canvas sticker.
   const position=geometry.attributes.position,normals=geometry.attributes.normal;
   for(let i=0;i<position.count;i++){
    const amount=.007;
    position.setXYZ(i,position.getX(i)+normals.getX(i)*amount,
     position.getY(i)+normals.getY(i)*amount,
     position.getZ(i)+normals.getZ(i)*amount);
   }
   position.needsUpdate=true;
   const outer=new THREE.SkinnedMesh(geometry,material);
   outer.name='Closet Current 3D08 source-bound outer shirt';
   outer.userData.garmentShell=true;
   outer.bindMode=src.bindMode;
   outer.position.copy(src.position);outer.quaternion.copy(src.quaternion);
   outer.scale.copy(src.scale);
   outer.bind(src.skeleton,src.bindMatrix.clone());
   outer.frustumCulled=false;outer.renderOrder=2;
   src.parent.add(outer);meshes.push(outer);
  }
  if(!meshes.length)throw Error('No anatomical skinned garment pieces');
  return Object.freeze({
   shellType:'separate-skinned-mesh',
   meshes,shirtSourceId:source.id,sourceSHA256:source.sourceSHA256,
   originalTexturePreserved:true,photographedRear:false,
   originalRigSkeletons:true,offsetInModelUnits:.007,
   visualApproval:false,ownerApproved:false,releaseAuthorized:false,
   dispose(){
    for(const m of meshes){m.parent?.remove(m);m.geometry.dispose();}
    material.dispose();tex.dispose();
   }
  });
 }catch(e){
  for(const m of meshes){m.parent?.remove(m);m.geometry.dispose();}
  material.dispose();tex.dispose();throw e;
 }
}
