import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {preflightOwnedOutfit1054} from './source-to-outfit.mjs';

// This runs the REAL native board normalizer from the pinned repository tree.
// Data URLs below are synthetic source-envelope fixtures, NOT real photographs,
// real image decoding, 3D renders or evidence of visual acceptance.
const context={URL,encodeURIComponent};
vm.createContext(context);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),context);
const cleanBoard=(board,items)=>context.cleanOutfitBoard(board,items);
const ownerId='owner-A';
// Mirror REAL native currentPhotoOwnerSession167(): a fresh envelope each read
// but the exact same authenticated object, IDB connection and capture epoch.
const authRef={user:{id:ownerId},assertCurrent(){}};
const privateDbRef={name:'closet-current-user-'+ownerId};
const session=()=>({authenticated:true,ownerId,epoch:7,
 privateDbName:'closet-current-user-'+ownerId,
 authRef,privateDbRef,operationEpoch:15});
const rawImage=(seed)=>{
 const bytes=Buffer.alloc(128,0);
 bytes[0]=255;bytes[1]=216;bytes[12]=seed;bytes[126]=255;bytes[127]=217;
 return {image:'data:image/jpeg;base64,'+bytes.toString('base64'),
  sha:createHash('sha256').update(bytes).digest('hex')};
};
function garment(id,category,seed,changes={}){
 const {image,sha}=rawImage(seed);
 return {id,ownerId,category,itemType:'Other',color:'Blue',
  sourceSHA256:sha,sourceHashVerified:true,sourcePhotoOriginal:true,
  originalPhoto:{image,sha256:sha},image,ownerReviewed:true,userAdjusted:true,
  singleGarmentVerified:true,...changes};
}
const set=()=>[
 garment('shirt','Tops',1),garment('pants','Bottoms',2),
 garment('shoes','Shoes',3)
];
const opts=(items,board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}},over={})=>({
 getSession:session,readOwnerItems:async()=>structuredClone(items),cleanBoard,board,...over
});
test('real board slots + M3 owner source index produce only original-photo 2D plans',async()=>{
 const items=set(),originals=items.map(x=>x.originalPhoto.image);
 const output=await preflightOwnedOutfit1054(opts(items));
 assert.equal(output.status,'source-verified-2d-only');
 assert.equal(output.renderAuthorized3D,false);
 assert.equal(output.releaseAuthorized,false);
 assert.equal(output.familyAlpha,'HOLD');
 assert.equal(output.slots.length,3);
 assert.deepEqual(output.slots.map(s=>s.itemId),['shirt','pants','shoes']);
 assert.ok(output.slots.every(s=>s.presentationMode==='verified-original-photo-2d'));
 assert.deepEqual(items.map(x=>x.originalPhoto.image),originals);
 assert.equal(JSON.stringify(output).includes('data:image'),false);
 assert.equal(JSON.stringify(output).includes('authRef'),false);
 assert.equal(JSON.stringify(output).includes('privateDbRef'),false);
 assert.equal(JSON.stringify(output).includes('operationEpoch'),false);
});
test('unreviewed AI suggestion cannot become an accepted owner garment',async()=>{
 const items=set();items[0].ownerReviewed=false;
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/review evidence/);
});
test('unknown color and unconfirmed type cannot enter the validated outfit',async()=>{
 for(const change of [{color:'Unknown'},{itemType:'Unknown'},{colorSource:'photo-estimate'}]){
  const items=set();Object.assign(items[0],change);
  await assert.rejects(preflightOwnedOutfit1054(opts(items)),/review evidence/);
 }
});
test('foreign owner item and missing signed owner database always fail',async()=>{
 const items=set();items[0].ownerId='owner-B';
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/cross-owner-record/);
 const others=set();
 await assert.rejects(preflightOwnedOutfit1054(opts(others,undefined,{
  getSession:()=>({authenticated:true,ownerId,epoch:7,privateDbName:'closet-current-user-owner-B'})
 })),/signed owner session/);
});
test('owner switch or epoch refresh during asynchronous read revokes result',async()=>{
 const items=set();let epoch=7;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),epoch}),
  readOwnerItems:async()=>{epoch=8;return structuredClone(items);}
 })),/owner session changed/);
});
test('selected source edited between private reads cannot pass',async()=>{
 const items=set();let calls=0;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  readOwnerItems:async()=>{
   const copy=structuredClone(items);
   if(++calls===2)copy[0].color='Pink';
   return copy;
  }
 })),/saved garment changed/);
});
test('changed JPEG bytes with unchanged claimed SHA is rejected',async()=>{
 const items=set();items[0].originalPhoto.image=rawImage(99).image;
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/SHA does not match/);
});
test('missing original SHA, missing JPEG and legacy saved photo are blocked',async()=>{
 for(const change of [
  {sourceHashVerified:false},
  {originalPhoto:null},
  {sourcePhotoOriginal:false}
 ]){
  const items=set();Object.assign(items[0],change);
  await assert.rejects(preflightOwnedOutfit1054(opts(items)),/review evidence/);
 }
});
test('actual native dress normalizer silently drops outer layers: gate refuses loss',async()=>{
 const dress=garment('dress','Dresses',4),layer=garment('coat','Outerwear',5);
 const input={slots:{top:'dress',layer:'coat'}};
 const original=structuredClone(input);
 const normalized=cleanBoard(input,[dress,layer]);
 assert.equal(normalized.slots.layer,undefined);
 await assert.rejects(preflightOwnedOutfit1054(opts([dress,layer],input)),/silently lose/);
 assert.deepEqual(input,original);
});
test('dress alone stays eligible for safe original-photo fallback, not 3D',async()=>{
 const result=await preflightOwnedOutfit1054(opts([garment('dress','Dresses',6)],{slots:{top:'dress'}}));
 assert.equal(result.slots.length,1);
 assert.equal(result.renderAuthorized3D,false);
});
test('orphan garment ID, same ID twice and invalid slot all refuse',async()=>{
 const items=set();
 for(const board of [
  {slots:{top:'does-not-exist'}},
  {slots:{top:'shirt',layer:'shirt'}},
  {slots:{garment:'shirt'}}
 ])await assert.rejects(preflightOwnedOutfit1054(opts(items,board)));
});
test('same source for two physical items never silently de-duplicates or fits',async()=>{
 const items=set();
 items[1].originalPhoto=structuredClone(items[0].originalPhoto);
 items[1].sourceSHA256=items[0].sourceSHA256;
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/duplicate or ambiguous/);
});
test('multi-item crop requires explicit reviewed source-linked cutout evidence',async()=>{
 const items=set();
 items[0].singleGarmentVerified=false;
 items[0].segmentHint={cutoutSHA256:'b'.repeat(64),originalSHA256:items[0].sourceSHA256};
 items[0].outfitSourceId='original-outfit';
 await assert.rejects(preflightOwnedOutfit1054(opts(items)),/cutout proof/);
 items[0].segmentHint.verified=true;
 items[0].segmentHint.ownerReviewedInstance=true;
 const result=await preflightOwnedOutfit1054(opts(items));
 assert.equal(result.slots[0].presentationMode,'verified-original-photo-2d');
 assert.equal(result.renderAuthorized3D,false);
});
test('missing private account attestation or nonfunction board normalizer refuses',async()=>{
 const items=set();
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{cleanBoard:null})),/adapter required/);
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{getSession:()=>null})),/signed owner session/);
});

