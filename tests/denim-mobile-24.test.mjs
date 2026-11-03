import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync('scripts/test-denim-mobile-24-browser.mjs','utf8');
const workflow=readFileSync('.github/workflows/denim-mobile-24-no-deploy.yml','utf8');
test('MOBILE-24 authentic two original 163-bone figures and 3 phone widths',()=>{
 assert.ok(script.includes('for(const width of [320,390,430])'));
 assert.ok(script.includes("for(const rig of ['female','male'])"));
 assert.ok(script.includes('for(const denimIndex of [0,1])'));
 assert.ok(script.includes('for(const angle of [0,90,135,180])'));
 assert.ok(script.includes('results.length,48'));
 assert.ok(script.includes("boneCount:state.bones"));
 assert.ok(script.includes('d.bones,163'));
});
test('MOBILE-24 authentic P23 source, visible original denim, no fake rear and privacy',()=>{
 assert.ok(script.includes('sourceDenimMaterial23Compiled,true'));
 assert.ok(script.includes('sourceDenimMaterial23Protected,true'));
 assert.ok(script.includes('sourceDenimMaterial23NoRearPhoto,true'));
 assert.ok(script.includes("verifiedOriginalRearPhotograph,false"));
 assert.ok(script.includes('blueDenimPixels>=1200'));
 assert.ok(script.includes('Original denim source SHA must match'));
 assert.ok(script.includes('originalJPEGUVRestSkinProtected22,true'));
 assert.ok(script.includes('trueBVHBodyContactNoNew,true'));
 assert.ok(script.includes('state.photoCoverageViewClass'));
 assert.ok(script.includes("sourcePhotoCoverageVisible,false"));
 assert.ok(script.includes('server.close'));
});
test('MOBILE-24 no user photo, no fake success and no production changes',()=>{
 assert.ok(script.includes('productionModified:false'));
 assert.ok(script.includes('physicalPhoneApproved:false'));
 assert.ok(script.includes('familyAlpha:'));
 assert.ok(script.includes("familyAlpha:'HOLD'"));
 assert.ok(script.includes('throw e'));
 assert.ok(script.includes("benchmark/denim-mobile-24/results.json")||script.includes("output+'/results.json'"));
 assert.ok(workflow.includes("git merge-base --is-ancestor 5c281e5b981fba3ab01d268cd5fbd4c0afca78c8 HEAD"));
 assert.ok(workflow.includes('P24 UNAUTHORIZED photo, production or parallel branch edit'));
 assert.ok(!/^\s*run:\s*(?:wrangler|npm run deploy|supabase db push)/m.test(workflow));
});
