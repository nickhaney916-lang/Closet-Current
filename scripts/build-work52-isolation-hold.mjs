import {readFile,writeFile,cp,mkdir,readdir,rm} from 'node:fs/promises';import assert from 'node:assert/strict';
const PARENT='dist-work51-isolation-HOLD',OUTPUT='dist-work52-isolation-HOLD',UI='__alpha_research/family-alpha-35/review-cutout.mjs';
await rm(OUTPUT,{recursive:true,force:true});await cp(PARENT,OUTPUT,{recursive:true});await mkdir(OUTPUT+'/__alpha_research/work52',{recursive:true});await cp('research/work52/propose.mjs',OUTPUT+'/__alpha_research/work52/propose.mjs');
function patch(s){const old="import {proposeIsolationCleanup} from '../work51/propose.mjs';";assert.equal(s.split(old).length,2);return s.replace(old,"import {proposeIsolationCleanup} from '../work52/propose.mjs';");}
await writeFile(OUTPUT+'/'+UI,patch(await readFile(PARENT+'/'+UI,'utf8')));
await writeFile('research/work52/review-cutout.generated.mjs',patch(await readFile('research/work51/review-cutout.generated.mjs','utf8')));
async function verify(p=''){for(const e of await readdir(PARENT+'/'+p,{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const f=p+e.name;if(e.isDirectory())await verify(f+'/');else if(f!==UI)assert.deepEqual(await readFile(PARENT+'/'+f),await readFile(OUTPUT+'/'+f),f);}}await verify();console.log('WORK52_HOLD: only cleanup import changed; immutable source, recipe, approval, privacy and fitting modules');
