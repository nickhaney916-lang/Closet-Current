/**
 * Isolated adapter for Closet Current's actual board.slots -> owned item.id contract.
 * Synthetic metadata only; original photo bytes never leave the caller.
 * NOT integrated with cloud auth or the live Outfit Builder.
 */
const VISUAL_SLOTS=Object.freeze(['top','bottom','shoes','layer']);
const SLOT_REGION=Object.freeze({top:'top',bottom:'bottom',shoes:'shoes',layer:'layer'});
const hexColor=value=>{
 if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))return null;
 return [0,2,4].map(i=>parseInt(value.slice(i+1,i+3),16)/255).concat(1);
};
export function mapBoardSlotsTo3D(board,ownedItems,scope,sourceIdentity){
 if(!board||!board.slots||Array.isArray(board.slots)||typeof board.slots!=='object')throw Error('Board slots required');
 if(!Array.isArray(ownedItems))throw Error('Owned garment collection required');
 if(typeof scope!=='string'||!scope.trim())throw Error('Verified account scope required');
 if(typeof sourceIdentity!=='function')throw Error('Verified original-photo identity resolver required');
 const byId=new Map();
 for(const item of ownedItems){
  if(!item||typeof item.id!=='string'||!item.id.trim())continue;
  if(byId.has(item.id))throw Error('Duplicate wardrobe item ID');
  byId.set(item.id,item);
 }
 const selected=[],ids=new Set(),colors={};
 const top=byId.get(board.slots.top);
 const isDress=top?.category==='Dresses';
 if(isDress&&(board.slots.bottom||board.slots.layer))throw Error('Dress outfit has conflicting bottom or layer');
 for(const slot of VISUAL_SLOTS){
  const id=board.slots[slot];
  if(id===undefined||id===null||id==='')continue;
  if(typeof id!=='string'||!byId.has(id))throw Error('Missing saved wardrobe item');
  if(ids.has(id))throw Error('Garment selected in multiple slots');
  ids.add(id);
  const item=byId.get(id);
  if(item.accountId!==scope)throw Error('Foreign wardrobe item');
  if(!item.image||typeof item.image!=='string')throw Error('Missing garment photo');
  const provenance=sourceIdentity(item);
  if(!provenance||typeof provenance!=='object'||typeof provenance.id!=='string'||!provenance.id.trim()||typeof provenance.version!=='string'||!provenance.version.trim())throw Error('Original-photo provenance and version unresolved');
  if(typeof item.originalSourceVersion!=='string'||item.originalSourceVersion!==provenance.version)throw Error('Original-photo source version mismatch');
  const identity=provenance.id;
  const region=SLOT_REGION[slot],color=hexColor(item.colorHex);
  if(!color)throw Error('Color requires explicit verified hex metadata');
  if(slot==='top'&&!['Tops','Dresses'].includes(item.category))throw Error('Top slot category mismatch');
  if(slot==='bottom'&&item.category!=='Bottoms')throw Error('Bottom slot category mismatch');
  if(slot==='shoes'&&item.category!=='Shoes')throw Error('Shoe slot category mismatch');
  if(slot==='layer'&&item.category!=='Outerwear')throw Error('Layer slot category mismatch');
  colors[region]=color;
  selected.push({slot,itemId:id,sourceIdentity:identity,sourceVersion:provenance.version,category:item.category,unseenSurfacesEstimated:true});
 }
 return {colors,selected,hasDress:isDress,placeholderOnly:true};
}
