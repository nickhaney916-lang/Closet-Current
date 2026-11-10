/**
 * Mission 1 P791 — one taxonomy for independent HUMAN truth and for the
 * clothing types that the actual owner-reviewed native closet can save.
 * Historic "Other" and placeholder "Unknown" are not precise supported
 * subtypes. A mixed outfit is not one single-photo garment.
 *
 * This is schema validation, not evidence of human authorship, independent
 * reviewer identities, real photo rights or model recognition accuracy.
 */
import {localCandidates} from '../../public/local-catalog.mjs';

const supported=new Map();
for(const c of localCandidates){
 if(c.category==='Uncategorized'||c.itemType==='Unknown'||c.itemType==='Other')continue;
 if(!supported.has(c.category))supported.set(c.category,new Set());
 supported.get(c.category).add(c.itemType);
}
const fail=message=>{throw Error('M1_HUMAN_TAXONOMY_791: '+message);};
export function supportedHumanGarment791(category,subtype){
 return typeof category==='string'&&typeof subtype==='string'&&
  supported.get(category)?.has(subtype)===true;
}
export function enforceHumanGarment791(category,subtype){
 if(!supportedHumanGarment791(category,subtype))
  fail('exact native supported garment category and specific subtype required');
 return true;
}
export function verifySingleHumanTruth791(label){
 if(!label||!supportedHumanGarment791(label.category,label.subtype)||
    !Array.isArray(label.instances)||label.instances.length!==1||
    label.instances[0]?.category!==label.category)
  fail('single photo truth must contain EXACTLY one same-category instance; use Multiple for a photographed outfit');
 return true;
}
export function supportedHumanCategories791(){
 return Object.freeze(Object.fromEntries([...supported].map(([k,v])=>[k,Object.freeze([...v])])));
}
