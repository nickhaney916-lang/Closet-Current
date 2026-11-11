import test from 'node:test';import assert from 'node:assert/strict';
import {lockPhotoLabels,phonePhotoResult,photoFailure,scorePhonePhotos,phonePhotoTrialReadout,phonePhotoColorTrialReadout,photoColors} from '../public/phone-photo-benchmark.mjs';
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

test('P829 blind single-garment tester says correct only for accepted category and verified subtype',()=>{
 const labels=lockPhotoLabels([
  {category:'Tops',type:'T-shirt'},
  {category:'Shoes',type:'Sneakers'},
  {category:'Dresses',type:'Casual dress'},
  {category:'Tops'},
  {category:'Uncategorized'},
  {category:'Uncategorized'},
  {category:'Tops'}
 ]);
 const results=[
  phonePhotoResult('photo-001',{strong:true,choices:[{category:'Tops',itemType:'T-shirt'}]},1),
  phonePhotoResult('photo-002',{strong:true,choices:[{category:'Shoes',itemType:'Ankle boots'}]},2),
  phonePhotoResult('photo-003',{strong:true,choices:[{category:'Tops',itemType:'T-shirt'}]},3),
  phonePhotoResult('photo-004',{strong:false,categoryConfirmed:false,choices:[{category:'Tops',itemType:'T-shirt'}]},4),
  phonePhotoResult('photo-005',{strong:false,choices:[]},5),
  phonePhotoResult('photo-006',{strong:true,choices:[{category:'Tops',itemType:'T-shirt'}]},6),
  photoFailure('photo-007','network')
 ];
 const scored=scorePhonePhotos(labels,results);
 const feedback=scored.photos.map(phonePhotoTrialReadout);
 assert.deepEqual(feedback.map(x=>x.state),['pass','fail','fail','review','pass','fail','error']);
 assert.match(feedback[0].title,/Category and type matched/);
 assert.match(feedback[1].title,/clothing type did not/);
 assert.match(feedback[1].detail,/Expected Sneakers; model proposed Ankle boots/);
 assert.match(feedback[2].title,/Wrong automatic category/);
 assert.match(feedback[3].title,/Needs manual review/);
 assert.doesNotMatch(feedback[3].title,/matched/i);
 assert.match(feedback[4].title,/Non-clothing correctly rejected/);
 assert.match(feedback[5].title,/Incorrect clothing detection/);
 assert.match(feedback[6].title,/Could not check/);
 assert.equal(scored.summary.incorrectAutomaticCategories,2);
 assert.equal(scored.summary.incorrectAutomaticTypes,2);
 assert.equal(scored.summary.categoryMatches,2);
 assert.ok(!JSON.stringify(feedback).includes('network'));
});
test('P829 readout excludes arbitrary private source details and does not claim subtype checks when none were labeled',()=>{
 const labels=lockPhotoLabels([{category:'Dresses'}]);
 const classified=phonePhotoResult('photo-001',{strong:true,choices:[{
  category:'Dresses',itemType:'Casual dress',filename:'PRIVATE_PHONE_FILENAME.jpeg'}],
  diagnostics:{private:'PRIVATE_SECRET'}},7);
 const report=scorePhonePhotos(labels,[classified]);
 const verdict=phonePhotoTrialReadout({...report.photos[0],filename:'PRIVATE_PHONE_FILENAME.jpeg',notes:'PRIVATE_SECRET'});
 assert.equal(verdict.state,'pass');
 assert.match(verdict.title,/Category matched/);
 assert.match(verdict.detail,/Clothing type was not checked/);
 assert.ok(!JSON.stringify(verdict).includes('PRIVATE'));
 assert.throws(()=>phonePhotoTrialReadout({...report.photos[0],expectedCategory:'SECRET_PERSON'}),/private-trial/);
});

