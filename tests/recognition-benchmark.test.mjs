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
  const report=JSON.parse(p.stdout);assert.equal(report.single.evaluated,100);assert.equal(report.single.categoryAccuracyPercent,80);assert.equal(report.single.categoryCoveragePercent,100);assert.equal(report.single.categoryPrecisionAmongPredictionsPercent,80);assert.equal(report.single.wrongCategoryCount,20);assert.equal(report.single.typeAccuracyPercent,60);assert.equal(report.outfit.evaluated,100);assert.equal(report.outfit.expectedPieces,200);assert.equal(report.outfit.matchedPieces,150);assert.equal(report.outfit.pieceRecallPercent,75);
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

test('abstained garments lower coverage without inventing incorrect positive classifications',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'closet-holdout-coverage-'));
 try{
  const manifest=[],results=[];
  for(let i=0;i<13;i++){
   const category=['Tops','Bottoms','Dresses','Outerwear','Shoes'][i%5];
   manifest.push({id:'owned-'+i,mode:'single',expectedCategory:category,expectedType:'Unknown'});
   results.push({id:'owned-'+i,strong:i<5,categoryConfirmed:false,
    prediction:i<8?{category,type:'Unknown'}:{category:null,type:null},
    reason:i<8?'accepted':'category_uncertain'});
  }
  for(let i=0;i<3;i++){
   manifest.push({id:'negative-'+i,mode:'single',expectedCategory:'Uncategorized',expectedType:'Unknown'});
   results.push({id:'negative-'+i,strong:false,categoryConfirmed:false,prediction:{category:null,type:null}});
  }
  const a=path.join(dir,'manifest.json'),b=path.join(dir,'results.json');
  fs.writeFileSync(a,JSON.stringify(manifest));fs.writeFileSync(b,JSON.stringify(results));
  const p=spawnSync(process.execPath,['scripts/evaluate-recognition-benchmark.mjs',a,b],{encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  const report=JSON.parse(p.stdout),metrics=report.single;
  assert.equal(metrics.evaluated,13);
  assert.equal(metrics.categoryAccuracyPercent,61.54,'all-photo accuracy includes abstentions');
  assert.equal(metrics.categoryCoveragePercent,61.54,'coverage is separately reported');
  assert.equal(metrics.categoryPrecisionAmongPredictionsPercent,100,'none of the eight answered categories is wrong');
  assert.equal(metrics.categoryPredictedCount,8);
  assert.equal(metrics.abstainedCount,5);
  assert.deepEqual(metrics.abstainedPhotoIds,['owned-8','owned-9','owned-10','owned-11','owned-12']);
  assert.equal(metrics.autoIndexedCorrectCategoryCount,5);
  assert.equal(metrics.autoIndexedWrongCategoryCount,0);
  assert.equal(metrics.autoIndexedCorrectTypeCount,5);
  assert.equal(metrics.autoIndexedWrongTypeCount,0);
  assert.deepEqual(report.negative,{evaluated:3,rejected:3,falsePositives:0});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('wrong automatic category is flagged independently of abstention',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'closet-holdout-wrong-auto-'));
 try{
  const manifest=[{id:'shirt',mode:'single',expectedCategory:'Tops',expectedType:'T-shirt'},
   {id:'wrong',mode:'single',expectedCategory:'Dresses',expectedType:'Dress'},
   {id:'blank',mode:'single',expectedCategory:'Bottoms',expectedType:'Skirt'}];
  const results=[{id:'shirt',strong:true,categoryConfirmed:false,prediction:{category:'Tops',type:'T-shirt'}},
   {id:'wrong',strong:true,categoryConfirmed:false,prediction:{category:'Tops',type:'Tunic'}},
   {id:'blank',strong:false,categoryConfirmed:false,prediction:{category:null,type:null}}];
  const a=path.join(dir,'manifest.json'),b=path.join(dir,'results.json');
  fs.writeFileSync(a,JSON.stringify(manifest));fs.writeFileSync(b,JSON.stringify(results));
  const p=spawnSync(process.execPath,['scripts/evaluate-recognition-benchmark.mjs',a,b],{encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  const metrics=JSON.parse(p.stdout).single;
  assert.equal(metrics.categoryCoveragePercent,66.67);
  assert.equal(metrics.categoryPrecisionAmongPredictionsPercent,50);
  assert.equal(metrics.autoIndexedCorrectCategoryCount,1);
  assert.equal(metrics.autoIndexedWrongCategoryCount,1);
  assert.equal(metrics.autoIndexedCorrectTypeCount,1);
  assert.equal(metrics.autoIndexedWrongTypeCount,1);
  assert.deepEqual(metrics.incorrectAutoIndexedTypeIds,['wrong']);
  assert.deepEqual(metrics.incorrectAutoIndexedIds,['wrong']);
  assert.deepEqual(metrics.incorrectCategoryIds,['wrong']);
  assert.deepEqual(metrics.abstainedPhotoIds,['blank']);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
