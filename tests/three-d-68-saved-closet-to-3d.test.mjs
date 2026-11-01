import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {indexAuthenticatedSavedCloset,planIndexedBoardToAnatomical3D,previewExistingThreeSuggestions,swapRealBoardGarment,BOARD_SLOT_CATEGORY} from '../research/three-d-68/saved-closet-3d-adapter.mjs';
const owner='synthetic-account-a',session={authenticated:true,ownerId:owner,generation:7};
const makeJPEG=seed=>{
 const b=Buffer.alloc(128,seed);b[0]=0xff;b[1]=0xd8;b[126]=0xff;b[127]=0xd9;
 return 'data:image/jpeg;base64,'+b.toString('base64');
};
const original=makeJPEG(16),cutTop=makeJPEG(31),cutBottom=makeJPEG(32);
const item=(id,category,itemType,color,photo,{outfitSourceId,originalPhoto,userAdjusted=true,...rest}={})=>({
 id,image:photo,category,itemType,color,userAdjusted,colorSource:'user',
 savedAt:'2026-10-31T20:00:00Z',indexedAt:'2026-10-31T19:00:00Z',
 originalPhoto:originalPhoto?{image:originalPhoto}:undefined,
 outfitSourceId,requiresOwnershipConfirmation:false,...rest
});
const top=item('one','Tops','T-shirt','Navy',cutTop,{outfitSourceId:'same-true-camera-photo',originalPhoto:original});
const bottom=item('two','Bottoms','Jeans','Blue',cutBottom,{outfitSourceId:'same-true-camera-photo',originalPhoto:original});
const other=item('three','Tops','Blouse','Cream',makeJPEG(33));
const shoes=item('four','Shoes','Sneakers','White',makeJPEG(34));
const create=(items)=>({authenticated:true,ownerId:owner,generation:7,origin:'authenticated-account-scoped-closet-read',items});
test('actual stored closet PHOTO schema maps two clothing segments of same full original',async()=>{
 const snap=await indexAuthenticatedSavedCloset(create([top,bottom,other,shoes]),session);
 assert.equal(snap.validatedItems,4);
 assert.equal(snap.originalPhotosHashedLocally,true);
 assert.equal(snap.externalUpload,false);
 assert.equal(snap.releaseAuthorized,false);
 const expected=createHash('sha256').update(Buffer.from(original.split(',')[1],'base64')).digest('hex');
 assert.equal(snap.byId.get('one').sourceSHA256,expected);
 assert.equal(snap.byId.get('two').sourceSHA256,expected);
 assert.notEqual(snap.byId.get('one').sourceId,snap.byId.get('two').sourceId);
 assert.equal(snap.byId.get('one').originalOutfitGroup,'same-true-camera-photo');
 assert.equal(snap.byId.get('two').sourceFrom,'original-outfit-photo');
 const plan=planIndexedBoardToAnatomical3D({slots:{top:'one',bottom:'two',shoes:'four'}},snap);
 assert.equal(plan.selectedCount,3);
 assert.equal(plan.selected.top.anatomicalSlot,'shirt-or-dress');
 assert.equal(plan.selected.bottom.anatomicalSlot,'pants');
 assert.equal(plan.selected.top.sourceSHA256,plan.selected.bottom.sourceSHA256);
 assert.equal(plan.actual3DMeshReady,false);
 assert.equal(plan.fallback,'existing-2d-board-and-original-photo');
 assert.equal(plan.releaseAuthorized,false);
 const clean=JSON.stringify(plan);
 assert.doesNotMatch(clean,/data:image|base64|\xff\xd8|private garments/);
 assert.ok(!clean.includes(original));
 const swapped=swapRealBoardGarment({slots:{top:'one',bottom:'two'}},snap,{slot:'top',itemId:'three'});
 assert.equal(swapped.selected.top.itemId,'three');
 assert.equal(swapped.selected.bottom.itemId,'two');
 assert.ok(Object.keys(BOARD_SLOT_CATEGORY).includes('layer3'));
 const three=previewExistingThreeSuggestions([
  {slots:{top:'one',bottom:'two',shoes:'four'}},
  {slots:{top:'three',bottom:'two'}},
  {slots:{top:'one',shoes:'four'}}
 ],snap);
 assert.equal(three.length,3);assert.equal(three.every(x=>x.ownerId===owner),true);
});
test('automatic AI labels are not user-confirmed, even when saved and high confidence',async()=>{
 for(const flags of [
  {userAdjusted:false,confirmedDetails:undefined},
  {userAdjusted:false,confirmedDetails:{category:'Tops',itemType:'T-shirt'},colorSource:'photo-estimate'},
  {userAdjusted:true,colorSource:'photo-estimate'},
  {userAdjusted:true,possibleDuplicate:true},
  {userAdjusted:true,requiresOwnershipConfirmation:true},
  {userAdjusted:true,itemType:'Unknown'},
  {userAdjusted:true,color:'Unknown'},
  {userAdjusted:true,category:'Uncategorized'}
 ]){
  const suspect={...top,...flags};
  await assert.rejects(()=>indexAuthenticatedSavedCloset(create([suspect]),session),/confirmation|Uncertain category|Minimum color|user review|subtype|color needs/i);
 }
 const reviewMemory={...top,userAdjusted:false,confirmedDetails:{category:'Tops',itemType:'T-shirt'},colorSource:'user'};
 const result=await indexAuthenticatedSavedCloset(create([reviewMemory]),session);
 assert.equal(result.validatedItems,1);
});
test('auth session, same-user token refresh and account switches are fail-closed',async()=>{
 await assert.rejects(()=>indexAuthenticatedSavedCloset(create([top]),{...session,ownerId:'other-account'}),/authenticated/);
 await assert.rejects(()=>indexAuthenticatedSavedCloset({...create([top]),generation:8},session),/authenticated/);
 await assert.rejects(()=>indexAuthenticatedSavedCloset(create([top]),{...session,authenticated:false}),/authenticated/);
 await assert.rejects(()=>indexAuthenticatedSavedCloset(create([{...top,ownerId:'other-account'}]),session),/account mismatch/);
 let calls=0;
 await assert.rejects(()=>indexAuthenticatedSavedCloset(create([top]),session,{getCurrentSession:()=>{
  calls++;return calls>=2?{...session,generation:8}:session;
 }}),/authenticated/);
 const a=await indexAuthenticatedSavedCloset(create([top]),session,{getCurrentSession:()=>session});
 assert.equal(a.ownerId,owner);
});
test('outfit board reflects actual existing wardrobe slot types and dress/dup conflicts',async()=>{
 const dress=item('d','Dresses','Casual dress','Red',makeJPEG(57));
 const jacket=item('j','Outerwear','Jacket','Brown',makeJPEG(58));
 const bag=item('b','Accessories','Bag','Black',makeJPEG(59));
 const snap=await indexAuthenticatedSavedCloset(create([top,bottom,other,shoes,dress,jacket,bag]),session);
 assert.equal(planIndexedBoardToAnatomical3D({slots:{top:'d',shoes:'four'}},snap).selected.top.category,'Dresses');
 assert.throws(()=>planIndexedBoardToAnatomical3D({slots:{top:'d',bottom:'two'}},snap),/Dress is incompatible/);
 assert.throws(()=>planIndexedBoardToAnatomical3D({slots:{bottom:'two',layer2:'j'}},snap),/Layered outfit needs/);
 assert.equal(planIndexedBoardToAnatomical3D({slots:{top:'one',layer2:'j'}},snap).releaseAuthorized,false);
 assert.equal(planIndexedBoardToAnatomical3D({slots:{top:'one',layer2:'j',bag:'b'}},snap).selected.layer2.anatomicalSlot,'layer-2');
 assert.throws(()=>planIndexedBoardToAnatomical3D({slots:{top:'one',bottom:'one'}},snap),/category or subtype incompatible/);
 assert.throws(()=>planIndexedBoardToAnatomical3D({slots:{top:'one',layer:'one'}},snap),/cannot occupy two/);
 assert.throws(()=>planIndexedBoardToAnatomical3D({slots:{top:'one',unknown:'two'}},snap),/Unrecognized/);
 assert.throws(()=>planIndexedBoardToAnatomical3D({slots:{top:'one',shoes:'hidden-id'}},snap),/unauthorized/);
 assert.throws(()=>planIndexedBoardToAnatomical3D({slots:{top:'b'}},snap),/incompatible/);
 assert.throws(()=>previewExistingThreeSuggestions([{slots:{top:'one'}}],snap),/exactly three/);
});
test('false photo source, conflicting same-group originals and invalid binary are blocked',async()=>{
 await assert.rejects(()=>indexAuthenticatedSavedCloset(create([{...top,originalPhoto:{image:'https://example.invalid/personal.jpg'}}]),session),/JPEG unavailable/);
 await assert.rejects(()=>indexAuthenticatedSavedCloset(create([{...top,image:'data:image/jpeg;base64,AAAA'}]),session),/signature|JPEG unavailable/);
 await assert.rejects(()=>indexAuthenticatedSavedCloset(create([
  top,{...bottom,originalPhoto:{image:makeJPEG(88)}}
 ]),session),/conflicting original bytes/);
 await assert.rejects(()=>indexAuthenticatedSavedCloset(create([top,top]),session),/Duplicate/);
});
