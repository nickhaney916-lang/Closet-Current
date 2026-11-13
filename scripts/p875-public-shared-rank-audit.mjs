/** P875: public original-photo model rank support only. NO blind accuracy labels. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sharedRankChoices82} from '../public/dual-panel-82.mjs';

const source=process.argv[2]||'benchmark/p875-real-chromium/results.json';
const output=process.argv[3]||'benchmark/p875-real-chromium/shared-rank-audit.json';
const data=JSON.parse(await readFile(source,'utf8'));
assert.equal(data.summary?.status,'PUBLIC_DEVELOPMENT_ONLY');
assert.equal(data.summary?.physicalDevices,0);
assert.equal(data.summary?.blindAccuracy,null);
assert.ok(Array.isArray(data.rows)&&data.rows.length>0&&data.summary.photos===data.rows.length);
const vetoes=['nonclothing_evidence','top_rank_tied','category_disagreement'];
const rows=data.rows.map(r=>{
 assert.match(r.sourceSha256,/^[a-f0-9]{64}$/);
 const obs=r.output?.observations;
 assert.equal(obs?.length,2);
 assert.deepEqual(new Set(obs.map(o=>o.modelKey)),new Set(['fashionclip','fashionSiglip']));
 const vetoed=r.decision.reasons.some(reason=>vetoes.includes(reason));
 const prior=vetoed?[]:r.decision.hypotheses.filter(h=>h.category!=='Uncategorized');
 const current=sharedRankChoices82(r.decision,obs);
 const priorLabels=new Set(prior.map(h=>h.label));
 assert.ok(current.every(h=>priorLabels.has(h.label)),'must never introduce previously unsupported hypotheses');
 assert.ok(current.every(h=>obs[0].ranking[0].category===h.category&&obs[1].ranking[0].category===h.category&&obs.every(o=>o.ranking.slice(0,5).some(z=>z.label===h.label))), 'every retained label requires two-family top-five same-category support');
 if(vetoed)assert.equal(current.length,0,'existing safety veto must remain');
 return {id:r.id,sourceSha256:r.sourceSha256,modelTopCategories:obs.map(o=>o.ranking[0].category),
  arbitration:r.decision.status,reasons:r.decision.reasons,previousActionable:prior.length,sharedRankActionable:current.length,
  removedFromActionable:prior.filter(h=>!current.some(c=>c.label===h.label)).length};
});
const summary={schema:'p875-public-shared-rank-audit-v1',scope:'eight-source-locked-exposed-development-photos-not-blind',
 independentHumanBlindSources:0,physicalDevicePlatforms:0,recognitionAccuracy:null,releaseReady:false,
 photos:rows.length,oldActionableTotal:rows.reduce((a,r)=>a+r.previousActionable,0),
 sharedRankActionableTotal:rows.reduce((a,r)=>a+r.sharedRankActionable,0),
 removedActionableTotal:rows.reduce((a,r)=>a+r.removedFromActionable,0),
 photosWithAtLeastOneOldSuggestion:rows.filter(r=>r.previousActionable>0).length,
 photosWithAtLeastOneSharedSuggestion:rows.filter(r=>r.sharedRankActionable>0).length,
 categoryConflictManualOnly:rows.filter(r=>r.reasons.includes('category_disagreement')).length};
assert.equal(summary.oldActionableTotal,summary.sharedRankActionableTotal+summary.removedActionableTotal);
await mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true});
await writeFile(output,JSON.stringify({summary,rows},null,2)+'\n');
console.log('P875_REAL_PUBLIC_SHARED_RANK_AUDIT',JSON.stringify(summary));
for(const r of rows)console.log('P875_REAL_PUBLIC_ROW',r.id,'old',r.previousActionable,'shared',r.sharedRankActionable,'removed',r.removedFromActionable,'SHA',r.sourceSha256.slice(0,12));
