const test=require('node:test'),assert=require('node:assert/strict');
const {mergeDocuments,validateDocument,mapImages,equal}=require('../public/cloud-backup-engine.js');
const doc=(items=[],state={})=>({schemaVersion:1,items,state}),piece=(id,name='Shirt')=>({id,name,category:'Tops',image:'closet-photo:owner/hash.jpg'});
test('cloud migration combines different device closets without dropping either collection',()=>{
 const a=doc([piece('one')]),b=doc([piece('two')]);assert.deepEqual(mergeDocuments(null,a,b).items.map(x=>x.id),['one','two']);
});
test('cloud merge respects deletes and preserves unrelated additions',()=>{
 const base=doc([piece('one')]),a=doc([]),b=doc([piece('one'),piece('two')]);assert.deepEqual(mergeDocuments(base,a,b).items.map(x=>x.id),['two']);
});
test('independent fields on the same garment merge without discarding either edit',()=>{
 const base=doc([piece('one')]),a=structuredClone(base),b=structuredClone(base);a.items[0].name='Blue shirt';b.items[0].color='Blue';
 const merged=mergeDocuments(base,a,b);assert.equal(merged.items[0].name,'Blue shirt');assert.equal(merged.items[0].color,'Blue');
});
test('conflicting labels and edit versus delete require review rather than silent overwrite',()=>{
 const base=doc([piece('one')]),a=doc([piece('one','Local shirt')]),b=doc([piece('one','Other shirt')]);
 assert.throws(()=>mergeDocuments(base,a,b),e=>e.code==='conflict');assert.throws(()=>mergeDocuments(base,a,doc([])),e=>e.code==='conflict');
});
test('saved items supersede stale draft photos, and separate draft captures merge',()=>{
 const a=doc([piece('saved')],{draft:{id:'draft',batch:[piece('left')]}}),b=doc([],{draft:{id:'draft',batch:[piece('saved'),piece('right')]}});
 const merged=mergeDocuments(null,a,b);assert.deepEqual(merged.state.draft.batch.map(x=>x.id),['left','right']);
});
test('cloud documents reject duplicate IDs, unsupported state and disguised marker rows',()=>{
 for(const value of [doc([piece('one'),piece('one')]),doc([],{unknown:{id:'unknown'}}),doc([],{draft:{id:'cloud-sync',batch:[]}}),doc([],{looks:{id:'looks',looks:'not an array'}})])assert.throws(()=>validateDocument(value));
});
test('photo conversion includes closet, drafts and inspiration without changing metadata',async()=>{
 const a=doc([{...piece('one'),image:'PHOTO_A'}],{draft:{id:'draft',batch:[{...piece('two'),image:'PHOTO_B'}]},looks:{id:'looks',looks:[{id:'look',image:'PHOTO_C',title:'My look'}]}});
 const encoded=await mapImages(a,async image=>'encoded:'+image);assert.equal(encoded.items[0].image,'encoded:PHOTO_A');assert.equal(encoded.state.looks.looks[0].image,'encoded:PHOTO_C');assert.equal(encoded.state.looks.looks[0].title,'My look');assert.equal(a.items[0].image,'PHOTO_A');
 const restored=await mapImages(encoded,async image=>image.slice(8));assert.ok(equal(a,restored));
});
test('unsafe object keys cannot become prototype changes during cloud decoding',async()=>{
 await assert.rejects(()=>mapImages(JSON.parse('{"__proto__":{"admin":true}}'),async x=>x));assert.equal({}.admin,undefined);
});
