/** P862 source-executing safety regression. Synthetic scores, NOT accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyIsolatedGarment} from '../public/recognition-engine.mjs';
import {corroborateAmbiguousType} from '../public/recognition-confusion-guard.mjs';
import {readFile} from 'node:fs/promises';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';

const image={width:50,height:50};
const hint=category=>({categories:[category],types:[],confidence:.98,clipped:false});
const score=(label,near)=>async()=>[
  {label,score:.87},{label:near,score:.08},
  {label:'a blurry image with no identifiable garment',score:.05}
];
test('P862 actual hinted subtype vs mask-only Unknown have different review/strong semantics',async()=>{
 const known=[];
 const good=await classifyIsolatedGarment(score('sneakers','ankle boots'),image,{
  hint:hint('Shoes'),onIdentified:choice=>known.push(choice.itemType)});
 assert.equal(good.strong,true);
 assert.equal(good.choices[0].itemType,'Sneakers');
 assert.deepEqual(known,['Sneakers']);

 const unknown=[];
 const partial=await classifyIsolatedGarment(async()=>[
  {label:'a blank wall',score:.9},{label:'a blurry image with no identifiable garment',score:.1}
 ],image,{hint:hint('Shoes'),onIdentified:choice=>unknown.push(choice)});
 assert.equal(partial.strong,false,'mask alone cannot certify a subtype');
 assert.equal(partial.categoryConfirmed,true);
 assert.equal(partial.categoryOnly,true);
 assert.equal(partial.choices[0].itemType,'Unknown');
 assert.equal(partial.reason,'mask_category_type_review');
 assert.deepEqual(unknown,[],'no provisional identified message');
});
test('P862 marked-high-risk class from actual isolated classifier must lose automatic admission',async()=>{
 for(const [category,label,runner] of [
  ['Tops','a sweatshirt','a T-shirt'],
  ['Tops','a tunic','a blouse'],
  ['Outerwear','a blazer','a jacket'],
  ['Shoes','ankle boots','sneakers']
 ]){
  const result=await classifyIsolatedGarment(score(label,runner),image,{hint:hint(category)});
  assert.equal(result.strong,true,category+' initial model suggestion');
  const risk=await corroborateAmbiguousType(result);
  assert.equal(risk.strong,false);
  assert.equal(risk.categoryConfirmed,true);
  assert.equal(risk.choices[0].category,category);
  assert.equal(risk.choices[0].itemType,'Unknown');
  assert.equal(risk.diagnostics.mission1SubtypeSafety.ownerSubtypeReviewRequired,true);
 }
});
test('P862 malformed/high-risk/hinted results do not weaken original research release gate',async()=>{
 const [worker,app,report]=await Promise.all([
  readFile('public/local-worker.mjs','utf8'),
  readFile('public/app.js','utf8'),
  readFile('research/mission1-segmented-subtype-review-862/REPORT.md','utf8')
 ]);
 assert.match(worker,/if\(result\.strong\)\{/);
 assert.doesNotMatch(worker,/if\(!request\.hint&&result\.strong\)/);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(report,/Family Alpha HOLD #255 OPEN/);
 const gate=evaluateMission1Evidence(null);
 assert.equal(gate.status,'BLOCKED');
 assert.equal(gate.shouldLiftFamilyAlphaHold,false);
});
