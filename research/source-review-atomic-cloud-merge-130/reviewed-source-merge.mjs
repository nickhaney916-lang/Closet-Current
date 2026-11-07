/**
 * PHOTO130 — research-only source/review-ATOMIC cloud reconciliation.
 *
 * The existing cloud merge is a generic field-level JSON three-way merge.
 * It can combine a color or subtype reviewed for photograph A with a distinct
 * photograph B (and a valid source-bound JPEG cutout) changed on another
 * device. Per-field JPEG SHA validation alone cannot detect that semantic
 * source/review mismatch: BOTH images can be individually byte-valid.
 *
 * This adapter allows independent cosmetic edits and additions but treats
 * reviewed identity, original/cutout source and owner review as ONE protected
 * unit, rejecting ambiguous concurrent changes BEFORE any cloud write.
 *
 * Does not mutate public/cloud-backup-engine.js, issue HTTP or write to IDB.
 */
import cloudEngine from '../../public/cloud-backup-engine.js';
import {validateRestore01} from '../restore-atomic-01/atomic-restore.mjs';

const {validateDocument,mergeDocuments,canonical,equal}=cloudEngine;
const clone=x=>structuredClone(x);
const ownerIdOK=x=>typeof x==='string'&&x.length>0&&x.length<=160;
const safePresentationFields=new Set([
 'notes','seasons','occasion','brand','size','material'
]);
const conflict=(kind,ids=[])=>{
 const e=Error('PHOTO130 '+kind+' — explicit owner conflict resolution required');
 e.code='source-review-conflict';
 // IDs only: never return the photo bytes, review labels or private metadata.
 e.conflictingItemIds=Object.freeze([...ids]);
 return e;
};
const same=(a,b)=>equal(a,b);
const core=row=>{
 if(row===undefined)return undefined;
 if(row===null||typeof row!=='object'||Array.isArray(row))return row;
 return Object.fromEntries(Object.entries(row)
  .filter(([field])=>!safePresentationFields.has(field)));
};
const photoSource=row=>{
 if(row===undefined)return undefined;
 if(row===null||typeof row!=='object'||Array.isArray(row))return row;
 return {
  ownerId:row.ownerId,sourceId:row.sourceId,sourceSHA256:row.sourceSHA256,
  originalPhoto:row.originalPhoto,image:row.image,
  recognitionPhoto:row.recognitionPhoto,
  segmentHint:row.segmentHint,cutoutSHA256:row.cutoutSHA256,
  outfitSourceId:row.outfitSourceId,cropBounds:row.cropBounds,
  sourceHashVerified:row.sourceHashVerified,sourcePhotoOriginal:row.sourcePhotoOriginal,
  singleGarmentVerified:row.singleGarmentVerified
 };
};
const index=doc=>new Map((doc?.items||[]).map(x=>[x.id,x]));
export const REVIEWED_SOURCE_CLOUD_MERGE_130=Object.freeze({
 mode:'research-only-preflight',
 requiresDoubleJPEGProof:true,sourceReviewAtomic:true,
 noRemoteWrite:true,signedJWTIndependentlyVerified:false,
 productionAuthorized:false,familyAlpha:'HOLD'
});

/**
 * This is a *candidate only*. A separate owner-authorized cloud writer
 * still needs its own signed JWT, remote revision CAS, live session lease,
 * and in-transaction local revision checks before committing the candidate.
 *
 * A prior source-photo replacement on one device concurrent with ANY edit
 * to the same item on the other device is refused. Concurrent reviews of
 * unrelated fields of the same source are conservatively refused unless
 * their final protected review cores are identical.
 */
export async function reconcileReviewedCloud130({
 base=null,local,remote,ownerId,assertLease=()=>true
}={}){
 if(!ownerIdOK(ownerId)||typeof assertLease!=='function'||
  assertLease()!==true)
  throw Error('PHOTO130 active authenticated owner lease required');
 if(!local||!remote||typeof local!=='object'||typeof remote!=='object')
  throw Error('PHOTO130 complete private device documents required');
 // Clone BEFORE any async digest: clients may mutate their source metadata
 // mid-hash. Never merge a later mutation after verifying earlier bytes.
 const snap=clone({base,local,remote});
 for(const part of [snap.base,snap.local,snap.remote]){
  if(!part)continue;
  validateDocument(part);
  if(part.ownerId!==ownerId)
   throw Error('PHOTO130 foreign or unowned cloud document denied');
  await validateRestore01(part,{ownerId,mode:'cloud'});
  if(assertLease()!==true)
   throw Error('PHOTO130 owner lease revoked while validating photo');
 }
 const b=index(snap.base),l=index(snap.local),r=index(snap.remote);
 const reviewed= new Set([...b.keys(),...l.keys(),...r.keys()]);
 for(const id of reviewed){
  const before=b.get(id),left=l.get(id),right=r.get(id);
  // The generic cloud algorithm resolves deletion vs editing and collisions.
  // Explicitly protect new IDs separately, because both devices might add
  // different source photos under the same identifier without an ancestor.
  if(!before&&left&&right&&!same(core(left),core(right)))
   throw conflict('new source ID reused with incompatible review',[id]);
  if(!before||!left||!right)continue;
  const changedLeft=!same(left,before),changedRight=!same(right,before);
  const sourceLeft=!same(photoSource(left),photoSource(before));
  const sourceRight=!same(photoSource(right),photoSource(before));
  if(((sourceLeft&&changedRight)||(sourceRight&&changedLeft))&&
      !same(left,right))
   throw conflict('concurrent source replacement and garment edit',[id]);
  const reviewLeft=!same(core(left),core(before));
  const reviewRight=!same(core(right),core(before));
  if(reviewLeft&&reviewRight&&!same(core(left),core(right)))
   throw conflict('independent owner review changes cannot be spliced',[id]);
 }
 if(assertLease()!==true)
  throw Error('PHOTO130 owner session revoked before merge');
 let merged;
 try{
  merged=mergeDocuments(snap.base,snap.local,snap.remote);
 }catch(e){
  if(e?.code==='conflict')throw conflict('unresolved cloud revision difference');
  throw e;
 }
 // Defense in depth: never let the generic JSON field merger synthesize a
 // reviewed owner/source core which no branch explicitly reviewed.
 const m=index(merged);
 for(const [id,row] of m){
  const accepted=[b.get(id),l.get(id),r.get(id)]
   .some(source=>source!==undefined&&same(core(row),core(source)));
  if(!accepted)throw conflict('reconstructed unreviewed hybrid source',[id]);
 }
 merged.ownerId=ownerId;
 await validateRestore01(merged,{ownerId,mode:'cloud'});
 if(assertLease()!==true)
  throw Error('PHOTO130 owner session revoked after merged cutout SHA proof');
 // Final result is an isolated candidate, NOT a write or release receipt.
 return Object.freeze({
  candidate:clone(merged),ownerId,
  inheritedSourceReviewVerified:true,photoBytesIndependentlyVerified:true,
  sourceReviewAtomic:true,requiresRemoteRevisionCAS:true,
  applied:false,realSignedJWTVerified:false,releaseAuthorized:false,
  familyAlpha:'HOLD'
 });
}
