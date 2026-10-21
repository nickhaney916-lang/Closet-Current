'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/app.js','utf8');
const code=source.slice(source.indexOf('function waitEvent('),source.indexOf("$('discard').onclick="));
function harness({duration=180,interval='5',rejectFrames=[],beforeEvent=null,owner='owner-1',duplicates=false}={}){
 const listeners=new Map(),calls=[],queued=[],events=[],ui=new Map(),revoked=[];
 const node=id=>{
  if(!ui.has(id))ui.set(id,{value:id==='interval'?interval:'',hidden:false,disabled:false,textContent:'',classList:{add(){},remove(){}}});
  return ui.get(id);
 };
 const video={
  duration,src:'',currentTime:0,paused:false,loaded:0,
  classList:{add(){}},addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
  dispatch(type){const group=[...(listeners.get(type)||[])];for(const fn of group)fn();},
  load(){this.loaded++;if(this.src)queueMicrotask(()=>{beforeEvent?.('loadedmetadata',this,c);this.dispatch('loadedmetadata');});},
  removeAttribute(k){if(k==='src')this.src='';},
  pause(){this.paused=true;}
 };
 let frameNumber=0;
 Object.defineProperty(video,'currentTime',{get(){return this._currentTime||0;},set(t){
  this._currentTime=t;calls.push(t);frameNumber++;
  queueMicrotask(()=>{
   beforeEvent?.('seeked',this,c);
   this.dispatch(rejectFrames.includes(frameNumber)?'error':'seeked');
  });
 }});
 const c={
  video,busy:false,session:0,batch:[],window:{closetAuth:{user:{id:owner}}},
  $:node,Date,Promise,Error,Number,Math,URL:{
   createObjectURL:f=>'blob:video-'+f.name,revokeObjectURL:v=>revoked.push(v)},
  setTimeout,clearTimeout,
  stopCamera(){events.push('stopCamera')},
  controls(v){events.push('controls:'+v)},
  candidate(photo){if(duplicates)return false;c.batch.push({image:photo});c.session++;queued.push(photo);return true;},
  snap(){return 'frame:'+video.currentTime},
  message(msg){events.push('message:'+msg)},
  switchView(v){events.push('view:'+v)},
  render(){events.push('render')}
 };
 vm.createContext(c);vm.runInContext(code,c);
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 return {c,video,ui:node,calls,queued,events,revoked,flush};
}
test('full 3-minute video at 5 seconds samples evenly over the whole clip but never queues more than twenty frames',async()=>{
 const h=harness();await h.c.upload({name:'closet.mp4',size:100000});
 assert.equal(h.queued.length,20);assert.equal(h.calls.length,20);
 assert.ok(h.calls.at(-1)>170,'Samples should cover late clothing without collecting 36 memory-heavy full JPEGs');
 assert.ok(h.calls[1]>5,'The longer recording is sampled at a bounded stride');
 assert.ok(h.events.includes('view:review'));
 assert.equal(h.c.busy,false);assert.equal(h.video.paused,true);
 assert.deepEqual(h.revoked,['blob:video-closet.mp4']);
});
test('short videos still sample one frame; ordinary 30s clip keeps chosen five-second cadence',async()=>{
 const a=harness({duration:2});await a.c.upload({name:'tiny.mp4',size:100});
 assert.deepEqual(a.calls,[.1]);assert.equal(a.queued.length,1);
 const b=harness({duration:30});await b.c.upload({name:'short.mp4',size:100});
 assert.deepEqual(b.calls,[.1,5.1,10.1,15.1,20.1,25.1]);assert.equal(b.queued.length,6);
});
test('invalid interval is safely bounded and cannot create a tight seek loop',async()=>{
 const h=harness({interval:'0',duration:180});await h.c.upload({name:'invalid-setting.mp4',size:100});
 assert.equal(h.calls.length,20);assert.ok(h.calls.at(-1)>170);
});
test('duplicate frames do not pretend new clothing is ready for review',async()=>{
 const h=harness({duration:15,duplicates:true});await h.c.upload({name:'repeated.mp4',size:100});
 assert.equal(h.queued.length,0);assert.ok(!h.events.some(x=>x.startsWith('view:')));
 assert.ok(h.events.some(x=>x.includes('No new video frames were added')));
});
test('reject account switching before metadata completes without capturing old-owner frames',async()=>{
 const h=harness({beforeEvent:(evt,video,c)=>{if(evt==='loadedmetadata')c.window.closetAuth.user.id='owner-2';}});
 await h.c.upload({name:'private.mp4',size:100});
 assert.equal(h.queued.length,0);assert.equal(h.calls.length,0);
 assert.ok(h.events.some(x=>x.includes('account change')));
 assert.ok(!h.events.some(x=>x.startsWith('view:')));
 assert.equal(h.c.busy,false);assert.equal(h.video.paused,true);
});
test('owner switch between seek start and decoded frame halts all subsequent captures',async()=>{
 const h=harness({duration:30,beforeEvent:(evt,video,c)=>{if(evt==='seeked'&&h.calls.length===2)c.window.closetAuth.user.id='owner-2';}});
 await h.c.upload({name:'switch.mp4',size:100});
 assert.equal(h.queued.length,1,'Only the first original-owner frame can be queued');
 assert.equal(h.calls.length,2,'No later frame seeks');
 assert.ok(!h.events.some(x=>x.startsWith('view:')));
 assert.equal(h.revoked.length,1);
});
test('recover earlier frames when later video seeking fails without declaring all frames saved',async()=>{
 const h=harness({duration:25,rejectFrames:[3]});
 await h.c.upload({name:'bad-third-seek.mp4',size:100});
 assert.equal(h.queued.length,2);assert.equal(h.calls.length,3);
 assert.ok(h.events.some(x=>x.includes('2 images recovered')));
 assert.ok(h.events.includes('view:review'));
 assert.equal(h.revoked.length,1);
});
test('invalid metadata and oversized media fail before queue or release temporary media correctly',async()=>{
 const first=harness({duration:Infinity});
 await first.c.upload({name:'unknown.mp4',size:100});
 assert.equal(first.calls.length,0);assert.ok(first.events.some(x=>x.includes('duration could not be read')));
 assert.equal(first.revoked.length,1);
 const huge=harness();
 await huge.c.upload({name:'large.mov',size:151*1024*1024});
 assert.equal(huge.calls.length,0);assert.equal(huge.revoked.length,0);
 assert.ok(huge.events.some(x=>x.includes('smaller than 150 MB')));
});
test('must be authenticated before processing video and no object URL is created',async()=>{
 const h=harness({owner:null});await h.c.upload({name:'private.mp4',size:100});
 assert.equal(h.calls.length,0);assert.equal(h.revoked.length,0);
 assert.ok(h.events.some(x=>x.includes('Sign in')));
});
