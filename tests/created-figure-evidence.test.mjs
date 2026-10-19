import test from 'node:test';import assert from 'node:assert/strict';import {checkCreatedPacket} from '../benchmark/figure-creation/created-figure-gate.mjs';
function packet(){return {schemaVersion:1,status:'two-created-candidates-held-for-review',blenderVersion:'4.3.0',summary:{productionApproved:0,independentVisualApprovals:0,physicalPhones:0},blockers:['visual review missing'],figures:['female','male'].map(id=>({id,nativeSceneRender:true,resizedFromPreview:false,renderWidth:1941,renderHeight:3597,pngSha256:'a'.repeat(64),sceneSha256:'b'.repeat(64),legPoseMaxMotion:0,visualApproved:false,commercialProductApproval:false,jointApproval:false,variants:Object.fromEntries([['master',[1941,3597]],['minimum',[1294,2398]],['mobile',[970,1798]]].map(([name,[width,height]])=>[name,{width,height,frames:1,mode:'RGBA',iccProfilePresent:true,borderClear:true,sha256:'c'.repeat(64),transparentPixels:100,opaquePixels:200,softAlphaPixels:10}]))}))};}
test('actual scene/file diagnostic contract never grants production or photorealism approval',()=>{const r=checkCreatedPacket(packet());assert.equal(r.fileAndSceneDiagnosticsPassed,true);assert.equal(r.productionReady,false);assert.equal(r.photorealismVerified,false);});
test('third figures, duplicated bodies, stale engines and upscaled previews rejected',()=>{
 for(const mutate of [r=>r.figures.push(r.figures[0]),r=>r.figures[1].id='female',r=>r.blenderVersion='unknown',r=>r.figures[0].resizedFromPreview=true,r=>r.figures[0].renderWidth=160]){const r=packet();mutate(r);assert.throws(()=>checkCreatedPacket(r));}
});
test('hand/arm posing cannot silently alter legs or clip the delivered figure',()=>{
 for(const mutate of [r=>r.figures[0].legPoseMaxMotion=.01,r=>r.figures[0].variants.master.borderClear=false,r=>r.figures[0].sceneSha256=null]){const r=packet();mutate(r);assert.throws(()=>checkCreatedPacket(r));}
});
test('opaque backgrounds, lost alpha, unexpected frames and missing color profile are blocked',()=>{
 for(const mutate of [v=>v.transparentPixels=0,v=>v.softAlphaPixels=0,v=>v.frames=2,v=>v.iccProfilePresent=false,v=>v.width=160]){const r=packet();mutate(r.figures[0].variants.master);assert.throws(()=>checkCreatedPacket(r));}
});
test('fabricated licensing, landmark, appearance and physical-phone approvals are rejected',()=>{
 for(const mutate of [r=>r.figures[0].visualApproved=true,r=>r.figures[1].commercialProductApproval=true,r=>r.figures[0].jointApproval=true,r=>r.summary.physicalPhones=1,r=>r.blockers=[]]){const r=packet();mutate(r);assert.throws(()=>checkCreatedPacket(r));}
});
