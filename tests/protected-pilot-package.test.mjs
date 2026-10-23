import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStagingAssetSeal} from '../scripts/staging-asset-seal.mjs';
import {packageProtectedPilot,verifyPilotPackage} from '../scripts/package-protected-pilot.mjs';
async function fixture(fn){const root=await mkdtemp(join(tmpdir(),'closet223-')),bundle=join(root,'bundle'),output=join(root,'package');try{
 await mkdir(bundle);await writeFile(join(bundle,'index.html'),'offline synthetic');
 await writeFile(join(bundle,'staging-preflight.json'),JSON.stringify({backendProjectRef:'abcdefghijklmnopqrst',privateCloudflareAccessPolicyVerified:false,restrictedStagingDeployed:false,productionReleaseApproved:false,releasePromotion:'BLOCKED',paidAIHardBlocked:true}));
 await createStagingAssetSeal(bundle);await fn({bundle,output});
}finally{await rm(root,{recursive:true,force:true});}}
test('provenance is outside sealed assets and both inventories verify without altering input',()=>fixture(async({bundle,output})=>{
 const before=await readFile(join(bundle,'staging-asset-seal.json'),'utf8');const proof=await packageProtectedPilot(bundle,output);
 assert.equal(proof.sealedAssets,2);assert.equal(proof.deployAuthorized,false);
 assert.equal(await readFile(join(bundle,'staging-asset-seal.json'),'utf8'),before);
 assert.equal((await verifyPilotPackage(output)).release,'BLOCKED');
}));
test('PR222-style post-seal provenance additions are refused',()=>fixture(async({bundle,output})=>{
 await writeFile(join(bundle,'issue-221-source-commit.txt'),'unsealed');
 await assert.rejects(()=>packageProtectedPilot(bundle,output),/added or deleted asset/);
}));
test('modified or extra final package files cannot pass verification',()=>fixture(async({bundle,output})=>{
 await packageProtectedPilot(bundle,output);const original=await readFile(join(output,'provenance.json'),'utf8');
 await writeFile(join(output,'provenance.json'),'{}');
 await assert.rejects(()=>verifyPilotPackage(output),/Package bytes or inventory changed/);
 await writeFile(join(output,'provenance.json'),original);await writeFile(join(output,'extra.txt'),'unreviewed');
 await assert.rejects(()=>verifyPilotPackage(output),/Package bytes or inventory changed/);
}));
test('existing output is preserved instead of overwritten',()=>fixture(async({bundle,output})=>{
 await mkdir(output);await writeFile(join(output,'sentinel'),'keep');
 await assert.rejects(()=>packageProtectedPilot(bundle,output),/EEXIST/);
 assert.equal(await readFile(join(output,'sentinel'),'utf8'),'keep');
}));
