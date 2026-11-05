/**
 * CORRECTED-GARMENT-NAME-INDEX-66 — pure research-only saved-item name sync.
 *
 * A garment captured from an exact original JPEG can start with the implicit
 * label "[human color] [human subtype]". Changing the saved category, subtype
 * and color through the real owner's Adjust details dialog previously left
 * that auto label stale, even when indexed color/type were correct.
 *
 * Conservative rule: only correct the name when the previous exact saved
 * source is a human-reviewed, owner-sourced multi-piece garment; its previous
 * name EXACTLY matches our auto-generated human-confirmed label; and the
 * person left Name untouched during this edit. A custom/explicitly modified
 * name is never overwritten. Does not call a classifier or mutate source.
 */
const CATS66=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
const SHA66=/^[a-f0-9]{64}$/;
const invalidText66=x=>typeof x!=='string'||x.length>120;
const label66=item=>{
 const color=typeof item?.color==='string'?item.color.trim():'';
 const itemType=typeof item?.itemType==='string'?item.itemType.trim():'';
 const category=typeof item?.category==='string'?item.category.trim():'';
 const noun=itemType&&itemType!=='Unknown'&&itemType!=='Other'?itemType:
  itemType==='Other'&&CATS66.has(category)?category:
  category;
 return [color,noun].filter(Boolean).join(' ').trim().slice(0,120);
};
/**
 * No changed object identity or source photo bytes are ever manufactured.
 * Return only a suggested string for the already-authorized CAS writer.
 */
export function syncOwnerGarmentName66(before,after){
 if(!before||!after||typeof before!=='object'||typeof after!=='object'||
    Array.isArray(before)||Array.isArray(after))
  throw Error('LABELSYNC66 saved rows required');
 if(invalidText66(before.name)||invalidText66(after.name)||
    typeof before.category!=='string'||typeof before.itemType!=='string'||
    typeof before.color!=='string'||typeof after.category!=='string'||
    typeof after.itemType!=='string'||typeof after.color!=='string')
  throw Error('LABELSYNC66 missing or oversized human garment fields');
 const fieldsChanged=before.category!==after.category||
  before.itemType!==after.itemType||before.color!==after.color;
 // A label must never be recalculated on a notes-only edit, or for a custom
 // name that the user set in this editing session.
 if(!fieldsChanged)return {name:after.name,renamed:false,reason:'category-subtype-color-unchanged'};
 if(before.name!==after.name)
  return {name:after.name,renamed:false,reason:'explicit-name-edit-preserved'};
 if(before.sourceCropReviewed!==true||before.extractionReview!=='human-confirmed'||
    before.sourceHashVerified!==true||!SHA66.test(before.sourceSHA256||'')||
    before.originalPhoto?.sha256!==before.sourceSHA256||
    typeof before.sourcePieceKey!=='string'||
    !before.sourcePieceKey.startsWith(before.sourceSHA256+'/')||
    !CATS66.has(before.category)||!CATS66.has(after.category))
  return {name:after.name,renamed:false,reason:'not-verified-original-crop-or-supported-taxonomy'};
 // The original photo is only provenance; the current corrected human fields
 // always take precedence over stale suggestion/category/color caches.
 // The only safe auto-naming inference is exact equality with the name this
 // multi-piece flow creates from the originally confirmed category/type/color.
 const originalAuto=[before.color,before.itemType||before.category].filter(Boolean).join(' ').trim().slice(0,120);
 if(before.name!==originalAuto)
  return {name:after.name,renamed:false,reason:'existing-custom-name-preserved'};
 const next=label66(after);
 if(!next||next===before.name)
  return {name:after.name,renamed:false,reason:'no-safe-name-change'};
 return {name:next,renamed:true,reason:'human-corrected-derived-label'};
}
