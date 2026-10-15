import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('independent validation guard rejects benchmark leakage and accepts reviewed new photos',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'closet-independent-'));
 try{
  const baseline=join(dir,'baseline.json'),validation=join(dir,'validation.json');
  await writeFile(baseline,JSON.stringify([{id:'old',image:'old.jpg',source:'https://example.org/old',sha256:'abc'}]));
  const check=rows=>{const run=spawnSync(process.execPath,['scripts/check-independent-validation.mjs',baseline,validation],{encoding:'utf8'});return run;};
  await writeFile(validation,JSON.stringify([{id:'new',image:'new.jpg',source:'https://example.org/new',sha256:'def',verified:true,expectedCategory:'Outerwear',expectedType:'Jacket'}]));
  let run=check();assert.equal(run.status,0,run.stdout+run.stderr);assert.equal(JSON.parse(run.stdout).independent,true);
  await writeFile(validation,JSON.stringify([{id:'new',image:'new.jpg',source:'https://example.org/old',verified:true,expectedCategory:'Outerwear',expectedType:'Jacket'}]));
  run=check();assert.equal(run.status,1);assert.equal(JSON.parse(run.stdout).issues[0].issue,'baseline_overlap');
  await writeFile(validation,JSON.stringify([{id:'x',image:'x.jpg',verified:false,expectedCategory:'Outerwear',expectedType:'Jacket'}]));
  run=check();assert.equal(run.status,1);assert.equal(JSON.parse(run.stdout).issues[0].issue,'unreviewed_or_unlabeled');
 }finally{await rm(dir,{recursive:true,force:true});}
});
