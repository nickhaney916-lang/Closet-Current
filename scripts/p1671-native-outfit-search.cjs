'use strict';
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
let source=fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs','utf8');
source=source.replace('clean(error.message||error).slice(0,350)','clean(error.stack||error).slice(0,2000)');
const baseline=process.env.P1671_BASELINE==='1';
const start=source.indexOf(" if(!cacheOnly){\n  advance('normal-v3-private-export');");
const end=source.lastIndexOf('}catch(error){');
if(start<0||end<=start)throw Error('Saved outfit journey boundary changed');
source=source.slice(0,start)+`
 advance('private-saved-outfit-library-scales');
 const grid=page.locator('#savedBoards');
 const input=page.getByRole('searchbox',{name:'Search saved outfits'});
 const count=page.locator('#savedOutfitSearchCount');
 const visible=()=>grid.locator(':scope > :visible');
 const waitCount=text=>page.waitForFunction(text=>document.querySelector('#savedOutfitSearchCount').textContent===text,text);
 const builder=async()=>{
  await page.locator('#moreMenu summary').click();
  await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 };
 const seed=async quantity=>{
  await page.evaluate(quantity=>new Promise((resolve,reject)=>{
   const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),request=store.get('outfit-board');
   request.onsuccess=()=>{
    const existing=request.result,original=existing.saved.find(value=>value.name.startsWith('P99 Unflagged'));
    if(!original)throw Error('Normal UI saved outfit missing');
    const saved=quantity?[original]:[];
    for(let i=1;i<quantity;i++){
     const suffix=String(i).padStart(2,'0');
     const board={...original,name:i===1||i===2?'P1671 Twin':'P1671 Look '+suffix};
     if(i===1)board.slots={top:original.slots.top};
     if(i===2)board.slots={bottom:original.slots.bottom};
     saved.push(board);
    }
    store.put({...existing,saved});
   };
   tx.oncomplete=resolve;
   tx.onabort=()=>reject(tx.error);
  }),quantity);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>db?.name==='closet-current-user-p99-A'&&boardInitialized);
  await builder();
 };
 const state=()=>page.evaluate(async()=>{
  const tx=db.transaction('state');
  const read=id=>new Promise((resolve,reject)=>{
   const request=tx.objectStore('state').get(id);
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error);
  });
  return Promise.all([read('outfit-board'),read('outfit-wear-history-v1')]);
 });
 assert.equal(await visible().count(),1);
 if(${baseline})assert.equal(await input.count(),0);
 else{
  assert.equal(await count.innerText(),'1 saved outfit');
  await input.fill('not present');
  await page.getByText('No saved outfits match this search.').waitFor();
  await page.getByRole('button',{name:'Clear search',exact:true}).click();
  assert.equal(await input.evaluate(el=>document.activeElement===el),true);
 }
 // Preserve the one normal UI board while exercising the empty list.
 const originalState=await state();
 await page.evaluate(()=>new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),request=store.get('outfit-board');
  request.onsuccess=()=>store.put({...request.result,saved:[]});
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
 }));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>db?.name==='closet-current-user-p99-A'&&boardInitialized);
 await builder();
 await grid.getByText('Save a combination to return to it later.').waitFor();
 if(!${baseline})assert.equal(await count.innerText(),'0 saved outfits');
 await page.evaluate(board=>new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite');tx.objectStore('state').put(board);
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
 }),originalState[0]);
 for(const size of [10,25,50]){
  await seed(size);
  if(!${baseline})await waitCount(size+' saved outfits');
  assert.equal(await visible().count(),size,'initial result count at '+size+' input '+(${baseline}?'none':await input.inputValue()));
  const target='P1671 Look '+String(size-1).padStart(2,'0');
  if(${baseline}){
   const labels=await grid.locator('button').allTextContents();
   assert.ok(labels.includes(target));
   assert.match(await visible().last().innerText(),new RegExp(target));
   console.log('P1671_BASELINE',engine,width,size,'name-only list; target at position '+size);
  }else{
   assert.equal(await count.innerText(),size+' saved outfits');
   const before=await state();
   await input.fill('  '+target.toUpperCase().replaceAll(' ','   ')+'  ');
   await waitCount('1 of '+size+' saved outfits');
   assert.equal(await visible().count(),1);
   assert.equal(await grid.getByRole('button',{name:target,exact:true}).count(),1);
   assert.deepEqual(await state(),before,'search cannot write outfits or wear history');
   await input.fill('p1671 twin blue jeans');
   await grid.locator(':scope > :nth-child(3)').waitFor({state:'visible'});
   await waitCount('1 of '+size+' saved outfits');
   assert.equal(await visible().count(),1);
   await grid.getByRole('button',{name:'P1671 Twin',exact:true}).click();
   assert.equal(await page.locator('#boardSlots .board-slot-bottom').getAttribute('aria-label').then(t=>t.includes(jeansName)),true);
   assert.match(await page.locator('#boardSlots .board-slot-top').getAttribute('aria-label'),/empty/i);
   await input.fill('p1671 twin black shirt');
   await grid.locator(':scope > :nth-child(2)').waitFor({state:'visible'});
   await waitCount('1 of '+size+' saved outfits');
   assert.equal(await visible().count(),1);
   await grid.getByRole('button',{name:'P1671 Twin',exact:true}).click();
   assert.equal(await page.locator('#boardSlots .board-slot-top').getAttribute('aria-label').then(t=>t.includes(shirtName)),true);
   await input.fill(target);
   await grid.getByRole('button',{name:target,exact:true}).click();
   await page.locator('#mission4Preview1054Section button').click();
   await page.waitForFunction(()=>document.querySelectorAll('#mission4Preview1054Photos img').length===2);
   const src=await page.locator('#mission4Preview1054Photos img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
   for(const original of originals)assert.ok(src.includes(original.url));
   assert.match(await page.locator('#mission4Preview1054Status').innerText(),/2D only/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   if(size===25){
    await page.locator('#boardName').fill('P1671 Customized');
    await page.locator('#saveBoard').click();
    await page.waitForFunction(()=>savedOutfitBoards.filter(board=>board.name==='P1671 Customized').length===1);
    await input.fill('customized');
    await grid.getByRole('button',{name:'P1671 Customized',exact:true}).click();
    assert.equal(await page.locator('#boardName').inputValue(),'P1671 Customized');
    assert.equal((await state())[0].saved.filter(board=>board.name==='P1671 Customized').length,1);
   }
   await page.getByRole('button',{name:'Clear search',exact:true}).click();
   await waitCount(size+(size===25?1:0)+' saved outfits');
   assert.equal(await visible().count(),size+(size===25?1:0),'clear result count at '+size+' input '+await input.inputValue());
   console.log('P1671_PASS',engine,width,size,'normalized search reduced candidate cards to one using the normal owner list');
  }
 }
 if(!${baseline}){
  await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
  await page.locator('#search').fill('P99 Black Shirt');
  await page.locator('#closetGrid article.card').getByRole('button',{name:'Adjust details'}).click();
  const editor=page.locator('dialog.clothing-editor');
  await editor.getByLabel('Item name').fill('P1671 Revised Top');
  await editor.getByLabel('Color',{exact:true}).fill('Purple');
  await editor.getByRole('button',{name:'Save changes'}).click();
  await editor.waitFor({state:'hidden'});
  const afterReview=await page.evaluate(async()=>{
   const item=(await readAll()).find(row=>row.name==='P1671 Revised Top');
   return {source:item.sourceSHA256,original:item.originalPhoto.image};
  });
  assert.deepEqual(afterReview,{source:originals[0].sha,original:originals[0].url});
  await builder();
  await input.fill('revised purple');
  await waitCount('49 of 50 saved outfits');
  assert.equal(await visible().count(),49);
  await input.fill('black');
  await page.getByText('No saved outfits match this search.').waitFor();
  await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
  await page.locator('#search').fill('P1671 Revised Top');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#closetGrid article.card').getByRole('button',{name:'Delete',exact:true}).click();
  await page.waitForFunction(()=>items.length===1);
  await builder();
  await input.fill('revised purple');
  await page.getByText('No saved outfits match this search.').waitFor();
  assert.equal(await count.innerText(),'0 of 50 saved outfits');
  await input.fill('p1671 look 49');
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.locator('#authGate').waitFor({state:'visible'});
  await signIn('p99-B');
  await builder();
  assert.equal(await input.inputValue(),'');
  assert.equal(await count.innerText(),'0 saved outfits');
  assert.equal(await grid.getByRole('button',{name:/p1671/i}).count(),0);
  assert.deepEqual(errors,[]);
  audit.verify();
 }
`+source.slice(end);
const output='scripts/.p1671-search-'+randomUUID()+'.mjs';
try{
 fs.writeFileSync(output,source,{flag:'wx'});
 const run=spawnSync(process.execPath,[output],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(run.error)throw run.error;
 process.exitCode=run.status??1;
}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
