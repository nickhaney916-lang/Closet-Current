'use strict';
// Reuse the accepted P99 real chooser/review + loopback owner harness without
// editing it or duplicating #1636's repeat-use acceptance. Generate a temporary
// sibling runner, then exercise the actual ordinary stylist form controls.
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const path='scripts/test-parallel99-normal-app-browser.mjs';
const output='scripts/.p1640-native-context-runner.mjs';
let source=fs.readFileSync(path,'utf8');
function replace(before,after){if(source.split(before).length!==2)throw Error('P99 source anchor mismatch');source=source.replace(before,after);}
replace(" await editor.getByLabel('Color',{exact:true}).fill(color);",` await editor.getByLabel('Color',{exact:true}).fill(color);
 if(!secondOwner){
  const season=editor.locator('fieldset.season-picker input');
  for(const checkbox of await season.all())if(await checkbox.isChecked())await checkbox.uncheck();
  await editor.locator('fieldset.season-picker input[value="'+(category==='Tops'?'Winter':'All seasons')+'"]').check();
 }`);
const start=source.indexOf(" advance('normal-chooser-cancel-duplicate-and-oversize-no-write');");
const end=source.indexOf("}catch(error){",start);
if(start<0||end<0||source.indexOf("}finally{",end)<0)throw Error('P99 boundary absent');
// Use the final error handler (nested catches can occur in the removed part).
const finalCatch=source.lastIndexOf("}catch(error){");
if(finalCatch<start)throw Error('P99 final boundary absent');
source=source.slice(0,start)+`
 advance('p1640-occasion-season-real-ui');
 const savedSeasons=await page.evaluate(()=>items.map(x=>({name:x.name,seasons:x.seasons})));
 assert.equal(savedSeasons.find(x=>x.name===shirtName)?.seasons.join(','),'Winter');
 assert.equal(savedSeasons.find(x=>x.name===jeansName)?.seasons.join(','),'All seasons');
 await page.locator('nav.main-nav button.tab[data-view="stylist"]').click();
 const focus=page.locator('#stylistFocusItem'),occasion=page.locator('#stylistOccasion'),season=page.locator('#stylistSeason');
 const shirtId=await focus.locator('option').filter({hasText:shirtName}).getAttribute('value');
 assert.ok(shirtId);
 await page.locator('#styleCollectionForm details summary').click();
 const cards=page.locator('#styledCollectionResults .styled-outfit');
 const red=process.env.P1640_EXPECT_RED==='1';
 async function choose(intent,weather,expected){
  await occasion.selectOption(intent);await season.selectOption(weather);await focus.selectOption(shirtId);
  await page.locator('#createCollectionOutfits').click();
  await page.waitForFunction(()=>document.querySelector('#createCollectionOutfits')?.disabled===false&&
   /Here are|No suitable combination/.test(document.querySelector('#stylistStatus')?.textContent||''),null,{timeout:30000});
  assert.equal(await cards.count()>0,expected,'P1640 '+intent+' '+weather+' contextual eligibility');
  if(expected)assert.match(await cards.first().innerText(),/Includes P99 Black Shirt/);
 }
 await choose('Casual','Winter',true);
 await choose('Casual','Summer',red);
 await choose('Work','Winter',red);
 await choose('Activewear','Winter',true);
 assert.match(await cards.first().innerText(),/Still needed from your closet:.*Shoes/i);
 assert.match(await cards.first().innerText(),/actual activity/i);
 assert.equal(await rowCount(),2);
 assert.deepEqual(errors,[],'native page exception');
 console.log('P1640_CONTEXT_UI '+engine+' '+width+' '+(red?'RED reproduced':'GREEN')+' actual signed-owner context controls, original chooser and review, no model accuracy claim');
`+source.slice(finalCatch);
try{
 fs.writeFileSync(output,source,{flag:'wx'});
 const result=spawnSync(process.execPath,[output],{stdio:'inherit',env:{...process.env,P1607_AUDIT:'1',P1607_CACHE_ONLY:'0'}});
 if(result.error)throw result.error;process.exitCode=result.status??1;
}finally{if(fs.existsSync(output))fs.unlinkSync(output);}
