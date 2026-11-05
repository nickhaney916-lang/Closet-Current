import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const annotationRows=JSON.parse(readFileSync('research/multi-review-triage-28/frozen-photo-annotations-16.json','utf8'));
const lockedRows=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));

test('SEG53 fixture cohort is public, SHA-locked, and split before the run',async()=>{
 const eligible=[];
 for(const row of annotationRows){
  const locked=lockedRows.find(x=>x.id===row.id);
  if(!locked||!locked.verified)continue;
  let bytes;try{bytes=await readFile('benchmark/fixtures/'+row.id+'.jpg')}catch{continue}
  if(sha(bytes)!==locked.sha256)continue;
  const image=await sharp(bytes).metadata();
  assert.equal(image.format,'jpeg');
  assert.ok(locked.attribution?.license);
  assert.ok(['development','held-out'].includes(row.split));
  assert.ok(row.regions.length>0);
  eligible.push(row);
 }
 assert.equal(eligible.length,15);
 assert.equal(eligible.filter(x=>x.split==='development').length,7);
 assert.equal(eligible.filter(x=>x.split==='held-out').length,8);
 assert.equal(eligible.reduce((n,x)=>n+x.regions.length,0),24);
});

test('SEG53 run uses pinned actual SegFormer inference and keeps the evaluation research-only',()=>{
 const script=readFileSync('scripts/verify-real-segformer-masks-31.mjs','utf8');
 const worker=readFileSync('research/real-mask-evidence-31/worker.mjs','utf8');
 assert.match(script,/AutoModel|modelMask/);
 assert.match(worker,/AutoModelForSemanticSegmentation/);
 assert.match(worker,/Xenova\/segformer_b0_clothes/);
 assert.match(worker,/a2489ea8e7ec1ee912190546bad31a4906ccca76/);
 assert.match(worker,/modelLoadMs/);
 assert.match(worker,/inferenceMs/);
 assert.match(script,/routePinnedModelAsset/);
 assert.match(script,/failedStage/);
 assert.match(script,/Evidence report written, but model\/network\/browser acceptance contains recorded failures/);
 assert.match(script,/maskPixelMembershipConserved/);
 assert.match(script,/scientificVerdict:'NEEDS REWORK'/);
 for(const token of ['localStorage','indexedDB','supabase','.insert(','.upsert(','.delete('])
  assert.ok(!worker.includes(token),'the research worker must not write private closet state');
});

test('SegFormer proposals remain reviewed semantic regions; instance, subtype, and color accuracy are not fabricated',()=>{
 const report=readFileSync('scripts/verify-real-segformer-masks-31.mjs','utf8');
 assert.match(report,/allSuggestionsRequireReview:true/);
 assert.match(report,/learnedInstanceModelUsed:false/);
 assert.match(report,/touchingSameClassGarmentsSeparatelyIdentifiable:false/);
 assert.match(report,/broadCategoryAccuracy:null/);
 assert.match(report,/subtypeAccuracy:null/);
 assert.match(report,/colorAccuracy:null/);
 assert.match(report,/independentBlindAnnotators:0/);
 assert.match(report,/physicalDeviceMemoryBytes:null/);
 assert.match(report,/fullClosetAppFlowTested:false/);
});
