import {CATEGORIES} from './p75-dataset-core.mjs';

const subtypes=CATEGORIES.Shoes.filter(type=>type!=='Other');
const lookalike='Nonwearable look-alike';
const partitions=['development','blind'];

// Input comes only from the authenticated, offline review audit.
export function footwearCoverage(reviewed){
 const counts=Object.fromEntries(partitions.map(split=>[split,Object.fromEntries(
  [...subtypes,lookalike].map(type=>[type,0]))]));
 const publishers=new Map(),objectIds=new Set(),groupsByType=new Map();
 const profiles=new Set(),issues=new Set();
 for(const {source,labels} of reviewed){
  const {split,sourceGroupId,publisherGroupId}=source;
  const type=labels.presence==='nonclothing'&&labels.shoeShapedNonwearable===true
   ?lookalike
   :labels.category==='Shoes'&&['single-garment','multiple-garments'].includes(labels.presence)&&
     ['single-unit','matching-pair'].includes(labels.wardrobeUnit)?labels.subtype:null;
  if(!partitions.includes(split)||!Object.hasOwn(counts[split],type)){
   issues.add('unsupported, ambiguous, or mixed footwear label');continue;
  }
  if(!sourceGroupId||!publisherGroupId){
   issues.add('missing signed publisher or physical object group');continue;
  }
  if(objectIds.has(sourceGroupId)){
   issues.add('repeated physical object group');continue;
  }
  objectIds.add(sourceGroupId);
  if(publishers.has(publisherGroupId)&&publishers.get(publisherGroupId)!==split)
   issues.add('publisher group crosses development and blind');
  publishers.set(publisherGroupId,split);
  if(!groupsByType.has(type))groupsByType.set(type,new Set());
  groupsByType.get(type).add(publisherGroupId);
  counts[split][type]++;
  if(type==='Sneakers')profiles.add(labels.footwearProfile);
 }
 for(const split of partitions){
  if(Object.values(counts[split]).some(n=>n<10))issues.add('fewer than 10 objects per class in a partition');
 }
 if(subtypes.some(type=>(groupsByType.get(type)?.size||0)<3))
  issues.add('fewer than three publisher groups for a subtype');
 if(!profiles.has('low-top')||!profiles.has('high-top'))issues.add('missing low-top or high-top sneakers');
 return {ready:issues.size===0,counts,issues:[...issues].sort()};
}
