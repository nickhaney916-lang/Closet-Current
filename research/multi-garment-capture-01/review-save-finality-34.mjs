/**
 * REVIEW-SAVE-FINALITY-34 — immutable human-reviewed save intent.
 * A clicked Save must commit the confirmed facts at that instant, not mutable
 * live UI objects that a deferred queue or crop callback may later change.
 * No photo is uploaded; no database access or model changes occur here.
 */
import {validCrop24,minimalPieceSnapshot51} from './atomic-group.mjs';
import {canConfirmScene32} from './scene-class-guard-32.mjs';

export function snapshotConfirmations34(pieces,schema,proof) {
 if(!Array.isArray(pieces))throw Error('REVIEW34 missing review list');
 const references=pieces.filter(p=>p?.confirmed===true);
 if(!references.length)throw Error('Select at least one reviewed garment.');
 const snapshots=references.map(piece=>{
  if(!canConfirmScene32(piece,schema)||!validCrop24(piece.cropBounds)||
     (piece.manual&&!piece.cropReviewed))
   throw Error('Confirm category, specific type, and color, and adjust crops for manually added items.');
  // SNAPSHOT78: allowlist and sanitize BEFORE structuredClone. Cloning the
  // entire live review piece used to fail on noncloneable/large detector,
  // browser or diagnostic metadata even when all human-confirmed facts were
  // correct. The atomic record boundary already uses the exact SNAPSHOT51
  // allowlist; reuse it here with the verified original proof to retain only
  // correctly bound optional AI source/crop receipts.
  // Never expose this immutable snapshot to later UI edit handlers.
  return structuredClone(minimalPieceSnapshot51(piece,proof));
 });
 if(new Set(snapshots.map(p=>p.id)).size!==snapshots.length||
    new Set(snapshots.map(p=>p.instanceKey)).size!==snapshots.length)
  throw Error('Duplicate reviewed piece in the same save batch.');
 return {references,snapshots};
}

export function saveReceipt34(count,notificationFailed=false,refreshFailed=false) {
 if(!Number.isInteger(count)||count<1)throw Error('REVIEW34 missing commit receipt');
 const saved=count+' separately confirmed garment'+(count===1?'':'s')+
  ' saved together with the original photo SHA-256.';
 const unavailable=[
  notificationFailed?'saved-item notification':null,
  refreshFailed?'closet display refresh':null
 ].filter(Boolean);
 return unavailable.length?
  saved+' '+unavailable.join(' and ')+
  ' failed after saving. Reload My Closet; do not re-import the same garments.':
  saved;
}
