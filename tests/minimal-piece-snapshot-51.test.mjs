import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {atomicSaveGarments24,minimalPieceSnapshot51} from '../research/multi-garment-capture-01/atomic-group.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;

const sha=b=>createHash('sha256').update(b).digest('hex');
async function source(){
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
 const sha256=sha(bytes);
 const lock=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0003');
 assert.equal(sha256,lock.sha256);
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {image,sourceSHA256:sha256,sourceHashVerified:true,
  originalPhoto:{image,sha256,width:800,height:900,origin:'licensed-source'}};
}
function piece(proof,id='garment',extra={}){
 return {id,instanceKey:'seg-8-12-15-65-70-1',image:proof.image,
  cropBounds:{x:.12,y:.15,width:.65,height:.7},
  cropReviewed:true,confirmed:true,category:'Tops',itemType:'T-shirt',
  color:'Black',name:'Black tee',
  hint:{categories:['Tops'],types:['T-shirt'],confidence:.85,clipped:false},
  ...extra};
}
const open=owner=>new Promise((resolve,reject)=>{
 const r=indexedDB.open('closet-current-user-'+owner,1);
 r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const read=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});

test('SNAPSHOT51 excludes unrelated arbitrary fields and uncloneable worker function before selection clone',async()=>{
 const proof=await source(),owner='snapshot51-extra',db=await open(owner);
 const malicious=piece(proof,'tee-extra',{
  rawSegmentation:{pixels:new Uint8Array(180000),oauth:'NEVER_PERSIST_SECRET'},
  rawOriginalCopiedAgain:proof.image,ownerId:'foreign-override',cloudSecret:'NEVER_PERSIST_SECRET',
  nested:{callbacks:{toString(){return 'unsafe';}}},
  onProgress:()=>{throw Error('uncloneable worker callback');},
  imageBlob:new Uint8Array(100000),debugNotes:'NEVER_PERSIST_SECRET'
 });
 try{
  const selected=minimalPieceSnapshot51(malicious,proof);
  assert.deepEqual(Object.keys(selected).sort(),[
   'id','instanceKey','image','cropBounds','cropReviewed','confirmed','category','itemType',
   'color','manual','name','hint','maskApplied','recognitionSuggestion42'].sort());
  assert.equal(JSON.stringify(selected).includes('NEVER_PERSIST_SECRET'),false);
  const rows=await atomicSaveGarments24({
   db,proof,pieces:[malicious],ownerId:owner,currentOwner:()=>owner
  });
  assert.equal(rows.length,1);assert.deepEqual(await read(db),rows);
  assert.equal(rows[0].ownerId,owner);
  assert.equal(rows[0].originalPhoto.image,proof.image);
  assert.equal(rows[0].sourceSHA256,proof.sourceSHA256);
  assert.equal(rows[0].itemType,'T-shirt');
  assert.equal(rows[0].colorSource,'user');
  assert.equal(JSON.stringify(rows).includes('NEVER_PERSIST_SECRET'),false);
  assert.equal(Object.hasOwn(rows[0],'rawSegmentation'),false);
 }finally{db.close();}
});

test('SNAPSHOT51 preserves correct bound local-model receipt while removing arbitrary nested AI data',async()=>{
 const proof=await source(),owner='snapshot51-ai',db=await open(owner);
 const raw=piece(proof,'tee-ai',{
  recognitionSuggestion42:{
   source:'local-fashionclip',category:'Tops',itemType:'T-shirt',color:'Blue',
   colorSource:'recognition',originalContext:{category:'Tops',itemType:'T-shirt',color:'Blue',pixels:new Uint8Array(10000)},
   colorReview46:{source:'reviewed-crop-pixels',primary:'Blue',secondary:'Black',needsConfirmation:true,image:proof.image},
   inputBinding49:{hashAlgorithm:'SHA-256',sourceSHA256:proof.sourceSHA256,cropSHA256:proof.sourceSHA256,requestedAssetTag:'verified-51'},
   dangerousCallback:()=>{},rawModelTensor:new Uint8Array(50000),
   oauthToken:'NEVER_PERSIST_SECRET'
  }
 });
 try{
  const rows=await atomicSaveGarments24({db,proof,pieces:[raw],ownerId:owner,currentOwner:()=>owner});
  const ai=rows[0].recognitionSuggestion42;
  assert.equal(ai.source,'local-fashionclip');
  assert.equal(ai.inputBinding49.cropSHA256,proof.sourceSHA256);
  assert.equal(ai.inputBinding49.sourceSHA256,proof.sourceSHA256);
  assert.equal(ai.colorReview46.needsConfirmation,true);
  assert.equal(rows[0].color,'Black');
  assert.equal(rows[0].itemType,'T-shirt');
  assert.equal(JSON.stringify(rows).includes('NEVER_PERSIST_SECRET'),false);
  assert.equal(Object.hasOwn(ai,'rawModelTensor'),false);
  assert.deepEqual(await read(db),rows);
 }finally{db.close();}
});

