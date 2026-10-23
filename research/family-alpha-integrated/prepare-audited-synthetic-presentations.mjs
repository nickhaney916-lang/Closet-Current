/**
 * Family Alpha integrated development CANDIDATE — synthetic fixture ONLY.
 *
 * Composes PR #257 conservative source-masking with PR #265 independent
 * source-pixel/ground-truth audit, then prepares item-bound images for PR #264.
 * Real customer photos DO NOT have independent ground truth and MUST NOT
 * receive an approved presentation from this development-only facility.
 *
 * This file lives in research/, never in public/. Never wire to production.
 */
import {prepareSyntheticGarmentOriginal} from '../family-alpha-13/garment-photo-preparation.mjs';
import {auditMask,fingerprintSavedCrop} from '../family-alpha-16/source-mask-audit.mjs';
import {fingerprintAlphaRetainedOriginal,identityForSavedGarment}
 from '../../public/family-alpha-2d-saved-board.mjs';

const SLOTS=['top','bottom','shoes','layer','layer2','layer3'];
const originalOf=item=>item.originalPhoto===undefined?item.image:item.originalPhoto?.image;
function checkCurrent(getScope,ownerId,epoch,isCurrent){
 const s=getScope?.();
 if(!s||s.ownerId!==ownerId||s.epoch!==epoch||isCurrent?.()!==true)
  throw Error('Family Alpha fixture account or session changed');
}
function chosen(board,items){
 if(!board?.slots||!items||!Array.isArray(items))throw Error('Fixture saved board and wardrobe required');
 const map=new Map();
 for(const item of items){
  if(typeof item?.id!=='string'||!item.id||map.has(item.id))throw Error('Invalid or duplicate saved clothing item');
  map.set(item.id,item);
 }
 const ids=SLOTS.map(slot=>board.slots[slot]).filter(id=>typeof id==='string'&&id);
 if(!ids.length||new Set(ids).size!==ids.length)throw Error('Missing or duplicate fixture garment');
 return ids.map(id=>{const item=map.get(id);if(!item)throw Error('Fixture garment is absent from saved wardrobe');return item;});
}
/**
 * This gate intentionally REQUIRES trusted synthetic ground truth and cannot
 * automatically approve real-photo masks. This is a reproducible integration
 * exercise, not a field-ready garment segmentation provider.
 */
export async function prepareAuditedSyntheticPresentations({
 board,items,ownerId,getScope,getItem,decodeOriginal,
 groundTruthForItem,createImage,cryptoProvider=globalThis.crypto,isCurrent=()=>true
}={}){
 if(typeof ownerId!=='string'||typeof getScope!=='function'||typeof getItem!=='function'||
    typeof decodeOriginal!=='function'||typeof groundTruthForItem!=='function'||
    typeof createImage!=='function'||typeof isCurrent!=='function')
  throw Error('Synthetic-only audit inputs required; live photos are blocked');
 const start=getScope();
 if(start?.ownerId!==ownerId||!Number.isSafeInteger(start.epoch)||start.epoch<1)
  throw Error('Unverified fixture account scope');
 const output=Object.create(null);
 for(const item of chosen(board,items)){
  checkCurrent(getScope,ownerId,start.epoch,isCurrent);
  const source=originalOf(item);
  const sourceVersion=await fingerprintAlphaRetainedOriginal(source,cryptoProvider);
  const cropSha=await fingerprintSavedCrop(item,cryptoProvider);
  checkCurrent(getScope,ownerId,start.epoch,isCurrent);
  const frame=await decodeOriginal(source);
  checkCurrent(getScope,ownerId,start.epoch,isCurrent);
  const prepared=prepareSyntheticGarmentOriginal(frame,{
   category:item.category,
   sourceIdentity:identityForSavedGarment(item),
   sourceVersion
  });
  if(prepared.status!=='prepared')throw Error('Garment needs review: '+prepared.reason);
  const truth=groundTruthForItem(item.id);
  if(!(truth instanceof Uint8Array)||truth.length!==frame.width*frame.height)
   throw Error('Independent synthetic ground truth required; no automatic real-photo approval');
  const evidence={...prepared,itemId:item.id,ownerId,originalSha:sourceVersion,cropSha};
  const result=await auditMask({
   item,prepared:evidence,ownerId,getScope,getItem,decodeOriginal,
   cryptoProvider,groundTruth:truth,isCurrent
  });
  checkCurrent(getScope,ownerId,start.epoch,isCurrent);
  if(result.status!=='pass'||result.independentSourceAndMaskVerifiedInFixture!==true||
     result.canDisplay!==false)
   throw Error('Garment needs review: '+result.reason);
  if(getItem(item.id)!==item)
   throw Error('Fixture wardrobe record changed during preparation');
  const image=await createImage(prepared,item);
  checkCurrent(getScope,ownerId,start.epoch,isCurrent);
  if(!image)throw Error('Synthetic transparent image unavailable');
  output[item.id]=Object.freeze({
   itemId:item.id,ownerId,
   sourceIdentity:identityForSavedGarment(item),
   sourceVersion,approved:true,image,
   syntheticFixtureOnly:true,independentGroundTruthChecked:true
  });
 }
 return output;
}
