import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {
 CONFUSABLE_SUBTYPES47,guardConfusableSubtype47,normalizeSuggestion42,recognizeReviewedCrop42
} from '../research/multi-garment-capture-01/recognition-review-42.mjs';
import {verifiedRecord24,atomicSaveGarments24} from '../research/multi-garment-capture-01/atomic-group.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;

const schema={types:{
 Tops:['T-shirt','Blouse','Sweatshirt','Tunic','Hoodie','Sweater','Other'],
 Bottoms:['Jeans','Shorts','Skirt','Other'],
 Shoes:['Sneakers','Ankle boots','Tall boots','Other']
}};
const palette=['Black','White','Gray','Blue','Red','Green'];
const categories=['Tops','Bottoms','Shoes'];
const result=(cat,type,color='Black')=>({strong:true,choices:[{category:cat,itemType:type}],details:{color}});
const normalized=(cat,type)=>normalizeSuggestion42(result(cat,type),schema,palette,categories);
const risk=(cat,type)=>guardConfusableSubtype47(normalized(cat,type),schema);
const photo=async()=>{
 const bytes=await readFile('benchmark/fixtures/commons-0003.jpg');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const known=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8')).find(v=>v.id==='commons-0003');
 assert.equal(sha,known.sha256);
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {image,sourceSHA256:sha,sourceHashVerified:true,
  originalPhoto:{image,sha256:sha,width:800,height:900,origin:'source-locked-licensed'}};
};
const piece=(hint,overrides={})=>({
 id:'shirt47',instanceKey:'manual-100-100-500-500',
 cropBounds:{x:.1,y:.1,width:.5,height:.5},image:'data:image/jpeg;base64,/9j/2Q==',
 category:'Tops',itemType:'T-shirt',color:'Black',
 confirmed:true,cropReviewed:true,manual:true,recognitionSuggestion42:hint,...overrides
});

test('SUBTYPE47 all three independently observed unsafe subtype PAIRS must downgrade to manual compare',()=>{
 const rows=[
  ['Tops','T-shirt','Sweatshirt'],['Tops','Sweatshirt','T-shirt'],
  ['Tops','Blouse','Tunic'],['Tops','Tunic','Blouse'],
  ['Shoes','Sneakers','Ankle boots'],['Shoes','Ankle boots','Sneakers']
 ];
 assert.equal(Object.keys(CONFUSABLE_SUBTYPES47.Tops).length,4);
 assert.equal(Object.keys(CONFUSABLE_SUBTYPES47.Shoes).length,2);
 for(const [cat,type,other] of rows){
  const guarded=risk(cat,type);
  assert.equal(guarded.suggestion.category,cat);
  assert.equal(guarded.suggestion.itemType,null,'Unsafe proposed subtype must not pass as accepted evidence');
  assert.equal(guarded.suggestion.color,'Black');
  assert.deepEqual(guarded.subtypeReview47,{
   candidate:type,alternative:other,
   reason:'independently-observed-high-confidence-confusion',needsConfirmation:true
  });
 }
});

test('SUBTYPE47 safe catalog types retain existing suggestions and no fake ambiguity',()=>{
 for(const [cat,type] of [['Bottoms','Jeans'],['Bottoms','Skirt'],['Tops','Hoodie'],['Shoes','Tall boots']]){
  const g=risk(cat,type);
  assert.equal(g.suggestion.itemType,type);
  assert.equal(g.subtypeReview47,null);
 }
 const mismatched=normalizeSuggestion42(result('Shoes','Sweatshirt'),schema,palette,categories);
 assert.equal(guardConfusableSubtype47(mismatched,schema).suggestion.itemType,null);
 assert.equal(guardConfusableSubtype47(mismatched,schema).subtypeReview47,null);
 const prior=normalizeSuggestion42({strong:false,categoryConfirmed:true,choices:[{category:'Tops',itemType:'T-shirt'}]},schema,palette,categories);
 assert.equal(prior.category,'Tops');
 assert.equal(prior.itemType,null);
 assert.equal(guardConfusableSubtype47(prior,schema).subtypeReview47,null);
});

test('SUBTYPE47 actual browser-worker request contract: original context remains context, risky crop strong flag becomes category-only',async()=>{
 const originalWorker=globalThis.Worker;
 const messages=[];
 const replies=[result('Tops','T-shirt'),result('Tops','Sweatshirt','Gray')];
 globalThis.Worker=class {
  constructor(){this.closed=false;}
  postMessage(msg){
   messages.push(msg);
   const reply=replies[messages.length-1];
   queueMicrotask(()=>this.onmessage?.({data:{...reply,type:'result',id:msg.id}}));
  }
  terminate(){this.closed=true;}
 };
 try{
  const out=await recognizeReviewedCrop42({
   original:'locked-original-jpeg',crop:'user-reviewed-crop-jpeg',version:'pinned-47',
   signal:new AbortController().signal,schema,palette,categories
  });
  assert.deepEqual(messages.map(x=>x.image),['locked-original-jpeg','user-reviewed-crop-jpeg']);
  assert.equal(out.source,'local-fashionclip');
  assert.equal(out.originalContext.itemType,'T-shirt');
  assert.equal(out.category,'Tops');
  assert.equal(out.itemType,null);
  assert.equal(out.status,'category-only');
  assert.equal(out.color,'Gray');
  assert.equal(out.subtypeReview47.candidate,'Sweatshirt');
  assert.equal(out.subtypeReview47.alternative,'T-shirt');
  assert.equal(out.subtypeReview47.needsConfirmation,true);
 }finally{globalThis.Worker=originalWorker;}
});