test('SNAPSHOT51 invalid/stale AI receipt still drops entire suggestion, never retroactively marks legacy',async()=>{
 const proof=await source(),owner='snapshot51-invalid',db=await open(owner);
 const forged=piece(proof,'tee-forged',{
  recognitionSuggestion42:{source:'local-fashionclip',category:'Tops',itemType:'T-shirt',color:'Blue',
   inputBinding49:{hashAlgorithm:'SHA-256',sourceSHA256:proof.sourceSHA256,
    cropSHA256:'0'.repeat(64),requestedAssetTag:'fake'} }
 });
 try{
  const rows=await atomicSaveGarments24({db,proof,pieces:[forged],ownerId:owner,currentOwner:()=>owner});
  assert.equal(rows.length,1);assert.equal(rows[0].recognitionSuggestion42,undefined);
  assert.equal(rows[0].color,'Black');assert.equal(rows[0].category,'Tops');
  assert.equal(rows[0].sourceSHA256,proof.sourceSHA256);
 }finally{db.close();}
});

test('SNAPSHOT51 malformed tagged model metadata cannot silently become unbound trusted suggestion',async()=>{
 const proof=await source(),owner='snapshot51-malformed',db=await open(owner);
 const forged=piece(proof,'tee-invalid-tag',{recognitionSuggestion42:{
  source:'local-fashionclip',category:'Tops',itemType:'T-shirt',color:'Blue',
  inputBinding49:{hashAlgorithm:'FAKE',cropSHA256:'1'.repeat(64),requestedAssetTag:'untrusted',
   sourceSHA256:proof.sourceSHA256}
 }});
 const legacy=piece(proof,'tee-legacy',{instanceKey:'seg-9-16-19-50-55-1',
  recognitionSuggestion42:{source:'local-fashionclip',category:'Tops',itemType:'T-shirt',color:'Blue'}});
 try{
  const rows=await atomicSaveGarments24({db,proof,pieces:[forged,legacy],ownerId:owner,currentOwner:()=>owner});
  assert.equal(rows[0].recognitionSuggestion42,undefined);
  assert.equal(rows[1].recognitionSuggestion42?.source,'local-fashionclip');
  assert.equal(rows[1].recognitionSuggestion42?.inputBinding49,undefined);
  assert.equal(rows[1].color,'Black');
 }finally{db.close();}
});

test('SNAPSHOT51 changes to UI category, photo and worker hint after call do not alter saved snapshot',async()=>{
 const proof=await source(),owner='snapshot51-race',db=await open(owner);
 const selected=piece(proof,'tee-race');
 try{
  const pending=atomicSaveGarments24({db,proof,pieces:[selected],ownerId:owner,currentOwner:()=>owner});
  selected.category='Shoes';selected.itemType='Ankle boots';selected.color='Green';
  selected.hint.confidence=1;selected.image='data:image/jpeg;base64,AAAA';
  selected.cropBounds.x=.9;selected.rawExtra='NEVER_PERSIST_SECRET';
  const rows=await pending;
  assert.equal(rows[0].category,'Tops');assert.equal(rows[0].itemType,'T-shirt');
  assert.equal(rows[0].color,'Black');assert.equal(rows[0].image,proof.image);
  assert.equal(rows[0].segmentHint.confidence,.85);
  assert.equal(rows[0].cropBounds.x,.12);
  assert.deepEqual(await read(db),rows);
 }finally{db.close();}
});

test('SNAPSHOT51 owner B remains empty and original #43 atomic invalid-type rejection still rolls back',async()=>{
 const proof=await source(),owner='snapshot51-ownerA',db=await open(owner),other=await open('snapshot51-ownerB');
 try{
  await assert.rejects(atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,
   pieces:[piece(proof,'valid'),piece(proof,'invalid',{
    instanceKey:'seg-9-16-19-50-55-1',category:'Shoes',itemType:'T-shirt',
    onProgress:()=>{}
   })]}),/unreviewed or invalid/);
  assert.deepEqual(await read(db),[]);
  assert.deepEqual(await read(other),[]);
 }finally{db.close();other.close();}
});