test('new different-item duplicate saved during SHA verification blocks stale outfit',async()=>{
 const items=set();let reads=0;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  readOwnerItems:async()=>{
   const rows=structuredClone(items);
   if(++reads===2)rows.push({...structuredClone(items[0]),id:'other-garment'});
   return rows;
  }
 })),/new ambiguous or duplicate source/);
});
test('owner-reviewed cutout source changes between snapshots must be rejected',async()=>{
 const items=set(),src=items[0].sourceSHA256;
 items[0].singleGarmentVerified=false;
 items[0].segmentHint={
  cutoutSHA256:'a'.repeat(64),originalSHA256:src,
  verified:true,ownerReviewedInstance:true,clipped:false
 };
 items[0].outfitSourceId='owner-outfit';
 let reads=0;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  readOwnerItems:async()=>{
   const rows=structuredClone(items);
   if(++reads===2)rows[0].segmentHint.clipped=true;
   return rows;
  }
 })),/saved garment changed/);
});

test('native auth stores opaque string epoch, and it is accepted only while unchanged',async()=>{
 const items=set(),epoch='9d319ca3-0bf4-4558-9b73-423095bf296c';
 const options=opts(items,undefined,{getSession:()=>({...session(),epoch})});
 const result=await preflightOwnedOutfit1054(options);
 assert.equal(result.sessionEpoch,epoch);
 let latest=epoch;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),epoch:latest}),
  readOwnerItems:async()=>{latest='4f8a66fe-06a0-4d62-91f7-4da457984f14';return structuredClone(items);}
 })),/owner session changed/);
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),epoch:'x'})
 })),/signed owner session/);
});

