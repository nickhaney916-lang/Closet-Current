import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {engine,sourceGuard,runBenchmark} from '../scripts/issue201-outfit-benchmark.mjs';
import {wardrobe,photo} from '../benchmark/issue201-synthetic-wardrobes.mjs';
const jpeg=createRequire(import.meta.url)('./helpers/issue204-photo.cjs');
const board=()=>({slots:{top:'new-top',bottom:'pants',shoes:'shoe-1'},anchorItemId:'new-top'});
const mutations={
 'original bytes':x=>{x.originalPhoto.image=photo('replacement');},
 'original hash':x=>{x.originalPhoto.sha256='changed';},
 'top-level hash':x=>{x.originalContentHash='changed';},
 'source identity':x=>{x.outfitSourceId='replacement-source';},
 'recognition identity':x=>{x.recognitionSourceId='replacement-recognition';},
 'recognition bytes':x=>{x.recognitionPhoto.image=photo('replacement-crop');},
 'original dimensions':x=>{x.originalPhoto.width=4096;},
 'crop metadata':x=>{x.cropBounds={x:0,y:0,width:.5,height:1};},
 'in-place source metadata':x=>{x.originalPhoto.provenance={revision:2};}
};
for(const [name,mutate]of Object.entries(mutations))test('issue204: '+name+' invalidates source with unchanged display and clothing details',()=>{
 const f=wardrobe(),g=sourceGuard(f.items),display=g.items[0].image,sources=g.stylistSelectedSources(board());
 mutate(g.items[0]);assert.equal(g.items[0].image,display);assert.equal(g.stylistSourcesCurrent(sources),false);
});
test('issue204: source snapshot is independent of nested mutable metadata and key order',()=>{
 const f=wardrobe();f.items[0].originalPhoto.provenance={a:1,b:2};
 const g=sourceGuard(f.items),sources=g.stylistSelectedSources(board());
 g.items[0].originalPhoto.provenance={b:2,a:1};assert.equal(g.stylistSourcesCurrent(sources),true);
 g.items[0].originalPhoto.provenance.a=3;assert.equal(g.stylistSourcesCurrent(sources),false);
});
for(const source of ['recognitionPhoto','originalPhoto'])test('issue204: blank display has a valid local '+source+' fallback without mutating source RGB',()=>{
 const c=engine(),f=wardrobe(),item=f.items[0];item.image='';
 if(source==='originalPhoto')delete item.recognitionPhoto;
 const before=JSON.stringify(f.items),r=c.styleOwnedCollection(f.items,{anchorItemId:item.id});
 assert.equal(r.length,3);assert.equal(c.stylistPhotoForItem(item).image,item[source].image);
 assert.ok(r.every(x=>x.board.slots.top===item.id&&x.notices.some(n=>n.includes('original photo fallback'))));
 assert.equal(JSON.stringify(f.items),before);
});
for(const value of ['',null,'https://example.invalid/photo.jpg','//example.invalid/photo','blob:foreign-owner','closet-photo:foreign/photo.jpg','data:image/svg+xml,<svg/>','data:image/jpeg;base64,AAAA'])
 test('issue204: no-photo/remote/path/invalid record cannot anchor or become a swap',()=>{
  const c=engine(),f=wardrobe();Object.assign(f.items[0],{image:value,originalPhoto:null,recognitionPhoto:null});
  assert.equal(c.styleOwnedCollection(f.items,{anchorItemId:'new-top'}).length,0);
  const r=c.styleOwnedCollection(f.items,{anchorItemId:'pants'})[0];
  assert.ok(!Object.values(r.board.slots).includes('new-top'));
  assert.ok(!c.stylistSwapChoices(r,'top',f.items).some(x=>x.id==='new-top'));
 });
