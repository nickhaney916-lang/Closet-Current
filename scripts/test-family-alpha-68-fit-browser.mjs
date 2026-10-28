/** Re-run exact PR380 downloaded-fit real browser proof against integrated Work68. */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const original=await readFile('scripts/test-family-alpha-67-portable-fit-browser.mjs','utf8');
const old="resolve('dist-work51-isolation-HOLD')";
const newer="resolve('dist-family-alpha-68-review-fit-pale-HOLD')";
assert.equal(original.split(old).length,2,'Exact Work67 browser source changed');
const temp='scripts/.family-alpha-68-fit-browser-generated.mjs';
await writeFile(temp,original.replace(old,newer));
try{
 const p=spawnSync(process.execPath,[temp],{encoding:'utf8',timeout:220000,
  env:{...process.env,W48_CHROMIUM_ONLY:'1'}});
 if(p.stdout)process.stdout.write(p.stdout);
 if(p.stderr)process.stderr.write(p.stderr);
 assert.equal(p.status,0,'Work68 reviewed cutout fit download/import must pass real Chromium');
}finally{await rm(temp,{force:true});}
