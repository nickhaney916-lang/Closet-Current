import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('P86 candidate weights and immutable revisions are explicit and do not claim independent alternatives',async()=>{
 const assets=JSON.parse(await readFile('research/real-photo-recognition-accuracy-86/model-assets.json','utf8'));
 assert.equal(assets.models.length,2);
 for(const model of assets.models){assert.match(model.revision,/^[a-f0-9]{40}$/);assert.ok(model.weights.length);for(const w of model.weights){assert.match(w.sha256,/^[a-f0-9]{40,64}$/);assert.ok(w.bytes>0);}}
 assert.equal(assets.models[0].license,'MIT');
 assert.match(assets.models[1].license,/UNSPECIFIED/);
 assert.equal(assets.comparison.FashionCLIPAlternativeModelExecuted,false);
});

test('P86 source-audit script binds real original bytes, licensing, and disjoint partitions',async()=>{
 const script=await readFile('scripts/audit-real-photo-recognition-accuracy-86.mjs','utf8');
 assert.match(script,/createHash\('sha256'\)/);assert.match(script,/failOn:'truncated'/);
 assert.match(script,/Partition duplicates or source leakage/);
 assert.match(script,/independentHumanAnnotations/);
 assert.match(script,/scientific:'NEEDS_REWORK'/);
});

test('P86 report preserves human review and forbids release authorization',async()=>{
 const report=await readFile('research/real-photo-recognition-accuracy-86/REPORT.md','utf8');
 const worker=await readFile('public/local-worker.mjs','utf8');
 const review=await readFile('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(worker,/fashion-clip\/whole-v1/);
 assert.match(review,/Save confirmed pieces together/);
 assert.match(review,/p\.confirmed/);
 for(const phrase of ['NEEDS REWORK','no physical Android or iPhone','license','provisional'])assert.match(report,new RegExp(phrase,'i'));
});

test('P86 local FashionCLIP catalog vectors match their recorded byte identity',async()=>{
 const metadata=JSON.parse(await readFile('public/recognition-vectors.json','utf8'));
 const bytes=await readFile('public/recognition-vectors.bin');
 assert.equal(metadata.model,'ff13/fashion-clip');
 assert.equal(metadata.revision,'0f99955d944c39bfd9d035a02ac273c7a44a406b');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),metadata.sha256);
});
