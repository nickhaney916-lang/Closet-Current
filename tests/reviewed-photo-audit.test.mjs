import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const script='scripts/audit-100-photo-results.mjs';
async function audit(manifest,results){
 const folder=await mkdtemp(join(tmpdir(),'closet-audit-'));
 try{
  const m=join(folder,'manifest.json'),r=join(folder,'results.json');
  await writeFile(m,JSON.stringify(manifest));await writeFile(r,JSON.stringify(results));
  const process=spawnSync(processExecPath(),[script,m,r,join(folder,'report.json'),String(manifest.length)],{encoding:'utf8'});
  return {status:process.status,report:JSON.parse(process.stdout)};
 }finally{await rm(folder,{recursive:true,force:true});}
}
function processExecPath(){return process.execPath;}
const fixtures=[
 {id:'top',mode:'single',verified:true,expectedCategory:'Tops',expectedType:'T-shirt'},
 {id:'negative',mode:'single',verified:true,expectedCategory:'Uncategorized',expectedType:'Unknown'}
];
test('correct positive plus safely rejected negative passes',async()=>{
 const {status,report}=await audit(fixtures,[
  {id:'top',strong:true,prediction:{category:'Tops',type:'T-shirt'}},
  {id:'negative',strong:false,categoryConfirmed:false,prediction:{category:null,type:null}}
 ]);
 assert.equal(status,0);assert.equal(report.negativeControls.correctlyRejected,1);assert.equal(report.categoryAccuracyPercent,100);assert.equal(report.automaticWrongSubtypeCount,0);assert.equal(report.passing,true);
});
test('negative classified as a garment fails',async()=>{
 const {status,report}=await audit(fixtures,[
  {id:'top',strong:true,prediction:{category:'Tops',type:'T-shirt'}},
  {id:'negative',strong:true,prediction:{category:'Dresses',type:'Dress'}}
 ]);
 assert.equal(status,1);assert.equal(report.negativeControls.falsePositives,1);
});
test('wrong automatic subtype is reported as a failure',async()=>{
 const {status,report}=await audit(fixtures,[
  {id:'top',strong:true,prediction:{category:'Tops',type:'Blouse'}},
  {id:'negative',strong:false,prediction:{}}
 ]);
 assert.equal(status,1);assert.ok(report.issues.some(x=>x.kind==='wrong_automatic_subtype'));
});

test('duplicate manifest IDs cannot inflate measured accuracy',async()=>{
 const duplicate=[fixtures[0],{...fixtures[0]}];
 const {status,report}=await audit(duplicate,[
  {id:'top',strong:true,prediction:{category:'Tops',type:'T-shirt'}}
 ]);
 assert.equal(status,1);
 assert.ok(report.issues.some(x=>x.kind==='duplicate_manifest_id'));
});

test('category-only Unknown subtype is a mismatch, not a confident wrong subtype',async()=>{
 const {status,report}=await audit(fixtures,[
  {id:'top',strong:true,categoryOnly:true,prediction:{category:'Tops',type:'Unknown'}},
  {id:'negative',strong:false,prediction:{}}
 ]);
 assert.equal(status,1);
 assert.equal(report.automaticWrongSubtypeCount,0);
 assert.ok(report.issues.some(x=>x.id==='top'&&x.kind==='type_mismatch'));
});

test('browser benchmark preserves category-only result for audit',async()=>{
 const runner=await readFile('public/benchmark-runner.mjs','utf8');
 assert.match(runner,/categoryOnly:\s*!!result\.categoryOnly/);
});

test('photo benchmark opts into shadow preprocessing without changing regular capture',async()=>{
 const runner=await readFile('public/benchmark-runner.mjs','utf8');
 const worker=await readFile('public/local-worker.mjs','utf8');
 assert.match(runner,/type:'classify',image:data,benchmarkDiagnostics:true/);
 assert.match(worker,/if\(request\.benchmarkDiagnostics===true\)/);
 assert.match(worker,/shadowPreprocessing/);
 assert.match(worker,/originalWholeTypes/);
 assert.match(worker,/originalCenterTypes/);
});
