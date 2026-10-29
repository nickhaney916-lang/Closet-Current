/**
 * 3D-08 (HOLD): extract a REAL separate garment triangle shell from the
 * CC0 skinned human A-pose, offset it from body and map original Work47 RGB.
 * Static pose only: not a rigged garment, cloth physics, or wearer sizing.
 */
import * as THREE from 'three';
const range=(n,a,b)=>n>=a&&n<=b;
export function shirtZone(p){
 if(!p||![p.x,p.y,p.z].every(Number.isFinite))return null;
 const ax=Math.abs(p.x);
 // The licensed male model's chest projects farther forward in its own
 // anatomical surface than the female model. A narrow fixed depth clip
 // creates a huge WHITE CENTER-HOLE on the male shirt. Since source meshes
 // are already CC0-skinned real body surfaces, use a generous safe depth.
 if(!range(p.y,1.075,1.675)||Math.abs(p.z)>1.0)return null;
 if(ax<=.355)return 'torso';
 if(ax<=.86)return 'sleeve';
 return null;
}
const vertex=(mesh,i,attr,inv)=>{
 const p=new THREE.Vector3().fromBufferAttribute(attr,i);
 if(mesh.isSkinnedMesh&&typeof mesh.applyBoneTransform==='function')
  mesh.applyBoneTransform(i,p);
 return p.applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);
};
const normal=p=>{
 const out=new THREE.Vector3(p.x,0,p.z);
 if(out.lengthSq()<1e-6)out.set(0,0,1);
 return out.normalize();
};
/**
 * Fit a contiguous front cloth panel over the real anatomical chest, using
 * nearby frontmost GLB body positions as depth landmarks. Without this,
 * the male CC0 mesh has a large *uncovered center-chest gap* despite thousands
 * of "torso" source triangles and green mechanical GPU tests.
 * The panel is a separate curved surface; it is not a body shader/sticker.
 */
export function addFittedFrontPanel(samples,coords,UV){
 if(!Array.isArray(samples)||samples.length<500||!Array.isArray(coords)||!Array.isArray(UV))
  throw Error('Insufficient verified anatomical front landmarks');
 const rows=16,cols=20,grid=[];
 const ease=(v,a,b)=>{
  const t=Math.max(0,Math.min(1,(v-a)/(b-a)));
  return t*t*(3-2*t);
 };
 const halfWidthAt=v=>.265+.052*ease(v,.10,.62)-.180*ease(v,.79,1);
 for(let r=0;r<=rows;r++){
  const v=r/rows,halfWidth=halfWidthAt(v);
  const row=[];
  for(let c=0;c<=cols;c++){
   const nx=c/cols*2-1,x=nx*halfWidth;
   // Gentle curved front hem: side edges rise slightly; neckline tapers
   // into the anatomy rather than remaining a flat square rectangle.
   const y=1.13+.49*v+.021*(1-v)**5*nx*nx;
   let maxDepth=-Infinity,closest=Infinity,nearest=-Infinity;
   for(const p of samples){
    if(p.z<-.02)continue; // Only actual front landmarks
    const dx=Math.abs(p.x-x),dy=Math.abs(p.y-y);
    const d2=dx*dx+dy*dy;
    if(d2<closest){closest=d2;nearest=p.z;}
    if(dx<.07&&dy<.07)maxDepth=Math.max(maxDepth,p.z);
   }
   if(!Number.isFinite(maxDepth))maxDepth=nearest;
   if(!Number.isFinite(maxDepth))throw Error('Cannot fit anatomical front garment');
   // Tiny offset from original skin plus easing to avoid hard flat board.
   const z=Math.max(.04,maxDepth)+.025;
   row.push({x,y,z});
  }
  grid.push(row);
 }
 const push=(p)=>{
  coords.push(p.x,p.y,p.z);
  UV.push(.5+p.x/.73,(p.y-1.12)/.49);
 };
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const bl=grid[r][c],br=grid[r][c+1],
   tl=grid[r+1][c],tr=grid[r+1][c+1];
  // +Z visible source photo faces the camera/front.
  push(bl);push(br);push(tl);
  push(br);push(tr);push(tl);
 }
 return Object.freeze({triangles:rows*cols*2,rows,cols,
  hemHalfWidth:halfWidthAt(0),chestHalfWidth:halfWidthAt(.65),
  neckHalfWidth:halfWidthAt(1),hemEdgeRise:.021,
  sourceDerivedDepth:true,frontIsIndependentMeshSurface:true});
}

