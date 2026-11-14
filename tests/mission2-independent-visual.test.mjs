import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 M2_VISUAL_POLICY,verifyCohortRecords,inspectOriginalVisualAssets,
 assessMission2VisualRelease
} from '../research/mission2-source-length/independent-visual-acceptance.mjs';

const load=path=>readFile('benchmark/'+path+'.json','utf8').then(JSON.parse);
const manifests=async()=>{
 const [locked,development,validation,holdout]=await Promise.all([
  load('locked-photo-sources'),load('manifest-reviewed-32'),
  load('manifest-fresh-11'),load('manifest-holdout-16')
 ]);
 return {locked,development,validation,holdout};
};
test('P2-C35 all 59 ORIGINAL source JPEGs have exact SHA256, JPEG decode, license and partition assignment',async()=>{
 const proof=await inspectOriginalVisualAssets();
 assert.equal(proof.schema,M2_VISUAL_POLICY.schema);
 assert.equal(proof.originalSourceJPEGsSHA256Verified,59);
 assert.ok(proof.originalBytesVerified>10_000_000);
 assert.ok(proof.minimumOriginalWidth>=80);
 assert.ok(proof.minimumOriginalHeight>=80);
 assert.deepEqual(proof.partitionCounts,{development:32,validation:11,holdout:16});
 assert.ok(Object.keys(proof.categorySourceCounts).length>=5);
 for(const c of M2_VISUAL_POLICY.categories)
  assert.ok(proof.categorySourceCounts[c]>=2,'requires actual original garments: '+c);
 assert.equal(proof.researchExposedInRecognitionHoldout,true);
 assert.equal(proof.independent3DBlindSourcesVerified,0);
 assert.equal(proof.independentlyHumanRatedSource3DImages,0);
 assert.equal(proof.originalRecognitionCategoryLabelsNot3DShapeGroundTruth,true);
 assert.equal(proof.releaseAuthorized,false);
 assert.equal(proof.familyAlpha,'HOLD');
 const verdict=assessMission2VisualRelease(proof);
 assert.equal(verdict.originalPhotoCount,59);
 assert.equal(verdict.independentlyCertifiedUnseen3DSourceCount,0);
 assert.equal(verdict.humanPhotorealism10of10Certified,false);
 assert.equal(verdict.physicalIPhoneAndroid3DVerified,false);
 assert.equal(verdict.mathematicallyContinuousClothCollisionVerified,false);
 assert.equal(verdict.familyAlpha,'HOLD');
 assert.equal(verdict.releaseAuthorized,false);
 assert.ok(verdict.keyBlockers.length>=5);
});
test('P2-C35 source metadata disallows leakage, source swaps, wrong attribution, duplicate originals and made-up human 3D ground truth',async()=>{
 const actual=await manifests();
 const good=verifyCohortRecords(actual);
 assert.equal(good.sourceCount,59);
 assert.equal(good.rows.filter(x=>x.researchExposed).length,2);
 assert.ok(good.rows.some(x=>x.id==='commons-0016'&&x.partition==='holdout'&&x.researchExposed));
 const mutate=(field,fn)=>{
  const copy=structuredClone(actual);fn(copy);assert.throws(()=>verifyCohortRecords(copy),/M2 C35/);
 };
 mutate('duplicate',x=>{x.holdout[0]={...x.development[0]};});
 mutate('source',x=>{x.locked[0].sha256='0'.repeat(64);x.locked[1].sha256='0'.repeat(64);});
 mutate('license',x=>{x.locked[0].attribution.license='';});
 mutate('tamper',x=>{x.development[0].image='wrong.jpg';});
 mutate('manifestSha',x=>{x.holdout[0].sha256='1'.repeat(64);});
 mutate('wrong partition',x=>{x.holdout.pop();});
 mutate('blind blouse',x=>{x.holdout=x.holdout.filter(y=>y.id!=='commons-0016');});
});
test('P2-C35 corrupted JPEG byte cannot pass even when manifest still says verified',async()=>{
 let injected=0;
 await assert.rejects(()=>inspectOriginalVisualAssets({readBinary:async path=>{
  const bytes=await readFile(path);
  if(path.endsWith('commons-0016.jpg')){
   const mutated=Buffer.from(bytes);mutated[44]^=0x01;injected++;
   return mutated;
  }
  return bytes;
 }}),/original source JPEG SHA changed/);
 assert.equal(injected,1);
});
test('P2-C35 fabricated 3D render hashes and human scores cannot authorize family release',async()=>{
 const proof=await inspectOriginalVisualAssets();
 const faker={sourceId:'commons-0016',category:'Tops',
  originalPhotoSHA256:'0'.repeat(64),renderPNG_SHA256:'1'.repeat(64),
  figure:'female',view:'front',width:390};
 const verdict=assessMission2VisualRelease(proof,{
  renderProofs:[faker],
  humanRatings:Array(4).fill({score:10,independenceClaim:true}),
  blindProofs:[{originalId:'commons-0016',certified:true}],
  physicalDeviceProofs:[{iphone:true,android:true,passed:true}],
  signedOwnerProofs:[{private:true,passed:true}]
 });
 assert.equal(verdict.submittedNotIndependentlyVerified.renders,1);
 assert.equal(verdict.submittedNotIndependentlyVerified.humanRatings,4);
 assert.equal(verdict.independentlyCertifiedPhotorealismRatings,0);
 assert.equal(verdict.independentlyCertifiedUnseen3DSourceCount,0);
 assert.equal(verdict.humanPhotorealism10of10Certified,false);
 assert.equal(verdict.releaseAuthorized,false);
 assert.throws(()=>assessMission2VisualRelease(proof,{renderProofs:[{
  ...faker,width:999
 }]}),/malformed alleged source/);
 assert.throws(()=>assessMission2VisualRelease({ ...proof,originalSourceJPEGsSHA256Verified:1 }),
  /verified full source cohort/);
});
