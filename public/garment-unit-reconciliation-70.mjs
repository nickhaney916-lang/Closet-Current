// Parallel #70 (HOLD): evidence-only wardrobe-unit reconciliation.
// This module NEVER saves wardrobe items, authorizes ownership or guesses
// human labels. Pairing is a proposal requiring explicit owner action.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const round=x=>Math.round(x*1000000)/1000000;
const clean=x=>typeof x==='string'?x.trim():'';
const unknown=x=>!x||/^(unknown|unspecified|other|none)$/i.test(x);
const boxOf=piece=>{
 const b=piece?.cropBounds;
 if(!b||![b.x,b.y,b.width,b.height].every(finite)||b.x<0||b.y<0||b.width<=0||b.height<=0||
    b.x+b.width>1.000001||b.y+b.height>1.000001)return null;
 return {x:round(b.x),y:round(b.y),width:round(b.width),height:round(b.height)};
};
const area=b=>b.width*b.height;
function intersection(a,b){
 const w=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
 const h=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 return w*h;
}
function overlap(a,b){
 const inter=intersection(a,b);return inter/(area(a)+area(b)-inter)||0;
}
function reasonForPair(a,b){
 if(!a.bounds||!b.bounds)return 'missing_source_bounds';
 if(a.clipped||b.clipped)return 'clipped_component';
 if(a.instanceMethod!=='connected_footwear_component'||b.instanceMethod!=='connected_footwear_component')return 'unverified_component_method';
 if(overlap(a.bounds,b.bounds)>.1)return 'overlapping_regions';
 if(!unknown(a.subtype)&&!unknown(b.subtype)&&a.subtype.toLowerCase()!==b.subtype.toLowerCase())return 'conflicting_footwear_types';
 if(unknown(a.color)||unknown(b.color))return 'color_unverified';
 if(a.color.toLowerCase()!==b.color.toLowerCase())return 'conflicting_colors';
 const ratio=area(a.bounds)/area(b.bounds);
 if(ratio<.45||ratio>2.25)return 'unequal_component_sizes';
 const centerA=a.bounds.y+a.bounds.height/2,centerB=b.bounds.y+b.bounds.height/2;
 if(Math.abs(centerA-centerB)>.16)return 'misaligned_components';
 return null;
}
export function reconcileGarmentUnits70(pieces,{sourceId,originalSha256=null}={}){
 if(!Array.isArray(pieces)||pieces.length>64)throw Error('Invalid mask proposal collection.');
 if(!clean(sourceId)||clean(sourceId).length>160)throw Error('Source ID required.');
 if(originalSha256!==null&&!/^[a-f0-9]{64}$/i.test(originalSha256))throw Error('Invalid original source SHA-256.');
 const records=pieces.map((piece,index)=>{
  if(!piece||typeof piece!=='object')throw Error('Invalid proposal.');
  const bounds=boxOf(piece),hint=piece.hint||{},label=clean(piece.label);
  const category=Array.isArray(hint.categories)&&hint.categories.length===1?clean(hint.categories[0]):'Unknown';
  return Object.freeze({
   id:sourceId+':region:'+index,
   sourceId,index,label,category,
   instanceMethod:clean(piece.instanceMethod||hint.instanceMethod)||'unknown',
   subtype:clean(piece.itemType||hint.itemType)||'Unknown',
   color:clean(piece.colorEstimate?.color)||'Unknown',
   clipped:hint.clipped===true,
   bounds
  });
 });
 const shoes=records.filter(x=>x.category==='Shoes'||x.label==='Shoes');
 const others=records.filter(x=>!shoes.includes(x)),proposals=[];
 const add=(status,members,reason)=>proposals.push(Object.freeze({
  id:sourceId+':unit:'+proposals.length,
  status,memberIds:members.map(x=>x.id),
  reason,ownerConfirmationRequired:true,
  // Neither suggestions nor a proposed count can become saved closet items.
  saveAuthorized:false
 }));
 if(shoes.length===2){
  const reason=reasonForPair(shoes[0],shoes[1]);
  add(reason?'uncertain_requires_review':'suggested_pair',shoes,reason||'matching_source_region_heuristic');
 }else if(shoes.length===1){
  add('uncertain_requires_review',shoes,'single_footwear_region');
 }else if(shoes.length>2){
  add('uncertain_requires_review',shoes,'multiple_footwear_regions_need_owner_pairing');
 }
 for(const other of others){
  // Semantic proposals can be fragments, duplicates, or distinct garments.
  // One provisional review unit per region; never silently merge or discard.
  add('distinct_items',[other],other.bounds?'separate_observed_region':'missing_source_bounds');
 }
 return Object.freeze({
  source:{id:sourceId,originalSha256,originalSha256Verified:false},
  instances:records,
  proposals,
  detectedRegionCount:records.length,
  suggestedPairCount:proposals.filter(x=>x.status==='suggested_pair').length,
  confirmedOwnedUnits:0,
  requiresOwnerReview:true
 });
}
// Authorization boundary for downstream *review* adapters only. An approved
// decision is NOT a save instruction; existing private-closet admission and
// category/type/color confirmation continue to apply.
export function validateOwnerUnitDecision70(result,decision){
 if(!result?.requiresOwnerReview||!Array.isArray(result.instances)||!decision||decision.explicitOwnerConfirmation!==true)
  return {approved:false,reason:'explicit_owner_confirmation_required'};
 if(clean(decision.sourceId)!==result.source?.id)return {approved:false,reason:'source_mismatch'};
 const ids=decision.memberIds;
 if(!Array.isArray(ids)||!ids.length||ids.length>result.instances.length||
    new Set(ids).size!==ids.length||ids.some(id=>!result.instances.some(x=>x.id===id)))
  return {approved:false,reason:'invalid_or_foreign_regions'};
 const allowed=['pair','separate','keep','discard','combine_fragments'];
 if(!allowed.includes(decision.action))return {approved:false,reason:'unknown_review_action'};
 const members=result.instances.filter(x=>ids.includes(x.id));
 if(decision.action==='pair'&&(members.length!==2||members.some(x=>x.category!=='Shoes')))
  return {approved:false,reason:'pair_requires_two_footwear_regions'};
 if(decision.action==='combine_fragments'&&members.length<2)
  return {approved:false,reason:'fragment_combination_requires_multiple_regions'};
 if((decision.action==='keep'||decision.action==='discard')&&members.length!==1)
  return {approved:false,reason:'single_region_action_required'};
 return {approved:true,sourceId:result.source.id,action:decision.action,memberIds:ids.slice(),saveAuthorized:false};
}
