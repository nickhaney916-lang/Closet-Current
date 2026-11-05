#!/usr/bin/env node
/**
 * REVIEW54 read-only posthoc audit of exact genuine FashionCLIP baseline
 * predictions from independently completed PR #607 / CI #41957999315.
 * Original model predictions are not recomputed or silently relabeled.
 * Candidate displays remain unverified and cannot count as accepted accuracy.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {localCandidates} from '../public/local-catalog.mjs';
import {reviewAlternatives54} from '../research/multi-garment-capture-01/review-alternatives-54.mjs';

const root='benchmark/review-alternatives-54/';
const dataRoot=process.argv[2]||root+'source/';
const categories=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
const schema={types:Object.fromEntries(categories.map(category=>[
 category,[...new Set(localCandidates.filter(x=>x.category===category).map(x=>x.itemType))]
]))};
const lock=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const known=new Map(lock.map(x=>[x.id,x]));
assert.equal(known.size,lock.length);
const output={schema:'review-alternatives-54/actual-image-posthoc-audit-v1',
 sourceStudy:{repo:'nickhaney916-lang/Closet-Current',
  pr:607,actionsRun:41957999315,artifactId:13385105377,
  pinnedModel:'ff13/fashion-clip',modelRevision:'0f99955d944c39bfd9d035a02ac273c7a44a406b',
  warning:'Original-photo model predictions are inherited from a completed independent run, not rerun here. Labels are provisional and not independently two-person adjudicated.'},
 splits:[],totalOriginalPhotos:0};
for(const name of ['reviewed-32','fresh-11','holdout-16']){
 const manifest=JSON.parse(await readFile('benchmark/manifest-'+name+'.json','utf8'));
 const results=JSON.parse(await readFile(dataRoot+'results/'+name+'-baseline/results.json','utf8'));
 assert.equal(results.length,manifest.length,name+' must preserve count');
 const expected=new Map(manifest.map(x=>[x.id,x]));
 assert.equal(expected.size,manifest.length,'No repeated original ID');
 const seen=new Set(),cases=[];
 for(const r of results){
  assert.ok(!seen.has(r.id),'Duplicate prediction id');seen.add(r.id);
  const truth=expected.get(r.id),source=known.get(r.id);
  assert.ok(truth&&source?.verified&&/^[a-f0-9]{64}$/.test(source.sha256),'Must match source-locked original JPEG provenance');
  assert.equal(r.modelProfile,'fashionclip-baseline');
  const feature=r.recognitionMemory?.features;
  assert.equal(feature?.length,512,'Must derive from actual pinned FashionCLIP visual model');
  assert.ok(feature.every(Number.isFinite));
  const expectedCategory=truth.expectedCategory,expectedType=truth.expectedType||null;
  const correctModelCategory=r.prediction?.category===expectedCategory;
  const correctModelType=r.prediction?.type===expectedType;
  const alternatives=reviewAlternatives54(r,schema,categories);
  const uncertain=r.strong!==true&&r.categoryConfirmed!==true;
  assert.equal(uncertain||alternatives.length===0,true,'No unverified extra suggestions on accepted results');
  assert.ok(alternatives.length<=3&&alternatives.every(x=>x.needsConfirmation===true));
  cases.push({
   id:r.id,sourceSHA256:source.sha256,expectedCategory,expectedType,
   modelCategory:r.prediction?.category??null,modelType:r.prediction?.type??null,
   modelStrong:r.strong===true,modelCategoryConfirmed:r.categoryConfirmed===true,
   modelCategoryCorrect:correctModelCategory,modelSubtypeCorrect:correctModelType,
   originalModelReason:r.reason||null,
   alternativeCategories:alternatives.map(x=>x.category),
   alternatives:alternatives.map(x=>({category:x.category,itemType:x.itemType,needsConfirmation:x.needsConfirmation})),
   correctCategoryPresentInUnverifiedAlternatives:alternatives.some(x=>x.category===expectedCategory),
   correctSubtypePresentInUnverifiedAlternatives:alternatives.some(x=>x.category===expectedCategory&&x.itemType===expectedType)
  });
 }
 assert.deepEqual([...seen].sort(),[...expected.keys()].sort());
 const garment=cases.filter(x=>categories.includes(x.expectedCategory)),negatives=cases.filter(x=>!categories.includes(x.expectedCategory));
 const uncertain=garment.filter(x=>!x.modelStrong&&!x.modelCategoryConfirmed);
 const summary={name,total:cases.length,garments:garment.length,nonGarmentControls:negatives.length,
  originalModelBroadCorrect:garment.filter(x=>x.modelCategoryCorrect).length,
  originalModelSubtypeCorrect:garment.filter(x=>x.modelSubtypeCorrect).length,
  uncertainUnconfirmed:uncertain.length,
  uncertainOfferingAlternatives:uncertain.filter(x=>x.alternatives.length).length,
  uncertainWithCorrectCategoryAmongAlternatives:uncertain.filter(x=>x.correctCategoryPresentInUnverifiedAlternatives).length,
  uncertainWithCorrectSubtypeAmongAlternatives:uncertain.filter(x=>x.correctSubtypePresentInUnverifiedAlternatives).length,
  nonGarmentControlsOfferedAlternative:negatives.filter(x=>x.alternatives.length).length,
  individualEvidence:cases
 };
 output.splits.push(summary);
 output.totalOriginalPhotos+=cases.length;
}
assert.equal(output.totalOriginalPhotos,59);
const locked=output.splits.find(x=>x.name==='holdout-16');
assert.equal(locked.garments,13);
assert.equal(locked.nonGarmentControls,3);
assert.equal(locked.nonGarmentControlsOfferedAlternative,0,'No suggested garment on negative control');
assert.equal(locked.originalModelBroadCorrect,9,'Pinned baseline locked category results unchanged');
assert.equal(locked.originalModelSubtypeCorrect,4,'Pinned baseline locked subtype results unchanged');
await mkdir(root,{recursive:true});
await writeFile(root+'actual-genuine-photo-audit.json',JSON.stringify(output,null,2)+'\n');
console.log('REVIEW54 REAL LOCKED 59-PHOTO MODEL EVIDENCE: '+JSON.stringify(output.splits.map(s=>({
 split:s.name,garments:s.garments,negatives:s.nonGarmentControls,
 baselineBroadCorrect:s.originalModelBroadCorrect,baselineSubtypeCorrect:s.originalModelSubtypeCorrect,
 uncertain:s.uncertainUnconfirmed,alternatives:s.uncertainOfferingAlternatives,
 candidatesIncludeCorrectCategory:s.uncertainWithCorrectCategoryAmongAlternatives,
 candidatesIncludeCorrectSubtype:s.uncertainWithCorrectSubtypeAmongAlternatives,
 negativeAlternatives:s.nonGarmentControlsOfferedAlternative
}))));
