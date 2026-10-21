'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const text=fs.readFileSync('public/trends.js','utf8');
const source=[
 text.slice(text.indexOf("let inspirationLooks="),text.indexOf("function trendSelect(")),
 text.slice(text.indexOf("function loadLook("),text.indexOf("function renderSavedLooks(")),
 text.slice(text.indexOf("$('newLook').onclick="),text.indexOf("$('lookImage').onchange=")),
 text.slice(text.indexOf("$('lookImage').onchange="),text.indexOf("for(const season of clothingSchema.seasons.slice(0,4))")),
 text.slice(text.indexOf("$('referenceToCloset').onclick="),text.indexOf("async function reloadCloudLooks("))
].join('\n');
function harness(){
 const elements=new Map(),queued=[],views=[],messages=[],readFiles=[],released=[];
 const pending=new Map();
 const $=id=>{if(!elements.has(id))elements.set(id,{
  hidden:true,disabled:false,value:'',textContent:'',src:'',files:[],
  style:{},append(){},replaceChildren(){}
 });return elements.get(id);};
 const c={
  $,window:{closetAuth:{user:{id:'one'}}},busy:false,Promise,Error,Math,
  URL:{createObjectURL:f=>'blob:'+f.name,revokeObjectURL:u=>released.push(u)},
  Image:class {
   set src(url){this._url=url;}
   async decode(){return pending.get(this._url)?.promise;}
   get width(){return 4032;}
   get height(){return 3024;}
  },
  document:{createElement(){return {width:0,height:0,getContext(){return {drawImage(){}}},toDataURL(){return 'data:image/jpeg;base64,TINY_PREVIEW';}}}},
  clearTimeout, setTimeout,
  photoToJPEG:async file=>{readFiles.push(file);if(c.encodeDelay)return await c.encodeDelay;return 'data:image/jpeg;base64,FULL_SOURCE';},
  candidate:image=>{queued.push(image);return c.accept!==false;},
  switchView:view=>views.push(view),
  message:msg=>messages.push(msg),
  parseOutfit:()=>[],renderLookPieces(){},renderTrendMatches(){},renderSavedLooks(){},
  clothingSchema:{seasons:[]},crypto:{randomUUID:()=> 'uuid'},structuredClone,
 };
 vm.createContext(c);vm.runInContext(source,c);
 function file(name,size=500000){const f={name,size,type:'image/jpeg'};let resolve;
  const promise=new Promise(r=>resolve=r);
  pending.set('blob:'+name,{promise,resolve});return f;
 }
 async function select(f,{decode=true}={}){
  const el=$('lookImage');el.files=[f];const task=el.onchange({target:el});if(decode)pending.get('blob:'+f.name).resolve();
  await task;return task;
 }
 return {c,$,file,select,queued,views,messages,readFiles,released,pending};
}
test('single garment from inspiration transfers through original-first import encoder, never the 900px preview',async()=>{
 const h=harness(),input=h.file('sneaker.jpg');await h.select(input);
 assert.equal(h.$('inspirationPreview').src,'data:image/jpeg;base64,TINY_PREVIEW');
 assert.equal(h.$('referenceToCloset').hidden,false);
 await h.$('referenceToCloset').onclick();
 assert.deepEqual(h.readFiles,[input]);
 assert.deepEqual(h.queued,['data:image/jpeg;base64,FULL_SOURCE']);
 assert.deepEqual(h.views,['review']);
 assert.ok(h.messages.at(-1).includes('Original-resolution'));
 assert.deepEqual(h.released,['blob:sneaker.jpg']);
});
test('saved inspiration can show thumbnail without a retained high-resolution source File',async()=>{
 const h=harness(),input=h.file('shirt.jpg');await h.select(input);
 vm.runInContext("loadLook({id:'old-look',title:'My saved look',sourceUrl:'',description:'',season:'',size:'',budget:0,pieces:[],image:'data:image/jpeg;base64,PREVIEW_ONLY'})",h.c);
 assert.equal(h.$('referenceToCloset').hidden,true);
 assert.equal(vm.runInContext('lookOriginalFile',h.c),null);
 await h.$('referenceToCloset').onclick();
 assert.deepEqual(h.queued,[]);
 assert.match(h.messages.at(-1),/Choose the original clothing photo again/);
});
test('a stale first image decode cannot replace a newer selection',async()=>{
 const h=harness(),a=h.file('first.jpg'),b=h.file('second.jpg');
 const el=h.$('lookImage');el.files=[a];const slow=el.onchange({target:el});
 el.files=[b];const fast=el.onchange({target:el});h.pending.get('blob:second.jpg').resolve();await fast;
 h.pending.get('blob:first.jpg').resolve();await slow;
 assert.equal(vm.runInContext('lookOriginalFile',h.c),b);
 await h.$('referenceToCloset').onclick();
 assert.deepEqual(h.readFiles,[b]);assert.equal(h.queued.length,1);
});
test('switching accounts between photo selection and Add to Closet clears private source and does not queue',async()=>{
 const h=harness();await h.select(h.file('personal.jpg'));
 h.c.window.closetAuth.user.id='different';
 await h.$('referenceToCloset').onclick();
 assert.deepEqual(h.readFiles,[]);assert.deepEqual(h.queued,[]);
 assert.equal(vm.runInContext('lookOriginalFile',h.c),null);
 assert.equal(h.$('referenceToCloset').hidden,true);
});
test('account switch while original photo is being encoded does not cross-owner queue',async()=>{
 const h=harness();await h.select(h.file('private.jpg'));
 let settle;h.c.encodeDelay=new Promise(resolve=>settle=resolve);
 const task=h.$('referenceToCloset').onclick();h.c.window.closetAuth.user.id='different';
 settle('data:image/jpeg;base64,OLD_ACCOUNT');await task;
 assert.deepEqual(h.queued,[]);assert.deepEqual(h.views,[]);
 assert.equal(h.$('referenceToCloset').disabled,false);
});
test('changing photos while the high-resolution JPEG is pending cannot save the stale original',async()=>{
 const h=harness();await h.select(h.file('old.jpg'));
 let settle;h.c.encodeDelay=new Promise(resolve=>settle=resolve);
 const transfer=h.$('referenceToCloset').onclick();
 const newer=h.file('new.jpg');const el=h.$('lookImage');el.files=[newer];
 const upload=el.onchange({target:el});h.pending.get('blob:new.jpg').resolve();await upload;
 settle('data:image/jpeg;base64,OLD');await transfer;
 assert.deepEqual(h.queued,[]);
 assert.equal(vm.runInContext('lookOriginalFile',h.c),newer);
});
test('repeated Add taps cannot queue twice and duplicate rejection cannot navigate as a successful import',async()=>{
 const h=harness();await h.select(h.file('dress.jpg'));
 let settle;h.c.encodeDelay=new Promise(resolve=>settle=resolve);
 const first=h.$('referenceToCloset').onclick();
 await h.$('referenceToCloset').onclick();
 settle('data:image/jpeg;base64,FULL');await first;
 assert.equal(h.queued.length,1);assert.deepEqual(h.views,['review']);
 h.c.encodeDelay=null;h.c.accept=false;
 await h.$('referenceToCloset').onclick();
 assert.equal(h.views.length,1,'Duplicate path does not pretend a new photo was added');
});
test('broken full-resolution decoding does not silently queue low-resolution inspiration thumbnail',async()=>{
 const h=harness();await h.select(h.file('boot.jpg'));
 h.c.photoToJPEG=async()=>{throw Error('unsupported codec');};
 await h.$('referenceToCloset').onclick();
 assert.deepEqual(h.queued,[]);assert.deepEqual(h.views,[]);
 assert.match(h.messages.at(-1),/Could not open the original photo/);
 assert.equal(h.$('referenceToCloset').disabled,false);
});
test('New Look and Example Look discard old high-resolution source and disable transfer',async()=>{
 const h=harness();await h.select(h.file('original.jpg'));
 h.$('newLook').onclick();assert.equal(vm.runInContext('lookOriginalFile',h.c),null);
 assert.equal(h.$('referenceToCloset').hidden,true);
 await h.select(h.file('another.jpg'));
 h.$('exampleLook').onclick();assert.equal(vm.runInContext('lookOriginalFile',h.c),null);
 assert.equal(h.$('referenceToCloset').hidden,true);
});
