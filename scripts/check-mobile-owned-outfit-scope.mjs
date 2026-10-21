// Assignment 132: reviewed local owned styling only; immutable checkpoint guards run at their exact heads.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const BASE='7566b59e7377d77d8503c7c599aabe32fd3959dc';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
assert.equal(git('merge-base','HEAD',BASE),BASE);
const pins={"public/closet-stylist-engine.js": "c68ddf562bde0ce906b7d9d828c6261e5448e908", "public/closet-stylist.js": "6f1e34da26079cfd9b3707fbb856becd1eec239f", "public/outfit-board.js": "e264dc48c9ba58b401cf68b2de83f2cafc746d67", "public/garment-fit-geometry.js": "e700b6517cd7690f06457b10c6328218c2d05139", "public/figure-preview-cache.js": "383ceb09cb487e3394760587b84e156c746e9792"};
for(const [p,sha] of Object.entries(pins))assert.equal(git('rev-parse','HEAD:'+p),sha,'Unreviewed styling source: '+p);
const allowed=new Set(["public/closet-stylist-engine.js", "public/closet-stylist.js", "public/outfit-board.js", "public/garment-fit-geometry.js", "public/figure-preview-cache.js", "tests/figure-preview-cache.test.cjs", "tests/outfit-save-recovery.test.cjs", "tests/mobile-owned-outfit-reliability.test.cjs", "scripts/test-mobile-owned-outfit-reliability.mjs", "scripts/check-mobile-owned-outfit-scope.mjs", ".github/workflows/mobile-owned-outfit-reliability.yml", "docs/MOBILE-OWNED-OUTFIT-AUDIT-20261021.md", "docs/PROGRESS-CHECKPOINT.md"]);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))assert.ok(allowed.has(p),'Unrelated source/evidence changed: '+p);
const changed=git('diff','--name-only',BASE,'HEAD','public','supabase','benchmark').split('\n').filter(Boolean);
assert.deepEqual(changed.sort(),Object.keys(pins).sort());
for(const p of ['public/app.js','public/trends.js','public/photo-import.js','public/auth.js','public/cloud-backup.js','public/recognition-engine.mjs','public/recognition-photo.mjs','public/reusable-figure-preview.js','public/reusable-figure-engine.js','public/local-garment-warp.js','public/trend-data.json','public/clothing-details.js'])assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Protected source changed: '+p);
const prior=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior),'Historical checkpoint rewritten');
console.log(JSON.stringify({scope:'OWNED_OUTFIT_RELIABILITY_ONLY',originalRecognitionPreserved:true,authAndCloudUnchanged:true,humanEvidenceUnchanged:true,physicalPhoneValidated:false,merged:false,deployed:false}));
