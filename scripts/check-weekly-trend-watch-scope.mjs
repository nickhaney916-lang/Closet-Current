// Zero customer-facing feature/data changes: only editorial audit scripts and a default-branch-only weekly alert.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const BASE='c332ad3c38797f154fc2207ca50a92214f2323f0';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
assert.equal(git('merge-base','HEAD',BASE),BASE,'Audit must descend from verified PR136');
const allowed=new Set([
 'scripts/audit-weekly-trend-readiness.mjs',
 'scripts/check-weekly-trend-watch-scope.mjs',
 'tests/weekly-trend-editorial-watch.test.mjs',
 '.github/workflows/weekly-trend-editorial-watch.yml',
 'docs/WEEKLY-TREND-EDITORIAL-WATCH-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md'
]);
const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
for(const path of changed)assert.ok(allowed.has(path),'Do not edit app, live researched catalog or cloud: '+path);
for(const path of [
 'public/trend-data.json','public/trend-library.js','public/outfit-board.js',
 'public/outfit-board-engine.js','public/trends.js','public/index.html',
 'public/app.js','public/auth.js','public/photo-import.js','public/cloud-backup.js',
 'public/recognition-engine.mjs','public/recognition-photo.mjs',
 'public/local-worker.mjs','public/sw.js',
 'supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json',
 'scripts/source-holdout-human-review.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'
]){
 assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',BASE+':'+path),
  'Source or deployment must remain byte identical: '+path);
}
const prior=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior),
 'Existing source-locked progress history cannot be rewritten');
const workflow=fs.readFileSync('.github/workflows/weekly-trend-editorial-watch.yml','utf8');
const script=fs.readFileSync('scripts/audit-weekly-trend-readiness.mjs','utf8');
assert.match(workflow,/schedule:/);
assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
assert.match(workflow,/issues: write/);
assert.match(workflow,/github-script@v7/);
assert.match(workflow,/trend-editorial-watch-report\.json/);
assert.match(script,/automaticPublication:false/);
assert.match(script,/linksLiveChecked:false/);
assert.ok(!/(?:public\/trend-data\.json.+writeFile|writeFile.+public\/trend-data\.json)/.test(script),
 'Editorial watch cannot overwrite verified catalog');
console.log(JSON.stringify({scope:'EDITORIAL_WEEKLY_FRESHNESS_ONLY',
 catalogUnchanged:true,customerSourceAndProductionDeployUnchanged:true,
 noSourceOrPriceRecertification:true,noPurchasedData:true,
 scheduledIssueOnlyAfterApprovedMainMerge:true,
 noPhysicalPhonesTested:true,garmentAccuracy:null,merged:false,deployed:false}));
