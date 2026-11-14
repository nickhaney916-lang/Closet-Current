import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createCatalogCrosswalk} from '../research/p87-catalog-crosswalk/crosswalk.mjs';
import {digestBytes,jpegBytes} from '../public/native-canonical-photo-source-167.mjs';
const image='data:image/jpeg;base64,/9j/2Q=='; // synthetic envelope, never photo accuracy evidence
const sha=await digestBytes(jpegBytes(image),webcrypto);
const piece=(id='a',category='Tops',itemType='T-shirt')=>({id,ownerId:'alice',category,itemType,color:'Blue',confirmedDetails:{category,itemType},colorSource:'user',confirmedColor:true,sourceSHA256:sha,sourceHashVerified:true,singleGarmentVerified:true,originalPhoto:{image,sha256:sha}});
function setup(records=[piece()]){let token={ownerId:'alice',session:'1',database:'a',revision:'1'};let saved=records;const api=createCatalogCrosswalk({lease:()=>token,readSavedItems:async()=>saved,cryptoProvider:webcrypto});return {api,set:x=>saved=x,change:x=>Object.assign(token,x)};}
test('confirmed indexing, original fallback and no research certificate promotion',async()=>{const s=setup();assert.deepEqual((await s.api.query({category:'Tops',color:'blue'})).ids,['a']);const r=await s.api.item('a');assert.equal(r.fallback.image,image);assert.equal(r.state,'2D_ONLY');assert.equal(r.consumer3D,false);s.set([{...piece(),state:'3D_ELIGIBLE_VERIFIED',researchArtifact:{sourceSHA256:sha}}]);assert.equal((await s.api.item('a')).state,'3D_RESEARCH_CANDIDATE');});
test('suggestions, stale confirmations, Unknown and manual category edits',async()=>{const s=setup([{...piece(),category:'Bottoms',itemType:'Shorts'}]);assert.equal((await s.api.item('a')).category,'Uncategorized');s.set([piece('a','Bottoms','Unknown')]);assert.equal((await s.api.item('a')).itemType,'Unknown');assert.deepEqual((await s.api.query({slot:'bottom'})).ids,['a']);});
test('no guessed optional fields or photo-estimated color',async()=>{const s=setup([{...piece(),colorSource:'photo-estimate',brand:'Invented',name:'Secret prediction'}]);assert.equal((await s.api.item('a')).color,'Unknown');assert.equal((await s.api.query({search:'Invented'})).total,0);});
test('shoe pair stays one item; duplicates and multi-photo references never merge',async()=>{const a={...piece('a','Shoes','Sneakers'),pairId:'pair',garmentId:'g',possibleDuplicate:'b',sourceReferences:['photo1','photo2']};const s=setup([a,{...a,id:'b',pairId:null}]);assert.equal((await s.api.query()).total,2);const r=await s.api.item('a');assert.equal(r.pairId,'pair');assert.deepEqual(r.sourceReferences,['photo1','photo2']);assert.equal(r.duplicateCandidate,'b');});
test('multi-item source splits retain item and cutout identity',async()=>{const s=setup([{...piece('a'),singleGarmentVerified:false,segmentHint:{cutoutSHA256:'a'.repeat(64)}},{...piece('b'),singleGarmentVerified:false,segmentHint:{cutoutSHA256:'b'.repeat(64)}}]);assert.equal((await s.api.query()).total,2);assert.notEqual((await s.api.item('a')).cutout,(await s.api.item('b')).cutout);});
test('dress suppresses bottoms and layers; slot swap and layer order retain IDs',async()=>{const s=setup([piece('d','Dresses','Romper'),piece('b','Bottoms','Jeans'),piece('j','Outerwear','Jacket'),piece()]);assert.deepEqual((await s.api.board({slots:{top:'d',bottom:'b',layer2:'j'}})).slots,{top:'d'});assert.deepEqual(await s.api.board({slots:{top:'a',bottom:'b',layer2:'j',layer3:'j'}}),{slots:{top:'a',bottom:'b',layer2:'j'},layerCount:2});});
test('every retrieval uses fresh deletion, source revoke, edit and restore snapshot',async()=>{const s=setup();await s.api.item('a');for(const flag of ['deleted','sourceRevoked']){s.set([{...piece(),[flag]:true}]);await assert.rejects(s.api.item('a'),/unavailable/);}s.set([piece('restored')]);s.change({revision:'2'});assert.deepEqual((await s.api.query()).ids,['restored']);});
test('account switch, logout, foreign aliases and ownerless records fail closed',async()=>{for(const change of [{ownerId:'bob'},{ownerId:''}]){const s=setup();await s.api.query();s.change(change);await assert.rejects(s.api.query());}for(const record of [{...piece(),ownerId:undefined},{...piece(),userId:'bob'}])await assert.rejects(setup([record]).api.query());});
test('lease ABA, revision/database change during async read fail closed',async()=>{for(const field of ['session','revision','database']){let token={ownerId:'alice',session:'1',revision:'1',database:'a'};const api=createCatalogCrosswalk({lease:()=>token,readSavedItems:async()=>{token={...token,[field]:'changed'};return [piece()];},cryptoProvider:webcrypto});await assert.rejects(api.query(),/stale/);}});
test('invalid originals do not return a fallback or admit any mesh',async()=>{const s=setup([{...piece(),originalPhoto:{image,sha256:'a'.repeat(64)},researchArtifact:{sourceSHA256:sha}}]);const r=await s.api.item('a');assert.equal(r.fallback,null);assert.equal(r.state,'2D_ONLY');});
test('source mutation race and input immutability',async()=>{const record=piece();const original=structuredClone(record);const s=setup([record]);await s.api.item('a');assert.deepEqual(record,original);let token={ownerId:'alice',session:'1',revision:'1',database:'a'};const cryptoProvider={subtle:{digest:async(...args)=>{token.revision='2';return webcrypto.subtle.digest(...args);}}};const api=createCatalogCrosswalk({lease:()=>token,readSavedItems:async()=>[record],cryptoProvider});await assert.rejects(api.item('a'),/stale-source/);});
test('board selection changing during read cannot publish old slots',async()=>{const board={slots:{top:'a'}};const api=createCatalogCrosswalk({lease:()=>({ownerId:'alice',session:'1',database:'a',revision:'1'}),readSavedItems:async()=>{board.slots.top='other';return [piece()];},cryptoProvider:webcrypto});await assert.rejects(api.board(board),/board-changed/);});
test('IDs are never normalized into a different saved identity',async()=>{await assert.rejects(setup([piece(' a ')]).api.query(),/invalid-item-id/);});
test('actual P70 primary/companion receipts retain one shoe-pair unit and cannot transfer approval',async()=>{const a={...piece('a','Shoes','Sneakers'),reconciliation70:{ownerId:'alice',sourceSha256:sha,maskSha256:'a'.repeat(64)},reconciliation70Status:'paired_confirmed',shoePair:{confirmedByOwner:true,componentIds:['a','b'],companion:{reconciliation70:{ownerId:'alice',sourceSha256:sha,maskSha256:'b'.repeat(64)}}}};const s=setup([a]);let r=await s.api.item('a');assert.equal((await s.api.query()).total,1);assert.equal(r.unit.ownerConfirmed,true);assert.deepEqual(r.unit.componentIds,['a','b']);assert.equal(r.unit.sourceMaskReceipts.length,2);a.shoePair.componentIds=['a','a'];assert.equal((await s.api.item('a')).unit.ownerConfirmed,false);a.shoePair.componentIds=['a','b'];a.shoePair.companion.reconciliation70.ownerId='bob';assert.equal((await s.api.item('a')).unit.ownerConfirmed,false);a.requiresOwnershipConfirmation=true;assert.deepEqual((await s.api.item('a')).slotIds,[]);});
test('unresolved pair/fragment candidates cannot become confirmed outfit slots',async()=>{const s=setup([{...piece(),reconciliation70Status:'unresolved'}]);assert.deepEqual((await s.api.item('a')).slotIds,[]);assert.deepEqual((await s.api.board({slots:{top:'a'}})).slots,{});});

