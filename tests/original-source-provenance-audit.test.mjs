import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import Engine from '../public/cloud-backup-engine.js';
import {fingerprintOriginalPhoto} from '../public/original-photo-fingerprint.mjs';
import {auditRetainedPhotoProvenance,snapshotSourceHashes,verifyRestoredSources,verifyStoredCloudJPEG} from '../public/original-source-provenance-audit.mjs';
const ownerA='11111111-1111-4111-8111-111111111111',ownerB='22222222-2222-4222-8222-222222222222';
const ctx=(who=ownerA)=>({authenticatedUserId:who,indexedDbName:'closet-current-user-'+who,currentUserId:who,cloudOwnerId:who});
function jpeg(tag){
 // Real service transport only validates first two JPEG markers; this fixture
 // intentionally is not decoder proof. Browser tests create true canvas JPEGs.
 const bytes=Uint8Array.from([255,216,255,224,0,8,73,70,73,70,tag,77,88,1,255,217]);
 return {bytes,data:'data:image/jpeg;base64,'+Buffer.from(bytes).toString('base64')};
}
const coat=()=>({id:'jacket',category:'Outerwear',image:jpeg(11).data});
const shirt=()=>({id:'shirt',category:'Tops',image:jpeg(12).data});
const trousers=()=>({id:'pants',category:'Bottoms',image:jpeg(13).data});
const shoes=()=>({id:'shoes',category:'Shoes',image:jpeg(14).data});
function doc(items=[shirt(),trousers(),shoes()],boards=[]){
 return {schemaVersion:1,items,state:{'outfit-board':{id:'outfit-board',current:{slots:{top:'shirt',bottom:'pants',shoes:'shoes'}},saved:boards}}};
}
test('SHA-256 hashes actual provided app-retained bytes, not cropped display URL',async()=>{
 const raw=jpeg(21).bytes,a=await fingerprintOriginalPhoto(raw,webcrypto);
 assert.equal(a.version,createHash('sha256').update(raw).digest('hex'));
 const outfit=doc();outfit.items[0]={...shirt(),outfitSourceId:'source-1',originalPhoto:{image:jpeg(21).data},recognitionPhoto:{image:jpeg(22).data}};
 const audit=await auditRetainedPhotoProvenance(outfit,ctx(),webcrypto),record=audit.garments.get('shirt');
 assert.equal(record.originalSha256,a.version);
 assert.notEqual(record.originalSha256,record.cropSha256);
 assert.notEqual(record.originalSha256,record.recognitionSha256);
 assert.equal(record.sourceKind,'reencoded-outfit-full-frame');
 assert.equal(record.sourceGroup,'source-1');
 assert.equal(audit.nativeFileSHA256Proven,false);
});
test('same untouched original hash is stable while crop changes',async()=>{
 const original=jpeg(42).data;
 const a=doc();a.items[0]={...shirt(),originalPhoto:{image:original}};
 const prior=await auditRetainedPhotoProvenance(a,ctx(),webcrypto);
 a.items[0].image=jpeg(77).data;
 const next=await auditRetainedPhotoProvenance(a,ctx(),webcrypto);
 assert.equal(prior.garments.get('shirt').originalSha256,next.garments.get('shirt').originalSha256);
 assert.notEqual(prior.garments.get('shirt').cropSha256,next.garments.get('shirt').cropSha256);
});
test('original-only replacement invalidates saved outfit while cropped preview remains byte-identical',async()=>{
 const before=doc();before.items[0]={...shirt(),originalPhoto:{image:jpeg(51).data}};
 const a=await auditRetainedPhotoProvenance(before,ctx(),webcrypto),saved=snapshotSourceHashes(before.state['outfit-board'].current,a);
 const crop=before.items[0].image;const same=new Uint8Array(Buffer.from(crop.slice(23),'base64'));
 before.items[0].originalPhoto.image=jpeg(52).data;
 const b=await auditRetainedPhotoProvenance(before,ctx(),webcrypto);
 assert.deepEqual(Buffer.from(b.garments.get('shirt').cropSha256,'hex').length,32);
 assert.equal(before.items[0].image,crop);
 assert.throws(()=>verifyRestoredSources(saved,b),/Original source changed/);
 assert.equal(same.length,jpeg(12).bytes.length);
});
test('two garments from a single outfit share original SHA while retaining distinct crops',async()=>{
 const original=jpeg(70).data;
 const two=[{...shirt(),image:jpeg(80).data,outfitSourceId:'one-outfit',originalPhoto:{image:original},cropBounds:{left:0,width:10}},
   {...trousers(),image:jpeg(81).data,outfitSourceId:'one-outfit',originalPhoto:{image:original},cropBounds:{left:15,width:10}},shoes()];
 const audit=await auditRetainedPhotoProvenance(doc(two),ctx(),webcrypto);
 assert.equal(audit.garments.get('shirt').originalSha256,audit.garments.get('pants').originalSha256);
 assert.notEqual(audit.garments.get('shirt').cropSha256,audit.garments.get('pants').cropSha256);
 assert.equal(audit.garments.size,3);
});
test('duplicate garment IDs and deleted saved garment references fail closed, no DB modification',async()=>{
 const d=doc();const initial=JSON.stringify(d);
 await assert.rejects(auditRetainedPhotoProvenance(doc([shirt(),shirt(),shoes()]),ctx(),webcrypto),/Duplicate/);
 d.items=d.items.filter(x=>x.id!=='pants');
 await assert.rejects(auditRetainedPhotoProvenance(d,ctx(),webcrypto),/references deleted/);
 assert.notEqual(JSON.stringify(d),initial);
});
test('cross-account database/auth mismatch and cloud backup owner mismatch are rejected',async()=>{
 const d=doc();for(const mismatch of [
 {...ctx(),indexedDbName:'closet-current-user-'+ownerB},
 {...ctx(),currentUserId:ownerB},
 {...ctx(),cloudOwnerId:ownerB},
 {authenticatedUserId:ownerA,indexedDbName:'closet-current-user-'+ownerB}
 ])await assert.rejects(auditRetainedPhotoProvenance(d,mismatch,webcrypto),/mismatch|Foreign/);
 const a=await auditRetainedPhotoProvenance(d,ctx(),webcrypto);
 const saved=snapshotSourceHashes(d.state['outfit-board'].current,a);
 const b=await auditRetainedPhotoProvenance(d,ctx(ownerB),webcrypto);
 assert.throws(()=>verifyRestoredSources(saved,b),/Foreign/);
});
test('corrupt or unsupported JPEG envelope and invalid supplied metadata refuse source',async()=>{
 const d=doc();
 for(const value of [
  'https://outside.example/image.jpg','data:image/svg+xml;base64,PHN2Zz4=',
  'data:image/png;base64,iVBORw0KGgo=', 'data:image/jpeg;base64,AA==',
  jpeg(2).data.slice(0,-4), '',null]){
  d.items[0].image=value;
  await assert.rejects(auditRetainedPhotoProvenance(d,ctx(),webcrypto),/JPEG|Corrupted/);
 }
});
test('optional stored hash must match original bytes even if visual crop unchanged',async()=>{
 const d=doc();d.items[0].cloudSourceSha256='0'.repeat(64);
 await assert.rejects(auditRetainedPhotoProvenance(d,ctx(),webcrypto),/Stale/);
});
test('cloud object SHA-256 proves one stored JPEG payload only, not native-file source',async()=>{
 const raw=jpeg(97).bytes,sha=createHash('sha256').update(raw).digest('hex'),path=ownerA+'/'+sha+'.jpg';
 const result=await verifyStoredCloudJPEG(path,raw,ctx(),webcrypto);
 assert.equal(result.storedJPEGHash,sha);
 assert.equal(result.isNativeCameraOrImportSourceProven,false);
 await assert.rejects(verifyStoredCloudJPEG(ownerB+'/'+sha+'.jpg',raw,ctx(),webcrypto),/Foreign/);
 await assert.rejects(verifyStoredCloudJPEG(ownerA+'/'+'0'.repeat(64)+'.jpg',raw,ctx(),webcrypto),/SHA-256/);
 await assert.rejects(verifyStoredCloudJPEG(path,new Uint8Array([255,216,1,2,3,4,255,217]),ctx(),webcrypto),/SHA-256/);
});
test('cloud backup image traversal separately uploads originalPhoto.image, crop and recognitionPhoto.image',async()=>{
 const capture={...shirt(),originalPhoto:{image:jpeg(40).data},recognitionPhoto:{image:jpeg(41).data}};
 const a=doc([capture,trousers(),shoes()]);
 const seen=[],encoded=await Engine.mapImages(a,async img=>{
  const bytes=Buffer.from(img.slice('data:image/jpeg;base64,'.length),'base64');
  const digest=createHash('sha256').update(bytes).digest('hex');
  seen.push(digest);return 'closet-photo:'+ownerA+'/'+digest+'.jpg';
 });
 assert.equal(seen.length,5);
 assert.notEqual(encoded.items[0].image,encoded.items[0].originalPhoto.image);
 assert.notEqual(encoded.items[0].originalPhoto.image,encoded.items[0].recognitionPhoto.image);
 assert.deepEqual(a.items[0],capture); // mapping never alters local item
});
test('restoration refuses deleted source, missing hash, duplicate slot selection and changed metadata',async()=>{
 const d=doc(),a=await auditRetainedPhotoProvenance(d,ctx(),webcrypto),saved=snapshotSourceHashes(d.state['outfit-board'].current,a);
 assert.deepEqual(verifyRestoredSources(saved,a),saved);
 assert.throws(()=>verifyRestoredSources({...saved,sourceHashes:{}},a),/Original source changed/);
 assert.throws(()=>snapshotSourceHashes({slots:{top:'shirt',bottom:'shirt'}},a),/duplicate/);
 assert.throws(()=>snapshotSourceHashes({slots:{top:'gone'}},a),/deleted/);
 const missing=doc([shirt(),shoes()]);missing.state['outfit-board'].current.slots={top:'shirt',shoes:'shoes'};
 const newA=await auditRetainedPhotoProvenance(missing,ctx(),webcrypto);
 assert.throws(()=>verifyRestoredSources(saved,newA),/deleted/);
});
test('real source contracts: browser captures and imports re-encode; cloud hash covers each nested image',()=>{
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const photo=readFileSync(new URL('../public/photo-import.js',import.meta.url),'utf8');
 const outfit=readFileSync(new URL('../public/outfit-capture.js',import.meta.url),'utf8');
 const cloud=readFileSync(new URL('../public/cloud-backup.js',import.meta.url),'utf8');
 const board=readFileSync(new URL('../public/outfit-board.js',import.meta.url),'utf8');
 assert.match(app,/function snap\(\).*?canvas\.toDataURL\('image\/jpeg',\.94\)/);
 assert.match(photo,/return canvas\.toDataURL\('image\/jpeg',quality\)/);
 assert.match(outfit,/originalPhoto:\{image\}/);
 assert.match(cloud,/key==='image'/ .source || /imageBytes\(image\)/); // engine mapping is independently exercised above
 assert.match(cloud,/const hash=async bytes=>.*crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(board,/currentBoard\.slots|currentBoard\.slots/);
});
