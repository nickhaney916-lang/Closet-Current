'use strict';

const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
let source=fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs','utf8');
const baseline=process.env.P1662_BASELINE==='1';
function replace(anchor,body){
 if(source.split(anchor).length!==2)throw Error('Starter journey anchor changed: '+anchor);
 source=source.replace(anchor,body);
}
if(!baseline){
 replace("['commons-0003','commons-0023'].map(loadOriginal)","['commons-0003','commons-0023','validation-0019'].map(loadOriginal)");
 replace(" const before=await rowCount();\n assert.equal(before,category==='Tops'?0:1,'unreviewed model output silently saved');",`
 const before=await rowCount();
 assert.equal(before,['Tops','Bottoms','Shoes'].indexOf(category),'unreviewed model output silently saved');
`);
 const start=source.indexOf(" await page.locator('#home button.home-action[data-go-view=\"scan\"]').click();");
 const end=source.indexOf(" await page.locator('#reviewGrid .photo-result",start);
 if(start<0||end<=start)throw Error('Chooser journey anchor changed');
 source=source.slice(0,start)+`
 const waitingChooser=page.waitForEvent('filechooser');
 await page.getByRole('button',{name:'Choose a clothing photo',exact:true}).click();
 const chooser=await waitingChooser;
 assert.equal(await page.locator('#scan').isVisible(),true);
 assert.equal(await rowCount(),['Tops','Bottoms','Shoes'].indexOf(category));
 await chooser.setFiles({name:source.name+'.jpg',mimeType:'image/jpeg',buffer:source.bytes});
`+source.slice(end);
}
if(baseline){
 replace(" await page.locator('details.saved-imports summary').click();",`
 const imports=page.locator('details.saved-imports');
 if(!await imports.evaluate(element=>element.open))await imports.locator('summary').click();
`);
 const start=source.indexOf(" await page.locator('#clothingPhotos').setInputFiles({");
 const end=source.indexOf(" await page.locator('#reviewGrid .photo-result",start);
 if(start<0||end<=start)throw Error('Baseline chooser anchor changed');
 source=source.slice(0,start)+`
 const [chooser]=await Promise.all([
  page.waitForEvent('filechooser'),
  page.locator('label.file-label').filter({hasText:'Choose clothing photos'}).click()
 ]);
 await chooser.setFiles({name:source.name+'.jpg',mimeType:'image/jpeg',buffer:source.bytes});
`+source.slice(end);
}

