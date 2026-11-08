/** P174 (HOLD) — measured bilateral shoulder-cap/sleeve physical easing on
 * actual original 163-bone photograph-skinned shirt, after P172 torso contour.
 * All matching cap/shell seam vertices share one world-space displacement.
 * No owner image reconstruction, fabric simulation, or all-pose certification.
 */
export const SOURCE_SHA_174='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const sm=(v,a,b)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
const immutable=['panelPosition','panelNormal','skinIndex','skinWeight','uv'];
export function easeOffset174({x,y,shoulderY,sign}={}){
 if(![x,y,shoulderY,sign].every(Number.isFinite)||![-1,1].includes(sign))
  throw Error('P174 source shoulder coordinates invalid');
 if(Math.sign(x)!==sign)return {dx:0,dy:0,move:0};
 const t=sm(Math.abs(x),.295,.365)*(1-sm(Math.abs(x),.525,.61))*
  sm(y-shoulderY,-.31,-.175)*(1-sm(y-shoulderY,.065,.17));
 const dx=sign*.0056*t,dy=-.0078*t;
 return {dx,dy,move:Math.hypot(dx,dy)};
}
export function easeSourceShoulderSleeve174(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 const st=shirt?.stats;
 if(st?.sourcePhotoShoulderSleeve174)throw Error('P174 duplicate physical shoulder seam');
 if(st?.sourceSHA256!==SOURCE_SHA_174||st.sourcePhotoTorsoContour172!==true||
    st.anatomical163BoneSkeletonPreserved172!==true||
    st.sourcePhotoPixelsAndRigUnchanged172!==true||
    !Array.isArray(shirt.meshes)||typeof root?.traverse!=='function')
  throw Error('P174 requires verified original P172 source physical shirt');
 root.updateMatrixWorld?.(true);
 const meshlist=shirt.meshes.filter(m=>m?.isSkinnedMesh&&
  (m.name==='Work56-independent-shirt-shell'||m.userData?.work45IndependentShoulderCap));
 if(!meshlist.some(m=>m.name==='Work56-independent-shirt-shell')||
    !['L','R'].every(s=>meshlist.some(m=>m.userData?.work45IndependentShoulderCap===s))||
    meshlist.some(m=>m.skeleton?.bones?.length!==163))
  throw Error('P174 real skinned torso and both original sewn shoulder caps missing');
 const V=meshlist[0].position.constructor,bones={},body=new Set();
 root.traverse(o=>{
  if(o?.isBone&&['upperarm01L','upperarm01R'].includes(o.name))
   bones[o.name.endsWith('L')?'L':'R']=o.getWorldPosition(new V());
  if(o?.isSkinnedMesh&&!o.userData?.work56Garment&&o.skeleton)body.add(o.skeleton);
 });
 if(!bones.L||!bones.R||Math.sign(bones.L.x)===Math.sign(bones.R.x)||
    meshlist.some(m=>!body.has(m.skeleton)))
  throw Error('P174 original 163-bone shoulder/body mismatch');
 const store=new Map(),groups=new Map();let centerProtected=0;
 for(const mesh of meshlist){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g?.getAttribute?.('position'),ix=g?.index;
  if(!p||p.itemSize!==3||p.count<12||!ix||ix.count<3||ix.count%3)
   throw Error('P174 invalid actual skinned source triangle geometry');
  for(let j=0;j<ix.count;j++){
   const i=ix.getX(j);if(!Number.isInteger(i)||i<0||i>=p.count)
    throw Error('P174 invalid original source triangle index');
  }
  const originals=new Map();
  for(const name of immutable){
   const a=g.getAttribute(name);
   if(name==='uv'&&!a)continue;
   if(!a||a.count!==p.count)throw Error('P174 missing original image or skin '+name);
   originals.set(name,a.array.slice());
  }
  store.set(mesh,{g,p,originals,positions:p.array.slice(),inv:mesh.matrixWorld.clone().invert()});
  for(let i=0;i<p.count;i++){
   const q=new V(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('P174 nonfinite original source mesh');
   if(Math.abs(q.x)<.295)centerProtected++;
   const key=[q.x,q.y,q.z].map(v=>v.toFixed(5)).join(':');
   if(!groups.has(key))groups.set(key,{q,refs:[]});
   groups.get(key).refs.push({mesh,i,q});
  }
 }
 let moved=0,max=0,seams=0,preGap=0,postGap=0;
 const sides={L:{moved:0,caps:0,shells:0,shared:0},
  R:{moved:0,caps:0,shells:0,shared:0}};
 for(const {q,refs} of groups.values()){
  const side=Math.sign(q.x)===Math.sign(bones.L.x)?'L':'R';
  if(refs.some(r=>r.mesh.userData?.work45IndependentShoulderCap)&&
      refs.some(r=>r.mesh.name==='Work56-independent-shirt-shell')){
   seams++;sides[side].shared++;
   for(const r of refs.slice(1))preGap=Math.max(preGap,q.distanceTo(r.q));
  }
  const d=easeOffset174({x:q.x,y:q.y,shoulderY:bones[side].y,sign:Math.sign(bones[side].x)});
  if(d.move<.00016)continue;
  if(!Number.isFinite(d.move)||d.move>.00961)
   throw Error('P174 physical source shirt exceeds bounded 9.61mm sleeve motion');
  const target=new V(q.x+d.dx,q.y+d.dy,q.z);
  for(const {mesh,i} of refs){
   const o=store.get(mesh),p=target.clone().applyMatrix4(o.inv);
   if(![p.x,p.y,p.z].every(Number.isFinite))throw Error('P174 invalid inverse world mesh');
   o.positions[i*3]=p.x;o.positions[i*3+1]=p.y;o.positions[i*3+2]=p.z;
   moved++;sides[side].moved++;
   if(mesh.userData?.work45IndependentShoulderCap)sides[side].caps++;
   if(mesh.name==='Work56-independent-shirt-shell')sides[side].shells++;
  }
  max=Math.max(max,d.move);
 }
 for(const {refs} of groups.values()){
  if(new Set(refs.map(r=>r.mesh)).size<2)continue;
  const pts=refs.map(({mesh,i})=>{const a=store.get(mesh).positions;
   return new V(a[i*3],a[i*3+1],a[i*3+2]).applyMatrix4(mesh.matrixWorld);});
  for(const p of pts.slice(1))postGap=Math.max(postGap,p.distanceTo(pts[0]));
 }
 for(const {g,originals} of store.values())for(const [name,prior] of originals){
  const now=g.getAttribute(name).array;
  if(now.length!==prior.length||!now.every((v,i)=>v===prior[i]))
   throw Error('P174 original image, UV or anatomical skin mutated '+name);
 }
 if(moved<40||max<.0025||max>.00961||centerProtected<100||
    seams<6||preGap>5e-5||postGap>5e-5||
    ['L','R'].some(s=>sides[s].moved<15||sides[s].caps<5||
      sides[s].shells<5||sides[s].shared<3))
  throw Error('P174 bilateral source shoulder/cap geometry acceptance unavailable '+
   JSON.stringify({moved,max,centerProtected,seams,preGap,postGap,sides}));
 // Atomic commit AFTER all source, skeleton, seam, bilateral and geometry proofs.
 for(const {g,p,positions} of store.values()){
  p.array.set(positions);p.needsUpdate=true;
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 }
 return {...shirt,stats:{...st,sourcePhotoShoulderSleeve174:true,
  shoulder174SourceSHA:SOURCE_SHA_174,shoulder174MovedVertices:moved,
  shoulder174MaxMeters:max,shoulder174ProtectedCenter:centerProtected,
  shoulder174SharedSeams:seams,shoulder174GapBefore:preGap,
  shoulder174GapAfter:postGap,shoulder174Sides:sides,
  shoulder174OriginalPixelsUVSkinAnd163BonesPreserved:true,
  shoulder174RearPhotoVerified:false,shoulder174HumanApproved:false,
  shoulder174AllPoseCollisionCertified:false,releaseAuthorized:false}};
}
