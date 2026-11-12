'use strict';
// P845 actual scanner + photo advice + P844 review-first integration.
// Synthetic pixel/model fixtures: these tests DO NOT establish real accuracy.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8'),html=fs.readFileSync('public/index.html','utf8');
function section(a,b){
 const i=app.indexOf(a),j=app.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'P845 source boundary missing: '+a);return app.slice(i,j);
}
const flag=app.match(/^const reviewFirst836=.*;$/m)?.[0];
const scanner=flag+'\n'+section('function automaticAdmissionCore842(', 'async function recognizeBatch(');
const make=(quality,opts={})=>{
 const item={id:'fixture-new',image:'data:image/jpeg;base64,QUJDRA==',name:'',
  category:'Uncategorized',itemType:'Unknown',color:'',seasons:[],userAdjusted:false,
  requiresOwnershipConfirmation:false};
 const c={URL,Date,structuredClone,reviewDate:new Date(),categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'],
  window:{closetAuth:{user:{id:'owner-A'}}},batch:[item],items:[],photoQualityHints73:new Map(),
  localPending:new Set([item.id]),localReady:true,recognitionUnavailable:false,
  recognitionState:{phase:'ready',activeId:null},persistDraft(){},render(){},message(){},
  $:()=>({textContent:''}),normalizeClothing:v=>({...v}),queued:work=>work(),
  checkPhoto:async()=>quality,similarPhotos:()=>false,segmentationAllows:()=>true,
  localRequest:async()=>({strong:true,categoryConfirmed:true,categoryOnly:false,
   choices:[{category:'Tops',itemType:'T-shirt',label:'a T-shirt'}],details:{}}),
  ClothingDetails:{fillColor:v=>({...v}),fill:v=>({...v})},
  applyLocalChoice(v,choice){v.category=choice.category;v.itemType=choice.itemType;},
  db:{transaction(){throw Error('no automatic storage may be reached');}}
 };
 if(opts.checkPhoto)c.checkPhoto=opts.checkPhoto;
 vm.createContext(c);vm.runInContext(scanner,c);
 return {c,item,scan:()=>c.recognizeItem(item)};
};
const guidance={kind:'advisory-only',advice:[{code:'low-light',text:'Try more even light.'}]};
const dim={blank:true,aspect:1,signature:[3,7,5],colorEstimate:null,captureGuidance:guidance};
test('P845 keeps P843 review-first + P844 per-dialog lock in the integrated source',()=>{
 assert.equal(flag,'const reviewFirst836=true;');
 assert.match(app,/let saveInFlight=false;/);
 assert.match(app,/dialog\.oncancel=event=>\{if\(saveInFlight\)event\.preventDefault\(\);\};/);
 assert.ok(html.includes('id="photoQualityResearch73" type="checkbox"'));
 assert.ok(html.indexOf('photo-quality-research.js')<html.indexOf('photo-check.js'));
});
test('P845 a pixel-flat garment with opt-in advice stays original unsaved reviewable, never auto-own',async()=>{
 const x=make(dim);
 assert.equal(await x.scan(),true);
 assert.equal(x.c.batch.length,1);
 assert.equal(x.c.items.length,0);
 assert.equal(x.item.image,'data:image/jpeg;base64,QUJDRA==');
 assert.equal(x.item.requiresOwnershipConfirmation,true);
 const advice=x.c.photoQualityHints73.get(x.item.id);
 assert.equal(advice.item,x.item);assert.equal(advice.source,x.item.image);
 assert.equal(advice.owner,'owner-A');
 assert.equal(advice.advice[0].code,'low-light');
});
test('P845 source changed while quality check awaits: guidance does not bind to new image',async()=>{
 let resolve;
 const x=make(dim,{checkPhoto:()=>new Promise(ok=>{resolve=ok;})});
 const pending=x.scan();
 x.item.image='data:image/jpeg;base64,REVGRA==';
 resolve(dim);
 await pending;
 assert.equal(x.c.photoQualityHints73.has(x.item.id),false,'stale original advice cannot transfer');
 assert.equal(x.c.items.length,0);
});
test('P845 owner switched while quality check awaits: no cross-account guidance or auto-save',async()=>{
 let resolve;
 const x=make(dim,{checkPhoto:()=>new Promise(ok=>{resolve=ok;})});
 const pending=x.scan();
 x.c.window.closetAuth.user.id='owner-B';
 resolve(dim);
 await pending;
 assert.equal(x.c.photoQualityHints73.size,0,'no cross-owner pixel advice');
 assert.equal(x.c.items.length,0);
});
test('P845 source advice remains optional, no permission to bypass first owner confirmation',async()=>{
 const quality={blank:false,aspect:1,signature:[1,2,3],colorEstimate:null,
  captureGuidance:{kind:'advisory-only',advice:[]}};
 const x=make(quality);
 await x.scan();
 assert.equal(x.c.items.length,0);
 assert.equal(x.c.batch.length,1);
 assert.equal(x.item.requiresOwnershipConfirmation,true);
 assert.match(x.item.localStatus,/Tap Adjust to confirm/);
});

test('P845 expired advice releases source references on remove, crop, save, and owner switch',()=>{
 const cleanup=section('function purgePhotoQualityHints845(', 'function render(){');
 const checks=[
  {name:'saved or removed',mutate:c=>{c.batch=[];}},
  {name:'crop changed',mutate:c=>{c.batch[0].image='data:image/jpeg;base64,QkJC';}},
  {name:'owner switched',mutate:c=>{c.window.closetAuth.user.id='owner-B';}},
  {name:'replaced same-id source',mutate:c=>{c.batch=[{id:'s',image:'same-photo'}];}}
 ];
 for(const check of checks){
  const item={id:'s',image:'same-photo'};
  const receipt={item,source:'same-photo',owner:'owner-A',advice:[]};
  const c={photoQualityHints73:new Map([['s',receipt]]),
    batch:[item],window:{closetAuth:{user:{id:'owner-A'}}}};
  vm.createContext(c);vm.runInContext(cleanup,c);
  c.purgePhotoQualityHints845();
  assert.equal(c.photoQualityHints73.size,1,check.name+' valid source retained');
  check.mutate(c);
  c.purgePhotoQualityHints845();
  assert.equal(c.photoQualityHints73.size,0,check.name+' expired source removed');
 }
});
