/**
 * Research-only contract boundary between verified outfit selection and the
 * token-free procedural humanoid renderer. No Auth, cloud or photo I/O here.
 */
const COLOR_KEYS=new Set(['top','bottom','shoes','layer','layer2','layer3','dress']);
const validRGBA=value=>Array.isArray(value)&&value.length===4&&value.every(n=>Number.isFinite(n)&&n>=0&&n<=1);
export function toVerifiedHumanoidColors(verified){
 if(!verified||verified.placeholderOnly!==true||!Array.isArray(verified.selected)||!verified.selected.length)throw Error('Verified placeholder selection required');
 const selectedIds=new Set(),selectedSlots=new Set();
 for(const item of verified.selected){
  if(!item||typeof item.slot!=='string'||typeof item.itemId!=='string'||!item.itemId||typeof item.sourceIdentity!=='string'||!item.sourceIdentity||typeof item.sourceVersion!=='string'||!item.sourceVersion)throw Error('Incomplete verified source identity');
  if(selectedIds.has(item.itemId)||selectedSlots.has(item.slot))throw Error('Duplicate verified garment selection');
  selectedIds.add(item.itemId);selectedSlots.add(item.slot);
 }
 const colors={};
 for(const [key,value] of Object.entries(verified.colors||{})){
  if(!COLOR_KEYS.has(key)||!validRGBA(value))throw Error('Invalid verified renderer color');
  colors[key]=[...value];
 }
 if(verified.hasDress){
  if(!selectedSlots.has('top')||selectedSlots.has('bottom')||selectedSlots.has('layer'))throw Error('Invalid dress selection');
  if(!colors.top)throw Error('Verified dress color missing');
  colors.dress=colors.top;delete colors.top;delete colors.bottom;delete colors.layer;
 }
 for(const item of verified.selected){
  const expected=verified.hasDress&&item.slot==='top'?'dress':item.slot;
  if(!colors[expected])throw Error('Selected garment renderer color missing');
 }
 return Object.freeze(colors);
}
