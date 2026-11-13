'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
globalThis.crypto ||= require('node:crypto').webcrypto;
const C=require('../public/cross-capture-duplicate-77.js');
const app=fs.readFileSync('public/app.js','utf8');
const index=fs.readFileSync('public/index.html','utf8');
const jpeg=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,255,224,n,n+1,0,1,255,217]).toString('base64');
const features=()=>({modelKey:'version-p849',features:[1,...Array(511).fill(0)]});
const item=(id,n)=>({id,ownerId:'owner-A',image:jpeg(n),name:id,category:'Tops',
 visualSignature:Array(768).fill(25),visualAspect:.75,recognitionMemory:features(),userAdjusted:false});
const scope=()=>C.open({ownerId:'owner-A',sessionId:'p849-scope-safe',live:()=> 'owner-A'});

test('P849 fixes synchronous Adjust draft mutation race before asynchronous original JPEG hashing',async()=>{
 const s=scope(),draft=item('new',15);
 const unsafe=C.evidence(draft,s);
 draft.userAdjusted=true;
 await assert.rejects(unsafe,/P77_STALE_SOURCE/);
 const safeDraft=item('new2',16);
 const safe=Promise.resolve().then(()=>C.evidence(safeDraft,s));
 safeDraft.userAdjusted=true;
 const receipt=await safe;assert.equal(receipt.itemId,'new2');
 assert.match(receipt.sourceSha256,/^[a-f0-9]{64}$/);
 C.close(s);
 assert.ok(app.includes('Promise.resolve().then(()=>CrossCaptureDuplicate77.propose(item,items,cross77Scope'));
});
test('P849 cross-owner/revision guard happens after consent hash and directly before owner-private write',()=>{
 const i=app.indexOf('const reviewed72=await confirmedLearningValue72(');
 const fence=app.indexOf("throw Error('P849_CHANGED_CANDIDATE_OR_OWNER')",i);
 const write=app.indexOf('await savePiece(reviewed72,',i);
 assert.ok(i>=0&&fence>i&&write>fence,'owner/candidate source fence before save');
 assert.match(app,/if\(cross77Scope\)\{/);
 assert.match(app,/source72!==item\.image\|\|origin72!==item\.recognitionPhoto\?\.image/);
 assert.match(app,/oldSource\.revisionSha256!==cross77Decision\.candidateRevisionSha256/);
 assert.match(app,/cross77Scope&&!CrossCaptureDuplicate77\.valid\(cross77Scope\)/);
});
test('P849 candidate is owner-only, top one, research OFF unless explicitly selected',()=>{
 assert.match(app,/searchParams\.get\('crossCapture77'\)==='1'&&pendingDraft/);
 assert.match(app,/CrossCaptureDuplicate77\.propose\(item,items,cross77Scope,\{topK:1\}\)/);
 assert.match(app,/db\?\.name==='closet-current-user-'\+owner/);
 assert.match(index,/cross-capture-duplicate-77\.js/);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/let saveInFlight=false;/);
});
test('P849 no automatic merge or duplicated physical unit, while existing safety integrations remain',async()=>{
 const s=scope(),incoming=item('new',1),existing=item('old',2);
 const proposal=await C.propose(incoming,[existing],s);
 assert.equal(proposal.abstained,false);
 const receipt=await C.decide(proposal,s,{action:'same-pending',candidateId:'old',acknowledged:true});
 assert.equal(receipt.persisted,false);assert.equal(receipt.linked,false);
 assert.equal(receipt.needsAtomicAdapter,true);
 assert.equal(existing.alternateViews77,undefined);
 assert.match(app,/function unit70OwnerEvidenceValid/);
 assert.match(app,/purgePhotoQualityHints845/);
 assert.match(app,/attachLearningConsent72/);
 assert.match(app,/duplicateUnit70InCloset\(item,items\)/);
 C.close(s);
});
test('P849 candidate review must never override an account switch or change to old item',async()=>{
 let owner='owner-A';const s=C.open({ownerId:'owner-A',sessionId:'p849-scope-revoked',live:()=>owner});
 const incoming=item('new',13),old=item('old',14);
 const p=await C.propose(incoming,[old],s);
 old.name='edited from another tab';
 await assert.rejects(()=>C.decide(p,s,{action:'different',candidateId:'old',acknowledged:true}),/STALE_PROPOSAL/);
 const q=await C.propose(incoming,[old],s);owner='owner-B';
 await assert.rejects(()=>C.decide(q,s,{action:'different',candidateId:'old',acknowledged:true}),/STALE_PROPOSAL/);
});
