import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {
 P67_FASHION_MODEL,P67_FASHION_REVISION,P67_LABELS
} from '../scripts/parallel67-independent-siglip-scoring.mjs';
import {
 p67PackageTextEmbeddings,loadP67TextEmbeddings,p67TextLabels,P67_TEXT_SIZE,p67Digest
} from '../scripts/parallel67-precompute-fashion-text-03.mjs';
import {compareVisionOnlyP67_03} from '../scripts/parallel67-compare-vision-only-03.mjs';

const vals=()=>new Float32Array(P67_LABELS.length*768).fill(.125);
async function writePackage(t){
 const folder=await mkdtemp(join(tmpdir(),'p67-03-frozen-'));
 t.after(async()=>rm(folder,{recursive:true,force:true}));
 const {bytes,metadata}=p67PackageTextEmbeddings(vals());
 await writeFile(join(folder,'fashion-text-vectors.bin'),bytes);
 await writeFile(join(folder,'fashion-text-manifest.json'),JSON.stringify(metadata));
 return {folder,bytes,metadata};
}
test('P67-03 frozen 47 x 768 labels, text SHA and model rev are reproducible and photo free',()=>{
 assert.equal(P67_LABELS.length,47);
 assert.equal(p67TextLabels().length,47);
 assert.equal(P67_TEXT_SIZE,47*768*4);
 const first=p67PackageTextEmbeddings(vals()),second=p67PackageTextEmbeddings(vals());
 assert.equal(first.bytes.length,P67_TEXT_SIZE);
 assert.equal(first.metadata.sha256,second.metadata.sha256);
 assert.equal(first.metadata.labelSha256,p67Digest(JSON.stringify(p67TextLabels())));
 assert.equal(first.metadata.originalPhotoCount,0);
 assert.equal(first.metadata.ownerPhotoBytes,0);
 assert.equal(first.metadata.automaticSaveAllowed,false);
 assert.equal(first.metadata.revision,P67_FASHION_REVISION);
 assert.ok(!JSON.stringify(first.metadata).includes('data:image/jpeg'));
});
test('P67-03 read frozen q8 text vectors exactly; original float bytes unchanged',async t=>{
 const {folder,bytes,metadata}=await writePackage(t);
 const loaded=await loadP67TextEmbeddings(folder);
 assert.equal(loaded.vectors.length,47*768);
 assert.equal(loaded.metadata.sha256,metadata.sha256);
 assert.equal(Buffer.compare(bytes,Buffer.from(loaded.vectors.buffer)),0);
});
test('P67-03 fail closed on unauthorized text model, revision and tensor shape',()=>{
 for(const [data,opts] of [
  [new Float32Array(10),{}],
  [vals(),{model:'PRIVATE_OWNER'}],
  [vals(),{revision:'main'}],
  [vals(),{revision:'0'.repeat(40)}]
 ]){
  assert.throws(()=>p67PackageTextEmbeddings(data,opts),/P67-03:/);
 }
 const corrupt=vals();corrupt[0]=Number.NaN;
 assert.throws(()=>p67PackageTextEmbeddings(corrupt),/P67-03:/);
});
test('P67-03 prevent tampered text bytes and forged source/label manifests',async t=>{
 const {folder,bytes,metadata}=await writePackage(t);
 const manifest=join(folder,'fashion-text-manifest.json'),binary=join(folder,'fashion-text-vectors.bin');
 for(const mutate of [
  d=>{d.model='PRIVATE_OWNER'},
  d=>{d.revision='main'},
  d=>{d.labels=48},
  d=>{d.labelSha256='0'.repeat(64)},
  d=>{d.byteLength=100},
  d=>{d.sha256='0'.repeat(64)},
  d=>{d.originalPhotoCount=1},
  d=>{d.automaticSaveAllowed=true}
 ]){
  const change=structuredClone(metadata);mutate(change);
  await writeFile(manifest,JSON.stringify(change));
  await assert.rejects(loadP67TextEmbeddings(folder),/P67-03:/);
 }
 await writeFile(manifest,JSON.stringify(metadata));
 await writeFile(binary,Buffer.from(bytes.subarray(0,bytes.length-4)));
 await assert.rejects(loadP67TextEmbeddings(folder),/P67-03:/);
 const changed=Buffer.from(bytes);changed[7]^=1;
 await writeFile(binary,changed);
 await assert.rejects(loadP67TextEmbeddings(folder),/P67-03:/);
});
function compareFixture(){
 const rows=Array.from({length:16},(_,i)=>({
  id:'commons-'+String(i+1).padStart(4,'0'),
  truthCategory:i>=13?'Uncategorized':'Tops',
  truthSubtype:i>=13?'Unknown':'T-shirt',
  predictedCategory:i>=13?'Tops':'Tops',
  predictedSubtype:i>=13?'Tunic':'T-shirt',
  categoryTop1Correct:i<13,subtypeTop1Correct:i<13,
  categoryOnly:i>=13,predictedScore:.54,scoreGap:.05,error:null,
 }));
 const obj={
  schema:'closet-current-parallel67-foreign-siglip-developer-exposed-v1',
  model:P67_FASHION_MODEL,revision:P67_FASHION_REVISION,
  originalCount:16,garments:13,negatives:3,
  automaticSaveAdmissionAllowed:false,developerExposedNotBlind:true,
  truthFileSha256:'a'.repeat(64),sourceIndexSha256:'b'.repeat(64),
  runtimeErrors:0,categoryTop1:13,broadSubtypeTop1:13,negativeTop1:0,
  modelLoadMs:3900,rows
 };
 const optimized=structuredClone(obj);
 optimized.modelLoadMs=2300;optimized.textModelLoadedAtInference=false;
 optimized.frozenTextSha256='c'.repeat(64);
 optimized.frozenTextByteLength=P67_TEXT_SIZE;
 return [obj,optimized];
}
test('P67-03 vision-only model must preserve all 16 top rankings + numeric similarity and disclose inference mode',()=>{
 const [orig,next]=compareFixture();
 const result=compareVisionOnlyP67_03(orig,next);
 assert.equal(result.sameTopRankBothPaths,16);
 assert.equal(result.nativeTextModelLoadedAtInference,false);
 assert.equal(result.visionOnlyCandidate.subtypeTop1,13);
 assert.equal(result.automaticSavePermitted,false);
 assert.equal(result.rows.length,16);
 assert.equal(result.notBlind,true);
});
test('P67-03 never hide changed subtype, source, probability, errors or a new auto-save admission',()=>{
 const mutation=[
  ([,b])=>{b.rows.pop();},
  ([,b])=>{b.rows[0].id='PRIVATE_OWNER'},
  ([,b])=>{b.rows[0].predictedSubtype='Sweatshirt';},
  ([,b])=>{b.rows[0].predictedScore+=.002;},
  ([,b])=>{b.rows[0].scoreGap+=.005;},
  ([,b])=>{b.rows[1].error='runtime';},
  ([,b])=>{b.sourceIndexSha256='d'.repeat(64);},
  ([,b])=>{b.textModelLoadedAtInference=true;},
  ([,b])=>{b.automaticSaveAdmissionAllowed=true;},
  ([,b])=>{b.frozenTextSha256='PRIVATE_DATA';},
  ([,b])=>{b.frozenTextByteLength=200;},
  ([b])=>{b.broadSubtypeTop1=2;},
  ([,b])=>{b.categoryTop1=9;}
 ];
 for(const change of mutation){
  const input=compareFixture();change(input);
  assert.throws(()=>compareVisionOnlyP67_03(...input),/P67-03:/);
 }
});
