/** P167 isolated app-build copy of proven research/wardrobe-index-01/owner-wardrobe-index.mjs. No deployment or release. */
/**
 * INDEX-01 — private, source-honest wardrobe metadata index.
 * Research-only, no persistence/telemetry/third-party requests.
 *
 * This indexes the user's SAVED decisions. It is not an image classifier.
 * Never infer unseen garment details, promote AI suggestions, or touch
 * original JPEGs. Keep every ambiguous garment in a visible review bucket.
 */
import {localCandidates} from './local-catalog.mjs';

export const INDEX01_CATEGORIES=Object.freeze([
 'Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories','Uncategorized'
]);
export const INDEX01_SLOTS=Object.freeze([
 'top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish'
]);
const typeMap=new Map(INDEX01_CATEGORIES.map(c=>[c,new Set(['Other'])]));
for(const x of localCandidates)if(x.category!=='Uncategorized')typeMap.get(x.category)?.add(x.itemType);
const seasons=new Set(['Spring','Summer','Fall','Winter','All seasons']);
const validSHA=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const safeText=(v,max=120)=>typeof v==='string'&&!v.startsWith('data:')?v.slice(0,max).trim():'';
const canonical=s=>safeText(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const tokens=s=>canonical(s).split(/[^a-z0-9]+/).filter(Boolean);
const allowedOwner=s=>typeof s==='string'&&s.trim().length>0&&s.length<=240;
const unique=x=>[...new Set(x)];
export class WardrobeIndexError extends Error{constructor(code){super('INDEX-01 '+code);this.name='WardrobeIndexError';this.code=code;}}
function ownerCheck(owner,record){
 if(!allowedOwner(owner))throw new WardrobeIndexError('owner-required');
 if(!record||typeof record!=='object'||Array.isArray(record))throw new WardrobeIndexError('invalid-record');
 for(const k of ['ownerId','userId','accountId'])
  if(record[k]!==undefined&&record[k]!==owner)throw new WardrobeIndexError('cross-owner-record');
}
function identity(record){
 const source=record.sourceSHA256||record.originalPhoto?.sha256||record.originalPhotoSHA256||'';
 const cutout=record.cutoutSHA256||record.segmentHint?.cutoutSHA256||'';
 const single=record.singleGarmentVerified===true;
 if(record.sourceHashVerified!==true||!validSHA(source))return {source:null,cutout:null,kind:'unverified'};
 if(validSHA(cutout))return {source,cutout,kind:'verified-cutout'};
 if(single)return {source,cutout:null,kind:'verified-single'};
 return {source,cutout:null,kind:'ambiguous-source'};
}
function slotsFor(category,type){
 if(category==='Tops')return ['top','layer'];
 if(category==='Bottoms')return ['bottom'];
 if(category==='Dresses')return ['top'];
 if(category==='Shoes')return ['shoes'];
 if(category==='Outerwear')return type==='Unknown'?[]:['layer','layer2','layer3'];
 if(category==='Accessories'){
  if(type==='Bag')return ['bag'];
  if(['Jewelry','Sunglasses'].includes(type))return ['accessory'];
  if(['Belt','Hat','Scarf'].includes(type))return ['finish'];
 }
 return [];
}
function normalizedRow(owner,record,position){
 ownerCheck(owner,record);
 const id=safeText(record.id,200);
 if(!id)throw new WardrobeIndexError('missing-id');
 const category=INDEX01_CATEGORIES.includes(record.category)?record.category:'Uncategorized';
 const typeValid=typeMap.get(category)?.has(record.itemType);
 const itemType=typeValid?record.itemType:'Unknown';
 const color=safeText(record.color,80);
 const reasons=[];
 if(category==='Uncategorized')reasons.push('category-unconfirmed');
 if(itemType==='Unknown')reasons.push(typeValid?'type-unconfirmed':record.itemType&&record.itemType!=='Unknown'?'type-category-conflict':'type-unconfirmed');
 if(!color||canonical(color)==='unknown')reasons.push('color-unconfirmed');
 if(record.colorSource==='photo-estimate')reasons.push('color-estimate-needs-confirmation');
 if(record.possibleDuplicate)reasons.push('possible-duplicate');
 if(record.requiresOwnershipConfirmation)reasons.push('ownership-unconfirmed');
 if(record.segmentHint?.clipped)reasons.push('clipped-source');
 const photo=identity(record);
 if(photo.kind==='ambiguous-source')reasons.push('shared-source-needs-cutout-proof');
 const validSeasons=Array.isArray(record.seasons)?unique(record.seasons.filter(s=>seasons.has(s))):[];
 const normalizedSeasons=validSeasons.includes('All seasons')?['All seasons']:validSeasons;
 const fields=[record.name,color,category,itemType,record.pattern,record.sleeveLength,
  record.fit,record.material,record.brand,record.size,record.occasion,record.notes,...normalizedSeasons];
 const text=fields.flatMap(x=>tokens(safeText(x,500)));
 return Object.freeze({
  id,position,category,itemType,color:color&&canonical(color)!=='unknown'?color:'Unknown',
  seasons:Object.freeze(normalizedSeasons),sleeveLength:safeText(record.sleeveLength)||'Unknown',
  slotIds:Object.freeze(slotsFor(category,itemType)),
  searchTokens:Object.freeze(unique(text)),
  reviewReasons:Object.freeze(unique(reasons)),
  source:photo.source,cutout:photo.cutout,sourceKind:photo.kind
 });
}
function sameIdentity(a,b){
 if(!a.source||a.source!==b.source)return 'none';
 if(a.sourceKind==='verified-cutout'&&b.sourceKind==='verified-cutout')
  return a.cutout===b.cutout?'duplicate':'different-segments';
 if(a.sourceKind==='verified-single'&&b.sourceKind==='verified-single')return 'duplicate';
 return 'ambiguous';
}
/** A failed rebuild NEVER mutates a valid previous index or saved records. */
export function buildOwnerWardrobeIndex(ownerId,savedItems){
 if(!allowedOwner(ownerId))throw new WardrobeIndexError('owner-required');
 if(!Array.isArray(savedItems))throw new WardrobeIndexError('snapshot-required');
 const entries=[],ids=new Set(),sourcePairs=[];
 for(const record of savedItems){
  const row=normalizedRow(ownerId,record,entries.length);
  if(ids.has(row.id))throw new WardrobeIndexError('duplicate-item-id');
  ids.add(row.id);
  for(const prior of entries){
   const collision=sameIdentity(row,prior);
   if(collision==='duplicate'||collision==='ambiguous')
    sourcePairs.push(Object.freeze({ids:Object.freeze([prior.id,row.id]),status:collision}));
  }
  entries.push(row);
 }
 const counts=Object.fromEntries(INDEX01_CATEGORIES.map(c=>[c,0]));
 let review=0,ready=0;
 for(const row of entries){counts[row.category]++;if(row.reviewReasons.length)review++;else ready++;}
 return Object.freeze({
  version:1,ownerId,
  entries:Object.freeze(entries),
  summary:Object.freeze({total:entries.length,ready,review,
   byCategory:Object.freeze(counts),
   sourcePairs:Object.freeze(sourcePairs)})
 });
}
/** Requires the authenticated owner on EVERY access; never accepts arbitrary
 * IDs or data from another account. Only metadata identifiers are returned.
 */
export function queryOwnerWardrobeIndex(index,ownerId,filters={}){
 if(!index||index.version!==1||!allowedOwner(ownerId)||ownerId!==index.ownerId)
  throw new WardrobeIndexError('owner-mismatch');
 if(!filters||typeof filters!=='object'||Array.isArray(filters))
  throw new WardrobeIndexError('invalid-query');
 const cat=safeText(filters.category),type=safeText(filters.itemType),color=canonical(filters.color);
 const season=safeText(filters.season),sleeve=safeText(filters.sleeveLength),slot=safeText(filters.slot);
 const search=tokens(safeText(filters.search,200));
 const review=filters.review;
 if(cat&&!INDEX01_CATEGORIES.includes(cat))throw new WardrobeIndexError('invalid-category');
 if(slot&&!INDEX01_SLOTS.includes(slot))throw new WardrobeIndexError('invalid-slot');
 const all=index.entries.filter(row=>(!cat||row.category===cat)&&(!type||row.itemType===type)&&
  (!color||canonical(row.color)===color)&&(!season||row.seasons.includes('All seasons')||row.seasons.includes(season))&&
  (!sleeve||row.sleeveLength===sleeve)&&(!slot||row.slotIds.includes(slot))&&
  (review===undefined||Boolean(row.reviewReasons.length)===Boolean(review))&&
  search.every(t=>row.searchTokens.some(w=>w.includes(t))));
 const offset=Number.isInteger(filters.offset)&&filters.offset>=0?filters.offset:0;
 const limit=Number.isInteger(filters.limit)&&filters.limit>=1?Math.min(200,filters.limit):60;
 const facets={categories:{},types:{},colors:{}};
 for(const row of all){
  facets.categories[row.category]=(facets.categories[row.category]||0)+1;
  facets.types[row.itemType]=(facets.types[row.itemType]||0)+1;
  facets.colors[row.color]=(facets.colors[row.color]||0)+1;
 }
 return Object.freeze({
  total:all.length,ids:Object.freeze(all.slice(offset,offset+limit).map(x=>x.id)),
  facets:Object.freeze({categories:Object.freeze(facets.categories),types:Object.freeze(facets.types),
   colors:Object.freeze(facets.colors)}),offset,limit
 });
}
/** Exact original-source de-dupe is allowed ONLY with approved source
 * identity proof. Shared outfit photos with different cutouts remain separate.
 * Ambiguous common-source photographs require manual review, not deletion.
 */
export function previewOwnerWardrobeAddition(index,ownerId,candidate){
 if(!index||index.version!==1||ownerId!==index.ownerId||!allowedOwner(ownerId))
  throw new WardrobeIndexError('owner-mismatch');
 const row=normalizedRow(ownerId,candidate,index.entries.length);
 if(index.entries.some(x=>x.id===row.id))
  return Object.freeze({status:'reject',reason:'duplicate-item-id'});
 let ambiguous=false;
 for(const previous of index.entries){
  const match=sameIdentity(previous,row);
  if(match==='duplicate')return Object.freeze({status:'reject',reason:'verified-source-and-segment-duplicate',existingId:previous.id});
  if(match==='ambiguous')ambiguous=true;
 }
 if(ambiguous||row.reviewReasons.includes('possible-duplicate'))
  return Object.freeze({status:'review',reason:'potential-same-source-ambiguous'});
 if(row.reviewReasons.includes('ownership-unconfirmed'))
  return Object.freeze({status:'review',reason:'ownership-unconfirmed'});
 return Object.freeze({status:'allow',reason:'no-proven-duplicate'});
}
/** Owner-aware bridge for the current app's authenticated readAll() snapshot.
 * It never writes database records or sends image/text to an external service.
 */
export function createOwnerWardrobeBridge({authenticatedOwner,readSavedItems}={}){
 if(typeof authenticatedOwner!=='function'||typeof readSavedItems!=='function')
  throw new WardrobeIndexError('invalid-bridge');
 let snapshot=null;
 return Object.freeze({
  async refresh(){
   const owner=authenticatedOwner();
   if(!allowedOwner(owner)){snapshot=null;throw new WardrobeIndexError('owner-required');}
   const records=await readSavedItems();
   if(authenticatedOwner()!==owner){snapshot=null;throw new WardrobeIndexError('owner-changed-during-read');}
   snapshot=buildOwnerWardrobeIndex(owner,records);
   return snapshot.summary;
  },
  browse(filters){const owner=authenticatedOwner();if(!snapshot||owner!==snapshot.ownerId)throw new WardrobeIndexError('refresh-required');return queryOwnerWardrobeIndex(snapshot,owner,filters);},
  preview(candidate){const owner=authenticatedOwner();if(!snapshot||owner!==snapshot.ownerId)throw new WardrobeIndexError('refresh-required');return previewOwnerWardrobeAddition(snapshot,owner,candidate);},
  clear(){snapshot=null;}
 });
}
