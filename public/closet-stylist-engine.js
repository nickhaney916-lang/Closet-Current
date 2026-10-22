'use strict';
const stylistProfiles={
 School:{occasion:'Casual',top:['Polo','T-shirt','Sweater','Button-down shirt','Blouse','Hoodie'],bottom:['Jeans','Trousers','Shorts','Skirt'],shoes:['Sneakers','Loafers','Flats']},
 Casual:{occasion:'Casual',top:['T-shirt','Polo','Button-down shirt','Blouse','Sweater','Tank top','Hoodie','Casual dress','Shirt dress','Sweater dress','Jumpsuit','Romper'],bottom:['Jeans','Trousers','Shorts','Skirt','Joggers'],shoes:['Sneakers','Loafers','Flats','Sandals','Ankle boots']},
 'Casual date night':{occasion:'Dinner',top:['Polo','Button-down shirt','Blouse','Sweater','Casual dress','Shirt dress','Sweater dress','Jumpsuit','T-shirt'],bottom:['Jeans','Trousers','Skirt'],shoes:['Loafers','Ankle boots','Flats','Sneakers','Heels','Sandals']},
 'Dressy dinner':{occasion:'Dinner',top:['Button-down shirt','Blouse','Formal dress','Casual dress','Sweater'],bottom:['Trousers','Skirt'],shoes:['Loafers','Heels','Flats','Ankle boots']},
 Work:{occasion:'Work',top:['Button-down shirt','Blouse','Polo','Sweater','Shirt dress','Casual dress'],bottom:['Trousers','Skirt','Jeans'],shoes:['Loafers','Flats','Ankle boots','Heels']},
 Activewear:{occasion:'Active',top:['Tank top','T-shirt','Sweatshirt','Hoodie'],bottom:['Leggings','Joggers','Shorts'],shoes:['Sneakers']}
};
function stylistNeutral(color){return ['black','white','gray','cream','tan','beige','brown','navy','ivory','silver','gold'].includes(colorFamily(color));}
function stylistTrendMatches(item,slot,context,library){return (library?.directions||[]).filter(d=>d.slot===slot&&d.type===item.itemType&&(!d.audiences.length||d.audiences.includes('All')||context.audience==='All'||d.audiences.includes(context.audience))&&(!d.occasions.length||d.occasions.includes(context.occasion))&&(!d.seasons.length||d.seasons.includes(context.season))).filter(d=>library.sources.some(s=>s.id===d.sourceId));}
// Match the clothing figure's three independent optional layers. Use the
// known catalog category/type rather than fabric color, season or trend data.
function stylistLayerSlot(item){
 if(item.category==='Tops')return 'layer';
 if(item.category!=='Outerwear')return null;
 if(['Coat','Raincoat'].includes(item.itemType))return 'layer3';
 if(['Cardigan','Vest'].includes(item.itemType))return 'layer';
 return 'layer2';
}
function stylistItemScore(item,slot,context,library){
 const profile=stylistProfiles[context.request],type=item.itemType;
 const partial=!type||type==='Unknown'||type==='Other';
 if(!item.id||item.category==='Uncategorized')return null;
 if(partial&&(context.request!=='Casual'||!item.color||item.color==='Unknown'||!['top','bottom','shoes','layer'].includes(slot)))return null;
 if(['layer','layer2','layer3'].includes(slot)&&stylistLayerSlot(item)!==slot)return null;
 if(slot==='layer'&&item.category==='Tops'&&!['Sweater','Sweatshirt','Hoodie','Button-down shirt','Tunic'].includes(type)&&item.sleeveLength!=='Long sleeve')return null;
 if(item.seasons?.length&&!item.seasons.includes('All seasons')&&!item.seasons.includes(context.season))return null;
 // Style preference shapes the look; it does not infer a garment owner's gender.
 if(context.audience==='Men'&&(item.category==='Dresses'||['Skirt','Heels','Flats'].includes(type)))return null;
 let score=0;
 if(['top','bottom','shoes'].includes(slot)){
  const index=profile[slot].indexOf(type);if(index<0&&!partial)return null;score=partial?1:16-index;
 }else{
  if(context.request==='Activewear')return null;
  if(['layer','layer2','layer3'].includes(slot)){
   if(context.season==='Summer')return null;
   score=(context.occasion==='Dinner'||context.occasion==='Work')?
    (type==='Blazer'?8:4):(type==='Jacket'||type==='Cardigan'?7:4);
   if(context.season==='Winter'&&['Coat','Raincoat'].includes(type))score+=4;
  }else score=2;
 }
 if(item.seasons?.includes(context.season))score+=2;
 score+=Math.min(4,stylistTrendMatches(item,['layer2','layer3'].includes(slot)?'layer':slot,context,library).length*2);
 return score;
}
function stylistHarmony(selected){
 let score=0;const known=selected.filter(x=>x.color&&colorFamily(x.color)!=='unknown');
 for(let i=0;i<known.length;i++)for(let j=i+1;j<known.length;j++){
  const a=colorFamily(known[i].color),b=colorFamily(known[j].color);
  if(stylistNeutral(a)||stylistNeutral(b))score+=1.5;
  else if(a===b)score+=1;
  else if((['blue','green','olive'].includes(a)&&['blue','green','olive'].includes(b)))score+=1;
  else score-=1;
 }
 const patterned=selected.filter(x=>x.pattern&&x.pattern!=='Unknown'&&x.pattern!=='Solid');
 if(patterned.length>1)score-=5*(patterned.length-1);
 return score;
}
function styleOwnedCollection(closet,request={},library=null){
 const intent=Object.hasOwn(stylistProfiles,request.request)?request.request:'Casual';
 const context={request:intent,occasion:stylistProfiles[intent].occasion,audience:['Women','Men','All'].includes(request.audience)?request.audience:'All',season:['Spring','Summer','Fall','Winter'].includes(request.season)?request.season:'Fall'};
 const unique=[...new Map(closet.filter(x=>x&&typeof x.id==='string').map(x=>[x.id,x])).values()];
 // Explicitly selected garment must appear in every option. Never substitute
 // another owner's item or choose a different top in place of the anchor.
 const anchorId=typeof request.anchorItemId==='string'?request.anchorItemId:null;
 const anchor=anchorId?unique.find(x=>x.id===anchorId):null;
 // Align pinned garments with the same four torso layers as My Closet and
 // the outfit board. A jacket must never masquerade as a sweater layer.
 const anchorSlot=anchor?.category==='Tops'||anchor?.category==='Dresses'?'top':
  anchor?.category==='Bottoms'?'bottom':anchor?.category==='Shoes'?'shoes':
  stylistLayerSlot(anchor);
 if(anchorId&&(!anchor||!anchorSlot))return [];
 const rankSlot=slot=>{
  if(slot===anchorSlot){
   if(!slotAllows(outfitSlots.find(s=>s.id===slot),anchor))return [];
   return [{item:anchor,score:stylistItemScore(anchor,slot,context,library)??0}];
  }
  return unique.filter(item=>item.id!==anchorId&&slotAllows(outfitSlots.find(s=>s.id===slot),item))
   .map(item=>({item,score:stylistItemScore(item,slot,context,library)}))
   .filter(x=>x.score!==null)
   .map(x=>({...x,rank:x.score+(anchor?stylistHarmony([anchor,x.item])-stylistHarmony([anchor]):0)}))
   .sort((a,b)=>b.rank-a.rank||a.item.id.localeCompare(b.item.id));
 };
 const rankedCache=new Map();
 const ranked=slot=>{
  if(!rankedCache.has(slot)){
   const scored=rankSlot(slot);
   // Preserve dress and separate structures, each with a bounded shortlist.
   // Contextual anchor harmony is considered BEFORE discarding candidates.
   rankedCache.set(slot,slot==='top'&&slot!==anchorSlot?
    [...scored.filter(x=>x.item.category!=='Dresses').slice(0,8),
     ...scored.filter(x=>x.item.category==='Dresses').slice(0,8)]:scored.slice(0,8));
  }
  return rankedCache.get(slot);
 };
 const availableTops=ranked('top');
 const tops=(anchorSlot==='bottom'||['layer','layer2','layer3'].includes(anchorSlot))?
  availableTops.filter(x=>x.item.category!=='Dresses'):availableTops;
 const bottoms=ranked('bottom'),shoes=ranked('shoes'),candidates=[];
 // When the chosen new piece is an outer jacket or coat, keep lighter
 // optional layers separate. Do not silently place another jacket in layer 1.
 // Each unpinned outfit gets at most one optional outer item, placed in its
 // true figure space. Do not stack every available coat/jacket on a base
 // shirt or pretend a coat is a sweater. Anchored jacket/coat remains pinned
 // independently, and can add a genuine light layer underneath it.
 const lightLayers=ranked('layer');
 const outerOptions=anchorSlot==='layer2'||anchorSlot==='layer3'?
  lightLayers.map(x=>({slot:'layer',...x})):
  anchorSlot==='layer'?lightLayers.map(x=>({slot:'layer',...x})):
  [...lightLayers.slice(0,6).map(x=>({slot:'layer',...x})),
   ...ranked('layer2').slice(0,6).map(x=>({slot:'layer2',...x})),
   ...ranked('layer3').slice(0,6).map(x=>({slot:'layer3',...x}))];
 const optionalLayers=outerOptions.length?outerOptions:[null];
 // Keep partial outfits useful and label their missing required slots explicitly.
 for(const top of tops.length?tops:[null])for(const bottom of top?.item.category==='Dresses'?[null]:bottoms.length?bottoms:[null])for(const shoe of shoes.length?shoes:[null])for(const layer of top?.item.category==='Dresses'?[null]:optionalLayers){
  const selected=[top,bottom,shoe].filter(Boolean),slots={};if(top)slots.top=top.item.id;if(bottom)slots.bottom=bottom.item.id;if(shoe)slots.shoes=shoe.item.id;
  let score=(top?.item.category==='Dresses'?16:0)+selected.reduce((sum,x)=>sum+x.score,0)+stylistHarmony(selected.map(x=>x.item));
  if(anchor&&['layer2','layer3'].includes(anchorSlot)){
   // This is the specific owned piece selected through Style this. The
   // board understands jacket and outer-coat layers independently.
   const earlier=stylistHarmony(selected.map(x=>x.item));
   slots[anchorSlot]=anchor.id;
   const anchorScore=stylistItemScore(anchor,anchorSlot,context,library)??0;
   selected.push({item:anchor,score:anchorScore});
   score+=anchorScore+stylistHarmony(selected.map(x=>x.item))-earlier;
  }
  for(const slot of ['layer','bag','accessory','finish']){
   if(slot==='layer'&&top?.item.category==='Dresses')continue;
   const extra=(slot==='layer'?(layer?[layer]:[]):ranked(slot)).filter(x=>
    !Object.values(slots).includes(x.item.id)).map(x=>({...x,harmony:
     stylistHarmony([...selected.map(y=>y.item),x.item])-stylistHarmony(selected.map(y=>y.item))}))
     .sort((a,b)=>(b.score+b.harmony)-(a.score+a.harmony))[0];
   if(extra&&(slot===anchorSlot||extra.score+extra.harmony>0)){
    const target=slot==='layer'?extra.slot||'layer':slot;
    // When an outer piece is already pinned, keep lighter garments separate;
    // no generated item may overwrite the customer's chosen coat or jacket.
    if(!slots[target]){
     slots[target]=extra.item.id;selected.push(extra);score+=extra.score+extra.harmony;
    }
   }
  }
  const board=cleanOutfitBoard({name:intent,slots,occasion:context.occasion,audience:context.audience,season:context.season},unique);
  if(anchor&&!Object.values(board.slots).includes(anchor.id))continue;
  const required=boardGaps(board,unique).filter(s=>!s.optional).map(s=>s.id);
  score-=required.length*30;
  const references=selected.flatMap(x=>stylistTrendMatches(x.item,['layer2','layer3'].includes(outfitSlots.find(s=>board.slots[s.id]===x.item.id)?.id)?'layer':outfitSlots.find(s=>board.slots[s.id]===x.item.id)?.id,context,library).map(d=>({itemId:x.item.id,label:d.label,reason:d.reason,source:library.sources.find(s=>s.id===d.sourceId)})));
  const notices=[];
  if(selected.some(x=>!x.item.itemType||['Unknown','Other'].includes(x.item.itemType)))notices.push('Some garment types are unconfirmed; these are category and color matches.');
  if(selected.some(x=>x.item.colorSource==='photo-estimate'))notices.push('Some colors are estimated from photos; confirm the colors together.');
  if(selected.some(x=>!x.item.color||colorFamily(x.item.color)==='unknown'))notices.push('Some colors are unknown; check the photos together.');
  if(selected.some(x=>!x.item.seasons?.length))notices.push('Some seasonal details are unknown; check the weather and comfort.');
  if(anchor&&stylistItemScore(anchor,anchorSlot,context,library)===null)notices.push('Your chosen piece is included, but its recorded style or season may differ from this occasion.');
  if(top?.item.category==='Dresses')notices.push('This one-piece covers your top and bottoms; no separate bottoms or layers are added.');
  if(intent==='School')notices.push('Check your school’s dress code before choosing this outfit.');
  if(intent==='Activewear')notices.push('Check that these garments and sneakers are suitable for your actual activity.');
  if(selected.length)candidates.push({board,score,missing:required,references,notices,context,trendUpdatedAt:library?.updatedAt||null});
 }
 candidates.sort((a,b)=>a.missing.length-b.missing.length||b.score-a.score);
 const uniqueCandidates=[],seen=new Set();
 // Do not pad complete looks with outfits that ask the customer to add clothes.
 const fewestMissing=candidates[0]?.missing.length;
 for(const candidate of candidates){
  if(candidate.missing.length!==fewestMissing)continue;
  const signature=Object.entries(candidate.board.slots).sort().map(([k,v])=>k+':'+v).join('|');
  if(seen.has(signature))continue;
  seen.add(signature);uniqueCandidates.push({...candidate,signature});
 }
 const results=[],chosen=new Set();
 const take=candidate=>{
  if(results.length>=3||chosen.has(candidate.signature))return;
  results.push(candidate);chosen.add(candidate.signature);
 };
 const structure=candidate=>unique.find(x=>x.id===candidate.board.slots.top)?.category==='Dresses'?'dress':'separates';
 const core=candidate=>['top','bottom'].map(slot=>candidate.board.slots[slot]||'').join('|');
 const structures=new Set(),cores=new Set();
 // First preserve a compatible dress/separates choice, then vary the main
 // clothing before returning near-identical looks with only different shoes.
 for(const candidate of uniqueCandidates){
  const key=structure(candidate);if(structures.has(key))continue;
  take(candidate);structures.add(key);cores.add(core(candidate));
 }
 for(const candidate of uniqueCandidates){
  const key=core(candidate);if(cores.has(key))continue;
  take(candidate);cores.add(key);
 }
 for(const candidate of uniqueCandidates)take(candidate);
 return results;
}


