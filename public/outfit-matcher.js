'use strict';
const outfitTerms=[
 ['ankle boots','Shoes','Ankle boots'],['tall boots','Shoes','Tall boots'],['button-down','Tops','Button-down shirt'],['button down','Tops','Button-down shirt'],['t-shirt','Tops','T-shirt'],['t shirt','Tops','T-shirt'],['tee','Tops','T-shirt'],['blouse','Tops','Blouse'],['polo','Tops','Polo'],['tank','Tops','Tank top'],['sweater dress','Dresses','Sweater dress'],['shirt dress','Dresses','Shirt dress'],['sweater','Tops','Sweater'],['sweatshirt','Tops','Sweatshirt'],['hoodie','Tops','Hoodie'],['tunic','Tops','Tunic'],['jeans','Bottoms','Jeans'],['trousers','Bottoms','Trousers'],['pants','Bottoms','Trousers'],['leggings','Bottoms','Leggings'],['shorts','Bottoms','Shorts'],['skirt','Bottoms','Skirt'],['joggers','Bottoms','Joggers'],['jumpsuit','Dresses','Jumpsuit'],['romper','Dresses','Romper'],['dress','Dresses','Casual dress'],['blazer','Outerwear','Blazer'],['cardigan','Outerwear','Cardigan'],['raincoat','Outerwear','Raincoat'],['jacket','Outerwear','Jacket'],['coat','Outerwear','Coat'],['vest','Outerwear','Vest'],['sneakers','Shoes','Sneakers'],['trainers','Shoes','Sneakers'],['flats','Shoes','Flats'],['heels','Shoes','Heels'],['sandals','Shoes','Sandals'],['loafers','Shoes','Loafers'],['boots','Shoes','Ankle boots'],['handbag','Accessories','Bag'],['bag','Accessories','Bag'],['belt','Accessories','Belt'],['scarf','Accessories','Scarf'],['hat','Accessories','Hat'],['jewelry','Accessories','Jewelry'],['sunglasses','Accessories','Sunglasses']
];
const outfitColors=['black','white','cream','ivory','beige','tan','brown','navy','blue','green','olive','red','pink','purple','yellow','orange','gray','grey','silver','gold','multicolor'];
function parseOutfit(description){
 return description.split(/\n|;|\s+\+\s+|,|\s+and\s+/i).map(line=>{
  const text=line.trim().toLowerCase();if(!text)return null;
  const term=outfitTerms.find(([keyword])=>new RegExp('\\b'+keyword+'\\b','i').test(text));
  const color=outfitColors.find(c=>new RegExp('\\b'+c+'\\b').test(text));
  const sleeve=/sleeveless/.test(text)?'Sleeveless':/short[ -]sleeve/.test(text)?'Short sleeve':/long[ -]sleeve/.test(text)?'Long sleeve':/three[ -]quarter/.test(text)?'Three-quarter sleeve':'Unknown';
  const pattern=['Floral','Striped','Plaid','Solid','Animal print','Polka dot','Checked'].find(p=>text.includes(p.toLowerCase()))||'Unknown';
  const fit=['Fitted','Regular','Relaxed','Oversized'].find(f=>text.includes(f.toLowerCase()))||'Unknown';
  return {fit,id:crypto.randomUUID(),label:line.trim().slice(0,120),category:term?.[1]||'Uncategorized',itemType:term?.[2]||'Unknown',color:color||'',sleeveLength:sleeve,pattern};
 }).filter(Boolean).slice(0,12);
}
function colorFamily(value){const v=String(value||'').trim().toLowerCase();return ({grey:'gray',ivory:'cream',beige:'tan'})[v]||v;}
function rankClosetPiece(component,item,season){
 if(component.category==='Uncategorized'||component.itemType==='Unknown'||item.category!==component.category)return null;
 const reasons=[],missing=[];let score=0,close=item.itemType===component.itemType;
 if(close){score+=6;reasons.push('Same item type');}else{score+=1;missing.push(item.itemType==='Unknown'?'Item type not documented':'Different item type');}
 const wanted=colorFamily(component.color),owned=colorFamily(item.color);
 if(wanted){if(owned&&owned===wanted){if(item.colorSource==='photo-estimate'){score+=1;close=false;reasons.push('Estimated color match');missing.push('Confirm estimated color');}else{score+=3;reasons.push('Matching color');}}else{close=false;missing.push(owned?'Different color':'Color not documented');}}
 if(component.sleeveLength&&component.sleeveLength!=='Unknown'&&component.sleeveLength!=='Not applicable'){
  if(item.sleeveLength===component.sleeveLength){score+=2;reasons.push('Matching sleeves');}else{close=false;missing.push(!item.sleeveLength||item.sleeveLength==='Unknown'?'Sleeves not documented':'Different sleeves');}
 }
 if(component.pattern&&component.pattern!=='Unknown'){
  if(item.pattern===component.pattern){score+=2;reasons.push('Matching pattern');}else{close=false;missing.push(item.pattern==='Unknown'?'Pattern not documented':'Different pattern');}
 }
 if(component.fit&&component.fit!=='Unknown'){if(item.fit===component.fit){score+=2;reasons.push('Matching fit');}else{close=false;missing.push(!item.fit||item.fit==='Unknown'?'Fit not documented':'Different fit');}}
 if(season){if(item.seasons?.includes(season)||item.seasons?.includes('All seasons')){score++;reasons.push('Tagged for '+season);}else{close=false;missing.push(item.seasons?.length?'Review seasonal suitability':'Season not documented');}}
 return {item,score,close,reasons,missing};
}
function matchOutfit(components,closet,season=''){
 const used=new Set();
 // Satisfy the most specific requests first; a single garment cannot fill two slots.
 const ordered=components.map((component,index)=>({component,index,specificity:[component.color,component.sleeveLength!=='Unknown'?component.sleeveLength:'',component.pattern!=='Unknown'?component.pattern:'',component.fit&&component.fit!=='Unknown'?component.fit:''].filter(Boolean).length})).sort((a,b)=>b.specificity-a.specificity);
 const result=[];
 for(const {component,index}of ordered){
  const ranked=closet.filter(item=>!used.has(item.id)).map(item=>rankClosetPiece(component,item,season)).filter(Boolean).sort((a,b)=>Number(b.close)-Number(a.close)||b.score-a.score);
  const exact=ranked.find(x=>x.close),best=exact||ranked[0];if(best)used.add(best.item.id);
  result[index]={component,best,alternatives:ranked.slice(1,3),status:exact?'match':best?'substitute':'gap'};
 }
 return result;
}
function safeInspirationUrl(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}}
function shopSearch(component,size,budget){return 'https://www.google.com/search?tbm=shop&q='+encodeURIComponent([component.color,component.itemType!=='Unknown'?component.itemType:component.label,component.sleeveLength!=='Unknown'&&component.sleeveLength!=='Not applicable'?component.sleeveLength:'',size?'size '+size:'',budget>0?'under $'+budget:''].filter(Boolean).join(' '));}
