import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileGarmentUnits70,validateOwnerUnitDecision70} from '../public/garment-unit-reconciliation-70.mjs';
const src='original-photo-review-001';
const shoe=(x,y,{color='Blue',clipped=false,method='connected_footwear_component',itemType='Unknown',width=.13,height=.13}={})=>({
 label:'Shoes',instanceMethod:method,hint:{categories:['Shoes'],types:[],clipped},
 itemType,colorEstimate:color?{color}:null,
 cropBounds:{x,y,width,height},
 image:'data:image/jpeg;base64,SAFE_SOURCE_ONLY_NOT_REPORTED'
});
const top=(x,y)=>({label:'Upper garment',hint:{categories:['Tops'],types:[],clipped:false},cropBounds:{x,y,width:.2,height:.25},colorEstimate:{color:'White'}});
const reconcile=pieces=>reconcileGarmentUnits70(pieces,{sourceId:src});
const pairs=x=>x.proposals.filter(p=>p.status==='suggested_pair');
test('two comparable physical footwear components suggest ONE review-only pair, never owner authorization',()=>{
 const result=reconcile([shoe(.1,.72),shoe(.6,.73)]);
 assert.equal(result.detectedRegionCount,2);
 assert.equal(pairs(result).length,1);
 assert.equal(result.proposals.length,1);
 assert.equal(result.proposals[0].memberIds.length,2);
 assert.equal(result.confirmedOwnedUnits,0);
 assert.equal(result.proposals[0].saveAuthorized,false);
 assert.equal(result.source.originalSha256Verified,false);
 assert.ok(result.requiresOwnerReview);
});
test('a single isolated shoe remains visible for owner review instead of becoming an invented pair',()=>{
 const result=reconcile([shoe(.1,.72)]);
 assert.equal(result.proposals[0].status,'uncertain_requires_review');
 assert.equal(result.proposals[0].reason,'single_footwear_region');
 assert.equal(result.instances.length,1);
});
test('two shoes with different colors cannot be auto-paired',()=>{
 const result=reconcile([shoe(.1,.72),shoe(.6,.73,{color:'Red'})]);
 assert.equal(pairs(result).length,0);
 assert.equal(result.proposals[0].reason,'conflicting_colors');
});
test('mixed sneaker vs boot types must remain unresolved',()=>{
 const result=reconcile([shoe(.1,.72,{itemType:'Sneakers'}),shoe(.6,.73,{itemType:'Boots'})]);
 assert.equal(result.proposals[0].status,'uncertain_requires_review');
 assert.equal(result.proposals[0].reason,'conflicting_footwear_types');
});
test('two clippings or weakly sourced unverified regions cannot pair automatically',()=>{
 assert.equal(reconcile([shoe(.1,.72,{clipped:true}),shoe(.6,.73)]).proposals[0].reason,'clipped_component');
 assert.equal(reconcile([shoe(.1,.72,{method:'native_semantic_group'}),shoe(.6,.73)]).proposals[0].reason,'unverified_component_method');
 assert.equal(reconcile([shoe(.1,.72,{color:''}),shoe(.6,.73)]).proposals[0].reason,'color_unverified');
});
test('four footwear components do not become two guessed pairs',()=>{
 const result=reconcile([shoe(.1,.72),shoe(.3,.73),shoe(.5,.72),shoe(.7,.73)]);
 assert.equal(result.proposals[0].status,'uncertain_requires_review');
 assert.equal(result.proposals[0].reason,'multiple_footwear_regions_need_owner_pairing');
 assert.equal(result.proposals[0].memberIds.length,4);
 assert.equal(result.confirmedOwnedUnits,0);
});
test('overlapping masks, mismatched sizes and vertical offsets remain unresolved',()=>{
 assert.equal(reconcile([shoe(.1,.72),shoe(.13,.73)]).proposals[0].reason,'overlapping_regions');
 assert.equal(reconcile([shoe(.1,.72),shoe(.6,.73,{width:.03,height:.03})]).proposals[0].reason,'unequal_component_sizes');
 assert.equal(reconcile([shoe(.1,.35),shoe(.6,.73)]).proposals[0].reason,'misaligned_components');
});
test('two apparently identical-color shirts remain separate proposals, not silently collapsed',()=>{
 const result=reconcile([top(.05,.1),top(.6,.1)]);
 assert.equal(result.proposals.length,2);
 assert.ok(result.proposals.every(x=>x.status==='distinct_items'&&x.memberIds.length===1));
});
test('missing bounds preserve the region in owner review rather than dropping it',()=>{
 const result=reconcile([{label:'Shoes',hint:{categories:['Shoes']},colorEstimate:{color:'Blue'}}]);
 assert.equal(result.detectedRegionCount,1);
 assert.equal(result.instances[0].bounds,null);
 assert.equal(result.proposals[0].status,'uncertain_requires_review');
});
test('owner authorization requires exact source, explicit action and known member IDs',()=>{
 const r=reconcile([shoe(.1,.72),shoe(.6,.73)]),ids=r.instances.map(i=>i.id);
 assert.equal(validateOwnerUnitDecision70(r,{sourceId:src,action:'pair',memberIds:ids}).approved,false);
 assert.equal(validateOwnerUnitDecision70(r,{sourceId:'other',action:'pair',memberIds:ids,explicitOwnerConfirmation:true}).reason,'source_mismatch');
 assert.equal(validateOwnerUnitDecision70(r,{sourceId:src,action:'pair',memberIds:[ids[0],ids[0]],explicitOwnerConfirmation:true}).reason,'invalid_or_foreign_regions');
 assert.equal(validateOwnerUnitDecision70(r,{sourceId:src,action:'pair',memberIds:[ids[0],'another-source:region:1'],explicitOwnerConfirmation:true}).approved,false);
 assert.deepEqual(validateOwnerUnitDecision70(r,{sourceId:src,action:'pair',memberIds:ids,explicitOwnerConfirmation:true}),{
  approved:true,sourceId:src,action:'pair',memberIds:ids,saveAuthorized:false
 });
});
test('nonshoe regions are rejected as a footwear pair; fragment grouping needs 2+ selected regions',()=>{
 const r=reconcile([top(.05,.1),top(.6,.1)]),ids=r.instances.map(i=>i.id);
 assert.equal(validateOwnerUnitDecision70(r,{sourceId:src,action:'pair',memberIds:ids,explicitOwnerConfirmation:true}).reason,'pair_requires_two_footwear_regions');
 assert.equal(validateOwnerUnitDecision70(r,{sourceId:src,action:'combine_fragments',memberIds:[ids[0]],explicitOwnerConfirmation:true}).reason,'fragment_combination_requires_multiple_regions');
});
test('all observed source regions are represented exactly once and no source image bytes are emitted',()=>{
 const pieces=[shoe(.1,.72),shoe(.6,.73),top(.1,.15),top(.63,.12)];
 const result=reconcile(pieces),ids=result.proposals.flatMap(x=>x.memberIds);
 assert.equal(new Set(ids).size,pieces.length);
 assert.deepEqual([...ids].sort(),result.instances.map(x=>x.id).sort());
 assert.equal(JSON.stringify(result).includes('SAFE_SOURCE_ONLY_NOT_REPORTED'),false);
});
test('source receipt validation refuses malformed SHA or absent source ID',()=>{
 assert.throws(()=>reconcileGarmentUnits70([],{sourceId:''}),/Source ID/);
 assert.throws(()=>reconcileGarmentUnits70([],{sourceId:src,originalSha256:'bad'}),/SHA/);
 assert.equal(reconcileGarmentUnits70([],{sourceId:src,originalSha256:'b'.repeat(64)}).source.originalSha256,'b'.repeat(64));
});
