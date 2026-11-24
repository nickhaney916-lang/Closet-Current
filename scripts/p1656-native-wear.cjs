'use strict';

const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const {randomUUID}=require('node:crypto');
let source=fs.readFileSync('scripts/test-parallel99-normal-app-browser.mjs','utf8');
function insert(anchor,code){
 if(source.split(anchor).length!==2)throw Error('Native wear journey anchor changed: '+anchor);
 source=source.replace(anchor,code+'\n'+anchor);
}
insert(" await page.locator('#boardName').fill(outfitName);",`
 const panel=page.locator('#outfitWearPanel');
 const history=page.locator('#outfitWearHistory');
 const rediscovery=page.locator('#outfitWearRediscovery');
 const wear=page.getByRole('button',{name:'I wore this · '+outfitName,exact:true});
 const status=page.locator('#outfitWearStatus');
 const openWear=async()=>{
  if(!await panel.evaluate(el=>el.open))await panel.locator('summary').click();
 };
 const expectedNames=async names=>assert.deepEqual(await history.locator('strong').allTextContents(),names);
 const wearRow=()=>page.evaluate(()=>new Promise((resolve,reject)=>{
  const get=db.transaction('state').objectStore('state').get('outfit-wear-history-v1');
  get.onsuccess=()=>resolve(get.result);
  get.onerror=()=>reject(get.error);
 }));
 await openWear();
 await history.getByText('No outfits recorded yet.').waitFor();
 assert.equal(await wearRow(),undefined);
 await rediscovery.getByRole('button',{name:'Style around '+shirtName,exact:true}).click();
 assert.equal(await page.locator('#stylist').isVisible(),true);
 assert.equal(await page.locator('#stylistFocusItem option:checked').innerText().then(t=>t.includes(shirtName)),true);
 assert.equal(await wearRow(),undefined);
 await page.locator('#moreMenu summary').click();
 await page.locator('#moreMenu button.tab[data-view="builder"]').click();
`);
insert(" advance('source-attested-default-outfit-preview');",`
 assert.equal(await wearRow(),undefined,'saving cannot record wear');
 await wear.click();
 await status.getByText('Outfit recorded for today.').waitFor();
 await expectedNames([outfitName]);
 await history.getByRole('button',{name:'Open saved outfit'}).click();
 assert.equal(await page.locator('#boardName').inputValue(),outfitName);
 assert.equal((await wearRow()).events.length,1);
 assert.equal(await rediscovery.getByRole('button',{name:'Style around '+shirtName,exact:true}).count(),0);
 await wear.click();
 await status.getByText('This combination is already recorded for today.').waitFor();
 await expectedNames([outfitName]);
 await history.getByRole('button',{name:/Undo wear record/}).click();
 await status.getByText('Wear record removed.').waitFor();
 await expectedNames([]);
 assert.equal(await rediscovery.getByRole('button',{name:'Style around '+shirtName,exact:true}).count(),1);
 await wear.click();
 await status.getByText('Outfit recorded for today.').waitFor();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Clear wear history'}).click();
 await status.getByText('Wear history cleared on this device.').waitFor();
 assert.equal(await wearRow(),undefined);
 await wear.click();
 await status.getByText('Outfit recorded for today.').waitFor();
`);
insert("  advance('normal-reload-and-restore');",`
  assert.equal(backup.includes(Buffer.from('outfit-wear-history-v1')),false);
`);
insert("  // Genuine file input + browser confirmation; never write IndexedDB directly.",`
  await openWear();
  await history.getByText(outfitName,{exact:true}).waitFor();
`);
insert("  advance('offline-warm-session-original-preview');",`
  await openWear();
  await history.getByText(outfitName,{exact:true}).waitFor();
  assert.equal((await wearRow()).events.length,1);
`);
insert(" advance('logout-and-other-owner-no-original-pixels');",`
 await page.evaluate(()=>new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');
  const request=store.get('outfit-wear-history-v1');
  request.onsuccess=()=>store.put({...request.result,events:[...request.result.events,{name:'Broken record'}]});
  tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
 }));
 // Discard the preceding harness's intentional in-memory JPEG tamper.
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>db?.name==='closet-current-user-p99-A');
 await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
 await page.locator('#closetAllPieces').click();
 const shirtCard=page.locator('#closetGrid .card').filter({has:page.getByRole('heading',{name:shirtName,exact:true})});
 const editedName='P1656 edited shirt';
 await shirtCard.getByRole('button',{name:'Adjust details'}).click();
 const editor=page.locator('dialog.clothing-editor');
 await editor.getByLabel('Item name').fill(editedName);
 await editor.getByRole('button',{name:'Save changes'}).click();
 await editor.waitFor({state:'hidden'});
 await page.locator('#moreMenu summary').click();
 await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 await openWear();
 await history.getByText(new RegExp(editedName)).waitFor();
 await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
 await page.locator('#closetAllPieces').click();
 await page.locator('#closetGrid .card').filter({has:page.getByRole('heading',{name:editedName,exact:true})}).getByRole('button',{name:'Delete',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#closetCount')?.textContent==='1');
 await page.locator('#moreMenu summary').click();
 await page.locator('#moreMenu button.tab[data-view="builder"]').click();
 await openWear();
 await history.getByText(/Unavailable piece/).waitFor();
 assert.equal(await wear.count(),0,'incomplete saved board has no wear action');
 assert.equal(await history.getByRole('button',{name:'Open saved outfit'}).count(),0);
 assert.equal(await history.getByText('Broken record',{exact:true}).count(),0);
 assert.equal((await wearRow()).events.length,2,'A still owns history at sign-out');
 // Inherited recovery guard closes the regular app DB after a stale saved
 // board references a deleted garment. Verify recovery leaves the log intact.
 await page.reload({waitUntil:'domcontentloaded'});
 const recovery=await page.evaluate(async()=>{
  await outfitBoardReady;
  return {locked:!db,count:startupWardrobeRecoveryCount};
 });
 if(recovery.locked){
  assert.ok(recovery.count>0);
  await page.locator('#moreMenu summary').click();
  await page.locator('#moreMenu button.tab[data-view="builder"]').click();
  await openWear();
  await status.getByText('Wear history is unavailable until your private wardrobe is ready.').waitFor();
  const durable=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const request=indexedDB.open('closet-current-user-p99-A');
   request.onupgradeneeded=()=>request.transaction.abort();
   request.onerror=()=>reject(request.error);
   request.onsuccess=()=>{
    const ownerDB=request.result,tx=ownerDB.transaction('state');
    const read=tx.objectStore('state').get('outfit-wear-history-v1');
    tx.oncomplete=()=>{ownerDB.close();resolve(read.result?.events.length);};
    tx.onabort=()=>{ownerDB.close();reject(tx.error);};
   };
  }));
  assert.equal(durable,2);
  console.log('P1656_INHERITED_DELETE_RELOAD_RECOVERY',engine,width,'wear history retained');
 }

`);
insert(" assert.equal(await page.locator('#closetCount').innerText(),'0',",`
 assert.equal(await wearRow(),undefined);
 console.log('P1656_NATIVE_GREEN',engine,width,'one tap to record; no implicit history; dedupe, undo, reload, restore, edits, deletes, reset, isolation');
`);

const output='scripts/.p1656-native-'+randomUUID()+'.mjs';
try{
 fs.writeFileSync(output,source,{flag:'wx'});
 const run=spawnSync(process.execPath,[output],{
  stdio:'inherit',
  env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'},
 });
 if(run.error)throw run.error;
 process.exitCode=run.status??1;
}finally{
 if(fs.existsSync(output))fs.unlinkSync(output);
}
