/** Pure Family Alpha bridge: translate already-authorized outfit slots to 2D layer refs.
 * The caller must verify authenticated ownership and original-photo identity upstream.
 * This module never accepts or fetches URLs and never claims ownership verification.
 */
const SLOTS=['top','bottom','shoes','layer','layer2','layer3','dress'];
export function buildAlpha2DSelections(outfit,verifiedGarments){
 if(!outfit||typeof outfit!=='object'||Array.isArray(outfit))throw new TypeError('Outfit object required');
 if(!verifiedGarments||typeof verifiedGarments!=='object'||Array.isArray(verifiedGarments))throw new TypeError('Verified garment map required');
 const selected=[];
 for(const slot of SLOTS){
  const id=outfit[slot];
  if(id==null||id==='')continue;
  if(typeof id!=='string')throw new Error('Invalid outfit slot '+slot);
  if(!Object.hasOwn(verifiedGarments,id))throw new Error('Garment not verified for '+slot);
  const garment=verifiedGarments[id];
  if(!garment||garment.itemId!==id||typeof garment.sourceIdentity!=='string'||!garment.sourceIdentity||typeof garment.sourceVersion!=='string'||!garment.sourceVersion)throw new Error('Missing original-photo provenance for '+slot);
  selected.push({slot,itemId:id,sourceIdentity:garment.sourceIdentity,sourceVersion:garment.sourceVersion});
 }
 return selected;
}
