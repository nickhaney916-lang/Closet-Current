/**
 * Parallel 89: original photographed Commons-0043 SKIRT independent from the
 * Commons-0053 DRESS. Actual source alpha determines silhouette; only front
 * original RGB is projected. Source rear, physical sizing, drape and fit are
 * unobserved. This is a research SkinnedMesh PROPOSAL, never consumer clothing.
 */
import * as THREE from 'three';
export const SKIRT_SOURCE89=Object.freeze({
 id:'commons-0043',category:'skirt',slot:'bottom',
 originalSHA256:'c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344',
 license:'CC0',publisher:'Honolulu Museum of Art, source photograph attributed to Hiart',
 photograph:'https://commons.wikimedia.org/wiki/File:Woman%27s_summer_skirt_from_China,_Honolulu_Museum_of_Art_5152.1.JPG',
 reconstructedFromDress:false,independentOriginalPhotographedSkirt:true,
 alphaStatus:'REVIEW',rearObserved:false,physicalFitCertified:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
// The trusted cutout raster is private to its exact byte-attested receipt.
 // A caller-provided image buffer is never source evidence for a 3D texture.
const approved=new WeakMap();
const sha=async x=>{
 if(!globalThis.crypto?.subtle)throw Error('Secure source SHA-256 unavailable');
 const bytes=await globalThis.crypto.subtle.digest('SHA-256',x);
 return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
};
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const fail=reason=>Object.freeze({status:'ORIGINAL_SKIRT_PHOTO_2D_REQUIRED',reason,
 consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'});
/** Decode from the SAME PNG bytes whose SHA was attested. No separately
 * supplied raster can replace the public photo material after attestation.
 * Browser and Node's native sharp decoder are used only on this public-source
 * fixture; any missing decoder or impossible image fails to 2D.
 */
async function decodeAttestedSourceRaster89(png){
 let data,width,height,sampledData,sampledWidth,sampledHeight;
 if(typeof document!=='undefined'&&typeof createImageBitmap==='function'){
  const bitmap=await createImageBitmap(new Blob([png],{type:'image/png'}),
   {premultiplyAlpha:'none',colorSpaceConversion:'none'});
  try{
   width=bitmap.width;height=bitmap.height;
   if(width<64||height<64||width*height>9_000_000)
    throw Error('attested-skirt-cutout-raster-dimensions-invalid');
   const canvas=document.createElement('canvas');
   canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw Error('attested-skirt-cutout-raster-canvas-unavailable');
   ctx.clearRect(0,0,width,height);ctx.drawImage(bitmap,0,0);
   data=new Uint8Array(ctx.getImageData(0,0,width,height).data);
   const factor=Math.min(240/width,240/height);
   sampledWidth=Math.max(12,Math.round(width*factor));
   sampledHeight=Math.max(12,Math.round(height*factor));
   const sampled=document.createElement('canvas');
   sampled.width=sampledWidth;sampled.height=sampledHeight;
   const sampledCtx=sampled.getContext('2d',{willReadFrequently:true});
   if(!sampledCtx)throw Error('attested-skirt-cutout-source-mask-canvas-unavailable');
   sampledCtx.clearRect(0,0,sampledWidth,sampledHeight);
   sampledCtx.drawImage(bitmap,0,0,sampledWidth,sampledHeight);
   sampledData=sampledCtx.getImageData(0,0,sampledWidth,sampledHeight).data;
  }finally{bitmap.close();}
 }else if(typeof process!=='undefined'&&process.versions?.node){
  const {default:sharp}=await import('sharp');
  const out=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  width=out.info.width;height=out.info.height;
  data=new Uint8Array(out.data);
  const factor=Math.min(240/width,240/height);
  sampledWidth=Math.max(12,Math.round(width*factor));
  sampledHeight=Math.max(12,Math.round(height*factor));
  const sample=await sharp(png).resize({
   width:sampledWidth,height:sampledHeight,fit:'fill'
  }).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(sample.info.width!==sampledWidth||sample.info.height!==sampledHeight||
   sample.info.channels!==4)
   throw Error('attested-skirt-cutout-source-mask-dimensions-invalid');
  sampledData=sample.data;
 }else throw Error('attested-skirt-cutout-raster-decoder-missing');
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
  width<64||height<64||width*height>9_000_000||
  !(data instanceof Uint8Array)||data.length!==width*height*4)
  throw Error('attested-skirt-cutout-raster-dimensions-invalid');
 if(!Number.isSafeInteger(sampledWidth)||!Number.isSafeInteger(sampledHeight)||
  sampledWidth<12||sampledHeight<12||
  sampledWidth>512||sampledHeight>512||
  sampledData?.length!==sampledWidth*sampledHeight*4)
  throw Error('attested-skirt-cutout-source-mask-dimensions-invalid');
 const alpha=new Uint8Array(sampledWidth*sampledHeight);
 for(let i=0;i<alpha.length;i++)alpha[i]=sampledData[i*4+3];
 return {raster:{data,width,height},
  outline:sourceSkirtOutline89({alpha,width:sampledWidth,height:sampledHeight})};
}
/** Source attestation is byte-bound, process-local and intentionally NOT owner
 * approval; neither forged metadata nor same-category dress is admissible.
 */
export async function attestActualSkirt89({originalBytes,cutoutBytes,lock,work47}={}){
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
    originalBytes.length>24_000_000||
    originalBytes[0]!==255||originalBytes[1]!==216||originalBytes[2]!==255)
   throw Error('authentic-original-skirt-jpeg-sha-required');
  // Snapshot before the first async digest. Mutable caller-backed arrays
  // cannot change the source being measured while verification yields.
  const originalSnapshot=Uint8Array.from(originalBytes);
  if(await sha(originalSnapshot)!==SKIRT_SOURCE89.originalSHA256)
   throw Error('authentic-original-skirt-jpeg-sha-required');
  if(!(cutoutBytes instanceof Uint8Array)||cutoutBytes.length<300||
    cutoutBytes.length>24_000_000||
    cutoutBytes.slice(0,8).some((v,i)=>v!==[137,80,78,71,13,10,26,10][i]))
   throw Error('exact-source-skirt-review-alpha-sha-required');
  const cutoutSnapshot=Uint8Array.from(cutoutBytes);
  if(await sha(cutoutSnapshot)!==work47.cutoutSHA256)
   throw Error('exact-source-skirt-review-alpha-sha-required');
  // Geometry and material are derived from the same immutable *snapshot*
  // that passed SHA, never a caller buffer that can change after await.
  const trustedAsset=await decodeAttestedSourceRaster89(cutoutSnapshot);
  const receipt=Object.freeze({schema:'P89-authentic-independent-source-skirt-photo-and-review-mask/v1',
   status:'SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED',
   sourceId:SKIRT_SOURCE89.id,originalSHA256:SKIRT_SOURCE89.originalSHA256,
   cutoutSHA256:work47.cutoutSHA256,originalBytes:originalSnapshot.length,
   visibleRGBOriginalUntouched:true,alphaProposalStatus:'REVIEW',
   immutableVerifiedInputSnapshotUsed:true,
   photographSource:SKIRT_SOURCE89.photograph,license:SKIRT_SOURCE89.license,
   actual163BoneSkirtMeshFitted:false,sourceBacksideObserved:false,
   releaseAuthorized:false,familyAlpha:'HOLD'});
  approved.set(receipt,trustedAsset);return receipt;
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
 // A bbox and seven sampled widths alone can mistake TWO separated garments
 // for one skirt. Verify one dominant real foreground component, retaining
 // minor loose threads/alpha dust without stitching disjoint items together.
 // Eight-connected pixels allow diagonal photographed cloth boundaries.
 const visited=new Uint8Array(alpha.length),dominant=new Uint8Array(alpha.length),
  stack=new Int32Array(alpha.length);
 let largest=0,componentCount=0;
 for(let start=0;start<alpha.length;start++){
  if(visited[start]||alpha[start]<128)continue;
  let head=0,tail=1,size=0;stack[0]=start;visited[start]=1;
  while(head<tail){
   const at=stack[head++],x=at%width,y=Math.floor(at/width);size++;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(dx===0&&dy===0)continue;
    const nx=x+dx,ny=y+dy;
    if(nx<0||nx>=width||ny<0||ny>=height)continue;
    const id=ny*width+nx;
    if(visited[id]||alpha[id]<128)continue;
    visited[id]=1;stack[tail++]=id;
   }
  }
  componentCount++;
  if(size>largest){
   largest=size;dominant.fill(0);
   for(let i=0;i<tail;i++)dominant[stack[i]]=1;
  }
 }
 if(componentCount===0||largest/visible<.8)
  throw Error('source skirt mask contains multiple disconnected garment-sized regions');
 // Only the measured dominant fabric component sets the image crop/UV rows.
 // Otherwise a detached alpha speck can shift the actual photographed motif.
 left=width;right=-1;top=height;bottom=-1;
 for(let i=0;i<dominant.length;i++)if(dominant[i]){
  const x=i%width,y=Math.floor(i/width);
  left=Math.min(left,x);right=Math.max(right,x);
  top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 visible=largest;
 if(right<=left||bottom-top<height*.25||visible<width*height*.04)
  throw Error('dominant source skirt silhouette not credible');
 const span=bottom-top+1;
 const bands=[.08,.22,.36,.50,.64,.78,.92].map(p=>{
  const cy=top+Math.round((span-1)*p),rad=Math.max(1,Math.round(span*.025));
  let widths=[],centers=[];
  for(let y=Math.max(top,cy-rad);y<=Math.min(bottom,cy+rad);y++){
   let a=width,b=-1,count=0;
   for(let x=left;x<=right;x++)if(dominant[y*width+x]){a=Math.min(a,x);b=Math.max(b,x);count++;}
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
/**
 * Use exact measured source-alpha row locations for front RGB UV mapping.
 * Mesh's physical height is a separate inferred parameter; do not stretch
 * the photograph vertically by projecting equally spaced mesh rows onto
 * unobserved top/bottom photo pixels.
 */
export function sourceSkirtBandTextureV89(outline,bandIndex){
 const bands=outline?.sourceRowWidths;
 if(outline?.schema!=='P89-source-measured-skirt-silhouette/v1'||
  !Array.isArray(bands)||bands.length!==7||
  !Number.isSafeInteger(bandIndex)||bandIndex<0||bandIndex>=bands.length||
  !Number.isFinite(bands[bandIndex]?.p)||
  !Number.isFinite(outline.crop?.[1])||
  !Number.isFinite(outline.crop?.[3]))
  throw Error('verified measured source-mask band required for UV transfer');
 const y=outline.crop[1]+bands[bandIndex].p*outline.crop[3];
 if(y<0||y>1)throw Error('original-source-photo-uv-row-outside-image');
 return 1-y;
}
/**
 * SHA-attested source-front image centerline, never physical rear/drape proof.
 * The original photograph cannot determine camera angle or garment depth.
 */
export function sourceSkirtMeasuredPhotoCenterline89(outline,waistHalfWidthMeters=.23){
 const bands=outline?.sourceRowWidths,width=outline?.pixelDimensions?.[0];
 if(outline?.schema!=='P89-source-measured-skirt-silhouette/v1'||
  !Array.isArray(bands)||bands.length!==7||
  !Number.isFinite(width)||width<12||width>512||
  !Number.isFinite(waistHalfWidthMeters)||waistHalfWidthMeters<.16||
  waistHalfWidthMeters>.32||
  bands.some(b=>!Number.isFinite(b?.centerPixels)||
   !Number.isFinite(b?.widthPixels)||b.widthPixels<=0||
   b.widthPixels>width||b.centerPixels<0||b.centerPixels>=width||
   b.centerPixels-b.widthPixels/2<-.5||
   b.centerPixels+b.widthPixels/2>width+.5))
  throw Error('attested-photograph-centerline-bands-required');
 const pxPerMeter=bands[0].widthPixels/(2*waistHalfWidthMeters);
 if(!Number.isFinite(pxPerMeter)||pxPerMeter<=0)
  throw Error('original-source-skirt-front-centerline-scale-unverifiable');
 const start=bands[0].centerPixels;
 const offsets=bands.map(b=>(b.centerPixels-start)/pxPerMeter);
 if(offsets.some((v,i)=>!Number.isFinite(v)||Math.abs(v)>.15||
  (i>0&&Math.abs(v-offsets[i-1])>.10)))
  throw Error('original-source-front-centerline-physical-projection-unverifiable');
 return Object.freeze({
  schema:'P89-attested-original-photo-front-centerline-trial/v1',
  sourceBandCount:7,
  sourceRelativeWorldXOffsetsMeters:Object.freeze(offsets),
  frontPixelCentersFromOriginalSourceAlpha:true,
  rearCenterlineInferredNotPhotographed:true,
  cameraAngleAndPhysicalDrapeUnverified:true,
  consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
function sourceSkeleton(root){
 if(!root?.isObject3D)throw Error('actual skinned human required');
 let body;
 root.traverse(o=>{
  if(o.isSkinnedMesh&&!o.userData.work56Garment&&o.skeleton?.bones.length===163&&
   (!body||o.geometry?.attributes?.position?.count>body.geometry.attributes.position.count))body=o;
 });
 if(!body)throw Error('authentic 163-bone anatomical body source required');
 const bones=body.skeleton.bones,names=bones.map(b=>b.name.replaceAll('.',''));
 const waistIndex=names.indexOf('spine04');
 // The actual CC0 MakeHuman GLBs do NOT have a literal 'pelvis' joint.
 // The existing SOURCE dress fitter binds the lower body to the genuine
 // spine04 joint when pelvis is absent; retain that exact observed fallback,
 // NEVER manufacture a new bone or pretend the fit is physically correct.
 const pelvisIndex=names.indexOf('pelvis')>=0?names.indexOf('pelvis'):waistIndex;
 if(pelvisIndex<0||waistIndex<0)
  throw Error('real lower-torso 163-bone source landmarks unavailable');
 return {body,pelvis:pelvisIndex,waist:bones[waistIndex],
  authenticLowerBodyBoneName:names[pelvisIndex],
  inferredPelvisBinding:names[pelvisIndex]!=='pelvis'};
}
/** Actually constructs a skinned THREE shell from source alpha proportions
 * and immutable original-PNG photo front. The neutral back is openly inferred.
 * Anatomical scene and photo asset must be independently SHA-verified first.
 */
export function buildOriginalPhotoSkirtProposal89({root,receipt,outline,
  skirtLengthMeters=.65,waistHalfWidthMeters=.23,segments=48}={}){
 const trustedAsset=approved.get(receipt);
 const trustedRaster=trustedAsset?.raster;
 const verifiedOutline=trustedAsset?.outline;
 if(!trustedRaster||receipt.status!=='SOURCE_SKIRT_ALPHA_VERIFIED_NOT_HUMAN_APPROVED'||
   verifiedOutline?.schema!=='P89-source-measured-skirt-silhouette/v1'||
   receipt.sourceId!=='commons-0043'||
   !Number.isInteger(segments)||segments<24||segments>96||segments%4!==0||
   !Number.isFinite(skirtLengthMeters)||skirtLengthMeters<.4||skirtLengthMeters>.9||
   !Number.isFinite(waistHalfWidthMeters)||waistHalfWidthMeters<.16||waistHalfWidthMeters>.32||
   !(trustedRaster?.data instanceof Uint8Array)||
   !Number.isSafeInteger(trustedRaster.width)||!Number.isSafeInteger(trustedRaster.height)||
   trustedRaster.width<64||trustedRaster.height<64||
   trustedRaster.data.length!==trustedRaster.width*trustedRaster.height*4)
  return fail('source-skeleton-or-original-mask-capability-missing');
 let mesh=null,geo=null,texture=null,materials=null;
 try{
  const {body,pelvis,waist,authenticLowerBodyBoneName,inferredPelvisBinding}=sourceSkeleton(root);
  root.updateMatrixWorld(true);
  const at=waist.getWorldPosition(new THREE.Vector3());
  if(![at.x,at.y,at.z].every(Number.isFinite)||at.y<.5||at.y>2.2)
   throw Error('anatomical waist height invalid');
  const inverse=body.matrixWorld.clone().invert();
  const frontLine=sourceSkirtMeasuredPhotoCenterline89(verifiedOutline,waistHalfWidthMeters);
  const scale=waistHalfWidthMeters/Math.max(1,verifiedOutline.sourceRowWidths[0].widthPixels/2);
  const heights=verifiedOutline.sourceRowWidths;
  const verts=[],uv=[],bone=[],weights=[],tris=[],seams=[],rest=[];
  for(let ri=0;ri<heights.length;ri++){
   const s=heights[ri],t=ri/(heights.length-1);
   const sourceMeasuredTextureV=sourceSkirtBandTextureV89(verifiedOutline,ri);
   const sourceHalfWidth=s.widthPixels/2*scale;
   const radiusX=Math.min(.70,Math.max(.12,sourceHalfWidth));
   const radiusZ=Math.min(.45,Math.max(.10,radiusX*.66)); // rear is PROVISIONAL
   const y=at.y-t*skirtLengthMeters;
   for(let j=0;j<=segments;j++){
    const a=2*Math.PI*j/segments,x=Math.sin(a),z=Math.cos(a);
    // Original front photograph determines x drift; its rear cannot.
    const frontWeight=z>=0?1:Math.max(0,1+z);
    const pos=new THREE.Vector3(at.x+radiusX*x+
     frontLine.sourceRelativeWorldXOffsetsMeters[ri]*frontWeight,y,at.z+radiusZ*z);
    rest.push(...pos.toArray());
    pos.applyMatrix4(inverse);verts.push(...pos.toArray());
    bone.push(pelvis,0,0,0);weights.push(1,0,0,0);
    // Front only carries photo RGB. Source background alpha remains transparent.
    // Use the actual measured source row center/width, not a fictional
    // symmetric bounding-box projection that loses motif registration.
    uv.push((s.centerPixels+x*s.widthPixels*.5)/verifiedOutline.pixelDimensions[0],
      sourceMeasuredTextureV);
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
  texture=new THREE.DataTexture(trustedRaster.data.slice(),trustedRaster.width,trustedRaster.height,THREE.RGBAFormat);
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
   authenticLowerBodyBoneName,inferredPelvisBinding,
   distinctSourceOriginalJPEG:true,measuredSourceMaskRows:heights.length,
   extractedSourceHemToWaistRatio:verifiedOutline.sourceHemToWaistWidthRatio,
   photoFrontCenterlineOffsetsMeters:frontLine.sourceRelativeWorldXOffsetsMeters,
   genuinePhotoFrontCenterlineAppliedToProvisionalMesh:true,
   hypotheticalPhotoRearCenterlineNotClaimed:true,
   frontPhotoAppliedFromVerifiedCutout:true,unobservedBackNeutral:true,
   measuredPhysicalGarmentFit:false,sourceAbsoluteScaleInferred:true,
   sourcePhotoCameraUnadjudicated:true,originalPhotoBytesUntouched:true,
   sourceAlphaHumanApproved:false,interlayerContactPassed:false,
   bodyPenetrationUnmeasured:true,clothDrapeDynamics:false,
   sourceRGBADataTextureBoundToFrontOnly:true,
   sourceRGBAWasDecodedFromExactAttestedCutoutPNG:true,
   sourceInputBytesSnapshottedBeforeAsyncVerification:true,
   callerSuppliedTexturePixelsAreNotTrusted:true,
   originalMaskShapeDerivedFromExactAttestedCutoutPNG:true,
   callerSuppliedSilhouetteIsNotTrusted:true,
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
   'real lower-torso 163-bone source landmarks unavailable','anatomical waist height invalid',
   'independent rig changed','attested-photograph-centerline-bands-required',
   'original-source-skirt-front-centerline-scale-unverifiable',
   'original-source-front-centerline-physical-projection-unverifiable'
  ].includes(e.message)?e.message:'source-skirt-rig-proposal-rejected');
 }
}
