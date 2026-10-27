import {readFile,writeFile,cp,rm,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {abortSynchronousWriteFailure} from './family-alpha-28-storage-candidate.mjs';
import {assertVisualHOLD,OUTPUT as BASE} from './build-family-alpha-refined-avatar-integration-hold.mjs';
export const OUTPUT='dist-family-alpha-34-storage-HOLD';
export const STORAGE_PIN='c86f48f0119329e4001002304e2dfe480815b099',PARENT_PIN='100ffc194793470c871f2b0c6092bc59f1c583b8';
const marker='alpha34-storage-HOLD-manifest.json',sha=x=>createHash('sha256').update(x).digest('hex');
const pinned=(ref,path)=>execFileSync('git',['show',ref+':'+path],{maxBuffer:12e6});
export async function paths(dir,prefix=''){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=prefix+e.name;if(e.isSymbolicLink())throw Error('Symlink refused');if(e.isDirectory())out.push(...await paths(dir+'/'+e.name,p+'/'));else if(e.isFile())out.push(p);else throw Error('Unsupported asset');}return out.sort();}
export async function assertStorageHOLD(){
 await assertVisualHOLD();
 const m=JSON.parse(await readFile(OUTPUT+'/'+marker));
 assert.equal(m.releaseGate,'HOLD');assert.equal(m.storagePin,STORAGE_PIN);assert.equal(m.parentPin,PARENT_PIN);assert.equal(m.storageOverlay318Applied,true);
 for(const k of ['deployAuthorized','physicalPhonesTested','realQuotaExhausted','liveCloudTested','productionChanged'])assert.equal(m[k],false,k);
 assert.deepEqual(await paths(OUTPUT),(await paths(BASE)).concat(marker).sort());
 const overlay=await readFile('scripts/family-alpha-28-storage-candidate.mjs');assert.deepEqual(overlay,pinned(STORAGE_PIN,'scripts/family-alpha-28-storage-candidate.mjs'));
 const parent=await readFile(BASE+'/app.js','utf8'),patched=abortSynchronousWriteFailure(parent),output=await readFile(OUTPUT+'/app.js','utf8');assert.equal(output,patched);assert.equal(sha(parent),m.parentAppSha256);assert.equal(sha(output),m.patchedAppSha256);assert.equal(sha(overlay),m.overlaySha256);
 for(const p of await paths(BASE)){assert.equal(sha(await readFile(OUTPUT+'/'+p)),p==='app.js'?sha(patched):sha(await readFile(BASE+'/'+p)),p);}
 return m;
}
export async function buildStorageHOLD(){
 await assertVisualHOLD();
 for(const p of ['scripts/build-family-alpha-refined-avatar-integration-hold.mjs','scripts/build-family-alpha-31-hold.mjs','scripts/build-family-alpha-29-hold.mjs'])assert.deepEqual(await readFile(p),pinned(PARENT_PIN,p));
 const overlay=await readFile('scripts/family-alpha-28-storage-candidate.mjs');assert.deepEqual(overlay,pinned(STORAGE_PIN,'scripts/family-alpha-28-storage-candidate.mjs'));
 const parent=await readFile(BASE+'/app.js','utf8'),patched=abortSynchronousWriteFailure(parent);
 assert.equal((patched.match(/SYNC_WRITE_ABORT_28/g)||[]).length,2);
 await rm(OUTPUT,{recursive:true,force:true});await cp(BASE,OUTPUT,{recursive:true});await writeFile(OUTPUT+'/app.js',patched);
 const m={releaseGate:'HOLD',parentPin:PARENT_PIN,storagePin:STORAGE_PIN,storageOverlay318Applied:true,parentAppSha256:sha(parent),patchedAppSha256:sha(patched),overlaySha256:sha(overlay),changedAssets:['app.js'],inheritedManifestPolicy:'Parent provenance manifests remain byte-identical; this additive manifest records the storage overlay.',deployAuthorized:false,productionChanged:false,physicalPhonesTested:false,realQuotaExhausted:false,liveCloudTested:false};await writeFile(OUTPUT+'/'+marker,JSON.stringify(m,null,2)+'\n');return assertStorageHOLD();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('ALPHA34_STORAGE_OFFLINE_HOLD',JSON.stringify(await buildStorageHOLD()));