// One-piece touch swaps on a styled outfit. Return ONLY closet-owned compatible
// pieces; never invent garments, silently remove layers, or replace the pinned
// newly scanned item. A swap is an in-memory preview until Save outfit.
function stylistSwapChoices(result,slot,closet,anchorId=null){
 if(!['top','bottom','shoes','layer'].includes(slot)||
    !result?.board||!Array.isArray(closet))return [];
 const owned=[...new Map(closet.filter(x=>x&&typeof x.id==='string')
  .map(x=>[x.id,x])).values()];
 const board=cleanOutfitBoard(result.board,owned),current=board.slots[slot];
 if(!current||current===anchorId||anchorId&&!Object.values(board.slots).includes(anchorId))return [];
 const allowed=outfitSlots.find(s=>s.id===slot);
 if(!allowed)return [];
 const currentPiece=owned.find(x=>x.id===current);
 if(!currentPiece)return [];
 const occupied=new Set(Object.values(board.slots));
 const context=result.context||{request:'Casual',occasion:'Casual',audience:'All',season:'Fall'};
 const alternatives=[];
 for(const item of owned){
  if(occupied.has(item.id)||item.category==='Uncategorized'||!slotAllows(allowed,item))continue;
  // Dresses and separates are different outfit structures. A single-piece
  // button never silently changes that structure or creates unlisted gaps.
  if(slot==='top'&&item.category!==currentPiece.category)continue;
  // A dress cannot replace a shirt in an existing bottoms/layered look,
  // and a layered outfit cannot accept a dress without removing layers.
  if(slot==='top'&&item.category==='Dresses'&&
     Object.keys(board.slots).some(x=>x==='bottom'||x.startsWith('layer')))continue;
  const points=stylistItemScore(item,slot,context,null);
  if(points===null)continue;
  const replacement=cleanOutfitBoard({...board,slots:{...board.slots,[slot]:item.id}},owned);
  if(replacement.slots[slot]!==item.id||
     Object.keys(replacement.slots).length!==Object.keys(board.slots).length||
     Object.keys(board.slots).some(k=>k!==slot&&board.slots[k]!==replacement.slots[k])||
     anchorId&&!Object.values(replacement.slots).includes(anchorId))continue;
  const coordinated=Object.values(replacement.slots)
   .map(id=>owned.find(x=>x.id===id)).filter(Boolean);
  alternatives.push({id:item.id,name:item.name||item.itemType||item.category,
   board:replacement,rank:points+stylistHarmony(coordinated)});
 }
 return alternatives.sort((a,b)=>b.rank-a.rank||a.id.localeCompare(b.id));
}
function stylistSwapOne(result,slot,closet,anchorId=null){
 const choices=stylistSwapChoices(result,slot,closet,anchorId);
 if(!choices.length)return null;
 // The current item is excluded from choices, so looking it up as a cursor
 // always returned -1 and bounced between the two highest-ranked items.
 // Visit each eligible owned choice before restarting. Keep only IDs that
 // remain eligible; removed/recategorized items can never be restored.
 const current=result.board.slots[slot],eligible=new Set([current,...choices.map(x=>x.id)]);
 let history=[...new Set([...(Array.isArray(result.swapHistory?.[slot])?
  result.swapHistory[slot]:[]),current])].filter(id=>eligible.has(id));
 let selected=choices.find(x=>!history.includes(x.id));
 if(!selected){history=[];selected=choices[0];}
 return {id:selected.id,name:selected.name,board:selected.board,
  history:[...history,selected.id],otherOptions:choices.length};
}
