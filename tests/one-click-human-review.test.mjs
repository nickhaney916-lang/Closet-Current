import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {packetFromLock,LOCK,hash} from '../scripts/source-holdout-human-review.mjs';
import {readVerifiedOriginals,oneClickHTML} from '../scripts/one-click-human-review.mjs';
const packet=()=>packetFromLock(fs.readFileSync(LOCK));
test('single-file review preserves blank independent form and all 13 neutral original IDs',()=>{
 const p=packet(),rows=p.photos.map(x=>({id:x.id,sha256:x.sha256,base64:'/9j/2Q=='}));
 const html=oneClickHTML(p,rows);
 assert.match(html,/OPEN|Review|review/);assert.match(html,/id="embedded"/);
 assert.match(html,/id="previous"/);assert.match(html,/id="next"/);
 assert.match(html,/original JPEG hashes verified/);
 assert.doesNotMatch(html,/photographer\/source description|labelBasis|visualReview|expectedCategory|acceptedTypes|sourceNote/);
 assert.equal((html.match(/<script/g)||[]).length,4);
 assert.throws(()=>oneClickHTML(p,rows.slice(1)),/Missing originals/);
 assert.throws(()=>oneClickHTML(p,[{...rows[0],sha256:'0'.repeat(64)},...rows.slice(1)]),/Expected values to be strictly equal/);
});
test('tampered or non-JPEG originals prevent creation; no substitute photograph is used',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'cc-review-onefile-'));
 const p=packet(),bytes=Buffer.from([255,216,255,217]);
 try{
  for(const x of p.photos)fs.writeFileSync(path.join(folder,x.image),bytes);
  assert.notEqual(hash(bytes),p.photos[0].sha256);
  assert.throws(()=>readVerifiedOriginals(p,folder),/Original JPEG was modified/);
  const fake={photos:p.photos.map(x=>({...x,sha256:hash(bytes)}))};
  const all=readVerifiedOriginals(fake,folder);assert.equal(all.length,13);
  assert.throws(()=>readVerifiedOriginals({...fake,photos:fake.photos.map((x,i)=>i===5?{...x,sha256:'bad'}:x)},folder),/Original JPEG was modified/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
