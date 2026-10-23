import test from 'node:test';
import assert from 'node:assert/strict';
import {categories,makeReport,recoveryFor} from '../research/family-alpha-14/feedback-recovery.mjs';

for (const category of categories) {
  test(`category accepted: ${category}`, () => {
    const result = makeReport({category,description:'Layer did not load'});
    assert.match(result, new RegExp(`Category: ${category}`));
    assert.match(result,/Description: Layer did not load/);
    assert.doesNotMatch(result,/account id|image data/i);
  });
}
for (const [key,expected] of [
  ['photo_rejected','photo'],['unrecognized','identify'],['blank_image','blank'],
  ['photo_missing','unavailable'],['mask_failed','Background'],
  ['outfit_failed','outfit'],['avatar_failed','layer'],['cancelled','canceled']
]) {
  test(`failure guidance: ${key}`, () => {
    const r=recoveryFor(key);
    assert.equal(r.code,key); assert.ok(r.title.length>9);
    assert.match(r.title+' '+r.message,new RegExp(expected,'i'));
    assert.ok(r.actions.every(action=>['retry','closet','review','original'].includes(action)));
    assert.match(r.detail,/no|not|must|should|check/i);
  });
}
test('unknown error uses guarded fallback with no fabricated garment',()=>{
  const v=recoveryFor('something-user-supplied');
  assert.equal(v.code,'unknown');
  assert.equal(v.actions.includes('original'),false);
});
test('only mask error suggests opt-in verified original',()=>{
  for(const key of ['avatar_failed','photo_missing','blank_image','outfit_failed'])
    assert.equal(recoveryFor(key).actions.includes('original'),false);
  assert.ok(recoveryFor('mask_failed').actions.includes('original'));
});
test('failure metadata cannot be modified by consumer',()=>{
  const result=recoveryFor('mask_failed');result.actions.push('fake');
  assert.equal(recoveryFor('mask_failed').actions.includes('fake'),false);
});
test('default report has no account, file, or platform metadata',()=>{
  const text=makeReport();
  assert.match(text,/Category: Other/);assert.match(text,/Description: \(not provided\)/);
  assert.doesNotMatch(text,/UUID:|OS:|User:|Attached: image\/jpeg/i);
});
test('no implicit property serialization, including photo and user',()=>{
  const text=makeReport({category:'2D Avatar',description:'Layer missing',
    image:'private-data:image/jpeg;base64,c3VwZXJzZWNyZXQ=',
    userId:'private-user',account:{email:'private@example.com'},token:'private-secret'});
  for(const bad of ['private-','c3Vw','example.com','secret'])assert.ok(!text.includes(bad));
});
test('user-entered emails, links, phones, UUIDs and data-image URIs are scrubbed',()=>{
  const text=makeReport({description:'send joe@example.com and +1 415-555-0123 https://x.example/p?token=q 123e4567-e89b-12d3-a456-426614174000 data:image/png;base64,YWJj'});
  for(const s of ['joe@example.com','415-555-0123','https://','123e4567-e89b-12d3-a456-426614174000','YWJj'])assert.ok(!text.includes(s));
  for(const s of ['[email removed]','[phone removed]','[link removed]','[identifier removed]','[photo removed]'])assert.ok(text.includes(s));
});
test('descriptions are trimmed and maximum 500 chars is honored',()=>{
  const msg='A'.repeat(500);assert.ok(makeReport({description:'  '+msg+'  '}).includes(msg));
  assert.throws(()=>makeReport({description:'A'.repeat(501)}),RangeError);
});
test('invalid category, non-text descriptions and invalid input are rejected',()=>{
  assert.throws(()=>makeReport({category:'Photo Capture\nPrivate: yes'}),TypeError);
  assert.throws(()=>makeReport({description:{image:'secret'}}),TypeError);
  assert.throws(()=>makeReport({category:'2D Avatar',description:null}),TypeError);
});
test('failure messages never claim a generated garment matches source photos',()=>{
  for(const key of ['blank_image','photo_missing','mask_failed','avatar_failed']){
    const r=recoveryFor(key); assert.match(r.detail,/original|placeholder|sample|illustration/);
  }
});
