// Map actual generated region descriptions, never source IDs/expected labels.
const RULES=[
 ['Dresses',/\b(dress|dresses|gown|jumpsuit|romper)\b/i],
 ['Outerwear',/\b(coat|jacket|blazer|cardigan|raincoat|vest)\b/i],
 ['Bottoms',/\b(pants|trousers|jeans|shorts|skirt|leggings|joggers)\b/i],
 ['Shoes',/\b(shoes?|sneakers?|boots?|sandals?|heels?|loafers?|footwear)\b/i],
 ['Tops',/\b(shirt|t[ -]?shirt|blouse|sweatshirt|sweater|hoodie|tunic|top)\b/i],
 ['Accessories',/\b(hat|cap|bag|handbag|belt|scarf|sunglasses|glasses|tie|watch)\b/i]
];
export function describeRegion67(label){
 if(typeof label!=='string'||!label.trim()||label.length>1500)throw Error('Invalid generated description');
 const categories=RULES.filter(([,pattern])=>pattern.test(label)).map(([category])=>category);
 if(!categories.length)return {category:null,itemType:'Unknown',requiresReview:true,reason:'no_garment_description'};
 // A whole-person phrase naming several garments is not one isolated item.
 if(categories.length!==1||/\b(person|mannequin|woman|man|girl|boy|people)\b/i.test(label))return {category:null,itemType:'Unknown',requiresReview:true,reason:'ambiguous_region_description'};
 let itemType='Unknown';
 const subtypes=[['T-shirt',/\bt[ -]?shirt\b/i],['Sweatshirt',/\bsweatshirt\b/i],['Blouse',/\bblouse\b/i],['Tunic',/\btunic\b/i],['Sneakers',/\bsneakers?\b/i],['Ankle boots',/\bankle boots?\b/i],['Tall boots',/\b(knee.high|tall) boots?\b/i],['Skirt',/\bskirt\b/i],['Jeans',/\bjeans\b/i],['Trousers',/\btrousers\b/i],['Shorts',/\bshorts\b/i]];
 const matches=subtypes.filter(([,pattern])=>pattern.test(label));if(matches.length===1)itemType=matches[0][0];
 return {category:categories[0],itemType,requiresReview:true,reason:itemType==='Unknown'?'specific_subtype_not_established':'generated_description_requires_review'};
}
export function boxIoU67(a,b){
 const intersection=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
 const union=(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-intersection;
 return union>0?intersection/union:0;
}
export function mergeReferenceRegions67(outputs,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Error('Invalid original dimensions');
 const regions=[],ignored=[];
 for(const {stage,labels,bboxes}of outputs){
  if(!Array.isArray(labels)||!Array.isArray(bboxes)||labels.length!==bboxes.length)throw Error('Malformed actual detector output');
  for(let i=0;i<labels.length;i++){
   const box=bboxes[i];if(!Array.isArray(box)||box.length!==4||box.some(x=>!Number.isFinite(x))||box[2]<=box[0]||box[3]<=box[1]||box[0]<0||box[1]<0||box[2]>width||box[3]>height)throw Error('Invalid original-coordinate detection');
   const description=describeRegion67(labels[i]);
   if(!description.category){ignored.push({stage,label:labels[i],box,reason:description.reason});continue;}
   const same=regions.find(x=>x.category===description.category&&boxIoU67(x.box,box)>=.85);
   if(same){same.evidence.push({stage,label:labels[i],box});continue;}
   regions.push({...description,label:labels[i],box,evidence:[{stage,label:labels[i],box}],strong:false});
  }
 }
 return {regions,ignored};
}
