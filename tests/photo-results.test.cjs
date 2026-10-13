const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public/app.js','utf8');
function setup(){
 function node(tag,text){return {tag,text:text||'',children:[],append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;}};}
 const c={node,items:[],localPending:new Set(),localReady:true,adjustPhoto(item){c.adjusted=item;}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function renderPhotoResults('),source.indexOf('function render(){')),c);
 return {c,grid:node('div')};
}
function descendants(x){return [x,...x.children.flatMap(descendants)];}
test('recognized photo immediately shows its saved category and only one Adjust action',()=>{
 const {c,grid}=setup();const item={id:'shirt',name:'Blue T-shirt',category:'Tops',itemType:'T-shirt',color:'Blue',pattern:'Solid',sleeveLength:'Short sleeve',fit:'Regular',seasons:[]};c.items=[item];
 c.renderPhotoResults(grid,[item]);const nodes=descendants(grid),buttons=nodes.filter(x=>x.tag==='button');assert.equal(buttons.length,1);assert.equal(buttons[0].text,'Adjust');assert.ok(nodes.some(x=>x.text.includes('Tops · T-shirt · Blue · Solid · Short sleeve')));buttons[0].onclick();assert.equal(c.adjusted,item);
});
test('failed recognition keeps the photo and offers one correction action without guessing',()=>{
 const {c,grid}=setup();c.renderPhotoResults(grid,[{id:'unknown',image:'photo',category:'Uncategorized'}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Not recognized'));assert.equal(nodes.filter(x=>x.tag==='button').length,1);assert.ok(nodes.some(x=>x.tag==='img'&&x.src==='photo'));
});
test('processing displays its category as soon as the worker identifies it',()=>{
 const {c,grid}=setup();c.localPending.add('shirt');c.renderPhotoResults(grid,[{id:'shirt',category:'Tops',itemType:'T-shirt'}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='T-shirt'));assert.ok(nodes.some(x=>x.text==='Tops · finishing details…'));assert.equal(nodes.filter(x=>x.tag==='button').length,0);
});
test('recognition errors release the job instead of leaving a perpetual spinner',()=>{
 const nodes=new Map();const c={localWorker:null,localReady:true,localJobs:new Map(),crypto:{randomUUID:()=> 'job'},recognitionAssetVersion:'',clearTimeout(){},setTimeout(){return 1;},$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},Worker:class{postMessage(){} terminate(){this.stopped=true;}}};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function localRequest('),source.indexOf('async function enableLocal(')),c);
 const result=c.localRequest('classify','photo').catch(e=>e);c.localWorker.onerror();assert.equal(c.localReady,false);assert.equal(c.localJobs.size,0);assert.equal(c.localWorker,null);return result.then(e=>assert.match(e.message,/unavailable/));
});
