import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {visibleGarmentGroups24} from '../research/multi-garment-capture-01/visible-groups.mjs';
import {atomicSaveGarments24,verifiedRecord24,pieceKey24,validCrop24} from '../research/multi-garment-capture-01/atomic-group.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const sha=b=>createHash('sha256').update(b).digest('hex');
function map(w=40,h=40){
 const labels=new Uint8Array(w*h),confidence=new Float32Array(w*h);
 return {width:w,height:h,labels,confidence,personDetected:false,
  paint(id,x,y,ww,hh){for(let iy=y;iy<y+hh;iy++)for(let ix=x;ix<x+ww;ix++){
   const i=iy*w+ix;labels[i]=id;confidence[i]=.98;}}};
}
function fakeDB(owner){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('closet-current-user-'+owner,1);
  r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
const getAll=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
async function source(){
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg'),hash=sha(bytes);
 const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 assert.equal(locked.sha256,hash);assert.equal(locked.verified,true);
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {image,sourceSHA256:hash,sourceHashVerified:true,
  originalPhoto:{image,sha256:hash,width:800,height:900,origin:'licensed-fixture'}};
}
const piece=(id,category,color,index)=>({
 id,instanceKey:'seg-'+[4,6,9][index]+'-'+index+'-3-8-10-1',
 image:'data:image/jpeg;base64,/9j/2Q==',cropBounds:{x:index*.2,y:.1,width:.18,height:.4},
 confirmed:true,category,itemType:['T-shirt','Jeans','Sneakers'][index],color,
 hint:{categories:[category],confidence:.98},cropReviewed:true
});
test('flat lay: shirt, jeans and paired shoes are 3 regions without requiring a person',()=>{
 const a=map();a.paint(4,3,2,12,10);a.paint(6,21,3,11,24);
 a.paint(9,3,29,6,6);a.paint(9,12,30,6,6);
 const regions=visibleGarmentGroups24(a);
 assert.deepEqual(regions.map(x=>x.label),['Upper garment','Bottoms','Shoes']);
 assert.equal(regions[2].count,72);
 assert.ok(regions.every(x=>x.needsReview));
});
test('separate same-category tops stay separate, no invented hidden garment',()=>{
 const a=map();a.paint(4,2,2,10,12);a.paint(4,20,2,10,12);
 assert.equal(visibleGarmentGroups24(a).length,2);
 const b=map();b.paint(4,2,2,28,12);
 assert.equal(visibleGarmentGroups24(b).length,1,'overlapping fabric cannot be guessed into two tops');
 assert.equal(visibleGarmentGroups24(map()).length,0);
});
test('skin or model background never becomes an automatically detected clothing item',()=>{
 const a=map();a.paint(11,4,4,20,20);a.paint(12,10,25,18,10);
 assert.deepEqual(visibleGarmentGroups24(a),[]);
});
test('tiny specks and partial ambiguous masks fail conservative segmentation',()=>{
 const a=map();a.paint(4,2,2,2,2);a.paint(6,10,10,3,2);
 assert.deepEqual(visibleGarmentGroups24(a),[]);
 a.paint(7,11,11,8,8);a.confidence.fill(.62);
 assert.deepEqual(visibleGarmentGroups24(a),[]);
});
test('exact immutable source SHA and owner-private 3-piece atomic commit',async()=>{
 const proof=await source(),db=await fakeDB('alice-m24'),owner=()=> 'alice-m24';
 const pieces=[piece('shirt','Tops','Red',0),piece('jeans','Bottoms','Blue',1),piece('shoes','Shoes','Black',2)];
 const result=await atomicSaveGarments24({db,proof,pieces,ownerId:'alice-m24',currentOwner:owner});
 assert.equal(result.length,3);
 const rows=await getAll(db);assert.equal(rows.length,3);
 assert.equal(new Set(rows.map(x=>x.id)).size,3);
 assert.equal(new Set(rows.map(x=>x.sourcePieceKey)).size,3);
 assert.ok(rows.every(x=>x.sourceSHA256===proof.sourceSHA256&&x.originalPhoto.image===proof.image&&
  x.originalPhoto.sha256===proof.sourceSHA256&&x.userAdjusted&&x.sourceCropReviewed&&
  !x.singleGarmentVerified&&!x.threeDReady&&x.ownerId==='alice-m24'));
 assert.deepEqual(rows.map(x=>x.category).sort(),['Bottoms','Shoes','Tops']);
 assert.deepEqual(rows.map(x=>x.color).sort(),['Black','Blue','Red']);
 const first={...rows[0],color:'Green'};
 const tx=db.transaction('items','readwrite');tx.objectStore('items').put(first);
 await new Promise(resolve=>tx.oncomplete=resolve);
 assert.equal((await getAll(db))[0].color,'Green','independent corrections survive');
 db.close();
});
test('repeat exact photograph keys abort an entire new group; distinct same-source garments are valid',async()=>{
 const proof=await source(),db=await fakeDB('dup-m24'),owner=()=> 'dup-m24';
 await atomicSaveGarments24({db,proof,pieces:[piece('one','Tops','Red',0)],ownerId:'dup-m24',currentOwner:owner});
 await assert.rejects(atomicSaveGarments24({db,proof,pieces:[piece('fresh','Tops','Red',0),piece('other','Bottoms','Blue',1)],ownerId:'dup-m24',currentOwner:owner}),/duplicate/i);
 assert.equal((await getAll(db)).length,1,'no partial second item in aborted batch');
 await atomicSaveGarments24({db,proof,pieces:[piece('other','Bottoms','Blue',1)],ownerId:'dup-m24',currentOwner:owner});
 assert.equal((await getAll(db)).length,2);
 db.close();
});
test('mismatched SHA, changed owner, unreviewed garment and repeated instance are rejected',async()=>{
 const proof=await source(),db=await fakeDB('reject-m24'),good=piece('one','Tops','Red',0);
 await assert.rejects(atomicSaveGarments24({db,proof:{...proof,sourceSHA256:'a'.repeat(64),originalPhoto:{...proof.originalPhoto,sha256:'a'.repeat(64)}},pieces:[good],ownerId:'reject-m24',currentOwner:()=> 'reject-m24'}),/SHA/i);
 await assert.rejects(atomicSaveGarments24({db,proof,pieces:[good],ownerId:'reject-m24',currentOwner:()=> 'bob'}),/owner/i);
 await assert.rejects(atomicSaveGarments24({db,proof,pieces:[{...good,confirmed:false}],ownerId:'reject-m24',currentOwner:()=> 'reject-m24'}),/unreviewed/i);
 await assert.rejects(atomicSaveGarments24({db,proof,pieces:[good,{...good,id:'two'}],ownerId:'reject-m24',currentOwner:()=> 'reject-m24'}),/duplicate/i);
 assert.equal((await getAll(db)).length,0);db.close();
});
test('manual missed region must have an explicitly reviewed valid crop, not a guessed entire person',async()=>{
 const proof=await source(),p={...piece('manual','Shoes','Black',2),manual:true,cropReviewed:false,instanceKey:'manual-120-340-230-300'};
 assert.throws(()=>verifiedRecord24({proof,ownerId:'any',piece:p}),/crop review/);
 assert.ok(validCrop24({x:.12,y:.34,width:.23,height:.3}));
 assert.equal(pieceKey24(proof.sourceSHA256,p.instanceKey),proof.sourceSHA256+'/manual-120-340-230-300');
});

test('DETECTOR57 direct atomic API fails closed for auto-detected unreviewed crop and cannot partially save group',async()=>{
 const proof=await source();
 const bad={...piece('auto','Tops','Blue',0),manual:false,cropReviewed:false};
 assert.throws(()=>verifiedRecord24({proof,ownerId:'auto-gate-57',piece:bad}),/crop review/);
 const db=await fakeDB('auto-gate-57');
 const args={db,proof,ownerId:'auto-gate-57',currentOwner:()=> 'auto-gate-57'};
 await assert.rejects(atomicSaveGarments24({...args,pieces:[piece('other','Bottoms','Blue',1),bad]}),/crop review/);
 assert.equal((await getAll(db)).length,0,'No first garment from group can survive unreviewed automatic crop');
 const accepted=await atomicSaveGarments24({...args,pieces:[{...bad,cropReviewed:true}]});
 assert.equal(accepted.length,1,'Explicit reviewed auto crop remains permitted');
 assert.equal((await getAll(db))[0].sourceCropReviewed,true);
 db.close();
});
test('DETECTOR57 crop review is an exact boolean, not a model score, string, object or category estimate',async()=>{
 const proof=await source(),base={...piece('score','Tops','Blue',0),manual:false};
 for(const cropReviewed of [undefined,null,false,0,1,'true',{},[]]){
  assert.throws(()=>verifiedRecord24({proof,ownerId:'score57',piece:{...base,cropReviewed}}),/crop review/);
 }
 assert.equal(verifiedRecord24({proof,ownerId:'score57',piece:{...base,cropReviewed:true}}).sourceCropReviewed,true);
});

test('P813: 13 distinguishable original model regions are NEVER silently truncated to twelve',()=>{
 const a=map(80,80);
 for(let i=0;i<13;i++){
  const row=Math.floor(i/4),col=i%4;
  a.paint(4,2+col*19,2+row*19,8,8);
 }
 assert.throws(()=>visibleGarmentGroups24(a),error=>
  error instanceof RangeError&&error.code==='MULTI24_REVIEW_OVERFLOW'&&
  error.visibleProposalCount===13&&error.reviewLimit===12);
 const all=visibleGarmentGroups24(a,{limit:24});
 assert.equal(all.length,13);
 assert.equal(new Set(all.map(g=>g.instanceKey)).size,13);
 assert.equal(all.reduce((n,g)=>n+g.count,0),13*64);
 assert.ok(all.every(x=>x.needsReview&&!x.accepted));
 const pixels=new Uint8Array(80*80);
 for(const region of all)for(let i=0;i<region.selected.length;i++)if(region.selected[i]){
  assert.equal(pixels[i],0,'visible garments are separate, not duplicated or merged');
  pixels[i]=1;
 }
});
test('P813: source grouping caps reject invalid values and >24 components without a partial 24-item batch',()=>{
 const a=map(100,100);
 for(let i=0;i<25;i++)a.paint(4,2+(i%5)*18,2+Math.floor(i/5)*18,8,8);
 for(const limit of [undefined,0,-1,12.5,25,1/0,NaN,'12']){
  if(limit===undefined)continue;
  assert.throws(()=>visibleGarmentGroups24(a,{limit}),/invalid reviewed garment limit/);
 }
 assert.throws(()=>visibleGarmentGroups24(a,{limit:24}),error=>
  error.code==='MULTI24_REVIEW_OVERFLOW'&&error.visibleProposalCount===25&&error.reviewLimit===24);
 assert.throws(()=>visibleGarmentGroups24(a),/MULTI24_REVIEW_OVERFLOW/);
});
