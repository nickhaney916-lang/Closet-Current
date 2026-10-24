// Integration adaptation of verified parallel Work #22 tests. Reads the ACTUAL
// combined Family Alpha HOLD artifact, not parent PR files. Deliberately kept
// outside generic test glob: requires the prior isolated HOLD build.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../../dist-family-alpha-recognition-integration-hold/wardrobe-backup-engine.js'),photo=require('../helpers/issue204-photo.cjs');
const app=fs.readFileSync('dist-family-alpha-recognition-integration-hold/app.js','utf8');
const part=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b,app.indexOf(a)));
const piece=(id='top')=>({id,name:'Confirmed navy top',category:'Tops',itemType:'T-shirt',color:'Navy',colorSource:'user',image:photo('D'),outfitSourceId:'scene-a',originalPhoto:{image:photo('A'),sourceId:'scene-a'},recognitionPhoto:{image:photo('B'),crop:{x:10,y:20,width:30,height:40}},segmentHint:{categories:['Tops'],types:['T-shirt']},pattern:'Striped',seasons:['Fall'],userAdjusted:false});
function harness(){
 const pending=[],disk={items:[],state:[]};let tail=Promise.resolve();
 const c={structuredClone,Date,URL,encodeURIComponent,window:{closetAuth:{user:{id:'alice'}}},items:[],batch:[],
  persistDraft(){},similarPhotos:()=>false,independentlyDistinctOutfitRegions:()=>true,segmentationAllows:()=>true,
  ClothingDetails:{validColor:x=>!!x},queued(work){const p=tail.then(work);tail=p.catch(()=>{});return p;}};
 c.db={transaction(){const staged=structuredClone(disk),tx={objectStore(name){return {put(row){const value=structuredClone(row),i=staged[name].findIndex(x=>x.id===row.id);if(i<0)staged[name].push(value);else staged[name][i]=value;}};}};pending.push({tx,staged});return tx;}};
 vm.createContext(c);for(const f of ['taxonomy.js','outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(fs.readFileSync('dist-family-alpha-recognition-integration-hold/'+f,'utf8'),c);
 vm.runInContext(part('function savePiece(','function node(')+part('async function saveIndexed(','async function recognizeItem('),c);
 vm.runInContext('function submit(value,editorCurrent){const item=value;return '+app.match(/await (savePiece\(value,.*editorCurrent\));/)[1]+';}',c);
 return {c,disk,pending,async started(){await new Promise(r=>setImmediate(r));assert.equal(pending.length,1);},finish(fail=false){const {tx,staged}=pending.shift();if(fail){tx.error=Error('Synthetic abort');tx.onabort();}else{Object.assign(disk,staged);tx.oncomplete();}}};
}
test('automatic saved in-memory source/crop metadata matches durable snapshot after nested draft mutation',async()=>{
 const h=harness(),p=piece();h.c.batch=[p];const before=structuredClone(p),saving=h.c.saveIndexed(p,()=>true);await h.started();
 p.originalPhoto.image=photo('Z');p.recognitionPhoto.crop.x=99;p.segmentHint.categories[0]='Shoes';
 h.finish();assert.equal(await saving,true);
 assert.deepEqual(JSON.parse(JSON.stringify(h.c.items)),JSON.parse(JSON.stringify(h.disk.items)));
 assert.equal(h.c.items[0].originalPhoto.image,before.originalPhoto.image);assert.equal(h.c.items[0].recognitionPhoto.crop.x,10);
});
test('manual save evaluates current draft at queued write, retaining captures added after submit',async()=>{
 const h=harness(),p=piece();h.c.batch=[p];const saving=h.c.submit(p,()=>true);
 h.c.batch.push(piece('later-photo'));await h.started();h.finish();await saving;
 assert.deepEqual(h.disk.state[0].batch.map(x=>x.id),['later-photo']);
});
test('manual queued save never resurrects a draft photo removed after submit',async()=>{
 const h=harness(),p=piece(),other=piece('removed');h.c.batch=[p,other];const saving=h.c.submit(p,()=>true);
 h.c.batch=[p];await h.started();h.finish();await saving;assert.equal(h.disk.state[0].batch.length,0);
});
test('failed atomic save publishes no item and retains original draft',async()=>{
 const h=harness(),p=piece();h.c.batch=[p];const saving=h.c.saveIndexed(p,()=>true);await h.started();h.finish(true);await assert.rejects(saving,/abort/);
 assert.equal(h.c.items.length,0);assert.equal(h.c.batch[0],p);assert.equal(h.disk.items.length,0);
});
function validate(c,items){return E.validate({format:'closet-current',version:4,ownerId:'alice',items,looks:[]},'alice',{normalizeItem:c.normalizeClothing,normalizeLook:x=>structuredClone(x),cleanBoard:c.cleanOutfitBoard});}
test('backup refuses silently normalized confirmed subtype instead of replacing correction with Unknown',()=>{
 const h=harness(),p=piece();p.itemType='Sneakers';p.userAdjusted=true;
 assert.throws(()=>validate(h.c,[p]),/type|detail/i);
});
test('legacy missing type can normalize to Unknown without claiming a confirmed correction',()=>{
 const h=harness(),p=piece();delete p.itemType;assert.equal(validate(h.c,[p]).items[0].itemType,'Unknown');
});
test('save reopen backup restore conflict and outfit selection preserve corrected original identity',async()=>{
 const h=harness(),p=piece();p.userAdjusted=true;
 const saving=h.c.submit(p,()=>true);await h.started();h.finish();await saving;
 const reopened=h.c.normalizeClothing(structuredClone(h.disk.items[0]));
 const incoming=validate(h.c,[reopened]);
 const local={items:[{...structuredClone(p),color:'Red'}],looks:[],outfitBoard:{current:{name:'Local',slots:{},ideas:{}},saved:[]}};
 incoming.outfitBoard={current:{name:'Restored',slots:{top:p.id},ideas:{}},saved:[]};
 const restored=E.merge(local,incoming,{makeId:()=> 'restored-copy',cleanBoard:h.c.cleanOutfitBoard});
 assert.equal(restored.outfitBoard.current.slots.top,'restored-copy');
 const copy=restored.items.find(x=>x.id==='restored-copy');
 for(const key of ['originalPhoto','recognitionPhoto','segmentHint'])assert.deepEqual(JSON.parse(JSON.stringify(copy[key])),JSON.parse(JSON.stringify(p[key])));
 assert.equal(copy.colorSource,'user');assert.equal(copy.userAdjusted,true);assert.equal(copy.color,'Navy');
 const closet=[copy,{...piece('pants'),category:'Bottoms',itemType:'Jeans',color:'Blue'},{...piece('shoes'),category:'Shoes',itemType:'Sneakers',color:'White'}];
 const before=JSON.stringify(closet),outfits=h.c.styleOwnedCollection(closet,{request:'Casual',season:'Fall',audience:'All',anchorItemId:copy.id,ownerId:'alice'});
 assert.ok(outfits.length>0);assert.ok(outfits.every(o=>o.board.slots.top===copy.id));assert.equal(JSON.stringify(closet),before);
});
