import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const app=readFileSync(process.env.RECOGNITION_SOURCE||'public/app.js','utf8');
const a=app.indexOf('async function recognizeItem(item){'),b=app.indexOf('async function recognizeBatch(){',a);
assert.ok(a>=0&&b>a);
const red=process.env.RECOGNITION_EXPECT_RED==='1';
const cases=['quality-color','loading-category','inference-type','inference-crop','inference-owner-review','worker-rejection','valid'];
for(const kind of cases)test('review revision '+kind,async()=>{
 const item={id:'one',ownerId:'A',name:'Blue shirt',category:'Tops',itemType:'T-shirt',color:'Blue',image:'original',originalPhoto:{image:'original',sha256:'sha'},sourceSHA256:'sha'};
 let persists=0,saves=0,applies=0,workerCalls=0;
 const change=()=>{
  if(kind==='quality-color')item.color='Red';
  if(kind==='loading-category')item.category='Bottoms';
  if(kind==='inference-type')item.itemType='Blouse';
  if(kind==='inference-crop')item.recognitionPhoto={image:'new-crop'};
  if(kind==='inference-owner-review')item.ownerSourceReview88={approved:true};
  if(kind==='worker-rejection')item.color='Green';
 };
 const c={item,structuredClone,Date,batch:[item],items:[],captureOperationEpoch:0,
 recognitionState:{activeId:null,phase:'ready'},localPending:new Set([item.id]),
 recognitionUnavailable:false,localReady:kind!=='loading-category',render(){},message(){},$:()=>({}),
 checkPhoto:async()=>{if(kind==='quality-color')change();return {blank:false,colorEstimate:'Yellow',signature:'sig',aspect:1}},
 ClothingDetails:{fillColor:()=>({color:'Yellow'}),fill:()=>({color:'Yellow'})},
 similarPhotos:()=>false,enableLocal:async()=>{change();c.localReady=true},
 localRequest:async()=>{workerCalls++;if(kind.startsWith('inference')||kind==='worker-rejection')change();if(kind==='worker-rejection')throw Error('controlled old failure');return {strong:true,choices:[{category:'Tops',itemType:'Sweatshirt'}],details:{}}},
 segmentationAllows:()=>true,applyLocalChoice:(x,y)=>{applies++;Object.assign(x,y)},
 saveIndexed:async()=>{saves++;return true},persistDraft:async()=>{persists++;return true}};
 vm.createContext(c);vm.runInContext(app.slice(a,b),c);
 await c.recognizeItem(item);
 assert.equal(item.originalPhoto.image,'original');
 assert.equal(c.localPending.size,0);assert.equal(c.recognitionState.activeId,null);
 if(kind==='valid'){assert.equal(saves,1);assert.equal(applies,1);assert.equal(item.itemType,'Sweatshirt');return}
 if(red){assert.ok(saves+persists+applies>0,'baseline must publish stale work');return}
 assert.equal(saves+persists+applies,0);assert.equal(c.recognitionUnavailable,false);
 if(kind==='quality-color')assert.equal(item.color,'Red');
 if(kind==='loading-category'){assert.equal(item.category,'Bottoms');assert.equal(workerCalls,0)}
 if(kind==='inference-type')assert.equal(item.itemType,'Blouse');
 if(kind==='inference-crop')assert.equal(item.recognitionPhoto.image,'new-crop');
 if(kind==='inference-owner-review')assert.equal(item.ownerSourceReview88.approved,true);
 if(kind==='worker-rejection')assert.equal(item.color,'Green');
});
