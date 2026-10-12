'use strict';
const clothingSchema={
 types:{Tops:['T-shirt','Blouse','Button-down shirt','Polo','Tank top','Sweater','Sweatshirt','Hoodie','Tunic','Other'],Bottoms:['Jeans','Trousers','Leggings','Shorts','Skirt','Joggers','Other'],Dresses:['Casual dress','Shirt dress','Sweater dress','Formal dress','Jumpsuit','Romper','Other'],Outerwear:['Jacket','Coat','Blazer','Cardigan','Vest','Raincoat','Other'],Shoes:['Sneakers','Flats','Heels','Sandals','Ankle boots','Tall boots','Loafers','Other'],Accessories:['Bag','Belt','Scarf','Hat','Jewelry','Sunglasses','Other']},
 sleeve:['Unknown','Sleeveless','Short sleeve','Elbow length','Three-quarter sleeve','Long sleeve','Not applicable'],
 pattern:['Unknown','Solid','Striped','Floral','Plaid','Checked','Polka dot','Animal print','Graphic','Other'],
 fit:['Unknown','Fitted','Regular','Relaxed','Oversized','Not applicable'],
 seasons:['Spring','Summer','Fall','Winter','All seasons']
};
function normalizeClothing(x){
 const category=Object.hasOwn(clothingSchema.types,x.category)?x.category:'Uncategorized';
 const pick=(key,options)=>options.includes(x[key])?x[key]:'Unknown';
 const seasons=Array.isArray(x.seasons)?clothingSchema.seasons.filter(s=>x.seasons.includes(s)):[];
 return {...x,category,itemType:pick('itemType',clothingSchema.types[category]||[]),sleeveLength:pick('sleeveLength',clothingSchema.sleeve),pattern:pick('pattern',clothingSchema.pattern),fit:pick('fit',clothingSchema.fit),seasons:seasons.includes('All seasons')?['All seasons']:seasons,brand:String(x.brand||'').slice(0,120),size:String(x.size||'').slice(0,120),material:String(x.material||'').slice(0,120),occasion:String(x.occasion||'').slice(0,120)};
}
function clothingMatches(item,query,category,season,sleeve){
 return (category==='All categories'||item.category===category)&&(!season||item.seasons.includes(season)||item.seasons.includes('All seasons'))&&(!sleeve||item.sleeveLength===sleeve)&&[item.name,item.color,item.notes,item.category,item.itemType,item.sleeveLength,item.pattern,item.fit,...item.seasons,item.brand,item.size,item.material,item.occasion].join(' ').toLowerCase().includes(query.toLowerCase());
}
