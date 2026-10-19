// Strict, independently reviewed physical garment FORM. A broad Bottoms
// category is not enough to certify shorts vs skirt vs trousers.
// This is a research scorer vocabulary, not a camera classifier or inference.
export const FORM_FOR_CATEGORY=Object.freeze({
 Tops:['top'],Bottoms:['shorts','trousers','skirt'],Dresses:['dress'],
 Outerwear:['outerwear'],Shoes:['shoes'],Hosiery:['hosiery'],
 Accessories:['accessory']
});
export const MODEL_FORM=Object.freeze({
 short_sleeve_top:'top',long_sleeve_top:'top',sling:'top',vest:'top',
 shorts:'shorts',trousers:'trousers',skirt:'skirt',
 short_sleeve_dress:'dress',long_sleeve_dress:'dress',
 vest_dress:'dress',sling_dress:'dress',
 short_sleeve_outwear:'outerwear',long_sleeve_outwear:'outerwear'
});
export function validReviewedForm(category,form){
 return Object.hasOwn(FORM_FOR_CATEGORY,category)&&
  FORM_FOR_CATEGORY[category].includes(form);
}
