import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const sourceId='commons-0090',sha='1'.repeat(64),image=sourceId+'.jpg';
const packet=slot=>({
 schemaVersion:1,reviewType:'independent-blind-original-photo-inventory',
 reviewerSlot:slot,modelPredictionsIncluded:false,manifestCategoryLabelsIncluded:false,
 originalPhotosCopiedOrReencoded:false,independentlyReviewed:false,
 allGarmentFormsVerified:false,photoCount:1,
 originals:[{sourceId,image,sourceSha256:sha,license:'CC BY-SA 4.0'}]
});
const submission=(slot,alias)=>({
 schemaVersion:1,reviewType:'independent-blind-source-submission',
 reviewerSlot:slot,reviewerAlias:alias,reviewedAt:'2026-10-19T08:30:00Z',
 originalJpegsVerified:true,modelAnswersNotShown:true,
 sourceInventories:[{sourceId,sourceSha256:sha,originalJpegShaVerified:true,
  fullSourceInspected:true,allVisibleItemsRecorded:true,items:[],
  uncertaintyNotes:'Complete original photo independently examined; no clothing is visible'}]
});
function runCLI({tamper=null,duplicates=false}={}){
 const temp=mkdtempSync(join(tmpdir(),'closet-evidence-'));
 try{
  const files={
   scene:{id:sourceId,image,sourceSha256:sha},
   locked:{id:sourceId,image,sha256:sha,verified:true,attribution:{license:'CC BY-SA 4.0'}},
   first:packet('first'),firstReview:submission('first','Real reviewer placeholder A'),
   second:packet('second'),secondReview:submission('second','Real reviewer placeholder B'),
   proposals:duplicates?[{id:'x',prediction:{}},{id:'x',prediction:{}}]:[]
  };
  tamper?.(files);
  const paths=Object.fromEntries(Object.entries(files).map(([name,data])=>{
   const path=join(temp,name+'.json');writeFileSync(path,JSON.stringify(data));
   return [name,path];
  }));
  const out=join(temp,'reports','result.json');
  const args=[paths.scene,paths.locked,paths.first,paths.firstReview,
   paths.second,paths.secondReview,'-','-',paths.proposals,out];
  const proc=spawnSync(process.execPath,['scripts/audit-blind-physical-inventory.mjs',...args],
   {cwd:process.cwd(),encoding:'utf8'});
  return {status:proc.status,stdout:proc.stdout,stderr:proc.stderr,
   written:existsSync(out),report:existsSync(out)?JSON.parse(readFileSync(out,'utf8')):null};
 }finally{rmSync(temp,{recursive:true,force:true});}
}
test('local-only CLI accepts a complete synthetic negative original but reports no invented recall or specificity',()=>{
 const x=runCLI();
 assert.equal(x.status,0,x.stderr);
 assert.equal(x.written,true);
 assert.equal(x.report.status,'blind-observed-no-visible-garments');
 assert.equal(x.report.detectionRecall,null);
 assert.equal(x.report.predictedBackgroundFalsePositiveCount,null);
 assert.equal(x.report.canRelease,false);
 assert.match(x.stdout,/BLIND_LINKED_PHYSICAL_INVENTORY/);
});
test('wrong SHA refuses output and duplicate model rows never create evidence file',()=>{
 const bad=runCLI({tamper:files=>{files.locked.sha256='f'.repeat(64);}});
 assert.notEqual(bad.status,0);
 assert.equal(bad.written,false);
 const dupe=runCLI({duplicates:true});
 assert.notEqual(dupe.status,0);
 assert.equal(dupe.written,false);
});
