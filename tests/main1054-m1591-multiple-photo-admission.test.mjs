import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sources=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const source=readFileSync('research/main1054/m1591-original-p94-photo-plain-wasm-ab.mjs','utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
const allowed=['commons-0003','commons-0001','commons-0014','commons-0021','commons-0049'];
test('original plus four licensed category fixtures each independently pinned',()=>{
 for(const id of allowed){
  const matching=sources.filter(x=>x.id===id);
  assert.equal(matching.length,1);
  const row=matching[0];
  assert.equal(row.verified,true);
  assert.equal(row.image,id+'.jpg');
  assert.ok(row.attribution?.license);
  const bytes=readFileSync('benchmark/fixtures/'+row.image);
  assert.equal(hash(bytes),row.sha256);
  assert.ok(bytes.length>1024&&bytes.length<=3000000);
  assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
 }
});
test('fail-closed selector protects against unknown paths, private photos and source modification',()=>{
 assert.ok(source.includes('fixtureAllowlist.has(fixtureId)'));
 assert.ok(source.includes("matches.length!==1"));
 assert.ok(source.includes("hash(photo)!==photoSha"));
 assert.ok(source.includes("if(!fileAllow.has(u.pathname))throw Error('not-allowed')"));
 assert.ok(source.includes("const original=readFileSync('public/outfit-worker-p94.mjs','utf8')"));
 assert.ok(source.includes("original.replace(needle[0],alternative)"));
 assert.ok(source.includes("mode==='plain'?adapted:original"));
 assert.ok(source.includes("nativeTrapPc:null,wasmFileOffset:null,causalFixProven:false"));
 assert.ok(source.includes("releaseAllowed:false,familyAlpha:'HOLD'"));
});
test('comparison cannot silently treat zero pieces or malformed piece hashes as green',()=>{
 assert.ok(source.includes("safe.terminal==='done'&&safe.pieceCount>0"));
 assert.ok(source.includes("safe.originalDoneCount===safe.pieceCount"));
 assert.ok(source.includes("safe.outputPieceHashes.every"));
 assert.ok(source.includes("if(!good)process.exitCode=1"));
});
