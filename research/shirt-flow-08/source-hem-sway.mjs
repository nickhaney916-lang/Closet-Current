/**
 * SHIRT-FLOW-08 — source-photographed cloth hem swing and loose skirt-of-shirt.
 * Research-only, fixed 17 original anatomical shoulder/arm poses. No pasted
 * photographic details, invented weave, source UV changes, or arbitrary skin.
 *
 * Unlike F07's centre-torso folds, this moves the *actual lower shirt hem
 * vertices* from their original source-anchored skin positions, giving
 * measurable silhouette/weight at the side and lower shirt. Smooth fading
 * toward chest/side seams protects separately sewn shoulders and collar.
 * A full TRUE-SKINNED body triangle contact pass follows in the controller.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const smooth=T.MathUtils.smoothstep;
const ramp=(x,a,b,c,d)=>smooth(x,a,b)*(1-smooth(x,c,d));
function inverseSkin(mesh,i){
 const a=mesh.geometry,sk=new T.Matrix4();sk.elements.fill(0);
 for(let k=0;k<4;k++){
  const boneId=a.attributes.skinIndex.getComponent(i,k),w=a.attributes.skinWeight.getComponent(i,k);
  const matrix=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[boneId].matrixWorld,mesh.skeleton.boneInverses[boneId]);
  for(let j=0;j<16;j++)sk.elements[j]+=matrix.elements[j]*w;
 }
 return sk.premultiply(mesh.bindMatrixInverse).multiply(mesh.bindMatrix).invert();
}
const sourceAttrs=['panelPosition','panelNormal','uv','skinIndex','skinWeight'];
function audit(m,proof){
 for(const [name,old] of proof){
  const now=m.geometry.getAttribute(name)?.array;
  if(!old){if(now)throw Error('F08 fabricated optional photographed source attribute '+name);continue;}
  if(!now||now.length!==old.length||!old.every((v,i)=>v===now[i]))
   throw Error('F08 changed original photo projection or true anatomical weights '+name);
 }
}
export function shapeTrueSourceHemSwing08(root,shirt,phase){
 if(!shirt?.stats?.sourceWeightedFolds07?.realPhotographedSourceTriangleFolds)
  throw Error('F08 requires verified original photo true folded multi-piece 3D garment');
 if(typeof phase!=='number'||!Number.isFinite(phase)||phase<0||phase>1||
   Math.abs(phase*16-Math.round(phase*16))>1e-9)
  throw Error('F08 only 17 verified true original arm samples');
 const shells=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.name==='Work56-independent-shirt-shell');
 if(shells.length<2)throw Error('F08 original sewn multi-part skinned photographed shirt required');
 const hem=shirt.stats.sourceWeightedFolds07.observedSourceHemDy?.[0];
 if(!Number.isFinite(hem)||hem>=-.26||hem<-.98)
  throw Error('F08 true photographed garment hem must be measured globally from every source panel');
 root.updateMatrixWorld(true);
 const bones=[];root.traverse(o=>{if(o.isBone)bones.push(o);});
 if(bones.length!==163)throw Error('Original 163 bone humanoid required');
 const get=name=>{
  const b=bones.find(x=>x.name===name);
  if(!b)throw Error('Missing source anatomical cloth weight anchor '+name);
  return b.getWorldPosition(new T.Vector3());
 };
 const left=get('upperarm01L'),right=get('upperarm01R');
 const le=get('lowerarm01L'),re=get('lowerarm01R');
 const c=(left.x+right.x)/2,shoulder=(left.y+right.y)/2,z=(left.z+right.z)/2;
 const arms=[le.clone().sub(left),re.clone().sub(right)];
 const raised=(arms[0].y/arms[0].length()+arms[1].y/arms[1].length())*.5;
 const spread=(Math.abs(arms[0].x)/arms[0].length()+Math.abs(arms[1].x)/arms[1].length())*.5;
 const reach=(Math.abs(arms[0].z)/arms[0].length()+Math.abs(arms[1].z)/arms[1].length())*.5;
 const motion=.48+.32*spread+.20*reach;
 let moved=0,hemVertices=0,outerSilhouette=0,locked=0,maxMeters=0;
 const sides={L:0,R:0},perComponent=[];
 for(const mesh of shells){
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  const g=mesh.geometry,p=g.getAttribute('position'),ix=g.index;
  if(!p||!ix||!g.getAttribute('panelPosition')||!g.getAttribute('panelNormal')||
     !g.getAttribute('skinWeight')||!g.getAttribute('skinIndex'))
   throw Error('F08 requires original licensed skinned source shell attributes');
  const originals=new Map(sourceAttrs.map(name=>[name,g.getAttribute(name)?.array.slice()]));
  const groups=new Map();
  for(const i of new Set(ix.array)){
   const q=mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld);
   if(![q.x,q.y,q.z].every(Number.isFinite))throw Error('F08 nonfinite source skinned world vertex');
   const key=q.toArray().map(n=>n.toFixed(5)).join(':');
   if(!groups.has(key))groups.set(key,{q,ids:[]});
   groups.get(key).ids.push(i);
  }
  const inv=mesh.matrixWorld.clone().invert();let per=0;
  for(const {q,ids} of groups.values()){
   const dy=q.y-shoulder,x=Math.abs(q.x-c);
   // A hanging bottom garment is not welded to the pelvis. Keep collar,
   // shoulder seams, chest and central photographed print protected.
   const clothHeight=-.16-hem;
   const t=(dy-hem)/clothHeight;
   const bottom=1-smooth(t,.045,.47);
   const outer=smooth(x,.035,.115)*(1-smooth(x,.295,.365));
   const seam=smooth(x,.305,.345);
   const skirt=bottom*(.65+.35*outer)*(1-.26*seam);
   if(skirt<.018){locked+=ids.length;continue;}
   const side=q.x>=c?1:-1,fb=q.z>=z?1:-1;
   // Anatomical arm position changes weight distribution across the hem.
   // Outward flare+downward settling changes *actual screen silhouette*.
   // Smooth broad waves avoid small high-frequency polygonal spikes.
   const wave=Math.sin((q.x-c)*13.5+raised*.75+(dy-hem)*5.2);
   const flare=.012+.016*outer+(.009*wave+.006*raised)*motion;
   const settle=.014+.007*(.5+.5*wave)+.006*motion;
   const backFall=.007+.008*(.5+.5*Math.cos((q.x-c)*9.0+raised));
   const delta=new T.Vector3(
     side*flare*skirt, -settle*skirt,
     fb*(.009+.010*outer+.007*wave)*skirt+fb*backFall*skirt
   );
   delta.clampLength(0,.037);
   const amplitude=delta.length();
   if(amplitude<.0001){locked+=ids.length;continue;}
   const target=q.clone().add(delta).applyMatrix4(inv);
   for(const i of ids){
    const v=target.clone().applyMatrix4(inverseSkin(mesh,i));
    if(!Number.isFinite(v.x+v.y+v.z))throw Error('F08 nonfinite true inverse skinned hem');
    p.setXYZ(i,v.x,v.y,v.z);moved++;per++;
    if(t<.15)hemVertices++;
    if(outer>.48&&t<.28)outerSilhouette++;
    sides[side>0?'R':'L']++;
   }
   maxMeters=Math.max(maxMeters,amplitude);
  }
  p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
  g.computeBoundingBox();g.computeBoundingSphere();audit(mesh,originals);
  if(per>0)perComponent.push({meshName:mesh.name,verticesMoved:per});
 }
 if(moved<220||hemVertices<32||outerSilhouette<24||maxMeters<.014||maxMeters>.03701||
    sides.L<40||sides.R<40)
  throw Error('F08 actual source-photo hem silhouette insufficient '+JSON.stringify({
   moved,hemVertices,outerSilhouette,maxMeters,sides,perComponent,hem
  }));
 return {realOriginalSourcePhotographedHemSwing:true,originalSourcePhotoUVAndSkinPreserved:true,
  actualAnatomicalBoneCount:163,realSourceHemDy:hem,phase,
  moved,hemVertices,outerSilhouette,perComponent,
  maxMeters,originalPhotoPixelsUnchanged:true,
  actualTriangleCollisionRunAfterSwing:true,bodyContactCountVerifiedAfterFit:false,
  sourcePhotoIdentityPreserved:true,generatedNewTextures:0,
  continuousPhysicsApproved:false,continuousSweptCollisionApproved:false,
  humanVisualApproved:false,physicalPhoneVerified:false,releaseAuthorized:false};
}
