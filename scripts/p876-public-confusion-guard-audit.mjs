/** P876 source-locked DEVELOPMENT rank coverage only. No truth labels or calibration. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sharedRankChoices82} from '../public/dual-panel-82.mjs';
import {subtypeNeedsManualReview} from '../public/recognition-confusion-guard.mjs';
const input=process.argv[2]||'benchmark/p876-real-chromium/results.json';
const output=process.argv[3]||'benchmark/p876-real-chromium/risk-coverage.json';
const data=JSON.parse(await readFile(input,'utf8'));
assert.equal(data.summary?.status,'PUBLIC_DEVELOPMENT_ONLY');
assert.equal(data.summary?.blindAccuracy,null);
assert.equal(data.summary?.physicalDevices,0);
assert.ok(Array.isArray(data.rows)&&data.rows.length===data.summary.photos);
const rows=data.rows.map(r=>{
 assert.match(r.sourceSha256,/^[a-f0-9]{64}$/);
 assert.equal(r.output?.observations?.length,2);
 const [a,b]=r.output.observations;
 assert.deepEqual(new Set([a.modelKey,b.modelKey]),new Set(['fashionclip','fashionSiglip']));
 // Exact P875 top-five, category-matched shortlist before the empirical risk veto.
 const blocked=['nonclothing_evidence','top_rank_tied','category_disagreement'].some(x=>r.decision.reasons.includes(x));
 const initial=!blocked&&a.ranking[0]?.category===b.ranking[0]?.category?
  r.decision.hypotheses.filter(h=>h.category===a.ranking[0].category&&a.ranking.slice(0,5).some(x=>x.label===h.label)&&b.ranking.slice(0,5).some(x=>x.label===h.label)):[];
 const current=sharedRankChoices82(r.decision,r.output.observations);
 assert.ok(current.every(x=>initial.some(z=>z.label===x.label)), 'cannot add new suggestions');
 assert.ok(current.every(x=>!subtypeNeedsManualReview(x.category,x.itemType)),'cannot show empirically unsafe model types');
 const removed=initial.filter(x=>!current.some(z=>z.label===x.label));
 assert.ok(removed.every(x=>subtypeNeedsManualReview(x.category,x.itemType)),'only existing empirically flagged subtypes may be removed');
 return {id:r.id,sourceSha256:r.sourceSha256,categoryTop:a.ranking[0].category,
  p875Actionable:initial.length,p876Actionable:current.length,empiricalRiskRemoved:removed.map(x=>x.category+':'+x.itemType),
  p875Types:initial.map(x=>x.itemType),p876Types:current.map(x=>x.itemType),
  zeroModelSaves:r.output.automaticAdmissions===0};
});
const sneaker=rows.find(r=>r.id==='commons-0078');
assert.ok(sneaker,'P876 requires the source-locked real sneaker development example');
assert.ok(sneaker.p875Types.includes('Ankle boots'),'real known-risk cross-family source is the intended non-identity-specific test case');
assert.ok(!sneaker.p876Types.includes('Ankle boots'));
assert.ok(rows.every(x=>x.zeroModelSaves));
const summary={schema:'p876-empirical-review-risk-audit-v1',cohort:'existing-source-exposed-public-development-not-blind',
 realModelPhotos:rows.length,independentHumanBlindSources:0,physicalDevices:0,recognitionAccuracy:null,releaseReady:false,
 p875ActionableTotal:rows.reduce((n,r)=>n+r.p875Actionable,0),p876ActionableTotal:rows.reduce((n,r)=>n+r.p876Actionable,0),
 empiricalRiskRemovedTotal:rows.reduce((n,r)=>n+r.empiricalRiskRemoved.length,0),
 p875PhotosWithChoices:rows.filter(r=>r.p875Actionable).length,
 p876PhotosWithChoices:rows.filter(r=>r.p876Actionable).length,
 knownSneakerSourceAnkleBootSuggestionRemoved:!sneaker.p876Types.includes('Ankle boots')};
assert.equal(summary.p875ActionableTotal-summary.p876ActionableTotal,summary.empiricalRiskRemovedTotal);
await mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true});
await writeFile(output,JSON.stringify({summary,rows},null,2)+'\n');
console.log('P876_REAL_PUBLIC_RISK_AUDIT',JSON.stringify(summary));
for(const r of rows)console.log('P876_REAL_PUBLIC_ROW',r.id,'P875',r.p875Actionable,'P876',r.p876Actionable,'flagged',r.empiricalRiskRemoved.join(',')||'none','SHA',r.sourceSha256.slice(0,12));
