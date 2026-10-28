import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
import {SAMPLES,FALLBACK,cropFromAlpha,readVerifiedAsset,loadLicensedCutout}
 from '../research/three-d-02/reviewed-texture.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const rgba=(w=80,h=96,opaque=false)=>{
 const out=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const a=(y*w+x)*4;
  out[a]=120;out[a+1]=63;out[a+2]=89;
  out[a+3]=opaque||x>9&&x<w-10&&y>7&&y<h-9?255:0;
 }
 return out;
};
test('Only exact existing licensed shirt/dress cutouts are modeled; pants honestly fall back',()=>{
 assert.deepEqual(Object.keys(SAMPLES),['commons-0003','commons-0053']);
 assert.equal(SAMPLES['commons-0003'].type,'shirt');
 assert.equal(SAMPLES['commons-0053'].slot,'dress');
 assert.equal(FALLBACK.type,'pants');
 assert.equal(FALLBACK.releaseAuthorized,false);
});
test('Source alpha bounds produce a bounded UV crop WITHOUT changing any original RGB',()=>{
 const a=rgba(),before=Buffer.from(a),x=cropFromAlpha({data:a,width:80,height:96});
 assert.ok(x.visiblePixels>2000);
 assert.ok(x.cropRect.every(v=>v>=0&&v<=1));
 assert.ok(x.cropRect[2]>.1&&x.cropRect[3]>.1);
 assert.notDeepEqual(x.cropRect,[0,0,1,1]);
 assert.deepEqual(Buffer.from(a),before,'Alpha geometry inspection is read-only');
});
test('Empty alpha, impossible frames or tiny source content refused',()=>{
 for(const x of [
  {data:rgba().fill(0),width:80,height:96},
  {data:rgba(),width:80,height:95},
  {data:rgba(),width:0,height:96},
  {data:new Uint8ClampedArray(80*96*4),width:80,height:96}
 ])assert.throws(()=>cropFromAlpha(x));
});
test('Exact file SHA-256 is required before any candidate enters GPU',async()=>{
 const data=new Uint8Array(400).fill(24);
 const hash=createHash('sha256').update(data).digest('hex');
 const good=()=>({ok:true,arrayBuffer:async()=>data.buffer.slice(0)});
 const got=await readVerifiedAsset('/benchmark/work47/assets/commons-0003.png',hash,{fetcher:good});
 assert.equal(got.type,'image/png');
 assert.equal(got.size,400);
 await assert.rejects(readVerifiedAsset('/benchmark/work47/assets/commons-0003.png','a'.repeat(64),{fetcher:good}),/hash mismatch/);
 for(const path of ['/benchmark/work47/assets/../../public/auth.js',
  'https://external.invalid/file.png','/benchmark/work50/assets/commons-0003.png'])
  await assert.rejects(readVerifiedAsset(path,hash,{fetcher:good}),/Unexpected research-only asset/);
 await assert.rejects(readVerifiedAsset('/benchmark/work47/assets/commons-0003.png',hash,{fetcher:async()=>({ok:false})}),/unavailable/);
});
test('Unconfirmed or unsupported cutouts never enter the secure preview adapter',async()=>{
 await assert.rejects(loadLicensedCutout('commons-0003',{reviewConfirmed:false}),/Explicit provisional mask review/);
 await assert.rejects(loadLicensedCutout('commons-0021',{reviewConfirmed:true}),/Explicit provisional mask review/);
 await assert.rejects(loadLicensedCutout('unknown',{reviewConfirmed:true}),/Explicit provisional mask review/);
});
test('Licensed source attribution and existence pinned; no new private files or external remote loading',async()=>{
 const locked=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 for(const id of ['commons-0003','commons-0053','commons-0021']){
  const item=locked.find(r=>r.id===id);
  assert.equal(item?.verified,true);
  assert.match(item.sha256,/^[a-f0-9]{64}$/);
  assert.ok(item.attribution.license);
 }
 const [bridge,demo,html]=await Promise.all([
  readFile('research/three-d-02/reviewed-texture.mjs','utf8'),
  readFile('research/three-d-02/demo.mjs','utf8'),
  readFile('research/three-d-02/index.html','utf8')
 ]);
 for(const src of [bridge,demo,html]){
  assert.doesNotMatch(src,/supabase\.co|localStorage|indexedDB|navigator\.sendBeacon|camera\.getUserMedia|openai\.com|threejs\.org|unpkg\.com|jsdelivr\.net/);
 }
 assert.match(demo,/loadLicensedCutout/);
 assert.match(demo,/event\.isTrusted/);
 assert.match(demo,/viewer\.setPhoto\(loaded\.cutout/);
 assert.match(demo,/original-photo fallback/i);
 assert.match(bridge,/adaptGarmentFor3D/);
 assert.match(bridge,/readVerifiedAsset/);
 assert.match(html,/NOT passed human visual acceptance/);
 assert.doesNotMatch(html,/<script[^>]+https?:/);
});
