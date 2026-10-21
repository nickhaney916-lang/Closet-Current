import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStagingAssetSeal,verifyStagingAssetSeal,SEAL_FILE} from '../scripts/staging-asset-seal.mjs';

async function fixture(fn){
 const base=await mkdtemp(join(tmpdir(),'closet-sealed-stage-')),dir=join(base,'staging-dist');
 await mkdir(join(dir,'icons'),{recursive:true});
 await writeFile(join(dir,'index.html'),'<html>private test</html>');
 await writeFile(join(dir,'icons','icon.png'),Buffer.from([0,255,128,2,9]));
 try{await fn(dir);}finally{await rm(base,{recursive:true,force:true});}
}
test('whole-bundle SHA-256 inventory includes binary bytes and denies release',async()=>{
 await fixture(async dir=>{
  const produced=await createStagingAssetSeal(dir);
  assert.equal(produced.fileCount,2);
  const manifest=JSON.parse(await readFile(join(dir,SEAL_FILE),'utf8'));
  assert.deepEqual(manifest.files.map(x=>x.path),['icons/icon.png','index.html']);
  assert.equal(manifest.files[0].bytes,5);
  assert.equal(manifest.files[0].sha256.length,64);
  const proof=await verifyStagingAssetSeal(dir);
  assert.equal(proof.allAssetBytesVerified,true);
  assert.equal(proof.signed,false);
  assert.equal(proof.permittedToDeploy,false);
 });
});
test('altered binary file of identical length fails closed',async()=>{
 await fixture(async dir=>{
  await createStagingAssetSeal(dir);
  await writeFile(join(dir,'icons','icon.png'),Buffer.from([0,255,128,2,10]));
  await assert.rejects(verifyStagingAssetSeal(dir),/changed asset icons\/icon.png/);
 });
});
test('changed script or missing file fails closed',async()=>{
 await fixture(async dir=>{
  await createStagingAssetSeal(dir);
  await writeFile(join(dir,'index.html'),'<html>tampered</html>');
  await assert.rejects(verifyStagingAssetSeal(dir),/changed asset/);
  await unlink(join(dir,'index.html'));
  await assert.rejects(verifyStagingAssetSeal(dir),/added or deleted asset/);
 });
});
test('unreviewed added files are refused, even if harmless-looking',async()=>{
 await fixture(async dir=>{
  await createStagingAssetSeal(dir);
  await writeFile(join(dir,'extra.txt'),'new');
  await assert.rejects(verifyStagingAssetSeal(dir),/added or deleted asset/);
 });
});
test('missing, truncated or altered manifest is refused',async()=>{
 await fixture(async dir=>{
  await assert.rejects(verifyStagingAssetSeal(dir),/ENOENT/);
  await createStagingAssetSeal(dir);
  const file=join(dir,SEAL_FILE);
  const manifest=JSON.parse(await readFile(file,'utf8'));
  manifest.permittedToDeploy=true;
  await writeFile(file,JSON.stringify(manifest));
  await assert.rejects(verifyStagingAssetSeal(dir),/invalid or altered manifest/);
  await writeFile(file,'not valid JSON');
  await assert.rejects(verifyStagingAssetSeal(dir),/malformed asset manifest/);
 });
});
test('duplicate paths and path traversal in a forged manifest fail before any file reads',async()=>{
 await fixture(async dir=>{
  await createStagingAssetSeal(dir);
  const file=join(dir,SEAL_FILE),good=JSON.parse(await readFile(file,'utf8'));
  for(const bad of [
   {...good,files:[good.files[0],good.files[0]]},
   {...good,files:[{...good.files[0],path:'../outside'},good.files[1]]},
   {...good,files:[{...good.files[0],path:'assets\\..\\evil'},good.files[1]]},
   {...good,files:[{...good.files[0],sha256:'a'.repeat(64)},good.files[1]],unknown:'true'}
  ]){
   await writeFile(file,JSON.stringify(bad));
   await assert.rejects(verifyStagingAssetSeal(dir),/invalid or duplicate asset entry|invalid or altered manifest/);
  }
 });
});
test('original seal cannot be overwritten and remains verifiable',async()=>{
 await fixture(async dir=>{
  await createStagingAssetSeal(dir);
  await assert.rejects(createStagingAssetSeal(dir),/seal already exists/);
  assert.equal((await verifyStagingAssetSeal(dir)).assetCount,2);
 });
});
