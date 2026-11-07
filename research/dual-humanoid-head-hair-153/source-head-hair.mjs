/**
 * FACE-HAIR153 — source-head-bone-attached, nonidentifying procedural hair
 * research for BOTH CC0 163-bone figures. The previous tiny hovering P118
 * crown cap is hidden, never used as a replacement body or customer-photo
 * derivative. All hair vertices are computed from the original skinned HEAD
 * surface measured by the existing exact P131 source method.
 *
 * NO personal hair identity, images or biometrics; NO changes to original
 * body vertices, skinning, source-JPEG textures, outfit garments or account.
 * This is a 3D appearance improvement, not "10/10" human photorealism.
 */
import * as THREE from 'three';
import {measureSkinnedFace131}
 from '../dual-humanoid-face-definition-131/face-definition.mjs';

export const HAIR153=Object.freeze({
 priority:153,figures:Object.freeze(['female','male']),
 baseMain:'d5319ed3531839b7dd158075603db09f62f3f2bf',
 parentParallel:'6e576da9d7ff6a0a439a7762cf333670d20f0131',
 donor:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 sourceOnly:true,personalHairIdentity:false,
 sourceBodyModified:false,garmentSourceModified:false,
 photorealismApproved:false,familyAlpha:'HOLD',releaseAuthorized:false
});
const groupName='research-source-head-hair-153';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const fail=why=>{const e=Error('HAIR153 '+why);e.code='hair153-source-refused';throw e;};
const smooth=(x)=>x*x*(3-2*x);
const toned=(hex,roughness=.86)=>new THREE.MeshStandardMaterial({
 color:hex,roughness,metalness:0,side:THREE.DoubleSide
});
function owned(mesh,name,group){
 mesh.name='research-hair153-'+name;
 mesh.userData.ownedMaterial=true;
 mesh.castShadow=true;
 mesh.receiveShadow=true;
 group.add(mesh);
 return mesh;
}
function surface(group,verts,indices,base,name){
 const geom=new THREE.BufferGeometry();
 geom.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geom.setIndex(indices);
 geom.computeVertexNormals();
 const mesh=owned(new THREE.Mesh(geom,toned(base)),name,group);
 return mesh;
}
function shell(group,face,figure,cz){
 const {top,centerX:cx,width:w,height:h,depth:d}=face;
 const cols=40,rows=12,verts=[],indices=[];
 for(let row=0;row<=rows;row++){
  const t=row/rows,rad=Math.sin(t*1.48);
  for(let j=0;j<=cols;j++){
   const phi=j/cols*Math.PI*2,front=Math.max(0,Math.sin(phi));
   const back=Math.max(0,-Math.sin(phi));
   const side=Math.abs(Math.cos(phi));
   // A soft, asymmetric above-eye hairline rather than the floating P118
   // upper hemisphere. P153 hair is attached to the same real head bone.
   const fall=(figure==='female'?.29:.255)+back*(figure==='female'?.18:.11)+side*.042;
   const latitude=smooth(t);
   const x=cx+w*.515*rad*Math.cos(phi);
   const z=cz+d*.525*rad*Math.sin(phi);
   const y=top+h*.012-h*fall*latitude+
     h*.010*Math.sin(phi*3+figure.length)*Math.pow(t,3);
   if(![x,y,z].every(finite))fail('invalid source-based scalp vertex');
   verts.push(x,y,z);
   if(row<rows&&j<cols){
    const q=row*(cols+1)+j;
    indices.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1);
   }
  }
 }
 return surface(group,verts,indices,
  figure==='female'?0x34251f:0x312722,'scalp-shell');
}
function hairRibbon(group,face,cz,{
 side=1,originX=.46,originZ=.18,drop=1.1,drift=.1,
 width=.09,color=0x3b2a24,seed=0
}={}){
 const {centerX:cx,top,width:w,height:h,depth:d}=face;
 const segments=10,verts=[],indices=[];
 for(let i=0;i<=segments;i++){
  const t=i/segments,curve=smooth(t);
  const xx=cx+side*w*(originX+drift*curve);
  const zz=cz+d*(originZ-.18*curve)+d*.014*Math.sin(t*4+seed);
  const yy=top-h*(.24+drop*t);
  const half=w*width*(1-.42*curve);
  for(const edge of [-1,1]){
   verts.push(xx+half*edge,yy+edge*h*.008*Math.sin(3*t+seed),
    zz-d*.019*Math.cos(edge+seed)*Math.sin(Math.PI*t));
  }
  if(i<segments){
   const k=i*2;
   indices.push(k,k+1,k+2,k+1,k+3,k+2);
  }
 }
 return surface(group,verts,indices,color,'anchored-taper-'+side+'-'+seed);
}
function subtleCrownLines(group,face,cz,figure){
 const {centerX:cx,top,width:w,height:h,depth:d}=face;
 const n=figure==='female'?7:8,lines=[];
 for(let i=0;i<n;i++){
  const fraction=(i+1)/(n+1),side=i%2?-1:1;
  const arc=new THREE.CatmullRomCurve3([
   new THREE.Vector3(cx+side*w*.035,top+h*.014,cz+d*.018),
   new THREE.Vector3(cx+side*w*(.18+fraction*.08),top-h*.022,cz+d*.25),
   new THREE.Vector3(cx+side*w*(.29+fraction*.12),top-h*.104,cz+d*.43),
   new THREE.Vector3(cx+side*w*(.38+fraction*.10),top-h*.195,cz+d*.44)
  ]);
  const tube=new THREE.Mesh(new THREE.TubeGeometry(
   arc,18,Math.max(.00028,w*.0032),4,false),
   toned(i%3===0?0x655044:0x49382f,.91));
  lines.push(owned(tube,'crown-stroke-'+i,group));
 }
 return lines;
}
function headBone(root){
 const bones=[];
 root.traverse(o=>{if(o.isBone&&/head/i.test(o.name))bones.push(o);});
 bones.sort((a,b)=>b.getWorldPosition(new THREE.Vector3()).y-
  a.getWorldPosition(new THREE.Vector3()).y);
 return bones[0]||null;
}
function sourceCounts(root){
 let bodyMeshes=0,garmentMeshes=0,maxBones=0;
 root.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  maxBones=Math.max(maxBones,o.skeleton?.bones?.length||0);
  if(o.userData?.work56Garment)garmentMeshes++;
  else bodyMeshes++;
 });
 return {bodyMeshes,garmentMeshes,maxBones};
}
export function clearSourceHeadHair153(root){
 if(!root?.traverse)return false;
 const group=root.getObjectByName(groupName);
 if(group){
  group.parent?.remove(group);
  const materials=new Set(),geometries=new Set();
  group.traverse(o=>{
   if(o.geometry)geometries.add(o.geometry);
   const array=Array.isArray(o.material)?o.material:(o.material?[o.material]:[]);
   for(const material of array)if(o.userData?.ownedMaterial)materials.add(material);
  });
  for(const geom of geometries)geom.dispose();
  for(const mat of materials)mat.dispose();
 }
 const original=root.getObjectByName('research-procedural-hair-118');
 if(original)for(const child of original.children)child.visible=true;
 return Boolean(group);
}
export function applySourceHeadHair153(root,figure){
 if(!root?.traverse||!HAIR153.figures.includes(figure))
  fail('female or male original CC0 source root required');
 if(root.getObjectByName(groupName))fail('duplicate source hair layer refused');
 const p150=root.getObjectByName('research-procedural-hair-118');
 const face131=root.getObjectByName('research-face-definition-131');
 if(!p150||!face131||p150.children.length!==1||face131.children.length<14)
  fail('P150 skin + original 2-eye P131 facial overlay required');
 const before=sourceCounts(root);
 if(before.maxBones!==163||before.bodyMeshes<1)
  fail('unchanged source 163-bone skinned body required');
 const face=measureSkinnedFace131(root);
 const head=headBone(root);
 if(!head||face.sampledHeadVertices<80||face.width<.11||face.height<.15)
  fail('source head bone and surface unavailable');
 const anchors=face.anchors;
 if(anchors.length!==2||anchors.some(x=>x.samples<4)||!anchors.every(x=>finite(x.skinZ)))
  fail('original front-facing eye/source skin region unavailable');
 const frontZ=anchors.reduce((sum,a)=>sum+a.skinZ,0)/2;
 const centerZ=frontZ-face.depth*.49;
 const hair=new THREE.Group();
 hair.name=groupName;
 // The geometry is positioned in measured donor WORLD space. Attach preserves
 // that location while parenting to the REAL existing source-head bone.
 shell(hair,face,figure,centerZ);
 if(figure==='female'){
  for(const side of [-1,1]){
   for(let j=0;j<3;j++)
    hairRibbon(hair,face,centerZ,{side,seed:j+1,
     originX:.445+j*.023,originZ:.30-j*.09,
     drop:.79+j*.13,drift:.12+j*.022,
     width:.065+j*.013,color:j%2?0x44322b:0x372820});
  }
  for(let j=0;j<6;j++){
   const x=(j-2.5)/2.5;
   hairRibbon(hair,face,centerZ,{side:x<0?-1:1,seed:j+10,
    originX:Math.abs(x)*.39,originZ:-.36,
    drop:1.02+(j%3)*.08,drift:.03,
    width:.085,color:j%2?0x4a372e:0x392720});
  }
 }else{
  for(const side of [-1,1]){
   for(let j=0;j<3;j++)
    hairRibbon(hair,face,centerZ,{side,seed:j+21,
     originX:.44+j*.018,originZ:.10-j*.08,
     drop:.21+j*.022,drift:.02,
     width:.048,color:j%2?0x47372d:0x352822});
  }
 }
 subtleCrownLines(hair,face,centerZ,figure);
 // Avoid covering the source face with the legacy crown cap. It will be
 // reenabled by clearSourceHeadHair153, or disposed by P150 on figure swap.
 for(const child of p150.children)child.visible=false;
 head.updateWorldMatrix(true,false);
 root.updateMatrixWorld(true);
 head.attach(hair);
 const after=sourceCounts(root);
 if(JSON.stringify(after)!==JSON.stringify(before)){
  clearSourceHeadHair153(root);
  fail('head shell modified original skeleton or photographed garment mesh');
 }
 let hairMeshes=0,triangles=0;
 hair.traverse(o=>{
  if(o.isMesh){
   hairMeshes++;
   triangles+=(o.geometry?.index?.count||0)/3;
  }
 });
 if(hairMeshes<(figure==='female'?18:12)||triangles<200)
  fail('incomplete layered hair geometry');
 return Object.freeze({
  figure,sourceRigBones:163,sourceBodyMeshes:after.bodyMeshes,
  sourceGarmentMeshes:after.garmentMeshes,
  sourceHeadBone:head.name,headAttached:true,
  sampledSourceHeadVertices:face.sampledHeadVertices,
  realEyeAnchors:anchors.length,retainedSourceFaceMeshes:face131.children.length,
  hairMeshes,proceduralHairTriangles:triangles,
  previousFloatingCapHidden:true,
  ownerPortraitOrHairBiometricsUsed:false,
  originalGarmentGeometryChanged:false,photorealismProven:false,
  physicalPhoneApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
