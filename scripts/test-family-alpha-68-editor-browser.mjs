/** Reuse exact protected Work66 browser contract against Work68 compiled app. */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const original=await readFile('scripts/test-family-alpha-66-integrated-browser.mjs','utf8');
const old='dist-family-alpha-66-work51-review-lifecycle-HOLD';
const updated='dist-family-alpha-68-review-fit-pale-HOLD';
assert.ok(original.includes(old));
assert.ok(original.includes('benchmark/family-alpha-66/editor'));
const code=original.replaceAll(old,updated)
 .replaceAll('benchmark/family-alpha-66/editor','benchmark/family-alpha-68/editor');
const temp='scripts/.family-alpha-68-generated-browser.mjs';
await writeFile(temp,code);
try{
 const p=spawnSync(process.execPath,[temp],{encoding:'utf8',timeout:180000,env:process.env});
 if(p.stdout)process.stdout.write(p.stdout);
 if(p.stderr)process.stderr.write(p.stderr);
 assert.equal(p.status,0,'Work68 combined mobile editor must pass exact Work66 source/undo/recovery/stale-photo review checks');
}finally{await rm(temp,{force:true});}
