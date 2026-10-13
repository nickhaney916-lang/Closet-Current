const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
async function setup(saved=new Map(),available=true){
 const elements=new Map();function node(tag,text){return {tag,text,children:[],append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},setAttribute(){},click(){}};}
 const get=id=>{if(!elements.has(id))elements.set(id,node('div'));return elements.get(id);};let timer=0;
 const c={$:get,node,closetReady:Promise.resolve(),recognitionAssetVersion:'abc123abc123',navigator:{userAgent:'Android'},confirm:()=>true,clearTimeout(){},setTimeout:()=>++timer,queued:work=>work(),Blob,URL:{createObjectURL(blob){c.exported=blob;return 'blob:local-test';},revokeObjectURL(){}},switchView(view){c.view=view;},db:{transaction(){const tx={objectStore:()=>({put(value){saved.set(value.id,JSON.parse(JSON.stringify(value)));},get(id){const r={result:saved.get(id)};setImmediate(()=>r.onsuccess());return r;}})};setImmediate(()=>tx.oncomplete?.());return tx;}}};
 if(!available)c.db=undefined;
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/device-check-engine.js','utf8'),c);vm.runInContext(fs.readFileSync('public/device-check.js','utf8'),c);await new Promise(setImmediate);await new Promise(setImmediate);return {c,get,saved};
}
test('device recording is opt-in, stops on request, and exports sanitized local data',async()=>{
 const {c,get,saved}=await setup();c.recordDeviceEvent('photo_queued',{image:'private-image'});get('downloadDeviceCheck').onclick();assert.equal(JSON.parse(await c.exported.text()).events.length,0);
 await get('startDeviceCheck').onclick();c.recordDeviceEvent('scanner_error',{stage:'identify',code:'runtime',image:'private-image',email:'private-email'});await get('stopDeviceCheck').onclick();assert.equal(saved.get('device-check').enabled,false);
 c.recordDeviceEvent('photo_queued');get('downloadDeviceCheck').onclick();const report=JSON.parse(await c.exported.text());assert.equal(report.events.length,1);assert.equal(report.events[0].code,'runtime');assert.ok(!JSON.stringify(report).includes('private-'));
});
test('manual checks survive returning to the same browser and recording stays off after stopping',async()=>{
 const a=await setup();await a.get('startDeviceCheck').onclick();await a.get('deviceCheckSteps').children[0].children[2].children[0].onclick();await a.get('stopDeviceCheck').onclick();const b=await setup(a.saved);b.get('downloadDeviceCheck').onclick();const report=JSON.parse(await b.c.exported.text());assert.equal(report.steps.login,'pass');assert.match(b.get('deviceCheckSummary').textContent,/recording is off/);
});

test('unavailable device storage offers a report instead of falsely claiming test results were saved',async()=>{
 const {get,c}=await setup(new Map(),false);await get('startDeviceCheck').onclick();assert.match(get('deviceCheckStatus').textContent,/open session/);get('downloadDeviceCheck').onclick();assert.equal(JSON.parse(await c.exported.text()).format,'closet-current-device-check');
});
