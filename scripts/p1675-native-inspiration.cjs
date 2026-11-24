'use strict';
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
let source=fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs','utf8');
function replace(a,b){if(source.split(a).length!==2)throw Error('P1675 anchor changed: '+a);source=source.replace(a,b);}
const anchor=" advance('native-outfit-builder-via-more-menu');";
replace(anchor,`
 advance('native-inspiration-reference-lifecycle');
 const goInspiration=async()=>{
  if(!await page.locator('#moreMenu').evaluate(el=>el.open))await page.locator('#moreMenu summary').click();
  await page.locator('#moreMenu button.tab[data-view="trends"]').click();
 };
 await goInspiration();
 await page.waitForFunction(()=>typeof inspirationLooks!=='undefined');
 // Delay a real browser decode, then let the real decoder complete after New look.
 await page.evaluate(()=>{
  const original=Image.prototype.decode;
  window.p1675DecodeStarted=false;window.p1675DecodeFinished=false;
  Image.prototype.decode=async function(){
   if(this.src.startsWith('blob:')&&!window.p1675DecodeStarted){
    window.p1675DecodeStarted=true;
    await new Promise(resolve=>window.p1675ReleaseDecode=resolve);
    try{return await original.call(this);}finally{window.p1675DecodeFinished=true;Image.prototype.decode=original;}
   }
   return original.call(this);
  };
 });
 const reference={name:'inspiration.jpg',mimeType:'image/jpeg',buffer:originals[0].bytes};
 await page.locator('#lookImage').setInputFiles(reference);
 await page.waitForFunction(()=>window.p1675DecodeStarted);
 await page.locator('#newLook').click();
 await page.evaluate(()=>window.p1675ReleaseDecode());
 await page.waitForFunction(()=>window.p1675DecodeFinished);
 await page.waitForFunction(()=>Image.prototype.decode!==undefined);
 // Yield to the original handler continuation before inspecting visible state.
 await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,100)));
 if(process.env.P1675_BASELINE==='1'){
  assert.equal(await page.locator('#inspirationPreview').isVisible(),true,'immutable baseline must reproduce stale reference');
  console.log('P1675_BASELINE_RED',engine,width);
  await page.locator('#newLook').click();
 }else{
  assert.equal(await page.locator('#inspirationPreview').isVisible(),false);
  assert.equal(await page.locator('#inspirationPreview').getAttribute('src'),null);
  assert.equal(await page.locator('#lookPieces .look-piece').count(),0);
  await page.locator('#lookTitle').fill('P1675 private inspiration');
  await page.locator('#lookDescription').fill('Black T-shirt\\nBlue jeans\\nWhite sneakers');
  await page.locator('#parseLook').click();
  assert.match(await page.locator('#matchSummary').innerText(),/2 of 3 close matches.*1 unmatched/);
  assert.ok((await page.locator('#trendResults').innerText()).includes(shirtName));
  assert.ok((await page.locator('#trendResults').innerText()).includes(jeansName));
  await page.locator('#lookPieces .look-piece').nth(2).getByRole('button',{name:'Remove piece'}).click();
  assert.match(await page.locator('#matchSummary').innerText(),/2 of 2 close matches/);
  await page.locator('#lookImage').setInputFiles(reference);
  await page.locator('#inspirationPreview').waitFor({state:'visible'});
  assert.equal(await page.locator('#referenceToCloset').isVisible(),false);
  const resized=await page.locator('#inspirationPreview').getAttribute('src');
  assert.match(resized,/^data:image\\/jpeg;base64,/);
  await page.locator('#saveLook').click();
  const saved=page.locator('#savedLooks .saved-look').filter({hasText:'P1675 private inspiration'});
  await saved.waitFor();
  assert.equal(await saved.count(),1);
  await page.locator('#newLook').click();
  await saved.getByRole('button',{name:'Recreate this look'}).click();
  assert.equal(await page.locator('#inspirationPreview').getAttribute('src'),resized);
  await page.locator('#lookTitle').fill('P1675 edited inspiration');
  await page.locator('#saveLook').click();
  await page.locator('#savedLooks .saved-look').filter({hasText:'P1675 edited inspiration'}).waitFor();
  assert.equal(await page.locator('#savedLooks .saved-look').count(),1);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>db?.name==='closet-current-user-p99-A'&&inspirationLooks.length===1);
  await goInspiration();
  const edited=page.locator('#savedLooks .saved-look').filter({hasText:'P1675 edited inspiration'});
  await edited.getByRole('button',{name:'Recreate this look'}).click();
  assert.equal(await page.locator('#inspirationPreview').getAttribute('src'),resized);
  assert.match(await page.locator('#matchSummary').innerText(),/2 of 2 close matches/);
  assert.equal(await rowCount(),2);
  // Exercise cancel and confirmed deletion, then explicitly re-save the reviewed look.
  page.once('dialog',dialog=>dialog.dismiss());
  await edited.getByRole('button',{name:'Delete',exact:true}).click();
  assert.equal(await edited.count(),1);
  page.once('dialog',dialog=>dialog.accept());
  await edited.getByRole('button',{name:'Delete',exact:true}).click();
  await edited.waitFor({state:'detached'});
  assert.equal(await page.locator('#savedLooks .saved-look').count(),0);
  await page.locator('#saveLook').click();
  await edited.waitFor();
  assert.equal(await edited.count(),1);
  // Keep the saved private reference for inherited backup/restore and owner swap.
  console.log('P1675_NATIVE_INSPIRATION_PASS',engine,width);
 }
`+anchor);
replace("  assert(data.outfitBoard?.saved?.some(x=>x.name===outfitName));",`
  assert(data.outfitBoard?.saved?.some(x=>x.name===outfitName));
  if(process.env.P1675_BASELINE!=='1'){
   const look=data.looks?.find(x=>x.title==='P1675 edited inspiration');
   assert.ok(look&&look.pieces.length===2&&look.image.startsWith('data:image/jpeg;base64,'));
  }
`);
replace(" await signIn('p99-B');",`
 await signIn('p99-B');
 if(process.env.P1675_BASELINE!=='1'){
  await goInspiration();
  assert.equal(await page.locator('#savedLooks .saved-look').count(),0);
  assert.equal(await page.locator('#inspirationPreview').getAttribute('src'),null);
  assert.ok(!(await page.locator('#trendResults').innerText()).includes(shirtName));
 }
`);
const output='scripts/.p1675-inspiration-'+randomUUID()+'.mjs';
try{
 fs.writeFileSync(output,source,{flag:'wx'});
 const run=spawnSync(process.execPath,[output],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(run.error)throw run.error;
 process.exitCode=run.status??1;
}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
