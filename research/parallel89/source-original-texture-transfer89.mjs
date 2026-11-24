/**
 * P89 original licensed JPEG -> genuine decoded RGB -> UV-textured observed
 * FRONT research panel. The mask is a supplied UNAPPROVED research proposal,
 * not an independently segmented garment. No back, scale, rig or 3D admission.
 * Never touches consumer Wardrobe or preserves these buffers beyond this call.
 */
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {attestOriginalSource89,buildSourceObservedFront89} from './source-contract.mjs';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const refused=reason=>Object.freeze({
 schema:'M2-P89-real-JPEG-front-RGB-UV-research/v1',
 status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,
 actualGarmentBoundaryVerified:false,actual163BoneFitProved:false,
 sourceBackObserved:false,consumer3DAdmitted:false,
 releaseAuthorized:false,originalPhoto2DFallbackRequired:true,
 familyAlpha:'HOLD'
});
const safeSize=(w,h)=>Number.isSafeInteger(w)&&Number.isSafeInteger(h)&&
 w>=4&&h>=4&&w<=256&&h<=256;

// Separate edge-disconnected triangle fans at a shared grid corner.
// This removes nonmanifold point welds without smoothing, deleting or
// adding any mask cells. Coordinates and UVs of duplicates stay identical.
function splitPointWelds(positions,uv,indices){
 const count=positions.length/3,incident=Array.from({length:count},()=>[]);
 for(let i=0;i<indices.length;i++)incident[indices[i]].push(i);
 const outIndices=new Uint32Array(indices),extraP=[],extraUV=[];
 let splits=0;
 for(let vertex=0;vertex<count;vertex++){
  const slots=incident[vertex],groups=[];
  for(const slot of slots){
   const start=slot-slot%3;
   const neighbors=new Set([indices[start],indices[start+1],indices[start+2]]);
   neighbors.delete(vertex);
   const hits=[];
   for(let g=0;g<groups.length;g++)if([...neighbors].some(n=>groups[g].neighbors.has(n)))hits.push(g);
   if(!hits.length){groups.push({neighbors,slots:[slot]});continue;}
   const first=groups[hits[0]];
   first.slots.push(slot);for(const n of neighbors)first.neighbors.add(n);
   for(let h=hits.length-1;h>=1;h--){
    const other=groups[hits[h]];
    first.slots.push(...other.slots);for(const n of other.neighbors)first.neighbors.add(n);
    groups.splice(hits[h],1);
   }
  }
  for(let g=1;g<groups.length;g++){
   const next=count+splits++;
   extraP.push(...positions.slice(vertex*3,vertex*3+3));
   extraUV.push(...uv.slice(vertex*2,vertex*2+2));
   for(const slot of groups[g].slots)outIndices[slot]=next;
  }
 }
 if(!splits)return {positions,uv,indices,pointWeldSplits:0};
 const p=new Float32Array(positions.length+extraP.length),u=new Float32Array(uv.length+extraUV.length);
 p.set(positions);p.set(extraP,positions.length);u.set(uv);u.set(extraUV,uv.length);
 return {positions:p,uv:u,indices:outIndices,pointWeldSplits:splits};
}

/**
 * Receives an original public JPEG, its checked license registry record and
 * a separate research alpha proposal. JPEG is independently SHA-attested,
 * then decoded from THOSE bytes, rather than trusting supplied RGB metadata.
 * Nearest-neighbor samples are copied verbatim from the full decoded image.
 */
