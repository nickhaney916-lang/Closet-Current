import {fingerprintOriginalPhoto} from './original-photo-fingerprint.mjs';

/**
 * Offline adapter boundary: caller must supply original bytes and verified owner
 * for every garment. It never reads cloud storage, fetches images or writes data.
 */
export async function prepareVerified3DItems(items,scope,readOriginalBytes,cryptoProvider=globalThis.crypto){
 if(!Array.isArray(items)||typeof scope!=='string'||!scope.trim()||typeof readOriginalBytes!=='function')throw Error('Verified preparation inputs required');
 const prepared=[],sourceByItem=new WeakMap(),seenIds=new Set();
 for(const item of items){
  if(!item||typeof item.id!=='string'||item.accountId!==scope)throw Error('Unverified wardrobe ownership');
  if(seenIds.has(item.id))throw Error('Duplicate wardrobe item ID');
  seenIds.add(item.id);
  if(typeof item.originalPhotoId!=='string'||!item.originalPhotoId.trim())throw Error('Stable original-photo ID required');
  const bytes=await readOriginalBytes(item);
  const fingerprint=await fingerprintOriginalPhoto(bytes,cryptoProvider);
  if(item.originalSourceVersion!==fingerprint.version)throw Error('Stale original-photo fingerprint');
  prepared.push({...item,originalSourceVersion:fingerprint.version});
  sourceByItem.set(prepared[prepared.length-1],{id:item.originalPhotoId,version:fingerprint.version});
 }
 return {items:prepared,sourceIdentity:item=>sourceByItem.get(item)};
}
