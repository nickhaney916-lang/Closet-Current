/**
 * Family Alpha #75: manual-only MULTI-garment fit transfer. No source pixels,
 * owner identifiers, image URLs, cloud, browser storage or automatic approval.
 * Every entry uses the existing strict Work47 exact-PNG fit recipe.
 */
import {createPortableFitRecipe,restorePortableFitRecipe} from '../work47/portable-fit.mjs';
export const FORMAT='closet-current-local-outfit-fit-pack-v1';
export const MAX_BYTES=42000;
const slots=['top','bottom','dress','layer2','layer3'];
const keys=(x,expected)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).sort().join('|')===[...expected].sort().join('|');
function checkedEntries(entries){
 if(!Array.isArray(entries)||entries.length<1||entries.length>4)
  throw Error('Outfit pack requires one to four reviewed fits');
 const unique=new Set();
 for(const row of entries){
  if(!keys(row,['slot','source','record'])||!slots.includes(row.slot)||
    unique.has(row.slot)||row.source?.slot!==row.slot||!row.record)
   throw Error('Duplicate, missing or unreviewed outfit item');
  unique.add(row.slot);
 }
 return entries;
}
export async function createOutfitFitPack(entries){
 checkedEntries(entries);
 const recipes=[];
 for(const row of entries)recipes.push(await createPortableFitRecipe(row.source,row.record));
 const pack={format:FORMAT,recipes,decision:'HOLD',
  ownerApproved:false,requiresReview:true,automaticallySaved:false};
 const json=JSON.stringify(pack,null,2)+'\n';
 if(json.length>MAX_BYTES)throw Error('Outfit pack too large');
 return json;
}
export async function restoreOutfitFitPack(entries,json){
 checkedEntries(entries);
 if(typeof json!=='string'||json.length>MAX_BYTES||json.length<150)
  throw Error('Private fit pack invalid');
 let pack;try{pack=JSON.parse(json);}catch{throw Error('Private fit pack invalid');}
 if(!keys(pack,['format','recipes','decision','ownerApproved','requiresReview','automaticallySaved'])||
    pack.format!==FORMAT||pack.decision!=='HOLD'||pack.ownerApproved!==false||
    pack.requiresReview!==true||pack.automaticallySaved!==false||
    !Array.isArray(pack.recipes)||pack.recipes.length!==entries.length)
  throw Error('Private fit pack invalid or unmatched');
 // The complete, current outfit inventory must match. No partial import.
 const bySlot=new Map();
 for(const recipe of pack.recipes){
  if(!recipe||!slots.includes(recipe.slot)||bySlot.has(recipe.slot))
   throw Error('Duplicate or unsupported outfit slot');
  bySlot.set(recipe.slot,recipe);
 }
 if(bySlot.size!==entries.length)throw Error('Outfit identity does not match');
 const results=[];
 for(const row of entries){
  const recipe=bySlot.get(row.slot);
  if(!recipe)throw Error('Missing reviewed outfit item');
  // Entire pack validates before any caller can mutate any preview.
  const restored=await restorePortableFitRecipe(row.source,JSON.stringify(recipe));
  results.push({slot:row.slot,record:row.record,restored});
 }
 return results;
}
