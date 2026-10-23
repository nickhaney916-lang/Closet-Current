import {prepareCapturedOutfit3DItems} from './captured-outfit-3d-adapter.mjs';
import {mapBoardSlotsTo3D} from './outfit-3d-board-bridge.mjs';

/**
 * Offline snapshot verification. Every evaluation recomputes source fingerprints.
 * Caller supplies an authoritative account ownership verifier and real source photos.
 */
export async function verifyCapturedOutfitBoard(board,items,accountId,verifyOwnership,cryptoProvider=globalThis.crypto){
 const verified=await prepareCapturedOutfit3DItems(items,accountId,verifyOwnership,cryptoProvider);
 return mapBoardSlotsTo3D(board,verified.items,accountId,verified.sourceIdentity);
}
