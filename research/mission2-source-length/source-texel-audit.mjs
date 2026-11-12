/**
 * P2-C30 research-only, count-only original-photo texel registration witness.
 * Measures the actual source garment coordinate attribute against the exact
 * shader's bounded front-photo UV projection and ORIGINAL shader uPhoto.
 *
 * A tiny 64x64 DOWN-SAMPLED COPY of decoded source photo is inspected in
 * private memory when permitted. It is NEVER returned, saved or logged.
 * Only safe counts are returned. A color-diversity count is not a recognition,
 * color-accuracy, photographic realism or physical fabric score.
 *
 * A displayed front may still be visually wrong, rear remains inferred,
 * and this check does not authorize arbitrary 3D fitting/release.
 */
const fail=message=>{throw Error('M2 C30 original front photo texel '+message);};
const finite=a=>a instanceof Float32Array||a instanceof Float64Array;
const finiteProjection=p=>Array.isArray(p)&&p.length===4&&
 p.every(Number.isFinite)&&p[1]>=0.5&&p[1]<=1.6&&
 p[2]>=0.6&&p[2]<=1.2&&Math.abs(p[0])<=50&&Math.abs(p[3])<=50;

function tinySourceImage(image,maxSize){
 if(!image)return null;
 const w=image.width,h=image.height;
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||
    w<1||h<1||w>10000||h>10000)return null;
 // Three DataTexture's unmodified original pixels: sample directly without
 // copying source data or exposing RGB values in diagnostics.
 if(ArrayBuffer.isView(image.data)&&
    (image.data instanceof Uint8Array||image.data instanceof Uint8ClampedArray)&&
    image.data.length===w*h*4){
  return {width:w,height:h,at:(x,y)=>{
   const i=(y*w+x)*4,a=image.data;
   return [a[i],a[i+1],a[i+2],a[i+3]];
  }};
 }
 // Browser CanvasTexture / ImageTexture: create only a SMALL read-only
 // raster copy. Tainted/cross-origin images fail closed as unverified.
 const canvas=typeof document!=='undefined'&&document.createElement
  ?document.createElement('canvas')
  :typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(maxSize,maxSize):null;
 if(!canvas)return null;
 canvas.width=maxSize;canvas.height=maxSize;
 try{
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  ctx.drawImage(image,0,0,maxSize,maxSize);
  const b=ctx.getImageData(0,0,maxSize,maxSize).data;
  return {width:maxSize,height:maxSize,at:(x,y)=>{
   const i=(y*maxSize+x)*4;
   return [b[i],b[i+1],b[i+2],b[i+3]];
  }};
 }catch{return null;}
}

/** A mesh record is {mesh,coords}, where coords are the *original* source
 * vertices registered to the already-built source-proportion geometry.
 * photos are the actual source shader's uPhoto THREE.Textures; not substitutes.
 */
