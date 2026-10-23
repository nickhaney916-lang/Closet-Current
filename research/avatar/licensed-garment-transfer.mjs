/**
 * Local-only garment image transfer adapter for licensed fixtures.
 * No network or persistent storage. Does not infer a mask, warp fabric,
 * simulate body fit, or claim photorealistic try-on.
 */
export function validateGarmentTransfer({accountId, garment, mask}) {
 if (!accountId || typeof accountId!=='string') throw new Error('Missing account');
 if (!garment || garment.accountId!==accountId) throw new Error('Account mismatch');
 if (!/^[a-f0-9]{64}$/i.test(garment.originalSha256||'')) throw new Error('Missing original integrity hash');
 if (!Number.isInteger(garment.width)||!Number.isInteger(garment.height)||garment.width<1||garment.height<1||garment.width*garment.height>16000000) throw new Error('Invalid original dimensions');
 if (!(garment.pixels instanceof Uint8ClampedArray)||garment.pixels.length!==garment.width*garment.height*4) throw new Error('Invalid RGBA source');
 if (!(mask instanceof Uint8Array)||mask.length!==garment.width*garment.height) throw new Error('Mask must match original pixels');
 if (!mask.some(value=>value>0)) throw new Error('Empty mask');
 return true;
}
export function isolateLicensedGarment({accountId,garment,mask}) {
 validateGarmentTransfer({accountId,garment,mask});
 const result=new Uint8ClampedArray(garment.pixels);
 for(let i=0;i<mask.length;i++)result[i*4+3]=Math.round(result[i*4+3]*mask[i]/255);
 return {width:garment.width,height:garment.height,pixels:result,originalSha256:garment.originalSha256};
}
export function transferPreviewFrame({accountId,garment,mask}) {
 const isolated=isolateLicensedGarment({accountId,garment,mask});
 return { ...isolated, provenance:'original-photo-plus-reviewed-mask',fitSimulation:false,placement:'preview-only' };
}
