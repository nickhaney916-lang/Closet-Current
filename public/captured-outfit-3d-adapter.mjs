import {decodeOriginalJpegDataUrl,fingerprintOriginalJpegDataUrl} from './original-jpeg-source.mjs';
import {prepareVerified3DItems} from './verified-3d-photo-preparation.mjs';

/**
 * Offline mapping for a known, authenticated account. Does not establish ownership:
 * caller must have verified the items belong to the authenticated user.
 * Never infer a source from the garment crop or recognition preview.
 */
export async function prepareCapturedOutfit3DItems(items,verifiedAccountId,cryptoProvider=globalThis.crypto){
 if(!Array.isArray(items)||typeof verifiedAccountId!=='string'||!verifiedAccountId.trim())throw Error('Verified account required');
 const normalized=[];
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id.trim()||typeof item.outfitSourceId!=='string'||!item.outfitSourceId.trim())throw Error('Captured outfit source required');
  const url=item.originalPhoto?.image;
  const fingerprint=await fingerprintOriginalJpegDataUrl(url,cryptoProvider);
  normalized.push({...item,accountId:verifiedAccountId,originalPhotoId:item.outfitSourceId,originalSourceVersion:fingerprint.version});
 }
 const verified=await prepareVerified3DItems(normalized,verifiedAccountId,item=>decodeOriginalJpegDataUrl(item.originalPhoto.image),cryptoProvider);
 return verified;
}
