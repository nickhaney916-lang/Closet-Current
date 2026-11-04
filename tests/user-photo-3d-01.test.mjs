import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {PHOTO3D01,strictJPEGBytes01,verifyOriginalPhoto01,assessWardrobePhoto01,
  garmentKind01,planSavedOutfit01,proposeSilhouette01,attestFittedRender01,
  existingVettedSourceSHAs} from '../research/user-photo-3d-01/photo-readiness.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

const locks=JSON.parse(readFileSync('benchmark/locked-photo-sources.json'));
export const benchmark=[
 ['commons-0001','Tops','T-shirt'],['commons-0002','Tops','T-shirt'],
 ['commons-0003','Tops','T-shirt'],['commons-0014','Tops','Blouse'],
 ['commons-0016','Tops','Blouse'],
 ['commons-0021','Bottoms','Jeans'],['commons-0023','Bottoms','Jeans'],
 ['commons-0024','Bottoms','Jeans'],['commons-0035','Bottoms','Shorts'],
 ['commons-0041','Bottoms','Skirt'],
 ['commons-0046','Dresses','Dress'],['commons-0049','Dresses','Dress'],
 ['commons-0053','Dresses','Casual dress'],['commons-0059','Dresses','Dress and jacket'],
 ['validation-0001','Dresses','Summer dress']
];
const owner='11111111-1111-4111-8111-111111111111';
const ownerB='22222222-2222-4222-8222-222222222222';
function itemOf(id,cat,sub,own=owner){
 const pinned=locks.find(x=>x.id===id),bytes=readFileSync('benchmark/fixtures/'+id+'.jpg');
 const digest=createHash('sha256').update(bytes).digest('hex');
 assert.equal(pinned?.sha256,digest,'Real licensed full-res JPEG must match locked SHA '+id);
 assert.ok(pinned?.verified&&pinned?.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'));
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {id:'closet-'+id,ownerId:own,category:cat,itemType:sub,
   sourceSHA256:digest,originalPhoto:{image,sha256:digest},
   image,originalName:id+'.jpg',userAdjusted:true,
   multipleGarments:id==='commons-0059',correctionHistory:['original-human-category'],
   unknownValid:{colorCorrection:'user',nested:{array:[1,2,3]}}};
}
const items=benchmark.map(x=>itemOf(...x));
test('actual 15 original licensed JPEGs retain byte-for-byte SHA and owner identity',async()=>{
 assert.equal(items.length,15);
 for(const row of items){
  const proof=await verifyOriginalPhoto01(row,{ownerId:owner});
  assert.equal(proof.sha256,row.sourceSHA256);
  assert.equal(proof.byteLength,strictJPEGBytes01(row.originalPhoto.image).length);
  assert.equal(row.originalPhoto.image,row.image);
  assert.equal(row.correctionHistory[0],'original-human-category');
 }
});
test('fifteen representative shirts, bottoms, dresses receive conservative truthful readiness',async()=>{
 const verdicts=await Promise.all(items.map(x=>assessWardrobePhoto01(x,{ownerId:owner})));
 assert.equal(verdicts.length,15);
 assert.deepEqual(verdicts.reduce((a,x)=>(a[x.readiness]=(a[x.readiness]||0)+1,a),{}),
   {'Needs Review':12,'Photo-Only':3});
 assert.equal(verdicts.filter(x=>x.rendered3D).length,0);
 assert.deepEqual(verdicts.map(x=>x.kind).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{}),
   {shirt:3,blouse:2,jeans:3,shorts:1,skirt:1,dress:5});
 assert.ok(verdicts.every(x=>x.originalPhotoVerified&&x.sourceSHA256&&x.productionAuthorized===false));
});
test('known existing source hashes are not automatically declared 3D-ready',async()=>{
 for(const id of ['commons-0003','commons-0053']){
  const x=items.find(i=>i.id==='closet-'+id);
  const v=await assessWardrobePhoto01(x,{ownerId:owner});
  assert.equal(v.readiness,'Needs Review');assert.match(v.reason,/Pinned original source/);
 }
 assert.equal(existingVettedSourceSHAs.shirt,items[2].sourceSHA256);
 assert.equal(existingVettedSourceSHAs.dress,items[12].sourceSHA256);
});
test('untrusted success booleans and unsupported sources cannot mint acceptance',async()=>{
 const row=items[2];
 await assert.rejects(()=>assessWardrobePhoto01(row,{ownerId:owner,renderReceipt:{rendered:true,accepted:true}}),/Untrusted/);
 assert.throws(()=>attestFittedRender01({item:row,source:{ownerId:owner,itemId:row.id,sha256:row.sourceSHA256},
   rig:{getState:()=>({loaded:true,stats:{bones:163},releaseAuthorized:false,outfit:{garmentMeshes:2}}),canvas:{isConnected:true}},
   views:['front','side','rear']}),/Human visual/);
 const different=items[0];
 assert.throws(()=>attestFittedRender01({item:different,
  source:{ownerId:owner,itemId:different.id,sha256:different.sourceSHA256},
  rig:{getState:()=>({loaded:true,stats:{bones:163},releaseAuthorized:false,outfit:{garmentMeshes:2}}),canvas:{isConnected:true}},
  views:['front','side','rear'],humanReviewAccepted:true}),/Unknown photographic geometry/);
});
test('fake 163-bone counters and a generic rig never certify an actual source-fitted WebGL garment',async()=>{
 const row=items[2],source=await verifyOriginalPhoto01(row,{ownerId:owner});
 const generic={canvas:{isConnected:true},getState:()=>({loaded:true,stats:{bones:163},
   outfit:{garmentMeshes:2},releaseAuthorized:false})};
 assert.throws(()=>attestFittedRender01({item:row,source,rig:generic,
   views:['front','side','rear'],humanReviewAccepted:true}),/Actual live WebGL2/);
 const fakeWebGL={canvas:{isConnected:true,getContext:()=>({getParameter:()=> 'WebGL 2.0',VERSION:1})},
   getState:()=>({loaded:true,stats:{bones:163},outfit:{garmentMeshes:2},releaseAuthorized:false})};
 assert.throws(()=>attestFittedRender01({item:row,source,rig:fakeWebGL,
   views:['front','side','rear'],humanReviewAccepted:true}),/exact independently source-bound/);
 const result=await assessWardrobePhoto01(row,{ownerId:owner});
 assert.equal(result.readiness,'Needs Review');
});
test('invalid source hash, tampered full JPEG, missing original, foreign user fail closed',async()=>{
 const x=items[0];
 await assert.rejects(()=>verifyOriginalPhoto01({...x,ownerId:ownerB},{ownerId:owner}),/Foreign/);
 for(const bad of [
  {...x,sourceSHA256:'0'.repeat(64)},
  {...x,originalPhoto:{...x.originalPhoto,sha256:'f'.repeat(64)}},
  {...x,originalPhoto:{...x.originalPhoto,image:'data:image/jpeg;base64,AA=='}},
  {...x,originalPhoto:null}
 ])assert.equal((await assessWardrobePhoto01(bad,{ownerId:owner})).readiness,'Photo-Only');
});
test('saved outfits retain missing IDs, layers and 3D identity with zero mutations',()=>{
 const original={id:'outfit1',outfit3dId:'3d1',ownerId:owner,
  slots:{top:items[2].id,bottom:'missing-jeans',layer2:'missing-jacket',
    layer3:'missing-coat',shoes:'missing-shoes'},
  unknown:{keep:true}};const bytes=JSON.stringify(original);
 const p=planSavedOutfit01(original,[items[2]],{ownerId:owner});
 assert.equal(p.outfit3dId,'3d1');
 assert.deepEqual(p.missing.map(x=>x.garmentId),['missing-jeans','missing-jacket','missing-coat','missing-shoes']);
 assert.equal(JSON.stringify(original),bytes);
 assert.throws(()=>planSavedOutfit01(original,[{...items[2],ownerId:ownerB}],{ownerId:owner}),/Foreign/);
});
test('thumbnail boundary proposal never authorizes a cutout or 3D geometry',()=>{
 const w=64,h=80,raw=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const j=(y*w+x)*4;const fg=x>15&&x<47&&y>10&&y<73;
  raw[j]=fg?30:245;raw[j+1]=fg?32:245;raw[j+2]=fg?35:245;raw[j+3]=255;
 }
 const r=proposeSilhouette01({width:w,height:h,data:raw});
 assert.deepEqual(r.bbox,[16,11,46,72]);
 assert.equal(r.boundaryQuality,'candidate-unreviewed');
 assert.equal(r.approvedCutout,false);assert.equal(r.realFittedGeometry,false);
 assert.equal(r.originalBytesModified,false);
});
test('privacy and research-only release guarantees',()=>{
 assert.equal(PHOTO3D01.productionAuthorized,false);
 assert.equal(PHOTO3D01.familyAlpha,'HOLD');
 assert.equal(PHOTO3D01.realSignedAccountsVerified,false);
});
