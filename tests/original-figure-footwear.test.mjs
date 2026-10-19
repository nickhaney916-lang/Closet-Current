import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkProceduralFootwear} from '../benchmark/figure-creation/footwear-contract.mjs';
function candidate(){return {footwearGeometry:'procedural-rounded-upper-contoured-outsole-three-laces-per-shoe',shoeUpperCount:2,shoeOutsoleCount:2,shoeLaceStrokeCount:6,blockPrimitiveFootwear:false,visualApproved:false,commercialProductApproval:false};}
test('each fixed adult candidate requires two ORIGINAL rounded shoe uppers and a distinct outsole',()=>{
 for(const id of ['female','male']){const x={...candidate(),id};const evidence=checkProceduralFootwear(x);
  assert.equal(evidence.actualScenePartCountsVerified,true);
  assert.equal(evidence.commercialProductApproved,false);
  assert.equal(evidence.photorealismVerified,false);}
});
test('a single or missing shoe, missing outsole, omitted laces or block primitives cannot be misreported as complete',()=>{
 for(const mutator of [x=>x.shoeUpperCount=1,x=>x.shoeOutsoleCount=1,x=>x.shoeLaceStrokeCount=0,
  x=>x.blockPrimitiveFootwear=true,x=>x.footwearGeometry='primitive_cube_add',
  x=>x.commercialProductApproval=true,x=>x.visualApproved=true]){
  const x=candidate();mutator(x);assert.throws(()=>checkProceduralFootwear(x));}
});
test('Python renderer has no block foot cubes, pins exactly two fixed figures and preserves original scene rights',()=>{
 const source=fs.readFileSync('scripts/create-local-figures.py','utf8');
 const recipe=JSON.parse(fs.readFileSync('benchmark/figure-creation/recipe.json','utf8'));
 assert.deepEqual(recipe.figures,['female','male']);
 assert.ok(source.includes('shoe_surface(kind'));
 assert.ok(source.includes('foot_profile='));
 assert.ok(source.includes('shoe_count!=2 or lace_count!=6'));
 assert.ok(!source.includes('primitive_cube_add'));
 assert.match(source,/leg_motion>1e-6/);
 assert.match(source,/Source\/license hash mismatch/);
 assert.ok(!/customer|https:\/\/|FASHN|openai\.com/i.test(source));
});
