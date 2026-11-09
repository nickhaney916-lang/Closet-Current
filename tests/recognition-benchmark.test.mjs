import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
test('real-photo evaluator scores 100 singles and 100 outfits without fabricated recognition results',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'closet-benchmark-'));
 try{
  const manifest=[],results=[];
  for(let i=0;i<100;i++){
   manifest.push({id:'single-'+i,mode:'single',expectedCategory:'Tops',expectedType:'T-shirt'});
   results.push({id:'single-'+i,prediction:{category:i%5===0?'Bottoms':'Tops',type:i%4===0?'Blouse':'T-shirt'}});
   manifest.push({id:'outfit-'+i,mode:'outfit',expectedPieces:[{category:'Tops',type:'T-shirt'},{category:'Bottoms',type:'Jeans'}]});
   results.push({id:'outfit-'+i,predictedPieces:i%2?[{category:'Tops',type:'T-shirt'},{category:'Bottoms',type:'Jeans'}]:[{category:'Tops',type:'T-shirt'}]});
  }
  const a=path.join(dir,'manifest.json'),b=path.join(dir,'results.json');fs.writeFileSync(a,JSON.stringify(manifest));fs.writeFileSync(b,JSON.stringify(results));
  const p=spawnSync(process.execPath,['scripts/evaluate-recognition-benchmark.mjs',a,b],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);
  const report=JSON.parse(p.stdout);assert.equal(report.single.evaluated,100);assert.equal(report.single.categoryAccuracyPercent,80);assert.equal(report.single.typeAccuracyPercent,60);assert.equal(report.outfit.evaluated,100);assert.equal(report.outfit.expectedPieces,200);assert.equal(report.outfit.matchedPieces,150);assert.equal(report.outfit.pieceRecallPercent,75);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('category review and non-clothing rejections are scored separately from automatic indexing',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'closet-review-benchmark-'));
 try{
  const manifest=[{id:'dress',mode:'single',expectedCategory:'Dresses',expectedType:'Casual dress'},{id:'landscape',mode:'single',expectedCategory:'Uncategorized'},{id:'painting',mode:'single',expectedCategory:'Uncategorized'},{id:'error',mode:'single',expectedCategory:'Uncategorized'}];
  const results=[{id:'dress',strong:false,categoryConfirmed:true,reason:'dress_type_review',prediction:{category:'Dresses',type:'Unknown'}},{id:'landscape',strong:false,prediction:{category:null}},{id:'painting',strong:true,prediction:{category:'Tops',type:'Blouse'}},{id:'error',error:'model failed'}];
  const a=path.join(dir,'manifest.json'),b=path.join(dir,'results.json');fs.writeFileSync(a,JSON.stringify(manifest));fs.writeFileSync(b,JSON.stringify(results));
  const p=spawnSync(process.execPath,['scripts/evaluate-recognition-benchmark.mjs',a,b],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);const r=JSON.parse(p.stdout);
  assert.equal(r.single.categoryAccuracyPercent,100);assert.equal(r.single.typeAccuracyPercent,0);assert.equal(r.single.autoIndexedCount,0);assert.equal(r.single.categoryReviewCount,1);assert.deepEqual(r.negative,{evaluated:3,rejected:1,falsePositives:1});assert.ok(r.errors.some(x=>x.reason==='runtime_error'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

function evaluateFixture(manifest,results){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'closet-coverage-'));
 try{
  const a=path.join(dir,'manifest.json'),b=path.join(dir,'results.json');
  fs.writeFileSync(a,JSON.stringify(manifest));fs.writeFileSync(b,JSON.stringify(results));
  return spawnSync(process.execPath,['scripts/evaluate-recognition-benchmark.mjs',a,b],{encoding:'utf8'});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
const single=id=>({id,mode:'single',expectedCategory:'Tops',expectedType:'T-shirt'});
const correct=id=>({id,prediction:{category:'Tops',type:'T-shirt'}});
test('incomplete inference cannot inflate garment, negative or instance denominators',()=>{
 const p=evaluateFixture([single('a'),single('b'),{id:'negative',mode:'single',expectedCategory:'Uncategorized'},{id:'outfit',mode:'outfit',expectedPieces:[{category:'Tops',type:'T-shirt'}]}],[correct('a')]);
 assert.equal(p.status,1,p.stderr);const r=JSON.parse(p.stdout);
 assert.equal(r.missingResults,3);assert.equal(r.single.evaluated,2);
 assert.equal(r.single.categoryAccuracyPercent,50);assert.equal(r.single.typeAccuracyPercent,50);
 assert.equal(r.negative.evaluated,1);assert.equal(r.negative.rejected,0);
 assert.equal(r.outfit.expectedPieces,1);assert.equal(r.outfit.pieceRecallPercent,0);
});
test('foreign results and duplicate manifest sources fail rather than silently changing coverage',()=>{
 for(const [m,r] of [[[single('a')],[correct('a'),correct('foreign')]],[[single('a'),single('a')],[correct('a')]]]){
  const p=evaluateFixture(m,r);assert.notEqual(p.status,0);assert.equal(p.stdout,'');
 }
});
test('errored inference cannot gain category, subtype or outfit credit from stale output',()=>{
 const p=evaluateFixture([single('a'),{id:'o',mode:'outfit',expectedPieces:[{category:'Tops',type:'T-shirt'}]}],[{...correct('a'),error:'inference failed'},{id:'o',error:'inference failed',predictedPieces:[{category:'Tops',type:'T-shirt'}]}]);
 assert.equal(p.status,0,p.stderr);const r=JSON.parse(p.stdout);
 assert.equal(r.single.categoryAccuracyPercent,0);assert.equal(r.single.typeAccuracyPercent,0);
 assert.equal(r.single.acceptedTypeAccuracyPercent,0);assert.equal(r.outfit.matchedPieces,0);
});
