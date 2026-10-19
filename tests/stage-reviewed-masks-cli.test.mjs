import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const command=resolve('scripts/stage-approved-garment-masks.mjs');
function fixture({mismatch=false}={}){
 const dir=mkdtempSync(join(tmpdir(),'closet-reference-stage-'));
 mkdirSync(join(dir,'benchmark'),{recursive:true});
 mkdirSync(join(dir,'inputs'),{recursive:true});
 mkdirSync(join(dir,'packet'),{recursive:true});
 const id='commons-0035',image=id+'.jpg';
 // Synthetic bytes validate the staging CLI's actual SHA check. These are
 // not photos or approved clothing ground truth.
 const bytes=Buffer.from('synthetic-source-bytes-for-staging-only');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const entry={id,image,sourceSha256:sha,referenceMask:null,reviewStatus:'pending'};
 const manifest={schemaVersion:1,status:'awaiting-human-annotations',cases:[entry]};
 const sources=[{id,image,sha256:sha,verified:true}];
 const annotation={schemaVersion:1,image,sourceSha256:sha,
  width:4,height:4,runs:[1,2,13],reviewer:'First Reviewer',
  approvedBy:'Second Reviewer',reviewStatus:'approved',
  reviewedAt:'2026-10-17T20:00:00.000Z'};
 const sourceFile=join(dir,'benchmark/segmentation-review-manifest.json');
 writeFileSync(sourceFile,JSON.stringify(manifest));
 writeFileSync(join(dir,'benchmark/locked-photo-sources.json'),JSON.stringify(sources));
 writeFileSync(join(dir,'packet',id+'.original.jpg'),mismatch?'tampered original':bytes);
 const approvedFile=join(dir,'inputs',id+'.mask.approved.json');
 writeFileSync(approvedFile,JSON.stringify(annotation));
 const run=()=>spawnSync(process.execPath,[command,join(dir,'packet'),approvedFile],
  {cwd:dir,encoding:'utf8',timeout:20000});
 return {dir,sourceFile,manifest,entry,run,cleanup:()=>rmSync(dir,{recursive:true,force:true})};
}

test('CLI stages independently approved references but never overwrites live manifest',()=>{
 const f=fixture();
 try{
  const initial=readFileSync(f.sourceFile,'utf8');
  const first=f.run();
  assert.equal(first.status,0,first.stderr);
  const answer=JSON.parse(first.stdout);
  assert.equal(answer.status,'candidate-only-not-promoted');
  assert.equal(answer.imported,1);assert.equal(answer.stillPending,0);
  assert.equal(readFileSync(f.sourceFile,'utf8'),initial);
  const candidate=JSON.parse(readFileSync(join(f.dir,'benchmark/segmentation-review-manifest.candidate.json'),'utf8'));
  assert.equal(candidate.cases[0].reviewStatus,'approved');
  assert.equal(candidate.cases[0].referenceMask,'benchmark/approved-reference-masks/commons-0035.mask.approved.json');
  assert.ok(existsSync(join(f.dir,candidate.cases[0].referenceMask)));
  const again=f.run();
  assert.notEqual(again.status,0,'re-import must refuse overwriting approved evidence');
  assert.match(again.stderr,/Output exists/);
  assert.equal(readFileSync(f.sourceFile,'utf8'),initial);
 }finally{f.cleanup();}
});

test('CLI rejects mismatched original photo SHA before generating any approved files',()=>{
 const f=fixture({mismatch:true});
 try{
  const result=f.run();
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/checksum/);
  assert.equal(existsSync(join(f.dir,'benchmark/segmentation-review-manifest.candidate.json')),false);
  assert.equal(existsSync(join(f.dir,'benchmark/approved-reference-masks/commons-0035.mask.approved.json')),false);
  assert.equal(JSON.parse(readFileSync(f.sourceFile,'utf8')).cases[0].reviewStatus,'pending');
 }finally{f.cleanup();}
});
