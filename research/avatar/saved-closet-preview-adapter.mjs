/**
 * Explicit, offline adapter from a saved-closet record to the 2D preview pipeline.
 * Never downloads customer photos, guesses masks, or reads account state.
 * The caller supplies already-authorized original RGBA pixels and reviewed mask.
 */
import {composeOutfitPreview} from './outfit-preview-compositor.mjs';

export function prepareSavedOutfitItem({accountId,record,original,reviewedMask}) {
 if(typeof accountId!=='string'||!accountId.trim())throw new Error('Missing account');
 if(!record||record.accountId!==accountId||!record.id)throw new Error('Unauthorized or missing saved item');
 if(!original||original.accountId!==accountId||original.itemId!==record.id)throw new Error('Original photo identity mismatch');
 if(record.originalSha256!==original.originalSha256)throw new Error('Saved original photo has changed');
 if(!reviewedMask||reviewedMask.accountId!==accountId||reviewedMask.itemId!==record.id||
 reviewedMask.originalSha256!==original.originalSha256||reviewedMask.reviewed!==true)
 throw new Error('Reviewed mask is missing or stale');
 if(!Number.isSafeInteger(original.width)||!Number.isSafeInteger(original.height)||
 original.width<1||original.height<1||original.width*original.height>16000000)
 throw new Error('Invalid original photo dimensions');
 if(!(reviewedMask.pixels instanceof Uint8Array)||reviewedMask.pixels.length!==original.width*original.height)
 throw new Error('Invalid original-resolution mask');
 if(!(original.pixels instanceof Uint8ClampedArray) ||
 original.pixels.length!==original.width*original.height*4)
 throw new Error('Missing or invalid original RGBA photo');
 let visible=false;
 for(let i=0;i<reviewedMask.pixels.length;i++){
  if(reviewedMask.pixels[i]===0)continue;
  const j=i*4;
  if(original.pixels[j+3]===0)continue;
  visible=true;
 }
 if(!visible)throw new Error('Invisible original photo');
 if(!['top','bottom','dress','jacket','coat','shoes'].includes(record.slot))
 throw new Error('Unsupported saved clothing category');
 return {
  slot:record.slot,
  garment:{
   accountId,originalSha256:original.originalSha256,
   width:original.width,height:original.height,pixels:original.pixels
  },
  mask:reviewedMask.pixels,
  sourceBox:{x:0,y:0,width:original.width,height:original.height}
 };
}
export function renderSavedOutfitPreview({accountId,pose,canvasWidth,canvasHeight,savedItems}) {
 if(!Array.isArray(savedItems))throw new Error('Missing saved items');
 const items=savedItems.map(item=>prepareSavedOutfitItem({accountId,...item}));
 return composeOutfitPreview({accountId,pose,canvasWidth,canvasHeight,items});
}