export async function buildOriginalJPEGTexturedFront89({
 sourceId,originalBytes,lockedRecord,alpha,width,height,sourceMaskSHA256,textureScale=1
}={}){
 const source=attestOriginalSource89({sourceId,originalBytes,lockedRecord});
 if(source.status!=='ORIGINAL_JPEG_VERIFIED')
  return refused('original-jpeg-rights-or-identity-not-attested');
 if(!safeSize(width,height)||!(alpha instanceof Uint8Array)||
   alpha.length!==width*height||!Array.from(alpha).every(a=>a===0||a===255)||
   typeof sourceMaskSHA256!=='string'||sha256(alpha)!==sourceMaskSHA256)
  return refused('source-space-binary-proposal-mask-or-sha-invalid');
 // Integer subdivision keeps texture alpha exactly aligned to mesh cells.
 // The default is backward compatible; bound allocation independently of mesh.
 if(!Number.isSafeInteger(textureScale)||textureScale<1||textureScale>8||
    width*textureScale>1024||height*textureScale>1024)
  return refused('texture-scale-or-allocation-limit-invalid');
 const tw=width*textureScale,th=height*textureScale;
 const panel=buildSourceObservedFront89({
  sourceReceipt:source,alpha,width,height,sourceMaskSHA256
 });
 if(panel.status!=='OBSERVED_FRONT_GEOMETRY_NOT_FITTED')
  return refused('photo-front-silhouette-not-observable');
 try{
  // Exact original bytes are decoded. No substitute JPEG, virtual texture
  // source or model-generated color is allowed in this research function.
  const {data,info}=await sharp(originalBytes,{
   failOn:'error',limitInputPixels:16000000
  }).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  if(info.channels!==3||info.width<4||info.height<4||
     info.width*info.height>16000000||data.length!==info.width*info.height*3)
   return refused('decoded-original-jpeg-rgb-layout-invalid');
  // The proposal grid may be a non-aspect-preserving resize of the full
  // source image. UVs identify full-image coordinates; express geometry in
  // native decoded-image aspect units, not proposal-grid aspect units.
  // No EXIF camera orientation, physical size or unseen surface is inferred.
  const sourceAspect=info.width/info.height;
  const positions=new Float32Array(panel.positions);
  for(let i=0;i<positions.length/3;i++){
   positions[3*i]=(panel.uv[2*i]-.5)*sourceAspect;
  }
  const topology=splitPointWelds(positions,panel.uv,panel.indices);
  const rgba=new Uint8Array(tw*th*4);
  let copied=0;
  for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
   if(alpha[Math.floor(y/textureScale)*width+Math.floor(x/textureScale)]!==255)continue;
   const sx=Math.min(info.width-1,Math.floor((x+.5)*info.width/tw));
   const sy=Math.min(info.height-1,Math.floor((y+.5)*info.height/th));
   const src=(sy*info.width+sx)*3,dst=(y*tw+x)*4;
   rgba[dst]=data[src];rgba[dst+1]=data[src+1];
   rgba[dst+2]=data[src+2];rgba[dst+3]=255;
   copied++;
  }
  if(copied!==panel.foregroundPixels*textureScale*textureScale)
   return refused('segmented-geometry-pixel-count-mismatch');
  return {
   schema:'M2-P89-real-JPEG-front-RGB-UV-research/v1',
   status:'TWO_DIMENSIONAL_ORIGINAL_RGB_ON_PROVISIONAL_FRONT_MESH_ONLY',
   sourceId,category:source.category,slot:source.slot,
   originalJPEG_SHA256:source.originalSHA256,
   originalJPEGByteCount:source.originalByteCount,
   decodedOriginalRGBSHA256:sha256(data),
   decodedOriginalDimensions:[info.width,info.height],
   originalSourcePixelSampling:'nearest original decoded RGB, no generated colors',
   researchMaskSHA256:sourceMaskSHA256,
   textureSHA256:sha256(rgba),textureDimensions:[tw,th],textureScale,textureForegroundPixels:copied,
   textureRGBA:rgba,...topology,
   geometryAspectBasis:'native decoded original RGB width/height; nonmetric',
   decodedOriginalAspect:sourceAspect,
   originalRGBForegroundPixels:panel.foregroundPixels,sourceFullImageWasReencoded:false,
   maskGroundTruthApproved:false,originalSourceAngleIndependentlyAdjudicated:false,
   observedFrontOnly:true,unseenSideOrBackInvented:false,
   garmentPhysicalDepthOrSizeMeasured:false,actual163BoneFitProved:false,
   layeredOutfitContactClearanceProved:false,
   independentHumanRealismAccepted:false,consumer3DAdmitted:false,
   originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'
  };
 }catch{
  return refused('original-jpeg-decode-or-texture-construction-failed');
 }
}
