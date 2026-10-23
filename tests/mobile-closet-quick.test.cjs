const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('public/mobile-closet-quick.js','utf8');
function fixture(){
 const handlers={};
 function make(tag){
  return {tag,children:[],dataset:{},attributes:{},className:'',textContent:'',
   setAttribute(k,v){this.attributes[k]=v;},
   append(...items){this.children.push(...items);},
   addEventListener(type,fn){handlers[this.dataset.closetQuick+':'+type]=fn;}
  };
 }
 const root={window:{},document:{createElement:make,createDocumentFragment:()=>make('#fragment')}};
 vm.createContext(root);vm.runInContext(source,root);
 const container={ownerDocument:root.document,replaceChildren(fragment){this.children=fragment.children;}};
 return {component:root.window.MobileClosetQuick,container,handlers};
}
const wardrobe=[
 {id:'shirt-a',category:'Tops',image:'original-a'},
 {id:'shirt-b',category:'Tops',image:'original-b'},
 {id:'pants',category:'Bottoms',image:'original-c'},
 {id:'shorts',category:'Bottoms',image:'original-d'},
 {id:'shoes',category:'Shoes',image:'original-e'},
 {id:'dress',category:'Dresses',image:'original-f'},
 {id:'unindexed',category:'Uncategorized',image:'original-g'}
];
test('quick closet categories count saved clothing without touching images or source metadata',()=>{
 const {component}=fixture(),before=JSON.stringify(wardrobe),out=component.summarize(wardrobe);
 assert.deepEqual(Array.from(out,x=>x.label),['Shirts','Pants','Shoes','Dresses']);
 assert.deepEqual(Array.from(out,x=>x.count),[2,2,1,1]);
 assert.equal(out[1].hint,'Pants, shorts & skirts');
 assert.equal(JSON.stringify(wardrobe),before);
});
test('quick tiles provide clear accessible names, counts and category browse callbacks',()=>{
 const {component,container,handlers}=fixture(),selected=[];
 assert.equal(component.render(container,wardrobe,category=>selected.push(category)),true);
 assert.equal(container.children.length,4);
 for(const tile of container.children){
  assert.equal(tile.type,'button');
  assert.equal(tile.attributes['aria-controls'],'closetCollection');
  assert.match(tile.attributes['aria-label'],/piece/);
  assert.ok(tile.children[1].textContent);
  assert.ok(tile.children[2].textContent);
 }
 handlers['shoes:click']();handlers['pants:click']();
 assert.deepEqual(selected,['Shoes','Bottoms']);
});
test('empty wardrobe still shows all four discoverable tiles with count 0',()=>{
 const {component,container}=fixture();
 component.render(container,[],()=>{});
 assert.equal(container.children.length,4);
 assert.ok(container.children.every(x=>x.children[2].textContent==='0 pieces'));
 assert.deepEqual(Array.from(component.summarize(null),x=>x.count),[0,0,0,0]);
});
test('mobile shortcuts never need storage, network, recognition, original photos or a 3D renderer',()=>{
 assert.doesNotMatch(source,/fetch\(|indexedDB|supabase|cloudBackup|localStorage|originalPhoto|WebGL|recognition/i);
 const html=fs.readFileSync('public/index.html','utf8');
 const app=fs.readFileSync('public/app.js','utf8');
 assert.match(html,/id="closetQuickCategories"/);
 assert.match(html,/id="captureAnnouncement"[^>]*role="status"/);
 assert.match(html,/id="interval"><option value="5" selected>/);
 assert.match(html,/id="startAuto"[^>]*>Auto · every 5 seconds/);
 assert.ok(html.indexOf('mobile-closet-quick.js')<html.indexOf('closet-browser.js'));
 assert.match(app,/function announceCapture\(text\)/);
 assert.match(app,/mobile-adjust-reference/);
});
