import test from 'node:test';import assert from 'node:assert/strict';
import {lockPhotoLabels,phonePhotoResult,photoFailure,scorePhonePhotos} from '../public/phone-photo-benchmark.mjs';
import {photoTestSession} from '../public/photo-test-session.mjs';

test('phone labels are independently supplied, category-consistent and copied before inference',()=>{
 const input=[{category:'Shoes',type:'Sneakers',filename:'private.jpeg'},{category:'Dresses',type:''}];
 const labels=lockPhotoLabels(input);input[0].category='Tops';
 assert.equal(labels[0].expectedCategory,'Shoes');assert.equal(labels[1].expectedType,null);assert.equal(labels[0].id,'photo-001');assert.equal(labels[0].filename,undefined);
 assert.throws(()=>lockPhotoLabels([{category:''}]),/category/);
 assert.throws(()=>lockPhotoLabels([{category:'Shoes',type:'Casual dress'}]),/matching/);
 assert.throws(()=>lockPhotoLabels(Array(21).fill({category:'Tops'})),/20/);
});
test('phone scoring distinguishes category review, wrong automatic subtypes, negatives and runtime failures',()=>{
 const labels=lockPhotoLabels([{category:'Dresses',type:'Casual dress'},{category:'Shoes',type:'Sneakers'},{category:'Uncategorized'},{category:'Tops'}]);
 const results=[phonePhotoResult(labels[0].id,{strong:false,categoryConfirmed:true,choices:[{category:'Dresses',itemType:'Unknown'}]},10),phonePhotoResult(labels[1].id,{strong:true,choices:[{category:'Shoes',itemType:'Ankle boots'}]},20),phonePhotoResult(labels[2].id,{strong:false,choices:[]},30),photoFailure(labels[3].id,'network')];
 const report=scorePhonePhotos(labels,results);assert.equal(report.summary.categoryMatches,2);assert.equal(report.summary.typeMatches,0);assert.equal(report.summary.review,1);assert.equal(report.summary.incorrectAutomaticTypes,1);assert.equal(report.summary.negativeRejected,1);assert.equal(report.summary.errors,1);
});
test('export excludes private filenames, data URLs, notes, credentials and arbitrary diagnostic text',()=>{
 const labels=lockPhotoLabels([{category:'Tops',type:'T-shirt'}]);labels[0].filename='PRIVATE_FILENAME';labels[0].notes='PRIVATE_NOTE';
 const result=phonePhotoResult(labels[0].id,{strong:true,choices:[{category:'Tops',itemType:'T-shirt',notes:'PRIVATE_NOTE'}],image:'data:image/jpeg;base64,PRIVATE_IMAGE',token:'PRIVATE_TOKEN',reason:'PRIVATE_REASON',diagnostics:{category:[{category:'Tops',score:.9,filename:'PRIVATE_FILENAME'},{category:'PRIVATE_SECRET',score:.7}],extra:'PRIVATE_EMAIL'}},20);
 const report=scorePhonePhotos(labels,[result],{release:'a'.repeat(12),indexHash:'b'.repeat(64)});
 assert.ok(!JSON.stringify(report).includes('PRIVATE_'));assert.ok(!JSON.stringify(report).includes('data:image'));
 assert.deepEqual(report.photos[0].diagnostics,{category:[{category:'Tops',score:.9}]});assert.equal(report.photos[0].categoryMatch,true);assert.equal(report.release,'a'.repeat(12));
});
test('missing, duplicate and malformed result sets cannot produce misleading scores',()=>{
 const labels=lockPhotoLabels([{category:'Shoes'},{category:'Tops'}]);
 const first=phonePhotoResult('photo-001',{strong:true,choices:[{category:'Shoes',itemType:'Sneakers'}]},1);
 assert.throws(()=>scorePhonePhotos(labels,[first]),/Incomplete/);assert.throws(()=>scorePhonePhotos(labels,[first,first]),/Duplicate/);
 assert.equal(phonePhotoResult('photo-001',{strong:true,choices:[]},1).error,'invalid_result');
 assert.equal(photoFailure('photo-001','PRIVATE_ERROR').error,'unknown');
});
function sessionFixture(){
 let worker;const timers=new Map();let count=0;
 class Worker{constructor(){worker=this;this.messages=[];}postMessage(x){this.messages.push(x);}terminate(){this.stopped=true;}send(data){this.onmessage({data});}}
 const session=photoTestSession({WorkerClass:Worker,schedule:(f,delay)=>{const id=++count;timers.set(id,{f,delay});return id;},cancel:id=>timers.delete(id)});
 return {session,worker,timers};
}
test('photo test ignores stale replies, respects bounded model/classification timeouts and frees its worker',async()=>{
 const {session,worker,timers}=sessionFixture();const load=session.call({type:'load'});assert.equal([...timers.values()][0].delay,300000);
 worker.send({type:'ready',id:99});assert.equal(timers.size,1);worker.send({type:'ready',id:1});await load;assert.equal(timers.size,0);
 const classify=session.call({type:'classify',image:'private'});assert.equal([...timers.values()][0].delay,60000);
 const rejected=assert.rejects(classify,e=>e.code==='timeout');[...timers.values()][0].f();await rejected;assert.equal(worker.stopped,true);assert.equal(timers.size,0);
 await assert.rejects(session.call({type:'load'}),e=>e.code==='cancelled');
});
test('reset cancels in-flight calls and worker errors never export their raw messages',async()=>{
 const {session,worker}=sessionFixture();const p=session.call({type:'load'}),rejected=assert.rejects(p,e=>e.code==='cancelled');session.close();await rejected;assert.equal(worker.stopped,true);
 const b=sessionFixture(),q=b.session.call({type:'load'}),failure=assert.rejects(q,e=>e.code==='runtime'&&!e.message.includes('PRIVATE_SECRET'));b.worker.onerror({message:'PRIVATE_SECRET'});await failure;
});