export function buildSeparateShirtShell(root,group,{minTriangles=600,maxTriangles=150000}={}){
 if(!root?.isObject3D||!group?.isObject3D||
  !Number.isSafeInteger(maxTriangles)||maxTriangles<20000||
  !Number.isSafeInteger(minTriangles)||minTriangles<100)
  throw Error('Verified rigged anatomical body required');
 group.updateWorldMatrix(true,true);root.updateWorldMatrix(true,true);
 const inverse=group.matrixWorld.clone().invert();
 const coords=[],UV=[],zones={torso:0,sleeve:0},frontLandmarks=[];
 let scanned=0,skinnedCount=0;
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||!mesh.geometry?.attributes?.position)return;
  skinnedCount++;
  const geo=mesh.geometry,attr=geo.attributes.position,idx=geo.index;
  const count=idx?idx.count:attr.count;
  if(count%3)throw Error('Anatomical body has unsupported primitive');
  scanned+=count/3;
  if(scanned>maxTriangles)throw Error('Body triangles exceed research budget');
  for(let i=0;i<count;i+=3){
   const p=[0,1,2].map(k=>vertex(mesh,idx?idx.getX(i+k):i+k,attr,inverse));
   const center=p[0].clone().add(p[1]).add(p[2]).multiplyScalar(1/3);
   for(const point of p){
    if(Math.abs(point.x)<.48&&point.y>=1.06&&point.y<=1.70&&point.z>=-.02)
     frontLandmarks.push({x:point.x,y:point.y,z:point.z});
   }
   const zone=shirtZone(center);
   if(!zone||p.some(v=>!shirtZone(v)||Math.abs(v.x-center.x)>.14||
    Math.abs(v.y-center.y)>.14))continue;
   for(const v of p){
    const offset=.016+(zone==='torso'?.004:.007)+(v.y<1.17?.008:0);
    const inflated=v.clone().addScaledVector(normal(v),offset);
    coords.push(inflated.x,inflated.y,inflated.z);
    UV.push(.5+inflated.x/.73,(inflated.y-1.12)/.49);
   }
   zones[zone]++;
  }
 });
 const panel=addFittedFrontPanel(frontLandmarks,coords,UV);
 const triangles=coords.length/9;
 if(triangles<minTriangles||zones.torso<minTriangles*.5||
  zones.sleeve<minTriangles*.05)
  throw Error('Not enough anatomical torso and shoulder/arm surface for shirt');
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));
 geometry.computeVertexNormals();geometry.computeBoundingBox();
 return {geometry,triangles,zones,skinnedCount,scanned,
  frontPanelTriangles:panel.triangles,anatomicalFrontLandmarks:frontLandmarks.length,
  separateGarmentMesh:true,sharesBodyGeometry:false,
  garmentRigged:false,clothPhysics:false,
  inferredBack:true,releaseAuthorized:false};
}
export function makeSourceClothingMaterial(source){
 if(!source?.verified||source.releaseAuthorized!==false||
  !Array.isArray(source.cropRect)||source.cropRect.length!==4||
  !source.textureImage||!Array.isArray(source.baseColor))
  throw Error('No verified original-RGB Work47 garment');
 const texture=new THREE.Texture(source.textureImage);
 texture.flipY=true;texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;
 texture.needsUpdate=true;
 const material=new THREE.MeshStandardMaterial({
  color:new THREE.Color().setRGB(...source.baseColor,THREE.SRGBColorSpace),
  roughness:.89,metalness:0,side:THREE.DoubleSide
 });
 material.onBeforeCompile=shader=>{
  shader.uniforms.uActualSource={value:texture};
  shader.uniforms.uVerifiedCrop={value:new THREE.Vector4(...source.cropRect)};
  shader.vertexShader=shader.vertexShader.replace('void main() {',
   'varying vec3 vGarmentBody;\nvarying vec3 vGarmentNormal;\nvoid main() {');
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
   '#include <worldpos_vertex>\nvGarmentBody=position;\nvGarmentNormal=normal;');
  shader.fragmentShader=shader.fragmentShader.replace('void main() {',
   'varying vec3 vGarmentBody;\nvarying vec3 vGarmentNormal;\nuniform sampler2D uActualSource;\nuniform vec4 uVerifiedCrop;\nvoid main() {');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',[
   '#include <color_fragment>',
   'vec2 p=vec2(.5+vGarmentBody.x/.73,(vGarmentBody.y-1.12)/.49);',
   'float torso=1.0-smoothstep(.24,.355,abs(vGarmentBody.x));',
   'float forward=smoothstep(.10,.40,vGarmentNormal.z);',
   'float vertical=smoothstep(1.12,1.18,vGarmentBody.y)*(1.0-smoothstep(1.53,1.64,vGarmentBody.y));',
   'if(p.x>=0.0&&p.x<=1.0&&p.y>=0.0&&p.y<=1.0){',
   ' vec2 uv=vec2(uVerifiedCrop.x+p.x*uVerifiedCrop.z,1.0-uVerifiedCrop.y-uVerifiedCrop.w+p.y*uVerifiedCrop.w);',
   ' vec4 original=texture2D(uActualSource,uv);',
   ' diffuseColor.rgb=mix(diffuseColor.rgb,original.rgb,original.a*torso*forward*vertical);',
   '}'
  ].join('\n'));
 };
 material.customProgramCacheKey=()=> 'cc-actual-glb-separate-shirt-shell-08';
 return {material,texture,originalSourcePixels:true,
  photoBackKnown:false,photographedSleeves:false};
}
