/** Family Alpha #19 — isolated, source-bound "Style My New Clothes" candidate.
 * Reuses the REAL Closet Current stylist scoring, board slots and atomic swap.
 * Not connected to production navigation, Auth, staging or avatar display.
 */
import {swapOnePiece} from '../family-alpha-15/three-outfit-validator.mjs';

const visual=['top','bottom','shoes','layer2'];
const contexts={
 School:'Casual',Casual:'Casual','Casual date night':'Dinner',
 'Dressy dinner':'Dinner',Work:'Work',Activewear:'Active'
};
const ownerFields=['ownerId','owner_id','userId','user_id'];
const snapshotSource=item=>item?.originalPhoto?.image||item?.image||null;
const signature=slots=>visual.filter(k=>slots[k]).map(k=>k+':'+slots[k]).join('|');
const diffSlots=(a,b,pinned)=>visual.filter(k=>k!==pinned&&a[k]!==b[k]).length;
const err=message=>{throw Error(message);};
function identity(ctx){
 const owner=ctx?.authenticatedUserId||ctx?.userId;
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(owner||'')||
   ctx.currentUserId!==owner||ctx.cloudOwnerId!==owner||
   ctx.indexedDbName!=='closet-current-user-'+owner||
   !Number.isSafeInteger(ctx.sessionGeneration))err('Signed-in private wardrobe required');
 return {owner,epoch:ctx.sessionGeneration,db:ctx.indexedDbName};
}
function authorized(item,owner){
 return ownerFields.every(field=>item[field]===undefined||item[field]===owner);
}
function decodeJPEG(value){
 if(typeof value!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value))
  err('Retained JPEG required; never use an untrusted URL');
 const b64=value.slice('data:image/jpeg;base64,'.length);
 const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
 if(bytes.length<4||bytes.length>8388608||bytes[0]!==255||bytes[1]!==216||
    bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
  err('Invalid retained JPEG');
 return bytes;
}
async function hashPhoto(value,cryptoProvider){
 const buffer=await cryptoProvider.subtle.digest('SHA-256',decodeJPEG(value));
 return [...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function requiredPinSlot(item){
 return item.category==='Dresses'||item.category==='Tops'?'top':
 item.category==='Bottoms'?'bottom':
 item.category==='Shoes'?'shoes':
 item.category==='Outerwear'?'layer2':null;
}
function indexWardrobe(input,owner){
 if(!Array.isArray(input)||input.length>1000)err('Invalid saved wardrobe');
 const byId=new Map();
 for(const value of input){
  if(!value||typeof value.id!=='string'||!value.id||byId.has(value.id))err('Duplicate or missing clothing identity');
  if(!authorized(value,owner))err('Foreign wardrobe item');
  byId.set(value.id,value);
 }
 return byId;
}
function candidatePools(rows,context,scoreItem,pinId){
 const rank=(slot,category,includeDress=false)=>rows.filter(item=>
  (item.category===category||(includeDress&&item.category==='Dresses'))&&
  item.id!==pinId).map(item=>({item,score:scoreItem(item,slot==='layer2'?'layer':slot,context,null)}))
  .filter(x=>x.score!==null&&Number.isFinite(x.score))
  .sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id)).slice(0,8);
 return {top:rank('top','Tops',true),bottom:rank('bottom','Bottoms'),
  shoes:rank('shoes','Shoes'),layer2:rank('layer2','Outerwear')};
}
function verifyBoard(board,byId,pinId,pinSlot){
 const slots=board?.slots||{};
 if(slots[pinSlot]!==pinId)err('New garment pin was lost');
 if(!slots.top||!slots.shoes)err('Outfit missing a required owned garment');
 const top=byId.get(slots.top),dress=top?.category==='Dresses';
 if(!dress&&!slots.bottom)err('Outfit missing saved bottoms');
 if(dress&&(['bottom','layer','layer2','layer3'].some(k=>slots[k])))
  err('Dress outfit contains conflicting bottom or outer layer');
 const expected={top:['Tops','Dresses'],bottom:['Bottoms'],shoes:['Shoes'],layer2:['Outerwear']};
 const seen=new Set();
 for(const [slot,id]of Object.entries(slots)){
  if(!expected[slot]||!expected[slot].includes(byId.get(id)?.category)||seen.has(id))
   err('Invalid saved outfit slot or duplicate garment');
  seen.add(id);
 }
 if(Object.keys(board.ideas||{}).length)err('Shopping placeholders are not saved clothing');
}
export function diversityScore(a,b,pinSlot){
 return diffSlots(a.board.slots,b.board.slots,pinSlot);
}
export function createStyleMyNewClothes({readContext,readWardrobe,stylistItemScore,stylistHarmony,
 cleanOutfitBoard,cryptoProvider=globalThis.crypto}){
 if([readContext,readWardrobe,stylistItemScore,stylistHarmony,cleanOutfitBoard].some(f=>typeof f!=='function')||
    !cryptoProvider?.subtle?.digest)throw Error('Saved stylist/identity providers required');
 let ticket=0;
 function begin(){
  const id=++ticket,who=identity(readContext()),start=readWardrobe();
  const byId=indexWardrobe(start,who.owner);
  const originals=new Map([...byId].map(([k,v])=>[k,snapshotSource(v)]));
  function guard(){
   if(id!==ticket)err('Superseded new clothing recommendation');
   const now=identity(readContext());
   if(now.owner!==who.owner||now.epoch!==who.epoch||now.db!==who.db)err('Account changed during styling');
   const live=indexWardrobe(readWardrobe(),who.owner);
   if(live.size!==byId.size)err('Saved wardrobe changed during styling');
   for(const [key,old]of byId){
    const updated=live.get(key);
    if(!updated||snapshotSource(updated)!==originals.get(key)||
      updated.category!==old.category||updated.itemType!==old.itemType||
      updated.color!==old.color||updated.outfitSourceId!==old.outfitSourceId||
      JSON.stringify(updated.seasons||[])!==JSON.stringify(old.seasons||[]))
     err('Saved garment or original source changed during styling');
   }
  }
  return {id,who,byId,guard,originals};
 }
 return {
  invalidate(){ticket++;},
  async recommend({pinId,request='Casual',season='Fall',audience='All'}={}){
   const operation=begin(),{who,byId,guard,originals}=operation;
   const pin=byId.get(pinId);
   if(!pin)err('New item must exist in the saved wardrobe');
   const pinSlot=requiredPinSlot(pin);
   if(!pinSlot)err('New garment category cannot be styled');
   if(!(request in contexts)||!['Spring','Summer','Fall','Winter'].includes(season)||
       !['All','Women','Men'].includes(audience))err('Invalid outfit context');
   const ctx={request,season,audience,occasion:contexts[request]};
   const scorePin=stylistItemScore(pin,pinSlot==='layer2'?'layer':pinSlot,ctx,null);
   if(scorePin===null||!Number.isFinite(scorePin))
    return {pinId,ownerId:who.owner,options:[],reason:'New garment is not compatible with this occasion or season.',pinSlot};
   const rows=[...byId.values()].filter(item=>{try{return !!decodeJPEG(snapshotSource(item));}catch{return false;}});
   if(!rows.some(x=>x.id===pinId))err('New garment has no valid retained JPEG');
   const pools=candidatePools(rows,ctx,stylistItemScore,pinId);
   const asRank=x=>({item:x,score:stylistItemScore(x,x.category==='Outerwear'?'layer':pinSlot,ctx,null)});
   const candidates=[];
   const tops=pinSlot==='top'?[asRank(pin)]:pools.top;
   const bottoms=pinSlot==='bottom'?[asRank(pin)]:pools.bottom;
   const shoes=pinSlot==='shoes'?[asRank(pin)]:pools.shoes;
   const jackets=pinSlot==='layer2'?[asRank(pin),null]:[null,...pools.layer2.slice(0,2)];
   for(const top of tops)for(const bottom of top.item.category==='Dresses'?[null]:bottoms)
    for(const shoe of shoes)for(const jacket of jackets){
     if(!top||!shoe||(!bottom&&top.item.category!=='Dresses'))continue;
     if(jacket&&top.item.category==='Dresses')continue;
     if(pinSlot==='layer2'&&!jacket)continue;
     const slots={top:top.item.id,shoes:shoe.item.id};
     if(bottom)slots.bottom=bottom.item.id;
     if(jacket)slots.layer2=jacket.item.id;
     const selected=[top,bottom,shoe,jacket].filter(Boolean);
     if(new Set(selected.map(x=>x.item.id)).size!==selected.length)continue;
     let board=cleanOutfitBoard({slots,layerCount:jacket?2:0,
      occasion:ctx.occasion,season,audience,name:'Style my new clothes'},rows);
     try{verifyBoard(board,byId,pinId,pinSlot);}catch{continue;}
     const score=selected.reduce((n,x)=>n+x.score,0)+stylistHarmony(selected.map(x=>x.item));
     candidates.push({board,score,signature:signature(board.slots)});
    }
   candidates.sort((a,b)=>b.score-a.score||a.signature.localeCompare(b.signature));
   const chosen=[],minDifferences=pin.category==='Dresses'?1:2,seen=new Set();
   for(const candidate of candidates){
    if(seen.has(candidate.signature))continue;
    if(chosen.some(x=>diffSlots(x.board.slots,candidate.board.slots,pinSlot)<minDifferences))continue;
    seen.add(candidate.signature);chosen.push(candidate);if(chosen.length===3)break;
   }
   const versions=Object.create(null);
   for(const value of chosen)for(const id of Object.values(value.board.slots)){
    if(versions[id])continue;
    const item=byId.get(id),source=originals.get(id);
    versions[id]={sourceVersion:await hashPhoto(source,cryptoProvider),
     sourceIdentity:item.outfitSourceId||item.id,
     cropVersion:item.image?await hashPhoto(item.image,cryptoProvider):null,
     ownerId:who.owner};
    guard();
   }
   // Distinct saved IDs with byte-identical original photos are never allowed in one outfit.
   const valid=chosen.filter(entry=>{
    const hashes=Object.values(entry.board.slots).map(id=>versions[id].sourceVersion);
    return new Set(hashes).size===hashes.length;
   });
   guard();
   const options=valid.map(v=>({...v,missing:[],
    pinId,pinSlot,ownerId:who.owner,
    sources:Object.fromEntries(Object.values(v.board.slots).map(id=>[id,{...versions[id]}]))}));
   return {pinId,ownerId:who.owner,pinSlot,options,
    reason:options.length<3?'Only '+options.length+' meaningfully different complete outfit'+(options.length===1?'':'s')+' can be made for this new piece with your saved clothes.':null};
  },
  async verify(result){
   const op=begin(),{byId,guard,originals,who}=op;
   if(result?.ownerId!==who.owner||!Array.isArray(result?.options))err('Foreign recommendations');
   for(const look of result.options){
    verifyBoard(look.board,byId,result.pinId,result.pinSlot);
    for(const id of Object.values(look.board.slots)){
     const record=look.sources?.[id];
     if(record?.ownerId!==who.owner||record?.sourceIdentity!==(byId.get(id).outfitSourceId||id)||
        record?.sourceVersion!==await hashPhoto(originals.get(id),cryptoProvider)||
        record?.cropVersion!==(byId.get(id).image?await hashPhoto(byId.get(id).image,cryptoProvider):null))
       err('Photo source changed; regenerate outfits');
     guard();
    }
   }
   guard();return true;
  },
  async swap(result,lookIndex,slot,newItemId){
   await this.verify(result);
   const op=begin(),{byId,guard,who}=op;
   const previous=result.options?.[lookIndex];
   if(!previous||slot===result.pinSlot||newItemId===result.pinId)
    err('Pinned new clothing cannot be replaced or duplicated');
   const target=byId.get(newItemId);
   if(!target||!authorized(target,who.owner))err('Missing or foreign swap target');
   const candidate=swapOnePiece(previous.board,slot,newItemId,[...byId.values()],cleanOutfitBoard);
   const sources={...previous.sources,[newItemId]:{
    ownerId:who.owner,sourceIdentity:target.outfitSourceId||target.id,
    sourceVersion:await hashPhoto(snapshotSource(target),cryptoProvider),
    cropVersion:target.image?await hashPhoto(target.image,cryptoProvider):null
   }};
   guard();
   verifyBoard(candidate,byId,result.pinId,result.pinSlot);
   for(const id of Object.values(candidate.slots))if(sources[id]===undefined)
    err('Swap lost source ownership');
   const hashes=Object.values(candidate.slots).map(id=>sources[id].sourceVersion);
   if(new Set(hashes).size!==hashes.length)err('Duplicate retained photo in outfit');
   const updated={...previous,board:candidate,signature:signature(candidate.slots),
    sources:Object.fromEntries(Object.values(candidate.slots).map(id=>[id,sources[id]]))};
   guard();
   const options=result.options.map((v,i)=>i===lookIndex?updated:v);
   return {...result,options};
  }
 };
}
