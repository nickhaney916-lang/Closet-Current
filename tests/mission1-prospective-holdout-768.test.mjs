import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
 P66_EXPOSED_DIGESTS,sha256,signedMessage,sealProspectiveHoldout,
 evaluateProspectiveHoldout,maximumCardinalityMaskMatches
} from '../research/mission1-sealed-human-holdout-768/prospective-gate.mjs';

function pseudoJpeg(width=32,height=32,n=5){
 const bytes=Buffer.alloc(256,n);
 bytes.set([255,216,255,192,0,17,8,height>>8,height&255,width>>8,width&255],0);
 bytes.set([255,217],bytes.length-2);
 return bytes;
}
function fixture(){
 const exposed=[...JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8')).map(x=>x.sha256),
  ...P66_EXPOSED_DIGESTS];
 const keys={},privateKeys={};
 for(const id of ['coordinator','reviewerA','reviewerB','adjudicator']){
  const pair=generateKeyPairSync('ed25519');
  keys[id]=pair.publicKey.export({type:'spki',format:'pem'});
  privateKeys[id]=pair.privateKey;
 }
 const images={},photos=[];
 for(const [i,negative] of [false,true].entries()){
  const id='hold-tamper-case-'+i,image='fixture'+i+'.jpg',bytes=pseudoJpeg(32,32,i+5);
  images[image]=bytes;
  photos.push({id,image,sha256:sha256(bytes),
   originalSourceURL:'https://commons.wikimedia.org/wiki/File:Test_'+i+'.jpg',
   sourceLicenseURL:'https://creativecommons.org/licenses/by/4.0/',
   creatorCredit:'Synthetic unit fixture (not a real photo rights claim)',
   rightsClaim:'commons-licensed',width:32,height:32});
 }
 const modelSHA256='8'.repeat(64),modelIndexSHA256='9'.repeat(64);
 const readPhoto=name=>images[name];
 const seal=sealProspectiveHoldout({registrationId:'m1-cohort-synthetic-fixture',
  photos,modelSHA256,modelIndexSHA256,exposedSHA256:exposed,reviewerPublicKeys:keys},readPhoto);
 const makeSignature=(payload,id)=>sign(null,signedMessage(payload),privateKeys[id]).toString('base64');
 const registrationWitness={signerId:'coordinator',signature:makeSignature({
  purpose:'register-before-inference',sealSHA256:seal.sealSHA256
 },'coordinator')};
 const mask=[100,200,724];
 const label=negative=>negative?{
  category:'Uncategorized',subtype:'Unknown',primaryColor:'Unknown',instances:[]
 }:{
  category:'Tops',subtype:'Blouse',primaryColor:'Blue',
  instances:[{instanceId:'cloth1',category:'Tops',rle:mask}]
 };
 const receipt=(item,reviewerId,customLabel=label(item.id.endsWith('1')),opts={})=>{
  const payload={id:item.id,sourceSHA256:item.sha256,reviewerId,
   blindToPredictions:true,notModelGenerated:true,label:customLabel,...opts};
  return {...payload,signature:makeSignature(payload,reviewerId)};
 };
 const receipts=photos.flatMap(photo=>[receipt(photo,'reviewerA'),receipt(photo,'reviewerB')]);
 const predictions=photos.map((photo,i)=>({
  id:photo.id,sourceSHA256:photo.sha256,modelSHA256,modelIndexSHA256,
  strong:!i,categoryConfirmed:false,
  prediction:i?{category:null,type:null,primaryColor:null}:
   {category:'Tops',type:'Blouse',primaryColor:'Blue'},
  ...(!i?{instances:[{category:'Tops',rle:[100,200,724]}]}:{})
 }));
 const externalChronology={registrationCommitAncestors:['synthetic-commit-not-a-real-auditor'],
  registrationCommittedBeforeInference:true,predictionBatchCommittedAfterRegistration:true};
 const run=(o={})=>evaluateProspectiveHoldout({
  seal,registrationWitness,reviewers:{publicKeys:keys,receipts},
  predictions,readPhoto,knownExposedSHA256:exposed,externalChronology,...o});
 return {seal,exposed,photos,readPhoto,images,keys,privateKeys,makeSignature,
  registrationWitness,receipts,predictions,externalChronology,receipt,run};
}
test('Mission1 verified signed sources and two blind reviewer receipts report diagnostic outcomes but never certify human independence',()=>{
 const f=fixture(),r=f.run();
 assert.equal(r.counts.photos,2);assert.equal(r.counts.garments,1);
 assert.equal(r.counts.negatives,1);assert.equal(r.counts.categoryAccuracyPercent,100);
 assert.equal(r.counts.subtypeAccuracyPercent,100);assert.equal(r.counts.colorAccuracyPercent,100);
 assert.equal(r.counts.instancePrecisionPercent,100);assert.equal(r.counts.instanceRecallPercent,100);
 assert.equal(r.counts.negativeRejected,1);
 assert.equal(r.signerKeysCryptographicallyVerified,true);
 assert.equal(r.distinctHumanIdentitiesIndependentlyConfirmed,false);
 assert.equal(r.trainingSetOverlapIndependentlyExcluded,false);
 assert.equal(r.generalizableHoldoutAccuracyCertified,false);
 assert.equal(r.eligibleToAdvanceToMissionTwo,false);
 assert.equal(r.missionOneCompleted,false);assert.equal(r.familyAlpha,'HOLD');
});
test('Mission1 cannot repackage any previously exposed 59 or external six real photo SHA as new holdout',()=>{
 const f=fixture();
 for(const exposed of [f.exposed[0],P66_EXPOSED_DIGESTS[0]]){
  const photos=structuredClone(f.photos);photos[0].sha256=exposed;
  assert.throws(()=>sealProspectiveHoldout({
   registrationId:'m1-cohort-synthetic-fixture',photos,modelSHA256:'8'.repeat(64),
   modelIndexSHA256:'9'.repeat(64),exposedSHA256:f.exposed,reviewerPublicKeys:f.keys
  },f.readPhoto),/previously exposed/);
 }
});
test('Mission1 source JPEG byte, real dimensions and immutable seal must be exact',()=>{
 const f=fixture(),photos=structuredClone(f.photos);
 f.images[photos[0].image][24]^=63;
 assert.throws(()=>f.run(),/JPEG SHA mismatch/);
 const g=fixture();g.seal.photos[0].width=34;
 assert.throws(()=>g.run(),/sealed cohort changed/);
 const h=fixture();const bad=structuredClone(h.photos);
 bad[0].width=33;
 assert.throws(()=>sealProspectiveHoldout({
  registrationId:'m1-cohort-synthetic-fixture',photos:bad,
  modelSHA256:'8'.repeat(64),modelIndexSHA256:'9'.repeat(64),
  exposedSHA256:h.exposed,reviewerPublicKeys:h.keys
 },h.readPhoto),/dimensions mismatch/);
});
test('Mission1 enrollment witness and blind label signatures cannot be forged or rebound to another source',()=>{
 const f=fixture(),tampered=structuredClone(f.receipts);
 tampered[0].label.primaryColor='Red';
 assert.throws(()=>f.run({reviewers:{publicKeys:f.keys,receipts:tampered}}),/invalid signed human/);
 const g=fixture(),bad=structuredClone(g.registrationWitness);
 bad.signature='AAAA';
 assert.throws(()=>g.run({registrationWitness:bad}),/registration witness/);
 const h=fixture();h.receipts[0].blindToPredictions=false;
 assert.throws(()=>h.run(),/signed blinded review/);
});
test('Mission1 two reviewers cannot be same human signing identity, with aliases or mismatched original SHA',()=>{
 const f=fixture();f.receipts[1]=f.receipt(f.photos[0],'reviewerA');
 assert.throws(()=>f.run(),/two distinct non-coordinator/);
 const g=fixture();g.keys.reviewerB=g.keys.reviewerA;
 assert.throws(()=>g.run(),/reviewer key registry changed|invalid signed human|same signing identity/);
 const h=fixture();h.receipts[1].sourceSHA256='0'.repeat(64);
 assert.throws(()=>h.run(),/signed blinded review/);
});
test('Mission1 conflicting human labels must be signed by a distinct third reviewer with explicit rationale',()=>{
 const f=fixture(),different={category:'Tops',subtype:'T-shirt',primaryColor:'Blue',
  instances:[{instanceId:'cloth1',category:'Tops',rle:[100,200,724]}]};
 f.receipts[1]=f.receipt(f.photos[0],'reviewerB',different);
 assert.throws(()=>f.run(),/third adjudicator/);
 const third=f.receipt(f.photos[0],'adjudicator',{
  category:'Tops',subtype:'Blouse',primaryColor:'Blue',
  instances:[{instanceId:'cloth1',category:'Tops',rle:[100,200,724]}]
 },{adjudication:true,adjudicationRationale:'Independent third review on immutable original'});
 f.receipts.splice(2,0,third);
 const r=f.run();
 assert.equal(r.counts.adjudicatedItems,1);
 assert.equal(r.counts.subtypeCorrect,1);
});
test('Mission1 missing prediction, source mismatch, unsupported colors or absent masks must fail or remain unmeasured',()=>{
 const f=fixture();f.predictions.pop();
 assert.throws(()=>f.run(),/score every photo/);
 const g=fixture();g.predictions[0].sourceSHA256='0'.repeat(64);
 assert.throws(()=>g.run(),/model\/photo provenance/);
 const h=fixture();h.predictions[0].instances=[{category:'Tops',rle:[100,200,8]}];
 assert.throws(()=>h.run(),/nonempty complete real pixel mask/);
 const j=fixture();delete j.predictions[0].instances;j.predictions[0].prediction.primaryColor=null;
 const r=j.run();
 assert.equal(r.counts.colorAccuracyPercent,null);
 assert.equal(r.counts.instanceRecallPercent,null);
 assert.equal(r.counts.instancePrecisionPercent,null);
 assert.equal(r.missionOneCompleted,false);
});
test('Mission1 no externally witnessed prospective registration chronology means no results, even with correct photos and labels',()=>{
 const f=fixture();
 assert.throws(()=>f.run({externalChronology:{
  registrationCommitAncestors:[],registrationCommittedBeforeInference:false,
  predictionBatchCommittedAfterRegistration:false
 }}),/externally witnessed immutable enrollment/);
 const g=fixture(),bad=[...g.exposed];bad.pop();
 assert.throws(()=>g.run({knownExposedSHA256:bad}),/historically exposed source hash quarantine/);
});

