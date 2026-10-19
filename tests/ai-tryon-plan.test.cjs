const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../public/ai-tryon-plan.js');
const uri=(color='AA')=>'data:image/jpeg;base64,'+color.repeat(160);
const items=[
 {id:'top',category:'Tops',image:uri('AB')},
 {id:'bottom',category:'Bottoms',image:uri('CD')},
 {id:'dress',category:'Dresses',image:uri('EF')},
 {id:'shoe',category:'Shoes',image:uri('GH')},
 {id:'coat',category:'Outerwear',image:uri('IJ')}
];
test('exactly two standard figures are available to the shared try-on planner',()=>{
 assert.deepEqual(P.FIGURES.map(x=>x.id),['female','male']);
 assert.equal(P.figure('male'),'male');
 assert.equal(P.figure('bogus'),'female');
});
test('existing closet garments are read in deterministic upper/body order',()=>{
 const b={slots:{top:'top',bottom:'bottom',shoes:'shoe',layer2:'coat'}};
 const out=P.plan(b,items);
 assert.deepEqual(out.steps.map(x=>x.category),['tops','bottoms']);
 assert.equal(out.steps[0].image,items[0].image);
 assert.ok(out.unsupportedSlots.includes('shoes'));
 assert.ok(out.unsupportedSlots.includes('layer2'));
 assert.equal(out.completeOutfit,false);
});
test('dress replaces bottom garments rather than rendering two conflicting outfits',()=>{
 const out=P.plan({slots:{top:'dress',bottom:'bottom'}},items);
 assert.deepEqual(out.steps.map(x=>x.category),['one-pieces']);
 assert.equal(out.dress,true);
 assert.ok(out.unsupportedSlots.includes('bottom'));
});
test('unrecognized, network or invalid garment sources are refused; bottom alone works',()=>{
 assert.equal(P.plan({slots:{top:'unknown',shoes:'shoe'}},items).steps.length,0);
 assert.equal(P.plan({slots:{bottom:'bottom'}},items).steps[0].slot,'bottom');
 assert.equal(P.validImage('https://example.com/photo.jpg'),false);
 assert.equal(P.validImage('data:image/jpeg;base64,a'.repeat(90)),false);
 assert.equal(P.validImage(uri()),true);
});
test('provider output size is independent of the smaller catalog upload limit',()=>{
 const output='data:image/jpeg;base64,'+'A'.repeat(7_600_000);
 assert.equal(P.validImage(output),false);
 assert.equal(P.validOutputImage(output),true);
 assert.equal(P.validOutputImage('data:image/jpeg;base64,'+'A'.repeat(10_000_000)),false);
 assert.equal(P.validOutputImage('data:image/jpeg;base64,A'),false);
 assert.equal(P.validOutputImage('https://example.com/generated.jpg'),false);
});
test('UI never exposes a provider key, runs paid inference automatically, or claims to render shoes',()=>{
 const ui=fs.readFileSync('public/ai-tryon.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 const board=fs.readFileSync('public/outfit-board.js','utf8');
 assert.match(ui,/\$\('tryOnGenerate'\)\.onclick=generateTryOn/);
 assert.match(ui,/ai-try-on/);
 assert.doesNotMatch(ui,/FASHN_API_KEY|api\.fashn\.ai/);
 assert.match(ui,/Not rendered:/);
 assert.match(html,/id="tryOnImage"[^>]*hidden/);
 assert.match(html,/Female AI model/);
 assert.match(html,/Male AI model/);
 assert.match(board,/onTryOnBoardChanged/);
});
