// Synthetic garment JPEG bytes through browser decoders; not real physical phones.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,webkit} from 'playwright';
const src=fs.readFileSync('public/trends.js','utf8');
const snippets=[
 src.slice(src.indexOf('let inspirationLooks='),src.indexOf('function trendSelect(')),
 src.slice(src.indexOf("$('lookImage').onchange="),src.indexOf('for(const season of clothingSchema.seasons.slice(0,4))')),
 src.slice(src.indexOf("$('referenceToCloset').onclick="),src.indexOf('async function reloadCloudLooks('))
].join('\n');
const converter=fs.readFileSync('public/photo-import.js','utf8');
const initializer=[
 "let busy=false;window.closetAuth={user:{id:'user-one'}};",
 "window.__test={photos:[],messages:[],views:[]};",
 "const ui={};",
 "const $=id=>ui[id]||(ui[id]=(()=>{const item=document.createElement(id==='lookImage'?'input':(id==='referenceToCloset'?'button':'div'));if(id==='lookImage')item.type='file';return item;})());",
 "function message(msg){window.__test.messages.push(msg);}",
 "function candidate(photo){window.__test.photos.push(photo);return true;}",
 "function switchView(view){window.__test.views.push(view);}",
 "function renderLookPieces(){}function renderTrendMatches(){}",
 converter,snippets
].join('\n');
const outcomes=[];
for(const [label,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!/^(blob:|data:)/.test(r.url()))requests.push(r.url());});
  await page.goto('about:blank');
  await page.addScriptTag({content:initializer});
  const result=await page.evaluate(async()=>{
   const c=document.createElement('canvas');c.width=3600;c.height=2700;
   const ctx=c.getContext('2d');ctx.fillStyle='#f8f2dd';ctx.fillRect(0,0,c.width,c.height);
   ctx.fillStyle='#1742a8';ctx.fillRect(200,100,3200,2400);
   for(let x=200;x<3400;x+=24){ctx.fillStyle=x%3?'#e6e0a9':'#f04a24';ctx.fillRect(x,100,6,2400);}
   const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.95));
   const file=new File([blob],'synthetic-owned-shirt.jpg',{type:'image/jpeg'});
   const input=$('lookImage'),dt=new DataTransfer();dt.items.add(file);input.files=dt.files;
   await input.onchange({target:input});
   const preview=$('inspirationPreview').src,previewImage=await createImageBitmap(await(await fetch(preview)).blob());
   const previewDimensions=[previewImage.width,previewImage.height];previewImage.close();
   const originalPresent=lookOriginalFile===file&&lookOriginalOwner==='user-one';
   await $('referenceToCloset').onclick();
   const photo=window.__test.photos[0]||'';
   const full=await createImageBitmap(await(await fetch(photo)).blob());
   const originalDimensions=[full.width,full.height];full.close();
   clearLookOriginal();
   await $('referenceToCloset').onclick();
   const duplicateFromStoredPreview=window.__test.photos.length>1;
   const dt2=new DataTransfer();dt2.items.add(file);input.files=dt2.files;
   await input.onchange({target:input});
   window.closetAuth.user.id='user-two';
   await $('referenceToCloset').onclick();
   return {previewDimensions,originalDimensions,originalPresent,
    transferred:window.__test.photos.length,
    duplicateFromStoredPreview,crossAccountBlocked:lookOriginalFile===null,
    firstIsFullSize:photo.length>preview.length,
    photoLen:photo.length,previewLen:preview.length};
  });
  assert.deepEqual(result.previewDimensions,[900,675]);
  assert.deepEqual(result.originalDimensions,[3072,2304]);
  assert.equal(result.originalPresent,true);
  assert.equal(result.transferred,1);
  assert.equal(result.duplicateFromStoredPreview,false);
  assert.equal(result.crossAccountBlocked,true);
  assert.equal(result.firstIsFullSize,true);
  assert.ok(result.photoLen<=2850000);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  outcomes.push({browser:label,preview:result.previewDimensions,recognitionSource:result.originalDimensions,
   originalFirst:true,stalePreviewBlocked:true,crossAccountTransferBlocked:true,
   sourceBytesStoredWithInspiration:false,physicalPhoneTested:false,privateUploads:0});
  console.log(JSON.stringify(outcomes[outcomes.length-1]));
  await context.close();
 }finally{await browser.close();}
}
console.log(JSON.stringify({status:'PASS',emulated:outcomes.length,realGarmentAccuracy:null,productionReleaseApproved:false}));