test('M30: mismatched original JPEG and unverified digest receipt never enter saved outfit slots',async()=>{
 const s=setup();
 const good=await s.api.item('a');
 assert.deepEqual(good.slotIds,['top','layer']);
 assert.deepEqual((await s.api.board({slots:{top:'a'}})).slots,{top:'a'});
 for(const damaged of [
  {...piece(),originalPhoto:{image,sha256:'b'.repeat(64)},sourceSHA256:'b'.repeat(64)},
  {...piece(),sourceHashVerified:false},
  {...piece(),originalPhoto:{image:null,sha256:sha}},
 ]){
  s.set([damaged]);
  const r=await s.api.item('a');
  assert.equal(r.category,'Uncategorized');
  assert.deepEqual(r.slotIds,[]);
  assert.equal(r.fallback,null);
  assert.equal(r.consumer3D,false);
  assert.deepEqual((await s.api.query({slot:'top'})).ids,[]);
  assert.deepEqual((await s.api.board({slots:{top:'a'}})).slots,{});
 }
 s.set([piece()]);
 assert.deepEqual((await s.api.board({slots:{top:'a'}})).slots,{top:'a'});
});
test('M30: ambiguous one-photo/multi-garment source cannot become outfit by label alone',async()=>{
 const s=setup([{...piece(),singleGarmentVerified:false}]);
 assert.deepEqual((await s.api.item('a')).slotIds,[]);
 assert.deepEqual((await s.api.board({slots:{top:'a'}})).slots,{});
 s.set([{...piece(),outfitSourceId:'source-a',singleGarmentVerified:true}]);
 assert.deepEqual((await s.api.item('a')).slotIds,[]);
});
test('M30: signed JPEG segment requires real cutout bytes, unchanged parent and reviewed crop',async()=>{
 const cutout='data:image/jpeg;base64,/9gA/9k=';
 const cutoutSHA=await digestBytes(jpegBytes(cutout),webcrypto);
 const base={...piece(),singleGarmentVerified:false,outfitSourceId:'source-a',segmentHint:{
  verified:true,ownerReviewedInstance:true,clipped:false,originalSHA256:sha,
  cutoutSHA256:cutoutSHA,cutoutImage:cutout
 }};
 const s=setup([base]);
 const valid=await s.api.item('a');
 assert.deepEqual(valid.slotIds,['top','layer']);
 assert.deepEqual((await s.api.board({slots:{top:'a'}})).slots,{top:'a'});
 for(const hint of [
  {...base.segmentHint,cutoutImage:null},
  {...base.segmentHint,cutoutSHA256:'b'.repeat(64)},
  {...base.segmentHint,originalSHA256:'c'.repeat(64)},
  {...base.segmentHint,clipped:true},
  {...base.segmentHint,verified:false},
  {...base.segmentHint,ownerReviewedInstance:false},
  {...base.segmentHint,ownerId:'bob'},
 ]){
  s.set([{...base,segmentHint:hint}]);
  assert.deepEqual((await s.api.item('a')).slotIds,[]);
  assert.deepEqual((await s.api.board({slots:{top:'a'}})).slots,{});
 }
 s.set([{...base,outfitSourceId:undefined}]);
 assert.deepEqual((await s.api.board({slots:{top:'a'}})).slots,{});
});
test('M30: unconfirmed shoe or split unit never gets a slot even when the saved subtype is confirmed',async()=>{
 const base={...piece('a','Shoes','Sneakers'),reconciliation70Status:'paired_confirmed',
  shoePair:{confirmedByOwner:true,componentIds:['a','b'],companion:{reconciliation70:{
   ownerId:'alice',sourceSha256:sha,maskSha256:'b'.repeat(64)
  }}},reconciliation70:{ownerId:'alice',sourceSha256:sha,maskSha256:'a'.repeat(64)}};
 const s=setup([base]);
 assert.deepEqual((await s.api.board({slots:{shoes:'a'}})).slots,{shoes:'a'});
 for(const update of [
  {shoePair:{...base.shoePair,confirmedByOwner:false}},
  {shoePair:{...base.shoePair,componentIds:['a','a']}},
  {shoePair:{...base.shoePair,companion:{reconciliation70:{...base.shoePair.companion.reconciliation70,ownerId:'bob'}}}},
  {reconciliation70Status:'unresolved'}
 ]){
  s.set([{...base,...update}]);
  assert.deepEqual((await s.api.board({slots:{shoes:'a'}})).slots,{});
 }
});
