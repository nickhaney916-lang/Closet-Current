/**
 * OFFLINE RESEARCH ONLY — original-frame/instance aligned garment admission.
 * Not wired into the customer app or into any pending mask-recognition PR.
 * A scene is NEVER used as a single-garment classification vote.
 *
 * Inputs must be authorized, already-decoded FIRST APP-RETAINED source images.
 * SHA identifies JPEG bytes, not untouched native camera/file contents.
 * No paid inference, network, database writes, or image transforms to storage.
 */
const CATEGORIES=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']);
const TYPES={
 Tops:new Set(['T-shirt','Polo','Blouse','Button-down shirt','Sweater','Hoodie','Tank top','Tunic','Sweatshirt']),
 Bottoms:new Set(['Jeans','Trousers','Pants','Shorts','Skirt','Joggers','Leggings']),
 Dresses:new Set(['Dress','Casual dress','Shirt dress','Sweater dress','Formal dress','Jumpsuit','Romper']),
 Outerwear:new Set(['Jacket','Blazer','Coat','Raincoat','Cardigan','Vest']),
 Shoes:new Set(['Sneakers','Boots','Ankle boots','Tall boots','Flats','Loafers','Sandals','Heels']),
 Accessories:new Set(['Bag','Belt','Scarf','Hat','Sunglasses','Jewelry'])
};
const sensitive=new Set(['Shorts','Skirt','Ankle boots','Boots','Tall boots','Blazer','Tunic']);
const hashHex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
export function readStoredJpegBytes(input) {
 if(typeof input!=='string'||input.length>11_300_000||!/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input))throw Error('Invalid saved JPEG source');
 const raw=atob(input.slice(23));
 if(raw.length<64||raw.length>8_388_608||raw.charCodeAt(0)!==255||raw.charCodeAt(1)!==216||
    raw.charCodeAt(raw.length-2)!==255||raw.charCodeAt(raw.length-1)!==217)throw Error('Invalid original JPEG bytes');
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
export async function sourceFingerprint(jpeg,cryptoProvider=globalThis.crypto){
 if(!cryptoProvider?.subtle?.digest)throw Error('SHA-256 unavailable');
 return hashHex(await cryptoProvider.subtle.digest('SHA-256',readStoredJpegBytes(jpeg)));
}
function pixelFrame(input){
 if(!input||!Number.isInteger(input.width)||!Number.isInteger(input.height)||
  input.width<16||input.height<16||input.width*input.height>24_000_000||
  ![3,4].includes(input.channels)||!input.data||
  input.data.length!==input.width*input.height*input.channels)throw Error('Invalid decoded source pixels');
 return input;
}
/** Pixel-exact native-resolution source crop, never a mask-altered display preview. */
export function originalRegionPixels(source,bounds=null,mask=null){
 const photo=pixelFrame(source),isWhole=bounds===null;
 let x=0,y=0,width=photo.width,height=photo.height;
 if(!isWhole){
  if(!bounds||!['x','y','width','height'].every(k=>typeof bounds[k]==='number'&&Number.isFinite(bounds[k]))||
   bounds.width<=0||bounds.height<=0||bounds.x<0||bounds.y<0||
   bounds.x+bounds.width>1+1e-8||bounds.y+bounds.height>1+1e-8)throw Error('Invalid instance bounds');
  x=Math.floor(photo.width*bounds.x);y=Math.floor(photo.height*bounds.y);
  const right=Math.min(photo.width,Math.ceil(photo.width*(bounds.x+bounds.width)));
  const bottom=Math.min(photo.height,Math.ceil(photo.height*(bounds.y+bounds.height)));
  width=right-x;height=bottom-y;
  if(width<16||height<16)throw Error('Unsafe low-resolution garment region');
 }
 if(width*height>24_000_000)throw Error('Source crop memory limit');
 if(mask!==null&&(mask.length!==width*height||Array.from(mask).some(v=>v!==0&&v!==1)))throw Error('Invalid binary instance mask');
 const result=new Uint8ClampedArray(width*height*4);
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const from=((row+y)*photo.width+col+x)*photo.channels,to=(row*width+col)*4;
  result[to]=photo.data[from];result[to+1]=photo.data[from+1];result[to+2]=photo.data[from+2];
  result[to+3]=photo.channels===4?photo.data[from+3]:255;
  if(mask&&!mask[row*width+col])result[to+3]=0; // color only; NEVER used for recognition
 }
 return {width,height,channels:4,data:result,bounds:{left:x,top:y,right:x+width,bottom:y+height},originalWidth:photo.width,originalHeight:photo.height};
}
function categoryAndType(v){
 if(!v||typeof v!=='object')return null;
 const choice=v.choices?.[0]||v.choice||null;
 if(!choice||!CATEGORIES.has(choice.category))return null;
 return {category:choice.category,itemType:TYPES[choice.category]?.has(choice.itemType)?choice.itemType:'Unknown',
   color:typeof v.details?.color==='string'?v.details.color:'',pattern:typeof v.details?.pattern==='string'?v.details.pattern:'',
   strong:v.strong===true,categoryConfirmed:v.categoryConfirmed===true};
}
function review(reason,color='',category=null){
 return {status:'review',reason,category:category||'Uncategorized',itemType:'Unknown',color,
  indexingLevel:'none',autoSaved:false,photosTransformed:false};
}
export async function examineOriginalFirst(record,{
 decode,recognize,confirm,colorSample,ownerToken,currentOwner,cryptoProvider=globalThis.crypto
}={}){
 if(typeof decode!=='function'||typeof recognize!=='function'||typeof confirm!=='function'||typeof colorSample!=='function'||
    !ownerToken||typeof ownerToken.owner!=='string'||typeof currentOwner!=='function')throw Error('Offline original-source inputs required');
 const sameOwner=()=>{const session=currentOwner();return session&&session.owner===ownerToken.owner&&session.generation===ownerToken.generation;};
 if(!sameOwner())return review('owner_changed');
 if(record?.userAdjusted)return {status:'preserve-user',reason:'existing_user_correction',autoSaved:false};
 const multi=typeof record?.outfitSourceId==='string'&&record.outfitSourceId.trim().length>0;
 // With a single garment, item.image is ordinarily the first retained JPEG.
 // On a multi-garment capture, parent full-frame and explicit bounds MUST exist.
 const originalJpeg=multi?record.originalPhoto?.image:(record?.originalPhoto?.image||record?.image);
 let fingerprint,original;
 try{
  fingerprint=await sourceFingerprint(originalJpeg,cryptoProvider);
  if(!sameOwner())return review('owner_changed');
  original=pixelFrame(await decode(originalJpeg));
  if(!sameOwner())return review('owner_changed');
 }catch{return review('source_unavailable');}
 if(multi&&(!record.cropBounds||!record.recognitionPhoto?.image||record.segmentHint?.clipped))return review('instance_unverified');
 if(multi){try{readStoredJpegBytes(record.recognitionPhoto.image);}catch{return review('instance_unverified');}}
 const regionBounds=multi?record.cropBounds:null;
 let raw;
 try{raw=originalRegionPixels(original,regionBounds);}catch{return review('region_unsafe');}
 const mask=record.instanceMask||null;
 let masked;
 try{masked=originalRegionPixels(original,regionBounds,mask);}catch{return review('mask_unsafe');}
 const pixels=raw.width*raw.height;
 const coverage=mask?Array.from(mask).reduce((s,x)=>s+x,0)/pixels:1;
 if(coverage<.08)return review('mask_too_small');
 let color;
 try{color=await colorSample(masked,{sourceRole:multi?'original-instance':'original-whole'});}
 catch{color=null;}
 if(!sameOwner())return review('owner_changed');
 const colorName=typeof color?.primary==='string'&&color.primary!=='Unknown'&&!color.needsConfirmation?color.primary:'';
 if(!colorName)return review('color_unverified');
 // Only the raw RGB/RGBA original-derived pixels are supplied to a classifier.
 // For a multi-piece frame NO full-scene classifier output can tag one item.
 let first,second;
 try{
  const role=multi?'original-instance':'original-whole';
  first=categoryAndType(await recognize(raw,{sourceRole:role,sourceVersion:fingerprint}));
  if(!sameOwner())return review('owner_changed');
  second=categoryAndType(await confirm(raw,{sourceRole:role+'-confirm',sourceVersion:fingerprint}));
  if(!sameOwner())return review('owner_changed');
 }catch{return review('classifier_unavailable',colorName);}
 if(!first||!second||first.category!==second.category)return review('category_disagreement',colorName);
 const category=first.category;
 if(multi&&Array.isArray(record.segmentHint?.categories)&&
    !record.segmentHint.categories.includes(category))return review('mask_category_disagreement',colorName);
 const agree=first.itemType!=='Unknown'&&first.itemType===second.itemType;
 // The model must have admitted BOTH independently. Critical confusing subtypes
 // also need exact corroboration; no scene-wide vote may force shorts vs skirt.
 const safeSubtype=agree&&first.strong&&second.strong;
 const itemType=safeSubtype?first.itemType:'Unknown';
 if(!first.strong&&!first.categoryConfirmed&&!second.strong&&!second.categoryConfirmed)
   return review('category_unconfirmed',colorName);
 // A cross-view subtype conflict is reviewable but broad category+color remains.
 const result={
  status:'indexed',category,itemType,color:colorName,colorSource:'original-region',
  indexingLevel:itemType==='Unknown'?'category-color':'specific-type',
  autoSaved:false, // no writing here; integration owner decides persistence
  photosTransformed:false,sourceVersion:fingerprint,
  sourceRole:multi?'original-instance':'original-whole',
  region:{width:raw.width,height:raw.height,bounds:raw.bounds},
  subtypeDisagreement:!safeSubtype&&first.itemType!==second.itemType,
  requiresTypeReview:!safeSubtype,
  pattern: first.pattern&&first.pattern===second.pattern?first.pattern:'Unknown'
 };
 if(sensitive.has(first.itemType)&&!safeSubtype)result.requiresTypeReview=true;
 return result;
}
