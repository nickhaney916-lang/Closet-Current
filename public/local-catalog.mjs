export const localCandidates=[
 ['a T-shirt','Tops','T-shirt','Unknown'],['a blouse','Tops','Blouse','Unknown'],['a button-down shirt','Tops','Button-down shirt','Unknown'],['a polo shirt','Tops','Polo','Unknown'],['a tank top','Tops','Tank top','Sleeveless'],['a knitted sweater','Tops','Sweater','Unknown'],['a sweatshirt','Tops','Sweatshirt','Unknown'],['a hoodie','Tops','Hoodie','Unknown'],['a tunic','Tops','Tunic','Unknown'],
 ['a pair of jeans','Bottoms','Jeans','Not applicable'],['a pair of trousers','Bottoms','Trousers','Not applicable'],['a pair of leggings','Bottoms','Leggings','Not applicable'],['a pair of shorts','Bottoms','Shorts','Not applicable'],['a skirt','Bottoms','Skirt','Not applicable'],['a pair of joggers','Bottoms','Joggers','Not applicable'],
 ['a casual dress','Dresses','Casual dress','Unknown'],['a shirt dress','Dresses','Shirt dress','Unknown'],['a sweater dress','Dresses','Sweater dress','Unknown'],['a formal dress','Dresses','Formal dress','Unknown'],['a jumpsuit','Dresses','Jumpsuit','Unknown'],['a romper','Dresses','Romper','Unknown'],
 ['a jacket','Outerwear','Jacket','Unknown'],['a coat','Outerwear','Coat','Unknown'],['a blazer','Outerwear','Blazer','Unknown'],['a cardigan','Outerwear','Cardigan','Unknown'],['a vest','Outerwear','Vest','Sleeveless'],['a raincoat','Outerwear','Raincoat','Unknown'],
 ['sneakers','Shoes','Sneakers','Not applicable'],['flat shoes','Shoes','Flats','Not applicable'],['high heel shoes','Shoes','Heels','Not applicable'],['sandals','Shoes','Sandals','Not applicable'],['ankle boots','Shoes','Ankle boots','Not applicable'],['tall boots','Shoes','Tall boots','Not applicable'],['loafers','Shoes','Loafers','Not applicable'],
 ['a handbag','Accessories','Bag','Not applicable'],['a belt','Accessories','Belt','Not applicable'],['a scarf','Accessories','Scarf','Not applicable'],['a hat','Accessories','Hat','Not applicable'],['jewelry','Accessories','Jewelry','Not applicable'],['sunglasses','Accessories','Sunglasses','Not applicable'],
 ['a room with no clothing item','Uncategorized','Unknown','Unknown'],
 ['a blank wall','Uncategorized','Unknown','Unknown'],['an empty floor','Uncategorized','Unknown','Unknown'],
 ['a blurry image with no identifiable garment','Uncategorized','Unknown','Unknown'],
 ['a hand with no garment','Uncategorized','Unknown','Unknown'],['a dog or cat','Uncategorized','Unknown','Unknown'],
 ['a pile of several different clothes','Uncategorized','Unknown','Unknown']
].map(([label,category,itemType,sleeveLength])=>({label,category,itemType,sleeveLength}));
export function clothingChoices(results){return results.filter(x=>Number.isFinite(x.score)).map(x=>{const candidate=localCandidates.find(c=>c.label===x.label);return candidate?{...candidate,score:x.score}:null;}).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,3);}
export function strongMatch(choices){return !!choices[0]&&choices[0].category!=='Uncategorized'&&choices[0].score>=.55&&choices[0].score-(choices[1]?.score||0)>=.15;}
export function detailMatch(ranked,choices){
 const first=ranked[0];
 if(!first||first.score<.6||first.score-(ranked[1]?.score||0)<.2)return null;
 return choices.find(x=>x.label===first.label)?.value||null;
}

export function sleeveChoices(type){return [['Sleeveless','sleeveless'],['Short sleeve','short-sleeved'],['Elbow length','elbow-length sleeve'],['Three-quarter sleeve','three-quarter sleeve'],['Long sleeve','long-sleeved']].map(([value,style])=>({label:`a ${style} ${type.toLowerCase()}`,value}));}

export function garmentDetailGroups(choice){
 const groups={};
 for(const [key,values] of Object.entries({color:['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor'],fit:['Fitted','Regular','Relaxed','Oversized'],pattern:['Solid','Striped','Floral','Plaid','Checked','Polka dot','Animal print','Graphic']})){
  groups[key]=values.map(value=>({value,label:'a '+value.toLowerCase()+' '+choice.itemType.toLowerCase()}));
  groups[key].push({value:'Unknown',label:'a garment with an unclear '+key});
 }
 if(['Tops','Dresses','Outerwear'].includes(choice.category)&&choice.sleeveLength==='Unknown')groups.sleeveLength=sleeveChoices(choice.itemType);
 return groups;
}
// A single model pass can score all detail labels. Normalize within each group
// for meaningful per-field comparisons. Quantized batches can shift scores,
// so grouped details use a stricter confidence gate than single-field calls.
export function groupedGarmentDetails(results,groups){
 const details={};
 for(const [key,options]of Object.entries(groups)){
  const labels=new Set(options.map(x=>x.label)),ranked=results.filter(x=>labels.has(x.label)&&Number.isFinite(x.score)&&x.score>=0);
  const total=ranked.reduce((sum,x)=>sum+x.score,0);if(!total)continue;
  const normalized=ranked.map(x=>({...x,score:x.score/total})).sort((a,b)=>b.score-a.score);
  if(!normalized[0]||normalized[0].score<.65||normalized[0].score-(normalized[1]?.score||0)<.25)continue;
  const value=detailMatch(normalized,options);if(value&&value!=='Unknown')details[key]=value;
 }
 return details;
}
