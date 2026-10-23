'use strict';
const outfitSlots=[
 {id:'top',label:'Base shirt or dress',category:'Tops',categories:['Tops','Dresses']},
 {id:'bottom',label:'Bottoms',category:'Bottoms',categories:['Bottoms']},
 {id:'layer',label:'Shirt / sweater layer',category:'Outerwear',categories:['Tops','Outerwear'],optional:true,level:1},
 {id:'layer2',label:'Jacket',category:'Outerwear',categories:['Outerwear'],optional:true,extra:true,level:2},
 {id:'layer3',label:'Outer coat',category:'Outerwear',categories:['Outerwear'],optional:true,extra:true,level:3},
 {id:'shoes',label:'Shoes',category:'Shoes',categories:['Shoes']},
 {id:'bag',label:'Bag',category:'Accessories',categories:['Accessories'],types:['Bag'],optional:true},
 {id:'accessory',label:'Jewelry / sunglasses',category:'Accessories',categories:['Accessories'],types:['Jewelry','Sunglasses'],optional:true},
 {id:'finish',label:'Belt / scarf / hat',category:'Accessories',categories:['Accessories'],types:['Belt','Scarf','Hat'],optional:true}
];
let outfitTrendSources=[
 {title:'Vogue · Fall 2026 shoe trends',url:'https://www.vogue.com/article/fall-2026-shoe-trends',checked:'2026-10-12'},
 {title:'Who What Wear · Winter 2026 shoes',url:'https://www.whowhatwear.com/fashion/shoes/winter-shoe-trends-2026',checked:'2026-10-12'}
];
let outfitProductExamples=[
 {type:'Sneakers',audience:'Women',name:'Nike Court Legacy Next Nature',url:'https://www.nike.com/t/court-legacy-next-nature-womens-shoes-8r07x0',priceAtCheck:75},
 {type:'Loafers',audience:'Women',name:'Sam Edelman Loraine Bit Loafer',url:'https://www.nordstrom.com/s/loraine-bit-loafer-wide-width-available-women/4447269?slpfid=3',priceAtCheck:150},
 {type:'Flats',audience:'Women',name:'Madewell The Greta Ballet Flat',url:'https://www.nordstrom.com/s/madewell-the-greta-ballet-flat-women/7575401',priceAtCheck:98}
];
let activeTrendLibrary=null;
function applyLoadedTrendLibrary(value){const library=normalizeTrendLibrary(value);activeTrendLibrary=library;outfitTrendSources=library.sources;outfitProductExamples=library.products;return library;}
function slotAllows(slot,item){return slot.categories.includes(item.category)&&(!slot.types||slot.types.includes(item.itemType)||item.itemType==='Unknown'||item.itemType==='Other');}
function cleanOutfitBoard(value,closet){
 const result={name:String(value?.name||'My outfit').slice(0,80),slots:{},ideas:{},occasion:['Casual','Work','Dinner','Active'].includes(value?.occasion)?value.occasion:'Casual',season:['Spring','Summer','Fall','Winter'].includes(value?.season)?value.season:'Fall',audience:['Women','Men','All'].includes(value?.audience)?value.audience:'Women',size:String(value?.size||'').slice(0,30),budget:Math.max(0,Math.min(10000,Number(value?.budget)||0))};
 const used=new Set();
 for(const slot of outfitSlots){const item=closet.find(x=>x.id===value?.slots?.[slot.id]);if(item&&slotAllows(slot,item)&&!used.has(item.id)){result.slots[slot.id]=item.id;used.add(item.id);}const idea=value?.ideas?.[slot.id];if(idea&&typeof idea.type==='string')result.ideas[slot.id]={type:idea.type.slice(0,50),color:String(idea.color||'').slice(0,40)};}
 result.layerCount=Math.max([0,1,2,3].includes(Number(value?.layerCount))?Number(value.layerCount):0,result.slots.layer3||result.ideas.layer3?3:result.slots.layer2||result.ideas.layer2?2:result.slots.layer||result.ideas.layer?1:0);
 const top=closet.find(x=>x.id===result.slots.top);if(top?.category==='Dresses'){for(const slot of ['bottom','layer','layer2','layer3']){delete result.slots[slot];delete result.ideas[slot];}result.layerCount=0;}
 // A pin is a reference to an actually selected owned item, never an invented garment.
 if(typeof value?.anchorItemId==='string'&&Object.values(result.slots).includes(value.anchorItemId))result.anchorItemId=value.anchorItemId;
 return result;
}
function boardGaps(board,closet){const top=closet.find(x=>x.id===board.slots.top);return outfitSlots.filter(s=>(!s.extra||board.layerCount>=s.level)&&!board.slots[s.id]&&!((s.id==='bottom'||s.level)&&top?.category==='Dresses'));}
function boardPalette(board,closet){return [...new Set(Object.values(board.slots).map(id=>closet.find(x=>x.id===id)?.color?.trim().toLowerCase()).filter(x=>x&&x!=='unknown'))];}
function wardrobeGapIdeas(slotId,board,closet){
 const slot=outfitSlots.find(x=>x.id===slotId);if(!slot)return [];
 const palette=boardPalette(board,closet),warm=palette.some(c=>/brown|tan|beige|cream|olive/.test(c));
 const bag=closet.find(x=>x.id===board.slots.bag),neutral=/black|brown|tan/.test(bag?.color?.toLowerCase()||'')?bag.color.toLowerCase():warm?'brown':'black';
 const cold=['Fall','Winter'].includes(board.season),busy=Object.values(board.slots).some(id=>{const p=closet.find(x=>x.id===id)?.pattern;return p&&p!=='Unknown'&&p!=='Solid';});
 const paletteReason=palette.length?'Works with your '+palette.join(', ')+' palette.':'A neutral starting point; add colors to your clothing details for closer matching.';
 const ideas=[];const add=(type,color,why,source=null)=>ideas.push({slot:slotId,category:slot.category,type,color,reason:why+' '+paletteReason,trendSource:source});
 if(slotId==='shoes'){
  if(board.audience!=='Women'){
   add('Sneakers','white','A relaxed option for everyday outfits.');add('Loafers',neutral,'A more polished alternative for work or dinner.');add(cold?'Ankle boots':'Sandals',neutral,cold?'A seasonal styling option for your fall or winter look.':'An open summer option for casual days.');
  }else if(board.occasion==='Dinner'){
   add('Kitten heel pumps',neutral,'A dressier, low-heel direction.',outfitTrendSources[0]);add('Flats',neutral,'A flat-shoe alternative to dress up the same outfit.');add(cold?'Ankle boots':'Sandals',neutral,'A seasonal alternative with a different silhouette.');
  }else if(board.occasion==='Work'){
   add('Loafers',neutral,'A tailored finish for workwear.');add('Flats',neutral,'A simpler flat-shoe option.');add('Kitten heel pumps',neutral,'A dressier option inspired by the referenced shoe report.',outfitTrendSources[0]);
  }else if(board.occasion==='Active'){
   add('Sneakers','white','A casual sporty styling option; choose footwear designed for your actual activity.');add('Sneakers','black','A darker sporty alternative; check activity suitability at the retailer.');add('Sneakers','gray','A softer neutral for a sporty outfit.');
  }else{
   add('Sneakers','white','A casual everyday finish.');add('Loafers',neutral,'A polished contrast to casual pieces.');add(cold?'Ankle boots':'Flats',neutral,'A seasonal change of silhouette.');
  }
 }else{
  const options={top:[['T-shirt','white'],['Button-down shirt','cream'],['Sweater',warm?'beige':'gray']],bottom:[['Jeans','blue'],['Trousers',neutral],['Skirt',neutral]],layer:[['Cardigan',warm?'cream':'gray'],['Blazer',neutral],['Jacket',warm?'brown':'navy']],bag:[['Bag',neutral],['Bag','cream'],['Bag','burgundy']],accessory:[['Jewelry','gold'],['Jewelry','silver'],['Sunglasses',neutral]],finish:[['Belt',neutral],['Scarf',warm?'cream':'gray'],['Hat',neutral]]};
  for(const [type,color]of options[['layer2','layer3'].includes(slotId)?'layer':slotId]||[])add(type,color,busy?'Keep this piece simple so your existing pattern remains the focus.':'A coordinating finishing option for the pieces you selected.');
 }
 if(activeTrendLibrary){
  const matching=activeTrendLibrary.directions.filter(d=>d.slot===(['layer2','layer3'].includes(slotId)?'layer':slotId)&&(d.audiences.includes('All')||d.audiences.includes(board.audience))&&(!d.occasions.length||d.occasions.includes(board.occasion))&&(!d.seasons.length||d.seasons.includes(board.season))&&(!busy||d.color==='neutral'));
  const trendIdeas=matching.map(d=>({slot:slotId,category:slot.category,type:d.type,label:d.label,color:d.color==='neutral'?neutral:d.color,reason:d.reason+' '+paletteReason,trendSource:outfitTrendSources.find(source=>source.id===d.sourceId)}));
  const types=new Set(trendIdeas.map(x=>x.type));ideas.splice(0,ideas.length,...trendIdeas,...ideas.filter(x=>!types.has(x.type)));
 }
 const audience=board.audience==='All'?'':board.audience.toLowerCase();
 return ideas.slice(0,3).map(idea=>{
  const query=[audience,idea.color,idea.label||idea.type,board.size?'size '+board.size:'',board.budget?'under $'+board.budget:''].filter(Boolean).join(' ');
  const retailerLinks=(activeTrendLibrary?.retailers||[]).filter(r=>(r.audience==='All'||r.audience===board.audience)&&(!r.types.length||r.types.includes(idea.type)));
  return {...idea,retailerLinks,query,shoppingUrl:'https://www.google.com/search?tbm=shop&q='+encodeURIComponent(query),retailerUrl:'https://www.nordstrom.com/sr?keyword='+encodeURIComponent(query),examples:outfitProductExamples.filter(p=>p.type===idea.type&&p.audience===board.audience&&(!board.budget||(Number.isFinite(p.priceAtCheck)&&p.priceAtCheck<=board.budget)))};
 });
}
function closetGapOptions(slotId,board,closet){const slot=outfitSlots.find(s=>s.id===slotId);if(!slot)return [];const used=new Set(Object.values(board.slots));return closet.filter(item=>slotAllows(slot,item)&&!used.has(item.id));}
