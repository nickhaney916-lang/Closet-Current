import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createCatalogCrosswalk,createNativeCatalogCrosswalk} from '../research/p87-catalog-crosswalk/crosswalk.mjs';
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
function nativeSetup({read,cryptoProvider=webcrypto}={}){
 let session={authenticated:true,ownerId:'alice',epoch:1,operationEpoch:1,
  privateDbName:'closet-current-user-alice',authRef:{user:{id:'alice'},assertCurrent(){}},privateDbRef:{name:'closet-current-user-alice'}};
 let revision=1,records=[piece()];
 const api=createNativeCatalogCrosswalk({getSession:()=>session,getRevision:()=>revision,cryptoProvider,
  readOwnerItems:async scope=>{assert.equal(scope.privateDbRef,session.privateDbRef);scope.assertCurrent();return read?read(scope,()=>session,next=>session=next,()=>revision++):records;}});
 return {api,session:()=>session,setSession:next=>session=next,bump:()=>revision++,setRecords:next=>records=next};
}
test('native live auth/database references produce owner-correct source fallback with no reference export',async()=>{const s=nativeSetup();const r=await s.api.item('a');assert.equal(r.fallback.image,image);assert.ok(!JSON.stringify(r).includes('authRef'));assert.deepEqual((await s.api.query({category:'Tops'})).ids,['a']);});
test('same-owner re-login and identical-name database replacement during read invalidate native bridge',async()=>{
 for(const field of ['authRef','privateDbRef','epoch','operationEpoch']){
  const s=nativeSetup({read:async(scope,get,set)=>{const old=get();set({...old,[field]:field==='authRef'?{user:{id:'alice'}}:field==='privateDbRef'?{name:old.privateDbName}:2});return [piece()];}});
  await assert.rejects(s.api.item('a'),/native-session-or-content-changed/);
 }
});
test('native logout, foreign auth identity, wrong DB, missing revision and revoked auth fail closed',async()=>{
 for(const change of [{authenticated:false},{authRef:{user:{id:'bob'}}},{privateDbRef:{name:'closet-current-user-bob'}},{epoch:null},{operationEpoch:undefined},{authRef:{user:{id:'alice'},assertCurrent(){throw Error('revoked');}}}]){
  const s=nativeSetup();s.setSession({...s.session(),...change});await assert.rejects(s.api.query());
 }
 assert.throws(()=>createNativeCatalogCrosswalk({}),/native-interface-required/);
 const s=nativeSetup();
 const api=createNativeCatalogCrosswalk({getSession:s.session,getRevision:()=>undefined,readOwnerItems:async()=>[piece()]});await assert.rejects(api.query(),/native-content-revision-required/);
});
test('native edit/delete/restore revision changes cannot publish an older snapshot',async()=>{
 const s=nativeSetup({read:async(scope,get,set,bump)=>{bump();return [piece()];}});await assert.rejects(s.api.query(),/native-session-or-content-changed/);
 const normal=nativeSetup();await normal.api.query();normal.setRecords([]);normal.bump();assert.deepEqual((await normal.api.query()).ids,[]);
});
test('native same-owner auth replacement during JPEG hashing rejects old private pixels',async()=>{
 let change=()=>{};const cryptoProvider={subtle:{digest:async(...args)=>{change();return webcrypto.subtle.digest(...args);}}};
 const s=nativeSetup({cryptoProvider});change=()=>s.setSession({...s.session(),authRef:{user:{id:'alice'}}});await assert.rejects(s.api.item('a'),/stale-source/);
});
test('native revision provider cannot switch sessions while preparing a lease',async()=>{
 const s=nativeSetup();const api=createNativeCatalogCrosswalk({getSession:s.session,getRevision:()=>{s.setSession({...s.session(),authRef:{user:{id:'alice'}}});return 1;},readOwnerItems:async()=>[piece()]});await assert.rejects(api.query(),/native-session-changed/);
});
