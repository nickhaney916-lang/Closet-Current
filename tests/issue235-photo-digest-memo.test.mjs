import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {memoizeExactImageEncodes} from '../scripts/issue235/photo-digest-memo.mjs';
import BackupEngine from '../public/cloud-backup-engine.js';
const photo=txt=>'data:image/jpeg;base64,'+Buffer.from([255,216,...Buffer.from(txt),255,217]).toString('base64');
const digest=x=>createHash('sha256').update(Buffer.from(x.split(',')[1],'base64')).digest('hex');
test('identical JPEG byte references reuse the same hash within a single authorized snapshot',async()=>{
 let count=0;
 const memo=memoizeExactImageEncodes(async x=>{count++;return 'closet-photo:owner/'+digest(x)+'.jpg';});
 const a=photo('same'),b=photo('different');
 const source={schemaVersion:1,items:[
  {id:'one',image:a,originalPhoto:{image:a}},{id:'two',image:b,originalPhoto:{image:a}}],
  state:{'outfit-board':{id:'outfit-board',current:{slots:{top:'one'}},saved:[]}}};
 const baseline=await BackupEngine.mapImages(source,async x=>'closet-photo:owner/'+digest(x)+'.jpg');
 const result=await BackupEngine.mapImages(source,memo.mapImage);
 assert.deepEqual(result,baseline);
 assert.equal(count,2);assert.deepEqual(memo.stats(),{uniqueCalls:2,hits:2,retainedEntries:2,maxEntries:64});
 assert.equal(source.items[0].image,a);
 memo.clear();assert.equal(memo.stats().retainedEntries,0);
});
test('does not combine modified originals, different accounts, or hash paths',async()=>{
 const a=photo('before'),b=photo('after');
 const encoder=owner=>memoizeExactImageEncodes(async x=>'closet-photo:'+owner+'/'+digest(x)+'.jpg',{maxEntries:2});
 const A=encoder('a'),B=encoder('b');
 const [old,changed,other]=await Promise.all([A.mapImage(a),A.mapImage(b),B.mapImage(a)]);
 assert.notEqual(old,changed);assert.notEqual(old,other);
 assert.equal(A.stats().uniqueCalls,2);assert.equal(B.stats().uniqueCalls,1);
});
test('maxEntries bounds retained raw strings, evictions do not corrupt results',async()=>{
 const memo=memoizeExactImageEncodes(async x=>digest(x),{maxEntries:2});
 const photos=[photo('one'),photo('two'),photo('three')];
 for(const p of photos)assert.equal(await memo.mapImage(p),digest(p));
 assert.equal(memo.stats().retainedEntries,2);
 assert.equal(await memo.mapImage(photos[0]),digest(photos[0]));
 assert.equal(memo.stats().uniqueCalls,4);
});
test('concurrent references share in-flight hashes without duplicate work',async()=>{
 let invocations=0;
 const memo=memoizeExactImageEncodes(async x=>{invocations++;await Promise.resolve();return digest(x);});
 const [a,b,c]=await Promise.all([memo.mapImage(photo('x')),memo.mapImage(photo('x')),memo.mapImage(photo('x'))]);
 assert.equal(a,b);assert.equal(a,c);assert.equal(invocations,1);
 assert.equal(memo.stats().hits,2);
});
test('failure never caches an erroneous image or returns stale output',async()=>{
 let fail=true;
 const memo=memoizeExactImageEncodes(async x=>{if(fail){fail=false;throw Error('SHA provider temporarily unavailable');}return digest(x);});
 const p=photo('test');
 await assert.rejects(memo.mapImage(p),/SHA provider/);
 assert.equal(memo.stats().retainedEntries,0);
 assert.equal(await memo.mapImage(p),digest(p));
 assert.equal(memo.stats().uniqueCalls,2);
});
test('never processes foreign URLs, empty data, or non-JPEG images',async()=>{
 const memo=memoizeExactImageEncodes(async x=>digest(x));
 for(const invalid of ['','https://example.com/image.jpg','data:image/png;base64,AA==',null])
  await assert.rejects(memo.mapImage(invalid),/JPEG/);
 assert.throws(()=>memoizeExactImageEncodes(null),/callback/);
 assert.throws(()=>memoizeExactImageEncodes(x=>x,{maxEntries:1000}),/bounded/);
});
