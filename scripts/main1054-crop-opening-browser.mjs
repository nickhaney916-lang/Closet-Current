import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const [engine='chromium',editorPath='public/photo-crop-editor.js',mode='candidate']=process.argv.slice(2);
const editor=await readFile(editorPath,'utf8');
const cropEngine=await readFile('public/photo-crop-engine.js','utf8');
const image='data:image/jpeg;base64,'+(await sharp({create:{width:256,height:256,channels:3,background:'#314dab'}}).jpeg().toBuffer()).toString('base64');
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<main>Crop fixture</main>');
  await page.addScriptTag({content:cropEngine});
  await page.addScriptTag({content:editor});
  await page.evaluate(image=>{
   window.fixtureItem={image,originalPhoto:{image}};
   window.epoch=0;window.decodes=[];window.done=[];window.failures=[];
   const nativeDecode=HTMLImageElement.prototype.decode;
   HTMLImageElement.prototype.decode=function(){
    const image=this;
    return new Promise((resolve,reject)=>decodes.push({resolve:()=>nativeDecode.call(image).then(resolve,reject),reject}));
   };
   window.startCrop=()=>{const epochAtOpen=epoch;const p=openPhotoCrop(fixtureItem,{analyze:async()=>null,save:async()=>{},isCurrent:()=>epochAtOpen===epoch});done.push(p);p.catch(error=>failures.push(error.name));};
  },image);
  await page.evaluate(()=>{startCrop();startCrop();});
  assert.equal(await page.evaluate(()=>decodes.length),mode==='baseline'?2:1);
  await page.evaluate(()=>decodes.forEach(d=>d.resolve()));
  await page.waitForFunction(count=>document.querySelectorAll('dialog[open]').length===count,mode==='baseline'?2:1);
  if(mode==='baseline'){
   console.log('CROP_OPENING_RED',engine,width);
   await page.close();continue;
  }
  await page.evaluate(()=>startCrop());
  assert.equal(await page.evaluate(()=>decodes.length),1);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('dialog[open]').length===0);
  await page.evaluate(()=>startCrop());
  assert.equal(await page.evaluate(()=>decodes.length),2);
  await page.evaluate(()=>decodes[1].reject(Error('fixture decode failure')));
  await page.waitForFunction(()=>failures.length===1);
  await page.evaluate(()=>startCrop());
  assert.equal(await page.evaluate(()=>decodes.length),3);
  // Revoked opening must not block the next signed session or clear its opening guard.
  await page.evaluate(()=>{epoch++;startCrop();});
  assert.equal(await page.evaluate(()=>decodes.length),4);
  await page.evaluate(()=>decodes[2].resolve());
  await page.evaluate(()=>done[4]).catch(()=>{});
  await page.evaluate(()=>startCrop());
  assert.equal(await page.evaluate(()=>decodes.length),4);
  await page.evaluate(()=>decodes[3].resolve());
  await page.waitForFunction(()=>document.querySelectorAll('dialog[open]').length===1);
  assert.equal(await page.evaluate(()=>fixtureItem.originalPhoto.image===fixtureItem.image),true);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  console.log('CROP_OPENING_GREEN',engine,width);
  await page.close();
 }
}finally{await browser.close();}