test('SUBTYPE47 real archived photo SHA + owner-private saved T-shirt retains user truth and bounded false Sweatshirt evidence',async()=>{
 const proof=await photo();
 const hint={
  source:'local-fashionclip',category:'Tops',itemType:null,color:'Gray',
  status:'category-only',
  subtypeReview47:{candidate:'Sweatshirt',alternative:'T-shirt',
   reason:'independently-observed-high-confidence-confusion',needsConfirmation:true,
   ignoredMetadata:'MUST NOT PERSIST'},
  originalContext:{category:'Tops',itemType:'Sweatshirt',color:'Black'}
 };
 const row=verifiedRecord24({proof,ownerId:'owner47',piece:piece(hint)});
 assert.equal(row.itemType,'T-shirt');
 assert.equal(row.category,'Tops');
 assert.equal(row.color,'Black');
 assert.equal(row.colorSource,'user');
 assert.equal(row.recognitionSuggestion42.itemType,null);
 assert.equal(row.recognitionSuggestion42.status,'category-only');
 assert.deepEqual(row.recognitionSuggestion42.subtypeReview47,{
  candidate:'Sweatshirt',alternative:'T-shirt',
  reason:'independently-observed-high-confidence-confusion',needsConfirmation:true
 });
 assert.equal(row.recognitionSuggestion42.color,'Gray');
 assert.equal(JSON.stringify(row).includes('MUST NOT PERSIST'),false);
 assert.equal(row.originalPhoto.image,proof.image);
 assert.equal(row.sourceSHA256,proof.sourceSHA256);
 assert.equal(row.threeDReady,false);
});

test('SUBTYPE47 invalid/conflicting subtype pairs cannot enter owner-private saved AI evidence',async()=>{
 const proof=await photo();
 for(const danger of [
  {candidate:'Sweatshirt',alternative:'Sneakers',needsConfirmation:true},
  {candidate:'Sweatshirt',alternative:'T-shirt',needsConfirmation:false},
  {candidate:'Sneakers',alternative:'Ankle boots',needsConfirmation:true},
  {candidate:'Sweatshirt',alternative:'T-shirt',needsConfirmation:true,reason:'uncalibrated-random'}
 ]){
  const hint={source:'local-fashionclip',category:'Tops',itemType:null,
   subtypeReview47:{reason:'independently-observed-high-confidence-confusion',...danger}};
  const row=verifiedRecord24({proof,ownerId:'owner47',piece:piece(hint)});
  assert.equal(row.recognitionSuggestion42.subtypeReview47,undefined);
 }
 // Even if model evidence is good, the main garment has to be explicitly
 // human-reviewed with a valid supported category/subtype and color.
 assert.throws(()=>verifiedRecord24({proof,ownerId:'owner47',piece:piece({
  source:'local-fashionclip',category:'Tops',itemType:null,
  subtypeReview47:{candidate:'Sweatshirt',alternative:'T-shirt',
   needsConfirmation:true,reason:'independently-observed-high-confidence-confusion'}
 },{itemType:'Unknown'})}),/unreviewed or invalid/);
});

test('SUBTYPE47 atomic owner-index save/reopen and duplicate rejection preserve human-approved subtype',async()=>{
 const proof=await photo(),owner='subtype47-owner',hint={
  source:'local-fashionclip',category:'Tops',itemType:null,color:'Gray',
  subtypeReview47:{candidate:'Sweatshirt',alternative:'T-shirt',
   needsConfirmation:true,reason:'independently-observed-high-confidence-confusion'}
 };
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open('closet-current-user-'+owner,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('items',{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
 try{
  await atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,pieces:[piece(hint)]});
  const all=()=>new Promise((resolve,reject)=>{
   const request=db.transaction('items').objectStore('items').getAll();
   request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  const saved=(await all())[0];
  assert.equal(saved.itemType,'T-shirt');
  assert.equal(saved.recognitionSuggestion42.itemType,null);
  assert.equal(saved.recognitionSuggestion42.subtypeReview47.needsConfirmation,true);
  assert.equal(saved.originalPhoto.sha256,proof.sourceSHA256);
  await assert.rejects(atomicSaveGarments24({db,proof,ownerId:owner,currentOwner:()=>owner,
   pieces:[piece(hint,{id:'copy-of-shirt'})]}),/duplicate/i);
  assert.equal((await all()).length,1);
 }finally{db.close();}
});
