import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('cross-category evidence reports contradiction but never auto-accepts it',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'closet-cross-category-'));
 try{
  const manifest=join(dir,'manifest.json'),results=join(dir,'results.json'),output=join(dir,'report.json');
  await writeFile(manifest,JSON.stringify([{id:'jacket',expectedCategory:'Outerwear',expectedType:'Jacket'}]));
  await writeFile(results,JSON.stringify([{id:'jacket',strong:false,reason:'checks_disagree',diagnostics:{
   category:[{category:'Tops',score:.85}],shadowPreprocessing:{
    originalWholeCategory:[{category:'Outerwear',score:.7}],originalCenterCategory:[{category:'Outerwear',score:.8}],
    originalWholeTypes:[{category:'Outerwear',type:'Jacket',score:.7}],originalCenterTypes:[{category:'Outerwear',type:'Jacket',score:.8}]
   }
  }}]));
  const run=spawnSync(process.execPath,['scripts/report-cross-category-evidence.mjs',manifest,results,output],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const report=JSON.parse(await readFile(output,'utf8'));
  assert.equal(report.contradictoryPrimary,1);assert.equal(report.items[0].id,'jacket');
  assert.ok(!('prediction' in report.items[0]));assert.ok(!('strong' in report.items[0]));
 }finally{await rm(dir,{recursive:true,force:true});}
});
