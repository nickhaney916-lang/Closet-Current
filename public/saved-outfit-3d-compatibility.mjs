/**
 * Offline compatibility gate for legacy 2D saved boards and verified 3D snapshots.
 * This module never upgrades a legacy board by assuming unverified provenance.
 */
export const VERIFIED_OUTFIT_SCHEMA_VERSION=1;
export function classifySavedOutfitFor3D(record){
 if(!record||typeof record!=='object'||Array.isArray(record))return {mode:'invalid',reason:'Saved outfit record required'};
 // Existing saved boards use board.slots and have no verified envelope.
 if(!Object.hasOwn(record,'schemaVersion')){
  if(record.slots&&typeof record.slots==='object'&&!Array.isArray(record.slots))
   return {mode:'legacy-2d',board:record,reason:'Original-photo verification snapshot absent'};
  return {mode:'invalid',reason:'Unrecognized saved outfit record'};
 }
 if(record.schemaVersion!==VERIFIED_OUTFIT_SCHEMA_VERSION)return {mode:'unsupported',reason:'Unknown verified outfit schema version'};
 if(!record.board||!record.board.slots||typeof record.board.slots!=='object'||Array.isArray(record.board.slots))
  return {mode:'invalid',reason:'Verified outfit board missing'};
 const snapshot=record.verifiedSnapshot;
 if(!snapshot||typeof snapshot.accountId!=='string'||!snapshot.accountId.trim()||!Array.isArray(snapshot.selected)||!snapshot.selected.length)
  return {mode:'invalid',reason:'Verified outfit source snapshot missing'};
 return {mode:'verify-3d',board:record.board,snapshot};
}
export function createVerifiedOutfitEnvelope(board,snapshot){
 if(!board||!board.slots||typeof board.slots!=='object'||Array.isArray(board.slots))throw Error('Saved board slots required');
 if(!snapshot||typeof snapshot.accountId!=='string'||!snapshot.accountId.trim()||!Array.isArray(snapshot.selected)||!snapshot.selected.length)throw Error('Verified source snapshot required');
 return {schemaVersion:VERIFIED_OUTFIT_SCHEMA_VERSION,board:structuredClone(board),verifiedSnapshot:structuredClone(snapshot)};
}
