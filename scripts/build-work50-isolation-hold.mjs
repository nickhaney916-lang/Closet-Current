import {readFile,writeFile,cp,mkdir,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
export const PARENT='dist-work49-cutout-HOLD',OUTPUT='dist-work50-isolation-HOLD';
await rm(OUTPUT,{recursive:true,force:true});await cp(PARENT,OUTPUT,{recursive:true});
await mkdir(join(OUTPUT,'__alpha_research/work50'),{recursive:true});await cp('research/work50/isolate.mjs',join(OUTPUT,'__alpha_research/work50/isolate.mjs'));
const provider='__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs';
let s=await readFile(join(PARENT,provider),'utf8');
const hook="import {prepareSyntheticGarmentOriginal} from '../family-alpha-13/garment-photo-preparation.mjs';";
assert.equal(s.split(hook).length,2);
s=s.replace(hook,"import {prepareAutomaticGarment as prepareSyntheticGarmentOriginal} from '../work50/isolate.mjs';");
await writeFile(join(OUTPUT,provider),s);
async function verify(dir,p=''){for(const e of await readdir(join(dir,p),{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const f=join(p,e.name);if(e.isDirectory())await verify(dir,f);else if(f!==provider)assert.deepEqual(await readFile(join(PARENT,f)),await readFile(join(OUTPUT,f)),'Unexpected inherited change '+f);}}
await verify(PARENT);console.log('WORK50_BUILD_HOLD: single extraction import changed; auditor, review, Auth, fit, storage, backup and original recognition byte-identical');
