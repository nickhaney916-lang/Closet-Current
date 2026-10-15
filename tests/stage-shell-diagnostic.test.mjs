import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
test('gray jacket diagnostic only stages an actual checksum-matching image and never marks it approved',async()=>{
 const root=await mkdtemp(join(tmpdir(),'closet-shell-stage-'));
 try{
  await mkdir(join(root,'benchmark/photo-collection'),{recursive:true});
  const photo=Buffer.from([255,216,255,...Array(2200).fill(42),255,217]);
  const sha256=createHash('sha256').update(photo).digest('hex');
  const report=join(root,'report.json'),candidates=join(root,'candidates.json'),manifest=join(root,'diagnostic/manifest.json'),photos=join(root,'benchmark/photos');
  await writeFile(join(root,'benchmark/photo-collection/candidate-shell-001.jpg'),photo);
  await writeFile(report,JSON.stringify([{id:'candidate-shell-001',status:'downloaded-unreviewed',format:'jpg',sha256,bytes:photo.length}]));
  await writeFile(candidates,JSON.stringify([{id:'candidate-shell-001',verified:false,expectedCategory:'Outerwear',expectedType:'Jacket',source:'https://commons.wikimedia.org/wiki/File:Hard-shell-jacket.jpg'}]));
  await mkdir(join(root,'diagnostic'),{recursive:true});
  const script=join(process.cwd(),'scripts/stage-shell-diagnostic.mjs');
  const run=()=>spawnSync(process.execPath,[script,report,candidates,manifest,photos],{cwd:root,encoding:'utf8'});
  assert.equal(run().status,0);
  const rows=JSON.parse(await readFile(manifest,'utf8'));
  assert.equal(rows.length,1);
  assert.equal(rows[0].diagnosticOnly,true);
  assert.equal(rows[0].expectedType,'Jacket');
  assert.equal(rows[0].sha256,sha256);
  assert.equal(rows[0].verified,undefined);
  assert.deepEqual(await readFile(join(photos,rows[0].image)),photo);
  await writeFile(join(root,'benchmark/photo-collection/candidate-shell-001.jpg'),Buffer.from('tampered image'));
  assert.notEqual(run().status,0,'image tampering must fail');
 }finally{await rm(root,{recursive:true,force:true});}
});
