// Source-authentic async publication in real DOM; synthetic controlled sessions.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const require=createRequire(import.meta.url);
const {boot,keys,modes}=require('../tests/fixtures/master-panel-publication.cjs');
const selection=process.env.MASTER_BROWSER||'both';
assert.ok(['both','chromium','webkit'].includes(selection));
const engines=[['chromium',chromium],['webkit',webkit]].filter(([n])=>selection==='both'||selection===n);
const results=[];
for(const [name,engine] of engines){
 const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
 try{for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',route=>route.abort());
  await page.setContent('<!doctype html><div id="authGate" hidden></div><main id="appShell"></main>');
  await page.addScriptTag({content:boot});
  for(const key of keys)for(const mode of modes){
   const r=await page.evaluate(({mode,key})=>window.masterPanelTrial(mode,key),{mode,key});
   const valid=mode==='valid';
   assert.equal(r.published,valid);assert.equal(r.publishedPanel,valid);
   assert.equal(r.disposed,valid?0:1);assert.equal(r.retainedNewOwnerBridge,!valid);
   results.push({engine:name,width,key,mode,pass:true});
  }
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();}
}
assert.equal(results.length,engines.length*3*keys.length*modes.length);
await mkdir('benchmark/master-panel-publication',{recursive:true});
await writeFile('benchmark/master-panel-publication/results.json',JSON.stringify({
 selection,cases:results.length,results,synthetic:true,realModelInference:false,
 physicalDevice:false,hostedCloud:false,releaseAuthorized:false,familyAlpha:'HOLD'
},null,2));
console.log('MASTER_PANEL_PUBLICATION',selection,results.length,'PASS; synthetic only; HOLD');
