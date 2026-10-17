import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildGarmentReviewPacket} from '../benchmark/garment-review-packet.mjs';

const manifest=JSON.parse(readFileSync('benchmark/segmentation-review-manifest.json','utf8'));
const sources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const pending=()=>manifest.cases.map((c,i)=>({
 id:c.id,status:'awaiting-human-reference',metrics:null,colorSampling:null,
 fragments:{count:3+i,components:[]}
}));
test('offline packet identifies six SHA-locked source photos without ground-truth claims',()=>{
 const output=buildGarmentReviewPacket(manifest,sources,pending());
 assert.equal(output.manifest.cases.length,6);
 assert.equal(output.manifest.pendingReferences,6);
 assert.equal(output.manifest.approvedReferences,0);
 assert.equal(output.manifest.accuracyAvailable,false);
 assert.equal(output.manifest.kind,'review-preparation-not-ground-truth');
 for(const entry of manifest.cases){
  assert.match(output.html,new RegExp(entry.id+'\\.side-by-side\\.png'));
  assert.match(output.html,new RegExp(entry.id+'\\.original\\.jpg'));
  assert.match(output.html,new RegExp(entry.id+'\\.prediction\\.json'));
  assert.ok(output.manifest.cases.find(x=>x.id===entry.id)?.sourceSha256===entry.sourceSha256);
 }
 assert.match(output.html,/tools\/annotate-garment\.html/);
 assert.match(output.html,/tools\/approve-garment-mask\.html/);
 assert.match(output.html,/NOT ground truth/);
 assert.match(output.html,/CC BY/);
});
test('review packet escapes supplied attribution rather than executing HTML',()=>{
 const forgedSources=sources.map(s=>s.id==='commons-0035'?
  {...s,attribution:{...s.attribution,title:'<script>alert("unsafe")</script>'}}:s);
 const result=buildGarmentReviewPacket(manifest,forgedSources,pending());
 assert.ok(!result.html.includes('<script>alert'));
 assert.match(result.html,/&lt;script&gt;alert/);
});
test('unreviewed entries cannot masquerade as accurate or scored references',()=>{
 const base=pending();
 assert.throws(()=>buildGarmentReviewPacket(manifest,sources,base.map((v,i)=>i? v:{...v,metrics:{garmentPrecision:1}})),/ground truth/);
 assert.throws(()=>buildGarmentReviewPacket(manifest,sources,base.map((v,i)=>i? v:{...v,status:'scored',metrics:{garmentPrecision:1}})),/approved reference/);
 assert.throws(()=>buildGarmentReviewPacket(manifest,sources,base.slice(0,5)),/Incomplete/);
 assert.throws(()=>buildGarmentReviewPacket(manifest,sources,[base[0],base[0],...base.slice(2)]),/Duplicate segmentation predictions/);
});
test('foreign source images and missing license attribution stop packet generation',()=>{
 const base=pending();
 const altered=structuredClone(manifest);
 altered.cases[0].sourceSha256='0'.repeat(64);
 assert.throws(()=>buildGarmentReviewPacket(altered,sources,base),/verified source attribution/);
 const partial=sources.map(x=>x.id==='commons-0035'?{...x,attribution:{source:x.attribution.source}}:x);
 assert.throws(()=>buildGarmentReviewPacket(manifest,partial,base),/verified source attribution/);
});
test('approved references are individually distinguished without imputing approval to others',()=>{
 const approved=structuredClone(manifest);
 approved.cases[0].reviewStatus='approved';
 approved.cases[0].referenceMask='benchmark/reference-masks/commons-0035.approved.json';
 const outcomes=pending();
 outcomes[0]={...outcomes[0],status:'scored',metrics:{garmentPrecision:.87}};
 const result=buildGarmentReviewPacket(approved,sources,outcomes);
 assert.equal(result.manifest.approvedReferences,1);
 assert.equal(result.manifest.pendingReferences,5);
 assert.equal(result.manifest.accuracyAvailable,false);
 assert.match(result.html,/Reviewed reference scored/);
});
