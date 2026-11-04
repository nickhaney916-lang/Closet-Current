// Experimental multi-garment segmentation registry, not a product classifier.
// SegFormer class 4 merges shirts AND outerwear. Class 6 merges pants AND shorts.
// These labels cannot justify catalog subtypes without a separate classifier.
import {selectedCategoryMask} from './clothing-only-comparison.mjs';

export const PART_REGISTRY=Object.freeze([
  Object.freeze({slot:'upper',category:'Upper garment',classId:4,unresolved:['Tops','Outerwear']}),
  Object.freeze({slot:'skirt',category:'Skirt',classId:5,unresolved:[]}),
  Object.freeze({slot:'pants-or-shorts',category:'Pants',classId:6,unresolved:['Pants','Shorts']}),
  Object.freeze({slot:'dress',category:'Dresses',classId:7,unresolved:[]}),
  Object.freeze({slot:'shoes',category:'Shoes',classId:9,unresolved:[]})
]);

export function partitionOutfitClothing(map,{minimumPixels=12,minimumConfidence=.75,expected=[]}={}){
  if(!map||!Number.isInteger(minimumPixels)||minimumPixels<1
     ||!Number.isFinite(minimumConfidence)||minimumConfidence<0||minimumConfidence>1
     ||!Array.isArray(expected)||expected.some(e=>typeof e!=='string'))
    throw Error('Invalid outfit partition inputs');
  if(new Set(expected).size!==expected.length)throw Error('Duplicate expected garments');
  const parts=[],missing=[],issues=[];
  const classes=PART_REGISTRY.map(p=>p.category);
  for(const part of PART_REGISTRY){
    const result=selectedCategoryMask(map,part.category,{minimumPixels});
    if(result.detected&&result.meanConfidence>=minimumConfidence){
      let minX=map.width,minY=map.height,maxX=-1,maxY=-1;
      for(let i=0;i<result.alpha.length;i++)if(result.alpha[i]){
        minX=Math.min(minX,i%map.width);maxX=Math.max(maxX,i%map.width);
        minY=Math.min(minY,Math.floor(i/map.width));maxY=Math.max(maxY,Math.floor(i/map.width));
      }
      parts.push({slot:part.slot,category:part.category,classId:part.classId,
        pixels:result.foregroundPixels,confidence:result.meanConfidence,
        bbox:{left:minX,top:minY,right:maxX+1,bottom:maxY+1},
        subtypeResolved:part.unresolved.length===0,possibleSubtypes:[...part.unresolved],
        garmentOnlyVerified:false,maskAccuracyMeasured:false});
    }
  }
  const hasSlot=slot=>parts.some(p=>p.slot===slot);
  if(expected.includes('Tops')&&expected.includes('Outerwear')){
    issues.push('shirt-and-jacket-share-one-semantic-class');
  }
  if(expected.includes('Pants')&&expected.includes('Shorts')){
    issues.push('pants-and-shorts-share-one-semantic-class');
  }
  for(const garment of expected){
    const group=garment==='Tops'||garment==='Outerwear'?'upper':
      garment==='Pants'||garment==='Shorts'?'pants-or-shorts':
      garment==='Skirt'||garment==='Skirts'?'skirt':
      garment==='Dresses'?'dress':garment==='Shoes'?'shoes':null;
    if(!group)issues.push('unsupported-expected-garment:'+garment);
    else if(!hasSlot(group))missing.push(garment);
  }
  if(parts.length===0)issues.push('no-reliable-target-region');
  if(missing.length)issues.push('expected-garment-not-detected');
  const oneClassPerSlot=parts.length===new Set(parts.map(p=>p.classId)).size;
  if(!oneClassPerSlot)throw Error('Duplicate semantic masks');
  const totalClassPixels=parts.reduce((a,p)=>a+p.pixels,0);
  return {parts,missing,issues,classes,semanticClassesDistinct:oneClassPerSlot,
    totalClassPixels,sourcePreserved:true,automaticCatalogApproved:false,
    referenceMaskAvailable:false,individualOutfitLayersVerified:false,
    requiresIndependentReview:true};
}
