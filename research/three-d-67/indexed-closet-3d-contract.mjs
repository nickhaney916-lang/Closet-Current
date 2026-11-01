/** Closet Current 3D-67: strict private indexed-closet metadata -> anatomical
 * garment slot contract. NO user photos, no meshes, no network, no fake
 * category certainty, no cross-account mixing. Recognition originals only.
 */
export const INDEX_CATEGORIES=Object.freeze(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']);
const slots=Object.freeze({Tops:'shirt',Bottoms:'pants',Dresses:'dress',Outerwear:'outerwear',Shoes:'shoes',Accessories:'accessory'});
const ambiguous=new Set(['','Unknown','Uncategorized','Not applicable','Other']);
const hex64=/^[0-9a-f]{64}$/i;
const clean=(v,n=160)=>typeof v==='string'&&v.length>0&&v.length<=n&&!/[<>\x00-\x1f]/.test(v);
export function validateIndexedWardrobeItem(item,{ownerId}={}){
 if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Indexed original garment metadata required');
 if(!clean(ownerId,120)||item.ownerId!==ownerId)throw Error('Indexed wardrobe account isolation/owner mismatch');
 if(!clean(item.id)||!clean(item.sourceId)||!hex64.test(item.sourceSHA256||''))
  throw Error('Original photographed garment source identity/SHA missing');
 if(!INDEX_CATEGORIES.includes(item.category)||ambiguous.has(item.itemType||''))
  throw Error('Uncertain category or garment subtype requires user confirmation before 3D fitting');
 if(item.recognitionStatus!=='confirmed'||item.ownerReviewed!==true)
  throw Error('3D category and item type require user review; AI guesses alone are not approved');
 if(!clean(item.color,64)||ambiguous.has(item.color))
  throw Error('Minimum color and original category must be reviewed');
 if(item.sourcePhotoOriginal!==true)throw Error('3D fitting always references original full-resolution camera/source photo');
 return Object.freeze({id:item.id,ownerId:item.ownerId,sourceId:item.sourceId,sourceSHA256:item.sourceSHA256.toLowerCase(),
  category:item.category,itemType:item.itemType,color:item.color,slot:slots[item.category],
  sourcePhotoOriginal:true,ownerReviewed:true,recognitionStatus:'confirmed',
  threeDimensionalMeshApproved:item.threeDimensionalMeshApproved===true&&item.garmentMeshVerified===true,
  renderStatus:item.threeDimensionalMeshApproved===true&&item.garmentMeshVerified===true?'eligible-for-actual-3d':'original-photo-or-2d-fallback'});
}
export function arrangeIndexedOutfit(items,{ownerId}={}){
 if(!Array.isArray(items)||items.length>12)throw Error('Untrusted oversized outfit selection');
 const picks=items.map(i=>validateIndexedWardrobeItem(i,{ownerId}));
 const sourceIds=new Set(),ids=new Set(),bySlot={};
 for(const item of picks){
  if(sourceIds.has(item.sourceId)||ids.has(item.id))throw Error('Duplicate source photo/closet garment cannot occupy outfit twice');
  sourceIds.add(item.sourceId);ids.add(item.id);
  if(item.slot==='accessory'){(bySlot.accessories??=[]).push(item);continue;}
  if(bySlot[item.slot])throw Error('Only one item in the same initial 3D outfit slot; use swap');
  bySlot[item.slot]=item;
 }
 if(bySlot.dress&&(bySlot.pants||bySlot.shirt))
  throw Error('One-piece dress hides shirt/pants; user must swap or choose a layered outfit');
 return Object.freeze({ownerId,items:Object.freeze(picks),slots:Object.freeze(bySlot),
  threeDReady:picks.length>0&&picks.every(i=>i.threeDimensionalMeshApproved),
  fallback:picks.some(i=>!i.threeDimensionalMeshApproved)?'original-camera-photo-or-2d':'none',
  categoryVerified:true,sourcePhotoIdentityPreserved:true,releaseAuthorized:false});
}
export function swapIndexedOutfitItem(outfit,oldId,replacement){
 if(!outfit?.categoryVerified||!outfit.ownerId)throw Error('Validated indexed outfit required');
 if(!outfit.items.some(i=>i.id===oldId))throw Error('Replace an item actually in this outfit');
 return arrangeIndexedOutfit([...outfit.items.filter(i=>i.id!==oldId),replacement],{ownerId:outfit.ownerId});
}
