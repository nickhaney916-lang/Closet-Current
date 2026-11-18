/**
 * M226: expose genuine "No unverified garment regions" Worker terminal
 * without waiting for the original P94 browser harness' stale text matcher.
 * This does NOT turn a zero-card model output into success: all original
 * strict >0 real-proposal, owner/source/private/2D/v4 assertions remain.
 * The sole adaptation is in a disposable test script, never the app/Worker.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const file='scripts/test-main214-p94-worker-outcome.mjs';
const input=await readFile(file);
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\\0').update(b).digest('hex');
assert.equal(gitBlob(input),'8cc2977f1932b3012c44bdd401081cc542b94c57',
  'M226 expected immutable original passive M214 diagnostic');
const old="const adapted=original.replace(stageInstall,init+stageInstall).replace(probeBefore,output+probeBefore).replace(oldWorkerLabel,currentWorkerLabel);";
const patch=[
 "const zeroText='(/unverified region|Automatic extraction unavailable|could not start|timed out/i.test(';",
 "assert.equal(original.split(zeroText).length,2,'M226 immutable original terminal wait moved');",
 "const zeroAwareOriginal=original.replace(zeroText,",
 " '(/unverified (?:garment )?region|Automatic extraction unavailable|could not start|timed out/i.test(');",
 "const adapted=zeroAwareOriginal.replace(stageInstall,init+stageInstall).replace(probeBefore,output+probeBefore).replace(oldWorkerLabel,currentWorkerLabel);"
].join('\\n');
const source=input.toString('utf8');
assert.equal(source.split(old).length,2,'M226 original M214 adaptation anchor moved');
const changed=source.replace(old,patch);
assert.ok(changed.includes("assert.ok(adapted.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'))"),
  'Original fail-closed >0 assertion must remain pinned');
const temp=resolve('scripts/.main226-zero-aware-real-m214-diagnostic.mjs');
try{
 await writeFile(temp,changed,{flag:'wx'});
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env},stdio:'inherit',timeout:18*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,
  'M226 actual real P94 original model/owner journey failed; do not retry as success');
}finally{
 await rm(temp,{force:true});
}
