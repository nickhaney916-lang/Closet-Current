'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const board=fs.readFileSync('public/outfit-board.js','utf8');
const engine=fs.readFileSync('public/outfit-board-engine.js','utf8');
const sync=board.split('\n').find(line=>line.startsWith('function syncBoardInputs(){'));
assert.ok(sync,'load exact real board metadata input synchronizer');
const begin=board.indexOf("\nfor(const [id,key]");
const end=board.indexOf("\n$('closeBoardPicker')",begin);
assert.ok(begin>=0&&end>begin,'load exact real onchange handler definitions');
const handlers=board.slice(begin,end);
function setup(){
 const elements=new Map(),garments=[
  {id:'shirt',name:'Original shirt',image:'original-jpeg-id',category:'Tops',itemType:'T-shirt'},
  {id:'jacket',name:'Original jacket',image:'other-original-jpeg-id',category:'Outerwear',itemType:'Jacket'}
 ];
 const $=id=>{
  if(!elements.has(id))elements.set(id,{id,value:'',textContent:''});
  return elements.get(id);
 };
 const ctx={URL,encodeURIComponent,structuredClone,items:garments,$,window:{}};
 vm.createContext(ctx);
 vm.runInContext(engine,ctx);
 vm.runInContext('let currentBoard=cleanOutfitBoard({name:"Original name",slots:{top:"shirt"},occasion:"Dinner",season:"Fall",audience:"Women",size:"Medium",budget:125},items);',ctx);
 vm.runInContext(sync,ctx);
 const renders=[];
 ctx.renderOutfitBoard=()=>{
  vm.runInContext('currentBoard=cleanOutfitBoard(currentBoard,items)',ctx);
  renders.push(JSON.parse(vm.runInContext('JSON.stringify(currentBoard)',ctx)));
 };
 ctx.storeBoard=async()=>true;
 vm.runInContext(handlers,ctx);
 vm.runInContext('syncBoardInputs()',ctx);
 return {
  ctx,$,garments,renders,
  state:()=>JSON.parse(vm.runInContext('JSON.stringify(currentBoard)',ctx)),
  persist:fn=>{ctx.storeBoard=fn;},
  edit:(id,value)=>{$(id).value=value;return $(id).onchange();}
 };
}
const changes=[
 ['boardName','A never-saved outfit name','name','Original name'],
 ['boardOccasion','Work','occasion','Dinner'],
 ['boardSeason','Spring','season','Fall'],
 ['boardAudience','Men','audience','Women'],
 ['boardSize','Large','size','Medium'],
 ['boardBudget','999','budget',125],
];
for(const [id,changed,key,old]of changes){
 test('rejected metadata save restores persisted '+key+' and the displayed field',async()=>{
  const f=setup(),before=f.state(),images=f.garments.map(x=>x.image);
  f.persist(async()=>false);
  await f.edit(id,changed);
  assert.deepEqual(f.state(),before,'cannot display unsaved metadata as committed');
  assert.equal(f.$(id).value,String(old),'failed field must show previously saved value');
  assert.deepEqual(f.garments.map(x=>x.image),images,'photographs untouched');
  assert.match(f.$('boardSaveStatus').textContent,/could not be saved/i);
 });
}
test('successful metadata save retains the chosen occasion and budget',async()=>{
 const f=setup(),writes=[];
 f.persist(async()=>{writes.push(f.state());return true;});
 await f.edit('boardOccasion','Work');
 await f.edit('boardBudget','80');
 assert.equal(f.state().occasion,'Work');assert.equal(f.state().budget,80);
 assert.equal(f.$('boardOccasion').value,'Work');
 assert.equal(f.$('boardBudget').value,'80');
 assert.equal(writes.length,2);
});
test('late rejected change cannot replace a newer successful edit to same field',async()=>{
 const f=setup(),pending=[];
 f.persist(()=>new Promise(resolve=>pending.push(resolve)));
 const first=f.edit('boardSeason','Winter');
 const second=f.edit('boardSeason','Summer');
 assert.equal(pending.length,2);
 pending[1](true);await second;
 pending[0](false);await first;
 assert.equal(f.state().season,'Summer');
 assert.equal(f.$('boardSeason').value,'Summer');
});
test('a failed previous field save cannot erase a newer separate field edit',async()=>{
 const f=setup(),pending=[];
 f.persist(()=>new Promise(resolve=>pending.push(resolve)));
 const first=f.edit('boardOccasion','Work');
 const second=f.edit('boardSeason','Winter');
 pending[1](true);await second;pending[0](false);await first;
 assert.equal(f.state().occasion,'Work');
 assert.equal(f.state().season,'Winter');
 assert.equal(f.$('boardSeason').value,'Winter');
});
