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
const {keepBothDocuments}=require('../public/cloud-backup-engine.js');
const copyId=row=>'copy-'+row.id;
test('keep both preserves conflicting photos and maps local outfits to the local garment copy',()=>{
 const board={id:'outfit-board',current:{id:'current',name:'My outfit',slots:{top:'one'}},saved:[]};
 const base=doc([piece('one')],{'outfit-board':board}),local=structuredClone(base),remote=structuredClone(base);
 local.items[0].name='Local shirt';local.items[0].image='local-photo';remote.items[0].name='Remote shirt';remote.items[0].image='remote-photo';
 const result=keepBothDocuments(base,local,remote,copyId);
 assert.equal(result.items.find(x=>x.id==='one').image,'remote-photo');assert.equal(result.items.find(x=>x.id==='copy-one').image,'local-photo');
 assert.equal(result.state['outfit-board'].current.slots.top,'copy-one');assert.equal(local.items[0].id,'one');
});
test('keep both retains edited pieces against deletion without undoing unrelated deletes',()=>{
 const base=doc([piece('one'),piece('two')]),local=doc([piece('one','Edited')]),remote=doc([piece('two')]);
 assert.deepEqual(keepBothDocuments(base,local,remote,copyId).items.map(x=>x.id),['one']);
});
test('keep both retains conflicting inspiration and current outfit as a saved copy',()=>{
 const state=title=>({looks:{id:'looks',looks:[{id:'look',title,image:title}]},'outfit-board':{id:'outfit-board',current:{id:'board',name:title,slots:{}},saved:[]}});
 const result=keepBothDocuments(doc([],state('Base')),doc([],state('Local')),doc([],state('Remote')),copyId);
 assert.equal(result.state.looks.looks.length,2);assert.equal(result.state['outfit-board'].saved[0].name,'Local (saved copy)');assert.equal(result.state['outfit-board'].current.name,'Remote');
});
test('keep both refuses capacity overflow and invalid copy identities without dropping photos',()=>{
 const base=doc([piece('one')]),local=doc([piece('one','Local')]),remote=doc(Array.from({length:1000},(_,i)=>piece(i?'remote-'+i:'one','Remote')));
 assert.throws(()=>keepBothDocuments(base,local,remote,copyId));assert.throws(()=>keepBothDocuments(base,local,doc([piece('one','Remote')]),row=>row.id));
});
test('document validation rejects unsafe keys before merging',()=>{
 assert.throws(()=>validateDocument(JSON.parse('{"schemaVersion":1,"items":[],"state":{},"__proto__":{"admin":true}}')));assert.equal({}.admin,undefined);
});
