/**
 * Adapter for the isolated 3D prototype. Converts explicitly selected, validated
 * outfit garment metadata into placeholder color regions. No network or photo upload.
 * Actual original-photo textures and fit are NOT implemented.
 */
const VALID_CATEGORIES=new Set(['Tops','Bottoms','Shoes']);
function parseHex(hex){
  if(typeof hex!=='string')return null;
  const match=/^#([a-f\d]{6})$/i.exec(hex.trim());
  if(!match)return null;
  return [0,2,4].map(i=>parseInt(match[1].slice(i,i+2),16)/255).concat(1);
}
export function mapSavedOutfitToAvatar(outfit, accountId){
  if(typeof accountId!=='string'||!accountId.trim())throw new TypeError('Account scope required');
  if(!outfit||!Array.isArray(outfit.items))throw new TypeError('Saved outfit items required');
  const colors={};const sourceIds=new Set();
  for(const item of outfit.items){
    if(!item||item.accountId!==accountId)throw new Error('Foreign or missing account');
    if(typeof item.originalPhotoId!=='string'||!item.originalPhotoId.trim())throw new Error('Original photo identity required');
    if(sourceIds.has(item.originalPhotoId))throw new Error('Duplicate source identity');
    sourceIds.add(item.originalPhotoId);
    if(!VALID_CATEGORIES.has(item.category))continue;
    const rgba=parseHex(item.colorHex);
    if(!rgba)throw new Error('Invalid garment color');
    const key={Tops:'top',Bottoms:'bottom',Shoes:'shoes'}[item.category];
    if(colors[key])throw new Error('Multiple garments for avatar region require explicit layer handling');
    colors[key]=rgba;
  }
  return {colors,sourceIds:[...sourceIds],syntheticPlaceholderOnly:true};
}
