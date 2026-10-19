import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planReviewedMaskImports} from '../benchmark/stage-reviewed-masks.mjs';
import {approvedReferenceMask} from '../benchmark/garment-mask-metrics.mjs';

const manifest=JSON.parse(readFileSync('benchmark/segmentation-review-manifest.json','utf8'));
const sources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const first=manifest.cases[0];
const annotation=(entry=first)=>({
 schemaVersion:1,image:entry.image,sourceSha256:entry.sourceSha256,
 width:4,height:4,runs:[1,2,13],reviewStatus:'approved',
 reviewer:'Reviewer One',approvedBy:'Reviewer Two',
 reviewedAt:'2026-10-17T20:00:00.000Z'
});
const hashes=entries=>new Map(entries.map(e=>[e.id,e.sourceSha256]));
const submission=(entry=first)=>({id:entry.id,annotation:annotation(entry)});
const stage=(submissions=[submission()],photoHashes=hashes(manifest.cases),m=manifest)=>
 planReviewedMaskImports(m,sources,submissions,photoHashes);

test('real six-photo review queue remains unchanged while an approved outline is staged',()=>{
 const snapshot=JSON.stringify(manifest);
 const result=stage();
 assert.equal(JSON.stringify(manifest),snapshot);
 assert.equal(result.added,1);
 assert.equal(result.pending,5);
 assert.equal(result.activeManifestUnchanged,true);
 assert.equal(result.candidate.status,'partially-human-reviewed');
 assert.equal(result.files[0].path,'benchmark/approved-reference-masks/commons-0035.mask.approved.json');
 assert.equal(result.candidate.cases[0].referenceMask,result.files[0].path);
 assert.equal(result.candidate.cases[1].reviewStatus,'pending');
});
test('only independent-approved masks belonging to the exact locked source are staged',()=>{
 const variants=[
  {...annotation(),reviewStatus:'draft'},
  {...annotation(),approvedBy:'reviewer one'},
  {...annotation(),image:'wrong.jpg'},
  {...annotation(),sourceSha256:'0'.repeat(64)},
  {...annotation(),runs:[0,16]},
  {...annotation(),reviewedAt:''}
 ];
 for(const item of variants){
  assert.throws(()=>stage([{id:first.id,annotation:item}]),undefined,JSON.stringify(item).slice(0,120));
 }
 assert.throws(()=>stage([submission()],new Map()),/checksum/);
 assert.throws(()=>stage([submission(),submission()]),/duplicate/);
 assert.throws(()=>stage([{id:'../../private',annotation:annotation()}]),/Unknown or duplicate/);
});
test('all six valid approved outlines produce a candidate without changing active references',()=>{
 const input=manifest.cases.map(entry=>submission(entry));
 const result=stage(input);
 assert.equal(result.added,6);assert.equal(result.pending,0);
 assert.equal(result.candidate.status,'human-reviewed');
 assert.ok(result.candidate.cases.every(c=>c.reviewStatus==='approved'&&c.referenceMask));
 assert.ok(manifest.cases.every(c=>c.reviewStatus==='pending'&&c.referenceMask===null));
});
test('existing approved files may not be silently overwritten or reapproved',()=>{
 const changed=structuredClone(manifest);
 changed.cases[0].referenceMask='benchmark/approved-reference-masks/commons-0035.mask.approved.json';
 changed.cases[0].reviewStatus='approved';
 assert.throws(()=>stage([submission()],hashes(manifest.cases),changed),/Already approved/);
});
test('reviewer identity must differ even when capitalization changes',()=>{
 const mask=annotation();
 assert.throws(()=>approvedReferenceMask({...mask,approvedBy:'reviewer one'},first),/Independent second reviewer/);
 assert.deepEqual([...approvedReferenceMask(mask,first)],[0,1,1,...Array(13).fill(0)]);
});
test('a forged source entry or a missing locked hash cannot stage ground truth',()=>{
 const changed=structuredClone(manifest);changed.cases[0].sourceSha256='0'.repeat(64);
 assert.throws(()=>stage([submission()],hashes(manifest.cases),changed),/does not match locked source/);
 const wrong=new Map([[first.id,'0'.repeat(64)]]);
 assert.throws(()=>stage([submission()],wrong),/checksum/);
});