export function auditOriginalPhotoTexelRegistration(attributes,projection,photos,
 {maxVertices=300000,maxSourcePhotos=8,maxSourceSampleVertices=512,
  rgbaTinyWidth=64,uvTolerance=0.0001}={}){
 if(!Array.isArray(attributes)||attributes.length<1||attributes.length>8||
    !Array.isArray(photos)||photos.length<1||photos.length>maxSourcePhotos||
    !photos.every(x=>x?.isTexture===true)||
    !finiteProjection(projection)||
    !Number.isSafeInteger(maxVertices)||maxVertices<1||maxVertices>1000000||
    !Number.isSafeInteger(maxSourcePhotos)||maxSourcePhotos<1||maxSourcePhotos>16||
    !Number.isSafeInteger(maxSourceSampleVertices)||maxSourceSampleVertices<1||
    maxSourceSampleVertices>4096||
    !Number.isSafeInteger(rgbaTinyWidth)||rgbaTinyWidth<4||rgbaTinyWidth>128||
    !Number.isFinite(uvTolerance)||uvTolerance<0||uvTolerance>0.01)
  fail('complete bounded source shader photo and source registration required');
 const unique=new Set();
 let registeredVertices=0,uvDomainOutsideVertices=0,uvDomainNearEdgeVertices=0,
  nonFiniteProjectionVertices=0,eligibleSourceSamples=0;
 const sampleUVCandidates=[];
 const [center,spanX,spanY,bottom]=projection;
 for(const record of attributes){
  const m=record?.mesh,c=record?.coords,
   p=m?.geometry?.getAttribute('position');
  if(!m?.isSkinnedMesh||m?.skeleton?.bones?.length!==163||
     unique.has(m)||!finite(c)||!p?.isBufferAttribute||
     p.itemSize!==3||c.length!==p.count*3||
     !c.every(Number.isFinite)||registeredVertices+p.count>maxVertices)
   fail('complete finite original 163-bone source coordinate mapping required');
  unique.add(m);
  registeredVertices+=p.count;
  const stride=Math.max(1,Math.floor(p.count/Math.max(1,Math.floor(maxSourceSampleVertices/attributes.length))));
  for(let i=0;i<p.count;i++){
   const x=c[i*3],y=c[i*3+1];
   if(Math.abs(x)>100||Math.abs(y)>100||Math.abs(c[i*3+2])>100)
    fail('unbounded original garment mapping coordinate');
   const u=.5+(x-center)/spanX,v=(y-bottom)/spanY;
   if(!Number.isFinite(u)||!Number.isFinite(v)){
    nonFiniteProjectionVertices++;continue;
   }
   if(u< -uvTolerance||u>1+uvTolerance||
      v< -uvTolerance||v>1+uvTolerance)uvDomainOutsideVertices++;
   if(u<=.025||u>=.975||v<=.025||v>=.975)uvDomainNearEdgeVertices++;
   if(i%stride===0&&sampleUVCandidates.length<maxSourceSampleVertices&&
      u>=0&&u<=1&&v>=0&&v<=1)
    sampleUVCandidates.push([u,v]);
  }
 }
 if(registeredVertices<1)fail('no true registered photographic source vertices');
 const uniqueTextures=[...new Set(photos)];
 let sourceTextureImagesDecodable=0,sourceTextureImagesUnavailable=0;
 let eligibleTexelSamples=0,nonTransparentTexelSamples=0,
  differentRGBQuantizedBuckets=0;
 const bins=new Set();
 for(const texture of uniqueTextures){
  const image=tinySourceImage(texture.image,rgbaTinyWidth);
  if(!image){sourceTextureImagesUnavailable++;continue;}
  sourceTextureImagesDecodable++;
  for(const [u,v] of sampleUVCandidates){
   // Three texture sampling reads normalized UV; image data is top-first,
   // and THREE.Texture.flipY defaults true. Only source-color diversity
   // is inspected; sampling orientation is NOT a pixel-fit accuracy claim.
   const x=Math.min(image.width-1,Math.floor(u*image.width));
   const y=Math.min(image.height-1,Math.floor(
    (texture.flipY?1-v:v)*image.height));
   const [r,g,b,a]=image.at(x,y);
   eligibleTexelSamples++;
   if(a>16){
    nonTransparentTexelSamples++;
    bins.add((r>>5)*64+(g>>5)*8+(b>>5));
   }
  }
 }
 differentRGBQuantizedBuckets=bins.size;
 bins.clear();
 eligibleSourceSamples=sampleUVCandidates.length;
 return Object.freeze({
  original163BoneSourceMeshes:unique.size,
  registeredVertices,
  uvDomainOutsideVertices,uvDomainNearEdgeVertices,
  nonFiniteProjectionVertices,
  sourceShaderTexturesBound:uniqueTextures.length,
  sourceTextureImagesDecodable,sourceTextureImagesUnavailable,
  eligibleSourceSamples,eligibleTexelSamples,nonTransparentTexelSamples,
  differentRGBQuantizedBuckets,
  normalizedFrontProjectionOnly:true,
  sourceRGBValuesNeverReported:true,
  allOriginalSourcePixelsStayPrivate:true,
  missingTextureDecodeIsNotPhotoValidation:true,
  missingProjectedVerticesNeverWaived:true,
  originalRearPixelsNotPhotographed:true,
  colorAccuracyNotVerified:true,
  photorealismNotVerified:true,
  humanVisualAcceptanceNotVerified:true,
  releaseAuthorized:false
 });
}


