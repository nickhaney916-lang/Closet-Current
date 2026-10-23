import {verifyCapturedOutfitBoard} from './verified-captured-outfit-board.mjs';

/**
 * Compare a previously verified saved-outfit snapshot with current original sources.
 * Never silently accept missing or changed original-source versions.
 */
export async function restoreVerifiedCapturedOutfitBoard(savedSnapshot,board,items,accountId,verifyOwnership,cryptoProvider=globalThis.crypto){
 if(!savedSnapshot||!Array.isArray(savedSnapshot.selected)||!savedSnapshot.selected.length)throw Error('Verified saved outfit snapshot required');
 const current=await verifyCapturedOutfitBoard(board,items,accountId,verifyOwnership,cryptoProvider);
 if(savedSnapshot.selected.length!==current.selected.length)throw Error('Saved outfit selection changed');
 const previous=new Map();
 for(const selected of savedSnapshot.selected){
  if(!selected||typeof selected.slot!=='string'||previous.has(selected.slot))throw Error('Invalid saved outfit source snapshot');
  previous.set(selected.slot,selected);
 }
 for(const selected of current.selected){
  const prior=previous.get(selected.slot);
  if(!prior||prior.itemId!==selected.itemId||prior.sourceIdentity!==selected.sourceIdentity||prior.sourceVersion!==selected.sourceVersion)throw Error('Saved outfit source changed; rebuild required');
 }
 return current;
}
