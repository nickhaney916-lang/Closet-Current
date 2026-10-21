import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLineage,score,modelPins,variants} from '../scripts/original-representation-stability.mjs';
import {packetFromLock,LOCK,LOCK_SHA,hash} from '../scripts/source-holdout-human-review.mjs';
const packet=packetFromLock(fs.readFileSync(LOCK));
// Synthetic metadata tests software only; real derivations/inference run in CI.
const lineage=()=>({schemaVersion:1,lockedManifestSha256:LOCK_SHA,modelPins:modelPins(),rows:variants.flatMap(variant=>packet.photos.map(p=>({
 id:'repr-'+p.id+'-'+variant,image:'repr-'+p.id+'-'+variant+(variant==='png-full'?'.png':'.jpg'),sourceId:p.id,variant,
 sourceSha256:p.sha256,sha256:variant==='original'?p.sha256:hash(p.id+variant),byteLength:1000,width:1000,height:1500,decodedPixelSha256:hash(p.id)
})))});
const historical=JSON.parse(fs.readFileSync('benchmark/independent-source-holdout/measurement-39538590277.json')).report.perPhoto;
const predictions=l=>l.rows.map(r=>{const h=historical.find(p=>p.id===r.sourceId);return {id:r.id,prediction:h.prediction,strong:h.strong,categoryConfirmed:h.categoryConfirmed};});
test('stored actual measurement replays every compact decision against the frozen source/model lineage',()=>{
 const m=JSON.parse(fs.readFileSync('benchmark/representation-stability/measurement.json'));
 assert.equal(hash(JSON.stringify(m.report,null,2)+'\n'),m.reportFileSha256);
 assert.equal(hash(JSON.stringify(m.lineage,null,2)+'\n'),m.lineageFileSha256);
 assert.equal(hash(JSON.stringify(m.decisions)),m.decisionProjectionSha256);
 const replay=score(m.lineage,m.decisions);
 // Projection deliberately omits raw per-inference diagnostics/timing; raw file
 // and complete-report hashes remain pinned to the downloaded Actions artifact.
 assert.deepEqual({...replay,rawResultsSha256:m.report.rawResultsSha256},m.report);
 assert.equal(m.report.measuredAccuracy,null);assert.equal(m.report.productionPromotion,'BLOCKED');
 assert.equal(m.run,39542114849);assert.equal(m.sourceCommit,'dc2684b290e7526c79e83209a7135f587bd2ca92');
});
test('complete stable diagnostic counts 13 sources separately from 39 inferences and never reports accuracy',()=>{
 const l=lineage(),r=score(l,predictions(l));assert.equal(r.sourceCount,13);assert.equal(r.inferenceCount,39);
 assert.equal(r.historicalOriginalDecisionsMatched,13);assert.equal(r.summary['png-full'].sameDecision,13);
 assert.equal(r.measuredAccuracy,null);assert.equal(r.productionPromotion,'BLOCKED');assert.equal(r.independentHumanGoldLabels,false);
});
test('changed strong category or subtype is decision drift, never proof of an incorrect prediction',()=>{
 const l=lineage(),p=predictions(l),r=p.find(x=>x.id.endsWith('0001-png-full'));
 r.prediction={category:'Shoes',type:'Flats'};const out=score(l,p);
 assert.equal(out.summary['png-full'].strongToDifferentStrong,1);assert.equal(out.summary['png-full'].typeOrCategoryChanged,1);assert.equal(out.measuredAccuracy,null);
});
test('deferred and newly strong decisions are counted separately from changed strong decisions',()=>{
 const l=lineage(),p=predictions(l);Object.assign(p.find(x=>x.id.endsWith('0001-png-full')),{prediction:{category:null,type:null},strong:false});
 Object.assign(p.find(x=>x.id.endsWith('0005-png-full')),{prediction:{category:'Dresses',type:'Casual dress'},strong:true,categoryConfirmed:false});
 const r=score(l,p);assert.equal(r.summary['png-full'].strongDeferred,1);assert.equal(r.summary['png-full'].newStrong,1);assert.equal(r.summary['png-full'].strongToDifferentStrong,0);
});
test('historical baseline drift remains visible rather than silently substituting the old baseline',()=>{
 const l=lineage(),p=predictions(l);p[0].prediction={category:'Shoes',type:'Flats'};
 const r=score(l,p);assert.equal(r.historicalOriginalDecisionsMatched,12);assert.equal(r.cases[0].original.type,'Flats');
});
test('missing, repeated, unexpected and erroring inferences cannot produce a valid stability score',()=>{
 for(const mutate of [p=>p.pop(),p=>p[1]=p[0],p=>p[0].id='unknown',p=>p[0].error='timeout']){
  const l=lineage(),p=predictions(l);mutate(p);assert.throws(()=>score(l,p));
 }
});
test('changed source, model, original bytes or pixel-altering PNG invalidates provenance',()=>{
 for(const mutate of [l=>l.lockedManifestSha256=hash('other'),l=>l.modelPins['public/local-worker.mjs']=hash('changed'),l=>l.rows[0].sha256=hash('reencoded'),l=>l.rows[13].decodedPixelSha256=hash('different pixels'),l=>l.rows[13].width=999]){
  const l=lineage();mutate(l);assert.throws(()=>validateLineage(l));
 }
});
test('missing, duplicate, unsupported and over-resized representations cannot be silently excluded',()=>{
 for(const mutate of [l=>l.rows.pop(),l=>l.rows[1]=l.rows[0],l=>l.rows[0].variant='crop',l=>l.rows[26].height=2049,l=>l.rows[26].width=999]){
  const l=lineage();mutate(l);assert.throws(()=>validateLineage(l));
 }
});
test('malformed flags and missing prediction fields fail closed',()=>{
 for(const mutate of [p=>p[0].strong='true',p=>p[0].categoryConfirmed=true,p=>delete p[0].prediction,p=>p[0].prediction={category:'Shoes',type:'Unknown'},p=>p[0].prediction={category:'Shoes',type:'Made-up type'},p=>Object.assign(p[0],{prediction:{category:'Fake category',type:'Unknown'},strong:false,categoryConfirmed:true})]){
  const l=lineage(),p=predictions(l);mutate(p);assert.throws(()=>score(l,p));
 }
});
