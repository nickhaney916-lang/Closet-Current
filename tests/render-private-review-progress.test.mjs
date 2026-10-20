import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditReviewHandoff} from '../scripts/preflight-human-review-handoff.mjs';
import {renderPrivateReviewProgress} from '../scripts/render-private-review-progress.mjs';
import {jpegDimensions} from '../scripts/prepare-reviewed-mask-evidence.mjs';

const manifest=JSON.parse(fs.readFileSync('benchmark/local-fitting-real-photo-manifest.json','utf8'));
const locked=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json','utf8'));
const sourceBytes=name=>fs.readFileSync('benchmark/fixtures/'+name);
const audit=files=>auditReviewHandoff({manifest,locked,readSource:sourceBytes,reviewFiles:files});
const sample=manifest.cases.find(x=>x.id==='commons-0001');
const grid=jpegDimensions(sourceBytes(sample.image)),n=grid.width*grid.height;
function syntheticReviewPair(){
 const base={schemaVersion:1,reviewStatus:'draft',image:sample.image,
  sourceSha256:sample.sourceSha256,width:grid.width,height:grid.height,
  nativeSourceGrid:true,annotationGrid:'exact-original-pixels',
  physicalTargetId:'commons-0001-item-01',humanCategory:'Tops',humanForm:'top',
  humanTargetLabel:'Only Synthetic Shirt (not real truth)',
  reviewer:'Private Name Alpha',targetIndependentlyIdentifiedBy:'Private Name Alpha',
  seedModel:null,runs:[0,1,n-1]};
 const approved={...base,reviewStatus:'approved',approvedBy:'Private Name Beta',
  verifiedSourceWidth:grid.width,verifiedSourceHeight:grid.height,
  reviewedAt:'2026-10-20T12:00:00Z',note:'Not a real human review'};
 const files=new Map([
  ['commons-0001-item-01.mask.draft.json',Buffer.from(JSON.stringify(base))],
  ['commons-0001-item-01.mask.approved.json',Buffer.from(JSON.stringify(approved))]
 ]);
 return files;
}
test('offline human review dashboard lists 12 exact original photos and no fake mask approvals',()=>{
 const result=audit(new Map()),html=renderPrivateReviewProgress(result);
 assert.equal((html.match(/class="photo"/g)||[]).length,12);
 assert.equal((html.match(/Save exact source JPG/g)||[]).length,12);
 assert.match(html,/0<\/strong> Independently approved masks/);
 assert.match(html,/0<\/strong> Matched first\/second pairs/);
 assert.match(html,/FIRST/i);
 assert.match(html,/annotate-garment-native\.html/);
 assert.match(html,/approve-garment-mask-native\.html/);
 assert.ok(html.includes('benchmark/fixtures/commons-0001.jpg'));
 assert.doesNotMatch(html,/https?:\/\/|fetch\(|XMLHttpRequest|<script/i);
});
test('matched synthetic review files yield local checklist but never human approval or reviewer identity',()=>{
 const result=audit(syntheticReviewPair()),html=renderPrivateReviewProgress(result);
 assert.match(html,/Two files agree structurally/);
 assert.match(html,/0<\/strong> Independently approved masks/);
 assert.doesNotMatch(html,/Private Name Alpha|Private Name Beta|Only Synthetic Shirt/);
 assert.doesNotMatch(html,/quality certified|production approved|ai prediction mask/i);
});
test('invalid second review renders correction action without exposing reviewer name',()=>{
 const files=syntheticReviewPair();
 const approval=JSON.parse(files.get('commons-0001-item-01.mask.approved.json'));
 approval.approvedBy=approval.reviewer;
 files.set('commons-0001-item-01.mask.approved.json',Buffer.from(JSON.stringify(approval)));
 const html=renderPrivateReviewProgress(audit(files));
 assert.match(html,/Review files need correction/);
 assert.match(html,/0<\/strong> Independently approved masks/);
 assert.doesNotMatch(html,/Private Name Alpha/);
});
test('unsupported remote sources and untrusted case identifiers cannot enter local image URLs',()=>{
 const report=audit(new Map());
 assert.throws(()=>renderPrivateReviewProgress(report,{imagePrefix:'https://invalid.example/'}),/Offline viewer/);
 assert.throws(()=>renderPrivateReviewProgress({...report,cases:[{...report.cases[0],image:'<img onerror=alert(1)>.jpg'},...report.cases.slice(1)]}),/Invalid or duplicate original/);
 assert.throws(()=>renderPrivateReviewProgress({...report,summary:{...report.summary,independentlyApprovedFullGarmentMasks:1}}),/never imply real-photo approval/);
});
test('individual item status cannot inject markup into human-only review page',()=>{
 const report=audit(syntheticReviewPair());
 report.cases[0].items[0].topologyFlags=['interior-background-gaps','<script>alert(1)</script>'];
 const html=renderPrivateReviewProgress(report);
 assert.match(html,/interior-background-gaps/);
 assert.doesNotMatch(html,/<script>/);
});
test('status remains zero independently accepted real masks despite synthetic items',()=>{
 const report=audit(syntheticReviewPair());
 assert.equal(report.summary.independentlyApprovedFullGarmentMasks,0);
 assert.equal(report.summary.realPhotoMaskAccuracyMeasured,0);
 const html=renderPrivateReviewProgress(report);
 assert.match(html,/A structurally matching second file is NOT an authenticated human review/);
});
