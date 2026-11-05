#!/usr/bin/env node
/**
 * Real Chromium/WebKit HTML native UI acceptance of REVIEW54 using actual
 * previously computed FashionCLIP uncertain diagnostic record on a source-
 * SHA-locked licensed original garment photo. This replays evidence and does
 * NOT claim the classifier was executed again in this isolated UI test.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';

const out='benchmark/review-alternatives-54/native-ui';
await mkdir(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0016');
const jpg=await readFile('benchmark/fixtures/commons-0016.jpg');
assert.equal(sha(jpg),source.sha256);
const evidence=JSON.parse(await readFile('benchmark/review-alternatives-54/source/results/holdout-16-baseline/results.json','utf8'))
 .find(x=>x.id==='commons-0016');
assert.equal(evidence.strong,false);
assert.equal(evidence.reason,'checks_disagree');
assert.equal(evidence.modelProfile,'fashionclip-baseline');
assert.equal(evidence.recognitionMemory?.features?.length,512);
const original={strong:evidence.strong,categoryConfirmed:evidence.categoryConfirmed,diagnostics:evidence.diagnostics};
const schema={types:{
 Tops:['T-shirt','Blouse','Tunic','Sweatshirt'],Bottoms:['Jeans','Skirt'],
 Dresses:['Casual dress','Formal dress'],Outerwear:['Jacket','Coat'],
 Shoes:['Sneakers','Ankle boots']
}};
const cats=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font:16px system-ui;margin:0;padding:12px;background:#fafafa;color:#16191c}img{display:block;max-width:100%;max-height:310px;object-fit:contain}main{max-width:430px;margin:auto}button,select,input{display:block;min-height:48px;max-width:100%;width:100%;margin:8px 0;padding:8px;box-sizing:border-box;font:inherit}button{background:#e4f1e8;border:1px solid #999;border-radius:7px}.multi24-actions{display:grid;gap:5px}.multi24-actions p{margin:6px 0}.note{font-size:14px;color:#434952}label{display:block;margin-top:8px}input[type=checkbox]{width:28px;height:28px;min-height:28px;display:inline-block}</style></head>
<body><main><h2>Closet Current · reviewed garment</h2>
<img src="/source.jpg" alt="Unchanged source-locked genuine original blouse photograph">
<p class="note">Choose from unverified model possibilities or correct the category manually. Nothing is saved until confirmed.</p>
<section id="options"></section>
<label>Main category<select id="category"><option>Uncategorized</option><option>Tops</option><option>Dresses</option><option>Bottoms</option><option>Outerwear</option><option>Shoes</option></select></label>
<label>Specific type<select id="type"><option>Unknown</option></select></label>
<label>Color (confirm visually)<input id="color"></label>
<label><input type="checkbox" id="confirmed">I confirm this visible garment, category and color</label>
<button id="save" disabled>Save confirmed garment</button>
<pre id="state"></pre></main></body></html>`;
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/'){res.writeHead(200,{'content-type':'text/html'});res.end(html);return;}
  if(path==='/source.jpg'){res.writeHead(200,{'content-type':'image/jpeg'});res.end(jpg);return;}
  if(path==='/research/multi-garment-capture-01/review-alternatives-54.mjs'){
   const bytes=await readFile(root+path);res.writeHead(200,{'content-type':'text/javascript'});res.end(bytes);return;
  }
  res.writeHead(404);res.end('Not found');
 }catch{res.writeHead(500);res.end('Error');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const results={schema:'review-alternatives-54/native-real-evidence-replay-v1',
 sourceSHA256:source.sha256,
 actualModelEvidence:{id:evidence.id,modelKey:evidence.recognitionMemory.modelKey,reason:evidence.reason,priorRun:41957999315,
  replayNotRerun:true},cases:[],screenshots:[]};
let browser;
try{
 for(const [engine,launcher]of [['chromium',chromium],['webkit',webkit]])for(const width of [320,390,430]){
  browser=await launcher.launch({headless:true});
  const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(origin+'/',{waitUntil:'load'});
  await page.evaluate(async({evidence,schema,cats,originalSHA})=>{
   const {reviewAlternatives54,applyReviewAlternative54,renderReviewAlternatives54}=await import('/research/multi-garment-capture-01/review-alternatives-54.mjs');
   const piece={cropReviewed:true,confirmed:false,category:'Uncategorized',itemType:'Unknown',color:'',sourceSHA256:originalSHA};
   const alternatives=reviewAlternatives54(evidence,schema,cats);
   const mainCategory=document.querySelector('#category'),type=document.querySelector('#type'),color=document.querySelector('#color'),
    confirmed=document.querySelector('#confirmed'),save=document.querySelector('#save'),state=document.querySelector('#state');
   const update=()=>{
    mainCategory.value=piece.category;
    type.replaceChildren(...['Unknown',...(schema.types[piece.category]||[])].map(x=>{const o=document.createElement('option');o.value=x;o.textContent=x;return o;}));
    type.value=piece.itemType;
    color.value=piece.color;
    confirmed.checked=piece.confirmed;
    save.disabled=!piece.confirmed||!piece.color||piece.category==='Uncategorized';
    state.textContent=JSON.stringify(piece);
   };
   const controls=renderReviewAlternatives54(document,alternatives,choice=>{
    if(applyReviewAlternative54(piece,choice,schema,cats))update();
   });
   if(controls)document.querySelector('#options').append(controls);
   mainCategory.onchange=()=>{piece.category=mainCategory.value;piece.itemType='Unknown';piece.confirmed=false;update();};
   type.onchange=()=>{piece.itemType=type.value;piece.confirmed=false;update();};
   color.oninput=()=>{piece.color=color.value;piece.confirmed=false;update();};
   confirmed.onchange=()=>{piece.confirmed=confirmed.checked&&piece.category!=='Uncategorized'&&!!piece.color;update();};
   update();
   window.review54Evidence={get:()=>({...piece}),alternatives:alternatives.map(x=>({...x}))};
  },{evidence:original,schema,cats,originalSHA:source.sha256});
  assert.equal(await page.locator('[data-review54="unverified-options"]').count(),1);
  assert.equal(await page.locator('[data-review54="choose-unverified"]').count(),3);
  assert.equal(await page.locator('#confirmed').isChecked(),false);
  assert.equal(await page.locator('#save').isDisabled(),true);
  async function shot(stage){
   const bytes=await page.screenshot({animations:'disabled',fullPage:true});
   const image=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
   assert.equal(image.width,width);
   assert.ok(stats.channels.some(x=>x.stdev>6));
   const file=engine+'-'+width+'-'+stage+'.png';
   await writeFile(out+'/'+file,bytes);
   results.screenshots.push({file,width,engine,sha256:sha(bytes),height:image.height});
  }
  await shot('uncertain-before-click');
  const option=page.getByRole('button',{name:/Review option: Tops · Tunic/});
  await option.click();
  assert.equal(await page.locator('#category').inputValue(),'Tops');
  assert.equal(await page.locator('#type').inputValue(),'Tunic');
  assert.equal(await page.locator('#color').inputValue(),'');
  assert.equal(await page.locator('#confirmed').isChecked(),false);
  assert.equal(await page.locator('#save').isDisabled(),true);
  let current=await page.evaluate(()=>window.review54Evidence.get());
  assert.equal(current.confirmed,false);
  assert.equal(current.sourceSHA256,source.sha256);
  // Human corrects subtype — the unverified model option was NOT assumed true.
  await page.locator('#type').selectOption('Blouse');
  await page.locator('#color').fill('White');
  assert.equal(await page.locator('#save').isDisabled(),true);
  await page.locator('#confirmed').check();
  assert.equal(await page.locator('#save').isEnabled(),true);
  current=await page.evaluate(()=>window.review54Evidence.get());
  assert.deepEqual({category:current.category,itemType:current.itemType,color:current.color,confirmed:current.confirmed},
   {category:'Tops',itemType:'Blouse',color:'White',confirmed:true});
  assert.equal(current.sourceSHA256,source.sha256);
  await shot('human-corrected-and-confirmed');
  results.cases.push({engine,width,sourceSHA256:source.sha256,
   originalPredictionsUnaffected:true,alternativeExplicitlySelected:true,
   selectedAITypeNotAssumedCorrect:true,humanSubtypeCorrection:'Blouse',
   blockedUntilHumanConfirmation:true,verifiedUIState:true});
  await context.close();await browser.close();browser=null;
 }
 assert.equal(results.cases.length,6);
 assert.equal(results.screenshots.length,12);
 await writeFile(out+'/acceptance.json',JSON.stringify(results,null,2)+'\n');
 console.log('REVIEW54 genuine-photo actual-model-evidence HTML REVIEW UI: '+JSON.stringify({
  browserCases:results.cases.length,screenshots:results.screenshots.length,
  allUnverifiedBeforeClick:true,allHumanCorrectionsAndConfirmation:true
 }));
}catch(e){
 results.failure=String(e.stack||e);
 await writeFile(out+'/acceptance.json',JSON.stringify(results,null,2)+'\n');
 throw e;
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
