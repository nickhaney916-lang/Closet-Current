import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {snapshotConfirmations34} from '../research/multi-garment-capture-01/review-save-finality-34.mjs';
import {atomicSaveGarments24} from '../research/multi-garment-capture-01/atomic-group.mjs';

if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const sha=buf=>createHash('sha256').update(buf).digest('hex');
const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
const sourceSHA256=sha(bytes);
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const proof={sourceSHA256,sourceHashVerified:true,image,
 originalPhoto:{image,sha256:sourceSHA256,width:800,height:900,origin:'licensed-original-fixture'}};
const schema={types:{Tops:['T-shirt','Button-down shirt'],Bottoms:['Jeans']}};
const basic=(id='safe78')=>({
 id,instanceKey:'manual-120-110-280-320',manual:true,cropReviewed:true,confirmed:true,
 category:'Tops',itemType:'Button-down shirt',color:'White',
 cropBounds:{x:.12,y:.11,width:.28,height:.32},image,
 hint:{categories:['Tops'],types:['Button-down shirt'],confidence:.91,clipped:false}
});
const openDb=owner=>new Promise((resolve,reject)=>{
 const req=indexedDB.open('closet-current-user-'+owner,1);
 req.onupgradeneeded=()=>req.result.createObjectStore('items',{keyPath:'id'});
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
const rows=db=>new Promise((resolve,reject)=>{
 const req=db.transaction('items').objectStore('items').getAll();
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
test('SNAPSHOT78 snapshot first allowlists confirmed facts before clone even with uncloneable functions and giant detector metadata',()=>{
 const original=basic();
 original.extraWorkerPayload={credential:'never-save',frames:new Uint8Array(1024*1024),uncloneable:()=>{}};
 original.uncloneable=()=>{};
 original.name=()=>{throw Error('not a reviewed name')};
 original.hint.rawMask={uncloneable:()=>{},secret:'private'};
 const {references,snapshots}=snapshotConfirmations34([original],schema,proof);
 assert.equal(references[0],original);
 assert.equal(snapshots.length,1);
 const s=snapshots[0];
 assert.deepEqual([s.category,s.itemType,s.color,s.confirmed,s.cropReviewed],
  ['Tops','Button-down shirt','White',true,true]);
 assert.equal(s.name,undefined,'Arbitrary callable name cannot poison structuredClone');
 assert.equal(s.uncloneable,undefined);
 assert.equal(s.extraWorkerPayload,undefined);
 assert.equal(s.hint.rawMask,undefined);
 assert.deepEqual(s.hint,{categories:['Tops'],types:['Button-down shirt'],clipped:false,confidence:.91});
 assert.ok(Object.keys(s).length<20);
});
test('SNAPSHOT78 bounded human/AI snapshot remains immutable across later color/crop/model edits',()=>{
 const original=basic();
 original.hint.randomField={junk:()=>{}};
 original.name='Custom white blouse';
 original.recognitionSuggestion42={
  source:'local-fashionclip',category:'Tops',itemType:'Button-down shirt',
  color:'White',colorSource:'recognition',
  inputBinding49:{hashAlgorithm:'SHA-256',sourceSHA256,
   cropSHA256:sourceSHA256,requestedAssetTag:'local-research-version'},
  noncloneable:()=>{},privateRaw:{tokens:['never-store']},
  colorReview46:{source:'reviewed-crop-pixels',needsConfirmation:true,
   primary:'White',secondary:'Gray',untrustedRaw:()=>{}}
 };
 const {snapshots}=snapshotConfirmations34([original],schema,proof);
 const snap=snapshots[0];
 assert.equal(snap.name,'Custom white blouse');
 assert.equal(snap.recognitionSuggestion42.source,'local-fashionclip');
 assert.equal(snap.recognitionSuggestion42.inputBinding49.sourceSHA256,sourceSHA256);
 assert.equal(snap.recognitionSuggestion42.inputBinding49.cropSHA256,sourceSHA256);
 assert.equal(snap.recognitionSuggestion42.privateRaw,undefined);
 assert.equal(snap.recognitionSuggestion42.noncloneable,undefined);
 assert.equal(snap.recognitionSuggestion42.colorReview46.primary,'White');
 assert.equal(snap.recognitionSuggestion42.colorReview46.untrustedRaw,undefined);
 original.color='Green';
 original.cropBounds.x=.73;
 original.image='untrusted-late-image';
 original.name='changed afterward';
 original.recognitionSuggestion42.color='Black';
 original.hint.categories[0]='Shoes';
 assert.equal(snap.color,'White');
 assert.equal(snap.cropBounds.x,.12);
 assert.equal(snap.image,image);
 assert.equal(snap.name,'Custom white blouse');
 assert.equal(snap.recognitionSuggestion42.color,'White');
 assert.deepEqual(snap.hint.categories,['Tops']);
});
test('SNAPSHOT78 actual owner-private atomic store succeeds with noncloneable untrusted review extras and valid AI provenance',async()=>{
 const owner='snapshot78-owner-A',db=await openDb(owner);
 try{
  const original=basic();
  original.name=()=>{};
  original.privateWorkerToken={token:'DO-NOT-STORE',invalid:()=>{}};
  original.hint.raw={invalid:()=>{},data:new Uint8Array(400000)};
  original.recognitionSuggestion42={
   source:'local-fashionclip',category:'Tops',itemType:'Button-down shirt',color:'White',
   inputBinding49:{hashAlgorithm:'SHA-256',sourceSHA256,cropSHA256:sourceSHA256,
    requestedAssetTag:'research-asset-78'},extraneous:{callback:()=>{}}
  };
  const {snapshots}=snapshotConfirmations34([original],schema,proof);
  const saved=await atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,pieces:snapshots});
  assert.equal(saved.length,1);
  const actual=await rows(db);
  assert.equal(actual.length,1);
  assert.deepEqual([actual[0].category,actual[0].itemType,actual[0].color],['Tops','Button-down shirt','White']);
  assert.equal(actual[0].ownerId,owner);
  assert.equal(actual[0].originalPhoto.sha256,sourceSHA256);
  assert.equal(actual[0].recognitionSuggestion42.inputBinding49.cropSHA256,sourceSHA256);
  assert.equal(actual[0].privateWorkerToken,undefined);
  assert.equal(actual[0].hint?.raw,undefined);
  assert.equal(actual[0].recognitionSuggestion42.extraneous,undefined);
  assert.equal(actual[0].name,'White Button-down shirt');
 }finally{db.close()}
});
test('SNAPSHOT78 non-selected untrusted proposals never enter snapshot or private save',()=>{
 const selected=basic('valid'),other={...basic('ignored'),id:'ignored',confirmed:false,
  cropBounds:{x:.8,y:0,width:.5,height:1},color:'not reviewed',uncloneable:()=>{}};
 const s=snapshotConfirmations34([selected,other],schema,proof);
 assert.equal(s.references.length,1);
 assert.equal(s.snapshots.length,1);
 assert.equal(s.snapshots[0].id,'valid');
 assert.ok(!s.snapshots.some(x=>x.id==='ignored'));
});
test('SNAPSHOT78 missing human classification, crop and duplicated identity remain blocked before sanitization',()=>{
 for(const bad of [
  {...basic(),confirmed:false}, {...basic(),category:'Uncategorized'},
  {...basic(),color:'unknown'}, {...basic(),cropReviewed:false},
  {...basic(),cropBounds:{x:.89,y:.1,width:.4,height:.4}}
 ])assert.throws(()=>snapshotConfirmations34([bad],schema,proof),/Select at least|Confirm/);
 assert.throws(()=>snapshotConfirmations34([basic(),{...basic(),id:'new'}],schema,proof),/Duplicate/);
});
test('SNAPSHOT78 source and proof verification must survive the review-to-atomic boundary',()=>{
 const rev=readFileSync('research/multi-garment-capture-01/review-save-finality-34.mjs','utf8');
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const record=readFileSync('research/multi-garment-capture-01/atomic-group.mjs','utf8');
 assert.match(rev,/structuredClone\(minimalPieceSnapshot51\(piece,proof\)\)/);
 assert.match(ui,/snapshotConfirmations34\(state\.pieces,schema,proof\)/);
 assert.match(record,/if\(!await verifyStoredCanonical\(proof\)\)/);
 assert.match(record,/const piecesAtCall=pieces\.map\(piece=>structuredClone\(minimalPieceSnapshot51\(piece,proof\)\)\)/);
});
test('SNAPSHOT78 real native browser module and original-JPEG owner-private regression must be exercised',()=>{
 const script=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const token of [
  "const snapshot78=process.env.SNAPSHOT78==='1'",
  '02a-uncloneable-review-metadata-accepted-safely-all',
  "reviewSnapshotSanitized78:snapshot78",
  "snapshotConfirmations34([piece],{types:{Tops:['Button-down shirt']}},{sourceSHA256:sourceHash})"
 ])assert.ok(script.includes(token),'Missing original-JPEG browser protection '+token);
});
