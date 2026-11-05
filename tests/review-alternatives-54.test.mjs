import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewAlternatives54,applyReviewAlternative54} from '../research/multi-garment-capture-01/review-alternatives-54.mjs';
import {recognizeReviewedCrop42} from '../research/multi-garment-capture-01/recognition-review-42.mjs';

const schema={types:{
 Tops:['T-shirt','Blouse','Tunic','Sweatshirt'],
 Bottoms:['Jeans','Skirt'],
 Dresses:['Casual dress','Formal dress'],
 Outerwear:['Jacket','Coat'],
 Shoes:['Sneakers','Ankle boots']
}};
const categories=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
const candidates=result=>reviewAlternatives54(result,schema,categories);
const uncertain={
 strong:false,choices:[],reason:'checks_disagree',diagnostics:{
  category:[{category:'Dresses',score:.78},{category:'Tops',score:.21}],
  branch:[{category:'Dresses',type:'Casual dress',score:.62},{category:'Dresses',type:'Formal dress',score:.13}],
  overall:[{category:'Tops',type:'Tunic',score:.51},{category:'Tops',type:'Blouse',score:.18}]
 }
};
test('REVIEW54 actual cross-category conflict exposes different crop hypotheses without pretending they are confirmed',()=>{
 const choices=candidates(uncertain);
 assert.deepEqual(choices,[
  {category:'Dresses',itemType:'Casual dress',needsConfirmation:true},
  {category:'Tops',itemType:'Tunic',needsConfirmation:true},
  {category:'Dresses',itemType:'Formal dress',needsConfirmation:true}
 ]);
 assert.ok(Object.isFrozen(choices));
 assert.ok(choices.every(Object.isFrozen));
 assert.equal(uncertain.choices.length,0,'Real engine must still abstain');
});
test('REVIEW54 never replaces an accepted model result with speculative alternatives',()=>{
 assert.deepEqual(candidates({...uncertain,strong:true}),[]);
 assert.deepEqual(candidates({...uncertain,categoryConfirmed:true}),[]);
 assert.deepEqual(candidates({strong:false,diagnostics:null}),[]);
 assert.deepEqual(candidates({strong:false,diagnostics:{}}),[]);
});
test('REVIEW54 strict categories and schema reject fake type, object, accessories, prototype pollution and untrusted fields',()=>{
 const results=candidates({strong:false,diagnostics:{
  branch:[{category:'Shoes',type:'T-shirt'},{category:'Accessories',type:'Bag'},
   {category:'__proto__',type:'Constructor'},'abuse'],
  overall:[{category:'Tops',type:'Jacket'},{category:'Shoes',type:'Sneakers'},
   {category:'Dresses',type:'Formal dress',credentials:'secret',hugePixels:new Uint8Array(1024)}]
 }});
 assert.deepEqual(results,[
  {category:'Shoes',itemType:null,needsConfirmation:true},
  {category:'Tops',itemType:null,needsConfirmation:true},
  {category:'Dresses',itemType:'Formal dress',needsConfirmation:true}
 ]);
 assert.equal(JSON.stringify(results).includes('secret'),false);
 assert.equal(JSON.stringify(results).includes('hugePixels'),false);
});
test('REVIEW54 no original photograph can generate an alternate for a crop',()=>{
 const onlyOriginal={strong:false,originalContext:{category:'Tops'},
  diagnostics:undefined};
 assert.deepEqual(candidates(onlyOriginal),[]);
});
test('REVIEW54 hand-select updates only unsaved category and subtype, NEVER verifies, color or source proof',()=>{
 const piece={cropReviewed:true,confirmed:true,category:'Dresses',itemType:'Casual dress',
  color:'Blue',image:'source-unaltered',sourceSHA256:'f'.repeat(64),cropBounds:{x:0,y:0,width:1,height:1}};
 const before=structuredClone(piece),choice=candidates(uncertain)[1];
 assert.equal(applyReviewAlternative54(piece,choice,schema,categories),true);
 assert.equal(piece.category,'Tops');
 assert.equal(piece.itemType,'Tunic');
 assert.equal(piece.confirmed,false);
 assert.equal(piece.color,before.color);
 assert.equal(piece.image,before.image);
 assert.deepEqual(piece.cropBounds,before.cropBounds);
 assert.equal(piece.sourceSHA256,before.sourceSHA256);
});
test('REVIEW54 invalid/malformed and unreviewed choices never mutate any piece',()=>{
 const piece={cropReviewed:false,confirmed:false,category:'Uncategorized',itemType:'Unknown',color:''};
 const before=structuredClone(piece);
 for(const choice of [
  null,{}, {category:'Shoes',itemType:'Jacket',needsConfirmation:true},
  {category:'Accessories',itemType:'Bag',needsConfirmation:true},
  {category:'Tops',itemType:'T-shirt',needsConfirmation:false},
  {category:'Shoes',itemType:undefined,needsConfirmation:true}
 ])assert.equal(applyReviewAlternative54(piece,choice,schema,categories),false);
 assert.deepEqual(piece,before);
});
test('REVIEW54 category-only choice is possible but never silently invents a specific type',()=>{
 const piece={cropReviewed:true,category:'Uncategorized',itemType:'Unknown',confirmed:false,color:''};
 const choice=candidates({strong:false,diagnostics:{category:[{category:'Bottoms',score:.49}]}})[0];
 assert.deepEqual(choice,{category:'Bottoms',itemType:null,needsConfirmation:true});
 assert.equal(applyReviewAlternative54(piece,choice,schema,categories),true);
 assert.equal(piece.category,'Bottoms');
 assert.equal(piece.itemType,'Unknown');
 assert.equal(piece.confirmed,false);
});
test('REVIEW54 genuine worker uncertain output produces candidates while original and crop remain separate',async()=>{
 const previousWorker=globalThis.Worker,oldCrypto=globalThis.crypto,controller=new AbortController();
 let worker;
 globalThis.Worker=class{
  constructor(url){this.url=url;worker=this;}
  postMessage(req){
   const data=req.image==='original'?
    {strong:true,choices:[{category:'Shoes',itemType:'Sneakers'}],details:{}}:uncertain;
   queueMicrotask(()=>this.onmessage?.({data:{...data,type:'result',id:req.id}}));
  }
  terminate(){this.closed=true;}
 };
 globalThis.crypto={randomUUID:()=>String(Math.random())};
 try{
  const r=await recognizeReviewedCrop42({original:'original',crop:'crop',version:'54test',
   signal:controller.signal,schema,palette:['Blue'],categories});
  assert.equal(r.category,null);
  assert.equal(r.itemType,null);
  assert.equal(r.status,'abstained');
  assert.equal(r.originalContext.category,'Shoes');
  assert.equal(r.alternatives54[0].category,'Dresses');
  assert.equal(r.alternatives54[1].category,'Tops');
  assert.equal(r.alternatives54.length,3);
  assert.equal(worker.closed,true);
 }finally{
  globalThis.Worker=previousWorker;
  if(oldCrypto===undefined)delete globalThis.crypto;else globalThis.crypto=oldCrypto;
 }
});
