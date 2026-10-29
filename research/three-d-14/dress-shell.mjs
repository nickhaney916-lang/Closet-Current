/**
 * 3D-14. Experimental standalone dress skinned to the existing real CC0 rig.
 * Original photographed Work47 cutout is sampled on the front only.
 * Distinct A-line skirt and fitted bodice, no fabricated rear/folds.
 */
import * as T from 'three';
export const DRESS_ID='commons-0053';
export const DRESS_RELEASE='HOLD';
export function requireDress(c,reviewed){
 if(!reviewed||!c||c.id!==DRESS_ID||c.type!=='dress'||
  !/^[a-f0-9]{64}$/.test(c.sourceSHA256||'')||
  c.ownerApproved!==false||c.releaseAuthorized!==false||
  c.humanVisualApproval!==false||c.realFabricTexture!==true||
  !c.cutout||!Array.isArray(c.cropRect)||c.cropRect.length!==4||
  c.cropRect.some(x=>!Number.isFinite(x)||x<0||x>1)||
  c.cropRect[0]+c.cropRect[2]>1.00001||c.cropRect[1]+c.cropRect[3]>1.00001||
  !Array.isArray(c.baseColor)||c.baseColor.length!==3||
  c.baseColor.some(x=>!Number.isFinite(x)||x<0||x>1))
  throw Error('Source-bound provisional dress review required');
 return c;
}
export function dressRings(waist,neck,radius){
 if(![waist,neck,radius].every(Number.isFinite)||waist<.85||waist>1.35||
  neck<waist+.3||neck>1.85||radius<.15||radius>.38)throw Error('Invalid anatomical dress landmark');
 const low=Math.max(.55,waist-.51),r=radius;
 return [
  [low,r+.23,(r+.23)*.74],
  [waist-.35,r+.16,(r+.16)*.76],
  [waist-.20,r+.095,(r+.095)*.77],
  [waist,r+.030,(r+.030)*.77],
  [waist+.18,r+.02,(r+.02)*.80],
  [waist+.33,r+.065,(r+.065)*.86],
  [neck-.10,r+.10,(r+.10)*.81],
  [neck-.045,r+.055,(r+.055)*.77],
  [neck+.005,.123,.10]
 ];
}
export function buildSourceDress(root,raw,{reviewed=false,segments=64}={}){
 const source=requireDress(raw,reviewed);
 if(!root?.traverse||!Number.isInteger(segments)||segments<24||segments>96)
  throw Error('Anatomical figure required');
 root.updateMatrixWorld(true);
 const body=[],bones=new Map();
 root.traverse(o=>{
  if(o.isSkinnedMesh&&!o.userData.work56Garment&&!o.userData.work60Pants)body.push(o);
  if(o.isBone)bones.set(o.name.replaceAll('.',''),o);
 });
 const base=body.sort((a,b)=>b.geometry.attributes.position.count-a.geometry.attributes.position.count)[0];
 if(!base?.skeleton||base.skeleton.bones.length<25)throw Error('Real CC0 skeleton required');
 const waistB=bones.get('spine04'),neckB=bones.get('neck01');
 if(!waistB||!neckB)throw Error('Anatomical waist/neck bones missing');
 const waist=waistB.getWorldPosition(new T.Vector3()),neck=neckB.getWorldPosition(new T.Vector3());
 const pos=base.geometry.attributes.position, inverse=base.matrixWorld.clone().invert();
 const nearby=[];
 for(let i=0;i<pos.count;i+=5){
  const p=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(base.matrixWorld);
  if(Math.abs(p.y-waist.y)<.07&&Math.abs(p.x-waist.x)<.47)nearby.push(p);
 }
 const r=Math.min(.34,Math.max(.20,nearby.length?Math.max(...nearby.map(p=>Math.abs(p.x-waist.x))):.24));
 const rings=dressRings(waist.y,neck.y,r), names=base.skeleton.bones.map(b=>b.name.replaceAll('.',''));
 const bone=(label,fallback)=>{let n=names.indexOf(label);if(n<0)n=names.indexOf(fallback);
  if(n<0)throw Error('Missing real skeleton bone '+label);return n;};
 const spine=bone('spine04','spine03'),pelvis=bone('pelvis','spine04'),
  left=bone('upperleg01L','pelvis'),right=bone('upperleg01R','pelvis');
 const positions=[],rest=[],skinIndices=[],skinWeights=[],triangles=[];
 for(let ring=0;ring<rings.length;ring++){
  const [y,rx,rz]=rings[ring];
  for(let j=0;j<=segments;j++){
   const ang=j*2*Math.PI/segments,xs=Math.sin(ang),zs=Math.cos(ang);
   const p=new T.Vector3(waist.x+rx*xs,y,waist.z+rz*zs);
   rest.push(p.x,p.y,p.z);p.applyMatrix4(inverse);
   positions.push(p.x,p.y,p.z);
   const spineW=T.MathUtils.smoothstep(y,waist.y-.06,waist.y+.18);
   const l=(1-spineW)*(.07+.05*Math.max(0,-xs)),rr=(1-spineW)*(.07+.05*Math.max(0,xs));
   skinIndices.push(spine,pelvis,left,right);skinWeights.push(spineW,1-spineW-l-rr,l,rr);
   if(ring<rings.length-1&&j<segments){
    const a=ring*(segments+1)+j,b=a+segments+1;
    triangles.push(a,b,a+1,a+1,b,b+1);
   }
  }
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('dressRest',new T.Float32BufferAttribute(rest,3));
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndices,4));
 geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeights,4));
 geometry.setIndex(triangles);geometry.computeVertexNormals();
 const map=new T.Texture(source.cutout);
 map.colorSpace=T.SRGBColorSpace;map.flipY=true;map.needsUpdate=true;
 const fabric=new T.Color().setRGB(...source.baseColor,T.SRGBColorSpace);
 const material=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,side:T.DoubleSide});
 const shaderFragment=[
  '#include <color_fragment>',
  'diffuseColor.rgb=uDressBase;',
  'float du=(vDressRest.x-uDressCenterX)/uDressWidth;',
  'float dv=(vDressRest.y-uDressHem)/(uDressTop-uDressHem);',
  'float front=smoothstep(.15,.54,vDressNormal.z);',
  'float edge=1.-smoothstep(.55,.92,abs(du));',
  'if(abs(du)<1.&&dv>0.&&dv<1.){',
  'vec2 uv=vec2(uDressCrop.x+(.5+.5*du)*uDressCrop.z,1.-uDressCrop.y-uDressCrop.w+dv*uDressCrop.w);',
  'vec4 samplePixel=texture2D(uDressImage,uv);',
  'diffuseColor.rgb=mix(diffuseColor.rgb,samplePixel.rgb,samplePixel.a*front*edge);',
  '}'
 ].join('\n');
 material.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,{
   uDressImage:{value:map},uDressCrop:{value:new T.Vector4(...source.cropRect)},
   uDressBase:{value:fabric},uDressHem:{value:rings[0][0]},
   uDressTop:{value:rings.at(-1)[0]},uDressCenterX:{value:waist.x},
   uDressWidth:{value:Math.max(...rings.map(row=>row[1]))}
  });
  sh.vertexShader=sh.vertexShader.replace('void main() {',
   'attribute vec3 dressRest;varying vec3 vDressRest;varying vec3 vDressNormal;\nvoid main() {');
  sh.vertexShader=sh.vertexShader.replace('#include <worldpos_vertex>',
   '#include <worldpos_vertex>\nvDressRest=dressRest;vDressNormal=normalize(mat3(modelMatrix)*normal);');
  sh.fragmentShader=sh.fragmentShader.replace('void main() {',
   'varying vec3 vDressRest;varying vec3 vDressNormal;uniform sampler2D uDressImage;uniform vec4 uDressCrop;uniform vec3 uDressBase;uniform float uDressHem;uniform float uDressTop;uniform float uDressCenterX;uniform float uDressWidth;\nvoid main() {');
  sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',shaderFragment);
 };
 const mesh=new T.SkinnedMesh(geometry,material);
 mesh.name='3D14-provisional-original-RGB-dress-HOLD';
 mesh.userData.work56Garment=true;mesh.userData.experimentalDress14=true;
 mesh.position.copy(base.position);mesh.quaternion.copy(base.quaternion);mesh.scale.copy(base.scale);
 base.parent.add(mesh);mesh.bind(base.skeleton,base.bindMatrix);mesh.frustumCulled=false;
 const stats={triangles:triangles.length/3,ringCount:rings.length,
  sourceId:source.id,sourceSHA256:source.sourceSHA256,sharedSkeleton:mesh.skeleton===base.skeleton,
  frontOriginalPixels:true,back:'source-median-inferred',realSeparate3DMesh:true,
  photoVisualAccepted:false,collisionValidated:false,releaseAuthorized:false};
 return {mesh,meshes:[mesh],stats,dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();map.dispose();}};
}
