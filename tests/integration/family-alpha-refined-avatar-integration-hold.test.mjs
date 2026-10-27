import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {
 BASE,OUTPUT,STYLE_BASE_PIN,FIGURE_SOURCE_PIN,RENDERER,assertVisualHOLD
} from '../../scripts/build-family-alpha-refined-avatar-integration-hold.mjs';

test('refined avatar source is exactly #326, on immutable #31 integration and style engine',async()=>{
 const manifest=await assertVisualHOLD();
 assert.equal(manifest.baseRef,STYLE_BASE_PIN);
 assert.equal(manifest.figureRef,FIGURE_SOURCE_PIN);
 assert.equal(manifest.releaseGate,'HOLD');
 assert.equal(manifest.familyFourAccountsCertified,false);
 assert.equal(manifest.realPhotoCutoutsCertified,false);
 assert.equal(manifest.reliableGarmentFittingVerified,false);
 assert.equal(manifest.stagingAuthDisabled,true);
 assert.equal(manifest.originalPhotoRecognitionUnchanged,true);
 assert.equal(manifest.garmentCutoutRGBUnchanged,true);
 const source=execFileSync('git',['show',FIGURE_SOURCE_PIN+':public/'+RENDERER]);
 assert.ok((await readFile(join(OUTPUT,RENDERER))).equals(source));
 for(const name of ['alpha31-manifest.json','alpha29-manifest.json','app.js',
  'auth.js','cloud-backup.js','family-alpha-2d-layer-plan.mjs',
  '__alpha_research/family-alpha-29/workflow.mjs',
  '__alpha_research/family-alpha-19/style-my-new-clothes.mjs']){
  const [a,b]=await Promise.all([readFile(join(BASE,name)),readFile(join(OUTPUT,name))]);
  assert.ok(a.equals(b),'Unexpected mutation to authored customer or security source '+name);
 }
});
test('attempt to mark unapproved real fitting or four-account isolation certified fails closed',async()=>{
 const path=join(OUTPUT,'alpha31-refined-visual-HOLD-manifest.json');
 const original=await readFile(path,'utf8');
 try{
  for(const [key,val] of [
   ['releaseGate','READY'],['deployAuthorized',true],
   ['familyPhotoApproval',true],['familyFourAccountsCertified',true],
   ['reliableGarmentFittingVerified',true],['realPhotoCutoutsCertified',true],
   ['stagingAuthDisabled',false],['localOptInOnly',false]
  ]){
   const changed=JSON.parse(original);changed[key]=val;
   await writeFile(path,JSON.stringify(changed));
   await assert.rejects(()=>assertVisualHOLD(),/unapproved offline HOLD/);
  }
 }finally{await writeFile(path,original);}
 await assertVisualHOLD();
});
test('stale or altered approved garment renderer cannot masquerade as source-pinned neutral figure',async()=>{
 const path=join(OUTPUT,RENDERER);
 const original=await readFile(path);
 try{
  await writeFile(path,Buffer.concat([original,Buffer.from('\n// tamper')]));
  await assert.rejects(()=>assertVisualHOLD(),/immutable #326/);
 }finally{await writeFile(path,original);}
 await assertVisualHOLD();
});
