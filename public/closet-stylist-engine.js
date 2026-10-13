'use strict';
const stylistProfiles={
 School:{occasion:'Casual',top:['Polo','T-shirt','Sweater','Button-down shirt','Blouse','Hoodie'],bottom:['Jeans','Trousers','Shorts','Skirt'],shoes:['Sneakers','Loafers','Flats']},
 Casual:{occasion:'Casual',top:['T-shirt','Polo','Button-down shirt','Blouse','Sweater','Tank top','Hoodie','Casual dress','Shirt dress'],bottom:['Jeans','Trousers','Shorts','Skirt','Joggers'],shoes:['Sneakers','Loafers','Flats','Sandals','Ankle boots']},
 'Casual date night':{occasion:'Dinner',top:['Polo','Button-down shirt','Blouse','Sweater','Casual dress','Shirt dress','T-shirt'],bottom:['Jeans','Trousers','Skirt'],shoes:['Loafers','Ankle boots','Flats','Sneakers','Heels','Sandals']},
 'Dressy dinner':{occasion:'Dinner',top:['Button-down shirt','Blouse','Formal dress','Casual dress','Sweater'],bottom:['Trousers','Skirt'],shoes:['Loafers','Heels','Flats','Ankle boots']},
 Work:{occasion:'Work',top:['Button-down shirt','Blouse','Polo','Sweater','Shirt dress','Casual dress'],bottom:['Trousers','Skirt','Jeans'],shoes:['Loafers','Flats','Ankle boots','Heels']},
 Activewear:{occasion:'Active',top:['Tank top','T-shirt','Sweatshirt','Hoodie'],bottom:['Leggings','Joggers','Shorts'],shoes:['Sneakers']}
};
function stylistNeutral(color){return ['black','white','gray','cream','tan','beige','brown','navy','ivory','silver','gold'].includes(colorFamily(color));}
function stylistTrendMatches(item,slot,context,library){return (library?.directions||[]).filter(d=>d.slot===slot&&d.type===item.itemType&&(!d.audiences.length||d.audiences.includes('All')||context.audience==='All'||d.audiences.includes(context.audience))&&(!d.occasions.length||d.occasions.includes(context.occasion))&&(!d.seasons.length||d.seasons.includes(context.season))).filter(d=>library.sources.some(s=>s.id===d.sourceId));}
function stylistItemScore(item,slot,context,library){
 const profile=stylistProfiles[context.request],type=item.itemType;
 if(!item.id||item.category==='Uncategorized'||!type||type==='Unknown'||type==='Other')return null;
 if(item.seasons?.length&&!item.seasons.includes('All seasons')&&!item.seasons.includes(context.season))return null;
 // Style preference shapes the look; it does not infer a garment owner's gender.
 if(context.audience==='Men'&&(item.category==='Dresses'||['Skirt','Heels','Flats'].includes(type)))return null;
 let score=0;
 if(['top','bottom','shoes'].includes(slot)){
  const index=profile[slot].indexOf(type);if(index<0)return null;score=16-index;
 }else{
  if(context.request==='Activewear')return null;
  if(slot==='layer'){
   if(context.season==='Summer')return null;
   score=(context.occasion==='Dinner'||context.occasion==='Work')?(type==='Blazer'?8:4):(type==='Jacket'||type==='Cardigan'?7:4);
   if(context.season==='Winter'&&type==='Coat')score+=4;
  }else score=2;
 }
 if(item.seasons?.includes(context.season))score+=2;
 score+=Math.min(4,stylistTrendMatches(item,slot,context,library).length*2);
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
 const ranked=slot=>unique.filter(item=>slotAllows(outfitSlots.find(s=>s.id===slot),item)).map(item=>({item,score:stylistItemScore(item,slot,context,library)})).filter(x=>x.score!==null).sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id)).slice(0,8);
 const tops=ranked('top'),bottoms=ranked('bottom'),shoes=ranked('shoes'),candidates=[];
 // Keep partial outfits useful and label their missing required slots explicitly.
 for(const top of tops.length?tops:[null])for(const bottom of top?.item.category==='Dresses'?[null]:bottoms.length?bottoms:[null])for(const shoe of shoes.length?shoes:[null]){
  const selected=[top,bottom,shoe].filter(Boolean),slots={};if(top)slots.top=top.item.id;if(bottom)slots.bottom=bottom.item.id;if(shoe)slots.shoes=shoe.item.id;
  let score=(top?.item.category==='Dresses'?16:0)+selected.reduce((sum,x)=>sum+x.score,0)+stylistHarmony(selected.map(x=>x.item));
  for(const slot of ['layer','bag','accessory','finish']){
   const extra=ranked(slot).filter(x=>!Object.values(slots).includes(x.item.id)).map(x=>({...x,harmony:stylistHarmony([...selected.map(x=>x.item),x.item])-stylistHarmony(selected.map(x=>x.item))})).sort((a,b)=>(b.score+b.harmony)-(a.score+a.harmony))[0];
   if(extra&&extra.score+extra.harmony>0){slots[slot]=extra.item.id;selected.push(extra);score+=extra.score+extra.harmony;}
  }
  const board=cleanOutfitBoard({name:intent,slots,occasion:context.occasion,audience:context.audience,season:context.season},unique);
  const required=boardGaps(board,unique).filter(s=>!s.optional).map(s=>s.id);
  score-=required.length*30;
  const references=selected.flatMap(x=>stylistTrendMatches(x.item,outfitSlots.find(s=>board.slots[s.id]===x.item.id)?.id,context,library).map(d=>({itemId:x.item.id,label:d.label,reason:d.reason,source:library.sources.find(s=>s.id===d.sourceId)})));
  const notices=[];
  if(selected.some(x=>!x.item.color))notices.push('Some colors are unknown; check the photos together.');
  if(selected.some(x=>!x.item.seasons?.length))notices.push('Some seasonal details are unknown; check the weather and comfort.');
  if(intent==='School')notices.push('Check your school’s dress code before choosing this outfit.');
  if(intent==='Activewear')notices.push('Check that these garments and sneakers are suitable for your actual activity.');
  if(selected.length)candidates.push({board,score,missing:required,references,notices,context,trendUpdatedAt:library?.updatedAt||null});
 }
 candidates.sort((a,b)=>a.missing.length-b.missing.length||b.score-a.score);
 const results=[];
 for(const candidate of candidates){
  const signature=Object.entries(candidate.board.slots).sort().map(([k,v])=>k+':'+v).join('|');
  if(results.some(x=>x.signature===signature))continue;
  results.push({...candidate,signature});if(results.length===3)break;
 }
 return results;
}
