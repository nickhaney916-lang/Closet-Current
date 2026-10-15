import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('independent workflow checks reviewed non-overlapping photos before inference',async()=>{
 const workflow=await readFile('.github/workflows/independent-outerwear-validation.yml','utf8');
 const guard=workflow.indexOf('node scripts/check-independent-validation.mjs');
 const download=workflow.indexOf('node scripts/download-reviewed-photos.mjs');
 const classify=workflow.indexOf('node scripts/run-browser-photo-benchmark.mjs');
 assert.ok(guard>0&&download>guard&&classify>download);
 const prepare=workflow.indexOf('node scripts/prepare-independent-photos.mjs');
 assert.ok(prepare>0&&prepare<guard);
 assert.match(workflow,/if\(!r\.ready\)/);

 assert.match(workflow,/manifest-independent\.json/);
 assert.match(workflow,/independent-outerwear-validation/);
});
