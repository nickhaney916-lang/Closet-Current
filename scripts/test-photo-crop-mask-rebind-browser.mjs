import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';

const expectStale=process.argv.includes('--expect-stale');
const css=`
.photo-crop-editor { width: 650px; max-width: 90vw; }
.crop-stage { position: relative; width: 400px; height: 300px; }
.crop-stage > img { width: 100%; height: 100%; }
.crop-frame { position: absolute; box-sizing: border-box; border: 2px solid blue; }
.crop-handle { position: absolute; width: 14px; height: 14px; }
.crop-handle.nw { left: 0; top: 0; }
.crop-handle.ne { right: 0; top: 0; }
.crop-handle.sw { left: 0; bottom: 0; }
.crop-handle.se { right: 0; bottom: 0; }
`;

for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:900,height:900}});
  await page.goto('about:blank');
  await page.addStyleTag({content:css});
  for(const script of ['public/photo-crop-engine.js','public/garment-mask-engine.js','public/photo-crop-editor.js'])
   await page.addScriptTag({path:resolve(script)});

  async function openEditor(){
   await page.evaluate(async()=>{
    const sourceCanvas=document.createElement('canvas');
    sourceCanvas.width=400;sourceCanvas.height=300;
    const ctx=sourceCanvas.getContext('2d');
    ctx.fillStyle='#cc2020';ctx.fillRect(0,0,200,300);
    ctx.fillStyle='#2040cc';ctx.fillRect(200,0,200,300);
    const image=sourceCanvas.toDataURL('image/jpeg',.95);
    window.__savedCrop=null;
    await window.openPhotoCrop(
     {image,cropBounds:{x:0.1,y:0.1,width:0.6,height:0.6}},
     {analyze:async()=>null,save:async photo=>{window.__savedCrop=photo;}});
   });
   await page.locator('dialog.photo-crop-editor').waitFor();
  }
  async function paintMask(){
   await page.getByRole('button',{name:'Erase background'}).click();
   const frame=page.locator('.crop-frame');
   await frame.click({position:{x:80,y:75}});
   return frame;
  }
  async function save(){
   await page.getByRole('button',{name:'Save crop'}).click();
   await page.locator('dialog.photo-crop-editor').waitFor({state:'detached'});
   return page.evaluate(()=>({
    applied:window.__savedCrop?.maskApplied??false,
    x:window.__savedCrop?.cropBounds.x,
    imagePrefix:window.__savedCrop?.image?.slice(0,23)
   }));
  }

  await openEditor();
  await paintMask();
  const retained=await save();
  assert.equal(retained.applied,true,name+': mask must persist when crop is unchanged');
  assert.equal(retained.imagePrefix,'data:image/jpeg;base64,',name+': editable source produces JPEG');

  await openEditor();
  const frame=await paintMask();
  await page.getByRole('button',{name:'Move crop'}).click();
  await frame.focus();
  await page.keyboard.press('ArrowRight');
  const moved=await save();
  assert.ok(moved.x>.1,name+': original crop actually moved');
  assert.equal(moved.applied,expectStale,
   name+': mask must be invalidated if the same-size crop moves to new original pixels');
  console.log(name+': '+(expectStale?'baseline stale-mask RED reproduced':'corrected mask-to-original-crop binding GREEN')+
   ' (synthetic source JPEG, actual dialog and keyboard browser events)');
 } finally {await browser.close();}
}
