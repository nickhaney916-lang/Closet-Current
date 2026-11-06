import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,readdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import {makeVerifiedHumanWorkspaces98,readonlyReviewServer98,HOLD98}
 from '../scripts/prepare-source97-review-98.mjs';
import {verifyPacket94}
 from '../research/independent-instance-ground-truth-94/instance-evidence.mjs';

const labels=['alpha','beta','gamma','delta','epsilon','zeta','theta'];
async function genuineQAFixtures(){
 const original=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const candidates=[],bytes=new Map();
 for(let i=0;i<7;i++){
  const o=original[i],raw=await readFile('benchmark/fixtures/'+o.image);
  const meta=await sharp(raw).metadata(),id='r97-qa-'+labels[i];
  bytes.set(id,raw);
  candidates.push({id,originFileName:o.image,
   originalURL:'https://upload.wikimedia.org/wikipedia/commons/a/aa/example.jpg',
   commonsPage:'https://commons.wikimedia.org/wiki/File:Example.jpg',
   pinnedSourceSHA256:o.sha256,pinnedOriginalBytes:raw.length,
   advertisedWidth:meta.width,advertisedHeight:meta.height,
   author:'Source fixture only',license:'Fixture license, not republished'});
 }
 return {candidates,fetchBytes:async c=>bytes.get(c.id),bytes};
}
async function workspace(){
 const f=await genuineQAFixtures();
 const html=await readFile('research/independent-instance-ground-truth-94/annotate.html','utf8');
 const parent=await mkdtemp(join(tmpdir(),'closet-source98-unit-'));
 const root=join(parent,'review-bundles');
 return {...f,html,parent,root};
}
test('SOURCE98 true-source-byte JPEGs enter three separately blinded P94 source-SHA-locked packets, no labels',async t=>{
 const w=await workspace();t.after(()=>rm(w.parent,{recursive:true,force:true}));
 const proof=await makeVerifiedHumanWorkspaces98(w);
 assert.equal(proof.sourceSHA256Verified,7);
 assert.equal(proof.actualHumanReviewers,0);
 assert.equal(proof.humanInstanceMasks,0);
 assert.equal(proof.scientificallyAccepted,0);
 assert.equal(proof.familyAlpha,'HOLD');
 assert.equal(proof.releaseAuthorized,false);
 const ids=new Set();
 for(const role of ['A','B','C']){
  const dir=join(w.root,'reviewer-'+role);
  const packet=JSON.parse(await readFile(join(dir,'packet-'+role+'.json'),'utf8'));
  assert.equal(verifyPacket94(packet),true);
  assert.equal(packet.role,role);
  assert.equal(packet.total,7);
  assert.equal(packet.items.every(x=>Object.keys(x).sort().join(',')==='id,image,sourceSHA256'),true);
  assert.equal(packet.items.some(x=>'expectedCategory' in x||'modelPrediction' in x),false);
  assert.equal((await readdir(join(dir,'benchmark','fixtures'))).length,7);
  assert.match(await readFile(join(dir,'research','independent-instance-ground-truth-94','annotate.html'),'utf8'),
   /Source JPEG bytes\/SHA mismatch/);
  assert.match(await readFile(join(dir,'README.txt'),'utf8'),/QUARANTINED/);
  ids.add(packet.packetId);
 }
 assert.equal(ids.size,3,'blind A/B/C packets have distinct source-bound identities and order');
 const proofPhoto=await readFile(join(w.root,'reviewer-A','benchmark','fixtures',w.candidates[0].id+'.jpg'));
 assert.deepEqual(proofPhoto,w.bytes.get(w.candidates[0].id));
});
test('SOURCE98 refuses altered source JPEG, duplicate hashes, non-original URL and missing original-photo review UI',async t=>{
 const w=await workspace();t.after(()=>rm(w.parent,{recursive:true,force:true}));
 const bad=Buffer.from(w.bytes.get(w.candidates[0].id));bad[Math.floor(bad.length/2)]^=1;
 await assert.rejects(makeVerifiedHumanWorkspaces98({...w,
  fetchBytes:async c=>c.id===w.candidates[0].id?bad:w.bytes.get(c.id)}),/SHA-256/);
 assert.equal((await readdir(w.parent)).length,0,'refuse to create a package before SHA acceptance');
 const dup=structuredClone(w.candidates);dup[1].pinnedSourceSHA256=dup[0].pinnedSourceSHA256;
 await assert.rejects(makeVerifiedHumanWorkspaces98({...w,candidates:dup}),/duplicate original source/);
 const badUrl=structuredClone(w.candidates);badUrl[0].originalURL='https://evil.example/original.jpg';
 await assert.rejects(makeVerifiedHumanWorkspaces98({...w,candidates:badUrl}),/original Commons HTTPS URL/);
 await assert.rejects(makeVerifiedHumanWorkspaces98({...w,html:'fake'}),/original annotation UI/);
});
test('SOURCE98 local reviewer server only serves same-origin HTML and source JPEGs, refuses packet reads, traversal and POST',async t=>{
 const w=await workspace();t.after(()=>rm(w.parent,{recursive:true,force:true}));
 await makeVerifiedHumanWorkspaces98(w);
 const {server,listen}=readonlyReviewServer98({roleDir:join(w.root,'reviewer-A'),port:0});
 const {port}=await listen();t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+port;
 const page=await fetch(base+'/research/independent-instance-ground-truth-94/annotate.html');
 assert.equal(page.status,200);assert.match(await page.text(),/Independent individual garment masks/);
 const photo=await fetch(base+'/benchmark/fixtures/'+w.candidates[0].id+'.jpg');
 assert.equal(photo.status,200);assert.equal(photo.headers.get('cache-control'),'no-store');
 assert.deepEqual(Buffer.from(await photo.arrayBuffer()),w.bytes.get(w.candidates[0].id));
 assert.equal((await fetch(base+'/packet-A.json')).status,404);
 assert.equal((await fetch(base+'/benchmark/fixtures/../../packet-A.json')).status,404);
 assert.equal((await fetch(base+'/benchmark/fixtures/r97-qa-alpha.jpg',{method:'POST'})).status,405);
 assert.equal((await fetch(base+'/research/independent-instance-ground-truth-94/annotate.html',{method:'HEAD'})).status,200);
 assert.match(HOLD98,/HOLD/);
});
test('SOURCE98 hardened existing schema cannot be quietly repurposed as independent human acceptance',async()=>{
 const ci=await readFile('.github/workflows/source97-independent-human-review-98-no-deploy.yml','utf8');
 const p=await readFile('scripts/prepare-source97-review-98.mjs','utf8');
 assert.match(ci,/BASE=31e47ee9f2dcd621fb380bd280ff88c986c219d1/);
 assert.match(ci,/node scripts\/verify-new-real-commons-candidates-97\.mjs --strict/);
 assert.match(ci,/node scripts\/test-source97-review-98-browser\.mjs/);
 assert.doesNotMatch(ci,/deploy-pages|gh-pages|upload-artifact[\s\S]*benchmark\/fixtures/);
 assert.doesNotMatch(p,/scientificallyAccepted:7|humanInstanceMasks:7|releaseAuthorized:true/);
});
