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
 const {box,top}=headBounds(root),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
 const w=clamp(size.x,.095,.22),h=clamp(size.y,.15,.30),d=clamp(size.z,.09,.21);
 const group=new T.Group();group.name='research-procedural-hair-118';
 const dark=new T.MeshStandardMaterial({color:0x30221d,roughness:.84,metalness:0});
 const light=new T.MeshStandardMaterial({color:0x49352c,roughness:.88,metalness:0});
 // Keep the generated hair above and behind facial landmarks. A shallow crown
 // cap avoids covering the eyes, nose, cheeks, or most of the source skull.
 const cap=new T.Mesh(new T.SphereGeometry(1,32,16,0,Math.PI*2,0,1.38),dark);
 cap.position.set(center.x,top-h*.12,center.z);
 cap.scale.set(w*.48,h*.31,d*.48);cap.castShadow=true;cap.receiveShadow=true;
 cap.userData.ownedMaterial=true;group.add(cap);
 // Fine crown strands add a restrained hairline without crossing the face.
 for(let i=0;i<7;i++){
  const t=i/6,x=center.x+(t-.5)*w*.72;
  addTube(group,[
   [x,top-h*.08,center.z-d*.04],
   [x+(t-.5)*w*.10,top-h*.015,center.z+d*.02],
   [x+(t-.5)*w*.16,top-h*.10,center.z+d*.15]
  ],Math.max(.0015,w*.012),i%3===0?light:dark,5);
 }
 if(kind==='female'){
  // Narrow side locks follow the temples toward the rear sides of the neck;
  // the longer rear fall is placed behind the face-facing (-Z) side.
  for(const side of [-1,1]){
   for(let strand=0;strand<2;strand++){
    const offset=(strand-.5)*w*.07;
    addTube(group,[
     [center.x+side*w*.37+offset,top-h*.20,center.z+d*.06],
     [center.x+side*w*.49+offset,top-h*.43,center.z+d*.16],
     [center.x+side*w*.46+offset,top-h*.78,center.z+d*.20],
     [center.x+side*w*.36+offset,top-h*.98,center.z+d*.17]
    ],w*.047,strand===0?dark:light,6);
   }
  }
  for(let strand=0;strand<5;strand++){
   const x=center.x+(strand-2)*w*.15;
   addTube(group,[
    [x,top-h*.14,center.z+d*.20],
    [x+(strand-2)*w*.025,top-h*.62,center.z+d*.34],
    [x+(strand-2)*w*.035,top-h*1.02,center.z+d*.25]
   ],w*.035,strand%2?light:dark,6);
  }
 }else{
  // Short, fine sideburns sit at the temples, clear of the eyes and ears.
  for(const side of [-1,1]){
   addTube(group,[
    [center.x+side*w*.43,top-h*.25,center.z+d*.08],
    [center.x+side*w*.48,top-h*.42,center.z+d*.16],
    [center.x+side*w*.44,top-h*.57,center.z+d*.18]
   ],w*.035,light,6);
  }
 }
 const headBones=[];
 root.traverse(o=>{if(o.isBone&&/head/i.test(o.name))headBones.push(o);});
 const head=headBones.sort((a,b)=>b.getWorldPosition(new T.Vector3()).y-a.getWorldPosition(new T.Vector3()).y)[0];
 const parent=head||root;
 parent.updateWorldMatrix(true,false);root.updateWorldMatrix(true,true);
 // Preserve the fitted world-space geometry while parenting it to the head.
 parent.attach(group);
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
