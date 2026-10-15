import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
test('required rainwear download gate succeeds only with real downloaded hashes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'closet-collection-'));
 try{
  const file=join(dir,'report.json');
  const run=()=>spawnSync(process.execPath,['scripts/check-photo-collection.mjs',file,'candidate-shell-001'],{encoding:'utf8'});
  await writeFile(file,JSON.stringify([{id:'candidate-shell-001',status:'download-failed',reason:'HTTP 429'}]));
  assert.notEqual(run().status,0);
  await writeFile(file,JSON.stringify([{id:'candidate-shell-001',status:'downloaded-unreviewed',sha256:'a'.repeat(64),bytes:5000}]));
  assert.equal(run().status,0);
  assert.notEqual(spawnSync(process.execPath,['scripts/check-photo-collection.mjs',file,'candidate-shell-003'],{encoding:'utf8'}).status,0);
 }finally{await rm(dir,{recursive:true,force:true});}
});
