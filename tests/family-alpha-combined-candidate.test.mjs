import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {prepareAuditedSyntheticPresentations} from '../research/family-alpha-integrated/prepare-audited-synthetic-presentations.mjs';
import {syntheticGarment} from '../research/family-alpha-13/synthetic-garments.mjs';
import {validateThreeOutfits,swapOnePiece} from '../research/family-alpha-15/three-outfit-validator.mjs';
import {renderAlphaAuthenticatedBoard} from '../public/family-alpha-2d-auth-preflight.mjs';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
const makeJPEG=n=>{
 const b=new Uint8Array(128).fill(n);b[0]=255;b[1]=216;b[126]=255;b[127]=217;
 return 'data:image/jpeg;base64,'+Buffer.from(b).toString('base64');
};
class Element{
 constructor(){this.style={};this.dataset={};this.children=[];this.attrs={};}
 replaceChildren(...elements){this.children=elements;}
 append(child){this.children.push(child);}
 setAttribute(key,value){this.attrs[key]=value;}
}
class Image extends Element{
 constructor(){super();this.complete=true;this.naturalWidth=140;this.naturalHeight=220;}
 cloneNode(){return new Image();}
}
async function withDOM(task){
 const oldDoc=globalThis.document,oldImage=globalThis.HTMLImageElement;
 globalThis.document={createElement:()=>new Element()};
 globalThis.HTMLImageElement=Image;
 try{return await task();}finally{globalThis.document=oldDoc;globalThis.HTMLImageElement=oldImage;}
}
function closetFixture(){
 const frames=new Map(),truth=new Map();
 const definitions=[
  ['top-a','Tops','Tops',2],['top-b','Tops','Tops',3],
  ['pants-a','Bottoms','Bottoms',4],['pants-b','Bottoms','Bottoms',5],
  ['shoes-a','Shoes','Shoes',6],['shoes-b','Shoes','Shoes',7],
  ['jacket-a','Outerwear','Outerwear',8]
 ];
 const items=definitions.map(([id,category,kind,seed])=>{
  const capture=syntheticGarment(kind);
  const original=makeJPEG(seed+10);
  frames.set(original,capture.frame);truth.set(id,capture.foreground);
  return {id,category,itemType:category,name:id,
   image:makeJPEG(seed+45),originalPhoto:{image:original},outfitSourceId:'capture-'+id};
 });
 const store=new Map(items.map(item=>[item.id,item]));
 const state={ownerId:A,epoch:1,overrides:new Map()};
 const getItem=id=>state.overrides.has(id)?state.overrides.get(id):store.get(id);
 const scope=()=>({ownerId:state.ownerId,epoch:state.epoch});
 const decodeOriginal=async original=>{
  if(!frames.has(original))throw Error('No decoded frame for expected retained JPEG');
  return frames.get(original);
 };
 const getTruth=id=>truth.get(id);
 const settings=()=>({
  ownerId:A,getScope:scope,getItem,decodeOriginal,
  groundTruthForItem:getTruth,createImage:async()=>new Image(),
  cryptoProvider:webcrypto
 });
 const outfits=[
  {board:{slots:{top:'top-a',bottom:'pants-a',shoes:'shoes-a'}},missing:[]},
  {board:{slots:{top:'top-b',bottom:'pants-a',shoes:'shoes-a'}},missing:[]},
  {board:{slots:{top:'top-a',bottom:'pants-b',shoes:'shoes-b'}},missing:[]}
 ];
 const cleanBoard=(board)=>{
  const next=structuredClone(board);return next;
 };
 return {items,store,state,settings,getItem,outfits,cleanBoard,truth,frames};
}
const checked=(fx,board)=>prepareAuditedSyntheticPresentations({board,items:fx.items,...fx.settings()});
test('one combined candidate validates three distinct owned outfits then supplies recognizable source pixels',async()=>{
 const f=closetFixture(),recommendations=validateThreeOutfits(f.outfits,f.items);
 assert.equal(recommendations.length,3);
 for(const result of f.outfits){
  const presentations=await checked(f,result.board);
  const selected=Object.values(result.board.slots);
  assert.deepEqual(Object.keys(presentations).sort(),selected.sort());
  for(const value of Object.values(presentations)){
   assert.equal(value.syntheticFixtureOnly,true);
   assert.equal(value.independentGroundTruthChecked,true);
   assert.equal(value.approved,true);
   assert.ok(value.sourceVersion.startsWith('sha256:'));
  }
 }
});
test('a single garment swap carries a new original source without mutating the other outfit slots',async()=>{
 const f=closetFixture(),initial=f.outfits[0].board;
 const swapped=swapOnePiece(initial,'top','top-b',f.items,f.cleanBoard);
 const old=await checked(f,initial),fresh=await checked(f,swapped);
 assert.equal(swapped.slots.top,'top-b');assert.equal(initial.slots.top,'top-a');
 assert.equal(swapped.slots.bottom,initial.slots.bottom);
 assert.equal(swapped.slots.shoes,initial.slots.shoes);
 assert.notEqual(fresh['top-b'].sourceVersion,old['top-a'].sourceVersion);
 assert.equal(fresh['pants-a'].sourceVersion,old['pants-a'].sourceVersion);
});
test('the synthetic prepared source can pass the real authenticated avatar renderer without production photo access',()=>withDOM(async()=>{
 const f=closetFixture(),container=new Element(),board=f.outfits[0].board;
 const options={
  auth:{user:{id:A},getAccessToken:async()=> 'fake-test-token'},
  database:{name:'closet-current-user-'+A},getCloudOwnerId:()=>A,
  getSessionGeneration:()=>f.state.epoch,
  publicKey:'fixture-only-test-key',cryptoProvider:webcrypto,
  fetchFn:async()=>({status:200,ok:true,json:async()=>({id:A})}),
  loadScopedWardrobe:async()=>({ownerId:A,indexedDbName:'closet-current-user-'+A,board,items:f.items}),
  preparePresentations:async()=>checked(f,board)
 };
 const outcome=await renderAlphaAuthenticatedBoard(container,options);
 assert.equal(outcome.renderedLayers,3);
 assert.equal(outcome.serverAuthChecked,true);
 assert.equal(outcome.sourceMaskProofPending,true); // fixture evidence is NOT field-ready provenance
 assert.deepEqual(container.children[0].children.slice(1).map(x=>x.dataset.slot),['shoes','bottom','top']);
}));
test('real photos cannot be auto-approved without independent synthetic ground truth',async()=>{
 const f=closetFixture(),board=f.outfits[0].board,base=f.settings();
 let factoryCalls=0;
 const options={board,items:f.items,...base,
  groundTruthForItem:()=>null,
  createImage:async()=>{factoryCalls++;return new Image();}};
 await assert.rejects(prepareAuditedSyntheticPresentations(options),/ground truth/);
 assert.equal(factoryCalls,0,'no fabricated garment image is allowed after failed source audit');
});
test('garment mask cannot cross another saved item or a changed original source',async()=>{
 const f=closetFixture(),board=f.outfits[0].board;
 f.state.overrides.set('top-a',{...f.items[0],originalPhoto:{image:makeJPEG(110)}});
 await assert.rejects(checked(f,board),/needs review|saved-photo-changed|record changed/);
});
test('bad background is a review, never a generic-color replacement',async()=>{
 const f=closetFixture(),board=f.outfits[0].board;
 const original=f.items[0].originalPhoto.image;
 const scene=syntheticGarment('Tops',{background:'busy'});
 f.frames.set(original,scene.frame);f.truth.set('top-a',scene.foreground);
 let factoryCalls=0;
 await assert.rejects(prepareAuditedSyntheticPresentations({
  board,items:f.items,...f.settings(),createImage:async()=>{factoryCalls++;return new Image();}
 }),/needs review/i);
 assert.equal(factoryCalls,0);
});
test('cross-account switch while independent source audit is waiting must reject',async()=>{
 const f=closetFixture(),board=f.outfits[0].board;
 const originalDecoder=f.settings().decodeOriginal;
 let called=0,release,started;
 const gate=new Promise(resolve=>release=resolve),entered=new Promise(resolve=>started=resolve);
 const task=prepareAuditedSyntheticPresentations({
  board,items:f.items,...f.settings(),
  decodeOriginal:async photo=>{
   if(++called===1){started();await gate;}
   return originalDecoder(photo);
  }
 });
 await entered;
 f.state.ownerId=B;f.state.epoch++;
 release();
 await assert.rejects(task,/account or session changed/);
});
test('independently audited garment cannot pretend to be a field-approved mask',async()=>{
 const f=closetFixture(),p=await checked(f,f.outfits[0].board);
 for(const candidate of Object.values(p)){
  assert.equal(candidate.syntheticFixtureOnly,true);
  assert.equal(candidate.independentGroundTruthChecked,true);
 }
});
