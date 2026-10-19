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

test('fixed bodies have distinct shoulder/hip calibration and short hems',()=>{
 const board={slots:{top:'t',bottom:'b',layer:'l'}};
 const female=engine.plan(board,closet,'female'),male=engine.plan(board,closet,'male');
 assert.notDeepEqual(female.placements.map(p=>p.rect),male.placements.map(p=>p.rect));
 for(const sex of ['female','male']){
  for(const itemType of ['Shorts','Mini skirt']){
   const short=engine.plan({slots:{bottom:'b'}},[{...closet[1],itemType}],sex);
   const pants=engine.plan({slots:{bottom:'b'}},closet,sex);
   assert.ok(short.placements[0].rect.height<pants.placements[0].rect.height);
  }
 }
});
test('selfie positioning clamps invalid values and is separate for each fixed face',()=>{
 assert.notDeepEqual(engine.selfieRect('female'),engine.selfieRect('male'));
 const a=engine.selfieRect('male',{x:Infinity,y:NaN,zoom:'100'});
 assert.deepEqual(a,engine.selfieRect('male'));
 const b=engine.selfieRect('female',{x:1000,y:-1000,zoom:1000});
 assert.equal(b.width,19.5);assert.equal(b.height,12);
 assert.ok(Object.values(b).every(Number.isFinite));
});

test('four approved owned layers retain explicit bottom/top/jacket/shoe draw order',()=>{
 const selected={slots:{top:'t',bottom:'b',layer2:'l',shoes:'shoe'},layerCount:2};
 for(const figure of ['male','female']){
  const p=engine.plan(selected,closet,figure);
  assert.deepEqual(p.placements.map(x=>x.slot),['bottom','top','layer2','shoes']);
  assert.deepEqual(p.skipped,[]);
  assert.equal(p.usesRemoteAI,false);
 }
});
test('dress displaces bottoms and jackets without changing original source or selection',()=>{
 const board={slots:{top:'d',bottom:'b',layer2:'l',shoes:'shoe'},layerCount:2};
 const before=JSON.stringify({board,closet});
 const result=engine.plan(board,closet,'male');
 assert.deepEqual(result.placements.map(x=>x.slot),['top','shoes']);
 assert.equal(JSON.stringify({board,closet}),before);
});


test('held garment images show one accessible recapture path with original still saved',()=>{
 const html=fs.readFileSync('public/index.html','utf8');
 const ui=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const css=fs.readFileSync('public/style.css','utf8');
 assert.match(html,/id="reusableFigurePhotoHelp"[^>]*hidden/);
 assert.match(html,/id="reusableFigureRetake"[^>]*type="button"/);
 assert.match(ui,/updatePhotoHelp\(false\)/);
 assert.match(ui,/updatePhotoHelp\(counts\.skipped>0\)/);
 assert.match(ui,/switchView\('scan'\)/);
 assert.match(ui,/setCaptureMode\('single'\)/);
 assert.match(ui,/photoHelpText\.textContent=/);
 assert.match(ui,/photo is still saved/);
 assert.match(css,/reusable-figure-photo-help\[hidden\]/);
 assert.ok(!/fetch\(|\.setItem\(|localStorage|sessionStorage/.test(ui));
});
