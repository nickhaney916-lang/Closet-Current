// Separate offline integration: existing geometry and styling implementations are immutable inputs.
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,cp,rm} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const pins={style:'97397e80a7cf66e5e656c5b74c924a51e50f0f6f',humanoid:'094896d1b0655662787a78bc80d61af822a9e265',alphaFit:'68bed0c0f0f25538d0d5a00fbaf9aa34d80b8663',storageReference:'c86f48f0119329e4001002304e2dfe480815b099'};
const paths=['public/family-alpha-2d-photo-renderer.mjs','public/family-alpha-2d-layer-plan.mjs'];
for(const path of paths)assert.deepEqual(await readFile(path),execFileSync('git',['show',pins.alphaFit+':'+path]));
for(const path of ['research/family-alpha-29/boot.js','research/family-alpha-29/workflow.mjs','research/family-alpha-29/store.mjs','research/family-alpha-29/ui.mjs','research/family-alpha-19/style-my-new-clothes.mjs'])assert.deepEqual(await readFile(path),execFileSync('git',['show',pins.style+':'+path]));
const base='dist-family-alpha-29-hold',out='dist-family-alpha-31-hold';
for(const path of paths)assert.deepEqual(await readFile(base+'/'+path.slice(7)),await readFile(path));
await rm(out,{recursive:true,force:true});await cp(base,out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
await writeFile(out+'/alpha31-manifest.json',JSON.stringify({release:'HOLD',pins,offlineOptInOnly:true,physicalPhonesTested:false,realisticFittingValidated:false,storageOverlay318Applied:false,geometry:await Promise.all(paths.map(async path=>({path,sha256:sha(await readFile(path))})))},null,2));
console.log('ALPHA31_OFFLINE_HOLD',out);
