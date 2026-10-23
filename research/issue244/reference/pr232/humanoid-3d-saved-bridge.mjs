/**
 * Read-only adapter for the existing saved Outfit Builder board schema.
 * Research only: call AFTER Auth + owner-specific IndexedDB checks. Never
 * fetch cloud data here, save photographs, or create third-party requests.
 * Placeholder 3D colors are NOT measured fabric color/geometry.
 */
const SLOT_CATEGORY={top:['Tops','Dresses'],bottom:['Bottoms'],shoes:['Shoes'],layer:['Tops','Outerwear'],layer2:['Outerwear'],layer3:['Outerwear']};
const COLORS={black:'#25232a',white:'#eeeeea',blue:'#4368a0',navy:'#1c3159',red:'#b94350',green:'#46816b',olive:'#73774d',tan:'#aa8a65',beige:'#b5a28c',cream:'#e8d8c0',brown:'#765039',gray:'#777b80',grey:'#777b80',pink:'#ca84a7',purple:'#7b5b9e',yellow:'#daba57',orange:'#d68348'};
const layerKeys=Object.keys(SLOT_CATEGORY);
const hex=source=>{
 const value=String(source||'').trim().toLowerCase();
 const match=/^#[0-9a-f]{6}$/.test(value)?value:COLORS[value];
 return match||null;
};
function rasterDataUri(value){
 const match=typeof value==='string'&&value.length<14_000_000?value.match(/^data:image\/(png|jpeg|webp);base64,([a-z0-9+/]+={0,2})$/i):null;
 if(!match)return false;
 let bytes;
 try{bytes=atob(match[2]);}catch{return false;}
 if(bytes.length<80)return false;
 const byte=i=>bytes.charCodeAt(i),u32=i=>((byte(i)*0x1000000)+(byte(i+1)<<16)+(byte(i+2)<<8)+byte(i+3))>>>0;
 const dims=(w,h)=>w>=24&&h>=24&&w<=8192&&h<=8192&&w*h<=24_000_000;
 if(match[1].toLowerCase()==='png'){
  return bytes.slice(0,8)==='\x89PNG\r\n\x1a\n'&&
   bytes.slice(12,16)==='IHDR'&&dims(u32(16),u32(20))&&bytes.slice(-8,-4)==='IEND';
 }
 if(match[1].toLowerCase()==='jpeg'){
  if(byte(0)!==255||byte(1)!==216||byte(bytes.length-2)!==255||byte(bytes.length-1)!==217)return false;
  for(let p=2,n=0;n<1024&&p+10<bytes.length;n++){
   if(byte(p++)!==255)return false;
   while(byte(p)===255&&p<bytes.length)p++;
   const marker=byte(p++);if(marker===218)break;
   const len=byte(p)*256+byte(p+1);if(len<2||p+len>bytes.length)return false;
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))
    return dims(byte(p+5)*256+byte(p+6),byte(p+3)*256+byte(p+4));
   p+=len;
  }
  return false;
 }
 if(bytes.slice(0,4)!=='RIFF'||bytes.slice(8,12)!=='WEBP')return false;
 const size=byte(4)+(byte(5)<<8)+(byte(6)<<16)+byte(7)*0x1000000;
 if(size+8!==bytes.length)return false;
 // The browser must still decode and assess blur/blankness. Do not infer
 // texture authenticity or segmentation quality from container headers.
 return ['VP8 ','VP8L','VP8X'].includes(bytes.slice(12,16));
}
function hash(value){
 // Non-cryptographic stale-source fingerprint, NOT a privacy/auth guarantee.
 let n=2166136261;
 for(let i=0;i<value.length;i++){n^=value.charCodeAt(i);n=Math.imul(n,16777619);}
 return (n>>>0).toString(16).padStart(8,'0');
}
function owner(value,accountId){
 return value&&typeof value==='object'&&(value.ownerId===accountId||value.accountId===accountId||value.owner_id===accountId);
}
const validSlot=(key,item)=>{
 if(!SLOT_CATEGORY[key].includes(item.category))return false;
 if(key==='layer2'&&!['Jacket','Blazer','Raincoat','Coat'].includes(item.itemType))return false;
 if(key==='layer3'&&!['Coat','Raincoat'].includes(item.itemType))return false;
 if(key==='layer'&&item.category==='Outerwear'&&!['Cardigan','Vest'].includes(item.itemType))return false;
 return true;
};
export function prepareWardrobeFor3D(wardrobe,accountId){
 if(typeof accountId!=='string'||!accountId.trim())throw new TypeError('Account scope required');
 if(!Array.isArray(wardrobe))throw new TypeError('Wardrobe array required');
 const indexed=new Map(),duplicates=new Set();
 for(const item of wardrobe){
  if(!item||typeof item.id!=='string'||!item.id)continue;
  if(indexed.has(item.id))duplicates.add(item.id);
  else indexed.set(item.id,item);
 }
 const accepted=new Map();
 for(const [id,item] of indexed){
  if(duplicates.has(id)||!owner(item,accountId))continue;
  const source=item.originalPhoto;
  if(!source||!owner(source,accountId)||!rasterDataUri(source.image))continue;
  if(item.recognitionPhoto&&((item.recognitionPhoto.ownerId!==undefined||item.recognitionPhoto.accountId!==undefined||item.recognitionPhoto.owner_id!==undefined)&&!owner(item.recognitionPhoto,accountId)))continue;
  if(item.scanFailed||source.blank===true||source.invalid===true||item.invalidPhoto===true)continue;
  const color=hex(item.colorHex||item.color);
  if(!color)continue;
  const sourceId=source.id||item.originalPhotoId;
  const cropIdentity=item.cropIdentity||item.recognitionPhoto?.id||item.id;
  if(typeof sourceId!=='string'||!sourceId||typeof cropIdentity!=='string'||!cropIdentity)continue;
  const signature=hash([accountId,id,sourceId,cropIdentity,source.image,item.category,item.itemType,item.color,item.colorHex,item.pattern].join('|'));
  accepted.set(id,{id,category:item.category,itemType:item.itemType,colorHex:color,pattern:String(item.pattern||'Unknown'),sourceId,cropIdentity,signature,
   originalPhoto:source.image,name:String(item.name||item.itemType||item.category).slice(0,70)});
 }
 return accepted;
}
export function bridgeSavedOutfit(board,wardrobe,accountId){
 if(!board||typeof board!=='object'||!board.slots||typeof board.slots!=='object')throw new TypeError('Saved outfit board required');
 if((board.ownerId&&board.ownerId!==accountId)||(board.accountId&&board.accountId!==accountId))throw new Error('Foreign saved board');
 const closet=prepareWardrobeFor3D(wardrobe,accountId),usedGarments=new Set(),usedSources=new Set(),selected={};
 for(const slot of layerKeys){
  const id=board.slots[slot];if(id===undefined||id===null||id==='')continue;
  if(typeof id!=='string'||usedGarments.has(id))throw new Error('Duplicate or invalid selected garment');
  const item=closet.get(id);
  if(!item||!validSlot(slot,item))throw new Error('Unknown, foreign, invalid or incompatible original garment');
  const sourceKey=item.sourceId+'|'+item.cropIdentity;
  if(usedSources.has(sourceKey))throw new Error('Duplicate source and crop identity');
  usedSources.add(sourceKey);usedGarments.add(id);selected[slot]=item;
 }
 if(selected.top?.category==='Dresses'&&['bottom','layer','layer2','layer3'].some(x=>selected[x]))throw new Error('Dresses exclude lower and outer slots in this prototype');
 // These remain source-true references and are NEVER uploaded to WebGL. The
 // 3D proxy uses only solid metadata color, not reconstructed garment pixels.
 const colors={},references={},signatures={};
 for(const [slot,item] of Object.entries(selected)){
  const rgba=[1,3,5].map(n=>parseInt(item.colorHex.slice(n,n+2),16)/255).concat(1);
  colors[item.category==='Dresses'?'dress':slot]=rgba;
  references[slot]={id:item.id,originalPhoto:item.originalPhoto,originalPhotoId:item.sourceId,
   cropIdentity:item.cropIdentity,pattern:item.pattern,name:item.name,colorHex:item.colorHex};
  signatures[slot]=item.signature;
 }
 return {colors,references,signatures,slots:Object.fromEntries(Object.entries(selected).map(([key,value])=>[key,value.id])),
  accountId,syntheticGeometryOnly:true,originalPixelsRenderedAs3D:false};
}
export function recommendOwnedOutfits(wardrobe,accountId,{pinId=null,limit=3}={}){
 if(!Number.isInteger(limit)||limit<1||limit>3)throw new RangeError('At most three outfits');
 const closet=prepareWardrobeFor3D(wardrobe,accountId);
 if(pinId!==null&&!closet.has(pinId))return [];
 const tops=[...closet.values()].filter(x=>['Tops','Dresses'].includes(x.category));
 const bottoms=[...closet.values()].filter(x=>x.category==='Bottoms');
 const shoes=[...closet.values()].filter(x=>x.category==='Shoes');
 const jackets=[...closet.values()].filter(x=>x.category==='Outerwear'&&['Jacket','Blazer'].includes(x.itemType));
 const results=[],seen=new Set();
 for(const top of tops)for(const bottom of top.category==='Dresses'?[null]:bottoms)for(const shoe of shoes){
  const extras=[null,...jackets].filter(x=>top.category!=='Dresses'||!x);
  for(const extra of extras){
   const slots={top:top.id,shoes:shoe.id};
   if(bottom)slots.bottom=bottom.id;
   if(extra)slots.layer2=extra.id;
   if(pinId&&!Object.values(slots).includes(pinId))continue;
   const identity=Object.values(slots).join('|');if(seen.has(identity))continue;
   try{
    bridgeSavedOutfit({slots},wardrobe,accountId);
    seen.add(identity);results.push({name:'Owned combination '+(results.length+1),slots,pinnedId:pinId,ownerId:accountId});
   }catch{continue;}
   if(results.length===limit)return results;
  }
 }
 return results;
}
export function swapOwnedGarment(board,slot,nextId,wardrobe,accountId,{pinnedId=null}={}){
 if(!layerKeys.includes(slot))throw new TypeError('Unknown slot');
 if(typeof nextId!=='string'||!nextId)throw new TypeError('Owned garment required');
 if(pinnedId&&board?.slots?.[slot]===pinnedId&&nextId!==pinnedId)throw new Error('Cannot replace pinned garment');
 const next={...board,slots:{...board.slots,[slot]:nextId}};
 bridgeSavedOutfit(next,wardrobe,accountId);return next;
}
export function snapshotOwnedOutfit(board,wardrobe,accountId){
 const view=bridgeSavedOutfit(board,wardrobe,accountId);
 return {ownerId:accountId,name:String(board.name||'Saved outfit').slice(0,80),slots:{...view.slots},signatures:{...view.signatures}};
}
export function restoreOwnedOutfit(snapshot,wardrobe,accountId){
 if(!owner(snapshot,accountId))throw new Error('Foreign outfit snapshot');
 const restored=bridgeSavedOutfit(snapshot,wardrobe,accountId);
 for(const [slot,signature]of Object.entries(restored.signatures))
  if(snapshot.signatures?.[slot]!==signature)throw new Error('Original garment or metadata changed since save');
 return restored;
}
