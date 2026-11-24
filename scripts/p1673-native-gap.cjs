'use strict';
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
let source=fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs','utf8');
function replace(a,b){if(source.split(a).length!==2)throw Error('P1673 anchor changed: '+a);source=source.replace(a,b);}
replace(" await page.locator('#boardName').fill(outfitName);",`
 advance('owned-first-explicit-missing-piece');
 await page.locator('#boardOccasion').selectOption('Casual');
 await page.locator('#boardSeason').selectOption('Summer');
 await page.locator('#boardTarget').selectOption('top');
 const recommendations=page.locator('#boardRecommendations .gap-idea-card');
 if(process.env.P1673_BASELINE==='1'){
  assert.ok(await recommendations.count()>0,'baseline does not reproduce purchase directions for already selected owned top');
  console.log('P1673_BASELINE_OBSERVED',engine,width,'purchase suggestions despite selected owned top');
 }else{
  assert.equal(await recommendations.count(),0);
  assert.match(await page.locator('#boardGapStatus').innerText(),/No purchase is needed/);
  await page.locator('#boardSlots .board-slot-shoes').click();
  await page.locator('#shopBoardSlot').click();
  assert.ok(await recommendations.count()>0,'documented owned shirt + jeans can support a shoe idea');
  const first=recommendations.first();
  assert.match(await first.innerText(),/NOT OWNED/);
  assert.ok((await first.innerText()).includes(shirtName));
  assert.ok((await first.innerText()).includes(jeansName));
  const before=await page.evaluate(()=>JSON.stringify(items));
  await page.locator('#boardTarget').selectOption('top');
  assert.equal(await recommendations.count(),0);
  await page.locator('#boardTarget').selectOption('shoes');
  assert.ok(await recommendations.count()>0);
  await context.setOffline(true);
  try{
   await page.locator('#boardTarget').selectOption('bag');
   assert.match(await page.locator('#boardGapStatus').innerText(),/Optional/);
   await page.locator('#boardTarget').selectOption('shoes');
   assert.ok(await recommendations.count()>0);
  }finally{await context.setOffline(false);}
  assert.equal(await page.evaluate(()=>JSON.stringify(items)),before);
  assert.equal(await rowCount(),2);
  console.log('P1673_NATIVE_GAP_PASS',engine,width);
 }
 await page.locator('#boardName').fill(outfitName);
`);
replace(" await signIn('p99-B');",`
 await signIn('p99-B');
`);
const anchor=" assert.equal(await page.locator('#mission4Preview1054Photos img').count(),0);\n await page.locator('#mission4Preview1054Section button').click();";
replace(anchor,`
 if(process.env.P1673_BASELINE!=='1'){
  await page.locator('#boardTarget').selectOption('shoes');
  assert.equal(await page.locator('#boardRecommendations .gap-idea-card').count(),0);
  assert.match(await page.locator('#boardGapStatus').innerText(),/not enough wardrobe evidence/i);
  assert.ok(!(await page.locator('#boardGapStatus').innerText()).includes(shirtName));
 }
`+anchor);
const output='scripts/.p1673-gap-'+randomUUID()+'.mjs';
try{
 fs.writeFileSync(output,source,{flag:'wx'});
 const run=spawnSync(process.execPath,[output],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(run.error)throw run.error;
 process.exitCode=run.status??1;
}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
