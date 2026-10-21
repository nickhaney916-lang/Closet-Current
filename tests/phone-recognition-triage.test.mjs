import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {blankTrial} from '../scripts/linked-phone-garment-evidence.mjs';
import {summarizePhoneTriage,parsePhoneTriageSource} from '../scripts/phone-recognition-triage.mjs';
import {phoneTriageHTML,writePhoneTriageHTML} from '../scripts/build-phone-recognition-triage.mjs';
function recorded(row,{category='sneakers',color='black',modelCategory=category,modelColor=color,
 savedCategory=category,savedColor=color,savedPhoto='clear'}={}){
 Object.assign(row,{phase:'recorded',truthCategory:category,truthColor:color,
  modelCategory,modelColor,savedCategory,savedColor,savedPhoto});
}
test('blank fixed matrix has null rates, full denominators and no verified claims',()=>{
 const result=summarizePhoneTriage(blankTrial());
 assert.equal(result.totals.recorded,0);
 assert.equal(result.totals.required,30);
 assert.equal(result.totals.initialExactPercentOfRecorded,null);
 assert.equal(result.completedOriginalScenes,0);
 assert.equal(result.totalOriginalScenes,24);
 assert.deepEqual(result.byPlatform.map(x=>x.required),[15,15]);
 assert.equal(result.byFamily.length,5);
 assert.equal(result.byFamily.reduce((n,v)=>n+v.required,0),30);
 assert.equal(result.verification.verifiedRecognitionAccuracy,null);
 assert.equal(result.verification.productionPromotion,'BLOCKED');
});
test('a visually missing/pixelated photo never counts as a usable correctly saved garment',()=>{
 const trial=blankTrial();
 recorded(trial.rows[0],{savedPhoto:'missing'});
 recorded(trial.rows[1],{savedPhoto:'pixelated'});
 recorded(trial.rows[2],{savedPhoto:'clear'});
 const r=summarizePhoneTriage(trial);
 assert.equal(r.totals.initialCategoryAndColorCorrect,3);
 assert.equal(r.totals.usableCorrectlySaved,1);
 assert.equal(r.totals.usableSavedPercentOfRecorded,33.33);
 assert.equal(r.totals.issues['missing-photo'],1);
 assert.equal(r.totals.issues['pixelated-photo'],1);
 assert.equal(r.byPlatform[0].recorded,3);
 assert.equal(r.byPlatform[1].recorded,0);
 assert.equal(r.byFamily[0].recorded,3);
});
test('unsaved items and original-before-crop mistakes are counted separately, not inflated by corrections',()=>{
 const trial=blankTrial();
 recorded(trial.rows[0],{category:'boots',color:'brown',modelCategory:'sneakers',
  modelColor:'beige',savedCategory:'boots',savedColor:'brown'});
 recorded(trial.rows[1],{category:'boots',color:'black',modelCategory:'unrecognized',
  modelColor:'unrecognized',savedCategory:'not_saved',savedColor:'not_saved',savedPhoto:'not_saved'});
 const r=summarizePhoneTriage(trial);
 assert.equal(r.totals.issues['wrong-initial-category'],2);
 assert.equal(r.totals.issues['wrong-initial-color'],2);
 assert.equal(r.totals.issues['not-saved'],1);
 assert.equal(r.totals.issues['wrong-saved-category'],0);
 assert.equal(r.totals.initialCategoryAndColorCorrect,0);
 assert.equal(r.totals.usableCorrectlySaved,1);
 assert.equal(r.verification.independentlyReviewedOriginalsVerified,0);
 assert.equal(r.verification.physicalAndroidVerified,false);
 assert.equal(r.verification.physicalIPhoneVerified,false);
});
test('outfit has four entries and does not masquerade as four unique source photos',()=>{
 const t=blankTrial(),outfit=t.rows.filter(x=>x.id.startsWith('Android/whole-outfit/'));
 assert.equal(outfit.length,4);
 for(const row of outfit.slice(0,3))recorded(row,{category:'top',color:'red'});
 let r=summarizePhoneTriage(t);
 assert.equal(r.byFamily[4].recorded,3);
 assert.equal(r.completedOriginalScenes,0);
 recorded(outfit[3],{category:'boots',color:'black'});
 r=summarizePhoneTriage(t);
 assert.equal(r.completedOriginalScenes,1);
 assert.equal(r.totalOriginalScenes,24);
});
test('rejects forged privacy/device fields and mixed inputs with no accidental content echo',()=>{
 const t=blankTrial();
 for(const change of [x=>x.email='private@example.invalid',
  x=>x.rows[0].photo='private-image',x=>x.claims.recognitionAccuracyVerified=true,
  x=>x.rows[0].phase='recorded',x=>x.format='untrusted',
  x=>x.appRelease='private-host-or-token']){
  const candidate=structuredClone(t);change(candidate);
  assert.throws(()=>summarizePhoneTriage(candidate));
 }
 for(const raw of ['{',JSON.stringify({...t,photo:'PRIVATE'}),'a'.repeat(131073)])
  assert.throws(()=>parsePhoneTriageSource(raw));
 const safe=JSON.stringify(summarizePhoneTriage(t));
 assert.ok(!safe.includes('Android/sneakers/1'));
 assert.ok(!safe.includes('truthCategory'));
 assert.ok(!safe.includes('private@example'));
 assert.ok(!safe.includes('photo-image-id'));
});
test('generated offline review is CSP isolated, self-contained, syntax valid and non-overwriting',()=>{
 const html=phoneTriageHTML();
 const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(js,'Inline script absent');
 new vm.Script(js);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/base-uri 'none'/);
 assert.doesNotMatch(html,/<script[^>]+src=|<img[^>]+src=|fetch\(|localStorage|sessionStorage/);
 assert.ok(html.includes('PHONE-ORIGINALS.html'));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'closet-phone-triage-'));
 try{
  const name=path.join(dir,'private','PHONE-TRIAGE.html');
  assert.equal(writePhoneTriageHTML(name).offlineOnly,true);
  assert.throws(()=>writePhoneTriageHTML(name),{code:'EEXIST'});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
