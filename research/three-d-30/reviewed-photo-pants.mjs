/** 3D-30 / HOLD: optional photographed FRONT of a separate anatomical pant mesh.
 * The exact original commons-0021 has NO approved alpha cutout yet. The default
 * is deliberately unchanged neutral cloth; this module cannot create a mask,
 * invent a rear photo, or authorize a family preview.
 */
import * as THREE from 'three';
export const PANTS_SOURCE=Object.freeze({
 id:'commons-0021',
 originalSHA256:'04c0ca5bed1bee26e83be98b9a992619b0777811a7fb8a99fe955939334bbd8c',
 previewOnly:true,
 originalBenchmarkMaskAvailable:false,
 releaseAuthorized:false
});
export const PANTS_RESEARCH_SOURCE=Object.freeze({
 id:'commons-public-domain-jeans-2005',
 originalSHA256:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 cutoutSHA256:'e51ed275c6ff1c18d37dfbb821d8994576868f707c551da4fcccea1eaa4b9441',
 originalBenchmarkMaskAvailable:true,
 sourcePage:'https://commons.wikimedia.org/wiki/File:Jeans.jpg',
 license:'public domain',ownerApproved:false,releaseAuthorized:false
});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function requireReviewedPhotoPants(source,{reviewed=false}={}){
 const isLegacy=source?.id===PANTS_SOURCE.id&&source?.sourceSHA256===PANTS_SOURCE.originalSHA256;
 const isResearch=source?.id===PANTS_RESEARCH_SOURCE.id&&source?.sourceSHA256===PANTS_RESEARCH_SOURCE.originalSHA256&&source?.cutoutSHA256===PANTS_RESEARCH_SOURCE.cutoutSHA256;
 if(reviewed!==true||(!isLegacy&&!isResearch)||source?.type!=='pants'||
 !/^[a-f0-9]{64}$/.test(source?.cutoutSHA256||'')||
 source.originalVerified!==true||source.cutoutVerified!==true||
 source.visibleSourceRGBPreserved!==true||source.frontOrientationReviewed!==true||
 !source.cutout||!Number.isSafeInteger(source.cutout.width)||!Number.isSafeInteger(source.cutout.height)||
 source.cutout.width<64||source.cutout.height<64||
 source.ownerApproved!==false||source.humanVisualApproval!==false||
 source.releaseAuthorized!==false||source.provisional!==true||
 !Array.isArray(source.cropRect)||source.cropRect.length!==4||
 source.cropRect.some(x=>!finite(x)||x<0||x>1)||
 source.cropRect[2]<.15||source.cropRect[3]<.15||
 source.cropRect[0]+source.cropRect[2]>1.000001||
 source.cropRect[1]+source.cropRect[3]>1.000001)
  throw Error('Original hash-verified front-oriented pants cutout and explicit review required');
 return source;
}
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export function projectReviewedPhotoPants(pants,source,{reviewed=false}={}){
 requireReviewedPhotoPants(source,{reviewed});
 const mesh=pants?.meshes?.[0],g=mesh?.geometry,rest=g?.getAttribute('pantsRest');
 if(!mesh?.isSkinnedMesh||pants.meshes.length!==1||pants.stats?.photoApplied!==false||
 !rest||rest.itemSize!==3||rest.count!==g.getAttribute('position')?.count||
 mesh.material?.isMeshStandardMaterial!==true||!mesh.userData.work60Pants)
  throw Error('Only original neutral skinned pants can receive reviewed front pixels');
 let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
 for(let i=0;i<rest.count;i++){const x=rest.getX(i),y=rest.getY(i),z=rest.getZ(i);
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);
  maxY=Math.max(maxY,y);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
 }
 if(![minX,minY,minZ,maxX,maxY,maxZ].every(finite)||maxX-minX<.20||
 maxX-minX>.90||maxY-minY<.30||maxY-minY>1.70||maxZ-minZ<.12)
  throw Error('Original pants body extent unsuitable for front photo registration');
 const [cx,cy,cw,ch]=source.cropRect,uv=new Float32Array(rest.count*2),
  front=new Float32Array(rest.count),midZ=(minZ+maxZ)/2,
  halfDepth=Math.max(.05,(maxZ-minZ)*.35);
 for(let i=0;i<rest.count;i++){
  const x=rest.getX(i),y=rest.getY(i),z=rest.getZ(i);
  uv[i*2]=clamp(cx+cw*(x-minX)/(maxX-minX),cx,cx+cw);
  uv[i*2+1]=clamp(1-cy-ch+ch*(y-minY)/(maxY-minY),1-cy-ch,1-cy);
  front[i]=clamp((z-midZ)/halfDepth);
 }
 // Source UV is deliberately an independent attribute, never replacing
 // anatomical position/skin/rest/normal; original photograph and mask unchanged.
 const texture=new THREE.Texture(source.cutout);
 texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=true;texture.needsUpdate=true;
 g.setAttribute('pantsSourceUV',new THREE.BufferAttribute(uv,2));
 g.setAttribute('pantsSourceFront',new THREE.BufferAttribute(front,1));
 const material=mesh.material,prior=material.onBeforeCompile;
 material.onBeforeCompile=shader=>{
  prior?.(shader);
  shader.uniforms.uPantsOriginalPhoto={value:texture};
  shader.vertexShader=shader.vertexShader.replace('void main() {',
   'attribute vec2 pantsSourceUV; attribute float pantsSourceFront; varying vec2 vPantsSourceUV; varying float vPantsSourceFront; void main() {');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\nvPantsSourceUV=pantsSourceUV;vPantsSourceFront=pantsSourceFront;');
  shader.fragmentShader=shader.fragmentShader.replace('void main() {',
   'varying vec2 vPantsSourceUV; varying float vPantsSourceFront; uniform sampler2D uPantsOriginalPhoto; void main() {');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
   '#include <color_fragment>\nvec4 sourcePantsPixel=texture2D(uPantsOriginalPhoto,vPantsSourceUV); float sourcePantsOpacity=smoothstep(0.95,0.99,sourcePantsPixel.a)*smoothstep(0.20,0.80,vPantsSourceFront); diffuseColor.rgb=mix(diffuseColor.rgb,sourcePantsPixel.rgb,sourcePantsOpacity);');
 };
 material.customProgramCacheKey=()=> 'cc3d30-reviewed-pants-front-v1';
 material.needsUpdate=true;
 let disposed=false;
 return {
  meshes:pants.meshes,
  stats:{...pants.stats,photoApplied:true,sourceId:source.id,
   sourceSHA256:source.sourceSHA256,cutoutSHA256:source.cutoutSHA256,
   originalImagePreserved:true,originalRGBPreserved:true,photoFrontOnly:true,
   backMaterial:'unphotographed-neutral',orientationReviewed:true,
   imageMapping:'original-source-front-projection-not-tailored-fit',
   collisionValidated:false,humanVisualApproval:false,releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;texture.dispose();pants.dispose();}
 };
}
