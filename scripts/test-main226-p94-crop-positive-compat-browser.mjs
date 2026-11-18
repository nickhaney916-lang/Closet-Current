/**
 * M226 cross-boundary review regression: re-run the independently accepted
 * original genuine P94 + injected-one-crop-failure browser test, replacing
 * ONLY its original Worker Git blob witness with this diagnostic Worker SHA.
 * All source JPEG, actual WASM model, >0 real piece, owner private save,
 * cross-owner denial and original 2D/v4 assertions remain intact.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const source=await readFile('scripts/test-main223-genuine-p94-crop-prepare-rejection-browser.mjs');
assert.equal(blob(source),'0f3bd4a848f86bf63793c005b17f33c4b27f1cc5',
 'original real P94 injected crop-acceptance changed');
const real=await readFile('public/outfit-worker-p94.mjs');
const current='f3b1b5046f4abc55755c8b5d1e8b39d4aea46b2a';
assert.equal(blob(real),current,'diagnostic worker source changed');
const old="assert.equal(blob(realWorker),'d66651b616de54c51eb7ef986324b30f1580888f','actual worker/model changed');";
const revised="assert.equal(blob(realWorker),'"+current+"','actual worker/model changed');";
const text=source.toString('utf8');
assert.equal(text.split(old).length,2,'original crop test source label changed');
const edited=text.replace(old,revised);
assert.ok(edited.includes('assert.ok(m222.reviewCards>0'));
assert.ok(edited.includes("assert.deepEqual(issues,[]"));
const temp=resolve('scripts/.main226-crop-positive-native-browser.mjs');
try{
 await writeFile(temp,edited,{flag:'wx'});
 const checked=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});
 assert.equal(checked.status,0,checked.stderr);
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env,M58_ENGINE:process.env.M58_ENGINE||'webkit',
   P94_WIDTH:process.env.P94_WIDTH||'430'},
  stdio:'inherit',timeout:19*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,'M226 genuine P94 failed the previously protected crop review journey');
}finally{await rm(temp,{force:true});}
