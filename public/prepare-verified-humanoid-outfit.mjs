import {verifyCapturedOutfitBoard} from './verified-captured-outfit-board.mjs';
import {toVerifiedHumanoidColors} from './verified-humanoid-color-contract.mjs';

/**
 * Isolated, token-free integration of the authenticated-ownership verification
 * boundary with procedural renderer inputs. Never renders or stores photos.
 * Ownership verifier MUST consult authoritative authenticated account records.
 */
export async function prepareVerifiedHumanoidOutfit(board,items,accountId,verifyOwnership,cryptoProvider=globalThis.crypto){
 const verified=await verifyCapturedOutfitBoard(board,items,accountId,verifyOwnership,cryptoProvider);
 const colors=toVerifiedHumanoidColors(verified);
 return {colors,selected:verified.selected.map(({slot,itemId,sourceIdentity,sourceVersion})=>({slot,itemId,sourceIdentity,sourceVersion})),accountId:verified.accountId,placeholderOnly:true,originalPixelsRenderedAs3D:false};
}
