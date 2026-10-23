import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapBoardSlotsTo3D as bridge} from '../public/outfit-3d-board-bridge.mjs';
const piece=(id,category,colorHex='#112233',accountId='account-a')=>({id,category,colorHex,accountId,image:'synthetic-image',originalSourceVersion:'v1'});
const src=item=>({id:'original-'+item.id,version:'v1'});
test('maps real board.slots item IDs into 3D placeholder regions',()=>{
 const r=bridge({slots:{top:'a',bottom:'b',shoes:'c'}},[piece('a','Tops'),piece('b','Bottoms'),piece('c','Shoes')],'account-a',src);
 assert.equal(r.selected.length,3);assert.deepEqual(r.colors.top,[17/255,34/255,51/255,1]);assert.equal(r.placeholderOnly,true);
});
test('rejects cross-account and unverified original source',()=>{
 assert.throws(()=>bridge({slots:{top:'a'}},[piece('a','Tops','#112233','other')],'account-a',src),/Foreign/);
 assert.throws(()=>bridge({slots:{top:'a'}},[piece('a','Tops')],'account-a',()=>''),/provenance/);
});
test('dress suppresses bottoms and layers',()=>{
 const r=bridge({slots:{top:'dress',shoes:'shoe'}},[piece('dress','Dresses'),piece('shoe','Shoes')],'account-a',src);
 assert.equal(r.hasDress,true);
 assert.throws(()=>bridge({slots:{top:'dress',bottom:'pants'}},[piece('dress','Dresses'),piece('pants','Bottoms')],'account-a',src),/Dress/);
});
test('fails closed on stale item, duplicates, invalid color and category',()=>{
 assert.throws(()=>bridge({slots:{top:'missing'}},[],'account-a',src),/Missing/);
 assert.throws(()=>bridge({slots:{top:'a',bottom:'a'}},[piece('a','Tops')],'account-a',src),/multiple slots/);
 assert.throws(()=>bridge({slots:{top:'a'}},[piece('a','Tops','Blue')],'account-a',src),/Color/);
 assert.throws(()=>bridge({slots:{top:'a'}},[piece('a','Shoes')],'account-a',src),/category/);
});
test('invalidates a stale original even when the cropped preview is unchanged',()=>{
 const saved=piece('a','Tops');
 assert.throws(()=>bridge({slots:{top:'a'}},[saved],'account-a',()=>({id:'original-a',version:'v2'})),/version mismatch/);
 assert.equal(bridge({slots:{top:'a'}},[saved],'account-a',src).selected[0].sourceVersion,'v1');
});
test('three distinct recommendations remain independently mapped',()=>{
 const items=[piece('t1','Tops'),piece('t2','Tops'),piece('t3','Tops'),piece('b','Bottoms'),piece('s','Shoes')];
 const results=['t1','t2','t3'].map(top=>bridge({slots:{top,bottom:'b',shoes:'s'}},items,'account-a',src));
 assert.equal(new Set(results.map(x=>x.selected.find(y=>y.slot==='top').itemId)).size,3);
});
