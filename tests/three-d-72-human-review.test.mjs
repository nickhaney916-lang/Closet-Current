import test from 'node:test';
import assert from 'node:assert/strict';
import {WIDTHS,KINDS,ANGLES,createReviewManifest,evaluateHumanReview} from '../research/three-d-72/review-gate.mjs';
const pad=n=>String(n).padStart(3,'0');
function fixture(){
 const files=new Map(),results=[];
 for(const width of WIDTHS)for(const kind of KINDS){
  results.push({width,kind,originalBody163Bones:true,originalCamera360True:true,
    humanAestheticReviewed:false,releaseAuthorized:false});
  for(const mode of ['before','after'])for(const a of ANGLES)
   files.set(width+'-'+kind+'-'+mode+'-'+pad(a)+'.png',{
    width:width-24,height:490,sha256:(mode==='after'?'b':'a').repeat(64)});
 }
 const prior={researchOnly:true,genuineWebGLImages:72,real163JointSkinnedHumanoids:true,
  trueCamera360:true,humanVisualAcceptance:false,phoneAndroidTested:false,
  phoneIphoneTested:false,releaseAuthorized:false,familyAlpha:'HOLD',results};
 return {prior,files};
}
test('3D72 requires exactly 72 genuine matched 3D71 WebGL evidence views',()=>{
 const {prior,files}=fixture(),m=createReviewManifest(prior,files);
 assert.equal(m.caseCount,36);assert.equal(m.comparisons.length,36);
 assert.equal(m.imageCount,72);assert.equal(new Set(m.comparisons.map(x=>x.id)).size,36);
 assert.equal(m.comparisons.filter(c=>c.angle===360).length,4);
 assert.equal(m.humanAestheticApproved,false);assert.equal(m.releaseAuthorized,false);
 assert.equal(m.familyAlpha,'HOLD');assert.equal(m.photographedDenimImproved,false);
 assert.equal(m.authenticAndroidPhoneVerified,false);assert.equal(m.authenticIphoneVerified,false);
});
test('3D72 rejects missing/tampered screenshots, bodies and release claims',()=>{
 const {prior,files}=fixture(),m=createReviewManifest(prior,files);
 assert.ok(m.comparisons[0].sha256Before);
 files.delete('320-female-before-000.png');
 assert.throws(()=>createReviewManifest(prior,files),/72 actual|Missing/);
 const q=fixture();q.prior.releaseAuthorized=true;
 assert.throws(()=>createReviewManifest(q.prior,q.files),/HOLD/);
 const r=fixture();r.prior.results[0].originalBody163Bones=false;
 assert.throws(()=>createReviewManifest(r.prior,r.files),/non-original/);
 const s=fixture();s.files.set('320-female-before-000.png',{width:1,height:490,sha256:'e'.repeat(64)});
 assert.throws(()=>createReviewManifest(s.prior,s.files),/matched/);
});
test('3D72 human scoring cannot silently authorize product release',()=>{
 const x=fixture(),m=createReviewManifest(x.prior,x.files);
 assert.equal(evaluateHumanReview(m,[]).status,'INCOMPLETE_HUMAN_REVIEW');
 assert.throws(()=>evaluateHumanReview(m,[{id:m.comparisons[0].id,rating:'10/10',note:''}]),/Untrusted/);
 const partial=evaluateHumanReview(m,[{id:m.comparisons[0].id,rating:'improved',note:'Looks less abrupt'}],'User');
 assert.equal(partial.status,'INCOMPLETE_HUMAN_REVIEW');
 const full=evaluateHumanReview(m,m.comparisons.map(c=>({id:c.id,rating:'improved',note:''})),'Human QA');
 assert.equal(full.status,'SUBMITTED_FOR_MAIN_THREAD_REVIEW');
 assert.equal(full.rated,36);assert.equal(full.totals.improved,36);
 assert.equal(full.humanPhotorealismApproved,false);
 assert.equal(full.physicalAndroidVerified,false);assert.equal(full.physicalIphoneVerified,false);
 assert.equal(full.releaseAuthorized,false);assert.equal(full.familyAlpha,'HOLD');
 assert.throws(()=>evaluateHumanReview(m,[
  {id:m.comparisons[0].id,rating:'improved',note:''},
  {id:m.comparisons[0].id,rating:'worse',note:''}
 ]),/duplicate/);
});
