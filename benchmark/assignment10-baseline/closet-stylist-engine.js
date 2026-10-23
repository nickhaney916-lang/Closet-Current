'use strict';
const stylistProfiles={
 School:{occasion:'Casual',top:['Polo','T-shirt','Sweater','Button-down shirt','Blouse','Hoodie'],bottom:['Jeans','Trousers','Shorts','Skirt'],shoes:['Sneakers','Loafers','Flats']},
 Casual:{occasion:'Casual',top:['T-shirt','Polo','Button-down shirt','Blouse','Sweater','Tank top','Hoodie','Casual dress','Shirt dress','Sweater dress','Jumpsuit','Romper'],bottom:['Jeans','Trousers','Shorts','Skirt','Joggers'],shoes:['Sneakers','Loafers','Flats','Sandals','Ankle boots']},
 'Casual date night':{occasion:'Dinner',top:['Polo','Button-down shirt','Blouse','Sweater','Casual dress','Shirt dress','Sweater dress','Jumpsuit','T-shirt'],bottom:['Jeans','Trousers','Skirt'],shoes:['Loafers','Ankle boots','Flats','Sneakers','Heels','Sandals']},
 'Dressy dinner':{occasion:'Dinner',top:['Button-down shirt','Blouse','Formal dress','Casual dress','Sweater'],bottom:['Trousers','Skirt'],shoes:['Loafers','Heels','Flats','Ankle boots']},
 Work:{occasion:'Work',top:['Button-down shirt','Blouse','Polo','Sweater','Shirt dress','Casual dress'],bottom:['Trousers','Skirt','Jeans'],shoes:['Loafers','Flats','Ankle boots','Heels']},
 Activewear:{occasion:'Active',top:['Tank top','T-shirt','Sweatshirt','Hoodie'],bottom:['Leggings','Joggers','Shorts'],shoes:['Sneakers']}
};
// Synchronous scorer contract: embedded raster bytes only, with plausible
// format headers/dimensions. The UI additionally decodes pixels before use.
// Never fetch remote URLs, private-object paths or execute SVG from old imports.
function stylistLocalRaster(value){
 if(typeof value!=='string'||value.length>12000000)return false;
 const match=value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
 if(!match||match[2].length%4)return false;
 const body=match[2],alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  size=body.length/4*3-(body.endsWith('==')?2:body.endsWith('=')?1:0);
 const byte=i=>{const at=Math.floor(i/3)*4,a=alphabet.indexOf(body[at]),b=alphabet.indexOf(body[at+1]),c=alphabet.indexOf(body[at+2]),d=alphabet.indexOf(body[at+3]);return i%3===0?(a<<2)|(b>>4):i%3===1?((b&15)<<4)|(c>>2):((c&3)<<6)|d;};
 const u16=i=>byte(i)*256+byte(i+1),u32=i=>byte(i)*16777216+byte(i+1)*65536+byte(i+2)*256+byte(i+3);
 const dimensions=(w,h)=>w>0&&h>0&&w<=8192&&h<=8192&&w*h<=24000000;
 if(match[1]==='jpeg'){
  if(size<20||u16(0)!==65496||u16(size-2)!==65497)return false;
  let at=2,valid=false;
  for(let n=0;n<2048&&at+4<size;n++){
   if(byte(at++)!==255)return false;
   while(byte(at)===255&&at<size)at++;
   const marker=byte(at++);if(marker===218)return valid;
   const length=u16(at);if(length<2||at+length>size)return false;
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
    if(length<8||!dimensions(u16(at+5),u16(at+3)))return false;valid=true;
   }
   at+=length;
  }
  return false;
 }
 if(match[1]==='png')return size>=45&&u32(0)===2303741511&&u32(4)===218765834&&u32(8)===13&&u32(12)===1229472850&&dimensions(u32(16),u32(20))&&u32(size-12)===0&&u32(size-8)===1229278788;
 const text=i=>String.fromCharCode(byte(i),byte(i+1),byte(i+2),byte(i+3));
 return size>=30&&text(0)==='RIFF'&&text(8)==='WEBP'&&['VP8 ','VP8L','VP8X'].includes(text(12))&&byte(4)+byte(5)*256+byte(6)*65536+byte(7)*16777216+8===size;
}
function stylistPhotoForItem(item,ownerId=null){
 if(!item||typeof item!=='object')return null;
 // Tenant-scoped caller remains mandatory. Explicit foreign ownership on a
 // legacy record or photo can never be treated as a local fallback.
 for(const value of [item,item.originalPhoto,item.recognitionPhoto]){
  if(value&&typeof value==='object')for(const key of ['ownerId','owner_id'])
   if(value[key]!==undefined&&value[key]!==ownerId)return null;
 }
 for(const [source,image]of [['display',item.image],['recognition',item.recognitionPhoto?.image],['original',item.originalPhoto?.image]])
  if(stylistLocalRaster(image))return {source,image};
 return null;
}
function stylistNeutral(color){return ['black','white','gray','cream','tan','beige','brown','navy','ivory','silver','gold'].includes(colorFamily(color));}
function stylistTrendMatches(item,slot,context,library){return (library?.directions||[]).filter(d=>d.slot===slot&&d.type===item.itemType&&(!d.audiences.length||d.audiences.includes('All')||context.audience==='All'||d.audiences.includes(context.audience))&&(!d.occasions.length||d.occasions.includes(context.occasion))&&(!d.seasons.length||d.seasons.includes(context.season))).filter(d=>library.sources.some(s=>s.id===d.sourceId));}
// Match the clothing figure's three independent optional layers. Use the
// known catalog category/type rather than fabric color, season or trend data.
function stylistLayerSlot(item){
 if(!item||typeof item!=='object')return null;
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
// An ID must name exactly one saved record, even when one duplicate carries
// foreign metadata. Never select a different source by first/last array order.
function stylistUnambiguousOwned(closet,ownerId){
 const source=Array.isArray(closet)?closet:[],counts=new Map();
 for(const item of source)if(item&&typeof item.id==='string')counts.set(item.id,(counts.get(item.id)||0)+1);
 return source.filter(item=>item&&typeof item.id==='string'&&counts.get(item.id)===1&&stylistPhotoForItem(item,ownerId));
}
function styleOwnedCollection(closet,request={},library=null){
 const intent=Object.hasOwn(stylistProfiles,request.request)?request.request:'Casual';
 const context={request:intent,occasion:stylistProfiles[intent].occasion,audience:['Women','Men','All'].includes(request.audience)?request.audience:'All',season:['Spring','Summer','Fall','Winter'].includes(request.season)?request.season:'Fall',ownerId:typeof request.ownerId==='string'?request.ownerId:null};
 const unique=stylistUnambiguousOwned(closet,context.ownerId);
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
  if(anchor)board.anchorItemId=anchor.id;
  const required=boardGaps(board,unique).filter(s=>!s.optional).map(s=>s.id);
  score-=required.length*30;
  const references=selected.flatMap(x=>stylistTrendMatches(x.item,['layer2','layer3'].includes(outfitSlots.find(s=>board.slots[s.id]===x.item.id)?.id)?'layer':outfitSlots.find(s=>board.slots[s.id]===x.item.id)?.id,context,library).map(d=>({itemId:x.item.id,label:d.label,reason:d.reason,source:library.sources.find(s=>s.id===d.sourceId)})));
  const notices=[];
  if(selected.some(x=>stylistPhotoForItem(x.item,context.ownerId)?.source!=='display'))notices.push('An original photo fallback is shown for a missing preview. Check the garment and background together.');
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
 if(!['top','bottom','shoes','layer','layer2','layer3'].includes(slot)||
    !result?.board||!Array.isArray(closet))return [];
 // Persisted pins remain protected even after a save/reload or lost UI state.
 anchorId=result.board.anchorItemId||anchorId;
 const owned=stylistUnambiguousOwned(closet,result.context?.ownerId??null);
 const board=cleanOutfitBoard(result.board,owned),current=board.slots[slot];
 if(!current||current===anchorId||anchorId&&!Object.values(board.slots).includes(anchorId))return [];
 // Never offer a swap when the rendered selection no longer corresponds
 // to a valid, complete set of this closet's owned garments.
 if(Object.keys(board.slots).length!==Object.keys(result.board.slots).length||
   Object.entries(result.board.slots).some(([key,id])=>board.slots[key]!==id))return [];
 const allowed=outfitSlots.find(s=>s.id===slot);
 if(!allowed)return [];
 const currentPiece=owned.find(x=>x.id===current);
 if(!currentPiece)return [];
 if(['layer','layer2','layer3'].includes(slot)&&stylistLayerSlot(currentPiece)!==slot)return [];
 const occupied=new Set(Object.values(board.slots));
 const context=result.context||{request:'Casual',occasion:'Casual',audience:'All',season:'Fall'};
 const alternatives=[];
 for(const item of owned){
  if(occupied.has(item.id)||item.category==='Uncategorized'||!slotAllows(allowed,item))continue;
  // A different jacket must remain a jacket. Never replace a coat with
  // a cardigan, use a jacket as the sweater layer, or silently shift slots.
  if(['layer','layer2','layer3'].includes(slot)&&stylistLayerSlot(item)!==slot)continue;
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
