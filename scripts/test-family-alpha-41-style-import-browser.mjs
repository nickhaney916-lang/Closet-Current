/** Run already verified full Family Alpha browser journey with improved ONLY
 * photo-import.js from #41 compiled output, and no live photo/accounts.
 */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
let source=await readFile('scripts/test-family-alpha-40-browser.mjs','utf8');
const orig="dist-family-alpha-40-session-fit-HOLD";
assert.equal(source.split(orig).length,2);
source=source.replace(orig,"dist-family-alpha-41-original-jpeg-HOLD");
const p=join('scripts','.family-alpha-41-style-import.generated.mjs');
try{
 await writeFile(p,source);
 const r=spawnSync(process.execPath,[resolve(p)],{stdio:'inherit',timeout:240000,
  env:{...process.env,CLOSET_35_OFFLINE:'1'},maxBuffer:8e6});
 if(r.error)throw r.error;
 if(r.status!==0)throw Error('Full photo-import and wardrobe style browser FAIL '+r.status);
 console.log('FAMILY_ALPHA_41_FULL_STYLING_BROWSER_PASS — metadata-safe import, three outfits, atomic save');
}finally{await rm(p,{force:true});}
