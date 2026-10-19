import test from 'node:test';
import assert from 'node:assert/strict';
import {blindOriginalFormReviewPacket} from '../benchmark/blind-original-form-review.mjs';
import {originalFormReviewQueue} from '../benchmark/original-photo-form-review.mjs';
const id='commons-0059',source='https://commons.wikimedia.org/wiki/File:'+id;
const manifest=[{id,image:id+'.jpg',source,verified:true,mode:'single',expectedCategory:'Dresses',expectedType:'Dress'}];
const locked=[{id,image:id+'.jpg',sha256:'f'.repeat(64),verified:true,
 attribution:{source,title:'Dress and jacket',license:'CC BY 4.0'}}];
const results=[{id,prediction:{category:'Tops',type:'Tunic'},strong:true}];
const queue=originalFormReviewQueue(manifest,locked,results);
test('independent blind packets contain the original licensed link and SHA but never model or manifest answers',()=>{
 for(const slot of ['first','second']){
  const p=blindOriginalFormReviewPacket(queue,slot),encoded=JSON.stringify(p);
  assert.equal(p.photoCount,1);
  assert.equal(p.originals[0].sourceSha256,'f'.repeat(64));
  assert.equal(p.originals[0].originalSourceUrl,source);
  assert.deepEqual(p.originals[0].sourceVisiblePhysicalGarments,[]);
  assert.equal(p.originals[0].allVisiblePhysicalGarmentsRecorded,null);
  assert.equal(p.modelPredictionsIncluded,false);
  assert.equal(p.manifestCategoryLabelsIncluded,false);
  assert.equal(p.independentlyReviewed,false);
  assert.equal(p.originalPhotosCopiedOrReencoded,false);
  for(const leaking of ['Tunic','Dresses','Dress and jacket','Tops','possible-multiple',
     'strong-specific-form-disagreement','manifestLabel','modelResult','flags'])
   assert.equal(encoded.includes(leaking),false,'no model, title or existing reference should leak '+leaking);
 }
});
test('previous review, duplicate photos, invalid immutable original and missing licenses fail closed',()=>{
 assert.throws(()=>blindOriginalFormReviewPacket(queue,'operator'),/Untrusted/);
 assert.throws(()=>blindOriginalFormReviewPacket({...queue,independentHumanRecords:1},'first'),/Untrusted/);
 assert.throws(()=>blindOriginalFormReviewPacket({...queue,rows:[queue.rows[0],queue.rows[0]],originalSourcePhotos:2},'first'),/Untrusted original/);
 assert.throws(()=>blindOriginalFormReviewPacket({...queue,rows:[{...queue.rows[0],sourceSha256:'bad'}]},'first'),/Untrusted original/);
 assert.throws(()=>blindOriginalFormReviewPacket({...queue,rows:[{...queue.rows[0],attribution:{license:null}}]},'first'),/license/);
});
