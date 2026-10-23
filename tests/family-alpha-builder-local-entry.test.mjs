import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {alphaLocalEnabled,mountAlphaBuilderPreview} from '../public/family-alpha-preview-controller.mjs';
const html=readFileSync('public/index.html','utf8');
const boot=readFileSync('public/family-alpha-preview-boot.js','utf8');
const board=readFileSync('public/outfit-board.js','utf8');
test('new builder section is hidden, preview button is disabled and original editor is retained',()=>{
 assert.match(html,/<section id="familyAlphaLocalPreview" hidden/);
 assert.match(html,/<button id="familyAlphaPreviewStart"[^>]+disabled/);
 assert.match(html,/id="outfitFigure"/);assert.match(html,/id="boardSlots"/);
 assert.match(html,/id="familyAlphaPreviewReview"/);assert.match(html,/id="familyAlphaPreviewAvatar"/);
 assert.match(html,/src="family-alpha-preview-boot.js"/);
});
test('preview exposure is strictly localhost with explicit developer flag, not a login or query parameter',()=>{
 for(const hostname of ['nickhaney916-lang.github.io','closet-current.com','preview.closet-current.pages.dev','example.org','127.0.0.2']){
  assert.equal(alphaLocalEnabled({hostname,flag:true}),false);
 }
 for(const hostname of ['localhost','127.0.0.1']){
  assert.equal(alphaLocalEnabled({hostname,flag:false}),false);
  assert.equal(alphaLocalEnabled({hostname,flag:undefined}),false);
  assert.equal(alphaLocalEnabled({hostname,flag:true}),true);
 }
 assert.match(boot,/location.hostname/);
 assert.match(boot,/__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__!==true/);
 assert.doesNotMatch(boot,/location.search|URLSearchParams|localStorage|sessionStorage/);
});
test('production UI cannot mount private avatar without the explicit local dev flag',()=>{
 assert.throws(()=>mountAlphaBuilderPreview({localApproved:false}),/localhost-only/);
});
test('actual Outfit Builder emits preview invalidation on garment change before recomputing',()=>{
 const idx=board.indexOf('function renderOutfitBoard(){');
 const invalidate=board.indexOf("closet:alpha-board-changed",idx);
 const recompute=board.indexOf('currentBoard=cleanOutfitBoard(currentBoard,items)',idx);
 assert.ok(idx>=0&&invalidate>idx&&invalidate<recompute);
});
test('controller must call real server Auth and single-transaction private DB read; no raw account label or automatic source approval',()=>{
 const source=readFileSync('public/family-alpha-preview-controller.mjs','utf8');
 assert.match(source,/verifyAlphaAuthUser/);
 assert.match(source,/readAlphaSavedWardrobe/);
 assert.match(source,/renderAlphaLiveSnapshot/);
 assert.match(source,/prepareReviewedPhotoPresentation/);
 assert.match(source,/humanPreviewConfirmed/);
 assert.match(source,/sourcePixelAuditPassed/);
 assert.match(source,/sourceMask/); // protect source-related proof guards in review imports
 assert.doesNotMatch(source,/localStorage|\.src\s*=|console\.log|data:image\/svg/);
});