test('issue204: remote display uses only embedded original fallback, never fetches or rewrites the URL',()=>{
 const c=engine(),item=wardrobe().items[0];item.image='https://example.invalid/never-fetch.jpg';delete item.recognitionPhoto;
 const fallback=c.stylistPhotoForItem(item);assert.equal(fallback.source,'original');assert.equal(fallback.image,item.originalPhoto.image);
 assert.equal(item.image,'https://example.invalid/never-fetch.jpg');
});
test('issue204: explicit foreign record/photo ownership is rejected, including a valid embedded original',()=>{
 const c=engine();
 for(const target of ['item','originalPhoto','recognitionPhoto']){
  const f=wardrobe(),item=f.items[0];(target==='item'?item:item[target]).ownerId='synthetic-b';
  assert.equal(c.stylistPhotoForItem(item,'synthetic-a'),null);
  assert.equal(c.styleOwnedCollection(f.items,{anchorItemId:'new-top',ownerId:'synthetic-a'}).length,0);
 }
 const f=wardrobe();f.items[0].owner_id='synthetic-a';assert.equal(c.styleOwnedCollection(f.items,{anchorItemId:'new-top',ownerId:'synthetic-a'}).length,3);
});
test('issue204: type/color fallback requires no successful recognition and never requires a destructive migration',()=>{
 const c=engine(),f=wardrobe(),item=f.items[0];item.itemType='Unknown';item.colorSource='user';item.localAnalyzed=false;
 assert.equal(c.styleOwnedCollection(f.items,{anchorItemId:item.id}).length,3);
 assert.equal(item.image,wardrobe().items[0].image);
});
function storage(){
 const g=sourceGuard(wardrobe().items),writes=[];let release;
 const gate=new Promise(r=>{release=r;});g.structuredClone=structuredClone;g.cleanOutfitBoard=engine().cleanOutfitBoard;
 g.queued=fn=>gate.then(fn);g.db.transaction=()=>{const tx={objectStore:()=>({put:v=>writes.push(v)})};setImmediate(()=>tx.oncomplete?.());return tx;};
 const source=readFileSync('public/outfit-board.js','utf8');vm.runInContext(source.slice(0,source.indexOf('async function storeBoard')),g);
 return {g,writes,release};
}
test('issue204: delayed save checks original identity inside the actual owner-bound write queue',async()=>{
 const h=storage(),sources=h.g.stylistSelectedSources(board());
 const pending=h.g.saveOwnedOutfitBoard(board(),()=>h.g.stylistSourcesCurrent(sources));
 h.g.items[0].originalPhoto.image=jpeg('queued-replacement');h.release();
 await assert.rejects(pending,/outfit or closet changed/);assert.equal(h.writes.length,0);
});
test('issue204: unchanged snapshot saves durably; owner change or backup remap does not relabel old selection',async()=>{
 const good=storage(),sources=good.g.stylistSelectedSources(board());
 const pending=good.g.saveOwnedOutfitBoard(board(),()=>good.g.stylistSourcesCurrent(sources));good.release();await pending;assert.equal(good.writes.length,1);
 for(const mutate of [g=>{g.window.closetAuth.user.id='synthetic-b';},g=>{g.items[0].id='remapped-original';}]){
  const h=storage(),s=h.g.stylistSelectedSources(board()),p=h.g.saveOwnedOutfitBoard(board(),()=>h.g.stylistSourcesCurrent(s));mutate(h.g);h.release();await assert.rejects(p,/changed/);assert.equal(h.writes.length,0);
 }
});
test('issue204: delayed preview uses recommendation snapshot, not a new original captured at click time',async()=>{
 const g=sourceGuard(wardrobe().items);let release,navigations=0;g.outfitBoardReady=new Promise(r=>{release=r;});
 g.stylistPreviewRevision=0;g.stylistRequestRevision=1;g.cleanOutfitBoard=engine().cleanOutfitBoard;
 const result={board:board(),context:{request:'Casual'}};result.preparedSources=g.stylistSelectedSources(result.board);g.styledCollectionResults=[result];g.switchView=()=>{navigations++;};
 const source=readFileSync('public/closet-stylist.js','utf8');vm.runInContext(source.slice(source.indexOf('async function previewStyledOutfit('),source.indexOf('function renderStyledCollection(')),g);
 g.items[0].originalPhoto.image=jpeg('changed-before-preview-click');const status={};
 const p=g.previewStyledOutfit(result,result.board,0,{disabled:false},status);release();await p;
 assert.equal(navigations,0);assert.match(status.textContent,/changed/);
});
test('issue204: decoder rejects unreadable images and releases native image buffers',async()=>{
 const g=sourceGuard(wardrobe().items);g.stylistPhotoForItem=engine().stylistPhotoForItem;g.setTimeout=setTimeout;g.clearTimeout=clearTimeout;let released=0;
 g.Image=class{constructor(){this.naturalWidth=0;this.naturalHeight=0;}decode(){return Promise.reject(Error('synthetic decode failure'));}removeAttribute(){released++;}};
 assert.equal((await g.stylistDecodedItems(g.items,'synthetic-a')).length,0);assert.equal(released,g.items.length);
});
test('issue204: independent benchmark numerator and denominator are 22/22, not photo accuracy',()=>{
 const r=runBenchmark();assert.equal(r.passed,22);assert.equal(r.failed,0);assert.equal(r.checks.length,22);assert.equal(r.recognitionAccuracyMeasured,false);assert.equal(r.realisticRenderingEvaluated,false);
});
test('issue204: changing both Auth and DB cannot adopt an old same-ID recommendation',()=>{
 const g=sourceGuard(wardrobe().items),sources=g.stylistSelectedSources(board());
 g.window.closetAuth.user.id='synthetic-b';g.db={name:'closet-current-user-synthetic-b'};
 assert.equal(g.stylistOwnsCloset(),true);assert.equal(g.stylistSourcesCurrent(sources),false);
});
