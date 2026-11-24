'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public/app.js','utf8');
const extract=(start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,'source anchors');return source.slice(a,b);};
const loader=extract('async function enableLocal(', 'function segmentationAllows(');
const reviewer=extract('async function reviewRecognitionMemory(', 'closetReady.then(scheduleMemoryReview)');
const surfaces=extract('function refreshRecognitionMemorySurfaces(', 'function render(){');
function setup(){
 const events=[],nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);};
 const c={events,localReady:false,localLoadPromise:null,captureOperationEpoch:1,
  recognitionState:{phase:'idle'},recognitionUnavailable:false,recordDeviceEvent(){},
  scheduleMemoryReview(){},localRequest:async type=>{events.push(type);return {recognitionMemory:'valid'};},
  render(){events.push('full');},refreshRecognitionMemorySurfaces(){events.push('scoped');},
  renderRecognitionNotice(){events.push('notice');},startupWardrobeRecoveryCount:0,
  renderStartupWardrobeRecovery(){events.push('recovery');},$:get,batch:[{id:'draft'}],
  items:[{id:'saved',category:'Tops',itemType:'Polo',color:'Blue',confirmedDetails:true,image:'original'}],
  session:1,sessionCapturedIds:new Set(['saved']),renderPhotoResults(node,rows){events.push(['photos',rows.map(x=>x.id).join(',')]);},
  db:{},memoryReviewRunning:false,busy:false,automaticRunning:false,localPending:new Set(),
  document:{hidden:false,querySelector:()=>null},ClothingMemory:{week:()=>12,valid:x=>x==='valid'},
  memoryReviewOwnerLease:()=>({current:()=>c.ownerCurrent}),ownerCurrent:true,
  segmentationAllows:()=>true,ClothingDetails:{recognizedFields:()=>({})},
  saveMemoryReview:async value=>value,memoryReviewTimer:null,setTimeout:()=>1};
 vm.createContext(c);vm.runInContext(loader+'\n'+reviewer,c);
 return c;
}
test('foreground scanner loading keeps full UI refresh',async()=>{const c=setup();await c.enableLocal();assert.deepEqual(c.events,['full','load','full']);assert.equal(c.recognitionState.phase,'ready');});
test('background scanner loading updates scoped surfaces only',async()=>{const c=setup();await c.enableLocal({backgroundMemory:true});assert.deepEqual(c.events,['scoped','load','scoped']);assert.equal(c.localReady,true);});
test('actual weekly review keeps source, updates evidence and never fully renders',async()=>{const c=setup();await c.reviewRecognitionMemory();assert.deepEqual(c.events,['scoped','load','scoped','features','scoped']);assert.equal(c.items[0].image,'original');assert.equal(c.items[0].recognitionMemory,'valid');assert.equal(c.items[0].learningReviewedWeek,12);assert.equal(c.memoryReviewRunning,false);});
test('revoked weekly completion cannot refresh newer owner UI',async()=>{const c=setup();c.localReady=true;c.localRequest=async()=>{c.ownerCurrent=false;return {recognitionMemory:'valid'};};await c.reviewRecognitionMemory();assert.deepEqual(c.events,[]);assert.equal(c.items[0].recognitionMemory,undefined);});
test('actual scoped surface helper updates counts, notice and both review grids without touching closet grid',()=>{const c=setup();vm.runInContext(surfaces,c);c.refreshRecognitionMemorySurfaces();assert.deepEqual(c.events,['notice',['photos','draft,saved'],['photos','draft,saved']]);assert.equal(c.$('closetCount').textContent,1);assert.equal(c.$('reviewCount').textContent,1);});
test('recovery remains fail closed',()=>{const c=setup();vm.runInContext(surfaces,c);c.startupWardrobeRecoveryCount=1;c.refreshRecognitionMemorySurfaces();assert.deepEqual(c.events,['recovery']);});
