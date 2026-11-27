import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
for(const [name,engine] of Object.entries({chromium,webkit})){
 if(process.env.CC_CROP_ENGINE&&process.env.CC_CROP_ENGINE!==name)continue;
 const browser=await engine.launch({headless:true});
 try{for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',r=>r.abort());
   await page.setContent('<!doctype html><meta name="viewport" content="width=device-width"><style>dialog{width:250px;max-width:90vw;max-height:90vh;overflow:auto}.crop-stage{position:relative;width:200px;height:160px}.crop-stage img{width:100%;height:100%}.crop-frame{position:absolute}.crop-preview{max-width:200px}</style>');
   for(const file of ['photo-crop-engine.js','garment-mask-engine.js','photo-crop-editor.js'])await page.addScriptTag({path:'dist/'+file});
   await page.evaluate(async()=>{
    const c=document.createElement('canvas');c.width=200;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#a02020';ctx.fillRect(0,0,200,160);
    window.fixtureCurrent=true;window.saved=[];window.original=c.toDataURL('image/jpeg',.95);
    window.openFixture=()=>window.openPhotoCrop({image:window.original},{isCurrent:()=>window.fixtureCurrent,analyze:()=>new Promise(r=>window.finishRecognition=r),save:async(photo,choice)=>window.saved.push({photo,choice})});
    await window.openFixture();
   });
   const button=label=>page.getByRole('button',{name:label,exact:true});
   await button('Check recognition').click();
   for(const label of ['Move crop','Erase background','Restore fabric','Reset mask','Whole photo','Save crop'])assert.equal(await button(label).isDisabled(),true,label);
   assert.equal(await page.getByRole('slider',{name:'Mask brush size'}).isDisabled(),true);
   await page.evaluate(()=>window.finishRecognition({category:'Top',itemType:'T-shirt',details:{}}));
   await page.getByText('Suggested: Top · T-shirt',{exact:true}).waitFor();
   assert.equal(await page.getByRole('checkbox',{name:'Use suggested clothing details'}).isChecked(),false);
   assert.equal(await button('Reset mask').isEnabled(),true);
   await page.getByRole('checkbox',{name:'Use suggested clothing details'}).check();
   await button('Reset mask').click();
   assert.equal(await page.getByRole('checkbox',{name:'Use suggested clothing details'}).isVisible(),false);
   await button('Save crop').click();
   await page.locator('dialog').waitFor({state:'detached'});
   assert.equal(await page.evaluate(()=>window.saved[0].choice),null);
   await page.evaluate(()=>window.openFixture());
   await button('Check recognition').click();
   await button('Cancel').click();
   await page.locator('dialog').waitFor({state:'detached'});
   await page.evaluate(()=>window.finishRecognition({category:'Old crop',details:{}}));
   await page.evaluate(()=>window.openFixture());
   assert.equal(await page.getByRole('checkbox',{name:'Use suggested clothing details'}).isVisible(),false);
   assert.deepEqual(errors,[]);
   console.log(name,width,'PASS crop recognition control lock, explicit review, edit invalidation and cancelled lease');
  }finally{await context.close();}
 }}finally{await browser.close();}
}
