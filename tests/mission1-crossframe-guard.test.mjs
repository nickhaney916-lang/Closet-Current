import test from 'node:test';
import assert from 'node:assert/strict';
import {corroborateAmbiguousType} from '../public/recognition-confusion-guard.mjs';
import {localCandidates} from '../public/local-catalog.mjs';

const result=(category,itemType,extra={})=>({
 strong:true,choices:[{category,itemType,score:.95,sleeveLength:'Unknown'}],
 details:{color:'Blue'},...extra
});
const ranked=(a,b,category)=>[
 {label:localCandidates.find(x=>x.category===category&&x.itemType===a).label,score:.82},
 {label:localCandidates.find(x=>x.category===category&&x.itemType===b).label,score:.14},
 {label:localCandidates.find(x=>x.category==='Uncategorized').label,score:.04}
];
const check=async (r,setup)=>{
 const calls=[];
 const model=(name,rows)=>async(image,labels)=>{
  calls.push({name,image,labels});
  assert.ok(labels.some(x=>x.includes('room with no clothing')));
  return rows;
 };
 const x=await corroborateAmbiguousType(r,{source:'JPEG original'},{
  sourceWhole:model('whole',setup?.whole||ranked(r.choices[0].itemType,'T-shirt',r.choices[0].category)),
  sourceCenter:model('center',setup?.center||ranked(r.choices[0].itemType,'T-shirt',r.choices[0].category))
 });
 return {x,calls};
};
test('Mission1 full original-source views must both agree before a risky subtype can auto-index',async()=>{
 const r=result('Tops','Sweatshirt'),{x,calls}=await check(r);
 assert.equal(x.strong,true);assert.equal(x.choices[0].itemType,'Sweatshirt');
 assert.equal(x.diagnostics.mission1CrossFrame.verified,true);
 assert.equal(x.diagnostics.mission1CrossFrame.independentHumanEvidence,false);
 assert.equal(calls.length,2);assert.strictEqual(calls[0].image,calls[1].image);
});
test('Mission1 full-source disagreement blocks risky auto save and strips guessed details',async()=>{
 const r=result('Tops','Sweatshirt'),{x,calls}=await check(r,{
  whole:ranked('T-shirt','Sweatshirt','Tops')});
 assert.equal(x.strong,false);assert.equal(x.categoryConfirmed,true);
 assert.equal(x.choices[0].category,'Tops');assert.equal(x.choices[0].itemType,'Unknown');
 assert.deepEqual(x.details,{});
 assert.equal(x.diagnostics.mission1CrossFrame.reason,'original_source_disagreement');
 assert.equal(calls.length,1);
});
test('Mission1 second original-source frame disagreeing cannot approve subtype',async()=>{
 const r=result('Shoes','Ankle boots'),{x,calls}=await check(r,{
  whole:ranked('Ankle boots','Sneakers','Shoes'),
  center:ranked('Sneakers','Ankle boots','Shoes')});
 assert.equal(x.strong,false);assert.equal(x.categoryConfirmed,true);
 assert.equal(x.diagnostics.mission1CrossFrame.sourceFramesCompared,2);
 assert.equal(calls.length,2);
});
test('Mission1 source runtime failure is manual review instead of a stale accepted identity',async()=>{
 const r=result('Outerwear','Blazer');
 const x=await corroborateAmbiguousType(r,{},{
  sourceWhole:async()=>{throw Error('test data/private credentials');},
  sourceCenter:async()=>[]});
 assert.equal(x.strong,false);assert.equal(x.choices[0].itemType,'Unknown');
 assert.equal(x.diagnostics.mission1CrossFrame.reason,'verification_unavailable');
 assert.ok(!JSON.stringify(x).includes('private credentials'));
});
test('Mission1 unrelated category/type remains untouched and incurs no costly extra model pass',async()=>{
 let count=0;
 for(const item of [result('Bottoms','Jeans'),result('Dresses','Formal dress'),
  result('Shoes','Tall boots'),{strong:false,choices:[]}]) {
  const x=await corroborateAmbiguousType(item,{},{
   sourceWhole:async()=>{count++;throw Error('no');},
   sourceCenter:async()=>{count++;throw Error('no');}});
  assert.strictEqual(x,item);
 }
 assert.equal(count,0);
});
test('Mission1 suspicious subtype cannot auto-index without two real source-view models',async()=>{
 const r=result('Tops','Tunic');
 for(const setup of [{},{sourceWhole:async()=>[]},{sourceCenter:async()=>[]}]){
  const x=await corroborateAmbiguousType(r,{},setup);
  assert.equal(x.strong,false);
  assert.equal(x.categoryConfirmed,true);
  assert.equal(x.choices[0].itemType,'Unknown');
 }
});
test('Mission1 malformed, weak and negative prompts never establish independent agreement',async()=>{
 const r=result('Outerwear','Blazer');
 const first=await check(r,{whole:[
  {label:localCandidates.find(x=>x.category==='Uncategorized').label,score:.7},
  ...ranked('Blazer','Jacket','Outerwear')]});
 assert.equal(first.x.strong,false);
 const second=await check(r,{
  whole:[{label:localCandidates.find(x=>x.itemType==='Blazer').label,score:.49},
   {label:localCandidates.find(x=>x.itemType==='Jacket').label,score:.45}]});
 assert.equal(second.x.strong,false);
});
