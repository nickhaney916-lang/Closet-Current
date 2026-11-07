import * as T from 'three';

/**
 * FACE131 — minimal anatomical facial definition for the pinned CC0 dual
 * 163-bone figures, applied ONLY after opt-in research P118 shading/hair.
 * No facial identity reconstruction, biometrics, user image input, remote
 * assets, garment changes, skeleton edits or production integration.
 *
 * Facial placements are derived from SKINNED BODY WORLD VERTICES (never the
 * procedural P118 hair or photographed garment meshes). The small sclera,
 * iris, pupil, lid and brow accents stay coupled to the existing head bone.
 */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const eligible=o=>o.isSkinnedMesh&&!o.userData?.work56Garment;
const owned=(mesh,name)=>{
 mesh.name='research-face131-'+name;
 mesh.castShadow=false;
 mesh.receiveShadow=false;
 mesh.userData.ownedMaterial=true;
 return mesh;
};
const pigment=(color,roughness)=>new T.MeshPhysicalMaterial({
 color,metalness:0,roughness,clearcoat:0.08,
 clearcoatRoughness:0.27,depthWrite:true,
 side:T.FrontSide
});
const toWorld=(mesh,i,tmp)=>mesh.applyBoneTransform(
 i,tmp.fromBufferAttribute(mesh.geometry.attributes.position,i)
).applyMatrix4(mesh.matrixWorld).clone();