test('M12 rejects same-owner NEW auth object even if owner, token, DB name and image stay unchanged',async()=>{
 const items=set();let currentAuth=authRef;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),authRef:currentAuth}),
  readOwnerItems:async()=>{currentAuth={user:{id:ownerId},assertCurrent(){}};return structuredClone(items);}
 })),/owner session changed/);
});
test('M12 rejects same-name replacement private IDB connection after asynchronous original fetch',async()=>{
 const items=set();let currentDB=privateDbRef,reads=0;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),privateDbRef:currentDB}),
  readOwnerItems:async()=>{
   if(++reads===2)currentDB={name:privateDbRef.name};
   return structuredClone(items);
  }
 })),/owner session changed/);
});
test('M12 rejects capture-generation replacement with unchanged signed identity and token',async()=>{
 const items=set();let generation=15;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),operationEpoch:generation}),
  readOwnerItems:async()=>{generation++;return structuredClone(items);}
 })),/owner session changed/);
});
test('M12 rejects same owner and token after revoked auth ref assertCurrent throws',async()=>{
 const items=set(),revoked={user:{id:ownerId},assertCurrent(){throw Error('session invalid');}};
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),authRef:revoked})
 })),/signed owner session/);
});
test('M12 never accepts owner-only lease, wrong owner reference, wrong DB ref or absent generation',async()=>{
 const items=set();
 for(const bad of [
  {authRef:null},
  {privateDbRef:null},
  {operationEpoch:undefined},
  {operationEpoch:-1},
  {operationEpoch:'x'},
  {authRef:{user:{id:'owner-B'}}},
  {privateDbRef:{name:'closet-current-user-owner-B'}}
 ]){
  await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
   getSession:()=>({...session(),...bad})
  })),/signed owner session/);
 }
});
test('M12 accepts fresh immutable wrapper each read ONLY while actual native refs remain identical',async()=>{
 const items=set();let calls=0;
 const result=await preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>{calls++;return {...session()};}
 }));
 assert.ok(calls>=4);
 assert.equal(result.renderAuthorized3D,false);
 assert.equal(result.status,'source-verified-2d-only');
 assert.equal(result.releaseAuthorized,false);
});
test('M12 different auth after final private source read cannot publish outfit IDs or old owner photo',async()=>{
 const items=set();let currentAuth=authRef,reads=0;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,undefined,{
  getSession:()=>({...session(),authRef:currentAuth}),
  readOwnerItems:async()=>{
   if(++reads===2)currentAuth={user:{id:ownerId},assertCurrent(){}};
   return structuredClone(items);
  }
 })),/owner session changed/);
});

test('M13 rejects first private read mutating selected slot before original SHA checks',async()=>{
 const items=[...set(),garment('second-shirt','Tops',11)],board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
 await assert.rejects(preflightOwnedOutfit1054(opts(items,board,{
  readOwnerItems:async()=>{
   board.slots.top='second-shirt';
   return structuredClone(items);
  }
 })),/outfit board changed/);
});
test('M13 rejects later private read replacing selected garment with same-owner item',async()=>{
 const items=[...set(),garment('second-shirt','Tops',11)];
 const board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
 let reads=0;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,board,{
  readOwnerItems:async()=>{
   if(++reads===2)board.slots.top='second-shirt';
   return structuredClone(items);
  }
 })),/outfit board changed/);
});
test('M13 rejects late outfit slot deletion after verified SHA read',async()=>{
 const items=set(),board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
 let reads=0;
 await assert.rejects(preflightOwnedOutfit1054(opts(items,board,{
  readOwnerItems:async()=>{
   if(++reads===2)delete board.slots.bottom;
   return structuredClone(items);
  }
 })),/outfit board changed/);
});
test('M13 rejects changed occasion even when slots, source hashes and owner stay identical',async()=>{
 const items=set(),board={occasion:'Casual',slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
 await assert.rejects(preflightOwnedOutfit1054(opts(items,board,{
  readOwnerItems:async()=>{board.occasion='Work';return structuredClone(items);}
 })),/outfit board changed/);
});
test('M13 detects changed native shopping ideas without persisting or mutating owner garments',async()=>{
 const items=set(),originals=items.map(x=>x.originalPhoto.image);
 const board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'},ideas:{layer:{type:'Cardigan',color:'Gray'}}};
 await assert.rejects(preflightOwnedOutfit1054(opts(items,board,{
  readOwnerItems:async()=>{
   board.ideas.layer.color='Black';
   return structuredClone(items);
  }
 })),/outfit board changed/);
 assert.deepEqual(items.map(x=>x.originalPhoto.image),originals);
});
test('M13 refuses mutable normalizer injected into native board verification',async()=>{
 const items=set(),board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
 await assert.rejects(preflightOwnedOutfit1054(opts(items,board,{
  cleanBoard:(b,rows)=>{const out=cleanBoard(b,rows);delete b.slots.shoes;return out;}
 })),/outfit board changed/);
});
test('M13 allows semantically same slot map with different insertion order',async()=>{
 const items=set(),board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
 const result=await preflightOwnedOutfit1054(opts(items,board,{
  readOwnerItems:async()=>{
   const entries=Object.entries(board.slots).reverse();
   board.slots=Object.fromEntries(entries);
   return structuredClone(items);
  }
 }));
 assert.equal(result.status,'source-verified-2d-only');
 assert.equal(result.renderAuthorized3D,false);
 assert.deepEqual(result.slots.map(x=>x.itemId),['shirt','pants','shoes']);
});
test('M13 rejects cyclic/oversized board style revision instead of claiming verified original',async()=>{
 const items=set(),cyclic={slots:{top:'shirt'}};cyclic.ideas={layer:cyclic};
 await assert.rejects(preflightOwnedOutfit1054(opts(items,cyclic)),/revision unavailable/);
 const oversized={slots:{top:'shirt'},ideas:{layer:{type:'Jacket',description:'x'.repeat(17000)}}};
 await assert.rejects(preflightOwnedOutfit1054(opts(items,oversized)),/revision unavailable/);
});
