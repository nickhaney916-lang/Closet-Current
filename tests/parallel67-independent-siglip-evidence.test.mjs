import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 P67_MODEL,P67_REVISION,P67_FASHION_MODEL,P67_FASHION_REVISION,P67_ALLOWED_MODELS,P67_LABELS,rankIndependentSiglip67,evaluateIndependentSiglip67
} from '../scripts/parallel67-independent-siglip-scoring.mjs';

const manifest=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
const all=()=>P67_LABELS.map(label=>({label,score:.05}));
function prediction(label){
 const rows=all(),target=rows.find(x=>x.label===label);
 if(!target)throw Error('No known candidate '+label);
 target.score=.88;return rankIndependentSiglip67(rows);
}
function generated(){
 return manifest.map(row=>({
  id:row.id,expectedCategory:row.expectedCategory,expectedType:row.expectedType,
  sourceShaVerified:true,
  ...prediction(row.expectedCategory==='Uncategorized'?'a blank wall':
   row.expectedCategory==='Tops'?'a T-shirt':
   row.expectedCategory==='Bottoms'?'a skirt':
   row.expectedCategory==='Dresses'?'a casual dress':
   row.expectedCategory==='Outerwear'?'a jacket':'sneakers'),
  error:null
 }));
}
test('P67 independent pretrained model selection is pinned, not secretly replacing FashionCLIP',()=>{
 assert.equal(P67_MODEL,'Xenova/siglip-base-patch16-224');
 assert.match(P67_REVISION,/^[a-f0-9]{40}$/);
 assert.equal(new Set(P67_LABELS).size,P67_LABELS.length);
 assert.ok(P67_LABELS.includes('a T-shirt')&&P67_LABELS.includes('a sweatshirt'));
 assert.ok(P67_LABELS.includes('ankle boots')&&P67_LABELS.includes('sneakers'));
});
test('P67 unique closed-catalog model ranking records sigmoid scores without granting automatic-save permission',()=>{
 const p=prediction('a T-shirt');
 assert.deepEqual(p.top,{category:'Tops',type:'T-shirt',score:.88});
 assert.equal(p.admissionAllowed,false);
 assert.equal(p.scoreMeaning,'uncalibrated-sigmoid-ranking-only');
 assert.equal(p.topThree.length,3);
 assert.equal(p.categoryRank.includes('Dresses'),true);
});
test('P67 rejects duplicate, missing, foreign, NaN, infinity and impossible score output',()=>{
 const variants=[
  x=>x.pop(),x=>x.push({...x[0]}),
  x=>x[0].label='PRIVATE_FILENAME_TOKEN',
  x=>x[0].score=NaN,x=>x[0].score=Infinity,
  x=>x[0].score=-1,x=>x[0].score=1.1,
 ];
 for(const mutate of variants){const rows=all();mutate(rows);assert.throws(()=>rankIndependentSiglip67(rows),/P67:/);}
});
test('P67 preserves all 16 original source IDs and distinguishes forced top1 from accepted predictions',()=>{
 const score=evaluateIndependentSiglip67(manifest,generated());
 assert.equal(score.originalCount,16);
 assert.equal(score.garments,13);
 assert.equal(score.negatives,3);
 assert.equal(score.runtimeErrors,0);
 assert.equal(score.automaticSaveAdmissionAllowed,false);
 assert.equal(score.developerExposedNotBlind,true);
 assert.equal(score.byCategory.Dresses.n,2);
 assert.equal(score.rows.find(r=>r.truthCategory==='Uncategorized').categoryOnly,true);
 assert.ok(!JSON.stringify(score).includes('PRIVATE'));
});
test('P67 source SHA/inference/error and class truth fail closed on malicious or reordered receipts',()=>{
 for(const mutate of [
  r=>r.pop(),
  r=>r.reverse(),
  r=>r[0].sourceShaVerified=false,
  r=>r[0].expectedCategory='Dresses',
  r=>r[0].top.category='PRIVATE_OWNER',
  r=>r[0].admissionAllowed=true,
  r=>r[0].categoryRank='PRIVATE',
  r=>r[0].error='PRIVATE_IMAGE_BASE64',
  r=>{r[0].error='runtime';r[0].top={category:'Tops',type:'T-shirt',score:.99};}
 ]){
  const rows=generated();mutate(rows);
  assert.throws(()=>evaluateIndependentSiglip67(manifest,rows),/P67:/);
 }
});
test('P67 failure reports no confidence, never counts skipped source as correct, and remains photo-free',()=>{
 const rows=generated(),first=rows[0];
 rows[0]={id:first.id,expectedCategory:first.expectedCategory,expectedType:first.expectedType,
  sourceShaVerified:true,top:null,runnerUp:null,scoreGap:null,categoryRank:[],error:'runtime',
  admissionAllowed:false,scoreMeaning:'uncalibrated-sigmoid-ranking-only'};
 const score=evaluateIndependentSiglip67(manifest,rows);
 assert.equal(score.runtimeErrors,1);
 assert.equal(score.rows[0].categoryTop1Correct,false);
 assert.equal(score.rows[0].subtypeTop1Correct,false);
 assert.ok(!JSON.stringify(score).includes('data:image/jpeg'));
});

test('P67-02 only source-pinned distinct original and fashion-specific SigLIP permitted',()=>{
 assert.equal(P67_FASHION_MODEL,'Marqo/marqo-fashionSigLIP');
 assert.match(P67_FASHION_REVISION,/^[a-f0-9]{40}$/);
 assert.notEqual(P67_MODEL,P67_FASHION_MODEL);
 assert.notEqual(P67_REVISION,P67_FASHION_REVISION);
 assert.equal(Object.keys(P67_ALLOWED_MODELS).length,2);
 const rows=generated();
 const candidate=evaluateIndependentSiglip67(manifest,rows,{model:P67_FASHION_MODEL,revision:P67_FASHION_REVISION});
 assert.equal(candidate.model,P67_FASHION_MODEL);
 assert.equal(candidate.revision,P67_FASHION_REVISION);
 assert.equal(candidate.automaticSaveAdmissionAllowed,false);
 assert.deepEqual(candidate.rows.map(x=>x.id),manifest.map(x=>x.id));
 for(const args of [
  {model:'PRIVATE_UNTRUSTED_FASHION',revision:P67_FASHION_REVISION},
  {model:P67_FASHION_MODEL,revision:P67_REVISION},
  {model:P67_FASHION_MODEL,revision:'main'},
  {model:P67_FASHION_MODEL,revision:'PRIVATE_OWNER_ID'}
 ])assert.throws(()=>evaluateIndependentSiglip67(manifest,rows,args),/unsupported unpinned/);
});
