/**
 * P172 (HOLD): physically alter the existing, skinned, source-photographed
 * shirt shell's torso curvature without synthesizing an owner's photograph.
 * The exact P541 + verified P60 donor is the ONLY supported caller.
 * This deliberately limited rest-pose surface treatment is not cloth simulation,
 * collision acceptance or photorealism certification.
 */
export const SHIRT_SOURCE_SHA172 = 'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const smooth=(v,a,b)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function torsoOffset172({x,y,z,centerZ}){
 if(![x,y,z,centerZ].every(Number.isFinite))throw Error('P172 nonfinite original shirt vertex');
 const radius=Math.abs(x),front=smooth(z-centerZ,.025,.075);
 const chest=(1-smooth(radius,.115,.235))*smooth(y,1.195,1.295)*(1-smooth(y,1.505,1.595));
 const waist=smooth(radius,.105,.155)*(1-smooth(radius,.217,.255))*
  smooth(y,1.155,1.205)*(1-smooth(y,1.275,1.365));
 // A measured-scale three-dimensional bulge replaces some of the original
 // planar front. A separate tapered hem/waist change softens hard side fall.
 // Both are zero at the source seam/neck/hem, and never pull into the body.
 const dz=.0165*front*chest,dx=-Math.sign(x)*.0105*front*waist;
 return {dx,dz,move:Math.hypot(dx,dz),front};
}
const expectedAttributes=['panelPosition','panelNormal','skinIndex','skinWeight'];
const key=({x,y,z})=>[x,y,z].map(v=>v.toFixed(5)).join(':');
/**
 * In-place mesh vertex editing is atomic for source/geometry validation: all
 * target positions and immutable-attribute checks are evaluated before writes.
 * We allow no cross-owner data, new textures, fabricated back photographs,
 * shaders, skeleton replacement, UV edits or persistent writes.
 */
export function contourSourceVerifiedShirt172(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(shirt?.stats?.sourcePhotoTorsoContour172)throw Error('P172 refuse repeated torso deformation');
 if(shirt?.stats?.sourceSHA256!==SHIRT_SOURCE_SHA172||
    (shirt?.stats?.sourceId!==undefined&&shirt.stats.sourceId!=='commons-0003')||
    !Number.isFinite(shirt?.stats?.envelope?.center)||
    !Array.isArray(shirt?.meshes)||typeof root?.traverse!=='function')
  throw Error('P172 requires exact licensed verified source shirt, original rig and envelope');
 const meshes=shirt.meshes.filter(m=>m?.name==='Work56-independent-shirt-shell');
 if(meshes.length!==1||!meshes[0].isSkinnedMesh||
   meshes[0].skeleton?.bones?.length!==163)
  throw Error('P172 exact source 163-bone sewn shirt shell unavailable');
 let bodySkeleton=false;
 root.traverse(o=>{if(o?.isSkinnedMesh&&!o.userData?.work56Garment&&o.skeleton===meshes[0].skeleton)bodySkeleton=true;});
 if(!bodySkeleton)throw Error('P172 source garment skeleton not on actual body');
 const centerZ=shirt.stats.envelope.center;
 const pending=[];let moved=0,maxMove=0,frontMoved=0,protectedBack=0;
 for(const mesh of meshes){
  mesh.updateWorldMatrix(true,false);
  const geo=mesh.geometry,p=geo?.getAttribute?.('position'),ix=geo?.index;
  if(!p||p.itemSize!==3||p.count<100||!ix||ix.count<3||ix.count%3||
     expectedAttributes.some(name=>geo.getAttribute(name)?.count!==p.count))
   throw Error('P172 incomplete original sewn photo shell or immutable rig attributes');
  const original=new Map(expectedAttributes.map(name=>[name,geo.getAttribute(name).array.slice()]));
  const positions=new Float32Array(p.array); // commit only after validation
  const inv=mesh.matrixWorld.clone().invert(),V=mesh.position.constructor,groups=new Map();
  for(let i=0;i<p.count;i++){
   const q=new V(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('P172 nonfinite source mesh');
   const k=key(q);
   if(!groups.has(k))groups.set(k,{q,indices:[]});
   groups.get(k).indices.push(i);
  }
  for(let i=0;i<ix.count;i++){
   const idx=ix.getX(i);
   if(!Number.isInteger(idx)||idx<0||idx>=p.count)
    throw Error('P172 invalid existing source triangle indices');
  }
  for(const {q,indices} of groups.values()){
   const delta=torsoOffset172({x:q.x,y:q.y,z:q.z,centerZ});
   if(delta.front<.1)protectedBack+=indices.length;
   if(delta.move<.0001)continue;
   if(delta.move>.0201||!Number.isFinite(delta.move))throw Error('P172 strict 20mm garment deformation envelope exceeded');
   const newLocal=new V(q.x+delta.dx,q.y,q.z+delta.dz).applyMatrix4(inv);
   if(![newLocal.x,newLocal.y,newLocal.z].every(Number.isFinite))
    throw Error('P172 invalid shirt vertex inverse bind position');
   for(const i of indices){
    positions[i*3]=newLocal.x;positions[i*3+1]=newLocal.y;positions[i*3+2]=newLocal.z;
    moved++;if(delta.front>.5)frontMoved++;
   }
   maxMove=Math.max(maxMove,delta.move);
  }
  if(moved<30||frontMoved<30||maxMove<.006||protectedBack<20)
   throw Error('P172 cannot demonstrate measured front-only physical garment geometry change');
  for(const [name,before] of original){
   const current=geo.getAttribute(name).array;
   if(current.length!==before.length||!current.every((x,i)=>x===before[i]))
    throw Error('P172 source photo, UV or skin changed before geometry commit: '+name);
  }
  pending.push({mesh,p,geo,positions});
 }
 for(const {p,geo,positions} of pending){
  p.array.set(positions);p.needsUpdate=true;
  geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
 }
 return {...shirt,stats:{...shirt.stats,sourcePhotoTorsoContour172:true,
  physicalTorsoContourMovedVertices172:moved,
  physicalTorsoContourFrontVertices172:frontMoved,
  physicalTorsoContourProtectedBackVertices172:protectedBack,
  physicalTorsoContourMaxMeters172:maxMove,
  sourcePhotoPixelsAndRigUnchanged172:true,
  originalFrontPhotoSourceSHA172:SHIRT_SOURCE_SHA172,
  anatomical163BoneSkeletonPreserved172:true,
  originalPhotographedBackVerified:false,
  fullBodyCollisionCertified:false,allPoseCertified:false,
  humanVisualApproved:false,arbitraryOwnerPhoto3DApproved:false,
  releaseAuthorized:false}};
}
