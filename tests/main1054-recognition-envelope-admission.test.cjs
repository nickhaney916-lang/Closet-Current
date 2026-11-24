'use strict';
// Exercise the actual recognizeItem callback, with controlled worker responses
// and synthetic persistence boundaries. This is not real model or browser evidence.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const source=require('node:fs').readFileSync(process.env.ENVELOPE_SOURCE||'public/app.js','utf8');
const baseline=process.env.ENVELOPE_EXPECT_RED==='1';
const subtypeBaseline=process.env.SUBTYPE_EXPECT_RED==='1';
const types={Tops:['T-shirt','Sweatshirt','Blouse','Tunic','Tank top'],Bottoms:['Jeans'],Shoes:['Sneakers','Ankle boots','Loafers'],Dresses:['Casual dress','Shirt dress','Sweater dress','Formal dress'],Outerwear:['Coat']};
const good={strong:true,choices:[{category:'Tops',itemType:'T-shirt',label:'shirt',score:.9}],details:{}};
const strong=(category,itemType)=>({strong:true,choices:[{category,itemType,label:itemType,score:.99}],details:{}});
const cases=[
 ['valid strong',good,'review','saved','saved'],
 ['valid omitted score',{...good,choices:[{category:'Tops',itemType:'T-shirt',label:'shirt'}]},'review','saved','saved'],
 ['valid uncertain',{strong:false,choices:[]},'uncertain','uncertain'],
 ['normal partial',{strong:false,categoryConfirmed:true,categoryOnly:true,choices:[{category:'Tops',itemType:'Unknown',label:'top'}]},'review','saved','saved'],
 ['legacy broad',{strong:true,categoryOnly:true,choices:[{category:'Shoes',itemType:'Unknown',label:'shoe'}]},'review','saved'],
 ['legacy broad explicit false',{strong:true,categoryOnly:true,categoryConfirmed:false,choices:[{category:'Shoes',itemType:'Unknown',label:'shoe'}]},'review','saved'],
 ['null',null,'invalid','uncertain'],['array',[],'invalid','uncertain'],['truthy strong',{...good,strong:'true'},'invalid','saved'],
 ['missing choices',{strong:true},'invalid','uncertain'],['empty strong',{strong:true,choices:[]},'invalid','saved'],
 ['contradictory flags',{...good,categoryConfirmed:true,categoryOnly:true},'invalid','saved'],
 ['incomplete flags',{...good,strong:false,categoryConfirmed:true},'invalid','uncertain'],
 ['unknown category',{...good,choices:[{...good.choices[0],category:'Unknown'}]},'invalid','saved'],
 ['category type mismatch',{...good,choices:[{...good.choices[0],itemType:'Jeans'}]},'invalid','saved'],
 ['strong unknown',{...good,choices:[{...good.choices[0],itemType:'Unknown'}]},'invalid','saved'],
 ['partial specific',{...good,strong:false,categoryConfirmed:true,categoryOnly:true},'invalid','uncertain'],
 ['legacy specific',{...good,categoryOnly:true},'invalid','saved'],
 ...[NaN,Infinity,-.01,1.01,'0.9',null].map(score=>['invalid score '+String(score),{...good,choices:[{...good.choices[0],score}]},'invalid','saved']),
 ...['Sweatshirt','Blouse','Tunic'].map(type=>['risky '+type,strong('Tops',type),'review','saved','saved']),
 ...['Sneakers','Ankle boots'].map(type=>['risky '+type,strong('Shoes',type),'review','saved','saved']),
 ...['Casual dress','Shirt dress','Sweater dress','Formal dress'].map(type=>['risky '+type,strong('Dresses',type),'review','saved','saved']),
 ['diagnostic review',{...strong('Bottoms','Jeans'),diagnostics:{mission1SubtypeSafety:{ownerSubtypeReviewRequired:true}}},'review','saved','saved'],
 ['valid jeans',strong('Bottoms','Jeans'),'saved','saved'],['valid tank top',strong('Tops','Tank top'),'saved','saved'],
 ['valid loafers',strong('Shoes','Loafers'),'saved','saved'],['valid coat',strong('Outerwear','Coat'),'saved','saved'],
 ['diagnostic false',{...strong('Bottoms','Jeans'),diagnostics:{mission1SubtypeSafety:{ownerSubtypeReviewRequired:false}}},'saved','saved']
];
async function exercise(result){
 const a=source.indexOf('async function recognizeItem(item){'),b=source.indexOf('async function recognizeBatch(){',a);
 assert.ok(a>=0&&b>a);
 const item={id:'one',ownerId:'A',name:'',category:'Uncategorized',itemType:'Unknown',color:'Blue',image:'original',originalPhoto:{image:'original',sha256:'sha'},sourceSHA256:'sha'};
 let saves=0,applies=0,persists=0;
 const c={item,structuredClone,Date,batch:[item],items:[],captureOperationEpoch:0,
  categories:['Uncategorized',...Object.keys(types)],clothingSchema:{types},
  recognitionState:{activeId:null,phase:'ready'},localPending:new Set([item.id]),
  recognitionUnavailable:false,localReady:true,render(){},message(){},$:()=>({}),
  checkPhoto:async()=>({blank:false,colorEstimate:'Blue',signature:'sig',aspect:1}),
  ClothingDetails:{fillColor:()=>({}),fill:()=>({})},similarPhotos:()=>false,
  localRequest:async()=>result,segmentationAllows:()=>true,
  applyLocalChoice:(x,y)=>{applies++;Object.assign(x,y)},
  saveIndexed:async()=>{saves++;return true},persistDraft:async()=>{persists++;return true}};
 await new Function(...Object.keys(c),source.slice(a,b)+'\nreturn recognizeItem(item);')(...Object.values(c));
 assert.deepEqual(item.originalPhoto,{image:'original',sha256:'sha'});
 assert.equal(item.image,'original');assert.equal(item.sourceSHA256,'sha');
 assert.equal(c.localPending.size,0);assert.equal(c.recognitionState.activeId,null);
 return {kind:saves?'saved':item.requiresOwnershipConfirmation&&item.scanFailed?'invalid':item.requiresOwnershipConfirmation&&item.localAnalyzed?'review':'uncertain',saves,applies,persists,item};
}
for(const [name,result,expected,old,prior=expected] of cases)test(name,async()=>{
 const x=await exercise(result);
 assert.equal(x.kind,baseline?old:subtypeBaseline?prior:expected);
 if(!baseline&&!subtypeBaseline&&(expected==='invalid'||expected==='review')){
  assert.equal(x.saves,0);assert.equal(x.applies,0);assert.equal(x.persists,1);
  assert.equal(x.item.category,'Uncategorized');assert.equal(x.item.itemType,'Unknown');assert.equal(x.item.color,'Blue');
  assert.match(x.item.localStatus,/Original photo kept/);assert.match(x.item.localStatus,/Adjust/);
 }
});
