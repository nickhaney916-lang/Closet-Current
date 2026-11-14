/** Native saved selection, not donor editor writes; synthetic owner/public photos. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const hashes={dress:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',shirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64'};
export async function checkSavedSwitch90(page,engine){
 const samples=[],baseline=new Map();
 const out='benchmark/parallel90/'+engine;
 await mkdir(out,{recursive:true});
 const original=await page.evaluate(()=>window.native3D05Bridge.state().opened);
 for(const index of [-1,1.5,999]){
  assert.equal(await page.evaluate(async i=>{try{await window.native3D05Bridge.switchSaved(i);return false;}catch{return true;}},index),true);
  assert.equal(await page.evaluate(()=>window.native3D05Bridge.state().opened),original,'invalid selection must preserve current admitted preview');
 }

 for(const figure of ['female','male']){
  for(let i=1;i<=16;i++){
   const selected=i%2?2:0,mode=selected===2?'shirt':'dress';
   const began=Date.now();
   // Actual accessible UI change; it invokes guarded native selectSaved,
   // destroys the old preview and creates a fresh independently admitted one.
   await page.selectOption('#native3D90Saved',String(selected));
   await page.waitForFunction(({selected,mode})=>{
    const s=window.native3D05Bridge.state();
    return s.modelReady&&s.viewerMode===mode&&
     window.nativeLossless04Bridge.selected===selected;
   },{selected,mode},{timeout:150000}).catch(async e=>{
    console.error('P90_SWITCH_DIAGNOSTIC',await page.evaluate(()=>({status:document.getElementById('native3D05Status')?.textContent,donor:document.getElementById('outfit3D01Status')?.textContent,state:window.native3D05Bridge.state()})));throw e;
   });
   if(await page.locator('#outfit3D01Model').inputValue()!==figure)
    await page.selectOption('#outfit3D01Model',figure);
   await page.waitForFunction(()=>window.native3D05Bridge.state().modelReady,null,{timeout:120000});
   const state=await page.evaluate(()=>window.native3D05Bridge.state());
   assert.equal(state.bones,163);assert.equal(state.figure90,figure);assert.ok(state.meshCount>0);
   assert.equal(state.garmentSources90[mode],hashes[mode]);
   assert.equal(state.garmentSources90[mode==='shirt'?'dress':'shirt'],null,'old garment removed');
   assert.equal(state.fallbackCount,3,'unsupported outerwear/shoes stay photo-only');
   assert.equal(await page.locator('#outfit3D01Photos img').count(),4);
   const photoHash=await page.locator('#outfit3D01Photos img').first().evaluate(async img=>{
    const bytes=await (await fetch(img.src)).arrayBuffer();
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
   });
   assert.equal(photoHash,hashes[mode],'visible original photo must follow selected source');
   const resources={geometries:state.resources90.geometries,textures:state.resources90.textures};
   const key=figure+'/'+mode;
   if(!baseline.has(key))baseline.set(key,resources);
   else assert.deepEqual(resources,baseline.get(key),'per-mode resource counts must not grow');
   assert.equal(await page.locator('#outfit3D01Canvas').evaluate(c=>{
    const fresh=window.__p90LastSwitchCanvas!==c;
    window.__p90LastSwitchCanvas=c;return fresh;
   }),true,'each switch must replace the old actual canvas object');
   samples.push({figure,operation:i,mode,sourceSHA256:photoHash,resources,heapBytes:await page.evaluate(()=>performance.memory?.usedJSHeapSize??null),elapsedMs:Date.now()-began,checkpoint:[1,4,16].includes(i)});
   if([1,4,16].includes(i))console.log('P90_SAVED_SWITCH',engine,figure,i,mode,JSON.stringify(resources));
  }
  await page.screenshot({path:out+'/'+figure+'-16-saved-switches.png'});
 }
 await page.evaluate(()=>{delete window.__p90LastSwitchCanvas;});
 await writeFile(out+'/saved-switches.json',JSON.stringify({engine,samples,
  sequence:'16 cumulative selections per rig with checkpoints 1/4/16',
  source:'licensed pinned research shirt and dress; partial outfits with 3 photo-only pieces',
  nativeSavedSelection:true,privateOwnerSynthetic:true,physicalPhone:false,
  performance:'end-to-end selection+rehash+renderer/model load; not FPS',familyAlpha:'HOLD'},null,2));
}
