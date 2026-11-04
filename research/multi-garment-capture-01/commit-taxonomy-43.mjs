/**
 * CATEGORY-SUBTYPE-COMMIT-43 — exact persisted category/subtype contract.
 *
 * Research-only readonly mirror of public/taxonomy.js types. A Node contract
 * test fails whenever that canonical app taxonomy changes. The persistence
 * boundary MUST NOT trust an injected model or UI schema to redefine a type.
 * The explicitly human-entered Color field is intentionally NOT a whitelist;
 * custom Navy, Charcoal and other descriptive colors remain allowed.
 */
export const COMMIT43_TYPES=Object.freeze({
 Tops:Object.freeze(['T-shirt','Blouse','Button-down shirt','Polo','Tank top','Sweater','Sweatshirt','Hoodie','Tunic','Other']),
 Bottoms:Object.freeze(['Jeans','Trousers','Leggings','Shorts','Skirt','Joggers','Other']),
 Dresses:Object.freeze(['Casual dress','Shirt dress','Sweater dress','Formal dress','Jumpsuit','Romper','Other']),
 Outerwear:Object.freeze(['Jacket','Coat','Blazer','Cardigan','Vest','Raincoat','Other']),
 Shoes:Object.freeze(['Sneakers','Flats','Heels','Sandals','Ankle boots','Tall boots','Loafers','Other'])
});
export function validReviewTaxonomy43(category,itemType){
 return Object.hasOwn(COMMIT43_TYPES,category)&&
  typeof itemType==='string'&&COMMIT43_TYPES[category].includes(itemType);
}
export function reviewedColor43(color){
 if(typeof color!=='string')return null;
 const clean=color.trim();
 return clean&&clean.length<=120&&clean.toLowerCase()!=='unknown'?clean:null;
}
