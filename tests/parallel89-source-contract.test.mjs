import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SOURCE_CLASSES89,attestOriginalSource89,buildSourceObservedFront89,auditSourceOutfit89} from '../research/parallel89/source-contract.mjs';
const registry=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const get=id=>registry.find(r=>r.id===id);
const file=id=>readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url));
const verified=id=>attestOriginalSource89({sourceId:id,originalBytes:file(id),lockedRecord:get(id)});
for(const id of Object.keys(SOURCE_CLASSES89)){
 test('actual public JPEG, exact source SHA and rights: '+id,()=>{
  const photo=file(id),row=verified(id),record=SOURCE_CLASSES89[id];
  assert.equal(createHash('sha256').update(photo).digest('hex'),record.sha);
  assert.equal(row.status,'ORIGINAL_JPEG_VERIFIED');assert.equal(row.category,record.category);
  assert.equal(row.license,record.license);assert.equal(row.originalByteCount,photo.byteLength);
  assert.equal(row.actual163BoneFitProved,false);assert.equal(row.releaseAuthorized,false);
  assert.deepEqual(row.observedViews,['single-published-view-angle-unadjudicated']);
 });
}
test('two different source categories, authentic original JPEGs, both avatars, still gated 2D',()=>{
 const sources=[verified('commons-0003'),verified('commons-0023')];
 for(const avatar of ['male','female']){
  const look=auditSourceOutfit89({pieces:sources,avatar});
  assert.equal(look.status,'MULTICATEGORY_PUBLIC_SOURCE_PAIR_VERIFIED_3D_NOT_CLEARED');
  assert.equal(look.originalSourceJPEGsVerified,2);
  assert.equal(look.distinctSourceCategories,2);
  assert.equal(look.actualPairedSkinnedMeshesValidated,false);
  assert.equal(look.mode,'original-photo-2d-required');
  assert.equal(look.contactStatus,'NOT_TESTED');
 }
});
test('provisional source-front mesh follows verified real photo identity, never claims wearable depth',()=>{
 const verifiedPhoto=verified('commons-0016');const a=new Uint8Array(16);
 a[5]=255;a[6]=255;a[9]=255;
 const sha=createHash('sha256').update(a).digest('hex');
 const panel=buildSourceObservedFront89({sourceReceipt:verifiedPhoto,alpha:a,width:4,height:4,sourceMaskSHA256:sha});
 assert.equal(panel.status,'OBSERVED_FRONT_GEOMETRY_NOT_FITTED');
 assert.equal(panel.triangles,6);assert.equal(panel.foregroundPixels,3);
 assert.equal(panel.sourceBackObserved,false);assert.equal(panel.actual163BoneFitProved,false);
 assert.equal(panel.releaseAuthorized,false);
 assert.equal(panel.uv.length>0,true);
 assert.equal(buildSourceObservedFront89({sourceReceipt:verifiedPhoto,alpha:a,width:4,height:4,sourceMaskSHA256:'f'.repeat(64)}).status,'ORIGINAL_PHOTO_2D_REQUIRED');
});
test('corrupted photo, forged legal rights, wrong source and missing photo fail closed',()=>{
 const bytes=file('commons-0053');const bad=Uint8Array.from(bytes);bad[60]^=1;
 for(const input of [
  {sourceId:'commons-0053',originalBytes:bad,lockedRecord:get('commons-0053')},
  {sourceId:'commons-0053',originalBytes:bytes,lockedRecord:{...get('commons-0053'),attribution:{...get('commons-0053').attribution,license:'proprietary'}}},
  {sourceId:'commons-0053',originalBytes:bytes,lockedRecord:get('commons-0003')},
  {sourceId:'commons-0053',lockedRecord:get('commons-0053')},
  {sourceId:'unregistered-private-photo',originalBytes:bytes,lockedRecord:get('commons-0053')}
 ]){const r=attestOriginalSource89(input);assert.equal(r.status,'ORIGINAL_PHOTO_2D_REQUIRED');assert.equal(r.releaseAuthorized,false);}
});
test('wrong owner category, duplicate garment, unobserved jacket, dress+bottom and positive crossings are rejected',()=>{
 const top=verified('commons-0003'),bottom=verified('commons-0023'),dress=verified('commons-0053');
 const cases=[
  [top,{...bottom}],
  [top,{...bottom,category:'jacket'}],
  [top,top],
  [top,{...bottom,sourceId:'owner-unsupported-jacket'}],
  [dress,bottom]
 ];
 for(const pieces of cases){const r=auditSourceOutfit89({pieces,avatar:'female'});assert.equal(r.status,'ORIGINAL_PHOTO_2D_REQUIRED');}
 const r=auditSourceOutfit89({pieces:[top,bottom],avatar:'female',contactReceipt:{anyCrossingVeto:true,strictTransverseCrossings:14}});
 assert.equal(r.reason,'measured-intergarment-crossing-veto');
});
test('a bounded P84 no-crossing receipt NEVER certifies source 3D fit or independent realism',()=>{
 const receipt={schema:'parallel84-distinct-source-layer-contact/v1',status:'UNCERTAIN_NOT_CLEARANCE',
   budgetComplete:true,contactClearanceProved:false,releaseAuthorized:false,strictTransverseCrossings:0};
 const r=auditSourceOutfit89({pieces:[verified('commons-0016'),verified('commons-0023')],avatar:'male',contactReceipt:receipt});
 assert.equal(r.independentLayerContactMeasured,false);assert.equal(r.contactStatus,'UNVERIFIED_EXTERNAL_RECEIPT');
 assert.equal(r.safeToRenderPhotorealistic3D,false);assert.equal(r.releaseAuthorized,false);
});