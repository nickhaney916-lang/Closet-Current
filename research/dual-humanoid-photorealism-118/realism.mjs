import * as T from 'three';

/**
 * Research-only enhancement for the pinned CC0 skinned figures. It changes no
 * clothing geometry, source pixels, skeleton, camera, or saved-wardrobe data.
 * The source mannequin remains the fallback whenever the query opt-in is off.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function headBounds(root){
 root.updateMatrixWorld(true);
 const total=new T.Box3().setFromObject(root),top=total.max.y;
 const b=new T.Box3();let count=0;
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||mesh.userData?.work56Garment)return;
  mesh.updateMatrixWorld(true);mesh.skeleton?.update();
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld);
   if(q.y>=top-.42&&Math.abs(q.x-(total.min.x+total.max.x)/2)<.34){b.expandByPoint(q);count++;}
  }
 });
 if(count<80||!Number.isFinite(b.min.x)||!Number.isFinite(b.max.y))throw Error('REAL118 could not locate a source-rig head region');
 return {box:b,total,top,count};
}
function addTube(group,points,radius,material,radial=7){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
 const mesh=new T.Mesh(new T.TubeGeometry(curve,14,radius,radial,false),material);
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.ownedMaterial=true;group.add(mesh);return mesh;
}
function hairFor(root,kind){
 const {box,total,top}=headBounds(root),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 const w=clamp(size.x,.095,.22),h=clamp(size.y,.15,.30),d=clamp(size.z,.09,.21);
 const group=new T.Group();group.name='research-procedural-hair-118';
 const dark=new T.MeshStandardMaterial({color:0x30221d,roughness:.84,metalness:0});
 const light=new T.MeshStandardMaterial({color:0x49352c,roughness:.88,metalness:0});
 // A fitted scalp cap sits above the existing forehead and facial landmarks.
 const cap=new T.Mesh(new T.SphereGeometry(1,32,20,0,Math.PI*2,0,1.78),dark);
 cap.position.set(center.x,top-h*.22,center.z-d*.04);
 cap.scale.set(w*.57,h*.58,d*.61);cap.castShadow=true;cap.receiveShadow=true;cap.userData.ownedMaterial=true;group.add(cap);
 // Fine swept strands break the smooth cap silhouette without a helmet shell.
 for(let i=0;i<7;i++){
  const t=i/6,side=i%2?1:-1;
  const x=center.x+side*w*(.38-.20*t);
  addTube(group,[
   [x,top-h*(.08+.05*t),center.z+d*.05],
   [center.x+side*w*(.20-.10*t),top-h*(.02+.05*t),center.z-d*.02],
   [center.x-side*w*.02,top-h*(.12+.08*t),center.z-d*.28]
  ],Math.max(.0018,w*.018),i%3===0?light:dark,5);
 }
 const headBones=[];
 root.traverse(o=>{if(o.isBone&&/head/i.test(o.name))headBones.push(o);});
 const head=headBones.sort((a,b)=>b.getWorldPosition(new T.Vector3()).y-a.getWorldPosition(new T.Vector3()).y)[0];
 const parent=head||root;
 parent.updateWorldMatrix(true,false);root.updateWorldMatrix(true,true);
 // Use Object3D.attach to preserve the measured world-space fit while making
 // the hair follow the rig's head bone when one is present.
 parent.attach(group);
 if(kind==='female'){
  // Two separated, tapered side locks and a rear fall give the female figure
  // a shoulder-length silhouette while leaving eyes, cheeks, neckline and
  // the source shirt's shoulder edge visible.
  for(const side of [-1,1]){
   for(let strand=0;strand<3;strand++){
    const offset=(strand-1)*w*.09;
    addTube(group,[
     [center.x+side*(w*.36+offset),top-h*.18,center.z+d*.02],
     [center.x+side*(w*.53+offset),top-h*.38,center.z-d*.10],
     [center.x+side*(w*.48+offset),top-h*.78,center.z-d*.06],
     [center.x+side*(w*.37+offset),top-h*1.05,center.z-d*.14]
    ],w*(strand===1?.105:.075),strand===1?dark:light,7);
   }
  }
  for(let strand=0;strand<5;strand++){
   const x=center.x+(strand-2)*w*.16;
   addTube(group,[
    [x,top-h*.18,center.z-d*.34],
    [x+(strand-2)*w*.035,top-h*.64,center.z-d*.48],
    [x+(strand-2)*w*.045,top-h*1.12,center.z-d*.30]
   ],w*.065,strand%2?light:dark,7);
  }
 }else if(kind==='male'){
  // Short temple pieces and fine crown strands read as a close natural cut.
  for(const side of [-1,1]){
   addTube(group,[
    [center.x+side*w*.46,top-h*.30,center.z],
    [center.x+side*w*.51,top-h*.48,center.z-d*.02],
    [center.x+side*w*.43,top-h*.66,center.z+d*.02]
   ],w*.075,light,7);
  }
 }
 return {group,headRegion:{width:w,height:h,depth:d,vertices:headBounds(root).count,headBone:head?.name||null}};
}
function improveSkinMaterial(material){
 if(!material?.isMeshStandardMaterial||material.userData?.dualHumanoid118)return false;
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=shader=>{
  previous?.(shader);
  shader.uniforms.uNaturalSkin118={value:1};
  shader.fragmentShader=shader.fragmentShader.replace(
   'uniform float uDressPresentation;',
   'uniform float uDressPresentation;\nuniform float uNaturalSkin118;'
  );
  const mark='diffuseColor.rgb=mix(diffuseColor.rgb,neutralCloth,baseCoverage);';
  if(!shader.fragmentShader.includes(mark))throw Error('REAL118 expected base mannequin coverage shader');
  shader.fragmentShader=shader.fragmentShader.replace(mark,mark+`
       float skinCloud118=sin(vStudioBody.x*11.0+sin(vStudioBody.y*8.0+vStudioBody.z*5.0))*.48+
        sin(vStudioBody.y*17.0+vStudioBody.z*13.0)*.22;
       float skinGrain118=sin(vStudioBody.x*137.0+sin(vStudioBody.y*113.0+vStudioBody.z*89.0))*.5;
       vec3 skinTone118=vec3(.66,.445,.36)+skinCloud118*vec3(.022,.018,.016)+skinGrain118*.004;
       diffuseColor.rgb=mix(diffuseColor.rgb,skinTone118,uNaturalSkin118*(1.0-baseCoverage));
`);
  const rough='#include <roughnessmap_fragment>';
  if(!shader.fragmentShader.includes(rough))throw Error('REAL118 expected standard PBR roughness stage');
  shader.fragmentShader=shader.fragmentShader.replace(rough,`
    roughnessFactor=mix(roughnessFactor,.70+skinCloud118*.035,uNaturalSkin118*(1.0-baseCoverage));
    ${rough}`);
 };
 material.roughness=.72;material.metalness=0;material.needsUpdate=true;
 material.userData={...material.userData,dualHumanoid118:true};
 return true;
}
export function applyDualHumanoidRealism118(root,kind){
 if(!root||!['female','male'].includes(kind))throw Error('REAL118 pinned male/female skinned figure required');
 let bodyMaterials=0;
 root.traverse(o=>{
  if(!o.isSkinnedMesh||o.userData?.work56Garment)return;
  const list=Array.isArray(o.material)?o.material:[o.material];
  for(const m of list)if(improveSkinMaterial(m))bodyMaterials++;
 });
 if(bodyMaterials<1)throw Error('REAL118 found no standard skinned-body material to improve');
 const hair=hairFor(root,kind);
 return Object.freeze({figure:kind,bodyMaterials,hairMeshes:hair.group.children.length,
  sourceRigBones:Math.max(0,...(function*(){let n=0;root.traverse(o=>{if(o.isSkinnedMesh)n=Math.max(n,o.skeleton?.bones?.length||0)});yield n;})()),
  headRegion:hair.headRegion,license:'procedural geometry; pinned model remains CC0',sourceGarmentGeometryChanged:false});
}
