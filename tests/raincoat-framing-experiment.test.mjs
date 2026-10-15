import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('optional rain-jacket framing experiment stays in benchmark only',()=>{
 const runner=readFileSync('public/benchmark-runner.mjs','utf8');
 const workflow=readFileSync('.github/workflows/camera-scenarios.yml','utf8');
 assert.match(runner,/item\.diagnosticOnly===true&&item\.contextContaminated===true/);
 assert.match(runner,/framingExperiment=\{method:'inset-3-percent-each-side'/);
 assert.match(runner,/await session\.call\(\{type:'classify',image:frame,benchmarkDiagnostics:true\}\)/);
 assert.match(workflow,/framingExperiment:x\.framingExperiment/);
});
