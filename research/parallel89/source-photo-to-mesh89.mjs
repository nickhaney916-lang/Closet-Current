/** Research-only source-derived view-plane mesh. A source image need not
 * depict a front view. No caller mask, physical fit, or consumer admission.
 */
import {createHash} from 'node:crypto';
import {attestOriginalSource89} from './source-contract.mjs';
import {proposeOriginalPhotoMask89} from './multicategory-border-mask89.mjs';
import {buildOriginalJPEGTexturedFront89} from './source-original-texture-transfer89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const hold={consumer3DAdmitted:false,maskGroundTruthApproved:false,sourceViewIndependentlyVerified:false,originalPhoto2DFallbackRequired:true,releaseAuthorized:false,familyAlpha:'HOLD'};
const refuse=(reason,identity={})=>({status:'ORIGINAL_PHOTO_2D_REQUIRED',reason,...identity,...hold});
export async function buildPhotoDerivedResearchMesh89(args={}){
 try{
  if(!args||typeof args!=='object'||Object.keys(args).some(k=>!['sourceId','originalBytes','lockedRecord','textureScale'].includes(k)))return refuse('unsupported-input-or-caller-mask');
  const {sourceId,originalBytes,lockedRecord,textureScale=2}=args;
  if(!Number.isSafeInteger(textureScale)||textureScale<1||textureScale>5)return refuse('invalid-research-texture-scale');
  if(!(originalBytes instanceof Uint8Array)||originalBytes.length>32*1024*1024)return refuse('invalid-original-byte-buffer');
  // Keep one immutable-by-ownership snapshot across both asynchronous decodes.
  const bytes=Buffer.from(originalBytes);
  const record=structuredClone(lockedRecord);
  const source=attestOriginalSource89({sourceId,originalBytes:bytes,lockedRecord:record});
  if(source.status!=='ORIGINAL_JPEG_VERIFIED')return refuse('original-source-not-attested');
  const identity={sourceId,category:source.category,originalSHA256:source.originalSHA256};
  const p=await proposeOriginalPhotoMask89({sourceId,originalBytes:bytes,lockedRecord:record});
  if(p.status!=='UNREVIEWED_BORDER_MASK_PROPOSAL')return refuse(p.reason??'no-mask-proposal',identity);
  const {width,height,alpha,uncertain,background}=p;
  if(p.originalSHA256!==identity.originalSHA256||p.sourceId!==sourceId||p.category!==source.category||
     ![alpha,uncertain,background].every(a=>a instanceof Uint8Array&&a.length===width*height)||
     sha(alpha)!==p.maskSHA256||sha(uncertain)!==p.uncertaintySHA256||sha(background)!==p.backgroundSHA256)
   return refuse('proposal-source-binding-invalid',identity);
  let fg=0,unc=0,bg=0;
  for(let i=0;i<alpha.length;i++){
   const a=alpha[i],u=uncertain[i],b=background[i];
   if(![a,u,b].every(x=>x===0||x===255)||a+u+b!==255)return refuse('proposal-pixel-classes-invalid',identity);
   fg+=a===255;unc+=u===255;bg+=b===255;
  }
  if(fg!==p.foregroundPixels||unc!==p.uncertainPixels||bg!==p.backgroundPixels)return refuse('proposal-pixel-count-invalid',identity);
  const mesh=await buildOriginalJPEGTexturedFront89({sourceId,originalBytes:bytes,lockedRecord:record,alpha,width,height,sourceMaskSHA256:p.maskSHA256,textureScale});
  if(mesh.status!=='TWO_DIMENSIONAL_ORIGINAL_RGB_ON_PROVISIONAL_FRONT_MESH_ONLY')return refuse(mesh.reason??'mesh-refused',identity);
  if(mesh.originalJPEG_SHA256!==identity.originalSHA256||mesh.sourceId!==sourceId||mesh.category!==source.category||
    mesh.decodedOriginalRGBSHA256!==p.decodedRGBSHA256||mesh.researchMaskSHA256!==p.maskSHA256||
    mesh.originalRGBForegroundPixels!==fg||mesh.indices.length!==fg*6||
    mesh.textureForegroundPixels!==fg*textureScale*textureScale||sha(mesh.textureRGBA)!==mesh.textureSHA256)
   return refuse('mesh-source-binding-invalid',identity);
  return {status:'SOURCE_DERIVED_TEXTURED_VIEW_PLANE_RESEARCH_ONLY',...identity,decodedRGBSHA256:p.decodedRGBSHA256,
   maskSHA256:p.maskSHA256,uncertaintySHA256:p.uncertaintySHA256,backgroundSHA256:p.backgroundSHA256,
   maskDimensions:[width,height],alpha,uncertain,background,foregroundPixels:fg,uncertainPixels:unc,backgroundPixels:bg,
   mesh,viewPlaneOnly:true,...hold};
 }catch{return refuse('source-photo-to-mesh-input-or-processing-failed');}
}