/**
 * P2-C31: count-only ORIGINAL front-photo projection *face* diagnostics.
 * The previous P2-C30 witness sampled mapped vertices. That cannot detect
 * a triangular surface whose registered photo UV area is ZERO or whose
 * triangle straddles the photo boundary. We inspect the actual shader
 * sourceProjectionPosition attribute's pending coordinates and source
 * geometry index, never the unrelated standard mesh UV attribute.
 *
 * Projection is planar; side/rear faces legitimately may have zero projected
 * area. This is NOT a photorealism criterion, physically sewn seam metric,
 * source-photo ground-truth comparison, or 3D release authorization.
 */
export function auditOriginalPhotoProjectedTriangles(attributes,projection,{
 maxTriangles=300000,uvAreaEpsilon=1e-12,worldAreaEpsilon=1e-12,
 sourceGridSize=16,outsideTolerance=0.0001
}={}){
 if(!Array.isArray(attributes)||attributes.length<1||attributes.length>8||
    !finiteProjection(projection)||
    !Number.isSafeInteger(maxTriangles)||maxTriangles<1||maxTriangles>3000000||
    !Number.isFinite(uvAreaEpsilon)||uvAreaEpsilon<=0||uvAreaEpsilon>1e-6||
    !Number.isFinite(worldAreaEpsilon)||worldAreaEpsilon<=0||worldAreaEpsilon>1e-6||
    !Number.isSafeInteger(sourceGridSize)||sourceGridSize<4||sourceGridSize>32||
    !Number.isFinite(outsideTolerance)||outsideTolerance<0||outsideTolerance>0.01)
  fail('complete bounded original source triangle surface evidence required');
 const [center,spanX,spanY,bottom]=projection,seen=new Set();
 const filled=new Set();
 let sourceTriangles=0,sourceTrianglesWithMappedPhotoCentroid=0,
  projectedDegenerateTriangles=0,sourceWorldDegenerateTriangles=0,
  projectionPartiallyOutsideTriangles=0,projectionFullyOutsideTriangles=0,
  planarProjectionSeverelyForeshortenedTriangles=0;
 for(const {mesh,coords} of attributes){
  const p=mesh?.geometry?.getAttribute('position'),
   indices=mesh?.geometry?.index?.array??null;
  if(!mesh?.isSkinnedMesh||mesh.skeleton?.bones?.length!==163||seen.has(mesh)||
     !p?.isBufferAttribute||p.itemSize!==3||p.isInterleavedBufferAttribute||
     !finite(coords)||coords.length!==p.count*3||!coords.every(Number.isFinite))
   fail('full finite original 163-bone indexed source triangles required');
  seen.add(mesh);
  const triangles=indices?indices.length/3:p.count/3;
  if(!Number.isSafeInteger(triangles)||triangles<1||
     sourceTriangles+triangles>maxTriangles)
   fail('complete bounded original photographic source triangle count required');
  sourceTriangles+=triangles;
  for(let face=0;face<triangles;face++){
   const ids=indices?[indices[face*3],indices[face*3+1],indices[face*3+2]]:
    [face*3,face*3+1,face*3+2];
   if(ids.some(id=>!Number.isSafeInteger(id)||id<0||id>=p.count))
    fail('original indexed photographic source vertex out of range');
   const points=ids.map(id=>[
    coords[id*3],coords[id*3+1],coords[id*3+2]
   ]);
   if(points.some(row=>row.some(v=>!Number.isFinite(v)||Math.abs(v)>100)))
    fail('unbounded original source garment registration');
   const uv=points.map(([x,y])=>[
    .5+(x-center)/spanX,(y-bottom)/spanY
   ]);
   if(uv.some(a=>a.some(v=>!Number.isFinite(v))))fail('nonfinite photo projection');
   const minU=Math.min(...uv.map(v=>v[0])),
    maxU=Math.max(...uv.map(v=>v[0])),
    minV=Math.min(...uv.map(v=>v[1])),
    maxV=Math.max(...uv.map(v=>v[1]));
   const fullyOutside=maxU < -outsideTolerance||
    minU>1+outsideTolerance||maxV < -outsideTolerance||
    minV>1+outsideTolerance;
   if(fullyOutside)projectionFullyOutsideTriangles++;
   else if(minU< -outsideTolerance||maxU>1+outsideTolerance||
      minV< -outsideTolerance||maxV>1+outsideTolerance)
    projectionPartiallyOutsideTriangles++;
   const ux=uv[1][0]-uv[0][0],uy=uv[1][1]-uv[0][1],
    vx=uv[2][0]-uv[0][0],vy=uv[2][1]-uv[0][1],
    projectedArea=Math.abs(ux*vy-uy*vx);
   if(projectedArea<=uvAreaEpsilon)projectedDegenerateTriangles++;
   const ab=points[1].map((v,i)=>v-points[0][i]),
    ac=points[2].map((v,i)=>v-points[0][i]);
   const n=[ab[1]*ac[2]-ab[2]*ac[1],
    ab[2]*ac[0]-ab[0]*ac[2],
    ab[0]*ac[1]-ab[1]*ac[0]];
   const surfaceArea=Math.hypot(...n);
   if(surfaceArea<=worldAreaEpsilon)sourceWorldDegenerateTriangles++;
   else if(Math.abs(n[2])/surfaceArea <.25)
    planarProjectionSeverelyForeshortenedTriangles++;
   const midU=(uv[0][0]+uv[1][0]+uv[2][0])/3,
    midV=(uv[0][1]+uv[1][1]+uv[2][1])/3;
   if(!fullyOutside&&projectedArea>uvAreaEpsilon&&
      surfaceArea>worldAreaEpsilon&&midU>=0&&midU<=1&&
      midV>=0&&midV<=1){
    sourceTrianglesWithMappedPhotoCentroid++;
    filled.add(Math.min(sourceGridSize-1,Math.floor(midU*sourceGridSize))+
     ':'+Math.min(sourceGridSize-1,Math.floor(midV*sourceGridSize)));
   }
  }
 }
 return Object.freeze({
  sourceTriangles,
  sourceTrianglesWithMappedPhotoCentroid,
  projectedDegenerateTriangles,sourceWorldDegenerateTriangles,
  projectionPartiallyOutsideTriangles,projectionFullyOutsideTriangles,
  planarProjectionSeverelyForeshortenedTriangles,
  sourcePhotoGridCellsWithMappedFaceCentroids:filled.size,
  sourcePhotoGridCellsTotal:sourceGridSize*sourceGridSize,
  actualSourceShaderProjectionUsed:true,
  original163BoneGeometryTrianglesObserved:true,
  planarSideFacesMayBeIntentionallyDegenerate:true,
  originalSourcePhotoAndGeometryUntouched:true,
  noFaceIndicesUVOrPixelDataExported:true,
  noOwnerDataExported:true,
  sourcePhotoColorMatchNotMeasured:true,
  fabricDrapeNotCertified:true,
  physicalPhoneNotTested:true,
  humanPhotorealismNotCertified:true,
  releaseAuthorized:false
 });
}
