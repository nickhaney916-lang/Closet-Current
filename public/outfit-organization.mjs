import {migrateSavedOutfitIdentity} from './saved-outfit-identity.mjs';
const owns=(value,key)=>Object.hasOwn(value,key);
const opaque=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const plain=value=>value!==null&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype;
const invalid=()=>Error('Invalid saved outfit identity or organization data.');

export const outfitBackupVersion=5;
export const hasOutfitOrganization=board=>!!board&&owns(board,'organization');
export function emptyOutfitOrganization(){
 return {version:1,favoriteGarmentIds:[],favoriteOutfitIds:[],collections:[]};
}

export function validateOutfitOrganization(board,garmentIds,owner){
 if(!plain(board?.organization)||!Array.isArray(board.saved)||board.saved.length>50)
  throw invalid();
 const outfitIds=new Set();
 for(const outfit of board.saved){
  if(outfit?.savedOutfitOwnerId!==owner)throw invalid();
  if(!plain(outfit)||(typeof outfit.savedOutfitId!=='string'||!opaque.test(outfit.savedOutfitId))||outfitIds.has(outfit.savedOutfitId))
   throw invalid();
  outfitIds.add(outfit.savedOutfitId);
 }
 const refs=(list,ids)=>Array.isArray(list)&&list.length<=1000&&
  new Set(list).size===list.length&&list.every(id=>typeof id==='string'&&ids.has(id));
 const org=board.organization;
 const fields=['version','favoriteGarmentIds','favoriteOutfitIds','collections'];
 if(Object.keys(org).length!==fields.length||!fields.every(key=>owns(org,key))||
    org.version!==1||!refs(org.favoriteGarmentIds,garmentIds)||
    !refs(org.favoriteOutfitIds,outfitIds)||!Array.isArray(org.collections)||org.collections.length>100)
  throw invalid();
 const collectionIds=new Set();
 for(const row of org.collections){
  if(!plain(row)||Object.keys(row).length!==4||(typeof row.id!=='string'||!opaque.test(row.id))||collectionIds.has(row.id)||
     typeof row.name!=='string'||!row.name.trim()||row.name.length>80||
     !refs(row.garmentIds,garmentIds)||!refs(row.outfitIds,outfitIds))
   throw invalid();
  collectionIds.add(row.id);
 }
 return org;
}

export function migrateOutfitOrganization(board,owner){
 if(hasOutfitOrganization(board))return board;
 const {saved}=migrateSavedOutfitIdentity(board.saved,owner);
 return {...board,saved,organization:emptyOutfitOrganization()};
}
