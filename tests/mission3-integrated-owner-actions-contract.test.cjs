'use strict';
// Integrated Mission 3 source contract: all four independently developed
// owner-session controls coexist in the same real application build.
// Synthetic testing only; no accounts, cloud, model inference or deployment.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const app=readFileSync('public/app.js','utf8');
const section=(begin,end)=>{
 const a=app.indexOf(begin),b=app.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Missing integrated source span: '+begin);
 return app.slice(a,b);
};
test('same real app includes all four protected Mission 3 owner-session actions',()=>{
 const bulk=section("$('applyCategory').onclick=async()=>{","for(const season of clothingSchema.seasons.slice(0,4))");
 const style=section('function ownerStyleCardActionLease(item){','function ownerWardrobeMutationLease(){');
 const retry=section('function ownerFailedPhotoRetryLease(item){','function renderPhotoResults(grid,results){');
 const del=section('del.onclick=async()=>{',';if(typeof closetWearButton');
 assert.match(bulk,/lease=ownerWardrobeMutationLease\(\)/);
 assert.match(style,/window\.closetAuth!==auth/);
 assert.match(style,/captureOperationEpoch!==epoch/);
 assert.match(retry,/window\.closetAuth!==auth/);
 assert.match(retry,/captureOperationEpoch!==epoch/);
 assert.match(del,/lease=ownerWardrobeMutationLease\(\)/);
});
test('Style clicks in both results and My Closet bind to the same signed-owner lease',()=>{
 assert.match(app,/style\.onclick=\(\)=>withOwnerStyleCardAction\(item,style,async assertOwner=>/);
 assert.match(app,/styleNew\.onclick=\(\)=>withOwnerStyleCardAction\(item,styleNew,async assertOwner=>/);
 assert.doesNotMatch(app,/message\('Could not style that saved photo safely\. '\+String\(error/);
 assert.doesNotMatch(app,/message\('Could not reopen saved clothing for private styling\. '\+\s*String\(error/);
});
test('failed original-photo retry checks exact owner and does not reveal raw error',()=>{
 const span=section('function ownerFailedPhotoRetryLease(item){','function renderPhotoResults(grid,results){');
 assert.match(span,/await retryUncommittedCapture\(item\)/);
 assert.match(span,/if\(lease\.current\(\)&&button\.isConnected\)/);
 assert.match(app,/retry\.onclick=\(\)=>retryFailedPhotoFromCard\(item,retry\)/);
 assert.doesNotMatch(app,/message\('Photo is still not saved\. '\+String\(error\.message\|\|error\)/);
});
test('bulk category action preserves source JPEGs and suppresses late-owner acknowledgement',()=>{
 const span=section("$('applyCategory').onclick=async()=>{","for(const season of clothingSchema.seasons.slice(0,4))");
 assert.match(span,/commitReviewedDraftCAS\(changed\.map/);
 assert.match(span,/lease\.assertLease\(\);\s*if\(!stillReviewing\(\)\)/);
 assert.match(span,/message\('Categories saved in private device storage/);
 assert.doesNotMatch(span,/Your categories were not saved/);
 assert.match(app,/after\.originalPhoto\?\.image!==before\.originalPhoto\?\.image/);
});
test('family alpha release remains explicitly gated in source',()=>{
 assert.match(app,/familyAlpha:'HOLD',releaseAuthorized:false/);
 assert.match(app,/function ownerWardrobeMutationLease\(\)/);
 assert.match(app,/function photoEditorSessionLease\(\)/);
});
