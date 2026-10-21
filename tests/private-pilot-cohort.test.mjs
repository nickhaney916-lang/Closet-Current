import test from 'node:test';
import assert from 'node:assert/strict';
import device from '../public/device-check-engine.js';
import saved from '../public/saved-closet-audit-engine.js';
import {lockPhotoLabels,phonePhotoResult,scorePhonePhotos,photoTypes} from '../public/phone-photo-benchmark.mjs';
import {reviewPrivatePilotCohort} from '../benchmark/private-pilot-cohort-consistency.mjs';
const release='abc123abc123',recognitionIndex='b'.repeat(64);
const checks=Object.fromEntries(device.deviceCheckSteps.map(([id])=>[id,'pass']));
const reportDevice=platform=>device.deviceCheckReport({enabled:false,steps:checks,events:[]},release,platform);
const blue={category:'Tops',type:'T-shirt',color:'Blue'};
const white={category:'Shoes',type:'Shoes',color:'White'};
function makeSaved(platform,label,build=release){
 const row={id:'item-001',source:'camera',expected:{...label},proposed:{...label},
  disposition:'saved-auto',saved:{...label},quality:'clear',backup:'restored'};
 return saved.makeReport([row],build,platform);
}
function makeModel(build=release){
 const categories=['Tops','Bottoms','Dresses','Outerwear','Shoes','Uncategorized'];
 const labels=lockPhotoLabels(categories.map(c=>({
  category:c,type:c==='Uncategorized'?'':photoTypes(c)[0],
  color:c==='Uncategorized'?'':'Blue'
 })));
 const results=labels.map((x,i)=>x.expectedCategory==='Uncategorized'?
  phonePhotoResult(x.id,{strong:false,choices:[]},10+i):
  phonePhotoResult(x.id,{strong:true,choices:[{
   category:x.expectedCategory,itemType:x.expectedType
  }],details:{color:'Blue'}},10+i));
 return scorePhonePhotos(labels,results,{release:build,indexHash:recognitionIndex});
}
function cohort(){
 return {
  android:reportDevice('Android'),iphone:reportDevice('iPhone/iPad'),
  model:[makeModel()],saved:[makeSaved('Android',blue),makeSaved('iPhone/iPad',white)]
 };
}
const verify=x=>reviewPrivatePilotCohort(x.android,x.iphone,x.model,x.saved);

test('all three report families match the exact app build without claiming same garment or hardware',()=>{
 const result=verify(cohort());
 assert.equal(result.allThreeReportFamiliesSameBuild,true);
 assert.equal(result.appRelease,release);
 assert.equal(result.deviceCheck.androidChecks,17);
 assert.equal(result.deviceCheck.iphoneChecks,17);
 assert.equal(result.modelProposalDiagnostics.labeledGarments,5);
 assert.equal(result.modelProposalDiagnostics.nonclothingControls,1);
 assert.equal(result.savedClosetDiagnostics.labeledGarmentAttempts,2);
 assert.equal(result.originalPhotosLinkedAcrossReportFamilies,false);
 assert.equal(result.verifiedOriginalCategoryColorAccuracy,null);
 assert.equal(result.verifiedProductionSavedClosetAccuracy,null);
 assert.equal(result.productionReleaseApproved,false);
 assert.equal(result.productionPromotion,'BLOCKED');
 assert.equal(result.genuinePhysicalPhoneEvidenceAuthenticated,false);
 assert.equal(result.bothDiagnosticThresholdsMet,false);
 assert.ok(result.releaseBlockers.some(x=>/joined to actual saved/i.test(x)));
 assert.ok(!JSON.stringify(result).includes('item-001'));
 assert.ok(!JSON.stringify(result).includes('photo-001'));
});
test('saved-closet and model build mismatches across device reports are fatal, not warnings',()=>{
 const a=cohort();a.saved[1]=makeSaved('iPhone/iPad',white,'cccccccccccc');
 assert.throws(()=>verify(a),/Different app builds|Phone sessions must use the same exact app release/);
 const b=cohort();b.model[0]=makeModel('dddddddddddd');
 assert.throws(()=>verify(b),/checklist\/diagnostic app build mismatch/i);
 const c=cohort();c.android=device.deviceCheckReport({steps:checks},'eeeeeeeeeeee','Android');
 assert.throws(()=>verify(c),/checklist\/diagnostic app build mismatch/i);
});
test('spoofed summaries, leaked customer fields and illegal photos fail closed',()=>{
 const attacks=[
  x=>x.android.email='private@example.org',
  x=>x.iphone.summary.checked=100,
  x=>x.model[0].summary.automatic=200,
  x=>x.model[0].photos[0].filename='SECRET.jpg',
  x=>x.saved[0].rows[0].photo='data:image/jpeg;base64,SECRET',
  x=>x.saved[0].rows[0].saved.color='Other',
  x=>x.saved[1].physicalHardwareIndependentlyVerified=true
 ];
 for(const mutate of attacks){
  const c=cohort();mutate(c);assert.throws(()=>verify(c));
 }
});
test('replayed model or saved reports cannot inflate anonymous evidence counts',()=>{
 const c=cohort();c.model.push(structuredClone(c.model[0]));
 assert.throws(()=>verify(c),/Duplicate private photo audit report replay/);
 const other=cohort();other.saved.push(structuredClone(other.saved[0]));
 assert.throws(()=>verify(other),/Do not replay identical session reports/);
});
test('incorrect automatically saved clothes stay visible despite correct original model suggestions',()=>{
 const c=cohort();
 const wrong={...c.saved[0].rows[0],expected:{...c.saved[0].rows[0].expected,color:'Red'}};
 c.saved[0]=saved.makeReport([wrong],release,'Android');
 const r=verify(c);
 assert.equal(r.savedClosetDiagnostics.wrongAutomaticallySaved,1);
 assert.equal(r.savedClosetDiagnostics.reportedSavedCategoryTypeColorPrecision,0.5);
 assert.equal(r.modelProposalDiagnostics.proposedCategoryAndColorPrecision,1);
 assert.equal(r.productionReleaseApproved,false);
});
