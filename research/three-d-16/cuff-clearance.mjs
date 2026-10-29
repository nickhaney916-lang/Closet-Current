/**
 * 3D-16 — narrow forearm/cuff correction on the existing separate skinned shirt.
 *
 * The Work59/Work61 shirt already owns its real licensed source-photo panel
 * and shared CC0 skeleton. This adjustment only moves actual cloth positions
 * outward 0–8mm and toward the actual wrist 0–10mm near the two openings; original photo UV, masks, skin
 * weights, body geometry, material and shader are NEVER changed.
 *
 * This is a targeted geometric attempt, not certified body/cloth collision.
 */
import * as T from 'three';

const WRIST_TYPES=Object.freeze(['L','R']);
const MIN_NORMAL=.022;
const MAX_NORMAL=.13;
const MAX_OFFSET=.008;
const MAX_AXIAL=.010;
const fade=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);

export function wristAxes(root){
 if(!root?.isObject3D)throw Error('Actual rigged anatomical body required');
 root.updateMatrixWorld(true);
 const bones=new Map();root.traverse(o=>{
  if(o.isBone)bones.set(o.name.replaceAll('.',''),o);
 });
 return WRIST_TYPES.map(side=>{
  const lower=bones.get('lowerarm01'+side),wrist=bones.get('wrist'+side);
  if(!lower||!wrist)throw Error('CC0 wrist/forearm anatomy missing: '+side);
  const elbow=lower.getWorldPosition(new T.Vector3()),
   end=wrist.getWorldPosition(new T.Vector3());
  const axis=end.clone().sub(elbow),length=axis.length();
  if(!Number.isFinite(length)||length<.10||length>.8)throw Error('Unreliable wrist axis');
  return Object.freeze({side,elbow,end,axis,axisLengthSq:axis.lengthSq()});
 });
}

export function protectShirtCuffClearance(shirt,root,{
  offset=MAX_OFFSET
}={}){
 if(!shirt?.meshes?.length||!root?.isObject3D||
  !Number.isFinite(offset)||offset<=0||offset>MAX_OFFSET)
  throw Error('Validated separate shirt/forearm cuff correction required');
 const arms=wristAxes(root);
 let moved=0,maxMovement=0,eligible=0,forearmRows={L:0,R:0};
 for(const mesh of shirt.meshes){
  // The actual shirt body is the one mesh with original JPEG image coordinates.
  // Do not move the separate neutral collar band or any other garment.
  if(mesh.name!=='Work56-independent-shirt-shell')continue;
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.attributes.position;
  if(!p||!g.attributes.panelPosition||!g.attributes.skinWeight)throw Error('Source-bound shirt panel required');
  const inv=mesh.matrixWorld.clone().invert();
  // Original sewn boundary may have coincident vertices across edge rims.
  // Use exact quantized coordinates to keep each shared seam watertight.
  const seen=new Map();
  for(let i=0;i<p.count;i++){
   const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
   const key=q.toArray().map(v=>v.toFixed(6)).join(',');
   if(seen.has(key)){
    const v=seen.get(key);p.setXYZ(i,v.x,v.y,v.z);continue;
   }
   let result=q;
   for(const arm of arms){
    if(Math.sign(q.x)!==Math.sign(arm.end.x)||Math.abs(q.x)<.27)continue;
    const fromElbow=q.clone().sub(arm.elbow);
    const t=fromElbow.dot(arm.axis)/arm.axisLengthSq;
    // This is exclusively the wrist opening and the adjacent inner cuff.
    if(t<.72||t>1.13)continue;
    const nearest=arm.elbow.clone().addScaledVector(arm.axis,T.MathUtils.clamp(t,0,1));
    const radial=q.clone().sub(nearest),dist=radial.length();
    if(dist<MIN_NORMAL||dist>MAX_NORMAL)continue;
    eligible++;
    const amount=offset*fade(t,.72,.94);
    // Work56 clips this sleeve 13mm short of the wrist. Close most of that
    // artificial length gap using the REAL forearm-to-wrist axis, not a
    // fabricated picture or cloth cap, while retaining the natural opening.
    const axial=MAX_AXIAL*fade(t,.81,.95);
    if(amount<=1e-7&&axial<=1e-7)continue;
    result=q.clone().addScaledVector(radial.multiplyScalar(1/dist),amount)
     .addScaledVector(arm.axis.clone().normalize(),axial);
    moved++;forearmRows[arm.side]++;
    maxMovement=Math.max(maxMovement,Math.hypot(amount,axial));
    break;
   }
   const local=result.clone().applyMatrix4(inv);
   p.setXYZ(i,local.x,local.y,local.z);seen.set(key,local);
  }
  p.needsUpdate=true;
  g.computeVertexNormals();
  // No write to panelPosition/panelNormal: printed AJ logo remains source-locked.
  g.computeBoundingBox();g.computeBoundingSphere();
 }
 return {...shirt,stats:{...shirt.stats,
  cuffFit:'near-wrist-radial-ease',
  cuffEligibleVertices:eligible,cuffMovedVertices:moved,
  cuffCorrectionByArm:{...forearmRows},
  cuffMaxCorrection:maxMovement,cuffCorrectionLimit:offset,
  cuffAxialExtension:MAX_AXIAL,originalPanelCoordinatesPreserved:true,
  minClearance:null,collisionValidated:false,releaseAuthorized:false
 }};
}
