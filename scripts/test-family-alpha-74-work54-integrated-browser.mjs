/** Reuse the reviewed Work54 full protected-app integration browser proof against the combined #74 candidate. */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const source=await readFile('scripts/test-work54-integration-browser.mjs','utf8');
const needle="resolve('dist-work54-natural-fit-HOLD')";
const replacement="resolve('dist-family-alpha-74-work54-phone-HOLD')";
assert.equal(source.split(needle).length,2,'The exact verified Work54 test target changed');
const filename='scripts/.family-alpha-74-work54-integrated-generated.mjs';
await writeFile(filename,source.replace(needle,replacement));
try{
 const result=spawnSync(process.execPath,[resolve(filename)],{
  encoding:'utf8',timeout:700000,
  env:{...process.env,W48_CHROMIUM_ONLY:'1'}
 });
 if(result.stdout)process.stdout.write(result.stdout);
 if(result.stderr)process.stderr.write(result.stderr);
 if(result.error)throw result.error;
 assert.equal(result.status,0,'#74 real protected app must pass original Work54 full outfit/fit/privacy browser proof');
 console.log('FAMILY_ALPHA_74_WORK54_PROTECTED_INTEGRATION_PASS');
}finally{await rm(filename,{force:true});}
