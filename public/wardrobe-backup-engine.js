'use strict';
// File backups are additive recovery, never a replacement or authorization token.
(function(root){
 const MAX_FILE_BYTES=100*1024*1024;
 const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 function safe(value,depth=0){
  if(depth>40)throw Error('Backup is too deeply nested.');
  if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){
   if(['__proto__','prototype','constructor'].includes(k))throw Error('Backup contains an unsafe field.');
   safe(v,depth+1);
  }
 }
 function image(value,optional=false){
  if(optional&&value==='')return;
  const body=typeof value==='string'?value.slice(value.indexOf(',')+1):'';
  if(typeof value!=='string'||value.length>12_000_000||
   !/^data:image\/(?:jpeg|png|webp);base64,/.test(value)||!body||body.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(body))
   throw Error('Backup contains an invalid or incomplete photo.');
 }
 function images(value,out=new Set()){
  if(Array.isArray(value)){for(const x of value)images(x,out);}
  else if(plain(value))for(const [k,v]of Object.entries(value)){
   if(k==='image'){image(v,true);if(v)out.add(v);}else images(v,out);
  }
  return out;
 }
 function rows(values,limit,label,normalize){
  if(!Array.isArray(values)||values.length>limit)throw Error('Invalid '+label+' backup.');
  const ids=new Set();return values.map(x=>{
   if(!plain(x)||typeof x.id!=='string'||!x.id||x.id.length>100||ids.has(x.id))throw Error('Invalid or duplicate '+label+' ID.');
   ids.add(x.id);return normalize(x);
  });
 }
 function validate(data,owner,{normalizeItem,normalizeLook,cleanBoard}){
  safe(data);
  if(!plain(data)||data.format!=='closet-current'||![1,2,3,4].includes(data.version))throw Error('Choose a supported Closet Current backup.');
  if(!owner)throw Error('Sign in before restoring a backup.');
  if(data.version===4&&(typeof data.ownerId!=='string'||data.ownerId!==owner))throw Error('This backup belongs to another account. Sign in to the account that created it.');
  if(data.ownerId!==undefined&&data.ownerId!==owner)throw Error('This backup belongs to another account.');
  const items=rows(data.items,1000,'clothing',x=>{image(x.image);const item=normalizeItem(structuredClone(x));if(item.category!==x.category)throw Error('Backup contains an invalid clothing category.');return item;});
  const looks=rows(data.looks===undefined?[]:data.looks,100,'inspiration',x=>{if(x.image!==undefined)image(x.image,true);const look=normalizeLook(structuredClone(x));if(x.image&&look.image!==x.image)throw Error('An inspiration photo cannot be restored without losing detail. Nothing was restored.');return look;});
  function board(x){
   if(!plain(x)||!plain(x.slots)||x.ideas!==undefined&&!plain(x.ideas))throw Error('Invalid outfit backup.');
   const clean=cleanBoard(x,items),keys=Object.keys(x.slots);
   if(keys.length!==Object.keys(clean.slots).length||keys.some(k=>x.slots[k]!==clean.slots[k]))throw Error('An outfit refers to missing or incompatible clothing. Restore a complete backup.');
   if(Object.keys(x.ideas||{}).some(k=>!Object.hasOwn(clean.ideas,k)))throw Error('Invalid outfit idea.');
   return clean;
  }
  let outfitBoard=null;
  if(data.outfitBoard!==undefined){
   if(!plain(data.outfitBoard)||!Array.isArray(data.outfitBoard.saved)||data.outfitBoard.saved.length>50)throw Error('Invalid outfit backup.');
   outfitBoard={current:board(data.outfitBoard.current),saved:data.outfitBoard.saved.map(board)};
  }
  const result={items,looks,outfitBoard};images(result);return result;
 }
 const canonical=x=>{
  if(x===undefined)return 'undefined';
  if(x===null||typeof x!=='object')return JSON.stringify(x);
  if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
  return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
 };
 const content=x=>{const value={...x};delete value.id;return canonical(value);};
 function merge(local,incoming,{makeId,cleanBoard}){
  const remap=new Map();let copies=0;
  function addRows(existing,added,track=false){
   const out=structuredClone(existing),byId=new Map(out.map(x=>[x.id,x]));
   const byContent=new Map(out.map(x=>[content(x),x]));
   for(const source of added){
    const same=byContent.get(content(source));
    if(same){if(track)remap.set(source.id,same.id);continue;}
    const row=structuredClone(source);
    if(byId.has(row.id)){row.id=makeId();if(typeof row.id!=='string'||!row.id||byId.has(row.id)||row.id.length>100)throw Error('Could not allocate a safe restored copy.');copies++;}
    byId.set(row.id,row);byContent.set(content(row),row);out.push(row);if(track)remap.set(source.id,row.id);
   }
   return out;
  }
  const items=addRows(local.items,incoming.items,true),looks=addRows(local.looks,incoming.looks);
  const outfitBoard=structuredClone(local.outfitBoard);
  function mapped(board){const value=structuredClone(board);for(const [slot,id]of Object.entries(value.slots))value.slots[slot]=remap.get(id)||id;if(value.anchorItemId)value.anchorItemId=remap.get(value.anchorItemId)||value.anchorItemId;return cleanBoard(value,items);}
  const known=new Set(outfitBoard.saved.map(canonical));
  const save=board=>{const key=canonical(board);if(!known.has(key)){outfitBoard.saved.push(board);known.add(key);}};
  if(incoming.outfitBoard){
   for(const board of incoming.outfitBoard.saved)save(mapped(board));
   const current=mapped(incoming.outfitBoard.current),occupied=x=>Object.keys(x.slots||{}).length||Object.keys(x.ideas||{}).length;
   if(!occupied(outfitBoard.current))outfitBoard.current=current;
   else if(occupied(current)&&canonical(current)!==canonical(outfitBoard.current))save(current);
  }
  if(items.length>1000||looks.length>100||outfitBoard.saved.length>50)throw Error('Restoring would exceed your saved clothing, inspiration or outfit limit. Nothing was restored.');
  return {items,looks,outfitBoard,copies,added:items.length-local.items.length};
 }
 const api=Object.freeze({validate,merge,images,canonical,MAX_FILE_BYTES});root.ClosetWardrobeBackup=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
