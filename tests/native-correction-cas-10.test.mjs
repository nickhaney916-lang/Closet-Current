import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {NATIVE_CORRECTION_10,validateNativeCorrection10,
 verifyNativeCorrectionSource10} from '../research/native-correction-10/owner-correction-cas.mjs';
const owner='fixture-owner-10',sha=x=>createHash('sha256').update(x).digest('hex');
const bytes=await readFile('benchmark/fixtures/commons-0002.jpg');
const hash=sha(bytes);
const original='data:image/jpeg;base64,'+bytes.toString('base64');
const fixture=()=>({
 id:'owner10-red-shirt',ownerId:owner,name:'Original red T-shirt',
 category:'Tops',itemType:'T-shirt',color:'Red',userAdjusted:true,
 sourceSHA256:hash,sourceHashVerified:true,
 originalPhoto:{sha256:hash,image:original},image:original,
 notes:'Old notes',sourceIdentity:'unchanged',futureRecognitionField:{locked:true}
});
test('all source identity and arbitrary future data remain byte-exact in proposed correction',async()=>{
 const before=fixture(),after=structuredClone(before);
 after.category='Outerwear';after.itemType='Jacket';after.name='Reclassified red top';
 after.color='Blue';after.notes='Human correction';
 const result=validateNativeCorrection10({before,after,ownerId:owner});
 assert.equal(result.originalSHA,hash);
 assert.equal(result.unchangedIdentity,true);
 assert.equal((await verifyNativeCorrectionSource10(before,{
  cryptoApi:webcrypto,atobFn:x=>Buffer.from(x,'base64').toString('binary')
 })).sha256,hash);
 assert.equal(before.category,'Tops');assert.equal(before.originalPhoto.image,original);
 assert.equal(NATIVE_CORRECTION_10.productionAuthorized,false);
 assert.equal(NATIVE_CORRECTION_10.noOutfitMutation,true);
 assert.equal(NATIVE_CORRECTION_10.familyAlpha,'HOLD');
});
test('changed original photographs, SHA or item/owner identity fail closed',()=>{
 const before=fixture();
 for(const [key,value]of [
  ['id','different-item'],
  ['ownerId','foreign-owner'],
  ['sourceSHA256','0'.repeat(64)],
  ['sourceHashVerified',false],
  ['image','data:image/jpeg;base64,AA=='],
  ['originalPhoto',{...before.originalPhoto,sha256:'0'.repeat(64)}],
  ['recognitionPhoto',{image:'tampered'}],
  ['sourceIdentity','switched-file']]){
  const after={...structuredClone(before),[key]:value};
  assert.throws(()=>validateNativeCorrection10({before,after,ownerId:owner}),
   /CORRECTION10_/,key);
 }
 const after=structuredClone(before);after.category='Dresses';after.userAdjusted=false;
 assert.throws(()=>validateNativeCorrection10({before,after,ownerId:owner}),
  /EXPLICIT_HUMAN_REVIEW/);
});
test('source hash cannot be accepted merely on a metadata flag',async()=>{
 const before=fixture();before.originalPhoto.image='data:image/jpeg;base64,'+
  Buffer.from('not a JPEG').toString('base64');
 await assert.rejects(()=>verifyNativeCorrectionSource10(before,{
  cryptoApi:webcrypto,atobFn:x=>Buffer.from(x,'base64').toString('binary')
 }),/NOT_CANONICAL_JPEG/);
 before.originalPhoto.image=original;
 before.sourceSHA256='e'.repeat(64);before.originalPhoto.sha256=before.sourceSHA256;
 await assert.rejects(()=>verifyNativeCorrectionSource10(before,{
  cryptoApi:webcrypto,atobFn:x=>Buffer.from(x,'base64').toString('binary')
 }),/SHA256_MISMATCH/);
});
test('unverified legacy original can only retain photo-only status; it is never auto-certified',async()=>{
 const before={...fixture(),sourceSHA256:undefined,sourceHashVerified:undefined,originalPhoto:undefined};
 assert.deepEqual(await verifyNativeCorrectionSource10(before,{
  cryptoApi:webcrypto,atobFn:x=>Buffer.from(x,'base64').toString('binary')
 }),{verified:false,legacyPhotoOnly:true});
});
