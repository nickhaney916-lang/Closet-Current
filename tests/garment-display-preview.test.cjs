'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const gate=require('../public/garment-display-preview.js');
const sha=s=>createHash('sha256').update(Buffer.from(s.split(',')[1],'base64')).digest('hex');
const a='data:image/png;base64,'+'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ck5wAAAAASUVORK5CYII=';
const b='data:image/png;base64,'+'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJPQAAAABJRU5ErkJggg==';
const make=()=>({id:'shirt-1',category:'Tops',image:a,normalizedPreview:{
 previewOnly:true,itemId:'shirt-1',category:'Tops',image:b,
 sourceSha256:sha(a),previewSha256:sha(b),
 review:{status:'approved',approvedByOwner:true,identityChecked:true,explicitVisualReview:true}
}});
test('opt-in reviewed generated tile requires valid original and preview checksums',async()=>{
 const item=make();
 assert.equal(await gate.approved(item),b);
 assert.equal(await gate.sourceHash(a),sha(a));
 assert.equal(await gate.sourceHash(b),sha(b));
 assert.equal(item.image,a);
});
test('no preview and merely generated preview cannot replace closet original',async()=>{
 assert.equal(await gate.approved({id:'shirt-1',category:'Tops',image:a}),null);
 const p=make();p.normalizedPreview.review.status='pending';
 assert.equal(await gate.approved(p),null);
 p.normalizedPreview.review.status='rejected';
 assert.equal(await gate.approved(p),null);
});
test('wrong source, wrong item, wrong type, stale output and missing identity verification fail closed',async()=>{
 const x=make();x.normalizedPreview.sourceSha256='0'.repeat(64);
 assert.equal(await gate.approved(x),null);
 const y=make();y.normalizedPreview.itemId='other-item';
 assert.equal(await gate.approved(y),null);
 const z=make();z.normalizedPreview.category='Shoes';
 assert.equal(await gate.approved(z),null);
 const q=make();q.normalizedPreview.previewSha256='f'.repeat(64);
 assert.equal(await gate.approved(q),null);
 const n=make();n.normalizedPreview.review.identityChecked=false;
 assert.equal(await gate.approved(n),null);
});
test('a generated preview that is exactly the original is not promoted',async()=>{
 const item=make();
 item.normalizedPreview.image=a;
 item.normalizedPreview.previewSha256=sha(a);
 assert.equal(await gate.approved(item),null);
});
test('external links, HTML/SVG, unexpected image types are rejected',async()=>{
 assert.equal(gate.isDataImage('https://cdn.example/garment.png'),false);
 assert.equal(gate.isDataImage('data:image/svg+xml;base64,'+'A'.repeat(400)),false);
 assert.equal(gate.isDataImage(''),false);
 const item=make();item.normalizedPreview.image='https://attacker.example/x.png';
 assert.equal(await gate.approved(item),null);
});
test('photo hash calculation fails closed if browser crypto is unavailable',async()=>{
 const own=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try{
  Object.defineProperty(globalThis,'crypto',{value:undefined,configurable:true});
  assert.equal(await gate.sourceHash(a),null);
 }finally{
  if(own)Object.defineProperty(globalThis,'crypto',own);
  else delete globalThis.crypto;
 }
});
