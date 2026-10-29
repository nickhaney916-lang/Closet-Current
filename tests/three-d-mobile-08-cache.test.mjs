import test from 'node:test';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {installVerifiedModelCache,PINNED_MODELS,parsePinnedModelURL} from '../research/three-d-mobile-08/verified-model-cache.mjs';
const origin='http://127.0.0.1:8123';
const file=name=>origin+'/research/three-d-06/models/'+name;
const fixture=()=>{
 const b=new ArrayBuffer(12000),d=new DataView(b);
 d.setUint32(0,0x46546c67,true);d.setUint32(4,2,true);d.setUint32(8,b.byteLength,true);
 return b;
};
test('only two exact same-origin CC0 files can be loaded',()=>{
 assert.equal(Object.keys(PINNED_MODELS).length,2);
 assert.equal(parsePinnedModelURL(file('male-cc0-rigged.glb'),origin).name,'male-cc0-rigged.glb');
 assert.equal(parsePinnedModelURL('https://other.example/research/three-d-06/models/male-cc0-rigged.glb',origin),null);
 assert.throws(()=>parsePinnedModelURL(file('visitor-model.glb'),origin),/Unapproved/);
 assert.equal(parsePinnedModelURL('/research/three-d-06/models/male-cc0-rigged.glb?spoof=1',origin),null);
});
test('verified source buffers coalesce requests, do not cache GPU scene and clear on disposal',async()=>{
 globalThis.location={origin};
 const oldParse=GLTFLoader.prototype.parseAsync;
 const calls={http:0,parse:0};
 GLTFLoader.prototype.parseAsync=async function(bytes){calls.parse++;assert.equal(bytes.byteLength,12000);return {scene:{synthetic:true}};};
 const cache=installVerifiedModelCache({
  fetcher:async()=>{calls.http++;return {ok:true,headers:new Headers({'content-length':'12000'}),arrayBuffer:async()=>fixture()};},
  digest:async()=>PINNED_MODELS['male-cc0-rigged.glb'].sha256
 });
 try{
  const loader=new GLTFLoader();
  await Promise.all([loader.loadAsync(file('male-cc0-rigged.glb')),loader.loadAsync(file('male-cc0-rigged.glb'))]);
  for(let i=0;i<5;i++)await loader.loadAsync(file('male-cc0-rigged.glb'));
  assert.equal(calls.http,1,'seven parses require only one HTTP download');
  assert.equal(calls.parse,7,'parses are independent; live GPU objects are never cached');
  assert.equal(cache.metrics().gpuScenesCached,0);
  assert.equal(cache.metrics().cacheEntries,1);
  assert.equal(cache.metrics().cacheBytes,12000);
  assert.ok(cache.metrics().cacheHits>=5);
  cache.clear();assert.equal(cache.metrics().cacheBytes,0);
  await loader.loadAsync(file('male-cc0-rigged.glb'));
  assert.equal(calls.http,2);
 }finally{cache.dispose();GLTFLoader.prototype.parseAsync=oldParse;delete globalThis.location;}
 assert.equal(cache.metrics().installed,false);
 assert.equal(cache.metrics().cacheBytes,0);
});
test('bad pinned hash fails closed, is never cached, and next valid retry can recover',async()=>{
 globalThis.location={origin};
 const oldParse=GLTFLoader.prototype.parseAsync;
 GLTFLoader.prototype.parseAsync=async()=>({scene:{}});
 let attempts=0;
 const cache=installVerifiedModelCache({
  fetcher:async()=>({ok:true,headers:new Headers(),arrayBuffer:async()=>fixture()}),
  digest:async()=>++attempts===1?'f'.repeat(64):PINNED_MODELS['female-cc0-rigged.glb'].sha256
 });
 try{
  const loader=new GLTFLoader();
  await assert.rejects(loader.loadAsync(file('female-cc0-rigged.glb')),/SHA mismatch/);
  assert.equal(cache.metrics().cacheEntries,0);
  assert.equal(cache.metrics().refusals,1);
  await loader.loadAsync(file('female-cc0-rigged.glb'));
  assert.equal(cache.metrics().cacheEntries,1);
  assert.equal(attempts,2);
 }finally{cache.dispose();GLTFLoader.prototype.parseAsync=oldParse;delete globalThis.location;}
});
