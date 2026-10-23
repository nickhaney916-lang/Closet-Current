/** Strictly research-only bridge to the PR #232 WebGL renderer interface.
 * The renderer merges colors, so explicitly clear every slot before applying
 * the next verified selection; otherwise old account garments can remain.
 */
const SLOTS=['top','bottom','shoes','layer','layer2','layer3','dress'];
export function applyVerifiedHumanoidOutfit(renderer,prepared){
 if(!renderer||renderer.supported!==true||typeof renderer.setOutfit!=='function')return false;
 if(!prepared||prepared.placeholderOnly!==true||prepared.originalPixelsRenderedAs3D!==false||!Array.isArray(prepared.selected)||!prepared.selected.length)throw Error('Verified procedural outfit required');
 const colors=prepared.colors;
 if(!colors||typeof colors!=='object'||Array.isArray(colors)||Object.keys(colors).some(key=>!SLOTS.includes(key)))throw Error('Invalid procedural colors');
 const usedIds=new Set(),usedSlots=new Set();
 for(const item of prepared.selected){
  if(!item||!SLOTS.includes(item.slot)||item.slot==='dress'||typeof item.itemId!=='string'||!item.itemId||typeof item.sourceIdentity!=='string'||!item.sourceIdentity||typeof item.sourceVersion!=='string'||!item.sourceVersion)throw Error('Incomplete verified renderer selection');
  if(usedIds.has(item.itemId)||usedSlots.has(item.slot))throw Error('Duplicate verified renderer selection');
  usedIds.add(item.itemId);usedSlots.add(item.slot);
 }
 if(Object.hasOwn(colors,'dress')&&(!usedSlots.has('top')||['bottom','layer','layer2','layer3'].some(x=>usedSlots.has(x))))throw Error('Invalid dress renderer selection');
 const expected=new Set(prepared.selected.map(x=>x.slot==='top'&&Object.hasOwn(colors,'dress')?'dress':x.slot));
 if(expected.size!==prepared.selected.length||Object.keys(colors).length!==expected.size||Object.keys(colors).some(key=>!expected.has(key)))throw Error('Renderer colors must match selected garments');
 for(const color of Object.values(colors))if(!Array.isArray(color)||color.length!==4||color.some(n=>!Number.isFinite(n)||n<0||n>1))throw Error('Invalid verified RGBA');
 const payload=Object.fromEntries(SLOTS.map(key=>[key,Object.hasOwn(colors,key)?[...colors[key]]:null]));
 return renderer.setOutfit(payload);
}

/** Call synchronously when an account is signed out or switched, before any async re-verification. */
export function clearVerifiedHumanoidOutfit(renderer){
 if(!renderer||renderer.supported!==true||typeof renderer.setOutfit!=='function')return false;
 return renderer.setOutfit(Object.fromEntries(SLOTS.map(key=>[key,null])));
}
