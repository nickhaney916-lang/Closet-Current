// This module is ONLY a validated plan for a private, costly, OPTIONAL
// generative garment NORMALIZATION pilot. No network call, no upload, no
// model inference, no app import, no account modification.
const DATA_URI=/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const categories=Object.freeze({
 Tops:'a neatly laid-out single shirt or sweater, with sleeves naturally extended',
 Bottoms:'a neatly laid-out single pair of pants, shorts, or a skirt with the true hem and waistband visible',
 Dresses:'a neatly laid-out single dress with its actual neckline, sleeves if present, and full hem',
 Outerwear:'a neatly laid-out single jacket or coat with its actual front, collar and sleeves',
 Shoes:'a pair of shoes shown together on a simple flat neutral background'
});
const MAX_IMAGE=7_500_000;
export function validImage(value){
 return typeof value==='string'&&value.length>=128&&value.length<=MAX_IMAGE&&DATA_URI.test(value);
}
export function validateNormalizeCandidate(value){
 if(!value||typeof value!=='object'||value.action!=='normalize-preview'
   ||!Object.hasOwn(categories,value.category)||!validImage(value.garmentImage)
   ||typeof value.itemId!=='string'||value.itemId.length<1||value.itemId.length>128
   ||typeof value.photoSha256!=='string'||!/^[a-f0-9]{64}$/.test(value.photoSha256)
   ||value.userInitiated!==true||value.storeResult!==false)
  throw Error('Invalid private garment normalization preview');
 return {category:value.category,garmentImage:value.garmentImage,
  itemId:value.itemId,photoSha256:value.photoSha256,userInitiated:true,
  storeResult:false};
}
export function planEdit(candidate){
 const v=validateNormalizeCandidate(candidate);
 // Reconstruct realistic catalog presentation while forbidding fake text and
 // logos. This is an *instruction*, NOT a guarantee the model obeys it.
 const prompt='Create a single clean, front-facing, product-only flat-lay catalog photograph of '+
  categories[v.category]+'. Unfold and gently straighten the original garment. '+
  'Keep its observed exact dominant colors, fabric texture, visible pattern, seams, and logos. '+
  'Do not include a person, hanger, accessories, duplicate item, or background objects. '+
  'Do not invent a new graphic, text, brand, decoration or unseen details. '+
  'If a detail is hidden by the original folds, keep it plain and unobtrusive. '+
  'Full garment visible, centered on a neutral bright studio background.';
 return {model_name:'edit',inputs:{
  image:v.garmentImage,prompt,resolution:'1k',
  generation_mode:'fast',num_images:1,output_format:'png',
  return_base64:true
 }};
}
export function validateOutput(value){
 // A correctly formatted image does not guarantee visual fidelity. Human
 // reference review / automated checks must occur before using the preview.
 if(typeof value!=='string'||value.length>10_000_000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))
  throw Error('Unexpected generated garment preview');
 return {image:value,previewOnly:true,sourceVerified:false,
  garmentIdentityVerified:false,pixelAccuracyMeasured:false,
  canReplaceSourcePhoto:false,canAutoReplaceClosetTile:false,
  requiresVisualReview:true};
}
export const NORMALIZE_PREVIEW_DEFAULT_ENABLED=false;
