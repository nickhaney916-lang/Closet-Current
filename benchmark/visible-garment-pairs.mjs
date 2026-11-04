// Review-only evidence for SEPARATE, substantially visible garments in outfit
// photos. Never imported by the deployed Closet Current app.
// Hosiery/legwear is a research type, NOT yet added to the product taxonomy.
import {evaluateClearlyVisibleLayers} from './clearly-visible-layers.mjs';

const shoes=new Set(['Sneakers','Flats','Heels','Sandals','Ankle boots','Tall boots','Loafers']);
const legwear=new Set(['Socks','Knee-high socks','Stockings','Tights']);
const isSha=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const safeResult=(reason,primaryCategory,extra={})=>({
 status:'foreground-only',reason,suggestedCategories:[primaryCategory],
 secondItemVerified:false,canAutoSaveSecondItem:false,canAutoCreateInventory:false,
 productionAuthorized:false,newUserPrompts:0,noNewTabs:true,
 originalPhotoPreserved:true,independentMaskValidationRequired:true,...extra
});
function validateItem(item,sourceSha256,width,height,category,types){
 if(!item||typeof item.id!=='string'||!item.id||item.id.length>128
   ||item.sourceSha256!==sourceSha256||item.category!==category
   ||!types.has(item.itemType)||!Number.isFinite(item.confidence)
   ||item.confidence<0||item.confidence>1
   ||!(item.mask instanceof Uint8Array)||item.mask.length!==width*height)
   throw Error('Invalid or ungrounded garment pair evidence');
 let count=0,minX=width,maxX=-1,minY=height,maxY=-1;
 for(let i=0;i<item.mask.length;i++){
  const p=item.mask[i];
  if(p!==0&&p!==1&&p!==255)throw Error('Non-binary evidence mask');
  if(p===0)continue;
  const x=i%width,y=Math.floor(i/width);
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++;
 }
 return {item,count,bbox:count?{minX,maxX,minY,maxY}:null};
}
export function evaluateVisibleGarmentPair({
 sourceSha256,captureMode,width,height,primary,secondary
}){
 if(!isSha(sourceSha256)||!['single-item','full-outfit'].includes(captureMode)
   ||!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8
   ||width*height>1_000_000||!primary||typeof primary.category!=='string')
   throw Error('Invalid visible-pair source or capture context');

 // Existing outerwear/sweater behavior stays the canonical top-body rule.
 if(primary.category==='Outerwear'){
  if(secondary&&secondary.category!=='Tops')return safeResult('incompatible-layer-categories','Outerwear');
  const decision=evaluateClearlyVisibleLayers({
    sourceSha256,captureMode,width,height,coat:primary,sweater:secondary??null
  });
  return {...decision,newUserPrompts:0,noNewTabs:true,
    canAutoCreateInventory:false,internalResearchTypeOnly:false};
 }
 if(primary.category!=='Shoes')return safeResult('unsupported-primary-category',primary.category);
 const foreground='Shoes';
 // In single-item capture, treat any visible sock as incidental; the user
 // photographed the shoes, not the outfit as a whole.
 if(captureMode==='single-item')return safeResult('single-item-intent-ignores-incidental-hosiery',foreground);
 const footwear=validateItem(primary,sourceSha256,width,height,'Shoes',shoes);
 if(footwear.count===0||footwear.item.confidence<.78)
   return safeResult('shoe-evidence-not-trustworthy',foreground);
 if(!secondary)return safeResult('no-distinct-socks-or-stockings',foreground);
 if(secondary.category!=='Legwear')
   return safeResult('not-a-legwear-pair',foreground);
 const hosiery=validateItem(secondary,sourceSha256,width,height,'Legwear',legwear);
 if(hosiery.item.id===footwear.item.id||hosiery.item.confidence<.78||!hosiery.count)
   return safeResult('legwear-evidence-not-trustworthy',foreground);
 let shared=0;
 for(let i=0;i<footwear.item.mask.length;i++)if(footwear.item.mask[i]&&hosiery.item.mask[i])shared++;
 const overlapShare=shared/Math.max(1,Math.min(footwear.count,hosiery.count));
 if(overlapShare>.025)
   return safeResult('shoe-and-hosiery-claim-overlapping-fabric',foreground,{overlapShare});

 // A large sock/stocking region visible ABOVE the shoe is plausible.
 // Socks just poking out of a shoe cuff must not create an inventory item.
 // These are preliminary review gates, NOT empirically calibrated accuracy.
 const f=footwear.bbox,h=hosiery.bbox;
 const footHeight=f.maxY-f.minY+1;
 const exposureAboveFoot=Math.max(0,f.minY-h.minY);
 const xOverlap=Math.max(0,Math.min(f.maxX,h.maxX)-Math.max(f.minX,h.minX)+1);
 const fractionAligned=xOverlap/Math.max(1,Math.min(f.maxX-f.minX+1,h.maxX-h.minX+1));
 const areaRatio=hosiery.count/Math.max(1,footwear.count);
 const imageFraction=hosiery.count/(width*height);
 const metrics={exposureAboveFoot,fractionAligned,areaRatio,imageFraction,overlapShare};
 if(exposureAboveFoot<Math.max(3,.20*footHeight)||fractionAligned<.38||
    areaRatio<.10||imageFraction<.006)
  return safeResult('only-tiny-sock-cuff-or-ambiguous-stocking-visible',foreground,{metrics});

 return safeResult('substantial-visible-footwear-plus-hosiery-requires-instance-proof',
   foreground,{status:'candidate-only-visible-pair',
     suggestedCategories:['Shoes','Legwear'],suggestedTypes:[primary.itemType,secondary.itemType],
     metrics,internalResearchTypeOnly:true,
     // A pair of socks/stockings is ONE clothing item in the closet, not one
     // item per left/right leg. Nothing is saved until real mask validation.
     hosieryCatalogUnitsProposed:1
   });
}
