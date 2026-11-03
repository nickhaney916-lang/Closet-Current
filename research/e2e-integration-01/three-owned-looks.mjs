/**
 * E2E-INTEGRATION-01: 3 honest owned outfit suggestions for the PR #541
 * actual private owner controller. No invented items, source bytes, auto-save
 * or 3D certification. Caller must provide an authenticated, refreshed
 * controller; its available(slot) excludes unconfirmed photos.
 */
const MAX_PER_SLOT=16;
const SLOTS=['top','bottom','shoes','layer2','layer3','bag','accessory','finish'];
const normalize=rows=>{
 if(!Array.isArray(rows))throw Error('Authenticated wardrobe candidates required');
 const seen=new Set();
 return rows.filter(x=>typeof x?.id==='string'&&x.id&&
  typeof x.category==='string'&&typeof x.itemType==='string')
  .filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true;})
  .sort((a,b)=>a.id.localeCompare(b.id)).slice(0,MAX_PER_SLOT);
};
function options(control,slot){
 return normalize(control.available(slot));
}
const signature=slots=>Object.entries(slots).sort(([a],[b])=>a.localeCompare(b))
 .map(([s,id])=>s+':'+id).join('|');
function valid(slots,pinned){
 if(!slots.top||!slots.shoes||!Object.values(slots).includes(pinned))return false;
 if(new Set(Object.values(slots)).size!==Object.values(slots).length)return false;
 if(slots.topCategory==='Dresses'&&slots.bottom)return false;
 return true;
}
export function suggestThreeOwnedOutfits(control,{pinnedId}={}){
 if(!control||typeof control.available!=='function'||typeof control.plan!=='function')
  throw Error('Original authenticated owner 3D controller required');
 const lease=control.checkCurrentSession();
 if(!lease?.authenticated||!lease.ownerId)throw Error('Private authenticated owner required');
 const saved=control.plan();
 if(saved.ownerId!==lease.ownerId||saved.generation!==lease.generation)
  throw Error('Changed owner while preparing suggestions');
 const pool=Object.fromEntries(SLOTS.map(s=>[s,options(control,s)]));
 const pinnedSlots=SLOTS.filter(s=>pool[s].some(x=>x.id===pinnedId));
 if(!pinnedId||!pinnedSlots.length)return Object.freeze({
  status:'review-or-missing',reason:'Selected item is not a verified owned garment in an eligible outfit slot',
  combinations:Object.freeze([]),ownerId:lease.ownerId,pinnedId:pinnedId||null
 });
 const combos=[],seen=new Set();
 const tops=pool.top;
 // Require one genuine owned top/dress AND one genuine owned shoe for an
 // independently recognizable full look. A separate lower body is required
 // for any non-dress top, not fabricated out of the mannequin.
 for(const top of tops){
  const dress=top.category==='Dresses';
  const bottoms=dress?[null]:pool.bottom;
  if(!bottoms.length)continue;
  for(const bottom of bottoms)for(const shoe of pool.shoes){
   const layers=[null,...pool.layer2];
   for(const layer of layers){
    const slots={top:top.id,shoes:shoe.id};
    if(bottom)slots.bottom=bottom.id;
    if(layer)slots.layer2=layer.id;
    if(!valid({...slots,topCategory:top.category},pinnedId))continue;
    const key=signature(slots);
    if(seen.has(key))continue;
    seen.add(key);
    combos.push(Object.freeze({name:'Owned outfit '+(combos.length+1),
     slots:Object.freeze(slots),pinnedId,onePieceDress:dress,
     originalPhotoFallbackRequired:true,meshCertified:false,
     accountOwner:lease.ownerId}));
    if(combos.length>=3)break;
   }
   if(combos.length>=3)break;
  }
  if(combos.length>=3)break;
 }
 // Some owned categories (accessories/coat) can be explicitly selected;
 // no shortcut can insert a not-owned garment or grant mesh approval.
 if(combos.length<3)return Object.freeze({status:'insufficient-owned-combinations',
  reason:'Fewer than three distinct compatible owned outfits contain the selected garment',
  candidateCount:combos.length,ownerId:lease.ownerId,pinnedId,
  combinations:Object.freeze(combos)});
 return Object.freeze({status:'three-owned-outfits',ownerId:lease.ownerId,
  pinnedId,combinations:Object.freeze(combos)});
}
export async function applyOwnedCombination(control,proposal){
 if(!proposal||!proposal.slots||typeof control.setSlot!=='function'||
  typeof control.clearSelection!=='function')
  throw Error('Original owner controller and owned proposal required');
 const lease=control.checkCurrentSession();
 if(lease.ownerId!==proposal.accountOwner)throw Error('Outfit belongs to another account');
 const available=new Map(SLOTS.map(slot=>[slot,new Set(control.available(slot).map(x=>x.id))]));
 for(const [slot,id]of Object.entries(proposal.slots))
  if(!available.get(slot)?.has(id))throw Error('Garment missing or reclassified; refresh first');
 if(!Object.values(proposal.slots).includes(proposal.pinnedId))
  throw Error('Pinned clothing item was substituted');
 const before=control.plan();
 // Only apply after all owner/eligibility checks succeeded. Save remains an
 // explicit user action in the already-existing outfit-board IDB mechanism.
 control.clearSelection();
 try{
  for(const slot of SLOTS)if(proposal.slots[slot])control.setSlot(slot,proposal.slots[slot]);
  const after=control.plan();
  if(!after.saveReady||after.ownerId!==lease.ownerId||
   after.generation!==lease.generation)
   throw Error('Owner or outfit validity changed while applying suggestion');
  return after;
 }catch(error){
  // Best effort to restore the original in-memory selection on failure.
  try{control.clearSelection();for(const slot of SLOTS)
   if(before.slots[slot])control.setSlot(slot,before.slots[slot]);}catch{}
  throw error;
 }
}
