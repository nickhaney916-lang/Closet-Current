'use strict';
// Run the existing loopback synthetic signed-owner app harness without
// modifying it. Real two-photo review first; explicitly test-only legacy
// metadata fixture rows for the larger catalog, never real owner data.
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const path='scripts/test-parallel99-normal-app-browser.mjs',output='scripts/.p1647-retrieval-runner.mjs';
let source=fs.readFileSync(path,'utf8');
const anchor=" await editor.getByLabel('Color',{exact:true}).fill(color);";
if(source.split(anchor).length!==2)throw Error('P99 review anchor changed');
source=source.replace(anchor,` await editor.getByLabel('Color',{exact:true}).fill(color);
 if(category==='Tops')await editor.getByLabel('Sleeve length').selectOption('Short sleeve');
 for(const checkbox of await editor.locator('fieldset.season-picker input').all())if(await checkbox.isChecked())await checkbox.uncheck();
 await editor.locator('fieldset.season-picker input[value="'+(category==='Tops'?'Summer':'All seasons')+'"]').check();`);
const start=source.indexOf(" advance('normal-chooser-cancel-duplicate-and-oversize-no-write');");
const end=source.lastIndexOf("}catch(error){");
if(start<0||end<=start)throw Error('P99 journey boundary changed');
source=source.slice(0,start)+`
 advance('p1647-real-chooser-search-and-standalone-filter');
 const search=page.locator('#search'),collection=page.locator('#closetCollection'),cards=page.locator('#closetGrid .card');
 const names=()=>cards.locator('h3').allTextContents();
 await search.fill('P99');
 const refine=collection.locator('details.closet-refine');
 if(!await refine.evaluate(x=>x.open))await refine.locator('summary').click();
 await page.locator('#seasonFilter').selectOption('Summer');
 await search.fill('');
 const red=process.env.P1647_EXPECT_RED==='1';
 assert.equal(await collection.isVisible(),!red,'standalone season must keep controls reachable');
 assert.equal(await cards.count(),red?0:2);
 if(red){console.log('P1647_NATIVE_RED '+engine+' '+width+' season filter concealed after clearing search');}
 else{
  await page.locator('#sleeveFilter').selectOption('Short sleeve');
  assert.deepEqual(await names(),[shirtName]);
  await page.locator('#seasonFilter').selectOption('Winter');
  assert.equal(await cards.count(),0);assert.equal(await collection.isVisible(),true);
  await page.locator('#closetAllPieces').click();assert.equal(await cards.count(),2);
  assert.equal(await page.locator('#seasonFilter').inputValue(),'');
  assert.equal(await page.locator('#sleeveFilter').inputValue(),'');
  await search.fill('  BLACK    shirt  ');assert.deepEqual(await names(),[shirtName]);
  await cards.first().getByRole('button',{name:'Adjust details'}).click();
  const editor=page.locator('dialog.clothing-editor');await editor.waitFor({state:'visible'});
  await editor.getByLabel('Item name').fill('P1647 revised garment');
  await editor.getByLabel('Color',{exact:true}).fill('Teal');
  await editor.getByRole('button',{name:'Save changes'}).click();
  await editor.waitFor({state:'hidden',timeout:30000});
  assert.equal(await cards.count(),0);
  await search.fill('teal revised');assert.deepEqual(await names(),['P1647 revised garment']);
  const sourceStill=await page.evaluate(async()=>{
   const row=items.find(x=>x.name==='P1647 revised garment');
   const bytes=Uint8Array.from(atob(row.originalPhoto.image.split(',')[1]),c=>c.charCodeAt(0));
   const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
   return {hash:[...digest].map(n=>n.toString(16).padStart(2,'0')).join(''),receipt:row.sourceSHA256,owner:row.ownerId};
  });
  assert.deepEqual(sourceStill,{hash:originals[0].sha,receipt:originals[0].sha,owner:'p99-A'});
  advance('p1647-large-test-only-legacy-metadata-roster');
  // No source proof or review claims for synthetic placeholder rows.
  await page.evaluate(async()=>{
   const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
   for(let i=0;i<150;i++)store.add(normalizeClothing({id:'p1647-fixture-'+String(i).padStart(3,'0'),ownerId:'p99-A',name:'P1647 fixture '+String(i).padStart(3,'0'),category:i%2?'Bottoms':'Tops',itemType:i%2?'Jeans':'Polo',color:i%2?'Blue':'Black',sleeveLength:i%2?'Not applicable':'Short sleeve',seasons:i%2?['Winter']:['Summer'],image:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',notes:i===149?'Rare merino token':'',brand:'Synthetic',material:'Cotton'}));
   await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);});
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#appShell')?.hidden===false&&document.querySelector('#closetCount')?.textContent==='152',null,{timeout:30000});
  await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
  await page.locator('#closetAllPieces').click();assert.equal(await cards.count(),48);
  assert.match(await page.locator('.closet-page-status136').innerText(),/Showing 48 of 152/);
  await page.getByRole('button',{name:'Show more clothing'}).click();assert.equal(await cards.count(),96);
  assert.match(await page.locator('.closet-page-status136').innerText(),/Showing 96 of 152/);
  await search.fill('  BLUE    merino  ');assert.deepEqual(await names(),['P1647 fixture 149']);
  await search.fill('teal revised');assert.deepEqual(await names(),['P1647 revised garment']);
  await page.locator('#closetAllPieces').click();assert.equal(await cards.count(),48);
  await page.locator('#closetBack').click();assert.equal(await collection.isVisible(),false);
  await page.locator('#closetCategories button[data-category="Tops"]').first().click();
  assert.equal(await collection.isVisible(),true);
  await search.fill('blue');assert.equal(await cards.count(),0);
  await page.locator('#closetAllPieces').click();await search.fill('blue merino');assert.deepEqual(await names(),['P1647 fixture 149']);
  await page.locator('.account-menu summary').click();await page.locator('#logout').click();
  await page.waitForFunction(()=>document.querySelector('#authGate')?.hidden===false,null,{timeout:30000});
  await signIn('p99-B');await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
  await page.locator('#closetAllPieces').click();await search.fill('merino');assert.equal(await cards.count(),0);assert.equal(await rowCount(),0);
  await page.locator('.account-menu summary').click();await page.locator('#logout').click();
  await page.waitForFunction(()=>document.querySelector('#authGate')?.hidden===false,null,{timeout:30000});
  await signIn('p99-A');await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
  await page.locator('#closetAllPieces').click();await search.fill('teal revised');assert.deepEqual(await names(),['P1647 revised garment']);
  assert.equal(await rowCount(),152);
  assert.deepEqual(errors,[]);
  console.log('P1647_NATIVE_GREEN '+engine+' '+width+' standalone/combined filters, reset, approved metadata edit, original SHA, 152 rows, pagination, two-owner reload');
 }
`+source.slice(end);
try{
 fs.writeFileSync(output,source,{flag:'wx'});
 const run=spawnSync(process.execPath,[output],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(run.error)throw run.error;process.exitCode=run.status??1;
}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
