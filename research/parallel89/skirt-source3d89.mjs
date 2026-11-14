/**
 * Parallel 89: original photographed Commons-0043 SKIRT independent from the
 * Commons-0053 DRESS. Actual source alpha determines silhouette; only front
 * original RGB is projected. Source rear, physical sizing, drape and fit are
 * unobserved. This is a research SkinnedMesh PROPOSAL, never consumer clothing.
 */
import * as THREE from 'three';
import {createHash} from 'node:crypto';
export const SKIRT_SOURCE89=Object.freeze({
 id:'commons-0043',category:'skirt',slot:'bottom',
 originalSHA256:'c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344',
 license:'CC0',publisher:'Honolulu Museum of Art, source photograph attributed to Hiart',
 photograph:'https://commons.wikimedia.org/wiki/File:Woman%27s_summer_skirt_from_China,_Honolulu_Museum_of_Art_5152.1.JPG',
 reconstructedFromDress:false,independentOriginalPhotographedSkirt:true,
 alphaStatus:'REVIEW',rearObserved:false,physicalFitCertified:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const approved=new WeakSet(),sha=x=>createHash('sha256').update(x).digest('hex');
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const fail=reason=>Object.freeze({status:'ORIGINAL_SKIRT_PHOTO_2D_REQUIRED',reason,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'});
/** Source attestation is byte-bound, process-local and intentionally NOT owner
 * approval; neither forged metadata nor same-category dress is admissible.
 */
export function attestActualSkirt89({originalBytes,cutoutBytes,lock,work47}={}){
 try{
  if(lock?.id!==SKIRT_SOURCE89.id||lock?.verified!==true||
   lock?.sha256!==SKIRT_SOURCE89.originalSHA256||
   lock?.attribution?.license!==SKIRT_SOURCE89.license||
   lock?.attribution?.source!==SKIRT_SOURCE89.photograph||
   !lock?.attribution?.credit||!lock?.attribution?.source?.includes('commons.wikimedia.org'))
   throw Error('licensed-independent-skirt-source-unverified');
  if(!work47||work47.id!==SKIRT_SOURCE89.id||work47.hasCutout!==true||
    work47.sourceSHA256!==SKIRT_SOURCE89.originalSHA256||
    !hex(work47.cutoutSHA256)||work47.ownerApproved!==false||
    work47.decision!=='REVIEW'||work47.hasCutout!==true)
   throw Error('provisional-skirt-mask-needs-review');
  if(!(originalBytes instanceof Uint8Array)||originalBytes.length<1000||
    originalBytes[0]!==255||originalBytes[1]!==216||originalBytes[2]!==255||
    sha(originalBytes)!==SKIRT_SOURCE89.originalSHA256)
   throw Error('authentic-original-skirt-jpeg-sha-required');
  if(!(cutoutBytes instanceof Uint8Array)||cutoutBytes.length<300||
    Buffer.from(cutoutBytes.subarray(0,8)).toString('hex')!=='89504e470d0a1a0a'||
    sha(cutoutBytes)!==work47.cutoutSHA256)
   throw Error('exact-source-skirt-review-alpha-sha-required');
  const receipt=Object.freeze({schema:'P89-authentic-independent-source-skirt-photo-and-review-mask/v1',
   status:'SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED',
   sourceId:SKIRT_SOURCE89.id,originalSHA256:SKIRT_SOURCE89.originalSHA256,
   cutoutSHA256:work47.cutoutSHA256,originalBytes:originalBytes.length,
   visibleRGBOriginalUntouched:true,alphaProposalStatus:'REVIEW',
   photographSource:SKIRT_SOURCE89.photograph,license:SKIRT_SOURCE89.license,
   actual163BoneSkirtMeshFitted:false,sourceBacksideObserved:false,
   releaseAuthorized:false,familyAlpha:'HOLD'});
  approved.add(receipt);return receipt;
 }catch(e){return fail(e.message);}
}
/** Inspect the actual ORIGINAL cutout alpha rows without estimating fabric
 * folds, manufacturing pattern, volume or invisible sides. This supports a
 * provisional local template only; shape could be wrong without human review.
 */
export function sourceSkirtOutline89({alpha,width,height}={}){
 if(!(alpha instanceof Uint8Array)||!Number.isSafeInteger(width)||
   !Number.isSafeInteger(height)||width<12||height<12||width>512||height>512||
   alpha.length!==width*height)throw Error('bounded real source-mask alpha required');
 let left=width,right=-1,top=height,bottom=-1,visible=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(alpha[y*width+x]>=128){
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);visible++;
 }
 if(right<=left||bottom-top<height*.25||visible<width*height*.04||
    visible>width*height*.88)
  throw Error('actual photographed skirt mask has no credible separated foreground');
 const span=bottom-top+1;
 const bands=[.08,.22,.36,.50,.64,.78,.92].map(p=>{
  const cy=top+Math.round((span-1)*p),rad=Math.max(1,Math.round(span*.025));
  let widths=[],centers=[];
  for(let y=Math.max(top,cy-rad);y<=Math.min(bottom,cy+rad);y++){
   let a=width,b=-1,count=0;
   for(let x=left;x<=right;x++)if(alpha[y*width+x]>=128){a=Math.min(a,x);b=Math.max(b,x);count++;}
   if(b>a&&count>Math.max(3,(b-a)*.22)){widths.push(b-a+1);centers.push((a+b)/2);}
  }
  if(widths.length<2)throw Error('source garment silhouette missing horizontal band');
  widths.sort((a,b)=>a-b);centers.sort((a,b)=>a-b);
  return Object.freeze({p,widthPixels:widths[Math.floor(widths.length/2)],
   centerPixels:centers[Math.floor(centers.length/2)]});
 });
 const waist=band=>band.widthPixels;
 const ratio=bands[6].widthPixels/bands[0].widthPixels;
 if(!Number.isFinite(ratio)||ratio<.55||ratio>5.5||
    bands[0].widthPixels<width*.10)
  throw Error('actual source garment width progression implausible or masked incorrectly');
 return Object.freeze({schema:'P89-source-measured-skirt-silhouette/v1',
  crop:Object.freeze([left/width,top/height,(right-left+1)/width,span/height]),
  sourceRowWidths:Object.freeze(bands),sourceHemToWaistWidthRatio:ratio,
  pixelForegroundCount:visible,pixelDimensions:Object.freeze([width,height]),
  photoCameraAngleIndependentlyValidated:false,realPhysicalDimensionsMeasured:false,
  maskHumanApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
function sourceSkeleton(root){
 if(!root?.isObject3D)throw Error('actual skinned human required');
 let body;
 root.traverse(o=>{
  if(o.isSkinnedMesh&&!o.userData.work56Garment&&o.skeleton?.bones.length===163&&
   (!body||o.geometry?.attributes?.position?.count>body.geometry.attributes.position.count))body=o;
 });
 if(!body)throw Error('authentic 163-bone anatomical body source required');
 const pelvis=body.skeleton.bones.findIndex(b=>b.name.replaceAll('.','')==='pelvis');
 const waist=body.skeleton.bones.find(b=>b.name.replaceAll('.','')==='spine04');
 if(pelvis<0||!waist)throw Error('real waist/pelvis 163-bone landmarks unavailable');
 return {body,pelvis,waist};
}
/** Actually constructs a skinned THREE shell from source alpha proportions
 * and immutable original-PNG photo front. The neutral back is openly inferred.
 * Anatomical scene and photo asset must be independently SHA-verified first.
 */
export function buildOriginalPhotoSkirtProposal89({root,receipt,outline,cutoutImage,
  skirtLengthMeters=.65,waistHalfWidthMeters=.23,segments=48}={}){
 if(!approved.has(receipt)||receipt.status!=='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'||
   outline?.schema!=='P89-source-measured-skirt-silhouette/v1'||
   receipt.sourceId!=='commons-0043'||!cutoutImage||
   !Number.isInteger(segments)||segments<24||segments>96||segments%4!==0||
   !Number.isFinite(skirtLengthMeters)||skirtLengthMeters<.4||skirtLengthMeters>.9||
   !Number.isFinite(waistHalfWidthMeters)||waistHalfWidthMeters<.16||waistHalfWidthMeters>.32||
   !(cutoutImage?.data instanceof Uint8Array)||
   !Number.isSafeInteger(cutoutImage.width)||!Number.isSafeInteger(cutoutImage.height)||
   cutoutImage.width<32||cutoutImage.height<32||
   cutoutImage.data.length!==cutoutImage.width*cutoutImage.height*4)
  return fail('source-skeleton-or-original-mask-capability-missing');
 let mesh=null,geo=null,texture=null,materials=null;
 try{
  const {body,pelvis,waist}=sourceSkeleton(root);
  root.updateMatrixWorld(true);
  const at=waist.getWorldPosition(new THREE.Vector3());
  if(![at.x,at.y,at.z].every(Number.isFinite)||at.y<.5||at.y>2.2)
   throw Error('anatomical waist height invalid');
  const inverse=body.matrixWorld.clone().invert();
  const center=outline.sourceRowWidths[0].centerPixels;
  const scale=waistHalfWidthMeters/Math.max(1,outline.sourceRowWidths[0].widthPixels/2);
  const heights=outline.sourceRowWidths;
  const verts=[],uv=[],bone=[],weights=[],tris=[],seams=[],rest=[];
  for(let ri=0;ri<heights.length;ri++){
   const s=heights[ri],t=ri/(heights.length-1);
   const sourceHalfWidth=s.widthPixels/2*scale;
   const radiusX=Math.min(.70,Math.max(.12,sourceHalfWidth));
   const radiusZ=Math.min(.45,Math.max(.10,radiusX*.66)); // rear is PROVISIONAL
   const y=at.y-t*skirtLengthMeters;
   for(let j=0;j<=segments;j++){
    const a=2*Math.PI*j/segments,x=Math.sin(a),z=Math.cos(a);
    const pos=new THREE.Vector3(at.x+radiusX*x,y,at.z+radiusZ*z);
    rest.push(...pos.toArray());
    pos.applyMatrix4(inverse);verts.push(...pos.toArray());
    bone.push(pelvis,0,0,0);weights.push(1,0,0,0);
    // Front only carries photo RGB. Source background alpha remains transparent.
    // Use the actual measured source row center/width, not a fictional
    // symmetric bounding-box projection that loses motif registration.
    uv.push((s.centerPixels+x*s.widthPixels*.5)/outline.pixelDimensions[0],
      1-outline.crop[1]-t*outline.crop[3]);
    if(ri<heights.length-1&&j<segments){
     const p=ri*(segments+1)+j,q=p+segments+1;
     const offset=tris.length;tris.push(p,p+1,q,p+1,q+1,q);
     if(j<segments/4||j>=segments*3/4)seams.push({start:offset,count:6,materialIndex:0});
     else seams.push({start:offset,count:6,materialIndex:1});
    }
   }
  }
  geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.setAttribute('sourceSkirt89Rest',new THREE.Float32BufferAttribute(rest,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bone,4));
  geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  geo.setIndex(tris);geo.computeVertexNormals();
  for(const group of seams)geo.addGroup(group.start,group.count,group.materialIndex);
  texture=new THREE.DataTexture(cutoutImage.data,cutoutImage.width,cutoutImage.height,THREE.RGBAFormat);
  texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=true;texture.needsUpdate=true;
  materials=[
   new THREE.MeshStandardMaterial({map:texture,color:0xffffff,roughness:.95,
    side:THREE.DoubleSide,transparent:true,depthWrite:true}),
   new THREE.MeshStandardMaterial({color:0xb8b4ab,roughness:1,
    side:THREE.DoubleSide}) // unobserved neutral fabric, never original back
  ];
  mesh=new THREE.SkinnedMesh(geo,materials);mesh.name='P89-source-COMMONS-0043-skirt-REVIEW-not-approved';
  mesh.userData.work56Garment=true;mesh.userData.p89ResearchSkirtOnly=true;
  mesh.position.copy(body.position);mesh.quaternion.copy(body.quaternion);mesh.scale.copy(body.scale);
  body.parent.add(mesh);mesh.bind(body.skeleton,body.bindMatrix);mesh.frustumCulled=false;
  if(mesh.skeleton!==body.skeleton)throw Error('independent rig changed');
  const receiptOut=Object.freeze({
   schema:'P89-authentic-photographed-skirt-provisional-163-bone-shell/v1',
   status:'ACTUAL_SOURCE_SKIRT_VISIBLE_FRONT_PROPOSAL_NOT_FITTED_OR_ACCEPTED',
   originalSHA256:receipt.originalSHA256,cutoutSHA256:receipt.cutoutSHA256,
   sourceId:SKIRT_SOURCE89.id,category:'skirt',sourcePhotoNotDress:true,
   actualSkinnedMesh:true,sourceSkeletonBones:body.skeleton.bones.length,
   distinctSourceOriginalJPEG:true,measuredSourceMaskRows:heights.length,
   extractedSourceHemToWaistRatio:outline.sourceHemToWaistWidthRatio,
   frontPhotoAppliedFromVerifiedCutout:true,unobservedBackNeutral:true,
   measuredPhysicalGarmentFit:false,sourceAbsoluteScaleInferred:true,
   sourcePhotoCameraUnadjudicated:true,originalPhotoBytesUntouched:true,
   sourceAlphaHumanApproved:false,interlayerContactPassed:false,
   bodyPenetrationUnmeasured:true,clothDrapeDynamics:false,
   sourceRGBADataTextureBoundToFrontOnly:true,
   genuinePhotoShaderWebGLNotYetMeasured:true,triangleCount:tris.length/3,
   originalHumanVisualRealismAccepted:false,consumer3DAdmitted:false,
   originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'
  });
  return {mesh,meshes:[mesh],receipt:receiptOut,dispose(){
   mesh.removeFromParent();geo.dispose();materials.forEach(m=>m.dispose());texture.dispose();
  }};
 }catch(e){
  mesh?.removeFromParent();geo?.dispose();materials?.forEach(m=>m.dispose());texture?.dispose();
  return fail(['authentic 163-bone anatomical body source required',
   'real waist/pelvis 163-bone landmarks unavailable','anatomical waist height invalid',
   'independent rig changed'].includes(e.message)?e.message:'source-skirt-rig-proposal-rejected');
 }
}
