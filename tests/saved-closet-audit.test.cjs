'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../public/saved-closet-audit-engine.js');
const labels=[
 {category:'Tops',type:'T-shirt',color:'Blue'},
 {category:'Bottoms',type:'Shorts',color:'Black'},
 {category:'Dresses',type:'Dress',color:'Pink'},
 {category:'Outerwear',type:'Jacket',color:'Brown'},
 {category:'Shoes',type:'Shoes',color:'White'}
];
function item(n,changes={}){
 const expected=labels[n%labels.length];
 const base={id:'item-'+String((n%20)+1).padStart(3,'0'),source:n%2?'import':'camera',
 expected:{...expected},proposed:{...expected},disposition:'saved-auto',saved:{...expected},
 quality:'clear',backup:'restored'};
 return {...base,...changes};
}
const release='abc123abc123';
const make=(session,platform)=>engine.makeReport(Array.from({length:20},(_,i)=>item(session*20+i)),release,platform);
test('independently operator-reported perfect 60-garment set is STILL blocked for release',async()=>{
 const {reviewSavedClosetReports}=await import('../benchmark/private-saved-closet-review.mjs');
 const reports=[make(0,'Android'),make(1,'iPhone/iPad'),make(2,'Android')];
 reports.forEach(engine.validateReport);
 const result=reviewSavedClosetReports(reports);
 assert.equal(result.observations,60);
 assert.equal(result.savedCorrectCategoryTypeColor,60);
 assert.equal(result.proposedDiagnosticThresholdsMet,true);
 assert.equal(result.selfReportedFinalSavedExactAccuracy,1);
 assert.equal(result.productionSavedClosetAccuracy,null);
 assert.equal(result.independentlyVerifiedPhysicalAndroid,false);
 assert.equal(result.independentlyVerifiedPhysicalIPhone,false);
 assert.equal(result.productionReleaseApproved,false);
 assert.ok(result.releaseBlockers.includes('original-photos-not-provably-unique-or-from-physical-hardware'));
 assert.equal(result.rawPhotosOrAccountIdsRead,false);
});
test('wrong unsupervised type or final saved color counts as real risk even when model proposal appeared good',async()=>{
 const {reviewSavedClosetReports}=await import('../benchmark/private-saved-closet-review.mjs');
 const reports=[make(0,'Android'),make(1,'iPhone/iPad'),make(2,'Android')];
 const corrected={...reports[0].rows[0],disposition:'saved-corrected',
  saved:{...reports[0].rows[0].expected,color:'Red'}};
 reports[0]=engine.makeReport([corrected,...reports[0].rows.slice(1)],release,'Android');
 const wrong={...reports[1].rows[0],
  proposed:{category:'Bottoms',type:'Shorts',color:'Black'},
  saved:{category:'Bottoms',type:'Shorts',color:'Black'}};
 reports[1]=engine.makeReport([wrong,...reports[1].rows.slice(1)],release,'iPhone/iPad');
 const result=reviewSavedClosetReports(reports);
 assert.equal(result.wrongAutomaticallySaved,1);
 assert.equal(result.savedCorrectCategoryTypeColor,58);
 assert.equal(result.proposedDiagnosticThresholdsMet,false);
 assert.ok(result.studyBlockers.includes('wrong-garment-saved-without-user-correction'));
});
test('unsaved and processing failures cannot masquerade as saved/verified restored',()=>{
 const bad=[
  x=>x.saved=null,
  x=>x.quality='not-saved',
  x=>x.backup='verified',
  x=>x.disposition='held',
  x=>x.expected={...x.expected,category:'Shoes'},
  x=>x.expected={...x.expected,email:'test@example.com'},
  x=>x.photo='data:image/jpeg;base64,private',
  x=>x.saved={...x.saved,color:'Unknown'},
 ];
 for(const modify of bad){const value=item(0);modify(value);
  if(value.saved?.color==='Unknown'){assert.doesNotThrow(()=>engine.checkRow(value,0));continue;}
  assert.throws(()=>engine.checkRow(value,0));
 }
});
test('report validation fails closed on forged phone identity, extra payloads and inconsistent scores',()=>{
 const report=make(0,'Android');
 for(const modify of [
  x=>x.summary.saved=200,
  x=>x.rows[0].id='username@gmail.com',
  x=>x.rows[0].expected.color='Bluish',
  x=>x.rows[0].image='data:image/jpeg;base64,private',
  x=>x.rows[0].photoName='sensitive-original.jpg',
  x=>x.hardwareVerified=true,
  x=>x.originalLabelsIndependentlyVerified=true,
  x=>x.physicalHardwareIndependentlyVerified=true,
  x=>x.productionReleaseApproved=true,
  x=>x.sendAutomatically=true,
  x=>x.userId='someone',
  x=>x.appRelease='unverified',
  x=>x.rows.push(item(1))
 ]){const tampered=structuredClone(report);modify(tampered);
  assert.throws(()=>engine.validateReport(tampered));
 }
});
test('different builds, one-platform only, exact report replay and blank reports rejected',async()=>{
 const {reviewSavedClosetReports}=await import('../benchmark/private-saved-closet-review.mjs');
 assert.throws(()=>reviewSavedClosetReports([make(0,'Android'),make(0,'Android')]));
 assert.throws(()=>reviewSavedClosetReports([make(0,'Android'),engine.makeReport(make(1,'iPhone/iPad').rows,'bbbbbbbbbbbb','iPhone/iPad')]));
 assert.throws(()=>reviewSavedClosetReports([make(0,'Android'),make(0,'iPhone/iPad')]));
 assert.throws(()=>engine.validateReport(engine.makeReport([],release,'Android')));
});
test('saved-photo and cloud recovery quality problems stay visible even when clothing labels are perfect',async()=>{
 const {reviewSavedClosetReports}=await import('../benchmark/private-saved-closet-review.mjs');
 const three=[make(0,'Android'),make(1,'iPhone/iPad'),make(2,'Android')];
 const fix=(x,patch)=>{three[0]=engine.makeReport([ {...three[0].rows[0],...patch},...three[0].rows.slice(1)],release,'Android');};
 fix(three[0],{quality:'pixelated',backup:'failed'});
 const score=reviewSavedClosetReports(three);
 assert.equal(score.photoClarityProblems,1);
 assert.equal(score.backupPendingOrFailed,1);
 assert.ok(score.studyBlockers.includes('soft-or-pixelated-saved-photo'));
 assert.ok(score.studyBlockers.includes('cloud-restore-failed-or-pending'));
});
