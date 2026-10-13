const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public/app.js','utf8');
function setup(){
 const names=['home','scan','closet','stylist','builder','trends','review'];
 const elements=Object.fromEntries(names.map(id=>[id,{id,hidden:id!=='home',classList:{contains:()=>true}}]));
 const tabs=names.map(view=>({dataset:{view},attributes:{},classList:{toggle(){}},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}}));
 const more={open:true,classList:{toggle(k,v){more.active=v;}}};
 const c={stream:null,cameraOpening:false,render(){},stopCamera(){c.stopped=true;c.stream=null;},$:()=>more,document:{getElementById:id=>elements[id],querySelectorAll:selector=>selector==='.view'?Object.values(elements):tabs}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function switchView('),source.indexOf("document.querySelectorAll('.tab').forEach(b=>")),c);return {c,elements,tabs,more};
}
test('every existing feature remains reachable with one visible view and correct navigation state',()=>{
 const {c,elements,tabs,more}=setup();for(const view of ['home','scan','closet','stylist','builder','trends','review']){more.open=true;c.switchView(view);assert.deepEqual(Object.values(elements).filter(x=>!x.hidden).map(x=>x.id),[view]);assert.equal(tabs.find(x=>x.dataset.view===view).attributes['aria-current'],'page');assert.equal(more.open,false);assert.equal(more.active,['builder','trends','review'].includes(view));}
});
test('navigation stops a camera before opening another feature',()=>{
 const {c}=setup();c.stream={};c.switchView('home');assert.equal(c.stopped,true);
});
test('invalid navigation leaves the active screen and camera untouched',()=>{
 const {c,elements}=setup();c.stream={};c.switchView('unknown');assert.equal(c.stopped,undefined);assert.equal(elements.home.hidden,false);
});