export function measureSkinnedFace131(root){
 if(!root?.traverse)throw Error('FACE131 CC0 skinned figure required');
 root.updateMatrixWorld(true);
 const points=[],bounds=new T.Box3(),tmp=new T.Vector3();
 root.traverse(o=>{
  if(!eligible(o))return;
  o.updateMatrixWorld(true);
  o.skeleton?.update();
  const attr=o.geometry?.attributes?.position;
  if(!attr||typeof o.applyBoneTransform!=='function')return;
  for(let i=0;i<attr.count;i++){
   const p=toWorld(o,i,tmp);
   if(![p.x,p.y,p.z].every(Number.isFinite))
    throw Error('FACE131 invalid skinned source vertex');
   points.push(p);bounds.expandByPoint(p);
  }
 });
 if(points.length<120||!Number.isFinite(bounds.max.y))
  throw Error('FACE131 anatomical skinned surface unavailable');
 const centerX=(bounds.min.x+bounds.max.x)/2;
 const top=bounds.max.y;
 // Skinned figure normalized to 2m, head is in its upper ~0.35 m. Ignore
 // outstretched limb vertices by taking only a narrow central head zone.
 const candidates=points.filter(p=>p.y>=top-.345&&
  Math.abs(p.x-centerX)<.205);
 const b=new T.Box3();
 for(const p of candidates)b.expandByPoint(p);
 if(candidates.length<80||!Number.isFinite(b.min.z))
  throw Error('FACE131 insufficient original skinned-head surface');
 const dims=b.getSize(new T.Vector3());
 const w=clamp(dims.x,.12,.27);
 const h=clamp(dims.y,.18,.34);
 const d=clamp(dims.z,.10,.27);
 const cx=(b.min.x+b.max.x)/2;
 const eyeY=top-h*.47;
 // The actual app's front camera is on +Z. Find the visible source-skin
 // depth at each eye rather than placing details on the back of the skull.
 const anchors=[];
 for(const side of [-1,1]){
  const x=cx+side*w*.185;
  const relevant=candidates.filter(p=>
   Math.abs(p.x-x)<w*.11&&Math.abs(p.y-eyeY)<h*.075);
  if(relevant.length<4)
   throw Error('FACE131 source eye surface not resolved');
  const skinZ=Math.max(...relevant.map(p=>p.z));
  anchors.push({side,x,y:eyeY,skinZ,samples:relevant.length});
 }
 return Object.freeze({top,centerX:cx,
  width:w,height:h,depth:d,
  sampledSkinnedVertices:points.length,
  sampledHeadVertices:candidates.length,
  anchors:anchors.map(x=>Object.freeze(x)),
  faceForward:'positive-z',bodyMeshUnmodified:true
 });
}
function tube(points,radius,color,name,group){
 const m=owned(new T.Mesh(new T.TubeGeometry(
  new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),
  12,radius,6,false
 ),color),name);
 group.add(m);return m;
}
export function applyDualHumanoidFace131(root,figure){
 if(!root||!['female','male'].includes(figure))
  throw Error('FACE131 female/male source-rig figure required');
 if(root.getObjectByName('research-face-definition-131'))
  throw Error('FACE131 owner head detail may only be applied once');
 const face=measureSkinnedFace131(root);
 const hairTone=figure==='female'?0x433028:0x382d27;
 const irisColor=figure==='female'?0x576962:0x565d63;
 const sclera=pigment(0xd2cbc3,.48),iris=pigment(irisColor,.35),
  pupil=pigment(0x171c1d,.22),highlight=pigment(0xf0ede3,.23),
  lid=pigment(0x956e62,.84),eyebrow=pigment(hairTone,.9);
 const group=new T.Group();group.name='research-face-definition-131';
 const width=face.width,height=face.height,depth=face.depth;
 for(const a of face.anchors){
  const x=a.x,y=a.y,z=a.skinZ;
  // Eye shapes intentionally use actual scaled facial dimensions (~9 mm
  // half-width for a ~160 mm head), avoiding cartoon-sized eye balls.
  const rx=width*.055,ry=height*.023,rz=depth*.023;
  const eye=owned(new T.Mesh(new T.SphereGeometry(1,20,12),sclera),
   'sclera-'+a.side);
  eye.position.set(x,y,z+rz*.12);eye.scale.set(rx,ry,rz);
  group.add(eye);
  const round=(meshName,material,scale,pos)=>{
   const m=owned(new T.Mesh(new T.SphereGeometry(1,16,12),material),meshName+'-'+a.side);
   m.position.set(...pos);m.scale.set(...scale);
   group.add(m);return m;
  };
  round('iris',iris,[rx*.45,ry*.81,rz*.21],
   [x,y,z+rz*.94]);
  round('pupil',pupil,[rx*.21,ry*.49,rz*.13],
   [x,y,z+rz*1.15]);
  round('catchlight',highlight,[rx*.10,ry*.20,rz*.06],
   [x-rx*.10,y+ry*.16,z+rz*1.28]);
  // Flesh-colored upper/lower eyelid rim follows this genuine head patch.
  // Deliberately subtle, with hairline over the upper lid.
  tube([[x-rx*.95,y+ry*.15,z+rz*.25],
   [x-rx*.42,y+ry*.88,z+rz*.42],
   [x+rx*.33,y+ry*.89,z+rz*.41],
   [x+rx*.95,y+ry*.13,z+rz*.27]],
   Math.max(.00048,width*.0038),lid,'upper-lid-'+a.side,group);
  tube([[x-rx*.95,y-ry*.13,z+rz*.25],
   [x-rx*.30,y-ry*.73,z+rz*.38],
   [x+rx*.36,y-ry*.62,z+rz*.40],
   [x+rx*.95,y-ry*.12,z+rz*.27]],
   Math.max(.00036,width*.003),lid,'lower-lid-'+a.side,group);
  tube([[x-rx*.95,y+ry*2.7,z+rz*.06],
   [x-rx*.28,y+ry*3.5,z+rz*.13],
   [x+rx*.43,y+ry*3.3,z+rz*.11],
   [x+rx*1.0,y+ry*2.3,z+rz*.05]],
   Math.max(.0007,width*.006),eyebrow,'eyebrow-'+a.side,group);
 }
 // Use the existing actual head bone, not a replacement pose/skeleton.
 const heads=[];
 root.traverse(o=>{if(o.isBone&&/head/i.test(o.name))heads.push(o);});
 heads.sort((a,b)=>b.getWorldPosition(new T.Vector3()).y-
  a.getWorldPosition(new T.Vector3()).y);
 if(!heads.length)throw Error('FACE131 source head bone absent');
 const head=heads[0];
 head.updateWorldMatrix(true,false);root.updateMatrixWorld(true,true);
 head.attach(group);
 const rig=new Set();
 root.traverse(o=>{if(eligible(o))rig.add(o.skeleton);});
 const sourceRigBones=Math.max(...[...rig].map(s=>s?.bones?.length||0),0);
 if(sourceRigBones!==163)
  throw Error('FACE131 requires unchanged pinned 163-bone figure');
 return Object.freeze({
  figure,
  sourceRigBones,
  originalSkinnedVertices:face.sampledSkinnedVertices,
  originalHeadVertices:face.sampledHeadVertices,
  headBone:head.name,
  faceMeshes:group.children.length,
  eyeCount:2,
  sourceGeometryChanged:false,
  sourceGarmentGeometryChanged:false,
  procedurallyGenerated:true,
  photorealismProven:false,
  ownerFaceOrBiometricsUsed:false,
  personalPhotoPixelsUsed:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
