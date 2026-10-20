import test from 'node:test';
import assert from 'node:assert/strict';
import {lockPhotoLabels,phonePhotoResult,scorePhonePhotos,photoTypes} from '../public/phone-photo-benchmark.mjs';
import device from '../public/device-check-engine.js';
import {reviewPrivatePilotEvidence} from '../benchmark/private-end-to-end-pilot-review.mjs';

const hex='a'.repeat(12),index='b'.repeat(64);
const allChecks=()=>Object.fromEntries(device.deviceCheckSteps.map(([id])=>[id,'pass']));
function phones({build=hex}={}){
 return [device.deviceCheckReport({enabled:false,steps:allChecks(),events:[]},build,'Android'),
  device.deviceCheckReport({enabled:false,steps:allChecks(),events:[]},build,'iPhone/iPad')];
}
function oneSession(entries,{modelColor='Blue',release=hex}={}){
 const labels=lockPhotoLabels(entries.map(({category,color})=>({
  category,color,type:category==='Uncategorized'?'':photoTypes(category)[0]
 })));
 const results=labels.map((x,i)=>{
  if(x.expectedCategory==='Uncategorized')
   return phonePhotoResult(x.id,{strong:false,choices:[]},10+i);
  return phonePhotoResult(x.id,{strong:true,choices:[{
   category:x.expectedCategory,itemType:x.expectedType
  }],details:{color:modelColor}},10+i);
 });
 return scorePhonePhotos(labels,results,{release,indexHash:index});
}
function cohort(){
 const entries=['Tops','Bottoms','Dresses','Outerwear','Shoes'].flatMap(c=>
  Array.from({length:10},()=>({category:c,color:'Blue'})));
 entries.push(...Array.from({length:5},()=>({category:'Uncategorized'})));
 return [oneSession(entries.slice(0,20)),oneSession(entries.slice(20,40)),
  oneSession(entries.slice(40))];
}
test('even a large, apparently perfect, two-phone cohort remains BLOCKED for launch',()=>{
 const [a,i]=phones();
 const r=reviewPrivatePilotEvidence(a,i,cohort());
 assert.equal(r.status,'pilot-release-BLOCKED-evidence-review-only');
 assert.equal(r.proposedDiagnosticThresholdsMet,true);
 assert.equal(r.modelSuggestionStudy.garmentPhotoEntries,50);
 assert.equal(r.modelSuggestionStudy.nonclothingControls,5);
 assert.equal(r.modelSuggestionStudy.automaticModelProposals,50);
 assert.equal(r.modelSuggestionStudy.acceptedModelCategoryAndColorCorrect,50);
 assert.equal(r.modelSuggestionStudy.categoryColorProposalPrecision,1);
 assert.equal(r.modelSuggestionStudy.proposalCoverage,1);
 assert.equal(r.modelSuggestionStudy.independentlyUniqueSourcePhotosVerified,false);
 assert.equal(r.productionSavedColorAccuracy,null);
 assert.equal(r.realPhoneColorAccuracy,null);
 assert.equal(r.physicalIPhoneCameraValidated,false);
 assert.equal(r.physicalAndroidCameraValidated,false);
 assert.equal(r.independentHumanMaskApprovals,0);
 assert.equal(r.productionReleaseApproved,false);
 assert.ok(r.releaseBlockers.includes('no-owner-release-authorization'));
 for(const v of Object.values(r.modelSuggestionStudy.categories))assert.equal(v.labeled,10);
 assert.ok(!JSON.stringify(r).includes('photo-001'));
});
test('color errors, missing labels, runtime failures and high abstention fail diagnostic thresholds',()=>{
 const [a,i]=phones(),base=cohort();
 const wrong=structuredClone(base);
 wrong[0].photos[0].prediction.color='Red';
 // Intentionally tampered summary must fail rather than silently counting a false score.
 assert.throws(()=>reviewPrivatePilotEvidence(a,i,wrong),/inconsistent/);
 const bad=cohort();
 const item=bad[0].photos[0];item.prediction.color='Red';
 item.modelColorMatch=false;
 bad[0].summary.modelColorMatches--;
 bad[0].summary.modelColorWrong++;
 bad[0].summary.strongCategoryColorMatches--;
 bad[0].summary.strongCategoryColorMismatches++;
 const result=reviewPrivatePilotEvidence(a,i,bad);
 assert.equal(result.proposedDiagnosticThresholdsMet,true,
  'one incorrect out of 50 accepted meets the *diagnostic* 95% target, but still never unlocks launch');
 assert.equal(result.productionReleaseApproved,false);
 assert.ok(result.studyBlockers.includes('model-category-and-color-proposal-precision-below-95-percent')===false,
  'one incorrect out of 50 accepted is 98%, not below 95%');
 assert.equal(result.modelSuggestionStudy.acceptedModelColorsIncorrect,1);
 const more=structuredClone(bad);
 for(const r of more.slice(0,1)){
  for(let k=0;k<5;k++){
   const x=r.photos[k];
   if(x.prediction.color==='Blue'){
    x.prediction.color='White';x.modelColorMatch=false;
    r.summary.modelColorMatches--;r.summary.modelColorWrong++;
    r.summary.strongCategoryColorMatches--;r.summary.strongCategoryColorMismatches++;
   }
  }
 }
 const threshold=reviewPrivatePilotEvidence(a,i,more);
 assert.ok(threshold.studyBlockers.includes('model-category-and-color-proposal-precision-below-95-percent'));
});
test('missing photo coverage, category coverage, nonclothing and mixed versions keep pilot gated',()=>{
 const [a,i]=phones();
 const short=cohort().slice(0,1);
 const r=reviewPrivatePilotEvidence(a,i,short);
 assert.equal(r.proposedDiagnosticThresholdsMet,false);
 assert.ok(r.studyBlockers.includes('less-than-50-garment-photo-entries'));
 assert.ok(r.studyBlockers.includes('less-than-5-nonclothing-controls'));
 assert.ok(r.studyBlockers.includes('under-ten-shoes'));
 assert.throws(()=>reviewPrivatePilotEvidence(a,i,[...cohort().slice(0,1),
  oneSession([{category:'Tops',color:'Blue'}],{release:'c'.repeat(12)})]),/Different app builds/);
 const [other]=phones({build:'e'.repeat(12)});
 assert.throws(()=>reviewPrivatePilotEvidence(other,i,cohort()),/checklist|different|build/i);
});
test('phone reports with private strings, fabricated summaries and source bytes never enter output',()=>{
 const [a,i]=phones();
 const base=cohort();
 for(const mutate of [
  x=>x.photos[0].fileName='PRIVATE_FILE.jpg',
  x=>x.photos[0].prediction.email='PRIVATE_EMAIL@nowhere',
  x=>x.summary.modelColorMatches=1000,
  x=>x.photos[0].categoryMatch=false,
  x=>x.photos[0].expectedColor='PRIVATE_COLOR',
  x=>x.photos[0].diagnostics={overall:[{score:.8,category:'Tops',url:'PRIVATE_URL'}]},
  x=>x.uploadedPhoto='data:image/png;base64,PRIVATE'
 ]){
  const bad=structuredClone(base),mutated=bad[0];mutate(mutated);
  assert.throws(()=>reviewPrivatePilotEvidence(a,i,bad));
 }
 const broken=structuredClone(a);broken.email='test@example.invalid';
 assert.throws(()=>reviewPrivatePilotEvidence(broken,i,base));
 assert.throws(()=>reviewPrivatePilotEvidence(a,i,[]));
});

test('replaying a private color report cannot inflate nominal photo cohort size',()=>{
 const [a,i]=phones(),sessions=cohort();
 assert.throws(()=>reviewPrivatePilotEvidence(a,i,[sessions[0],structuredClone(sessions[0])]),
  /Duplicate private photo audit report replay/);
});
