/** Verify the full #40 JPEG-review, three-outfit, photo save, SHA fit
 * and rollback journey in the new image-quality-advice integrated output.
 */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
let source=await readFile('scripts/test-family-alpha-40-browser.mjs','utf8');
const old='dist-family-alpha-40-session-fit-HOLD';
assert.equal(source.split(old).length,2);
source=source.replace(old,'dist-family-alpha-42-photo-advice-HOLD');
const path=join('scripts','.family-alpha-42-full-preview.generated.mjs');
try{
 await writeFile(path,source);
 const r=spawnSync(process.execPath,[resolve(path)],{
  stdio:'inherit',timeout:240000,maxBuffer:8e6,
  env:{...process.env,CLOSET_35_OFFLINE:'1'}
 });
 if(r.error)throw r.error;
 if(r.status!==0)throw Error('Work42 complete offline Family Alpha browser failed '+r.status);
 console.log('FAMILY_ALPHA_42_COMPLETE_STYLING_BROWSER_PASS');
}finally{await rm(path,{force:true});}
