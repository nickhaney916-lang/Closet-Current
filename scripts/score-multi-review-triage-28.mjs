/**
 * Read immutable PR575 original real-SegFormer browser model output.
 * This evaluates a *REVIEW ORDER* only. It NEVER calls the model, changes
 * a crop, or certifies real multi-garment detection.
 *
 * The same 19 single-reviewer photo annotations were inspected while
 * selecting this exploratory area rule; the named "held-out" partition is
 * NOT an independent prospective evaluation of rule 28.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {rankFrozenProposal28,organizeReview28,TRIAGE28_MIN_CONFIDENCE,TRIAGE28_MIN_RELATIVE_BOX_AREA}
 from '../research/multi-garment-capture-01/review-triage-28.mjs';
import {scorePhoto,summarizePhotos} from '../research/multi-review-triage-28/frozen-scorer-16.mjs';
const input=process.argv[2]||'benchmark/multi-review-triage-28/app-equivalent.json';
const out=process.argv[3]||'benchmark/multi-review-triage-28';
const raw=await readFile(input);
const checksum=createHash('sha256').update(raw).digest('hex');
const frozenSHA='c907ee1cbfb944d7ba055921606a13c67014e6656400b5f831b6535d66307100';
assert.equal(checksum,frozenSHA,'PR #575 actual genuine model output bytes have changed');
const benchmark=JSON.parse(raw);
const reference=JSON.parse(await readFile('research/multi-review-triage-28/frozen-photo-annotations-16.json','utf8'));
assert.equal(reference.length,19);
const sourceMap=new Map(reference.map(x=>[x.id,x]));
assert.equal(sourceMap.size,19,'no duplicated licensed originals');
assert.equal(new Set(reference.map(x=>x.sha256)).size,19);
assert.deepEqual(Object.keys(benchmark).sort(),['chromium','webkit']);
function summarizeSplit(rows,part='all'){
 const selected=part==='all'?rows:rows.filter(x=>x.split===part);
 return summarizePhotos(selected.map(x=>x.score));
}
const results={};
for(const engine of ['chromium','webkit']){
 const data=benchmark[engine];
 assert.equal(data.inputMode,'app-equivalent');
 assert.equal(data.results.length,19);
 assert.deepEqual(data.externalWrites,[]);
 assert.equal(data.networkFailures.length,0);
 const observed=[];
 for(const row of data.results){
  const source=sourceMap.get(row.id);
  assert.ok(source,'unknown model source photo '+row.id);
  assert.equal(row.sourceSha256,source.sha256);
  assert.equal(row.split,source.split);
  assert.equal(row.error,null,'browser must have completed genuine model on all 19');
  assert.ok(Array.isArray(row.proposals));
  assert.ok(row.proposals.every(p=>p.needsReview===true),
   'every automatic model region must require review');
  const expected=scorePhoto(source.regions,{status:'completed',proposals:row.proposals});
  assert.equal(expected.matches.length,row.score.matches.length,'original one-to-one matches changed');
  assert.equal(expected.unmatched.length,row.score.unmatched.length);
  assert.equal(expected.expectedCount,row.score.expectedCount);
  assert.equal(expected.proposalCount,row.score.proposalCount);
  const regions=organizeReview28(row.proposals.map(p=>({...p,cropBounds:p.box,hint:{confidence:p.confidence}})));
  assert.equal(regions.total,row.proposals.length);
  assert.equal(regions.priority.length+regions.additional.length,row.proposals.length);
  assert.equal(regions.manual.length,0);
  assert.ok(regions.ordered.every(p=>p.needsReview===true));
  const originalKeys=row.proposals.map((p,i)=>JSON.stringify({i,label:p.label,b:p.box,c:p.confidence}));
  const rebuilt=regions.ordered.map(p=>JSON.stringify({i:row.proposals.indexOf(row.proposals.find(x=>x.label===p.label&&x.confidence===p.confidence&&x.box===p.box)),label:p.label,b:p.box,c:p.confidence}));
  assert.equal(originalKeys.length,rebuilt.length,'no dropped candidate');
  const primary=row.proposals.filter(p=>rankFrozenProposal28(p)==='priority');
  const additional=row.proposals.filter(p=>rankFrozenProposal28(p)==='additional');
  const first=scorePhoto(source.regions,{status:'completed',proposals:primary});
  const all=scorePhoto(source.regions,{status:'completed',proposals:[...primary,...additional]});
  assert.equal(all.proposalCount,expected.proposalCount);
  observed.push({id:row.id,split:row.split,sourceSha256:source.sha256,
   originalCount:row.proposals.length,priorityCount:primary.length,
   additionalCount:additional.length,expectedCount:source.regions.length,
   original:expected,priority:first,restored:all});
 }
 const metrics={};
 for(const split of ['all','development','held-out']){
  const rows=observed.filter(x=>split==='all'||x.split===split);
  metrics[split]={
   original:summarizePhotos(rows.map(x=>x.original)),
   priority:summarizePhotos(rows.map(x=>x.priority)),
   allRetained:summarizePhotos(rows.map(x=>x.restored)),
   additionalCount:rows.reduce((s,r)=>s+r.additionalCount,0)
  };
  assert.equal(metrics[split].original.proposed,metrics[split].allRetained.proposed);
  assert.equal(metrics[split].original.truePositives,metrics[split].allRetained.truePositives);
  assert.equal(metrics[split].original.falsePositives,metrics[split].allRetained.falsePositives);
 }
 assert.deepEqual(metrics.all.original,data.all,'inherited genuine model measurements drifted');
 assert.equal(metrics.all.original.proposed,61);
 assert.equal(metrics.all.original.truePositives,10);
 assert.equal(metrics.all.priority.proposed,9);
 assert.equal(metrics.all.priority.truePositives,8);
 assert.equal(metrics.all.priority.falsePositives,1);
 assert.equal(metrics.all.priority.falseNegatives,27);
 assert.equal(metrics.development.priority.proposed,5);
 assert.equal(metrics.development.priority.truePositives,5);
 assert.equal(metrics['held-out'].priority.proposed,4);
 assert.equal(metrics['held-out'].priority.truePositives,3);
 assert.equal(metrics['held-out'].priority.falsePositives,1);
 assert.equal(metrics.all.additionalCount,52);
 results[engine]={metrics,photoCount:observed.length,sourceHashesVerified:true};
}
assert.equal(results.chromium.metrics.all.priority.proposed,
 results.webkit.metrics.all.priority.proposed);
const report={priority:'MULTI-REVIEW-TRIAGE-28',
 sourcePR:575,sourceHead:'241bd1ed75fb334f94877a8cddc471b41839af23',
 sourceCI:41856942601,sourceArtifactId:13340286217,
 frozenModelOutputSHA256:checksum,
 licensedOriginalPhotoCount:19,annotatedVisibleTargets:35,
 engines:['chromium','webkit'],sameSourceIdentityEveryBrowser:true,
 confidenceThreshold:TRIAGE28_MIN_CONFIDENCE,
 relativeBoxAreaMinimum:TRIAGE28_MIN_RELATIVE_BOX_AREA,
 outcome:'EXPLORATORY_REVIEW_RANKING_ONLY_NOT_DETECTION_ACCURACY',
 prospectiveUntouchedHoldout:false,independentSecondAnnotator:false,
 verifiedPixelMaskIoU:false,realAutoSaveAccepted:false,
 allProposalsRetainedForPersonReview:true,
 results,FamilyAlpha:'HOLD',deployAuthorized:false};
await mkdir(out,{recursive:true});
await writeFile(resolve(out,'score.json'),JSON.stringify(report,null,2)+'\n');
console.log('MULTI-REVIEW-28 FROZEN REAL MODEL REPLAY '+JSON.stringify({
 sourceArtifact:report.sourceArtifactId,sourceSHA:checksum.slice(0,12),
 originalImages:19,targets:35,
 chromium:{original:[61,10,51],priority:[9,8,1],additional:52},
 webkit:{original:[61,10,51],priority:[9,8,1],additional:52},
 prospectiveHoldout:false,allSuggestionsStillAvailable:true,FamilyAlpha:'HOLD'}));
