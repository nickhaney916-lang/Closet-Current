'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {create,MAX_ENTRIES,MAX_BYTES}=require('../public/figure-preview-cache.js');
const raw='data:image/png;base64,'+'AAAA'.repeat(30);
const q=(id='top',owner='one',source=raw)=>({id,owner,source,category:'Tops',primaryColor:'Blue'});
const result=(c='A')=>({image:'data:image/png;base64,'+c.repeat(200),width:62,height:90});
test('the private local cache reuses fitted pixels only for same signed-in user, identity, image and color',()=>{
 const c=create(),a=q();
 assert.equal(c.get(a),null);
 assert.equal(c.put(a,result()),true);
 assert.deepEqual(c.get(a),result());
 assert.equal(c.info().entryCount,1);
 assert.equal(c.get({...a,primaryColor:'Red'}),null);
 assert.equal(c.get({...a,category:'Dresses'}),null);
 assert.equal(c.get({...a,source:raw+'AAAA'}),null);
 assert.equal(c.get({...a,id:'second'}),null);
 assert.equal(c.info().entryCount,1);
});
test('photo replacement immediately evicts prior version without retaining old copied image',()=>{
 const c=create(),a=q(),newPhoto=q('top','one',raw+'BBBB');
 assert.equal(c.put(a,result('A')),true);
 assert.equal(c.put(newPhoto,result('B')),true);
 assert.equal(c.info().entryCount,1);
 assert.equal(c.get(a),null);
 assert.equal(c.get(newPhoto).image,result('B').image);
});
test('changing account synchronously revokes all previous previews, even for identical item IDs',()=>{
 const c=create();c.put(q('shirt','accountA'),result('A'));
 assert.equal(c.get(q('shirt','accountB')),null);
 assert.equal(c.info().entryCount,0);
 assert.equal(c.get(q('shirt','accountA')),null);
 c.put(q('shirt','accountA'),result('A'));
 assert.equal(c.forOwner(null),false);
 assert.equal(c.info().entryCount,0);
 assert.equal(c.info().hasOwner,false);
});
test('no unsigned session can retain local photos and disposed cache reveals no entries',()=>{
 const c=create();
 assert.equal(c.put(q('x',null),result()),false);
 assert.equal(c.get(q('x',null)),null);
 assert.equal(c.info().entryCount,0);
 c.put(q('x'),result());
 c.dispose();
 assert.equal(c.info().entryCount,0);assert.equal(c.info().bytes,0);
 assert.equal(c.info().hasOwner,false);
});
test('LRU has fixed entry limit even during repeated outfit changes',()=>{
 const c=create();
 for(let i=0;i<MAX_ENTRIES+2;i++)c.put(q('item'+i),result());
 assert.equal(c.info().entryCount,MAX_ENTRIES);
 assert.equal(c.get(q('item0')),null);
 assert.equal(c.get(q('item1')),null);
 assert.ok(c.get(q('item2')));
 c.put(q('new'),result());
 assert.equal(c.get(q('item3')),null,'the least recently used key is evicted');
});
test('oversized inputs and malformed results are not retained in browser memory',()=>{
 const c=create();
 assert.equal(c.put(q('huge','one','X'.repeat(2_850_001)),result()),false);
 assert.equal(c.put(q(),{image:'x',width:0,height:42}),false);
 assert.equal(c.put(q(),{image:'x',width:42.5,height:42}),false);
 assert.equal(c.put({...q(),id:42},result()),false);
 assert.equal(c.put(q(),{image:'X'.repeat(MAX_BYTES),width:24,height:24}),false);
 assert.equal(c.info().entryCount,0);
});
test('full module stays display-only without IO, network, storage or provider calls',()=>{
 const src=fs.readFileSync('public/figure-preview-cache.js','utf8');
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|\.postMessage\(/.test(src));
 assert.ok(!/fetch\(|localStorage|sessionStorage|indexedDB|\.setItem\(/.test(ui));
 assert.match(html,/script src="figure-preview-cache\.js"/);
 assert.ok(html.indexOf('src="figure-preview-cache.js"')<html.indexOf('src="reusable-figure-preview.js"'));
 assert.match(ui,/document\.createDocumentFragment\(\)/);
 assert.match(ui,/garmentContainer\.replaceChildren\(nextLayers\)/);
 assert.match(ui,/previewCache\?\.forOwner\(owner\)/);
 assert.match(ui,/previewCache\?\.dispose\(\)/);
 assert.match(ui,/if\(cancelled\(\)\)return/);
 const edge=fs.readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(edge,/RESERVED_PAID_INFERENCE_APPROVED=false/);
 assert.match(edge,/CHAINED_PAID_INFERENCE_APPROVED=false/);
});

test('decoded image integrity is checked before counting or caching a fitted garment',()=>{
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const index=ui.indexOf('try{await decodeImage(img);}');
 const dimensionCheck=ui.indexOf('img.naturalWidth!==prepared.width');
 const cacheWrite=ui.indexOf('if(preparedNow)previewCache?.put(query,prepared)');
 const append=ui.indexOf('nextLayers.append(img);displayedSlots.add(placement.slot);counts.shown++');
 assert.ok(index>=0,'display image is decoded before publication');
 assert.ok(index<dimensionCheck&&dimensionCheck<cacheWrite&&cacheWrite<append,
  'decoder, dimensions and signed-in account cancellation precede cache/population');
 assert.match(ui,/catch\{if\(cancelled\(\)\)return;previewCache\?\.remove\(query\);counts\.skipped\+\+;continue;\}/);
 assert.match(ui,/if\(cancelled\(\)\)return;/);
});
