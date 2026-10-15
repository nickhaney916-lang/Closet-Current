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

test('shadow outerwear vote requires agreement, never changes stored predictions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'closet-shadow-'));
 try{
  const manifest=join(dir,'manifest.json'),results=join(dir,'results.json'),output=join(dir,'report.json');
  const items=[{id:'agree',expectedCategory:'Outerwear',expectedType:'Jacket'},{id:'conflict',expectedCategory:'Outerwear',expectedType:'Coat'}];
  const view=(type,score)=>[{category:'Outerwear',type,score}];
  const data=items.map(item=>({id:item.id,strong:false,prediction:{category:null,type:null},diagnostics:{category:[{category:'Tops',score:.9}],shadowPreprocessing:{
   originalWholeCategory:[{category:'Tops',score:.8}],originalCenterCategory:[{category:'Tops',score:.8}],
   originalWholeTypes:view('Jacket',.8),originalCenterTypes:view(item.id==='agree'?'Jacket':'Coat',.8)
  }}}));
  await writeFile(manifest,JSON.stringify(items));await writeFile(results,JSON.stringify(data));
  const run=spawnSync(process.execPath,['scripts/report-cross-category-evidence.mjs',manifest,results,output],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const report=JSON.parse(await readFile(output,'utf8'));
  assert.equal(report.shadowCandidateCount,1);assert.equal(report.shadowCorrectCount,1);assert.equal(report.shadowIncorrectCount,0);
  assert.equal(report.items.find(x=>x.id==='agree').shadowDetailedCandidate.type,'Jacket');
  assert.equal(report.items.find(x=>x.id==='conflict').shadowDetailedCandidate,null);
  assert.equal(data[0].prediction.category,null);
 }finally{await rm(dir,{recursive:true,force:true});}
});
