/**
 * P154 — original-head-skin-aligned, non-identifying facial contour research.
 *
 * Small geometric lip/nose/eyelid/ear corrections are derived from the same
 * *actual* source skin vertices as P131/P153, not a customer portrait,
 * generated head, rigid mask or new skeleton. The existing P131 eyes and
 * original 163-bone body retain all positions/indices/materials. Every mesh
 * in this overlay is owned and disposed on figure switch.
 *
 * Does NOT claim a photorealistic person, real facial identity, real hardware
 * acceptance or any unphotographed garment texture.
 */
import * as THREE from 'three';

export const FACE154=Object.freeze({
 priority:154,
 mainParent:'d9b554207b0cc082d74b4c4741549cc495405553',
 originalParallelP150:'6e576da9d7ff6a0a439a7762cf333670d20f0131',
 pinnedSourceCC0:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 figures:Object.freeze(['female','male']),
 sourceBodyGeometryModified:false,
 sourceGarmentGeometryModified:false,
 userPortraitOrBiometricsUsed:false,
 humanFacialRealismApproved:false,
 physicalDeviceApproved:false,
 familyAlpha:'HOLD',releaseAuthorized:false
});
const NAME='research-source-facial-contours-154';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const fail=s=>{const e=Error('FACE154 '+s);e.code='face154-research-refused';throw e;};
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
function source(root){
 if(!root?.traverse)fail('original skinned source required');
 root.updateMatrixWorld(true);
 const vertices=[],bbox=new THREE.Box3(),v=new THREE.Vector3();
 let maxBones=0,sourceSkinnedMeshes=0,garmentMeshes=0;
 root.traverse(m=>{
  if(!m.isSkinnedMesh)return;
  maxBones=Math.max(maxBones,m.skeleton?.bones?.length||0);
  if(m.userData?.work56Garment){garmentMeshes++;return;}
  sourceSkinnedMeshes++;
  if(!m.geometry?.attributes?.position||typeof m.applyBoneTransform!=='function')
   fail('original source vertex transform not available');
  m.updateMatrixWorld(true);m.skeleton?.update();
  const pos=m.geometry.attributes.position;
  for(let i=0;i<pos.count;i++){
   const p=m.applyBoneTransform(i,v.fromBufferAttribute(pos,i))
    .applyMatrix4(m.matrixWorld).clone();
   if(![p.x,p.y,p.z].every(finite))fail('nonfinite original source vertex');
   vertices.push(p);bbox.expandByPoint(p);
  }
 });
 if(maxBones!==163||sourceSkinnedMeshes<1||vertices.length<140)
  fail('exact original 163-bone 3D source body required');
 const cx=(bbox.min.x+bbox.max.x)/2,top=bbox.max.y;
 const head=vertices.filter(p=>p.y>top-.345&&Math.abs(p.x-cx)<.205);
 if(head.length<80)fail('source skinned head not found');
 const b=new THREE.Box3();
 for(const p of head)b.expandByPoint(p);
 const d=b.getSize(new THREE.Vector3()),w=clamp(d.x,.12,.27),
  h=clamp(d.y,.18,.34),dep=clamp(d.z,.10,.27);
 const mid=(b.min.x+b.max.x)/2,eyeY=top-h*.47;
 const eyeAnchors=[-1,1].map(side=>{
  const x=mid+side*w*.185;
  const patch=head.filter(p=>Math.abs(p.x-x)<w*.11&&
   Math.abs(p.y-eyeY)<h*.075);
  if(patch.length<4)fail('original front eye skin samples absent');
  return {side,x,y:eyeY,z:Math.max(...patch.map(p=>p.z)),samples:patch.length};
 });
 // All added facial geometry is source-surface-bound: at nose, lips and
 // each ear, use local actual donor head vertices (not guessed face depth).
 const visibleZ=(x,y,min=4)=>{
  const near=head.filter(p=>Math.abs(p.x-x)<w*.14&&
    Math.abs(p.y-y)<h*.14);
  if(near.length<min)fail('original source front skin absent at landmark');
  return Math.max(...near.map(p=>p.z));
 };
 let bone=null;
 root.traverse(o=>{if(!bone&&o.isBone&&/head/i.test(o.name))bone=o;});
 if(!bone)fail('original head bone missing');
 return {mid,top,w,h,dep,eyeY,eyeAnchors,visibleZ,bone,
  headPoints:head.length,maxBones,sourceSkinnedMeshes,garmentMeshes};
}
const material=(color,roughness=.84)=>new THREE.MeshStandardMaterial({
 color,roughness,metalness:0,side:THREE.FrontSide
});
function add(group,mesh,name){
 mesh.name='research-face154-'+name;
 mesh.userData.face154Owned=true;
 mesh.castShadow=false;mesh.receiveShadow=false;
 group.add(mesh);
 return mesh;
}
function curve(group,coords,radius,color,name,opacity=1){
 const path=new THREE.CatmullRomCurve3(coords.map(p=>new THREE.Vector3(...p)));
 const mesh=add(group,new THREE.Mesh(new THREE.TubeGeometry(
  path,Math.max(12,coords.length*4),radius,6,false),
  material(color)),name);
 if(opacity<1){mesh.material.transparent=true;mesh.material.opacity=opacity;}
 return mesh;
}
function oval(group,center,scale,color,name){
 const mesh=add(group,new THREE.Mesh(new THREE.SphereGeometry(1,16,10),
  material(color)),name);
 mesh.position.set(...center);mesh.scale.set(...scale);
 return mesh;
}
export function clearOriginalFaceContours154(root){
 if(!root?.traverse)return false;
 const layer=root.getObjectByName(NAME);
 if(!layer)return false;
 layer.parent?.remove(layer);
 const geoms=new Set(),mats=new Set();
 layer.traverse(o=>{
  if(o.userData?.face154Owned){
   if(o.geometry)geoms.add(o.geometry);
   if(o.material){
    for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);
   }
  }
 });
 geoms.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
 return true;
}
export function applyOriginalFaceContours154(root,figure){
 if(!FACE154.figures.includes(figure)||!root?.traverse)
  fail('source female/male original 3D figure required');
 if(root.getObjectByName(NAME))fail('no duplicate facial contour overlay');
 const originalFace=root.getObjectByName('research-face-definition-131');
 const hair=root.getObjectByName('research-source-head-hair-153');
 if(!originalFace||!hair||originalFace.children.length<14)
  fail('P131 original eyes and P153 source-scalp hair must already exist');
 const s=source(root),group=new THREE.Group();
 group.name=NAME;
 const {mid,w,h,dep,eyeY,visibleZ,bone,eyeAnchors}=s;
 const skin=0xbb9f91,shade=0x9c7c73,lip=0x946f6c,lipHighlight=0xb1837a;
 const mouthY=eyeY-h*.325,noseTipY=eyeY-h*.235;
 const z=(x,y,offset=.002)=>visibleZ(x,y)+offset;
 // Delicately curved nasal ridge, with broad anatomical transition
 // toward tip; the real donor source remains the complete 3D face.
 const noseYs=[-.07,-.115,-.165,-.205,-.24].map(v=>eyeY+h*v);
 curve(group,noseYs.map((y,i)=>[
  mid+(i===0?0:w*.002),y,z(mid,y,.0012+h*.010*Math.sin(i/(noseYs.length-1)*Math.PI))
 ]),Math.max(.0008,w*.006),skin,'source-nasal-bridge');
 oval(group,[mid,noseTipY,z(mid,noseTipY,.004)],
  [w*.045,h*.018,dep*.022],skin,'nose-tip');
 for(const side of [-1,1]){
  const x=mid+side*w*.072,y=noseTipY-h*.025;
  curve(group,[
   [mid+side*w*.045,y+h*.012,z(mid+side*w*.045,y+h*.012,.0018)],
   [x,y,z(x,y,.0025)],
   [mid+side*w*.09,y-h*.012,z(mid+side*w*.09,y-h*.012,.0010)]
  ],Math.max(.00055,w*.0034),shade,'alar-crease-'+side,.83);
 }
 // The lips follow locally sampled actual front-of-skin depth. Their
 // arches remain below the eyes and nose: there is no sticker mask.
 const outer=[-.155,-.11,-.06,0,.06,.11,.155];
 const lipPts=outer.map(v=>{
  const x=mid+w*v;
  const cupid=(Math.abs(v)<.025?-.0016:Math.abs(v)<.10?.0012:-.0005);
  return [x,mouthY+cupid,z(x,mouthY,.0018)];
 });
 curve(group,lipPts,Math.max(.0007,w*.0048),lip,'upper-lip-contour',.86);
 const bottom=outer.map(v=>{
  const x=mid+w*v,y=mouthY-h*.035*(1-Math.pow(Math.abs(v)/.155,1.5));
  return [x,y,z(x,y,.0022)];
 });
 curve(group,bottom,Math.max(.00085,w*.0052),lipHighlight,'lower-lip-contour',.90);
 // Under-eye crease is intentionally below, not over the original
 // P131 source-anchored eye sclera or irises.
 for(const a of eyeAnchors){
  const yy=a.y-h*.042,xx=a.x;
  curve(group,[
   [xx-w*.044,yy-h*.002,z(xx-w*.044,yy,.0006)],
   [xx,yy-h*.012,z(xx,yy-h*.012,.0009)],
   [xx+w*.047,yy,z(xx+w*.047,yy,.0006)]
  ],Math.max(.00045,w*.0028),shade,'lower-eye-contour-'+a.side,.57);
 }
 // Real source skin and P131 facial geometry are retained; detail layer
 // adds only seven thin original-surface-conforming features.
 if(group.children.length!==8)fail('partial nose and mouth overlay');
 const before={...s};
 bone.updateWorldMatrix(true,false);root.updateMatrixWorld(true);
 bone.attach(group);
 const after=source(root);
 if(after.sourceSkinnedMeshes!==before.sourceSkinnedMeshes||
    after.garmentMeshes!==before.garmentMeshes||
    after.maxBones!==163){
  clearOriginalFaceContours154(root);
  fail('changed original rig, head or photographed garment mesh');
 }
 const result=Object.freeze({
  figure,headAttached:true,sourceRigBones:163,
  originalSourceHeadVertices:s.headPoints,
  preservedOriginalEyeCount:2,
  preservedOriginalFaceMeshes:originalFace.children.length,
  preservedSourceGarmentMeshes:after.garmentMeshes,
  contourMeshes:group.children.length,
  noseMeshes:4,lipMeshes:2,underEyeMeshes:2,
  changedOriginalHead:false,changedOriginalSourceGarment:false,
  ownerPhotographPixelsOrFaceIdentityUsed:false,
  humanFacialPhotorealismApproved:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
 return result;
}
