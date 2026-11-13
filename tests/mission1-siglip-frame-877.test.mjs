/** P877 synthetic source-custody and comparison arithmetic. Not real photograph accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {localCandidates} from '../public/local-catalog.mjs';
import {observation81} from '../public/model-arbitration-81.mjs';
import {analyzeFrame877} from '../scripts/p877-siglip-full-frame-audit.mjs';
const binding={sourceSha256:'a'.repeat(64),inputSha256:'b'.repeat(64),
 ownerSession:'owner-research-fixture',photoRevision:'photo-research-fixture',
 cropRevision:'crop-research-fixture',maskRevision:'mask-research-fixture',
 unitRevision:'unit-research-fixture',instanceId:'garment-research-fixture'};
const hash='d'.repeat(64),vec='c'.repeat(64);
const scores=(win)=>localCandidates.map((c,i)=>({label:c.label,score:c.itemType===win?1:(localCandidates.length-i)/1000}));
const row=(id,historical,baseline,alternate)=>{
 const clip=observation81({modelKey:'fashionclip',binding,scores:scores(baseline),workerSourceSha256:hash,vectorSha256:vec,latencyMs:1});
 const siglip=observation81({modelKey:'fashionSiglip',binding,scores:scores(baseline),workerSourceSha256:hash,vectorSha256:vec,latencyMs:2});
 const alt=observation81({modelKey:'fashionSiglip',binding,scores:scores(alternate),workerSourceSha256:hash,vectorSha256:vec,latencyMs:3});
 return {id,sourceSha256:hash,historicalExpectation:{category:localCandidates.find(x=>x.itemType===historical).category,itemType:historical},
  output:{automaticAdmissions:0,sourceCodeSha256:hash,observations:[clip,siglip],
   experiment877:{schema:'p877-optional-full-frame-v1',modelKey:'fashionSiglip',mode:'fitWholePhoto224-white',
    sameModelNotIndependent:true,sourceCodeSha256:hash,vectorSha256:vec,inputSha256:binding.inputSha256,extraMs:3,ranking:alt.ranking}}};
};
const fixture=()=>{
 const rows=[row('commons-0035','Skirt','Shorts','Skirt'),row('commons-0078','Sneakers','Sneakers','Ankle boots')];
 return {summary:{status:'PUBLIC_DEVELOPMENT_ONLY',blindAccuracy:null,physicalDevices:0,photos:2,rawTop1:{fashionSiglip:{exactSubtypeMatches:1}}},rows};
};
test('P877 frozen alternate framing counts both a gain and a loss without promotion',()=>{
 const {summary,rows}=analyzeFrame877(fixture(),{expectedRows:2});
 assert.equal(summary.baselineExactHistoricalStrings,1);
 assert.equal(summary.alternateExactHistoricalStrings,1);
 assert.deepEqual(summary.gains,['commons-0035']);
 assert.deepEqual(summary.losses,['commons-0078']);
 assert.equal(summary.changedSubtypeFirstRanks,2);
 assert.equal(summary.researchOnly,true);
 assert.equal(summary.modelPromoted,false);
 assert.equal(summary.blindAccuracy,null);
 assert.equal(summary.releaseReady,false);
 assert.equal(rows[1].samePinnedSiglipWeights,true);
});
test('P877 keeps improvement on a real garment separate from a non-clothing abstention',()=>{
 const data=fixture();
 data.rows.push(row('commons-0090','Unknown','T-shirt','Unknown'));
 data.summary.photos=3;
 const {summary}=analyzeFrame877(data,{expectedRows:3});
 assert.equal(summary.historicalGarmentRows,2);
 assert.equal(summary.historicalNegativeRows,1);
 assert.equal(summary.garmentSubtypeHistoricalMatchesBaseline,1);
 assert.equal(summary.garmentSubtypeHistoricalMatchesAlternate,2);
 assert.equal(summary.negativeClassHistoricalMatchesBaseline,0);
 assert.equal(summary.negativeClassHistoricalMatchesAlternate,1);
 assert.equal(summary.baselineExactHistoricalStrings,1);
 assert.equal(summary.alternateExactHistoricalStrings,3);
 assert.deepEqual(summary.gains,['commons-0035','commons-0090']);
 assert.equal(summary.blindAccuracy,null);
 assert.equal(summary.modelPromoted,false);
});
test('P877 refuses a different source or stale alternate input hash',()=>{
 const data=fixture();data.rows[0].output.experiment877.inputSha256='0'.repeat(64);
 assert.throws(()=>analyzeFrame877(data,{expectedRows:2}),/P877_ALTERNATE_SOURCE_PROVENANCE/);
});
test('P877 refuses missing, duplicate, or category-changed candidate label',()=>{
 const data=fixture();data.rows[0].output.experiment877.ranking[0].category='Shoes';
 assert.throws(()=>analyzeFrame877(data,{expectedRows:2}),/P877_SCORES_OR_TAXONOMY/);
 const next=fixture();next.rows[0].output.experiment877.ranking[1]=next.rows[0].output.experiment877.ranking[0];
 assert.throws(()=>analyzeFrame877(next,{expectedRows:2}),/P877_SCORES_OR_TAXONOMY/);
});
test('P877 refuses truncated photo cohort and missing source witness',()=>{
 const data=fixture();
 assert.throws(()=>analyzeFrame877(data,{expectedRows:48}),/P877_COHORT_COUNT/);
 assert.throws(()=>analyzeFrame877(data,{expectedRows:2,hardPhotoId:'commons-9999'}),/P877_HARD_SOURCE_MISSING/);
});
test('P877 refuses absent alternate proof or promoted automatic admission',()=>{
 const a=fixture();a.rows[0].output.experiment877=null;
 assert.throws(()=>analyzeFrame877(a,{expectedRows:2}),/P877_EXPERIMENT_ORIGIN/);
 const b=fixture();b.rows[1].output.automaticAdmissions=1;
 assert.throws(()=>analyzeFrame877(b,{expectedRows:2}),/P877_NO_ADMISSION_OR_WORKER/);
});
