import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createBlindPhysicalReviewPacket} from '../scripts/build-blind-physical-review-packet.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function fixtures(){
 const tmp=await mkdtemp(join(tmpdir(),'closet-blind-review-'));
 const source=join(tmp,'source'),dest=join(tmp,'blind'),tools=join(tmp,'tool-html');
 await mkdir(join(source,'original-photos'),{recursive:true});await mkdir(tools);
 const cases=[],coverage=[];
 for(let i=0;i<10;i++){
  const id=(i%2===0?'commons-':'validation-')+String(i+1).padStart(4,'0');
  const image=id+'.jpg',bytes=Buffer.from([255,216,17,i,255,217]),sha256=hash(bytes);
  await writeFile(join(source,'original-photos',image),bytes);
  const credit={title:'Source context includes jacket and dress',author:'Example Photographer',
   license:'CC BY-SA',source:'https://commons.wikimedia.org/wiki/File:example'};
  cases.push({id,image,sourceSha256:sha256,allMasksUnapproved:true,
   exactOriginalIncludedForReview:true,candidateSeeds:[{id:id+'-candidate-01'}],
   attribution:credit,reviewFirst:i<5});
  coverage.push({id,image,sha256,includedUnchanged:true,physicalGarmentCount:null,
   independentlyApprovedMasks:0});
 }
 await writeFile(join(source,'reference-review-index.json'),JSON.stringify({
  imageCount:10,cases,approvedReferences:0,predictionMasksAreGroundTruth:false,
  automaticCustomerMaskPromotion:false
 }));
 await writeFile(join(source,'source-original-coverage.json'),JSON.stringify({
  sourcePhotoCount:10,verifiedOriginalCount:10,allOriginalSHA256Matched:true,
  independentlyApprovedGarmentMasks:0,measuredPhysicalGarmentAccuracy:null,
  canAutoSaveOrPromote:false,sources:coverage
 }));
 for(const file of ['annotate-garment.html','approve-garment-mask.html','assemble-physical-inventory.html'])
  await writeFile(join(tools,file),'<!doctype html><title>Offline editor</title>');
 return {tmp,source,dest,tools,cases,coverage};
}
test('verified ten original photos form model-blind offline human review bundle, with no approval',async()=>{
 const f=await fixtures();
 try {
  const result=await createBlindPhysicalReviewPacket(f.source,f.dest,{toolDir:f.tools});
  assert.equal(result.sourcePhotoCount,10);
  assert.equal(result.independentlyApprovedMasks,0);
  assert.equal(result.pixelIoU,null);
  assert.equal(result.canPromoteModel,false);
  assert.equal(result.blindToModelProposals,true);
  assert.equal(result.modelMasksIncluded,0);
  const index=await readFile(join(f.dest,'REVIEW-FIRST.html'),'utf8');
  assert.equal((index.match(/<article>/g)||[]).length,10);
  assert.ok(index.includes('Step 1 · Draw independent physical garment outlines'));
  assert.ok(index.includes('Step 2 · Separate reviewer checks outlines'));
  assert.ok(index.includes('commons-0001.jpg'));
  assert.ok(index.indexOf('commons-0001.jpg')<index.indexOf('validation-0010.jpg'),
   'priority photos come first');
  assert.ok(!index.includes('candidate-01'));
  assert.ok(!index.includes('jacket and dress'),'photographer labels not shown during blind review');
  assert.ok(!index.includes('AI proposal overlay'));
  const children=await readdir(f.dest);
  assert.deepEqual(children.sort(),[
   'BLIND-REVIEW-INSTRUCTIONS.txt','BLIND-REVIEW-STATUS.json','LICENSES.html',
   'REVIEW-FIRST.html','original-photos','tools'].sort());
  assert.deepEqual((await readdir(join(f.dest,'original-photos'))).sort(),f.cases.map(x=>x.image).sort());
  const original=await readFile(join(f.dest,'original-photos','commons-0001.jpg'));
  assert.equal(hash(original),f.cases[0].sourceSha256);
  assert.equal((await stat(join(f.dest,'tools','annotate-garment.html'))).isFile(),true);
 }finally{await rm(f.tmp,{recursive:true,force:true});}
});
test('changed photo checksum aborts before creating misleading partial review',async()=>{
 const f=await fixtures();
 try{
  await writeFile(join(f.source,'original-photos',f.cases[3].image),Buffer.from([255,216,8,7,255,217]));
  await assert.rejects(createBlindPhysicalReviewPacket(f.source,f.dest,{toolDir:f.tools}),/checksum/);
  await assert.rejects(stat(f.dest),/ENOENT/);
 }finally{await rm(f.tmp,{recursive:true,force:true});}
});
test('reject fabricated reviewer approvals and incomplete sources',async()=>{
 const f=await fixtures();
 try{
  const file=join(f.source,'reference-review-index.json');
  const original=JSON.parse(await readFile(file,'utf8'));
  original.approvedReferences=10;
  await writeFile(file,JSON.stringify(original));
  await assert.rejects(createBlindPhysicalReviewPacket(f.source,f.dest,{toolDir:f.tools}),/complete, unapproved/);
  original.approvedReferences=0;original.cases.pop();
  await writeFile(file,JSON.stringify(original));
  await assert.rejects(createBlindPhysicalReviewPacket(f.source,f.dest,{toolDir:f.tools}),/complete, unapproved/);
 }finally{await rm(f.tmp,{recursive:true,force:true});}
});
test('duplicate original IDs and source-reconciliation mismatch fail closed',async()=>{
 const f=await fixtures();
 try{
  const file=join(f.source,'reference-review-index.json');
  const original=JSON.parse(await readFile(file,'utf8'));
  original.cases[9]=structuredClone(original.cases[0]);
  await writeFile(file,JSON.stringify(original));
  await assert.rejects(createBlindPhysicalReviewPacket(f.source,f.dest,{toolDir:f.tools}),/locked review identity/);
  original.cases[9]=f.cases[9];
  const coverageFile=join(f.source,'source-original-coverage.json');
  const coverage=JSON.parse(await readFile(coverageFile,'utf8'));
  coverage.sources[9].sha256='f'.repeat(64);
  await writeFile(file,JSON.stringify(original));
  await writeFile(coverageFile,JSON.stringify(coverage));
  await assert.rejects(createBlindPhysicalReviewPacket(f.source,f.dest,{toolDir:f.tools}),/locked source coverage/);
 }finally{await rm(f.tmp,{recursive:true,force:true});}
});