test('P830 prior-labeled single-garment color is scored only from verified confident worker details',()=>{
 const input=[
  {category:'Tops',type:'T-shirt',color:'Blue',filename:'PRIVATE_BLUE_SHIRT.jpeg'},
  {category:'Bottoms',type:'Jeans',color:'Black'},
  {category:'Dresses',type:'Casual dress',color:'Red'},
  {category:'Outerwear',type:'Jacket',color:'Pink'},
  {category:'Uncategorized'},
  {category:'Tops',color:'Green'},
  {category:'Tops',color:'White'}
 ];
 const labels=lockPhotoLabels(input);
 assert.equal(labels[0].expectedColor,'Blue');
 input[0].color='Red';
 assert.equal(labels[0].expectedColor,'Blue','labels are frozen independently before model inference');
 const res=[
  phonePhotoResult('photo-001',{strong:true,choices:[{category:'Tops',itemType:'T-shirt'}],details:{color:'Blue',image:'data:image/jpeg;PRIVATE_SECRET'}},5),
  phonePhotoResult('photo-002',{strong:true,choices:[{category:'Bottoms',itemType:'Jeans'}],details:{color:'Gray'}},5),
  phonePhotoResult('photo-003',{strong:true,choices:[{category:'Dresses',itemType:'Casual dress'}],details:{}},5),
  phonePhotoResult('photo-004',{strong:false,categoryConfirmed:true,choices:[{category:'Outerwear',itemType:'Unknown'}],details:{color:'Pink'}},5),
  phonePhotoResult('photo-005',{strong:false,choices:[],details:{color:'Red'}},5),
  phonePhotoResult('photo-006',{strong:true,choices:[{category:'Tops',itemType:'Blouse'}],details:{color:'PRIVATE_EMAIL_AND_TOKEN'}},5),
  photoFailure('photo-007','runtime')
 ];
 const report=scorePhonePhotos(labels,res);
 assert.equal(report.summary.colorsChecked,6);
 assert.equal(report.summary.colorMatches,1);
 assert.equal(report.summary.colorPredicted,2);
 assert.equal(report.summary.incorrectAutomaticColors,1);
 assert.equal(report.summary.colorUnreported,4);
 assert.equal(report.photos[0].colorMatch,true);
 assert.equal(report.photos[1].colorMatch,false);
 assert.equal(report.photos[3].prediction.color,null,'category-only review cannot assert a primary color');
 assert.equal(report.photos[5].prediction.color,null,'unrecognized model color is not exported');
 assert.equal(report.photos[6].colorMatch,false);
 assert.ok(!JSON.stringify(report).includes('PRIVATE_'));
 const verdicts=report.photos.map(phonePhotoColorTrialReadout);
 assert.match(verdicts[0].detail,/Verified primary color Blue matched/);
 assert.equal(verdicts[1].state,'fail');
 assert.match(verdicts[1].detail,/expected Black, model reported Gray/);
 assert.equal(verdicts[2].state,'review','missing color cannot be labeled complete');
 assert.match(verdicts[2].detail,/Primary color not verified/);
 assert.equal(verdicts[3].state,'review');
 assert.match(verdicts[3].detail,/expected Pink/);
 assert.equal(verdicts[4].state,'pass','nonclothing does not require a color');
 assert.equal(verdicts[5].state,'review');
 assert.equal(verdicts[6].state,'error');
 assert.ok(!JSON.stringify(verdicts).includes('PRIVATE_'));
});
test('P830 reject invalid or nonclothing color labels, wrong palette, and forged unverified outputs',()=>{
 assert.equal(photoColors.length,13);
 assert.equal(new Set(photoColors).size,photoColors.length);
 for(const row of [
  {category:'Tops',color:'PRIVATE_TOKEN'},
  {category:'Uncategorized',color:'Blue'},
  {category:'Dresses',color:'transparent'},
  {category:'Bottoms',color:'red'},
 ]){
  assert.throws(()=>lockPhotoLabels([row]),/matching primary color/);
 }
 const [label]=lockPhotoLabels([{category:'Tops',type:'T-shirt',color:'Blue'}]);
 const raw=phonePhotoResult(label.id,{strong:false,categoryConfirmed:true,
  choices:[{category:'Tops',itemType:'Unknown'}],details:{color:'Blue'}},1);
 assert.equal(raw.prediction.color,null);
 const scored=scorePhonePhotos([label],[raw]).photos[0];
 assert.equal(scored.colorMatch,false);
 assert.equal(phonePhotoColorTrialReadout(scored).state,'review');
 assert.throws(()=>phonePhotoColorTrialReadout({...scored,expectedColor:'PRIVATE_TOKEN'}),/primary color/);
 assert.throws(()=>phonePhotoColorTrialReadout({...scored,prediction:{color:'PRIVATE_TOKEN'}}),/verified color/);
 const wrong=phonePhotoResult(label.id,{strong:true,
  choices:[{category:'Tops',itemType:'T-shirt'}],details:{color:'Red'}},1);
 const verdict=phonePhotoColorTrialReadout(scorePhonePhotos([label],[wrong]).photos[0]);
 assert.equal(verdict.state,'fail');
 assert.equal(verdict.title,'Incorrect automatic primary color');
 const fake=phonePhotoResult(label.id,{strong:true,
  choices:[{category:'Tops',itemType:'T-shirt'}],details:{color:33}},1);
 assert.equal(fake.prediction.color,null);
});
