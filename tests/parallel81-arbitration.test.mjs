import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localCandidates} from '../public/local-catalog.mjs';
import {observation81,arbitrate81,arbitrateInstances81} from '../public/model-arbitration-81.mjs';
const hash='a'.repeat(64);
export const binding={sourceSha256:hash,inputSha256:hash,ownerSession:'synthetic-session',photoRevision:'1',cropRevision:'whole',maskRevision:'none',unitRevision:'none',instanceId:'whole'};
const scores=type=>localCandidates.map((c,i)=>({label:c.label,score:c.itemType===type?1:0.1-i/1000}));
const obs=(key='fashionclip',type='Sneakers',b=binding)=>observation81({modelKey:key,binding:b,scores:scores(type),workerSourceSha256:hash,vectorSha256:hash,latencyMs:1});
const decide=observations=>arbitrate81({binding,observations});
test('cross family agreement remains unknown and suggestion only',()=>{const x=decide([obs(),obs('fashionSiglip')]);assert.equal(x.status,'cross_family_hypothesis');assert.equal(x.hypotheses[0].itemType,'Sneakers');assert.equal(x.itemType,'Unknown');assert.equal(x.admissionAllowed,false);assert.equal(x.requiresOwnerConfirmation,true);});
test('same model/crops never count as independent evidence',()=>{const x=decide([obs(),obs()]);assert.equal(x.independentFamilies,1);assert.equal(x.status,'abstain');});
for(const [a,b] of [['Sneakers','Ankle boots'],['Shorts','Skirt'],['Casual dress','Tunic'],['Blouse','Tunic'],['Jacket','Coat'],['T-shirt','Sweatshirt']])test(`hard confusion ${a} vs ${b} abstains`,()=>{const x=decide([obs('fashionclip',a),obs('fashionSiglip',b)]);assert.equal(x.status,'abstain');assert.equal(x.itemType,'Unknown');});
for(const key of Object.keys(binding))test(`reject ${key} swap`,()=>assert.throws(()=>decide([obs('fashionclip','Sneakers',{...binding,[key]:key.includes('Sha')?'b'.repeat(64):'changed'})]),/P81_/));
test('reject truncated, duplicate, NaN, foreign labels and forged revisions',()=>{
 for(const bad of [scores('Sneakers').slice(1),scores('Sneakers').map(x=>({...x,label:'sneakers'})),scores('Sneakers').map(x=>({...x,score:NaN}))])assert.throws(()=>observation81({modelKey:'fashionclip',binding,scores:bad,workerSourceSha256:hash,vectorSha256:hash,latencyMs:1}));
 const o=obs();o.model.revision='b'.repeat(40);assert.throws(()=>decide([o]),/MODEL_REVISION/);
});
test('negatives, poor region and missing model fail closed',()=>{assert.equal(decide([]).status,'abstain');assert.equal(decide([obs('fashionclip','Unknown'),obs('fashionSiglip','Unknown')]).status,'abstain');assert.equal(arbitrate81({binding,observations:[obs(),obs('fashionSiglip')],qualityFlags:['overlapping']}).status,'abstain');});
test('instance adapter cannot reuse whole source ranks or merge shoes',()=>{
 assert.deepEqual(arbitrateInstances81([]),[]);
 assert.throws(()=>arbitrateInstances81([{binding:{...binding,instanceId:'shoe-left'},observations:[obs()]}]),/SOURCE/);
 assert.throws(()=>arbitrateInstances81([{binding,observations:[]},{binding,observations:[]}]),/DUPLICATE/);
 const pair=['left','right'].map(instanceId=>({binding:{...binding,instanceId},observations:[]}));assert.equal(arbitrateInstances81(pair).length,2);
});
test('multi-instance list cannot combine photos or owner sessions',()=>{
 for(const key of ['ownerSession','sourceSha256','photoRevision','unitRevision'])assert.throws(()=>arbitrateInstances81([{binding,observations:[]},{binding:{...binding,instanceId:'other',[key]:key==='sourceSha256'?'b'.repeat(64):'other'},observations:[]}]),/MIXED/);
});
test('rank fusion is invariant to incompatible score scales',()=>{
 const a=obs(),b=obs('fashionSiglip');const before=decide([a,b]);b.ranking.forEach(x=>{x.score=x.score*1000-900});const after=decide([a,b]);assert.deepEqual(before.hypotheses,after.hypotheses);
});
