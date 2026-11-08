import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {commitHumanReviewedPhoto119}
 from '../research/manual-reviewed-private-save-119/reviewed-source-commit.mjs';
import {readOwnerSnapshot01,exportBackup01,validateRestore01}
 from '../research/restore-atomic-01/atomic-restore.mjs';
import {installNativeCloudCutout177,CLOUD_SOURCE_177}
 from '../research/native-private-cloud-cutout-177/cloud-transport.mjs';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const require=createRequire(import.meta.url);
const E=require('../public/cloud-backup-engine.js');
const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
const lock=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(original),lock.find(x=>x.id==='commons-0002').sha256);
const jpeg=b=>'data:image/jpeg;base64,'+Buffer.from(b).toString('base64');
const crop=await sharp(original).extract({left:0,top:0,
 width:Math.max(10,Math.floor((await sharp(original).metadata()).width*.55)),
 height:Math.max(10,Math.floor((await sharp(original).metadata()).height*.65))}
).jpeg({quality:88}).toBuffer();
const cropSHA=sha(crop),originalSHA=sha(original);
assert.notEqual(cropSHA,originalSHA);
const createDB=owner=>new Promise((resolve,reject)=>{
 const request=indexedDB.open('closet-current-user-'+owner,2);
 request.onupgradeneeded=()=>{
  request.result.createObjectStore('items',{keyPath:'id'});
  request.result.createObjectStore('state',{keyPath:'id'});
 };
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});
const put=(db,store,row)=>new Promise((resolve,reject)=>{
 const tx=db.transaction(store,'readwrite');
 tx.objectStore(store).put(row);
 tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
});
async function fixture(){
 const owner=randomUUID(),db=await createDB(owner);
 const record={id:'owner-cutout-source-177',ownerId:owner,
  image:jpeg(original),originalPhoto:{image:jpeg(original),sha256:originalSHA},
  sourceSHA256:originalSHA,sourceHashVerified:true,
  singleGarmentVerified:false,outfitSourceId:'source-photo-actual-separated-piece',
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:originalSHA,cutoutSHA256:cropSHA,cutoutImage:jpeg(crop)},
  category:'Uncategorized',itemType:'Unknown',color:'Unknown'};
 await put(db,'state',{id:'draft',batch:[structuredClone(record)]});
 const commit=await commitHumanReviewedPhoto119({db,ownerId:owner,
  currentOwner:()=>owner,record,cryptoProvider:webcrypto,
  review:{confirmed:true,recordId:record.id,originalSHA256:originalSHA,
   category:'Tops',itemType:'T-shirt',color:'Green',
   singleGarmentConfirmed:false,instanceConfirmed:true,cutoutSHA256:cropSHA}});
 assert.equal(commit.saved,true);
 await put(db,'state',{id:'outfit-board',
  current:{name:'My saved owned outfit',slots:{}},
  saved:[{id:'p177-reviewed-outfit',ownerId:owner,
   name:'Original saved outfit',slots:{top:record.id,bottom:'unknown-jeans'}}]});
 const before=await readOwnerSnapshot01(db,()=>{});
 const backup=exportBackup01({ownerId:owner,rows:before.rows});
 db.close();
 const doc={schemaVersion:1,items:backup.items,state:backup.state};
 assert.equal((await validateRestore01({...doc,ownerId:owner},{ownerId:owner,mode:'cloud'})).reviewedCutoutJPEGsVerified,1);
 E.validateDocument(doc);
 return {owner,doc};
}
const session=f=>{
 let active=true,owner=f.owner;
 const lease=()=>{if(!active)throw Error('P177 revoked owner session');};
 return {guard:()=>lease(),getOwner:()=>owner,
  changeOwner:(v)=>{owner=v;},revoke:()=>{active=false;}};
};
const install=(f,s)=>installNativeCloudCutout177({
 engine:E,ownerId:f.owner,currentOwner:s.getOwner,
 assertLease:s.guard,cryptoProvider:webcrypto
});
async function pack(f){
 const s=session(f),guard=install(f,s),assets=new Map();
 try{
  const packed=await E.mapImages(f.doc,async image=>{
   assert.ok(image.startsWith('data:image/jpeg;base64,'));
   const bytes=Buffer.from(image.slice(23),'base64'),hash=sha(bytes);
   const path='closet-photo:'+f.owner+'/'+hash+'.jpg';
   assets.set(path,bytes);
   return path;
  });
  return {packed,assets,s,guard};
 }catch(e){guard.revoke();throw e;}
}
test('P177 reproduces actual native source transport cutout omission before opt-in shim',async()=>{
 const f=await fixture();
 let called=0;
 const old=await E.mapImages(f.doc,async value=>{called++;return 'closet-photo:placeholder';});
 assert.ok(called>=2);
 assert.equal(old.items[0].segmentHint.cutoutImage,jpeg(crop),
  'Baseline native engine must demonstrate original P128 documented inline JPEG defect');
 assert.equal(CLOUD_SOURCE_177.productionAuthorized,false);
});
test('P177 actual original P119 reviewed garment source + SECOND cutout independently go to SHA-addressed owner photos, unchanged metadata and board',async()=>{
 const f=await fixture();
 const {packed,assets,guard}=await pack(f);
 try{
  assert.equal(assets.size,2,'source JPEG and independently reviewed cutout are two owner-private objects');
  const row=packed.items[0];
  assert.equal(row.image,'closet-photo:'+f.owner+'/'+originalSHA+'.jpg');
  assert.equal(row.originalPhoto.image,row.image);
  assert.equal(row.segmentHint.cutoutImage,
   'closet-photo:'+f.owner+'/'+cropSHA+'.jpg');
  assert.equal(JSON.stringify(packed).includes('data:image/jpeg;base64,'),false);
  assert.equal(row.ownerReviewed,true);assert.equal(row.color,'Green');
  assert.deepEqual(packed.state,f.doc.state);
  assert.deepEqual(f.doc.items[0].segmentHint.cutoutImage,jpeg(crop));
  assert.equal(guard.state().cutoutsMapped,1);
  assert.equal(guard.state().imagesMapped,3);
 }finally{guard.revoke();}
});
test('P177 real native mapImages AFTER installing opt-in guard roundtrips original+cutout JPEG byte-exact, preserves saved outfit and owner private source',async()=>{
 const f=await fixture(),{packed,assets,guard}=await pack(f);
 try{
  let reads=0;
  const restored=await E.mapImages(packed,async path=>{
   reads++;
   return jpeg(assets.get(path));
  });
  assert.deepEqual(restored,f.doc);
  assert.equal(reads,3,'three source field references, TWO unique JPEG objects');
  assert.equal(sha(Buffer.from(restored.items[0].image.slice(23),'base64')),originalSHA);
  assert.equal(sha(Buffer.from(restored.items[0].segmentHint.cutoutImage.slice(23),'base64')),cropSHA);
  assert.equal(restored.state['outfit-board'].saved[0].slots.top,f.doc.items[0].id);
  assert.equal((await validateRestore01({...restored,ownerId:f.owner},
   {ownerId:f.owner,mode:'cloud'})).reviewedCutoutJPEGsVerified,1);
  assert.equal(guard.state().transactions,2);
 }finally{guard.revoke();}
});
test('P177 foreign-owner source paths fail synchronously before even ONE cloud fetch or storage upload callback',async()=>{
 const f=await fixture(),s=session(f),guard=install(f,s);let gets=0;
 try{
  const ownerB=randomUUID(),doc=structuredClone(f.doc);
  doc.items[0].image='closet-photo:'+f.owner+'/'+originalSHA+'.jpg';
  doc.items[0].originalPhoto.image='closet-photo:'+f.owner+'/'+originalSHA+'.jpg';
  doc.items[0].segmentHint.cutoutImage='closet-photo:'+ownerB+'/'+cropSHA+'.jpg';
  await assert.rejects(E.mapImages(doc,async()=>{gets++;return jpeg(original);}),/foreign/);
  assert.equal(gets,0,'No owner A source may be fetched when sibling cutout belongs to B');
  const forged=structuredClone(doc);
  forged.items[0].segmentHint.cutoutImage='closet-photo:'+f.owner+'/'+cropSHA+'.jpg';
  forged.items[0].image='closet-photo:'+ownerB+'/'+originalSHA+'.jpg';
  await assert.rejects(E.mapImages(forged,async()=>{gets++;return jpeg(original);}),/foreign/);
  assert.equal(gets,0);
 }finally{guard.revoke();}
});
test('P177 must not begin upload if original JPEG, secondary cutout JPEG, human review or saved owner metadata is changed',async()=>{
 const f=await fixture(),s=session(f),guard=install(f,s);let uploads=0;
 try{
  const scenarios=[
   d=>{d.items[0].segmentHint.cutoutImage=jpeg(original);},
   d=>{d.items[0].originalPhoto.image=jpeg(crop);},
   d=>{d.items[0].sourceSHA256='0'.repeat(64);},
   d=>{d.items[0].ownerId=randomUUID();},
   d=>{d.items[0].ownerReviewed=false;},
   d=>{d.items[0].segmentHint.cutoutSHA256='a'.repeat(64);},
   d=>{d.items[0].threeDReady=true;}
  ];
  for(const mutate of scenarios){
   const doc=structuredClone(f.doc);mutate(doc);
   await assert.rejects(E.mapImages(doc,async()=>{uploads++;return 'closet-photo:'+f.owner+'/'+originalSHA+'.jpg';}));
  }
  assert.equal(uploads,0,'fail closed BEFORE private upload or replacement');
 }finally{guard.revoke();}
});
test('P177 mixed inline-original/private-cutout paths and prototype pollution fail before any remote access',async()=>{
 const f=await fixture(),s=session(f),guard=install(f,s);let calls=0;
 try{
  const mixed=structuredClone(f.doc);
  mixed.items[0].segmentHint.cutoutImage='closet-photo:'+f.owner+'/'+cropSHA+'.jpg';
  await assert.rejects(E.mapImages(mixed,async()=>{calls++;}),/mixed/);
  const polluted=JSON.parse(JSON.stringify(f.doc));
  polluted.items[0].segmentHint['__proto__']={isAdmin:true}; // regular object property may not enumerate
  const truePolluted=JSON.parse('{"schemaVersion":1,"items":[],"state":{},"__proto__":{"admin":true}}');
  await assert.rejects(E.mapImages(truePolluted,async()=>{calls++;}),/Invalid cloud key|unsafe/);
  assert.equal(calls,0);
 }finally{guard.revoke();}
});
test('P177 a source owner switch or auth lease revocation during storage IO prevents release of any cloud document',async()=>{
 const f=await fixture(),s=session(f),guard=install(f,s);
 try{
  let started,finish;
  const entered=new Promise(r=>{started=r;});
  const paused=new Promise(r=>{finish=r;});
  const operation=E.mapImages(f.doc,async()=>{started();await paused;
   return 'closet-photo:'+f.owner+'/'+originalSHA+'.jpg';});
  await entered;s.changeOwner(randomUUID());finish();
  await assert.rejects(operation,/owner session changed/);
 }finally{guard.revoke();}
});
test('P177 downloaded cutout SHA substitution denied before returning a private wardrobe object for atomic restore',async()=>{
 const f=await fixture(),{packed,assets,guard}=await pack(f);
 try{
  let reads=0;
  await assert.rejects(E.mapImages(packed,async path=>{
   reads++;return path.endsWith(cropSHA+'.jpg')?jpeg(original):jpeg(assets.get(path));
  }),/cutout|SHA|RESTORE01|PHOTO126/);
  assert.ok(reads>=2);
 }finally{guard.revoke();}
});
test('P177 opt-in guard refuses duplicate native installation and correctly restores original cloud API on logout',async()=>{
 const f=await fixture(),s=session(f),original=E.mapImages,guard=install(f,s);
 assert.throws(()=>install(f,s),/duplicate/);
 guard.revoke();assert.equal(E.mapImages,original);
 s.revoke();
 assert.throws(()=>guard.state(),/revoked/);
 assert.equal(CLOUD_SOURCE_177.hostedSignedAuthVerified,false);
 assert.equal(CLOUD_SOURCE_177.arbitraryPrivatePhoto3DApproved,false);
});
