/**
 * MAIN1054 M56 — independently inspect the exact P88 accepted source mask
 * before generating its bounded untrusted-worker-like observation.
 *
 * Node research only; not native Web Worker execution, not owner acceptance.
 * The group MUST originate from P88's pinned segmentation modules, with
 * real model logits in the optional inference job. Test fixtures are labeled.
 */
import {createHash} from 'node:crypto';
export const MASK56_MAX_SIDE=512;
export function evidenceFromP88Mask56({
 map,group,sourceSHA256,instanceOrdinal,cropBounds,requestId
}={}){
 if(!map||!group||!Number.isInteger(map.width)||!Number.isInteger(map.height)||
    map.width<1||map.height<1||map.width>MASK56_MAX_SIDE||
    map.height>MASK56_MAX_SIDE||
    !(map.labels instanceof Uint8Array)||
    map.labels.length!==map.width*map.height||
    !(group.selected instanceof Uint8Array)||
    group.selected.length!==map.labels.length||
    !Number.isInteger(group.id)||group.id<0||group.id>17||
    !Number.isSafeInteger(instanceOrdinal)||instanceOrdinal<0||
    !/^[a-f0-9]{64}$/.test(sourceSHA256||'')||
    typeof requestId!=='string'||requestId.length<8||
    !cropBounds||['x','y','width','height'].some(k=>!Number.isFinite(cropBounds[k])))
  throw Error('MAIN56 invalid source/mask/receipt');
 let positive=0;
 for(let i=0;i<group.selected.length;i++){
  const bit=group.selected[i];
  if(bit!==0&&bit!==1)throw Error('MAIN56 nonbinary accepted mask');
  if(bit&&map.labels[i]!==group.id)throw Error('MAIN56 mask escapes original predicted class');
  positive+=bit;
 }
 if(!positive||positive!==group.count)throw Error('MAIN56 lost or duplicated source pixels');
 if(!(Array.isArray(group.categories)&&group.categories.length&&
      group.categories.every(c=>typeof c==='string')))
  throw Error('MAIN56 unbounded or absent predicted category');
 // This SHA is computed independently from the REAL accepted mask bytes;
 // P88 worker's sha256Bytes70 produces the same digest when its receipt is on.
 const maskSha256=createHash('sha256').update(group.selected).digest('hex');
 const method=group.instanceMethod||'native_semantic_group';
 return Object.freeze({
  method,positive,maskSha256,sourceSHA256,
  event:{type:'piece',id:requestId,piece:{
   // Deliberately no instanceKey: source-binding M55 is responsible for it.
   cropBounds:{...cropBounds},instanceMethod:method,
   hint:{categories:[...group.categories],types:[...(group.types||[])],
    clipped:group.clipped===true,confidence:group.confidence},
   colorEstimate:null,
   reconciliation70:{
    sourceSha256:sourceSHA256,maskSha256,instanceOrdinal,method
   }
  }}
 });
}
