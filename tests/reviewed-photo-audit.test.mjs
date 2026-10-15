import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
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
 assert.equal(status,0);assert.equal(report.negativeControls.correctlyRejected,1);assert.equal(report.categoryAccuracyPercent,100);
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
 assert.equal(status,1);assert.ok(report.issues.some(x=>x.kind==='type_mismatch'));
});
