import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine='chromium',appPath='public/app.js',mode='candidate']=process.argv.slice(2);
const app=await readFile(appPath,'utf8');
const start=app.indexOf('function ownerStyleCardActionLease(item){'),end=app.indexOf('// The general',start);
assert.ok(start>=0&&end>start);
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<div id="authGate" hidden></div><main id="appShell"><button id="photo">Style from Photo results</button><button id="closet">Style from My Closet</button></main>');
  await page.evaluate(()=>{
   const auth=id=>({user:{id},assertCurrent(){}});
   const database=id=>({name:'closet-current-user-'+id});
   Object.assign(window,{closetAuth:auth('A'),db:database('A'),captureOperationEpoch:0,items:[{id:'piece',image:'fixture-original'}],calls:[],notices:[]});
   window.$=id=>document.getElementById(id);
   window.message=t=>notices.push(t);
   window.wire=id=>{$(id).onclick=()=>withOwnerStyleCardAction(items[0],$(id),assertOwner=>new Promise((resolve,reject)=>calls.push({resolve,reject,assertOwner})));};
   window.loginFixture=id=>{captureOperationEpoch++;closetAuth=auth(id);db=database(id);items=[{id:'piece',image:'new-owner-original'}];};
  });
  await page.addScriptTag({content:app.slice(start,end)});
  await page.evaluate(()=>{wire('photo');wire('closet');});
  const photo=page.locator('#photo'),closet=page.locator('#closet');
  await photo.click();
  await closet.click();
  if(mode==='baseline'){
   assert.equal(await page.evaluate(()=>calls.length),2);
   await page.evaluate(()=>calls.forEach(c=>c.resolve()));
   console.log('STYLE_CARD_FLIGHT_RED',engine,width);
   await page.close();continue;
  }
  assert.equal(await page.evaluate(()=>calls.length),1);
  assert.equal(await photo.isDisabled(),true);
  await page.evaluate(()=>{const old=$('photo'),replacement=old.cloneNode(true);replacement.disabled=false;old.replaceWith(replacement);wire('photo');});
  await photo.click();
  assert.equal(await page.evaluate(()=>calls.length),1);
  await page.evaluate(()=>calls[0].reject(Error('fixture private error')));
  await page.waitForFunction(()=>withOwnerStyleCardAction.pending===null);
  await closet.click();
  assert.equal(await page.evaluate(()=>calls.length),2);
  await page.evaluate(()=>{loginFixture('B');for(const id of ['photo','closet']){const old=$(id),replacement=old.cloneNode(true);replacement.disabled=false;old.replaceWith(replacement);wire(id);}});
  await photo.click();
  assert.equal(await page.evaluate(()=>calls.length),3);
  await page.evaluate(()=>calls[1].resolve());
  await page.evaluate(()=>true);
  assert.equal(await photo.isDisabled(),true);
  await closet.click();
  assert.equal(await page.evaluate(()=>calls.length),3);
  await page.evaluate(()=>calls[2].resolve());
  await page.waitForFunction(()=>!$('photo').disabled&&withOwnerStyleCardAction.pending===null);
  assert.equal(await page.evaluate(()=>items[0].image),'new-owner-original');
  await closet.click();
  assert.equal(await page.evaluate(()=>calls.length),4);
  await page.evaluate(()=>calls[3].resolve());
  await page.waitForFunction(()=>!$('closet').disabled);
  console.log('STYLE_CARD_FLIGHT_GREEN',engine,width);
  await page.close();
 }
}finally{await browser.close();}
