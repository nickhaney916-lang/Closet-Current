/**
 * STYLE-OWNED-LIVE-03 — native adaptation of PR #547
 * research/e2e-integration-01/three-owned-looks.mjs.
 * Exhaustive owner IDs + distinctive look signature + honest insufficiency,
 * but not the PR541 standalone controller or an alternative save database.
 *
 * Input is an ALREADY owner- and SHA-verified PRIVATE wardrobe projection.
 * No user images, identities, outbound calls or persistence in this pure module.
 */
export const STYLE_OWNED_03=Object.freeze({
 inheritedSource:'PR547 three-owned-looks owner-only combinations',
 featureGate:'styleOwned03=research',maxResults:3,productionAuthorized:false,
 familyAlpha:'HOLD',humanFitted3DClaim:false
});
const SLOTS=Object.freeze(['top','bottom','shoes','layer2','layer3']);
const SLOT_CATEGORIES=Object.freeze({
 top:['Tops','Dresses'],bottom:['Bottoms'],shoes:['Shoes'],
 layer2:['Outerwear'],layer3:['Outerwear']
});
const GOOD_ID=x=>typeof x==='string'&&x.length>0&&x.length<=160&&!/[\u0000-\u001f]/.test(x);
const SHA=/^[a-f0-9]{64}$/;
const unique=a=>new Set(a).size===a.length;
const complete=(s,byId)=>{
 if(!s.top||!s.shoes||!Object.values(s).every(id=>byId.has(id))||
    !unique(Object.values(s)))return false;
 const top=byId.get(s.top);
 return top?.category==='Dresses'
  ? !s.bottom&&!s.layer
  : top?.category==='Tops'&&!!s.bottom;
};
function fits(slot,row){
 if(!row||!SLOT_CATEGORIES[slot]?.includes(row.category))return false;
 if(slot==='layer2')return ['Jacket','Blazer','Vest','Cardigan'].includes(row.itemType);
 if(slot==='layer3')return ['Coat','Raincoat'].includes(row.itemType);
 return true;
}
function normalize(rows,ownerId){
 if(!GOOD_ID(ownerId)||!Array.isArray(rows)||rows.length>1000)
  throw Error('STYLE03 authenticated limited private wardrobe required');
 const uniqueIds=new Set(),out=[];
 for(const row of rows){
  if(!row||!GOOD_ID(row.id)||row.ownerId!==ownerId||uniqueIds.has(row.id))
   throw Error('STYLE03 missing, duplicate or cross-owner clothing ID');
  uniqueIds.add(row.id);
  if(row.sourceVerified!==true||!SHA.test(row.sourceSHA256||'')||
     row.categoryConfirmed!==true)continue;
  out.push(Object.freeze({
   id:row.id,ownerId,category:row.category,itemType:row.itemType,
   color:String(row.color||'Unknown').slice(0,60),
   occasion:String(row.occasion||'').slice(0,80),
   seasons:Array.isArray(row.seasons)?row.seasons.filter(x=>typeof x==='string').slice(0,6):[],
   sourceSHA256:row.sourceSHA256
  }));
 }
 return Object.freeze(out);
}
export function signature03(slots){
 return Object.entries(slots||{}).sort(([a],[b])=>a.localeCompare(b))
  .map(([slot,id])=>slot+':'+id).join('|');
}
export function eligibleSlot03(slot,row){return fits(slot,row);}
export function pinnedSlot03(row){
 if(!row)return null;
 if(row.category==='Dresses'||row.category==='Tops')return 'top';
 if(row.category==='Bottoms')return 'bottom';
 if(row.category==='Shoes')return 'shoes';
 if(row.category==='Outerwear'&&fits('layer2',row))return 'layer2';
 if(row.category==='Outerwear'&&fits('layer3',row))return 'layer3';
 return null;
}
function rankColor(a,b){
 const first=String(a.color||'').toLowerCase(),second=String(b.color||'').toLowerCase();
 if(!first||!second||first==='unknown'||second==='unknown')return 0;
 const basics=new Set(['black','white','cream','beige','gray','grey','navy','denim','blue','tan','brown']);
 if(first===second)return .5;
 if(basics.has(first)||basics.has(second))return 3;
 return 0;
}
function quality(slots,byId,occasion){
 const top=byId.get(slots.top),bottom=byId.get(slots.bottom),shoes=byId.get(slots.shoes);
 let value=rankColor(top,bottom||shoes)+rankColor(top,shoes);
 for(const id of Object.values(slots)){
  const row=byId.get(id),want=occasion.toLowerCase();
  if(row.occasion?.toLowerCase().includes(want))value+=2;
  if(want.includes('active')&&row.itemType==='Sneakers')value+=2;
  if(row.seasons?.length)value+=.1;
 }
 return value;
}
function difference(a,b,pinned){
 const as=a.slots,bs=b.slots;
 return SLOTS.filter(slot=>as[slot]!==bs[slot]&&as[slot]!==pinned&&bs[slot]!==pinned).length;
}
export function suggestThreeNativeOwned03(rows,{ownerId,pinnedId,occasion='Casual'}={}){
 const valid=normalize(rows,ownerId),byId=new Map(valid.map(r=>[r.id,r]));
 if(!GOOD_ID(pinnedId)||!byId.has(pinnedId)||!pinnedSlot03(byId.get(pinnedId)))
  return Object.freeze({status:'review-or-missing',
   reason:'Select one verified owned top, dress, pants, shoes or compatible outer layer.',
   pinnedId:pinnedId||null,combinations:Object.freeze([]),candidateCount:0,
   ownerId,releaseAuthorized:false});
 const pin=byId.get(pinnedId),slot=pinnedSlot03(pin);
 const options=Object.fromEntries(SLOTS.map(s=>[s,valid.filter(r=>fits(s,r))
  .sort((a,b)=>a.id.localeCompare(b.id)).slice(0,28)]));
 const all=[],seen=new Set();
 // Keep optional outerwear optional; one garment remains pinned even if the
 // wearer wants to change shoes, a bottom, or a separate compatible outer layer.
 for(const top of options.top){
  const bottoms=top.category==='Dresses'?[null]:options.bottom;
  for(const bottom of bottoms)for(const shoe of options.shoes){
   const layers=slot==='layer2'?[pin]:[null,...options.layer2];
   const coats=slot==='layer3'?[pin]:[null,...options.layer3];
   for(const layer of layers)for(const coat of coats){
    const s={top:top.id,shoes:shoe.id};
    if(bottom)s.bottom=bottom.id;
    if(layer)s.layer2=layer.id;
    if(coat)s.layer3=coat.id;
    if(s[slot]!==pinnedId||!complete(s,byId))continue;
    if(layer&&coat&&layer.id===coat.id)continue;
    const key=signature03(s);if(seen.has(key))continue;seen.add(key);
    all.push(Object.freeze({slots:Object.freeze(s),signature:key,
     score:quality(s,byId,occasion),pinnedId,onePieceDress:top.category==='Dresses',
     ownerId,sourcePhotoFallbackRequired:true,certified3D:false,
     sourceSHA256ById:Object.freeze(Object.fromEntries(Object.values(s)
       .map(id=>[id,byId.get(id).sourceSHA256])))}));
    if(all.length>=5000)break;
   }
   if(all.length>=5000)break;
  }
  if(all.length>=5000)break;
 }
 all.sort((a,b)=>b.score-a.score||a.signature.localeCompare(b.signature));
 const selected=[];
 while(selected.length<3&&all.length){
  let bestIndex=0,bestValue=-Infinity;
  for(let i=0;i<all.length;i++){
   const q=all[i];
   const minDifference=selected.length?Math.min(...selected.map(p=>difference(q,p,pinnedId))):3;
   const totalDifference=selected.reduce((sum,p)=>sum+difference(q,p,pinnedId),0);
   const value=minDifference*100+totalDifference*8+q.score;
   if(value>bestValue){bestValue=value;bestIndex=i;}
  }
  const current=all.splice(bestIndex,1)[0];
  selected.push(Object.freeze({...current,name:'Owned outfit '+(selected.length+1)}));
 }
 const shortage=selected.length<3;
 return Object.freeze({
  status:shortage?'insufficient-owned-combinations':'three-owned-outfits',
  reason:shortage?'Only '+selected.length+' compatible distinct owned outfit'+(selected.length===1?' exists':'s exist')+
   ' with the saved clothing currently available. Add real matching pieces or correct their categories.':
   'Three distinct combinations using only your own saved clothing.',
  ownerId,pinnedId,pinnedSlot:slot,candidateCount:selected.length,
  combinations:Object.freeze(selected),sourceIntegrityRequired:true,
  noAutomaticSave:true,releaseAuthorized:false});
}
export function validateOwnedSwap03(rows,{ownerId,pinnedId,slots,slot,itemId}={}){
 const valid=normalize(rows,ownerId),byId=new Map(valid.map(row=>[row.id,row]));
 if(!byId.has(pinnedId)||!pinnedSlot03(byId.get(pinnedId))||
    !SLOTS.includes(slot)||!GOOD_ID(itemId)||!fits(slot,byId.get(itemId))||
    !slots||typeof slots!=='object'||Object.keys(slots).some(s=>!SLOTS.includes(s)))
  throw Error('STYLE03 incompatible or non-owned swap');
 const pinned=pinnedSlot03(byId.get(pinnedId));
 if(slot===pinned||slots[pinned]!==pinnedId)
  throw Error('STYLE03 selected original clothing is pinned and cannot be swapped');
 const newSlots={...slots,[slot]:itemId};
 if(!complete(newSlots,byId))throw Error('STYLE03 incompatible dress/bottom or missing look');
 if(new Set(Object.values(newSlots)).size!==Object.values(newSlots).length)
  throw Error('STYLE03 repeated garment ID');
 return Object.freeze({slots:Object.freeze(newSlots),
  signature:signature03(newSlots),pinnedId,ownerId,
  sourceSHA256ById:Object.freeze(Object.fromEntries(Object.values(newSlots)
   .map(id=>[id,byId.get(id).sourceSHA256]))),
  releaseAuthorized:false});
}
