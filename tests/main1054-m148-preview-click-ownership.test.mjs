/** M4 M148 — execute the actual async completion guard from the installed
 * native research outfit viewer. A stale click may NEVER clear a newer
 * owner's/board's shared original-photo DOM. No JWT, photo or network data.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/outfit-board.js',import.meta.url),'utf8');
// M149 added a separate, lower-trust M59 photo-only viewer with its own
// refresh(); scope this executable ownership test to the actual M4
// strict signed-owner preview instead of accidentally matching both viewers.
const strictMark="section.id='mission4Preview1054Section'";
const galleryMark="section.id='mission4PhotoOnly59Section'";
assert.equal(source.split(strictMark).length,2,'strict native preview section must be unique');
assert.equal(source.split(galleryMark).length,2,'native M59 gallery section must be unique');
const strictStart=source.indexOf(strictMark),galleryStart=source.indexOf(galleryMark,strictStart);
assert(strictStart>=0&&galleryStart>strictStart,'strict preview must precede separate gallery');
const strictSource=source.slice(strictStart,galleryStart);
const start="     const result=await viewer.refresh();";
const end="     if(viewer.status.phase!=='visible'||";
assert.equal(strictSource.split(start).length,2,'actual signed preview refresh point moved');
assert.equal(strictSource.split(end).length,2,'actual signed preview terminal point moved');
const first=strictSource.indexOf(start),last=strictSource.indexOf(end,first);
assert(first>=0&&last>first,'test must execute actual consumer code');
const completion=strictSource.slice(first,last);
assert.match(completion,/mission4Preview1054ClickSerial===serial|serial===mission4Preview1054ClickSerial/);
assert.match(completion,/mission4Preview1054Viewer===viewer/);
function executeCompletion({clickSerial,activeSerial,ownedViewer,live,initialPixels}){
 const displays={pixels:initialPixels,clears:0,ownershipRevokes:0};
 const viewer={status:{phase:'visible'},async refresh(){return {slotCount:1};},
  clear(){displays.clears++;displays.pixels=0;displays.ownershipRevokes++;}},
  replacement={status:{phase:'visible'},clear(){throw Error('wrong viewer cleared')}};
 const scope={viewer,serial:clickSerial,
  mission4Preview1054ClickSerial:activeSerial,
  mission4Preview1054Viewer:ownedViewer?viewer:replacement,
  live:()=>live};
 return Promise.resolve(vm.runInNewContext(
  '(async()=>{'+completion+'})()',scope,{timeout:2000}
 )).then(()=>displays);
}
test('stale click A cannot clear signed owner photo pixels presented by newer click B on same viewer',async()=>{
 const state=await executeCompletion({clickSerial:1,activeSerial:2,ownedViewer:true,live:false,initialPixels:2});
 assert.deepEqual(state,{pixels:2,clears:0,ownershipRevokes:0});
});
test('late old click cannot clear newer replacement viewer or its shared DOM',async()=>{
 const state=await executeCompletion({clickSerial:1,activeSerial:2,ownedViewer:false,live:false,initialPixels:1});
 assert.deepEqual(state,{pixels:1,clears:0,ownershipRevokes:0});
});
test('same currently owned click must still clear pixels after signed owner/source lease becomes stale',async()=>{
 const state=await executeCompletion({clickSerial:3,activeSerial:3,ownedViewer:true,live:false,initialPixels:1});
 assert.deepEqual(state,{pixels:0,clears:1,ownershipRevokes:1});
});
test('same click with replaced viewer cannot clear a new mounted viewer even if its old live signal is false',async()=>{
 const state=await executeCompletion({clickSerial:3,activeSerial:3,ownedViewer:false,live:false,initialPixels:1});
 assert.deepEqual(state,{pixels:1,clears:0,ownershipRevokes:0});
});
test('active owner lease and exact current viewer never get cleared by successful refresh completion',async()=>{
 const state=await executeCompletion({clickSerial:4,activeSerial:4,ownedViewer:true,live:true,initialPixels:1});
 assert.deepEqual(state,{pixels:1,clears:0,ownershipRevokes:0});
});