replace(" await addFromNormalChooser(originals[0],shirtName,'Tops','T-shirt','Black');",`
 const guide=page.locator('#starterWardrobeHome');
 const goHome=()=>page.locator('nav.main-nav button.tab[data-view="home"]').click();
 const mobileFit=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
 if(!${baseline}){
  await guide.getByText(/Photograph one top or dress/).waitFor();
  assert.equal(await mobileFit(),true);
  const abandoned=page.waitForEvent('filechooser');
  await guide.getByRole('button',{name:'Choose a clothing photo'}).click();
  await (await abandoned).setFiles([]);
  assert.equal(await rowCount(),0);
  await goHome();
 }else assert.equal(await guide.count(),0);
 await addFromNormalChooser(originals[0],shirtName,'Tops','T-shirt','Black');
 if(!${baseline}){
  await goHome();
  await guide.getByText(/photographing bottoms/).waitFor();
  await guide.getByRole('button',{name:'See outfit ideas'}).click();
  await page.locator('.styled-outfit').first().waitFor();
  assert.match(await page.locator('.styled-outfit').first().innerText(),/Still needed from your closet: Bottoms, Shoes/);
  assert.equal(await mobileFit(),true);
 }
`);
const start=source.indexOf(" advance('normal-chooser-cancel-duplicate-and-oversize-no-write');");
const end=source.lastIndexOf('}catch(error){');
if(start<0||end<=start)throw Error('Starter journey boundary changed');
source=source.slice(0,start)+`
 advance('starter-two-five-ten-and-owner-transition');
 await goHome();
 if(${baseline}){
  await page.locator('#home .hero-button').click();
  await page.getByRole('button',{name:'Create my outfits',exact:true}).click();
  await page.locator('.styled-outfit').first().waitFor();
  assert.match(await page.locator('.styled-outfit').first().innerText(),/Still needed from your closet: Shoes/);
  await page.locator('.styled-outfit').first().getByRole('button',{name:'Save outfit'}).click();
  await page.locator('.styled-outfit').first().getByRole('button',{name:'Saved',exact:true}).waitFor();
  console.log('P1662_NATIVE_BASELINE',engine,width,'3 gallery-opening actions, 3 recommendation-and-save actions; no category prompt on Home');
 }else{
  await guide.getByText(/photographing shoes/).waitFor();
  await guide.getByRole('button',{name:'See outfit ideas'}).click();
  const card=page.locator('.styled-outfit').first();
  await card.waitFor();
  assert.match(await card.innerText(),/Still needed from your closet: Shoes/);
  assert.equal(await card.locator('figure').count(),2);
  await card.getByRole('button',{name:'Save outfit'}).click();
  await card.getByRole('button',{name:'Saved',exact:true}).waitFor();
  const shoeName='P1662 reviewed sneaker';
  await addFromNormalChooser(originals[2],shoeName,'Shoes','Sneakers','Black');
  const shoe=await page.evaluate(async name=>{
   const row=(await readAll()).find(item=>item.name===name);
   const bytes=Uint8Array.from(atob(row.originalPhoto.image.split(',')[1]),char=>char.charCodeAt(0));
   const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
   return {hash:[...hash].map(byte=>byte.toString(16).padStart(2,'0')).join(''),
    receipt:row.sourceSHA256,owner:row.ownerId,reviewed:row.ownerReviewed};
  },shoeName);
  assert.deepEqual(shoe,{hash:originals[2].sha,receipt:originals[2].sha,owner:'p99-A',reviewed:true});
  await goHome();
  await guide.getByRole('button',{name:'Create an outfit'}).click();
  await card.getByText('A complete outfit using clothes you own.').waitFor();
  assert.equal(await card.locator('figure').count(),3);
  await card.getByRole('button',{name:'Save outfit'}).click();
  await card.getByRole('button',{name:'Saved',exact:true}).waitFor();
  // Grow from the three independently hash-checked photos with synthetic
  // metadata only. No inference or source proof claim for these extra rows.
  const append=async count=>page.evaluate(async count=>{
   const tx=db.transaction('items','readwrite'),store=tx.objectStore('items');
   for(let i=0;i<count;i++){
    const categories=['Shoes','Outerwear','Accessories','Tops','Bottoms'];
    const types=['Sneakers','Jacket','Bag','T-shirt','Jeans'];
    const id='p1662-'+items.length+'-'+i;
    store.add(normalizeClothing({id,ownerId:'p99-A',name:'Starter fixture '+id,
     category:categories[i%5],itemType:types[i%5],color:'Black',seasons:['All seasons'],
     image:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}));
   }
   await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});
  },count);
  const reloadAt=async count=>{
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(n=>db?.name==='closet-current-user-p99-A'&&items.length===n,count);
   await guide.getByRole('button',{name:'Create an outfit'}).waitFor();
   assert.equal(await mobileFit(),true);
  };
  await append(2);
  await reloadAt(5);
  await guide.getByRole('button',{name:'Create an outfit'}).click();
  await card.getByText('A complete outfit using clothes you own.').waitFor();
  const history=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const request=db.transaction('state').objectStore('state').get('outfit-wear-history-v1');
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error);
  }));
  assert.equal(history,undefined);
  assert.equal(await mobileFit(),true);
  await page.getByLabel('What’s the plan?').selectOption('Activewear');
  await page.locator('#starterWardrobeStylist').getByText(/may not match this plan/).waitFor();
  await append(5);
  await reloadAt(10);
  await guide.getByRole('button',{name:'Create an outfit'}).click();
  await card.getByText('A complete outfit using clothes you own.').waitFor();
  await page.locator('.account-menu summary').click();
  await page.locator('#logout').click();
  await page.locator('#authGate').waitFor({state:'visible'});
  await signIn('p99-B');
  await guide.getByText(/Photograph one top or dress/).waitFor();
  assert.equal(await guide.getByRole('button',{name:'Choose a clothing photo'}).count(),1);
  assert.equal(await rowCount(),0);
  assert.equal(await page.locator('.styled-outfit').count(),0);
  assert.deepEqual(errors,[]);
  console.log('P1662_NATIVE_GREEN',engine,width,'gallery opening 3 to 1; recommendation and save 3 to 2; 0/1/2/3/5/10 pieces; three reviewed original hashes; isolated owner');
 }
`+source.slice(end);
const runner='scripts/.p1662-starter-'+randomUUID()+'.mjs';
try{
 fs.writeFileSync(runner,source,{flag:'wx'});
 const run=spawnSync(process.execPath,[runner],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(run.error)throw run.error;
 process.exitCode=run.status??1;
}finally{if(fs.existsSync(runner))fs.unlinkSync(runner);}
