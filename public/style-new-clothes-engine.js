'use strict';
// Research-only, dependency-free outfit selection. Never fabricates owned garment IDs.
(function(root){
 const slotOf=item=>item?.category==='Dresses'||item?.category==='Tops'?'top':item?.category==='Bottoms'?'bottom':item?.category==='Shoes'?'shoes':null;
 function create(wardrobe,selectedId,limit=3){
  const owned=[...new Map((wardrobe||[]).filter(x=>x&&typeof x.id==='string'&&x.id).map(x=>[x.id,x])).values()];
  const selected=owned.find(x=>x.id===selectedId),pin=slotOf(selected);
  if(!pin)return {outfits:[],reason:'Choose a saved top, dress, bottoms or shoes.'};
  const by=slot=>owned.filter(x=>slotOf(x)===slot&&x.id!==selectedId).sort((a,b)=>a.id.localeCompare(b.id));
  const tops=pin==='top'?[selected]:by('top'),bottoms=pin==='bottom'?[selected]:by('bottom'),shoes=pin==='shoes'?[selected]:by('shoes');
  const results=[];
  for(const top of tops)for(const bottom of top.category==='Dresses'?[null]:bottoms)for(const shoe of shoes){
   if(!shoe||(!bottom&&top.category!=='Dresses'))continue;
   const slots={top:top.id,...(bottom?{bottom:bottom.id}:{}),shoes:shoe.id};
   if(slots[pin]!==selectedId||new Set(Object.values(slots)).size!==Object.keys(slots).length)continue;
   const colors=[top,bottom,shoe].filter(Boolean).map(x=>(x.color||'').toLowerCase());
   const neutral=c=>/^(black|white|cream|gray|grey|navy|beige|tan|brown|ivory)$/.test(c);
   const score=colors.filter(neutral).length+new Set(colors.filter(Boolean)).size/10;
   results.push({slots,pinnedId:selectedId,score});
  }
  results.sort((a,b)=>b.score-a.score||JSON.stringify(a.slots).localeCompare(JSON.stringify(b.slots)));
  return {outfits:results.slice(0,Math.max(0,Math.min(3,limit))),reason:results.length?'': 'Not enough compatible saved clothing to complete an outfit.'};
 }
 function swap(wardrobe,outfit,slot,replacementId){
  if(!outfit||!outfit.pinnedId||!outfit.slots)return null;
  const pinned=(wardrobe||[]).find(x=>x.id===outfit.pinnedId),replacement=(wardrobe||[]).find(x=>x.id===replacementId);
  if(!pinned||!replacement||slotOf(replacement)!==slot||outfit.slots[slot]===outfit.pinnedId)return null;
  const slots={...outfit.slots,[slot]:replacementId};
  if(slots[slotOf(pinned)]!==pinned.id||new Set(Object.values(slots)).size!==Object.keys(slots).length)return null;
  if((wardrobe||[]).find(x=>x.id===slots.top)?.category==='Dresses')delete slots.bottom;
  else if(!slots.bottom)return null;
  return {...outfit,slots};
 }
 const api={create,swap,slotOf};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StyleNewClothes=api;
})(typeof window!=='undefined'?window:globalThis);
