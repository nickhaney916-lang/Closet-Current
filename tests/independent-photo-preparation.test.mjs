import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('photo preparation promotes only approved licensed reviewed candidates and counts missing garment types',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'closet-promotion-'));
 try{
  const input=join(dir,'candidates.json'),manifest=join(dir,'manifest.json'),report=join(dir,'report.json');
  const approved={id:'approved',image:'approved.jpg',source:'https://example.com/approved',verified:true,reviewStatus:'approved',expectedCategory:'Outerwear',expectedType:'Raincoat',license:'CC BY 4.0',credit:'Photographer'};
  await writeFile(input,JSON.stringify([approved,{...approved,id:'excluded',reviewStatus:'excluded-same-garment'},{...approved,id:'unreviewed',verified:false}]));
  const run=spawnSync(process.execPath,['scripts/prepare-independent-photos.mjs',input,manifest,report],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const out=JSON.parse(await readFile(manifest,'utf8')),stats=JSON.parse(await readFile(report,'utf8'));
  assert.equal(out.length,1);assert.equal(out[0].id,'approved');
  assert.equal(stats.approvedCount,1);assert.equal(stats.blocked.length,2);assert.equal(stats.reviewQueueCount,1);assert.equal(stats.excludedCount,1);assert.equal(stats.reviewQueue[0].id,'unreviewed');
  assert.equal(stats.coverageByType.Raincoat,1);assert.equal(stats.missingByType.Jacket,5);
  assert.equal(stats.ready,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
