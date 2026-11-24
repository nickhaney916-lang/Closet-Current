'use strict';
const fs=require('node:fs'),{spawnSync}=require('node:child_process'),{randomUUID}=require('node:crypto');
const path='scripts/test-p1600-wardrobe-recovery-browser.mjs';
let source=fs.readFileSync(path,'utf8');
const anchor="   console.log(engine,'authorized synthetic recovery and same-owner import passed',sha);";
if(source.split(anchor).length!==2)throw Error('Recovery harness anchor changed');
source=source.replace(anchor,anchor+`
   // Seed two distinct synthetic originals and a saved outfit referencing both.
   const second={...row,id:'jeans',name:'Private blue jeans',category:'Bottoms',itemType:'Jeans',
    image:damagedImage,originalPhoto:{image:damagedImage,sha256:hash(damagedBytes)},sourceSHA256:hash(damagedBytes)};
   const originalBoard={id:'outfit-board',current:{name:'Today',slots:{top:'shirt',bottom:'jeans'}},
    saved:[{name:'Saved outfit',slots:{top:'shirt',bottom:'jeans'}},{name:'Unrelated outfit',slots:{bottom:'jeans'}}]};
   const wear={id:'outfit-wear-history-v1',events:[{synthetic:true}]};
   await storage(page,owner,{items:[row,second],state:[marker,originalBoard,{id:'draft',batch:[]},wear]});
   await page.reload({waitUntil:'domcontentloaded'});
   await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
   await page.locator('#closetAllPieces').click();
   const card=page.locator('#closetGrid .card').filter({has:page.getByRole('heading',{name:row.name,exact:true})});
   consent=false;
   await card.getByRole('button',{name:'Delete',exact:true}).click();
   assert.equal((await storage(page,owner)).items.length,2,'cancel preserves wardrobe');
   consent=true;
   await card.getByRole('button',{name:'Delete',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#closetCount')?.textContent==='1');
   const deleted=await storage(page,owner);
   assert.equal(deleted.items.length,1);
   assert.equal(deleted.items[0].id,'jeans');
   assert.equal(hash(Buffer.from(deleted.items[0].originalPhoto.image.split(',')[1],'base64')),hash(damagedBytes));
   assert.deepEqual(deleted.state.find(x=>x.id===wear.id),wear);
   await page.reload({waitUntil:'domcontentloaded'});
   const locked=await page.evaluate(async()=>{await outfitBoardReady;return !db&&startupWardrobeRecoveryCount>0;});
   if(process.env.P1659_EXPECT_RED==='1'){
    assert.equal(locked,true,'baseline must reproduce actual recovery lock');
    console.log('P1659_DELETE_RELOAD_RED',engine);
   }else{
    assert.equal(locked,false,'owner must retain private wardrobe after deliberate deletion');
    const persisted=deleted.state.find(x=>x.id==='outfit-board');
    assert.deepEqual(persisted.current,{name:'Today',slots:{bottom:'jeans'}});
    assert.deepEqual(persisted.saved,[{name:'Saved outfit',slots:{bottom:'jeans'}},{name:'Unrelated outfit',slots:{bottom:'jeans'}}]);
    await page.locator('nav.main-nav button.tab[data-view="closet"]').click();
    assert.equal(await page.locator('#export').isEnabled(),true);
    assert.equal(await page.evaluate(()=>items.length),1);
    assert.deepEqual(await storage(page,owner),deleted);
    console.log('P1659_DELETE_RELOAD_GREEN',engine,'cancel, atomic unlink, original hash, wear row, reload and backup access');
   }
`);
const output='scripts/.p1659-delete-'+randomUUID()+'.mjs';
try{fs.writeFileSync(output,source,{flag:'wx'});const run=spawnSync(process.execPath,[output],{stdio:'inherit',env:process.env});if(run.error)throw run.error;process.exitCode=run.status??1;}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
