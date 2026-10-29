/** Existing licensed reference only: never manufacture a missing pants cutout. */
import {readVerifiedAsset} from '../three-d-02/reviewed-texture.mjs';
export const PANTS_REFERENCE='commons-0021';
export function pantsSourcePolicy(manifest,locked){
 const row=manifest?.rows?.find(r=>r.id===PANTS_REFERENCE),source=locked?.find(r=>r.id===PANTS_REFERENCE);
 if(manifest?.release!=='HOLD'||!source?.verified||row?.category!=='Bottoms'||row.sourceSHA256!==source.sha256||row.originalPreserved!==true||row.ownerApproved!==false)throw Error('Pants reference identity/review invalid');
 // This stage cannot silently promote a future mask. That needs a separate
 // orientation, source-RGB and garment-surface review before enabling texture.
 return {id:row.id,sourceSHA256:row.sourceSHA256,hasCutout:row.hasCutout,mode:'neutral-research-no-valid-cutout',photoApplied:false,releaseAuthorized:false,reason:row.reason,attribution:source.attribution};
}
export async function loadPantsReference(manifest,locked){const policy=pantsSourcePolicy(manifest,locked);const blob=await readVerifiedAsset('/benchmark/work47/assets/'+policy.id+'.jpg',policy.sourceSHA256);return {policy,blob};}
