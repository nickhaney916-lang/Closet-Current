import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {assessSavedNative08,NATIVE_READINESS_08} from '../research/native-photo-readiness-08/native-readiness-panel.mjs';
import {verifyOriginalPhoto01} from '../research/user-photo-3d-01/photo-readiness.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const specs=[
 ['commons-0001','Tops','T-shirt'],['commons-0002','Tops','T-shirt'],
 ['commons-0003','Tops','T-shirt'],['commons-0014','Tops','Blouse'],
 ['commons-0016','Tops','Blouse'],['commons-0021','Bottoms','Jeans'],
 ['commons-0023','Bottoms','Jeans'],['commons-0024','Bottoms','Jeans'],
 ['commons-0035','Bottoms','Shorts'],['commons-0041','Bottoms','Skirt'],
 ['commons-0046','Dresses','Dress'],['commons-0049','Dresses','Dress'],
 ['commons-0053','Dresses','Casual dress'],['commons-0059','Dresses','Dress and jacket'],
 ['validation-0001','Dresses','Summer dress']
];
function build([tag,category,itemType],who=owner){
 const image=readFileSync('benchmark/fixtures/'+tag+'.jpg');
 const sha=createHash('sha256').update(image).digest('hex');
 const manifest=locked.find(x=>x.id===tag);
 assert.equal(sha,manifest?.sha256);
 assert.equal(manifest?.verified,true);
 return {id:who+'-'+tag,ownerId:who,category,itemType,name:tag,
  sourceSHA256:sha,originalPhoto:{image:'data:image/jpeg;base64,'+image.toString('base64'),sha256:sha},
  image:'data:image/jpeg;base64,'+image.toString('base64'),
  multipleGarments:tag==='commons-0059',userAdjusted:true};
}
const items=specs.map(build);
test('fifteen original licensed photographs stay unchanged, unreviewed meshes never accepted',async()=>{
 const perType={};
 for(const x of items){
  const before=structuredClone(x),verified=await verifyOriginalPhoto01(x,{ownerId:owner});
  assert.equal(verified.sha256,x.sourceSHA256);
  const saved={id:'outfit-'+x.id,ownerId:owner,slots:{top:x.id}};
  const review=await assessSavedNative08({ownerId:owner,saved,items:[x]});
  perType[review.entries[0].status]=(perType[review.entries[0].status]||0)+1;
  assert.equal(review.ready,0);assert.equal(review.noWrites,true);
  assert.equal(review.entries[0].photo,before.originalPhoto.image);
  assert.equal(review.entries[0].sourceSHA256,before.originalPhoto.sha256);
  assert.deepEqual(x,before);
 }
 assert.deepEqual(perType,{'Needs Review':12,'Photo-Only':3});
});
test('all selected original photos, unsupported jackets and missing IDs retain distinct safe fallback',async()=>{
 const input={id:'look',ownerId:owner,slots:{
  top:items[12].id,bottom:'missing-jeans',layer2:'missing-jacket',
  shoes:'missing-shoes'
 },saved3DIdentity:'must-stay'};
 const snap=structuredClone(input);
 const review=await assessSavedNative08({ownerId:owner,saved:input,items});
 assert.deepEqual(review.entries.map(x=>x.status),['Needs Review','Missing','Missing','Missing']);
 assert.equal(review.review,1);assert.equal(review.missing,3);assert.equal(review.ready,0);
 assert.equal(review.entries.filter(x=>!!x.photo).length,1);
 assert.deepEqual(input,snap);
});
test('tampered JPEG never appears in source status; duplicate and foreign account records block the whole review',async()=>{
 const a=items[0],bad=structuredClone(a);
 bad.originalPhoto.sha256='a'.repeat(64);
 const review=await assessSavedNative08({ownerId:owner,
  saved:{id:'look',ownerId:owner,slots:{top:a.id}},items:[bad]});
 assert.equal(review.entries[0].status,'Photo-Only');
 assert.equal(review.entries[0].originalPhotoVerified,false);
 assert.equal(review.entries[0].photo,null);
 await assert.rejects(assessSavedNative08({ownerId:owner,
  saved:{id:'look',ownerId:owner,slots:{top:a.id}},items:[a,a]}),/duplicate|invalid/i);
 await assert.rejects(assessSavedNative08({ownerId:owner,
  saved:{id:'look',ownerId:owner,slots:{top:a.id}},items:[a,{...a,id:'foreign',ownerId:other}]}),/foreign/);
 await assert.rejects(assessSavedNative08({ownerId:other,
  saved:{id:'look',ownerId:owner,slots:{top:a.id}},items:[a]}),/owner/);
});
test('active owner assertion can revoke while SHA verification is pending; no results can be returned',async()=>{
 let runs=0;
 await assert.rejects(assessSavedNative08({
  ownerId:owner,saved:{id:'look',ownerId:owner,slots:{top:items[0].id}},items:[items[0]],
  assertOwner(){if(++runs>=2)throw Error('owner switched');}
 }),/owner switched/);
});
test('readiness panel metadata is read-only and requires independent human fitting',()=>{
 assert.equal(NATIVE_READINESS_08.productionAuthorized,false);
 assert.equal(NATIVE_READINESS_08.humanFittedReviewRequired,true);
 assert.equal(NATIVE_READINESS_08.familyAlpha,'HOLD');
});
