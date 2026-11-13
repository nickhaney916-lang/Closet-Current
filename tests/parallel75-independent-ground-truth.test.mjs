import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign,createPublicKey} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {
 SCHEMA,sha256,isHex64,rightsOK,sourceKey,originalURL,hamming64,
 verifiedSource,verifyOriginalBytes,checkOverlap,priorExposures,validatePartition,
 canonical,validateLabel,verifyHumanReceipt,independentAgreement,publicAuditReport
} from '../scripts/p75-dataset-core.mjs';
const now='2026-11-12T20:00:00.000Z';
const original=Buffer.alloc(14500,0x52);
const sha1=createHash('sha1').update(original).digest('hex');
function candidate(p={}){
 return {schema:SCHEMA,id:'new-1',
 sourcePage:'https://commons.wikimedia.org/wiki/File:Unexposed_test_garment.jpg',
 originalURL:'https://upload.wikimedia.org/wikipedia/commons/a/aa/Unexposed_test_garment.jpg',
 license:'CC BY 4.0',licenseURL:'https://creativecommons.org/licenses/by/4.0/',
 artist:'Verified publisher metadata (NOT independent proof)',title:'File:Unexposed test garment.jpg',
 sha256:sha256(original),commonsSha1:sha1,byteLength:original.length,width:1200,height:1600,
 orientation:1,mime:'image/jpeg',dhash64:'1234567890abcdef',
 acquiredAt:now,verification:'bytes-verified',photoContent:'unreviewed',
 rightsReview:'manual-review-required',sourceGroupApproved:false,garmentHumanVerified:false,
 split:'quarantine',sourceGroupId:null,...p};
}
function record(p={}){const r=candidate(p);r.dhash64='1234567890abcdef';return r;}
const goodLabel=()=>({
 presence:'single-garment',category:'Tops',subtype:'T-shirt',primaryColor:'Blue',secondaryColor:'Unknown',
 multicolor:false,colorCast:false,instanceCount:1,
 instances:[{id:'piece-1',box:[0.1,0.1,0.5,0.7],maskSha256:null,clipped:false,occluded:false}],
 wardrobeUnit:'single-unit',quality:{lighting:'ok',focus:'ok',framing:'ok',background:'ok'}
});
function signedFixture(){
 // These are GENERATED TEST KEYS AND TEST LABELS, not real human evidence.
 const registrar=generateKeyPairSync('ed25519'),reviewers=['HUMAN-TEST-A','HUMAN-TEST-B'].map(id=>{
  const kp=generateKeyPairSync('ed25519'),publicKey=kp.publicKey.export({type:'spki',format:'pem'});
  const payload={reviewerId:id,publicKey,role:'independent-human',identityVerified:true};
  return {...payload,registrarSignature:sign(null,Buffer.from(canonical(payload)),registrar.privateKey).toString('base64'),privateKey:kp.privateKey};
 });
 const registry={registrarPublicKey:registrar.publicKey.export({type:'spki',format:'pem'}),
  reviewers:reviewers.map(({privateKey,...x})=>x)};
 const fingerprint=sha256(registrar.publicKey.export({type:'spki',format:'der'}));
 const review=(i,labels=goodLabel(),more={})=>{
  const unsigned={schema:SCHEMA,reviewerId:reviewers[i].reviewerId,sourceSha256:record().sha256,
   method:'independent-human',predictionsExposed:false,reviewedAt:now,labels,...more};
  return {...unsigned,signature:sign(null,Buffer.from(canonical(unsigned)),reviewers[i].privateKey).toString('base64')};
 };
 return {registry,fingerprint,review};
}
test('safe Commons-only original URL gate rejects thumbnails, redirects, arbitrary host',()=>{
 assert.equal(sourceKey(record().sourcePage),'file:unexposed test garment.jpg');
 assert.equal(originalURL(record().originalURL),true);
 for(const url of [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/garment.jpg/100px-garment.jpg',
  'https://example.net/wikipedia/commons/a/aa/photo.jpg',
  'http://upload.wikimedia.org/wikipedia/commons/a/aa/garment.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/aa/garment.jpg?q=1'
 ])assert.equal(originalURL(url),false,url);
});
test('explicit, matching license URL required; public visibility is not reuse permission',()=>{
 assert.equal(rightsOK('CC BY 4.0','https://creativecommons.org/licenses/by/4.0/'),true);
 assert.equal(rightsOK('CC BY 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),false);
 assert.equal(rightsOK('All rights reserved','https://creativecommons.org/licenses/by/4.0/'),false);
 assert.equal(rightsOK('CC BY-NC 4.0','https://creativecommons.org/licenses/by-nc/4.0/'),false);
 assert.ok(verifiedSource(record({license:'unknown'})).includes('unverified rights'));
});
test('missing original hash, stale or future metadata, incompatible MIME are blocked',()=>{
 assert.equal(verifiedSource(record(),{now:new Date(now)}).length,0);
 assert.ok(verifiedSource(record({sha256:undefined}),{now:new Date(now)}).includes('missing source digests'));
 assert.ok(verifiedSource(record({acquiredAt:'2024-01-01T00:00:00.000Z'}),{now:new Date(now)}).includes('stale original/rights metadata'));
 assert.ok(verifiedSource(record({acquiredAt:'2027-01-01T00:00:00.000Z'}),{now:new Date(now)}).includes('stale original/rights metadata'));
 assert.ok(verifiedSource(record({mime:'image/svg+xml'}),{now:new Date(now)}).includes('image MIME'));
});
test('an edited JPEG, reencoded thumbnail or changed publisher bytes fail SHA1 and SHA256',()=>{
 assert.equal(verifyOriginalBytes(record(),original),true);
 const changed=Buffer.from(original);changed[42]^=1;
 assert.equal(verifyOriginalBytes(record(),changed),false);
 assert.equal(verifyOriginalBytes(record(),original.subarray(0,14000)),false);
 assert.equal(verifyOriginalBytes(record({commonsSha1:'1'.repeat(40)}),original),false);
});
test('source, SHA, accession/series and perceptual duplicates all flag as exposure',()=>{
 const row=record({objectKey:'MET:49.22',seriesKey:'museum:garment:42'});
 const old=[{sha256:row.sha256},{sourcePage:row.sourcePage},{objectKey:'MET:49.22'},{seriesKey:'museum:garment:42'},
  {dhash64:'1234567890abcdef'}];
 assert.deepEqual(checkOverlap(row,old),['exact-sha256','pixel-near-duplicate','same-commons-page','same-garment-or-publisher-object','same-publisher-series']);
 assert.equal(hamming64('0000000000000000','ffffffffffffffff'),64);
 assert.equal(hamming64('0000000000000000','0000000000000001'),1);
});
test('all historical exposed manifests contribute source or SHA to quarantine',async()=>{
 const names=['benchmark/locked-photo-sources.json','benchmark/manifest-holdout-16.json',
  'benchmark/manifest-reviewed-32.json','benchmark/manifest-fresh-11.json'];
 const manifests=Object.fromEntries(await Promise.all(names.map(async n=>[n,JSON.parse(await readFile(n,'utf8'))])));
 const old=priorExposures(manifests);
 assert.ok(old.length>=20,'original exposed metadata not empty');
 for(const x of old)assert.ok(x.sha256||x.sourcePage);
 assert.ok(checkOverlap(record({sourcePage:old[0].sourcePage}),old).includes('same-commons-page'));
});
test('deduplication rejects cross-split same source group, exact hash, resized/cropped lookalikes',()=>{
 const train=record({id:'a',split:'train',sourceGroupId:'group-A',sourceGroupApproved:true,garmentHumanVerified:true,
  photoContent:'human-reviewed',rightsReview:'curator-approved',dhash64:undefined});
 delete train['dh ash64'];train.dhash64='0000000000000000';
 const dev={...train,id:'b',split:'development',sha256:'b'.repeat(64),commonsSha1:'b'.repeat(40),sourcePage:'https://commons.wikimedia.org/wiki/File:Other.jpg'};
 assert.ok(validatePartition([train,dev],[],{requireBlindHuman:false}).includes('source group cross-split'));
 dev.sourceGroupId='group-B';dev.dhash64='0000000000000001';
 assert.ok(validatePartition([train,dev],[],{requireBlindHuman:false}).includes('cross-partition duplicate/near duplicate'));
});
test('publicly visible or previously model-scored blind row is contaminated',()=>{
 const row=record({split:'blind',sourceGroupId:'reviewed-A',sourceGroupApproved:true,garmentHumanVerified:true,
  photoContent:'human-reviewed',rightsReview:'curator-approved',sealedByIndependentHumanAudit:true,labelsPublic:true,
  modelScored:true,previouslyExposed:true});
 const issues=validatePartition([row],[]);
 assert.ok(issues.includes('contaminated blind'));
 assert.ok(issues.includes('historical exposure')===false);
 assert.ok(validatePartition([record({split:'blind'})],[]).includes('no private sealed audit'));
});
test('labels allow abstain/Unknown but reject impossible subtype, colors and boxes',()=>{
 assert.deepEqual(validateLabel(goodLabel()),[]);
 assert.deepEqual(validateLabel({...goodLabel(),subtype:'Tall boots'}),['subtype']);
 assert.ok(validateLabel({...goodLabel(),primaryColor:'Transparent magic'}).includes('color'));
 assert.ok(validateLabel({...goodLabel(),instances:[{...goodLabel().instances[0],box:[.8,.8,.7,.4]}]}).includes('box'));
 assert.ok(validateLabel({...goodLabel(),instanceCount:1,wardrobeUnit:'matching-pair'}).includes('contradictory pair truth'));
 assert.deepEqual(validateLabel({...goodLabel(),category:'Unknown',subtype:'Unknown',primaryColor:'Unknown'}),[]);
});
test('unsigned/AI-only/unregistered/false-attested reviewers cannot become truth',()=>{
 const row=record(),{registry,fingerprint,review}=signedFixture(),v=review(0);
 assert.deepEqual(verifyHumanReceipt(row,v,registry,fingerprint),[]);
 assert.ok(verifyHumanReceipt(row,v,registry,null).includes('no independently approved registrar trust anchor'));
 assert.ok(verifyHumanReceipt(row,{...v,signature:'AAAA'},registry,fingerprint).includes('unsigned/edited review'));
 const fake={...v,reviewerId:'UNREGISTERED'};
 assert.ok(verifyHumanReceipt(row,fake,registry,fingerprint).includes('unverified reviewer'));
 assert.ok(verifyHumanReceipt(row,review(0,goodLabel(),{method:'AI-only'}),registry,fingerprint).includes('untrusted label provenance'));
 assert.ok(verifyHumanReceipt(row,review(0,goodLabel(),{predictionsExposed:true}),registry,fingerprint).includes('untrusted label provenance'));
});
test('synthetic dual Ed25519 test can verify mechanics, NOT actual human existence',()=>{
 const row=record(),{registry,fingerprint,review}=signedFixture();
 const a=review(0),b=review(1);
 const ok=independentAgreement(row,[a,b],registry,fingerprint);
 assert.equal(ok.eligible,true);assert.deepEqual(ok.agreement,{equal:8,total:8,ratio:1});
 assert.equal(independentAgreement(row,[a,a],registry,fingerprint).eligible,false);
 const different=review(1,{...goodLabel(),primaryColor:'Red',subtype:'Blouse'});
 const disagreement=independentAgreement(row,[a,different],registry,fingerprint);
 assert.equal(disagreement.eligible,false);
 assert.deepEqual(disagreement.agreement,{equal:6,total:8,ratio:.75});
});
test('structural independent-human signatures cannot be edited without invalidation',()=>{
 const row=record(),{registry,fingerprint,review}=signedFixture();
 const v=review(0),altered={...v,labels:{...v.labels,subtype:'Blouse'}};
 assert.ok(verifyHumanReceipt(row,altered,registry,fingerprint).includes('unsigned/edited review'));
 assert.ok(verifyHumanReceipt(record({sha256:'f'.repeat(64)}),v,registry,fingerprint).includes('untrusted label provenance'));
});
test('unreviewed candidate cannot be promoted to train, dev or blind by split naming',()=>{
 for(const split of ['train','development','blind'])assert.ok(validatePartition([record({split})],[]).length>0,split);
 assert.deepEqual(validatePartition([record()],[]),[]);
});
test('public audit never fabricates reviewer counts or blind eligibility',()=>{
 const v=publicAuditReport([record()],[]);
 assert.equal(v.candidates,1);assert.equal(v.humanLabeled,0);assert.equal(v.doubleHumanVerified,0);
 assert.equal(v.sealedBlindEligible,0);assert.equal(v.modelAccuracyGain,'UNKNOWN');
});
