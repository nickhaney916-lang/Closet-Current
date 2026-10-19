// Synthetic-only offline CLI regression: no fixture here is real ground
// truth, and no human attestation or percent may be copied to product claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const suite=JSON.parse(await readFile('benchmark/deepfashion-real-photo-suite.json','utf8'));
const mask=(()=>{
 const bits=new Uint8Array(12*12);
 for(let y=2;y<8;y++)for(let x=3;x<9;x++)bits[y*12+x]=1;
 let run=0,bit=0,runs=[];
 for(const v of bits){if(v!==bit){runs.push(run);run=0;bit=v;}run++;}
 runs.push(run);return {width:12,height:12,runs};
})();
test('CLI blocks false complete-ten-photo scores and independently constrains synthetic categories',async()=>{
 const root=await mkdtemp(join(tmpdir(),'cc-physical-test-'));
 const review=join(root,'independent-outline-review'),originals=join(review,'original-photos'),
       model=join(review,'model-seeds'),approved=join(review,'approved-physical-inventory');
 try{
  for(const path of [originals,model,approved])await mkdir(path,{recursive:true});
  const sources=suite.cases.map(({id},i)=>{
   const original=Buffer.from('SYNTHETIC FILE NEVER A REAL LICENCED PHOTO '+i);
   return {id,image:id+'.jpg',sourceSha256:createHash('sha256').update(original).digest('hex'),
    originalBytes:original};
  });
  const index={
   status:'awaiting-independent-human-outlines',imageCount:10,
   sourcePhotosPreserved:true,predictionMasksAreGroundTruth:false,
   automaticCustomerMaskPromotion:false,
   cases:sources.map(x=>({id:x.id,image:x.image,sourceSha256:x.sourceSha256,candidateSeeds:[]}))
  };
  const path=join(review,'reference-review-index.json');
  const save=async()=>writeFile(path,JSON.stringify(index));
  const run=()=>spawnSync(process.execPath,['scripts/score-physical-garment-inventory.mjs',root],
     {encoding:'utf8',cwd:process.cwd()});
  const report=()=>readFile(join(root,'physical-garment-inventory-audit.json'),'utf8').then(JSON.parse);
  await save();
  let proc=run();assert.equal(proc.status,0,proc.stderr);
  let output=await report();
  assert.equal(output.completeTenPhotoAccuracy,null);
  assert.equal(output.fullyHumanReviewedSources,0);
  assert.equal(output.sources,10);
  index.cases.pop();await save();
  proc=run();assert.notEqual(proc.status,0);
  assert.match(proc.stderr,/incomplete exact ten-source/);
  index.cases.push({...index.cases[0]});await save();
  proc=run();assert.notEqual(proc.status,0);
  assert.match(proc.stderr,/incomplete exact ten-source/);
  index.cases[9]={
   id:sources[9].id,image:sources[9].image,
   sourceSha256:sources[9].sourceSha256,candidateSeeds:[]
  };await save();
  const setReviewed=async(i,actualCategory,modelClass)=>{
   const form={Tops:'top',Bottoms:'shorts',Dresses:'dress',Outerwear:'outerwear',Shoes:'shoes'}[actualCategory];
   const scene=sources[i],target=scene.id+'-item-01',
         candidate=scene.id+'-candidate-01';
   await writeFile(join(originals,scene.image),scene.originalBytes);
   const anno={schemaVersion:1,image:scene.image,
    sourceSha256:scene.sourceSha256,reviewStatus:'approved',
    reviewer:'Synthetic Fixture A',approvedBy:'Synthetic Fixture B',
    physicalTargetId:target,humanCategory:actualCategory,humanForm:form,humanTargetLabel:'synthetic garment',
    targetIndependentlyIdentifiedBy:'Synthetic Fixture A',seedModel:null,
    modelProposalId:null,...mask};
   const inventory={schemaVersion:1,status:'human-inventory-complete',
    image:scene.image,sourceSha256:scene.sourceSha256,
    originalPhotoVerified:true,allVisibleGarmentsAccountedFor:true,
    reviewedBy:'Synthetic Fixture A',approvedBy:'Synthetic Fixture B',
    reviewedAt:'2026-10-18T10:00:00Z',
    targets:[{id:target,category:actualCategory,form,label:'synthetic garment'}]};
   await writeFile(join(approved,target+'.mask.approved.json'),JSON.stringify(anno));
   await writeFile(join(approved,scene.id+'.inventory.json'),JSON.stringify(inventory));
   const seed={schemaVersion:1,image:scene.image,sourceSha256:scene.sourceSha256,
    modelProposalId:candidate,modelGarmentLabel:modelClass,
    reviewStatus:'prediction-unreviewed',independentReference:false,
    canSaveToCustomerCloset:false,...mask};
   await writeFile(join(model,candidate+'.prediction.json'),JSON.stringify(seed));
   index.cases[i].candidateSeeds=[{
    id:candidate,
    prediction:'independent-outline-review/model-seeds/'+candidate+'.prediction.json'
   }];
   await save();
  };
  await setReviewed(0,'Outerwear','long_sleeve_top'); // correct shape but wrong class
  proc=run();assert.equal(proc.status,0,proc.stderr);
  output=await report();
  assert.equal(output.completeTenPhotoAccuracy,null,'1 of 10 cannot report aggregate accuracy');
  assert.equal(output.partialDatasetAccuracy,null);
  assert.equal(output.fullyHumanReviewedSources,1);
  assert.equal(output.perPhoto[0].detectionRecall,1);
  assert.equal(output.perPhoto[0].categoryConstrainedRecall,0);
  for(let i=1;i<10;i++)await setReviewed(i,'Tops','long_sleeve_top');
  proc=run();assert.equal(proc.status,0,proc.stderr);
  output=await report();
  assert.equal(output.fullyHumanReviewedSources,10);
  assert.equal(output.completeTenPhotoAccuracy.physicalGarmentDetectionRecall,1);
  assert.equal(output.completeTenPhotoAccuracy.correctlyCategorizedGarmentRecall,.9);
  assert.equal(output.completeTenPhotoAccuracy.supportedCategoryCorrectRecall,.9);
  assert.equal(output.completeTenPhotoAccuracy.correctlyIdentifiedFormRecall,.9);
  assert.equal(output.completeTenPhotoAccuracy.missingReviewedFormLabels,0);
  assert.equal(output.completeTenPhotoAccuracy.predictionPrecision,1);
  assert.equal(output.canPromoteModel,false,'Even synthetic perfect masks cannot promote a model');
  assert.equal(output.sourceRgbChanged,false);
 }finally{await rm(root,{recursive:true,force:true});}
});
