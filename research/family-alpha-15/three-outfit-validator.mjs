/** Family Alpha #15: isolated validation-only bridge for real Closet Current board.slots.
 * This is NOT a new recommendation engine and never persists records or fetches photos.
 * The actual stylist, adapter, renderer, and Auth are supplied by their owners.
 */
export const visualSlots=Object.freeze(['top','bottom','shoes','layer','layer2','layer3']);
const layerSlots=new Set(['layer','layer2','layer3']);
const keyOf=slots=>visualSlots.filter(s=>typeof slots?.[s]==='string').map(s=>s+':'+slots[s]).join('|');
const copy=object=>structuredClone(object);
function wardrobeMap(items){
 if(!Array.isArray(items)||!items.length)throw new Error('Saved wardrobe required');
 const index=new Map();
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id||index.has(item.id))throw new Error('Duplicate or invalid saved garment identity');
  index.set(item.id,item);
 }
 return index;
}
function compatible(slot,item){
 return slot==='top'?item.category==='Tops':
 slot==='bottom'?item.category==='Bottoms':
 slot==='shoes'?item.category==='Shoes':
 slot==='layer'?['Tops','Outerwear'].includes(item.category):
 layerSlots.has(slot)&&item.category==='Outerwear';
}
function selected(board,items,{complete=false}={}){
 if(!board||!board.slots||typeof board.slots!=='object'||Array.isArray(board.slots))throw new Error('Saved board.slots required');
 const index=wardrobeMap(items),seen=new Set(),slots=board.slots;
 for(const slot of visualSlots){
  const id=slots[slot];
  if(id===undefined)continue;
  if(typeof id!=='string'||!index.has(id)||seen.has(id))throw new Error('Missing, foreign or duplicate selected garment');
  seen.add(id);
  const item=index.get(id);
  if(slot==='top'&&item.category==='Dresses')continue;
  if(!compatible(slot,item))throw new Error('Incompatible saved garment: '+slot);
 }
 const top=index.get(slots.top),dress=top?.category==='Dresses';
 if(dress&&['bottom','layer','layer2','layer3'].some(s=>slots[s]!==undefined))
  throw new Error('Dress conflicts with bottom or jacket');
 if(complete&&(!slots.top||!slots.shoes||(!dress&&!slots.bottom)))
  throw new Error('Incomplete saved outfit');
 return {index,dress,slots};
}
/** Checks output from the REAL styleOwnedCollection; does not rank outfits. */
export function validateThreeOutfits(results,items){
 if(!Array.isArray(results)||results.length!==3)throw new Error('Exactly three saved-wardrobe outfits required');
 const signatures=new Set(),summaries=[];
 for(const result of results){
  const {slots,dress}=selected(result?.board,items,{complete:true});
  if(result?.missing?.length)throw new Error('Incomplete recommendation');
  const signature=keyOf(slots);
  if(signatures.has(signature))throw new Error('Three options must be distinct');
  signatures.add(signature);
  summaries.push(Object.freeze({signature,dress,ids:Object.freeze({...slots})}));
 }
 return Object.freeze(summaries);
}
/** Pure atomic ONE-PIECE selection. Rejects dress transitions as structural changes. */
export function swapOnePiece(board,slot,itemId,items,cleanBoard){
 if(!visualSlots.includes(slot)||typeof cleanBoard!=='function')throw new Error('Unknown visual swap slot');
 const {index,slots,dress}=selected(board,items,{complete:true});
 const target=index.get(itemId);
 if(!target||!compatible(slot,target))throw new Error('Missing or incompatible swap target');
 if(dress||target.category==='Dresses')throw new Error('Dress transition is not a one-piece swap');
 if(Object.entries(slots).some(([other,id])=>other!==slot&&id===itemId))
  throw new Error('Duplicate item would occupy multiple slots');
 const candidate=cleanBoard({...copy(board),slots:{...slots,[slot]:itemId}},items);
 const changed=selected(candidate,items,{complete:true}).slots;
 if(changed[slot]!==itemId)throw new Error('Selected swap item was lost');
 for(const [oldSlot,id] of Object.entries(slots))
  if(oldSlot!==slot&&changed[oldSlot]!==id)throw new Error('Swap modified a different saved slot');
 for(const [newSlot,id] of Object.entries(changed))
  if(newSlot!==slot&&slots[newSlot]!==id)throw new Error('Swap created an unexpected saved slot');
 return candidate;
}
/** Explicit STRUCTURAL transition from separates to a saved dress + shoes. */
export function switchToDress(board,dressId,items,cleanBoard){
 if(typeof cleanBoard!=='function')throw new Error('Saved board cleaner required');
 const {index,slots}=selected(board,items,{complete:true});
 if(index.get(dressId)?.category!=='Dresses')throw new Error('Saved dress required');
 if(slots.shoes===dressId)throw new Error('Same garment cannot fill shoes and dress');
 const candidate=cleanBoard({...copy(board),slots:{...slots,top:dressId}},items);
 const updated=selected(candidate,items,{complete:true});
 if(!updated.dress||updated.slots.top!==dressId||updated.slots.shoes!==slots.shoes)
  throw new Error('Dress transition changed shoes or lost dress');
 if(['bottom','layer','layer2','layer3'].some(s=>updated.slots[s]!==undefined))
  throw new Error('Dress transition retained incompatible garments');
 return candidate;
}
/** Ensures a failed attempt has not touched original in-memory saved data. */
export function unchangedSnapshot(items,beforeJSON){
 if(JSON.stringify(items)!==beforeJSON)throw new Error('Saved wardrobe mutated unexpectedly');
 return true;
}
