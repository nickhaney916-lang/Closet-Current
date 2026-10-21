import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {displayedOriginalReady,readinessReport,guardedReviewHTML} from '../scripts/human-original-review-readiness.mjs';
import {packetFromLock,blankSubmission,LOCK} from '../scripts/source-holdout-human-review.mjs';
const packet=()=>packetFromLock(fs.readFileSync(LOCK));
const display=()=>({verified:true,expectedSource:'blob:original',imageSource:'blob:original',displaySource:'blob:original',complete:true,width:3072,height:2304});
// Synthetic metadata checks the report's rules, not actual rendering or humans.
const checks=()=>['chromium','webkit'].map(engine=>({engine,stalledImageBlocked:true,failedImageBlocked:true,observationsRecorded:0,blankExportBlocked:true,blankTemplateUnchanged:true,photos:packet().photos.map(p=>({id:p.id,sha256:p.sha256,width:3072,height:2304,expectedWidth:3072,expectedHeight:2304}))}));
test('a hash-verified fully displayed selected original is eligible to record an observation',()=>assert.equal(displayedOriginalReady(display()),true));
test('verified file without completed or positive-size image display remains blocked',()=>{
 for(const change of [{complete:false},{width:0},{height:0},{width:NaN},{verified:false}])assert.equal(displayedOriginalReady({...display(),...change}),false);
});
test('a stale, failed, unbound or different displayed photo cannot authorize an observation',()=>{
 for(const change of [{expectedSource:undefined},{displaySource:'blob:old'},{imageSource:'blob:old'},{expectedSource:'data:image/jpeg,bad'},{displaySource:''}])assert.equal(displayedOriginalReady({...display(),...change}),false);
});
test('ready browser software with zero human submissions cannot emit human accuracy or gold labels',()=>{
 const r=readinessReport(packet(),checks());assert.equal(r.browserRenderChecks,26);assert.equal(r.sourcePhotos,13);
 assert.equal(r.actualHumanSubmissions,0);assert.equal(r.measuredHumanAccuracy,null);assert.equal(r.independentHumanGoldLabels,false);assert.equal(r.productionPromotion,'BLOCKED');
});
test('one engine, duplicate engine, missing photos, changed hashes or wrong orientation fail readiness',()=>{
 for(const mutate of [c=>c.pop(),c=>c[1].engine='chromium',c=>c[0].photos.pop(),c=>c[0].photos[1]=c[0].photos[0],c=>c[0].photos[0].sha256='bad',c=>c[0].photos[0].width=2304]){
  const c=checks();mutate(c);assert.throws(()=>readinessReport(packet(),c));
 }
});
test('automation cannot be reclassified as human observations or bypass display/export checks',()=>{
 for(const mutate of [c=>c[0].observationsRecorded=13,c=>c[0].stalledImageBlocked=false,c=>c[0].failedImageBlocked=false,c=>c[0].blankExportBlocked=false,c=>c[0].blankTemplateUnchanged=false]){
  const c=checks();mutate(c);assert.throws(()=>readinessReport(packet(),c));
 }
});
test('the appended guard supplies no source captions, proposed labels or predictions and leaves the template blank',()=>{
 const p=packet(),html=guardedReviewHTML(p);for(const label of ['acceptedTypes','expectedCategory','visualReview','prediction:'])assert.ok(!html.includes(label));
 const blank=blankSubmission(p);assert.equal(blank.status,'UNREVIEWED');assert.equal(blank.reviewerAlias,null);assert.ok(blank.photos.every(x=>x.observedFamily===null));
 const changed=structuredClone(p);changed.photos.reverse();assert.throws(()=>readinessReport(changed,checks()),/packet/);
});
