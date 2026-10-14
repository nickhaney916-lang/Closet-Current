const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public/app.js','utf8');
function setup(){
 function node(tag,text){return {tag,text:text||'',children:[],append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;}};}
 const c={recognitionState:{phase:'idle',percent:null,activeId:null},node,items:[],localPending:new Set(),localReady:true,adjustPhoto(item){c.adjusted=item;},cropClothingPhoto(item){c.cropped=item;}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function cropButton('),source.indexOf('function adjustPhoto(')),c);vm.runInContext(source.slice(source.indexOf('function renderPhotoResults('),source.indexOf('function render(){')),c);
 return {c,grid:node('div')};
}
function descendants(x){return [x,...x.children.flatMap(descendants)];}
test('recognized photo immediately shows its saved category and Adjust and Crop actions',()=>{
 const {c,grid}=setup();const item={id:'shirt',name:'Blue T-shirt',category:'Tops',itemType:'T-shirt',color:'Blue',pattern:'Solid',sleeveLength:'Short sleeve',fit:'Regular',seasons:[]};c.items=[item];
 c.renderPhotoResults(grid,[item]);const nodes=descendants(grid),buttons=nodes.filter(x=>x.tag==='button');assert.equal(buttons.length,2);assert.equal(buttons[0].text,'Adjust');assert.ok(nodes.some(x=>x.text==='Tops · T-shirt · Blue'));assert.ok(nodes.some(x=>x.text.includes('Solid · Short sleeve')));buttons[0].onclick();assert.equal(c.adjusted,item);buttons[1].onclick();assert.equal(c.cropped,item);
});
test('failed recognition keeps the photo and offers correction and crop actions without guessing',()=>{
 const {c,grid}=setup();c.renderPhotoResults(grid,[{id:'unknown',image:'photo',category:'Uncategorized'}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Needs a clearer photo'));assert.equal(nodes.filter(x=>x.tag==='button').length,2);assert.ok(nodes.some(x=>x.tag==='img'&&x.src==='photo'));
});
test('processing displays its category as soon as the worker identifies it',()=>{
 const {c,grid}=setup();c.localPending.add('shirt');c.renderPhotoResults(grid,[{id:'shirt',category:'Tops',itemType:'T-shirt'}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='T-shirt'));assert.ok(nodes.some(x=>x.text==='Tops · T-shirt'));assert.equal(nodes.filter(x=>x.tag==='button').length,2);assert.equal(nodes.find(x=>x.tag==='button').text,'Adjust');
});
test('recognition errors release the job instead of leaving a perpetual spinner',()=>{
 const nodes=new Map();const c={recognitionState:{phase:'idle',percent:null,activeId:null},renderRecognitionNotice(){},recognitionUnavailable:false,localWorker:null,localReady:true,localJobs:new Map(),crypto:{randomUUID:()=> 'job'},recognitionAssetVersion:'',clearTimeout(){},setTimeout(){return 1;},$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},Worker:class{postMessage(){} terminate(){this.stopped=true;}}};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function stopRecognitionWorker('),source.indexOf('async function enableLocal(')),c);
 const result=c.localRequest('classify','photo').catch(e=>e);c.localWorker.onerror();assert.equal(c.localReady,false);assert.equal(c.localJobs.size,0);assert.equal(c.localWorker,null);return result.then(e=>assert.match(e.message,/unavailable/));
});
test('queued photos stay compact and offer Adjust during model setup',()=>{
 const {c,grid}=setup();c.localReady=false;c.localPending.add('waiting');c.renderPhotoResults(grid,[{id:'waiting',category:'Uncategorized',image:'photo'}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Waiting…'));assert.ok(!nodes.some(x=>/first use|Preparing recognition/.test(x.text)));assert.equal(nodes.filter(x=>x.tag==='button').length,2);
});
test('a scanner failure is distinguished from a garment that was not recognized',()=>{
 const {c,grid}=setup();c.renderPhotoResults(grid,[{id:'failed',category:'Uncategorized',scanFailed:true}]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Scanner unavailable'));assert.ok(!nodes.some(x=>x.text==='Needs a clearer photo'));
});

test('storage failure shows Not saved and keeps recognized labels with one Adjust action',()=>{
 const {c,grid}=setup();c.renderPhotoResults(grid,[{id:'unsaved',category:'Tops',itemType:'Polo',color:'Red',saveFailed:true,scanFailed:true}]);
 const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Not saved'));assert.ok(nodes.some(x=>x.text==='Tops · Polo · Red'));assert.equal(nodes.filter(x=>x.tag==='button').length,2);
});

test('saved outfit pieces show their clipped image without an add or selection step',()=>{
 const {c,grid}=setup();const item={id:'ready',image:'auto-clipped-photo',outfitSourceId:'outfit',category:'Tops',itemType:'T-shirt',localAnalyzed:true};c.items=[item];c.renderPhotoResults(grid,[item]);const nodes=descendants(grid);assert.ok(nodes.some(x=>x.text==='Saved'));assert.ok(nodes.some(x=>x.tag==='img'&&x.src==='auto-clipped-photo'));assert.ok(!nodes.some(x=>x.tag==='input'||x.text==='Ready to add'));
});
