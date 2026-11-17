/** M169 source-locked actual native 24MP-P95 selected JPEG reentry on same signed owner document. Research-only. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
const engine=process.env.M58_ENGINE;
assert.ok(engine==='chromium'||engine==='webkit','actual two-engine browser required');
assert.equal(process.env.P96_NATIVE_4K,'true','authentic public 4000x6000 required');
assert.equal(process.env.P94_WIDTH,'390');
const donor='scripts/test-parallel96-native-highres-browser.mjs';
const sha=execFileSync('git',['rev-parse','HEAD:'+donor],{encoding:'utf8'}).trim();
assert.equal(sha,'58194c1bbcfca7b46f1c71b1ee0cc00c3dbc88c7',
 'M169 donor source changed: re-audit required');
const original=readFileSync(donor,'utf8');
const anchor=[
 " assert.equal(await page.locator('#outfit3D01Canvas').count(),0,",
 "  'M161 source-only two-cutout outfit must not imply fitted garment 3D');"
].join('\n');
assert.equal(original.split(anchor).length,2,'M169 same-document 24MP splice moved');
const extension=String.raw`
 // M169 genuine model already ran; true 4000x6000 immutable original shown
 // in TWO independently owner-reviewed, source-matched native outfit slots.
 stage='m169-same-signed-owner-24mp-selected-original-source-revocation';
 assert.equal(await page.locator('#mission4Preview1054Photos img').count(),2);
 assert.match(await page.locator('#mission4Preview1054Status').innerText(),
  /original photo\(s\) verified.*2D only/);
 const m169Mutation=await page.evaluate(()=>{
  const row=items.find(x=>x?.id===currentBoard?.slots?.top);
  if(!row||typeof row.originalPhoto?.image!=='string')
   throw Error('M169 selected original/photo row unavailable');
  row.originalPhoto.image='data:image/jpeg;base64,/9j/2Q==';
  renderOutfitBoard();
  return {top:row.id,bottom:currentBoard.slots.bottom,owner:window.closetAuth?.user?.id};
 });
 assert.deepEqual(m169Mutation,{top:'m161-fourk-top',
  bottom:'m161-fourk-bottom',owner:'m58-A'});
 await page.waitForFunction(()=>
  document.querySelectorAll('#mission4Preview1054Photos img').length===0,
  null,{timeout:15000});
 assert.equal(/original photo\(s\) verified/.test(
  await page.locator('#mission4Preview1054Status').innerText()),false,
  'stale verified text survived mutated selected 24MP source');
 const m169Button=page.locator('#mission4Preview1054Section button');
 await m169Button.waitFor({timeout:20000});
 await m169Button.scrollIntoViewIfNeeded();
 await m169Button.click();
 await page.waitForFunction(()=>
  /Preview refused/.test(document.getElementById('mission4Preview1054Status')
   ?.textContent||''),null,{timeout:30000});
 assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
 // The signed private DB still has BOTH originals; no durable mutation.
 const m169Persisted=await page.evaluate(()=>new Promise((resolve,reject)=>{
  const req=db.transaction('items','readonly').objectStore('items').getAll();
  req.onsuccess=()=>resolve(req.result.map(x=>({
   id:x.id,source:x.sourceSHA256,original:x.originalPhoto?.image
  })));
  req.onerror=()=>reject(req.error);
 }));
 assert.equal(m169Persisted.length,2);
 assert.ok(m169Persisted.every(x=>x.original===m161Original&&x.source===sha),
  'volatile source mutation altered owner private original');
 stage='m169-recovered-selected-24mp-photo-signature-and-two-slot-reentry';
 await page.evaluate(original=>{
  const row=items.find(x=>x?.id===currentBoard?.slots?.top);
  if(!row)throw Error('M169 selected garment disappeared');
  row.originalPhoto.image=original;
  renderOutfitBoard();
 },m161Original);
 await m169Button.waitFor({timeout:20000});
 await m169Button.scrollIntoViewIfNeeded();
 await m169Button.click();
 await page.waitForFunction(()=>
  /original photo\(s\) verified.*2D only/.test(
   document.getElementById('mission4Preview1054Status')?.textContent||'')&&
   document.querySelectorAll('#mission4Preview1054Photos img').length===2,
  null,{timeout:30000});
 const m169Reentered=await page.locator('#mission4Preview1054Photos img')
  .evaluateAll(imgs=>imgs.map(img=>({
   alt:img.getAttribute('alt'),src:img.getAttribute('src'),decoded:img.naturalWidth>0
  })));
 assert.equal(m169Reentered.length,2);
 assert.ok(m169Reentered.every(x=>x.src===m161Original&&x.decoded),
  'M169 recovered source was not the true 4000x6000 signed original');
 assert.equal(new Set(m169Reentered.map(x=>x.alt)).size,2);
 assert.equal(await page.locator('#outfit3D01Canvas').count(),0);
 console.log('M169_SAME_SESSION_24MP_P95_REVOCATION_REENTRY_PASS',
  JSON.stringify({engine,width,genuineCameraOriginal:true,
   originalPixels:'4000x6000',realP88WasmFirst:true,
   syntheticReviewedUnits:2,originalsDisplayed:2,
   stalePixelsRevoked:true,changedSelectedSourceRefused:true,
   storedOwnerOriginalBytesUnchanged:true,restored2DVerified:true,
   fitted3DAuthorized:false,hostedRLS:false,physicalPhone:false,
   familyAlpha:'HOLD'}));
`;
const modified=original.replace(anchor,extension+'\n'+anchor);
const temp='scripts/.m169-p96-p95-'+process.pid+'.mjs';
try{
 writeFileSync(temp,modified,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:60000});
 if(check.error)throw check.error;
 assert.equal(check.status,0,'M169 exact-source injection syntax invalid: '+String(check.stderr));
 const run=spawnSync(process.execPath,[temp],
  {stdio:'inherit',env:process.env,timeout:17*60*1000});
 if(run.error)throw run.error;
 assert.equal(run.status,0,'M169 live original 24MP P95 + P96 source acceptance FAILED');
 console.log('M169_SAME_SESSION_24MP_P95_P96_PASS engine='+engine);
}finally{rmSync(temp,{force:true});}
