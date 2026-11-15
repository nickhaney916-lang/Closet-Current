import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {verifiedRecord24} from '../research/multi-garment-capture-01/atomic-group.mjs';
import {preflightOwnedOutfit1054} from '../research/main-thread-integration-1054/source-to-outfit.mjs';
import {preflightReviewedPhotoOnly59} from '../research/master-consolidation-1054/reviewed-photo-only-handoff59.mjs';
const ctx={URL,encodeURIComponent};
vm.createContext(ctx);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),ctx);
const cleanBoard=(board,rows)=>ctx.cleanOutfitBoard(board,rows);
const manifest=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
const owner='m59-synthetic-owner-A';
const auth={user:{id:owner},assertCurrent(){}};
const privateDb={name:'closet-current-user-'+owner};
const getSession=()=>({authenticated:true,ownerId:owner,epoch:11,
 operationEpoch:8,privateDbName:privateDb.name,authRef:auth,privateDbRef:privateDb});
function original(id){
 const bytes=readFileSync('benchmark/fixtures/'+id+'.jpg');
 const sha=createHash('sha256').update(bytes).digest('hex');
 const rights=manifest.find(x=>x.id===id);
 assert.equal(rights?.verified,true);
 assert.equal(rights.sha256,sha);
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {image,sha};
}
function garment(id='commons-0003',category='Dresses',itemType='Casual dress',
 instance='manual-60-60-700-700'){
 const p=original(id);
 // The original image is a stand-in for manually cropped pixels ONLY in
 // this record-shape test. No actual garment accuracy/instance claim.
 return verifiedRecord24({ownerId:owner,
  proof:{sourceSHA256:p.sha,sourceHashVerified:true,image:p.image,
   originalPhoto:{image:p.image,sha256:p.sha}},
  piece:{id:'saved-'+id+'-'+instance,instanceKey:instance,
   manual:true,cropReviewed:true,confirmed:true,
   cropBounds:{x:.06,y:.06,width:.7,height:.7},
   image:p.image,category,itemType,color:'Black',hint:null}
 });
}
function kit(rows=[garment()],board={slots:{top:rows[0].id}},over={}){
 return {rows,board,getSession,readOwnerItems:async()=>structuredClone(rows),
  cleanBoard,...over};
}
function run(k){return preflightReviewedPhotoOnly59(k);}
test('M59 genuine licensed original, manually reviewed private photo is displayable ONLY as warned photo gallery',async()=>{
 const k=kit(),originalValue=structuredClone(k.rows[0]);
 const plan=await run(k);
 assert.equal(plan.status,'reviewed-original-gallery-only-physical-unit-unverified');
 assert.equal(plan.unitIdentityVerified,false);
 assert.equal(plan.fittedOutfitAuthorized,false);
 assert.equal(plan.renderAuthorized3D,false);
 assert.equal(plan.originalPhotoOnly,true);
 assert.equal(plan.slots.length,1);
 assert.equal(plan.slots[0].presentationMode,'original-photo-gallery-only');
 assert.equal(plan.slots[0].physicalGarmentCountVerified,false);
 assert.match(plan.warning,/physical garment boundaries/i);
 assert.deepEqual(k.rows[0],originalValue);
 const printable=JSON.stringify(plan);
 assert.equal(printable.includes('data:image'),false);
 assert.equal(printable.includes(owner),false);
 assert.equal(printable.includes('authRef'),false);
 assert.equal(plan.releaseAuthorized,false);
 assert.equal(plan.familyAlpha,'HOLD');
 await assert.rejects(preflightOwnedOutfit1054(k),/review evidence/,
  'existing strong verified-single native route must NEVER silently loosen');
});
test('M59 two source-distinct reviewed photos can appear in separate native slots without outfit-fit claims',async()=>{
 const top=garment('commons-0003','Tops','T-shirt');
 const bottom=garment('commons-0053','Bottoms','Jeans','manual-120-120-600-600');
 const k=kit([top,bottom],{slots:{top:top.id,bottom:bottom.id}});
 const plan=await run(k);
 assert.deepEqual(plan.slots.map(s=>s.slot),['top','bottom']);
 assert.notEqual(plan.slots[0].sourceSHA256,plan.slots[1].sourceSHA256);
 assert.equal(plan.fittedOutfitAuthorized,false);
});
test('M59 ambiguous same-original multiple physical regions refuse, including when only one is selected',async()=>{
 const first=garment(),second=garment('commons-0003','Dresses','Casual dress','manual-300-300-400-400');
 await assert.rejects(run(kit([first,second],{slots:{top:first.id}})),
  /duplicated or ambiguous same-original/);
});
test('M59 refuses forged saved row fields and unresolved mask evidence rather than assuming a physical piece',async()=>{
 const mutations=[
  row=>{row.sourceCropReviewed=false;},
  row=>{row.extractionReview='unverified';},
  row=>{row.ownerId='other';},
  row=>{row.userAdjusted=false;},
  row=>{row.singleGarmentVerified=true;},
  row=>{row.photoOnly=false;},
  row=>{row.threeDReady=true;},
  row=>{row.sourceExtraction='invented';},
  row=>{row.sourcePieceKey='wrong';},
  row=>{row.colorSource='photo-estimate';},
  row=>{row.segmentHint={componentReviewStatus:'unresolved_fragments_keep_source_mask'};},
  row=>{row.originalPhoto.sha256='f'.repeat(64);},
  row=>{row.originalPhoto.image='data:image/jpeg;base64,'+Buffer.from([255,216,255,217]).toString('base64');},
  row=>{row.possibleDuplicate=true;},
  row=>{row.itemType='Unknown';},
  row=>{row.color='Unknown';},
  row=>{row.requiresOwnershipConfirmation=true;}
 ];
 for(const mutate of mutations){
  const row=garment();mutate(row);
  await assert.rejects(run(kit([row])),undefined,
   'unsafe photo-only source mutation must fail closed');
 }
});
test('M59 rejects same-ID two board slots, incompatible slot, and dress/bottom suppression',async()=>{
 const dress=garment(),pants=garment('commons-0053','Bottoms','Jeans');
 for(const board of [
  {slots:{top:dress.id,bottom:dress.id}},
  {slots:{bottom:dress.id}},
  {slots:{top:dress.id,bottom:pants.id}}
 ])await assert.rejects(run(kit([dress,pants],board)));
});
test('M59 changed owner, replaced auth or private DB, and capture generation fail during await',async()=>{
 const row=garment();
 for(const mutate of ['epoch','auth','db','generation']){
  let calls=0;
  let epoch=11,operationEpoch=8;
  let authRef=auth,privateDbRef=privateDb;
  const k=kit([row],{slots:{top:row.id}},{
   getSession:()=>({...getSession(),epoch,operationEpoch,authRef,privateDbRef}),
   readOwnerItems:async()=>{
    if(++calls===1){
     if(mutate==='epoch')epoch++;
     if(mutate==='auth')authRef={user:{id:owner},assertCurrent(){}};
     if(mutate==='db')privateDbRef={name:privateDb.name};
     if(mutate==='generation')operationEpoch++;
    }
    return structuredClone([row]);
   }
  });
  await assert.rejects(run(k),/session changed/);
 }
});
test('M59 stale garment and board mutation on second private read never publish a source plan',async()=>{
 const row=garment(),board={slots:{top:row.id}};
 let reads=0;
 const k=kit([row],board,{readOwnerItems:async()=>{
  reads++;
  const fresh=structuredClone([row]);
  if(reads===2)fresh[0].color='Red';
  return fresh;
 }});
 await assert.rejects(run(k),/garment changed/);
 reads=0;const changedBoard=kit([row],board,{readOwnerItems:async()=>{
  reads++;if(reads===2)board.occasion='Work';
  return structuredClone([row]);
 }});
 await assert.rejects(run(changedBoard),/outfit board changed/);
});
test('M59 source-tampered JPEG bytes with unchanged SHA cannot reach gallery',async()=>{
 const row=garment();
 row.originalPhoto.image=original('commons-0053').image;
 await assert.rejects(run(kit([row])),/JPEG bytes do not match/);
});
test('M59 unreviewed model proposal has no saved private source and cannot pass',async()=>{
 const row=garment();row.extractionReview='unverified';row.sourceCropReviewed=false;
 await assert.rejects(run(kit([row])));
});