test('Mission1 optimum instance matching avoids greedy false-negative on overlapping garment masks',()=>{
 const truth=[
  {category:'Tops',mask:Uint8Array.from([1,1,1,1,0,0,0,0])},
  {category:'Tops',mask:Uint8Array.from([1,1,0,0,1,1,0,0])}
 ];
 const guesses=[
  {category:'Tops',mask:Uint8Array.from([1,1,1,1,1,1,0,0])},
  {category:'Tops',mask:Uint8Array.from([0,0,1,1,0,0,0,0])}
 ];
 assert.equal(maximumCardinalityMaskMatches(truth,guesses),2);
 assert.equal(maximumCardinalityMaskMatches(truth,[{...guesses[0],category:'Shoes'},guesses[1]]),1);
 assert.equal(maximumCardinalityMaskMatches(truth,[]),0);
 assert.throws(()=>maximumCardinalityMaskMatches(truth,guesses,1.1),/invalid one-to-one/);
});

test('Mission1 independently named same garment polygon IDs are accepted by geometry without fake human conflict',()=>{
 const f=fixture(),original=f.receipts[1].label;
 f.receipts[1]=f.receipt(f.photos[0],'reviewerB',{
  ...original,instances:original.instances.map(ins=>({...ins,instanceId:'b-independent-only-name'}))
 });
 const out=f.run();
 assert.equal(out.counts.adjudicatedItems,0);
 assert.equal(out.records[0].humanAgreement,true);
 assert.equal(out.counts.instancePrecisionPercent,100);
 assert.equal(out.missionOneCompleted,false);
});
test('Mission1 independent reviewers may enumerate two distinct garment polygons in opposite order and with unique IDs',()=>{
 const f=fixture(),a={category:'Tops',subtype:'Blouse',primaryColor:'Blue',
  instances:[
   {instanceId:'only-reviewed-A-left',category:'Tops',rle:[100,100,824]},
   {instanceId:'only-reviewed-A-right',category:'Tops',rle:[400,100,524]}
  ]};
 const b={...a,instances:[
  {instanceId:'reviewer-B-second',category:'Tops',rle:[400,100,524]},
  {instanceId:'reviewer-B-first',category:'Tops',rle:[100,100,824]}
 ]};
 f.receipts[0]=f.receipt(f.photos[0],'reviewerA',a);
 f.receipts[1]=f.receipt(f.photos[0],'reviewerB',b);
 const result=f.run();
 assert.equal(result.records[0].humanAgreement,true);
 assert.equal(result.counts.adjudicatedItems,0);
 assert.equal(result.counts.maskTruth,2);
 assert.equal(result.counts.maskMatched,0);
 assert.equal(result.missionOneCompleted,false);
});
test('Mission1 independent reviewers with genuinely different shape contours must undergo signed third adjudication',()=>{
 const f=fixture(),altered={category:'Tops',subtype:'Blouse',primaryColor:'Blue',
  instances:[{instanceId:'new-geometry',category:'Tops',rle:[100,30,894]}]};
 f.receipts[1]=f.receipt(f.photos[0],'reviewerB',altered);
 assert.throws(()=>f.run(),/third adjudicator/);
 const agreed=f.receipts[0].label;
 f.receipts.splice(2,0,f.receipt(f.photos[0],'adjudicator',agreed,{
  adjudication:true,adjudicationRationale:'Different independently drawn true garment boundary needs human review'
 }));
 const result=f.run();
 assert.equal(result.counts.adjudicatedItems,1);
 assert.equal(result.records[0].humanAgreement,false);
});
test('Mission1 same pixel geometry but incompatible reviewed category cannot be called consensus',()=>{
 const f=fixture(),other=f.receipts[1].label;
 f.receipts[1]=f.receipt(f.photos[0],'reviewerB',{
  ...other,instances:other.instances.map(x=>({...x,category:'Outerwear',instanceId:'different-external-category'}))
 });
 assert.throws(()=>f.run(),/third adjudicator/);
});
test('Mission1 duplicate nearly identical human masks with different reviewer IDs are refused at source adjudication',()=>{
 const f=fixture(),label={...f.receipts[0].label,instances:[
  {instanceId:'a-garment',category:'Tops',rle:[100,200,724]},
  {instanceId:'a-duplicate',category:'Tops',rle:[100,200,724]}
 ]};
 f.receipts[0]=f.receipt(f.photos[0],'reviewerA',label);
 assert.throws(()=>f.run(),/duplicate same-category human instance mask/);
});
