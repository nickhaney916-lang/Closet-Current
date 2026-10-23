import {decodeOriginalJpegDataUrl,fingerprintOriginalJpegDataUrl} from './original-jpeg-source.mjs';
import {prepareVerified3DItems} from './verified-3d-photo-preparation.mjs';

/**
 * Offline mapping for a known, authenticated account. Does not establish ownership:
 * caller must verify each item's ownership against an authoritative account-scoped source.
 * Never infer a source from the garment crop or recognition preview.
 */
export async function prepareCapturedOutfit3DItems(items,verifiedAccountId,verifyItemOwnership,cryptoProvider=globalThis.crypto){
 if(!Array.isArray(items)||typeof verifiedAccountId!=='string'||!verifiedAccountId.trim()||typeof verifyItemOwnership!=='function')throw Error('Verified account required');
 const normalized=[],captureSources=new Map();
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id.trim()||typeof item.outfitSourceId!=='string'||!item.outfitSourceId.trim())throw Error('Captured outfit source required');
  if(await verifyItemOwnership(item,verifiedAccountId)!==true)throw Error('Unverified captured garment ownership');
  const url=item.originalPhoto?.image;
  const fingerprint=await fingerprintOriginalJpegDataUrl(url,cryptoProvider);
  const prior=captureSources.get(item.outfitSourceId);
  if(prior&&prior!==fingerprint.version)throw Error('Conflicting original photographs for shared capture');
  captureSources.set(item.outfitSourceId,fingerprint.version);
  normalized.push({...item,accountId:verifiedAccountId,originalPhotoId:item.outfitSourceId,originalSourceVersion:fingerprint.version});
 }
 const verified=await prepareVerified3DItems(normalized,verifiedAccountId,item=>decodeOriginalJpegDataUrl(item.originalPhoto.image),cryptoProvider);
 return verified;
}
