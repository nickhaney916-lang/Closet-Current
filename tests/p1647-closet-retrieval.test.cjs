'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync(process.env.P1647_APP||'public/app.js','utf8'),browser=fs.readFileSync(process.env.P1647_BROWSER||'public/closet-browser.js','utf8');
const taxonomy=fs.readFileSync('public/taxonomy.js','utf8');
const query=app.slice(app.indexOf(" const query=$('search').value"),app.indexOf(' if(!visible.length)empty(cg'));
assert.ok(query.includes('const visible=')&&query.includes('closetKey136'));
const title=browser.slice(browser.indexOf(' const browsing=!!('),browser.indexOf('\n}',browser.indexOf(' const browsing=!!(')));
const handlers=browser.slice(browser.indexOf("$('filter').onchange="),browser.indexOf("$('closetClearLook').onclick="))+browser.slice(browser.indexOf("$('search').oninput="),browser.indexOf("$('closetLayerCount').onchange="))+browser.slice(browser.indexOf("$('closetUnsorted').onclick="),browser.indexOf("$('closetSeparates').onclick="));
function harness(){
 const fields=new Map(),$=id=>{if(!fields.has(id))fields.set(id,{value:id==='filter'?'All categories':'',hidden:false,classList:{toggle(){}},scrollIntoView(){},querySelectorAll(){return [];},focus(){}});return fields.get(id)};
 const rows=Array.from({length:192},(_,i)=>({id:'piece-'+i,name:'Piece '+i,color:i%2?'Blue':'Black',category:i%4===0?'Tops':i%4===1?'Bottoms':i%4===2?'Shoes':'Tops',itemType:i%4===0?'Polo':i%4===1?'Jeans':i%4===2?'Loafers':'Sweater',sleeveLength:i%4===0?'Short sleeve':i%4===3?'Long sleeve':'Not applicable',seasons:i%4===0?['Summer']:i%4===1?['All seasons']:i%4===2?[]:['Winter'],brand:'Maker',material:i===191?'Merino':'Cotton',notes:i===191?'Last unique note':'',pattern:'Solid',fit:'Regular'}));
 const context=vm.createContext({$,closetCategoryOrigin:null,window:{closetBrowseAll:false,closetItemType:'',closetSleeves:null,closetSlotFilter:null,closetTargetSlot:null},rows,render(){},closetSections:[{category:'Tops',label:'Base shirt',slot:'top'},{category:'Bottoms',label:'Bottoms',slot:'bottom'}],outfitSlots:[{id:'top'},{id:'layer'}],slotAllows:(s,x)=>s.id==='layer'?x.itemType==='Sweater':x.category==='Tops',dressMode:false});
 vm.runInContext(taxonomy+'\nconst items=rows.map(normalizeClothing); const closetPageSize136=48;let closetRendered136=48,closetQueryKey136="";',context);
 vm.runInContext(handlers,context);
 const visible=()=>Array.from(vm.runInContext('(function(){'+query+';return visible.map(x=>x.id)})()',context));
 const browsing=()=>{vm.runInContext('(function(){'+title+'})()',context);return !$('closetCollection').hidden;};
 const set=(id,value)=>{$(id).value=value;};
 return {$,set,visible,browsing,win:context.window,rows,context};
}
test('season-only criteria after clearing search retain visible collection and all matching rows',()=>{
 const h=harness();h.set('search','blue');assert.ok(h.browsing());h.set('seasonFilter','Summer');h.set('search','');h.$('search').oninput();assert.equal(h.browsing(),true);assert.equal(h.visible().length,96);
});
test('sleeve-only criteria and combined season stay visible after search clears',()=>{
 const h=harness();h.set('search','sweater');h.set('sleeveFilter','Long sleeve');h.set('search','');h.$('search').oninput();assert.equal(h.browsing(),true);assert.equal(h.visible().length,48);h.set('seasonFilter','Summer');assert.equal(h.visible().length,0);assert.equal(h.browsing(),true);
});
test('whitespace and case plus nonadjacent detail words find one item beyond first page',()=>{
 const h=harness();h.set('search','  MERINO    blue  ');assert.deepEqual(h.visible(),['piece-191']);
});
test('Browse all is a truthful full reset',()=>{
 const h=harness();h.set('search','blue');h.set('seasonFilter','Winter');h.set('sleeveFilter','Long sleeve');h.win.closetSlotFilter='layer';h.$('closetAllPieces').onclick();assert.equal(h.visible().length,192);assert.equal(h.win.closetSlotFilter,null);assert.equal(h.$('search').value,'');assert.equal(h.$('seasonFilter').value,'');assert.equal(h.$('sleeveFilter').value,'');
});
test('slot category search cannot broaden garment eligibility',()=>{
 const h=harness();h.win.closetSlotFilter='layer';h.win.closetTargetSlot='layer';h.set('search','blue');h.$('search').oninput();assert.equal(h.win.closetSlotFilter,'layer');assert.equal(h.visible().length,48);assert.ok(h.visible().every(id=>Number(id.split('-')[1])%4===3));h.set('filter','Bottoms');h.$('filter').onchange();assert.equal(h.win.closetSlotFilter,null);assert.equal(h.visible().length,48);
});
test('category reset returns to clean overview',()=>{
 const h=harness();h.set('search','blue');h.set('seasonFilter','Winter');h.win.closetBrowseAll=true;h.$('closetBack').onclick();assert.equal(h.browsing(),false);assert.equal(h.visible().length,0);assert.equal(h.$('seasonFilter').value,'');
});
test('unknown seasonal details are not fabricated as seasonal matches',()=>{
 const h=harness();h.set('filter','Shoes');h.set('seasonFilter','Winter');assert.equal(h.browsing(),true);assert.deepEqual(h.visible(),[]);
});
test('pagination resets when query or filter changes, without modifying saved records',()=>{
 const h=harness();h.$('closetAllPieces').onclick();assert.equal(h.visible().length,192);
 vm.runInContext('closetRendered136=144',h.context);h.set('search','191');assert.deepEqual(h.visible(),['piece-191']);assert.equal(vm.runInContext('closetRendered136',h.context),48);assert.equal(h.rows.length,192);
});
