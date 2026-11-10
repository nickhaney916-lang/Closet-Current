import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign as cryptoSign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
 authorManualSourceLabel774,drawHumanSourcePixels774,encodeBinaryRLE774,
 signActualReviewerAnnotation774
} from '../research/mission1-reviewer-774/offline-human-polygon-receipt.mjs';
import {
 sha256,signedMessage,sealProspectiveHoldout,evaluateProspectiveHoldout,
 P66_EXPOSED_DIGESTS
} from '../research/mission1-sealed-human-holdout-768/prospective-gate.mjs';
import {P772_EXPOSED_DIGESTS_774,P792_EXPOSED_DIGESTS_792} from '../research/mission1-exposure-774/pinned-exposed-source-history.mjs';
const square=(x1,y1,x2,y2)=>[[x1,y1],[x2,y1],[x2,y2],[x1,y2]];
const humanDeclaration={
 directHumanTracing:true,notShownModelPredictions:true,
 notModelGenerated:true,annotationPreparedIndependently:true
};
function cohort(){
 const keys={},privateKeys={};
 for(const name of ['coordinator','reviewerA','reviewerB','adjudicator']){
  const k=generateKeyPairSync('ed25519');
  keys[name]=k.publicKey.export({type:'spki',format:'pem'});
  privateKeys[name]=k.privateKey.export({type:'pkcs8',format:'pem'});
 }
 // This is a deliberately synthetic unit JPEG. It is NOT a real photo, true
 // photographer rights declaration, or an actual independent human reviewer.
 const jpeg=Buffer.alloc(256,5);jpeg.set([255,216,255,192,0,17,8,0,32,0,32],0);
 jpeg.set([255,217],254);
 const photo={id:'hold-manual-unit-only',image:'synthetic-review.jpg',sha256:sha256(jpeg),
  originalSourceURL:'https://example.invalid/not-a-real-photo',
  sourceLicenseURL:'https://example.invalid/no-real-license',
  creatorCredit:'CI synthetic source, NOT genuine human/photographic evidence',
  rightsClaim:'source-reviewed',width:32,height:32};
 const known=[...JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8')).map(x=>x.sha256),...P66_EXPOSED_DIGESTS,...P772_EXPOSED_DIGESTS_774,...P792_EXPOSED_DIGESTS_792];
 const modelSHA256='8'.repeat(64),modelIndexSHA256='9'.repeat(64);
 const seal=sealProspectiveHoldout({
  photos:[photo],reviewerPublicKeys:keys,exposedSHA256:known,
  modelSHA256,modelIndexSHA256,registrationId:'m1-cohort-synthetic-human-fixture'
 },()=>jpeg);
 const registrationPayload={purpose:'register-before-inference',sealSHA256:seal.sealSHA256};
 const registrationWitness={signerId:'coordinator',signature:cryptoSign(null,
  signedMessage(registrationPayload),privateKeys.coordinator).toString('base64')};
 const blouse={instanceId:'reviewerA-left-top',category:'Tops',
  subtype:'Blouse',primaryColor:'Blue',polygons:[square(2,2,10,12)]};
 const jeans={instanceId:'reviewerA-right-bottom',category:'Bottoms',
  subtype:'Jeans',primaryColor:'Brown',polygons:[square(15,11,25,26)]};
 const first={sourceId:photo.id,sourceSHA256:photo.sha256,regions:[blouse,jeans]};
 const second={sourceId:photo.id,sourceSHA256:photo.sha256,regions:[
  {...jeans,instanceId:'different-person-item-2'},
  {...blouse,instanceId:'different-person-item-1'}
 ]};
 const sign=(reviewerId,annotations,extra={})=>signActualReviewerAnnotation774({
  seal,reviewerPublicKeys:keys,reviewerId,photoId:photo.id,photoJPEG:jpeg,
  annotations,reviewerDeclaration:humanDeclaration,
  privateKeyPEM:privateKeys[reviewerId],...extra
 });
 const a=sign('reviewerA',first),b=sign('reviewerB',second);
 const predictions=[{id:photo.id,sourceSHA256:photo.sha256,
  modelSHA256,modelIndexSHA256,strong:false,categoryConfirmed:false,
  prediction:{category:null,type:null,primaryColor:null},
  instances:[...a.label.instances].map(x=>({
   category:x.category,type:x.subtype,primaryColor:x.primaryColor,rle:x.rle
  }))
 }];
 const evaluate=(reviews=[a,b])=>evaluateProspectiveHoldout({
  seal,registrationWitness,reviewers:{publicKeys:keys,receipts:reviews},
  predictions,readPhoto:()=>jpeg,knownExposedSHA256:known,
  externalChronology:{
   registrationCommitAncestors:['synthetic-unit-not-real-external-audit'],
   registrationCommittedBeforeInference:true,
   predictionBatchCommittedAfterRegistration:true
  }
 });
 return {jpeg,photo,known,seal,keys,privateKeys,a,b,blouse,jeans,first,second,
  sign,predictions,evaluate,registrationWitness};
}
test('P774 human-drawn source-pixel rectangles produce exact complete 0-first alternating binary mask RLE',()=>{
 const mask=drawHumanSourcePixels774({
  width:32,height:32,polygons:[square(2,2,10,12)]
 });
 assert.equal(mask.length,1024);
 assert.equal(mask.reduce((n,v)=>n+v,0),80);
 assert.equal(mask[2*32+2],1);
 assert.equal(mask[11*32+9],1);
 assert.equal(mask[12*32+10],0);
 const rle=encodeBinaryRLE774(mask);
 assert.equal(rle.reduce((a,b)=>a+b,0),1024);
 assert.equal(rle[0],66);
 assert.ok(rle.length>4);
});
test('P774 manually separated blue blouse and brown jeans sign twice with different IDs and establish geometric consensus, never real human identity',()=>{
 const f=cohort(),result=f.evaluate();
 assert.equal(result.counts.photos,1);
 assert.equal(result.counts.mixedPhotos,1);
 assert.equal(result.counts.mixedTruthGarments,2);
 assert.equal(result.counts.mixedCategoryAccuracyPercent,100);
 assert.equal(result.counts.mixedSubtypeAccuracyPercent,100);
 assert.equal(result.counts.mixedColorAccuracyPercent,100);
 assert.equal(result.counts.instanceRecallPercent,100);
 assert.equal(result.records[0].humanAgreement,true);
 assert.equal(result.counts.adjudicatedItems,0);
 assert.equal(result.distinctHumanIdentitiesIndependentlyConfirmed,false);
 assert.equal(result.missionOneCompleted,false);
 assert.equal(result.familyAlpha,'HOLD');
});
test('P774 an explicit human negative has no mask; missing annotations cannot be silently treated as negative',()=>{
 const photo=cohort().photo;
 const negative=authorManualSourceLabel774({
  photo,regions:[],explicitNoGarments:true
 });
 assert.deepEqual(negative,{
  category:'Uncategorized',subtype:'Unknown',primaryColor:'Unknown',instances:[]
 });
 assert.throws(()=>authorManualSourceLabel774({photo,regions:[]}),/negative photo needs explicit/);
 assert.throws(()=>authorManualSourceLabel774({
  photo,regions:[cohort().blouse],explicitNoGarments:true
 }),/negative original cannot include/);
});
test('P774 no model-generated or predicted polygons may be signed as real human blinded review without explicit attestation',()=>{
 const f=cohort();
 const declaration={...humanDeclaration,notModelGenerated:false};
 assert.throws(()=>signActualReviewerAnnotation774({
  seal:f.seal,reviewerPublicKeys:f.keys,reviewerId:'reviewerB',
  photoId:f.photo.id,photoJPEG:f.jpeg,annotations:f.second,
  reviewerDeclaration:declaration,privateKeyPEM:f.privateKeys.reviewerB
 }),/must explicitly attest/);
 assert.throws(()=>signActualReviewerAnnotation774({
  seal:f.seal,reviewerPublicKeys:f.keys,reviewerId:'reviewerB',
  photoId:f.photo.id,photoJPEG:f.jpeg,annotations:f.second,
  reviewerDeclaration:{...humanDeclaration,notShownModelPredictions:false},
  privateKeyPEM:f.privateKeys.reviewerB
 }),/must explicitly attest/);
});
test('P774 counterfeit photographer source SHA, reviewer signing key, coordinator misuse or seal registry mismatch all fail closed',()=>{
 const f=cohort(),bad=Buffer.from(f.jpeg);bad[32]^=9;
 assert.throws(()=>signActualReviewerAnnotation774({
  seal:f.seal,reviewerPublicKeys:f.keys,reviewerId:'reviewerA',
  photoId:f.photo.id,photoJPEG:bad,annotations:f.first,
  reviewerDeclaration:humanDeclaration,privateKeyPEM:f.privateKeys.reviewerA
 }),/registered JPEG source bytes/);
 assert.throws(()=>signActualReviewerAnnotation774({
  seal:f.seal,reviewerPublicKeys:f.keys,reviewerId:'reviewerA',
  photoId:f.photo.id,photoJPEG:f.jpeg,annotations:f.first,
  reviewerDeclaration:humanDeclaration,privateKeyPEM:f.privateKeys.reviewerB
 }),/does not match sealed enrolled identity/);
 assert.throws(()=>signActualReviewerAnnotation774({
  seal:f.seal,reviewerPublicKeys:f.keys,reviewerId:'coordinator',
  photoId:f.photo.id,photoJPEG:f.jpeg,annotations:f.first,
  reviewerDeclaration:humanDeclaration,privateKeyPEM:f.privateKeys.coordinator
 }),/not enrolled as independent/);
 assert.throws(()=>signActualReviewerAnnotation774({
  seal:f.seal,reviewerPublicKeys:{...f.keys,reviewerA:f.keys.reviewerB},
  reviewerId:'reviewerA',photoId:f.photo.id,photoJPEG:f.jpeg,
  annotations:f.first,reviewerDeclaration:humanDeclaration,
  privateKeyPEM:f.privateKeys.reviewerA
 }),/registry|missing immutable pre-inference source and reviewer enrollment/);
});
test('P774 local source boundaries cannot exceed dimensions or silently rasterize empty/invalid human polygons',()=>{
 const f=cohort();
 for(const poly of [[[-1,0],[5,0],[5,5]],[[0,0],[99,0],[5,5]],[[0,0],[1,1]],[[NaN,1],[5,1],[2,8]]]){
  assert.throws(()=>drawHumanSourcePixels774({
   width:32,height:32,polygons:[poly]
  }),/manual original-pixel polygons/);
 }
 assert.throws(()=>drawHumanSourcePixels774({
  width:32,height:32,polygons:[square(2,2,10,12)],
  holes:[square(0,0,30,30)]
 }),/contains no source pixel/);
 assert.throws(()=>encodeBinaryRLE774(new Uint8Array(1024)),/empty/);
});
test('P774 malformed reviewer taxonomy, unknown colors, duplicate IDs and fabricated single photo category are refused',()=>{
 const f=cohort();
 for(const bad of [
  [{...f.blouse,subtype:'Jeans'}],
  [{...f.blouse,primaryColor:'Unknown'}],
  [{...f.blouse},{...f.jeans,instanceId:f.blouse.instanceId}],
  [{...f.blouse,instanceId:''}],
 ]){
  assert.throws(()=>authorManualSourceLabel774({photo:f.photo,regions:bad}),/invalid\/duplicate/);
 }
 const singleton=authorManualSourceLabel774({photo:f.photo,regions:[f.blouse]});
 assert.equal(singleton.category,'Tops');
 assert.deepEqual(Object.keys(singleton.instances[0]).sort(),['category','instanceId','rle']);
});
test('P774 human reviewer color disagreement requires separately signed third adjudicator with rationale; fake adjudication is refused',()=>{
 const f=cohort(),wrong={sourceId:f.photo.id,sourceSHA256:f.photo.sha256,regions:[
  {...f.jeans,primaryColor:'Black',instanceId:'other-human-jeans'},
  {...f.blouse,instanceId:'other-human-blouse'}]};
 const b=f.sign('reviewerB',wrong);
 assert.throws(()=>f.evaluate([f.a,b]),/third adjudicator/);
 assert.throws(()=>f.sign('adjudicator',f.first),/human adjudication reason/);
 const c=f.sign('adjudicator',f.first,{adjudicationRationale:'Actual disputed pants primary color requires review'});
 const r=f.evaluate([f.a,b,c]);
 assert.equal(r.counts.adjudicatedItems,1);
 assert.equal(r.records[0].humanAgreement,false);
 assert.equal(r.missionOneCompleted,false);
});
test('P774 alternate crop/modified source cannot be signed under the old source hash and signer key does not establish actual human independence',()=>{
 const f=cohort(),b=Buffer.from(f.jpeg);b[100]^=29;
 assert.notEqual(sha256(b),f.photo.sha256);
 assert.throws(()=>f.sign('reviewerA',f.first,{photoJPEG:b}),/registered JPEG source bytes/);
 assert.equal(f.a.independentHumanStatus,'self-attested-requires-external-identity-and-blindness-audit');
 assert.equal(f.a.reviewMethod,'human-traced-source-pixel-polygons');
 assert.ok(/^[0-9a-f]{64}$/.test(f.a.manualPixelAnnotationSHA256));
 assert.ok(typeof f.a.signature==='string'&&f.a.signature.length>50);
});

test('P774 signed manual polygons cannot be transplanted from another original JPEG or omit source binding',()=>{
 const f=cohort();
 for(const candidate of [
  {...f.first,sourceId:'another-original-photo'},
  {...f.first,sourceSHA256:'f'.repeat(64)},
  {regions:f.first.regions},
  {...f.first,sourceId:null}
 ]){
  assert.throws(()=>f.sign('reviewerA',candidate),
   /manual polygon export source ID\/SHA does not match the sealed original/);
 }
 // Valid, identical manually annotated pixels remain signable in CI fixture.
 const signed=f.sign('reviewerA',f.first);
 assert.equal(signed.sourceSHA256,f.photo.sha256);
 assert.equal(signed.missionOneCompleted,undefined);
});

test('P780 scanline source-center parity agrees pixel-for-pixel with the previous independent ray-crossing rule on fractional concave polygons and union-minus-hole geometry',()=>{
 const polygons=[
  [[1.2,1.1],[30.4,1.2],[29.8,10.5],[21.5,10.5],[21.5,27.2],[7.2,27.2],[6.5,15.8],[1.2,15.8]],
  [[15.5,2.5],[29.5,18.5],[18.5,26.5],[12.5,14.5]]
 ];
 const holes=[
  [[9.5,8.5],[17.5,8.5],[17.5,19.5],[9.5,19.5]],
  [[24.5,19.5],[31,21.5],[24.5,24.5]]
 ];
 const oracle=(x,y,poly)=>{
  let inside=false;
  for(let a=0,b=poly.length-1;a<poly.length;b=a++){
   const [ax,ay]=poly[a],[bx,by]=poly[b];
   if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  }
  return inside;
 };
 const actual=drawHumanSourcePixels774({width:32,height:32,polygons,holes});
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const cx=x+.5,cy=y+.5;
  const expected=+(polygons.some(p=>oracle(cx,cy,p))&&!holes.some(p=>oracle(cx,cy,p)));
  assert.equal(actual[y*32+x],expected,'source center parity mismatch at '+x+','+y);
 }
});
test('P780 a genuine 4032x3024 pixel JPEG can be registered and its manually drawn garment signed at full source resolution without any crop or surrogate JPEG', {timeout:60000},async()=>{
 const sharp=(await import('sharp')).default;
 const width=4032,height=3024;
 const original=await sharp({create:{width,height,channels:3,background:{r:30,g:90,b:140}}})
  .jpeg({quality:80}).toBuffer();
 const f=cohort(),photo={...f.photo,id:'hold-fullsize-unit-only',
  image:'fullsize-synthetic-ci.jpg',width,height,sha256:sha256(original),
  creatorCredit:'SYNTHETIC SHARP-GENERATED TEST NOT A HUMAN PHOTO'};
 const seal=sealProspectiveHoldout({
  photos:[photo],reviewerPublicKeys:f.keys,exposedSHA256:f.known,
  modelSHA256:'8'.repeat(64),modelIndexSHA256:'9'.repeat(64),
  registrationId:'m1-cohort-fullsize-unit-only'
 },()=>original);
 assert.equal(seal.photos[0].width,width);
 assert.equal(seal.photos[0].height,height);
 const regions=[{
  instanceId:'synthetic-shape-only',
  category:'Tops',subtype:'Blouse',primaryColor:'Blue',
  polygons:[square(512,340,3512,2600)],
  holes:[square(1000,1000,1400,1500)]
 }];
 const annotation={sourceId:photo.id,sourceSHA256:photo.sha256,regions};
 const signed=signActualReviewerAnnotation774({
  seal,reviewerPublicKeys:f.keys,reviewerId:'reviewerA',
  photoId:photo.id,photoJPEG:original,annotations:annotation,
  reviewerDeclaration:humanDeclaration,privateKeyPEM:f.privateKeys.reviewerA
 });
 assert.equal(signed.sourceSHA256,sha256(original));
 const rle=signed.label.instances[0].rle;
 assert.equal(rle.reduce((n,v)=>n+v,0),width*height);
 assert.equal(rle.filter((_,i)=>i%2===1).reduce((n,v)=>n+v,0),
   (3512-512)*(2600-340)-(1400-1000)*(1500-1000));
 assert.equal(signed.independentHumanStatus,'self-attested-requires-external-identity-and-blindness-audit');
 assert.equal(signed.missionOneCompleted,undefined);
 assert.throws(()=>drawHumanSourcePixels774({
  width:5000,height:4000,polygons:[square(2,2,20,20)]
 }),/manual original-pixel polygons/,'larger than 16 megapixels must fail before allocating masks');
 assert.throws(()=>authorManualSourceLabel774({
  photo:{...photo,width:5000,height:4000},regions
 }),/actual registered original JPEG dimensions/);
});

test('P791 native owner-saveable Accessories can be manually signed without fictional subtype',()=>{
 const f=cohort(),hat={sourceId:f.photo.id,sourceSHA256:f.photo.sha256,
  regions:[{instanceId:'person-a-hat',category:'Accessories',subtype:'Hat',
   primaryColor:'Blue',polygons:[square(2,2,10,12)]}]};
 const r=f.sign('reviewerA',hat);
 assert.equal(r.label.category,'Accessories');
 assert.equal(r.label.subtype,'Hat');
 assert.equal(r.label.instances.length,1);
});
test('P791 manual reviewer cannot sign Other or Unknown as exact accepted clothing subtypes',()=>{
 const f=cohort();
 for(const subtype of ['Other','Unknown','Unlisted made-up type']){
  const bad={...f.first,regions:[{...f.blouse,subtype}]};
  assert.throws(()=>f.sign('reviewerA',bad),/invalid\/duplicate manually outlined instance category/);
 }
});
