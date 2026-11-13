'use strict';
// P854 source-executed function from the actual Mission 1 app.
// Every JPEG, mask, model response and owner object in this file is synthetic.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
const a=app.indexOf('async function recognizeItem(item){');
const b=app.indexOf('async function recognizeBatch(){',a);
assert.ok(a>=0&&b>a,'real app source is required');
const source=app.slice(a,b);
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function fixture({qualityStage=false,blank=false}={}){
 const item={id:'draft-854',image:'data:image/jpeg;base64,AAE=',recognitionPhoto:{image:'data:image/jpeg;base64,AAI='},
 segmentHint:{categories:['Tops'],types:[],clipped:false},category:'Uncategorized',itemType:'Unknown',color:'Unknown',
 userAdjusted:false,localAnalyzed:false,name:''};
 const owner={id:'owner-A'},database={name:'closet-current-user-owner-A'},quality=deferred(),model=deferred(),
  enteredQuality=deferred(),enteredModel=deferred(),logs={render:0,persist:0,requests:[],saves:0,messages:[]};
 const scope={
  window:{closetAuth:{user:owner}},db:database,batch:[item],items:[],recognitionState:{phase:'idle',activeId:null},
  photoQualityHints73:new Map(),localPending:new Set([item.id]),localReady:true,recognitionUnavailable:false,
  ClothingDetails:{fillColor(v,color){return {color:color?'Blue':'Unknown'};},fill(v){return {};}},recordDeviceEvent(){},
  checkPhoto(image){logs.requests.push(['photo',image]);enteredQuality.resolve();return quality.promise;},
  localRequest(type,image,id,hint){logs.requests.push([type,image,id,hint]);enteredModel.resolve();return model.promise;},
  render(){logs.render++;},persistDraft(){logs.persist++;},message(value){logs.messages.push(value);},
  $(){return {textContent:''};},similarPhotos(){return false;},segmentationAllows(){return true;},
  applyLocalChoice(v,c){v.category=c.category;v.itemType=c.itemType;},
  enableLocal(){return Promise.resolve(true);},reviewFirst836:true,
  normalizeClothing(v){return v;},automaticAdmissionCore842(){return false;},
  saveIndexed(){logs.saves++;return Promise.resolve(false);},
  localStatus:{textContent:''},
 };
 const fn=vm.runInNewContext(source+'\nrecognizeItem',scope);
 const outcome={fn,item,owner,database,scope,quality,model,enteredQuality,enteredModel,logs};
 outcome.qualityResult={blank,captureGuidance:null,colorEstimate:{primary:'Blue'},signature:Array(768).fill(44),aspect:.6};
 outcome.modelResult={strong:false,categoryConfirmed:false,choices:[],reason:'untrusted model confidence'};
 return outcome;
}
test('P854 source-exec: normal current owner and original may finish as UNSAVED owner-review draft',async()=>{
 const t=fixture();const running=t.fn(t.item);
 await t.enteredQuality.promise;t.quality.resolve(t.qualityResult);
 await t.enteredModel.promise;t.model.resolve(t.modelResult);
 assert.equal(await running,true);
 assert.equal(t.item.localAnalyzed,true);assert.equal(t.scope.batch.length,1);
 assert.equal(t.logs.saves,0);assert.ok(t.logs.persist>0);
 assert.equal(t.scope.localPending.has(t.item.id),false);
});
test('P854 blank-photo response cannot discard a recropped source while checkPhoto awaits',async()=>{
 const t=fixture({blank:true});const running=t.fn(t.item);
 await t.enteredQuality.promise;
 t.item.image='data:image/jpeg;base64,NEW-CROP';
 t.quality.resolve({...t.qualityResult,blank:true});
 assert.equal(await running,false);
 assert.equal(t.scope.batch.length,1);
 assert.equal(t.item.image,'data:image/jpeg;base64,NEW-CROP');
 assert.equal(t.logs.messages.length,0);assert.equal(t.logs.saves,0);
 assert.equal(t.logs.requests.length,1,'stale photo never reaches classifier');
});
test('P854 checkPhoto result cannot land after a changed original recognition-photo source',async()=>{
 const t=fixture();const running=t.fn(t.item);
 await t.enteredQuality.promise;
 t.item.recognitionPhoto.image='data:image/jpeg;base64,DIFFERENT-ORIGINAL';
 t.quality.resolve(t.qualityResult);
 assert.equal(await running,false);
 assert.equal(t.item.localAnalyzed,false);assert.equal(t.scope.photoQualityHints73.size,0);
 assert.equal(t.logs.requests.length,1);
});
test('P854 rejects worker classification results after a mask change while preserving draft',async()=>{
 const t=fixture();const running=t.fn(t.item);
 await t.enteredQuality.promise;t.quality.resolve(t.qualityResult);
 await t.enteredModel.promise;
 t.item.segmentHint.categories.push('Shoes');
 t.model.resolve({...t.modelResult,strong:true,choices:[{category:'Shoes',itemType:'Boots'}]});
 assert.equal(await running,false);
 assert.equal(t.item.localAnalyzed,false);assert.equal(t.item.category,'Uncategorized');
 assert.equal(t.scope.batch.length,1);assert.equal(t.logs.saves,0);
});
test('P854 changed owner and DB during worker awaiting does not write old draft to new signed account',async()=>{
 const t=fixture();const running=t.fn(t.item);
 await t.enteredQuality.promise;t.quality.resolve(t.qualityResult);
 await t.enteredModel.promise;
 const newOwner={id:'owner-B'};
 t.scope.window.closetAuth.user=newOwner;
 t.scope.db={name:'closet-current-user-owner-B'};
 t.scope.batch=[{...t.item,id:t.item.id,image:'data:image/jpeg;base64,OTHER-USER'}];
 t.scope.localPending.add(t.item.id);
 t.model.resolve({...t.modelResult,strong:true,choices:[{category:'Tops',itemType:'T-shirt'}]});
 assert.equal(await running,false);
 assert.equal(t.logs.persist,0,'no old-owner draft snapshot written into new owner store');
 assert.equal(t.scope.batch.length,1);assert.equal(t.logs.saves,0);
 assert.equal(t.scope.localPending.has(t.item.id),true,'no clearing a different owner same-ID job');
});
test('P854 replacing draft with same ID revokes old scanner output and preserves replacement source',async()=>{
 const t=fixture();const running=t.fn(t.item);
 await t.enteredQuality.promise;t.quality.resolve(t.qualityResult);
 await t.enteredModel.promise;
 const replacement={...t.item,image:'data:image/jpeg;base64,REPLACEMENT'};
 t.scope.batch=[replacement];
 t.model.resolve(t.modelResult);
 assert.equal(await running,false);
 assert.equal(replacement.localAnalyzed,false);
 assert.equal(t.logs.saves,0);
});
test('P854 stale recognition error does not claim new owner scanner failed or produce misleading error message',async()=>{
 const t=fixture();const running=t.fn(t.item);
 await t.enteredQuality.promise;t.quality.resolve(t.qualityResult);
 await t.enteredModel.promise;
 t.scope.window.closetAuth.user={id:'owner-B'};
 t.scope.db={name:'closet-current-user-owner-B'};
 t.model.reject(Error('Old owner worker crashed'));
 assert.equal(await running,false);
 assert.equal(t.scope.recognitionUnavailable,false);
 assert.equal(t.logs.messages.length,0);
 assert.equal(t.logs.persist,0);
});
test('P854 mismatched owner DB never initiates an original-JPEG scan',async()=>{
 const t=fixture();t.scope.db={name:'closet-current-user-owner-B'};
 assert.equal(await t.fn(t.item),false);
 assert.equal(t.logs.requests.length,0);
 assert.equal(t.logs.persist,0);
});
test('P854 preexisting original photo review, shoe pairing, color and learning consent remain mandatory',()=>{
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/function learningScope72\(/);
 assert.match(app,/P849_CHANGED_CANDIDATE_OR_OWNER/);
 assert.match(app,/function unit70OwnerEvidenceValid\(/);
 assert.match(app,/reviewQueue850\.keepForLater/);
 assert.match(app,/const live854=\(\)=>sameOwner854\(\)/);
 assert.match(app,/result=await localRequest\('classify',source73,item.id,item.segmentHint\)/);
 assert.match(app,/if\(!live854\(\)\)return false/);
});
