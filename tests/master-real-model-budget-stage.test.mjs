// Source-locked research acceptance budget test; it is not genuine model evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/master-consolidation-1054-no-deploy.yml','utf8');
const runner=readFileSync('scripts/test-main1054-real-webkit-repeat.mjs','utf8');
const observedWebKit8=[77223,84103,81787,80855,84121,80403,84560,81217];

test('16-photo genuine WebKit research budget is data-derived, bounded and fail-closed',()=>{
  const stage=workflow.match(/- engine: webkit\n\s+target: 16\n\s+budgetMs: (\d+)/);
  assert.ok(stage,'real WebKit16 separate acceptance matrix must exist');
  const budget=Number(stage[1]);
  assert.equal(budget,1680000);
  assert.ok(Math.max(...observedWebKit8)*16<budget,'budget must exceed measured worst per-photo extrapolation');
  assert.ok(budget<=1800000,'budget must stay within runner owned browser-process bound');
  assert.match(runner,/runBudgetMs<=1800000/);
  assert.match(workflow,/real-pretrained-continuous-sequence:\n\s+runs-on: ubuntu-24\.04\n\s+timeout-minutes: 35/);
  assert.match(workflow,/- engine: webkit\n\s+target: 8\n\s+budgetMs: 720000/);
  assert.match(workflow,/- engine: chromium\n\s+target: 16\n\s+budgetMs: 240000/);
  assert.match(workflow,/Require complete source-bound real-model sequence; incomplete is BLOCKED/);
  assert.match(runner,/process\.exit\(2\)/);
});
