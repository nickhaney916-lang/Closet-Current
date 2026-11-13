import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {family76,analyzeColor76,sampleMask76,proposalMatches76} from '../public/garment-color-76.mjs';

const app=readFileSync('public/app.js','utf8');
const capture=readFileSync('public/outfit-capture.js','utf8');
const worker=readFileSync('public/outfit-worker.mjs','utf8');
const memory=readFileSync('public/clothing-memory.js','utf8');
const html=readFileSync('public/index.html','utf8');
const SHA1='1'.repeat(64),SHA2='2'.repeat(64);
const bind=(owner='owner-A')=>({ownerId:owner,requestId:'job-A',sourceSha256:SHA1,maskSha256:SHA2});
function sample(r,g,b){const w=36,h=36,selected=new Uint8Array(w*h).fill(1),pixels=new Uint8Array(w*h*3);
for(let i=0;i<w*h;i++)pixels.set([r,g,b],i*3);
return sampleMask76({width:w,height:h,channels:3,data:pixels},{width:w,height:h},{selected,clipped:false});}

test('P848 defaults to P847 mandatory owner review while all three optional outfit color flags are required',()=>{
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/let saveInFlight=false;/);
 assert.match(app,/I checked the garment photo and confirmed its category/);
 assert.match(app,/attachLearningConsent72\(form,learningScope72\(\)\)/);
 assert.match(app,/function unit70OwnerEvidenceValid/);
 assert.match(app,/purgePhotoQualityHints845/);
 assert.match(capture,/const outfitColor76=outfitUnits70&&/);
 assert.match(capture,/searchParams\.get\('color76'\)==='1'/);
 assert.match(capture,/const outfitUnits70=outfitInstances840&&/);
 assert.match(html,/Review each garment before saving/);
});
test('P848 research proposal is a read-only, separately attributable original/mask/owner diagnostic',()=>{
 const p=analyzeColor76(sample(10,24,53),bind());
 assert.equal(p.status,'review');assert.equal(p.proposedPrimary,'Blue');
 assert.equal(proposalMatches76(p,bind()),true);
 for(const invalid of [{ownerId:'owner-B'},{maskSha256:'3'.repeat(64)},{sourceSha256:'4'.repeat(64)},{requestId:'job-B'}])
  assert.equal(proposalMatches76(p,{...bind(),...invalid}),false);
 assert.equal(family76(5,5,5),'Black');
});
test('P848 guarantees source binding hash must be generated from current original JPEG in page before showing color',()=>{
 assert.match(capture,/sourceDigest:outfitColor76\?originalSha256ForColor76\(image\):null/);
 assert.match(capture,/sourceProof===p\.reconciliation70\?\.sourceSha256&&sourceProof===color\.sourceSha256/);
 assert.match(capture,/color\.maskSha256===p\.reconciliation70\?\.maskSha256/);
 assert.match(capture,/color\.ownerId===job\.ownerId&&color\.requestId===job\.id/);
 assert.match(capture,/const safeColorEstimate76=verifiedColor76\?p\.colorEstimate:null/);
});
test('P848 does not mutate original image pixels, mask, private wardrobe or colorSource on suggestion',()=>{
 const s=sample(235,225,208),unchanged=structuredClone(s);
 const p=analyzeColor76(s,bind());
 assert.equal(p.status,'review');
 assert.deepEqual(s,unchanged);
 assert.equal('colorSource' in p,false);
 assert.equal('ownerChecked' in p,false);
 assert.equal('itemId' in p,false);
 assert.ok(!/savePiece\(|writeAll\(|localStorage\.setItem\(/.test(readFileSync('public/garment-color-76.mjs','utf8')));
});
test('P848 owner learning remains separately consented and P846 paired items cannot be automatically trained or saved',()=>{
 assert.match(app,/if\(value\.shoePair\|\|value\.combinedFragments70\|\|value\.reconciliation70Status\)/);
 assert.match(app,/duplicateUnit70InCloset\(item,items\)/);
 assert.match(app,/item\.reconciliation70Status==='unresolved'/);
 assert.match(app,/if\(saveInFlight\)\{message\('This photo is already being saved.'/);
 assert.match(memory,/correctionReceipt72/);
 assert.match(capture,/job\.ownerId!==unit70Owner\(\)/);
 assert.match(worker,/const color76=request\.color76===true&&request\.instanceReview70===true/);
});
test('P848 bounded pixel sampling and source mismatch remain review-only with no confidence transfer',()=>{
 const p=analyzeColor76(sample(240,230,214),bind());
 assert.equal(p.status,'review');
 assert.equal(p.proposedPrimary,'Beige');
 assert.ok(p.sampleCount<=1024);
 assert.ok(p.sampleCount>0);
 const noBinding=analyzeColor76(sample(10,24,53),{...bind(),ownerId:''});
 assert.equal(noBinding.status,'abstain');
 assert.ok(noBinding.reasons.includes('unbound_photo_or_owner'));
});
