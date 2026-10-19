'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const engine=require('../public/reusable-figure-engine.js');
const photo=type=>'data:image/'+type+';base64,'+'Ab9/'.repeat(40);
const closet=[
 {id:'t',category:'Tops',itemType:'T-shirt',color:'Blue',image:photo('png')},
 {id:'b',category:'Bottoms',itemType:'Jeans',color:'Black',image:photo('webp')},
 {id:'l',category:'Outerwear',itemType:'Jacket',color:'Red',image:photo('png')},
 {id:'shoe',category:'Shoes',itemType:'Sneakers',color:'White',image:photo('png')},
 {id:'d',category:'Dresses',itemType:'Dress',color:'Green',image:photo('png')}
];
test('figure selection always uses exactly two static reusable local assets',()=>{
 assert.deepEqual(Object.keys(engine.FIGURES),['female','male']);
 for(const sex of ['female','male']){
  const a=engine.plan({},[],sex);
  assert.match(a.figureImage,/^ai-models\/(male|female)-preview\.webp$/);
  assert.equal(a.usesRemoteAI,false);
  assert.equal(a.usesOwnedGarmentsOnly,true);
 }
 assert.equal(engine.plan({},[],'unrecognized').figure,'female');
});
test('owned shirt and bottoms are layered without changing original photos',()=>{
 const old=JSON.stringify(closet);
 const result=engine.plan({slots:{top:'t',bottom:'b',shoes:'shoe'}},closet);
 assert.deepEqual(result.placements.map(p=>p.slot),['bottom','top','shoes']);
 assert.equal(result.placements[1].image,closet[0].image);
 assert.equal(result.placements[1].category,'Tops');
 assert.equal(result.placements[1].primaryColor,'Blue');
 assert.equal(JSON.stringify(closet),old);
});
test('source validation refuses external garment URLs and arbitrary scripts',()=>{
 assert.equal(engine.isLocalGarmentImage('https://provider.test/private.jpg'),false);
 assert.equal(engine.isLocalGarmentImage('javascript:alert(1)'),false);
 assert.equal(engine.isLocalGarmentImage('data:text/html;base64,'+'AB9/'.repeat(40)),false);
 const plan=engine.plan({slots:{top:'t'}},[{...closet[0],image:'https://external.test/photo.png'}]);
 assert.deepEqual(plan.skipped,['top']);assert.equal(plan.placements.length,0);
});
test('dress excludes trousers and layers without modifying saved closet data',()=>{
 const board={slots:{top:'d',bottom:'b',layer:'l',shoes:'shoe'}};
 const result=engine.plan(board,closet);
 assert.deepEqual(result.placements.map(p=>p.slot),['top','shoes']);
 assert.equal(result.placements[0].rect.height,67);
 assert.equal(board.slots.bottom,'b');
 assert.equal(closet[1].image,photo('webp'));
});
test('incorrect category and duplicate item IDs are not overlaid',()=>{
 const plan=engine.plan({slots:{top:'t',bottom:'t',layer:'l'}},closet);
 assert.deepEqual(plan.placements.map(p=>p.slot),['top','layer']);
 assert.deepEqual(plan.skipped,['bottom']);
});
test('local UI has non-persistent optional selfie, no external try-on call, and a disabled paid panel',()=>{
 const html=fs.readFileSync('public/index.html','utf8');
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const ai=fs.readFileSync('public/ai-tryon.js','utf8');
 assert.match(html,/id="reusableFigureBase"/);
 assert.match(html,/id="reusableSelfieUpload"/);
 assert.match(html,/class="ai-tryon-panel"[^>]+ hidden/);
 assert.match(html,/script src="reusable-figure-engine\.js"/);
 assert.match(html,/script src="reusable-figure-preview\.js"/);
 assert.match(ui,/URL\.revokeObjectURL/);
 assert.match(ui,/ClosetWhiteMatte/);
 assert.match(ui,/owner!==lastOwner/);
 assert.ok(!/fetch\(|sessionStorage|localStorage|\.setItem\(/.test(ui));
 assert.match(ai,/if\(window\.ClosetReusableFigure\?\.FIGURES\)/);
 const edge=fs.readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(edge,/RESERVED_PAID_INFERENCE_APPROVED=false/);
 assert.match(edge,/CHAINED_PAID_INFERENCE_APPROVED=false/);
});
