/** 3D62: protect original photo provenance and honest preview labels.
 * No real user images, no network, no simulation of unknown rear stitching.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceCoverage,displaySourceCoverage} from '../research/three-d-62/source-coverage.mjs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('no photographed jeans, no invented source view in any orientation',()=>{
 for(const view of ['front','threequarter','side','back']){
  const x=sourceCoverage({view,photoPants:false});
  assert.equal(x.coverage,'neutral-only');
  assert.equal(x.hasVerifiedRearPhoto,false);
  assert.equal(x.releaseAuthorized,false);
  assert.match(x.text,/Neutral reference pants|Neutral reference pants\./);
 }
 assert.match(sourceCoverage({view:'back',photoPants:false,photoShirt:true}).text,/shirt/);
});
test('verified source-front versus neutral unphotographed sides and rear',()=>{
 const front=sourceCoverage({view:'front',photoPants:true,photoShirt:true});
 assert.equal(front.coverage,'photographed-front');
 assert.match(front.text,/original photographed denim/i);
 assert.match(front.text,/shirt/);
 const three=sourceCoverage({view:'threequarter',photoPants:true});
 assert.equal(three.coverage,'mixed-front-neutral');
 assert.match(three.text,/neutral preview/i);
 for(const view of ['side','back']){
  const x=sourceCoverage({view,photoPants:true});
  assert.equal(x.coverage,'neutral-unphotographed');
  assert.equal(x.hasVerifiedRearPhoto,false);
  assert.equal(x.releaseAuthorized,false);
  assert.match(x.text,/no (photographed side|rear photograph)/i);
  assert.match(x.text,/neutral preview/i);
 }
 assert.match(sourceCoverage({view:'back',photoPants:true}).text,/not inferred/i);
 assert.throws(()=>sourceCoverage({view:'inside',photoPants:true}),/Unsupported/);
 assert.throws(()=>sourceCoverage({view:'front',photoPants:'yes'}),/flags/);
 assert.ok(Object.isFrozen(front));
});
test('DOM notice uses text only, accessible metadata, never HTML injection',()=>{
 const attrs={};const el={textContent:'',dataset:{},setAttribute:(k,v)=>attrs[k]=v};
 const r=displaySourceCoverage(el,{view:'back',photoPants:true});
 assert.equal(el.textContent,r.text);
 assert.equal(el.dataset.coverage,'neutral-unphotographed');
 assert.equal(el.dataset.view,'back');
 assert.equal(el.dataset.verifiedRearPhoto,'false');
 assert.equal(attrs['aria-label'],r.text);
 assert.throws(()=>displaySourceCoverage(null,{view:'front'}),/element required/);
});
for(const source of ['three-d-31','three-d-37']){
 test(source+' original-source pilot exposes notice, view changes and actual garment state',()=>{
  const html=read('research/'+source+'/index.html');
  const js=read('research/'+source+'/'+(source==='three-d-31'?'photo-jeans-demo.mjs':'second-jeans-demo.mjs'));
  assert.match(html,/<canvas id="avatar"[^>]*><\/canvas>\s*<p id="sourceCoverage"/);
  assert.match(html,/id="sourceCoverage"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html,/data-verified-rear-photo="false"/);
  assert.match(js,/import \{displaySourceCoverage\} from '..\/three-d-62\/source-coverage.mjs'/);
  assert.match(js,/photoPants:state.outfit\?\.pants\?\.photoApplied===true/);
  assert.match(js,/currentView=angle;update\(\)/);
  assert.match(js,/currentView='threequarter';update\(\)/);
  assert.match(js,/currentView='front';ready=true;update\(\)/);
  assert.match(js,/!e.isTrusted\|\|!\$\('review'\)\.checked/);
  assert.match(js,/unphotographed neutral back|side and back remain neutral/);
  assert.doesNotMatch(js,/fabricated rear (photograph|pockets)/i);
 });
}
test('second denim licensed source is credited correctly, not the public-domain first source',()=>{
 const html=read('research/three-d-37/index.html');
 assert.match(html,/CC BY-SA 4\.0 original front photograph/);
 assert.match(html,/File:Denimjeans2\.JPG/);
 assert.match(html,/Manda\.L\.Isch/);
 assert.match(html,/Petru Dimitriu/);
 assert.match(html,/creativecommons.org\/licenses\/by-sa\/4.0/);
 assert.doesNotMatch(html,/Oktaeder|Juanmak|File:Jeans\.jpg|Public-domain original/);
 const first=read('research/three-d-31/index.html');
 assert.match(first,/public-domain|Public-domain/);
 assert.match(first,/File:Jeans\.jpg/);
});
