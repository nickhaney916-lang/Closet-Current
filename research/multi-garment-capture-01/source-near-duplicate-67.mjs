/**
 * NEARDUP67 — narrowly refuse a repeat near-identical crop from the SAME
 * independently verified original JPEG within one signed owner's closet.
 *
 * Exact sourcePieceKey equality is already enforced by MULTI24. Its manual
 * key rounds crop coordinates to 0.001: moving the crop by even two source
 * pixels generates a new key for the SAME garment. A prior saved manual crop
 * can therefore be added again by slightly adjusting the crop.
 *
 * This conservative comparison requires:
 * - same authenticated owner and canonical source SHA;
 * - both canonical original bytes independently SHA-verified on save;
 * - human-reviewed photo crops with category, exact subtype and color equal;
 * - at least one explicitly manually selected garment region;
 * - nearly identical rectangles (IoU >= 0.98).
 *
 * NEVER apply to two distinct SegFormer instance keys (seg.../seg...),
 * other sources, unrelated overlapping garments or independent owners.
 * This is *duplicate-risk prevention*, not visual instance recognition;
 * no real segmentation model or physical device accuracy is inferred.
 */
const SHA67=/^[a-f0-9]{64}$/;
const PREFIX67=/^[a-f0-9]{64}\/(?:manual-[0-9-]+|seg-[a-z0-9-]+)$/;
export const MIN_NEAR_DUPLICATE_IOU67=0.98;
const sourceRect67=record=>record?.extractionBounds||record?.cropBounds;
const validRect67=r=>r&&typeof r==='object'&&
 ['x','y','width','height'].every(k=>typeof r[k]==='number'&&Number.isFinite(r[k]))&&
 r.x>=0&&r.y>=0&&r.width>0&&r.height>0&&
 r.x+r.width<=1.000001&&r.y+r.height<=1.000001;
export function overlapSourceRegions67(a,b){
 if(!validRect67(a)||!validRect67(b))return 0;
 const left=Math.max(a.x,b.x),top=Math.max(a.y,b.y);
 const right=Math.min(a.x+a.width,b.x+b.width);
 const bottom=Math.min(a.y+a.height,b.y+b.height);
 if(right<=left||bottom<=top)return 0;
 const intersection=(right-left)*(bottom-top);
 const areaA=a.width*a.height,areaB=b.width*b.height;
 const union=areaA+areaB-intersection;
 return union>0?intersection/union:0;
}
const reviewed67=r=>!!r&&typeof r==='object'&&!Array.isArray(r)&&
 typeof r.ownerId==='string'&&r.ownerId.length>0&&
 r.sourceHashVerified===true&&SHA67.test(r.sourceSHA256||'')&&
 r.originalPhoto?.sha256===r.sourceSHA256&&
 r.sourceCropReviewed===true&&r.extractionReview==='human-confirmed'&&
 typeof r.category==='string'&&r.category.length>0&&
 typeof r.itemType==='string'&&r.itemType.length>0&&
 typeof r.color==='string'&&r.color.trim().length>0&&
 typeof r.sourcePieceKey==='string'&&PREFIX67.test(r.sourcePieceKey)&&
 r.sourcePieceKey.startsWith(r.sourceSHA256+'/')&&
 validRect67(sourceRect67(r));
const sameHuman67=(a,b)=>a.category===b.category&&
 a.itemType===b.itemType&&a.color.trim().toLowerCase()===b.color.trim().toLowerCase();
const someManual67=(a,b)=>a.sourcePieceKey.includes('/manual-')||
 b.sourcePieceKey.includes('/manual-');
export function nearDuplicateSourceRegions67(existing,proposed){
 if(!Array.isArray(existing)||!Array.isArray(proposed))return [];
 const duplicates=[];
 for(const next of proposed){
  if(!reviewed67(next))continue;
  for(const prev of existing){
   if(!reviewed67(prev)||next.id===prev.id||next.ownerId!==prev.ownerId||
    next.sourceSHA256!==prev.sourceSHA256||!someManual67(prev,next)||
    !sameHuman67(prev,next))continue;
   const overlap=overlapSourceRegions67(sourceRect67(prev),sourceRect67(next));
   if(overlap+Number.EPSILON<MIN_NEAR_DUPLICATE_IOU67)continue;
   // Never copy raw image bytes, private owner data or human notes into
   // this diagnostic: failed transactions must be all-or-nothing.
   duplicates.push({sourcePieceKey:next.sourcePieceKey,
    priorSourcePieceKey:prev.sourcePieceKey,intersectionOverUnion:overlap});
   break;
  }
 }
 return duplicates;
}
