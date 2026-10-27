import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {patchStyle,navClearance,buildWork51,assertWork51,WORK46_PIN,WORK44_PIN,OWNER_SOURCE_PIN}
 from '../../scripts/build-family-alpha-51-mobile-nav-hold.mjs';
const source=()=>readFile('public/style.css','utf8');
test('source-pinned Work46 error guard / private original photo remains untouched; only CSS is appended',async()=>{
 const m=await assertWork51();
 assert.deepEqual(m.changedAssets,['style.css']);
 assert.equal(m.parentWork46Commit,WORK46_PIN);
 assert.equal(m.work44Commit,WORK44_PIN);
 assert.equal(m.ownerPrivateJpegCommit,OWNER_SOURCE_PIN);
 assert.equal(m.decision,'HOLD');
 assert.equal(m.deploymentAuthorized,false);
 assert.equal(m.stagingAuthEnabled,false);
 assert.equal(m.realPhysicalPhoneVerified,false);
});
test('mobile scroll clearance is a style-only, non-click-intercepting, 760px-scoped patch',async()=>{
 const css=patchStyle(await source());
 assert.match(css,/@media \(max-width:760px\)/);
 assert.match(css,/html \{ scroll-padding-bottom:calc\(132px \+ env\(safe-area-inset-bottom, 0px\)\); \}/);
 assert.match(css,/#alpha29NewClothes :is\(button,select\)/);
 assert.match(css,/scroll-margin-block-end:calc\(132px/);
 assert.match(css,/body \{ padding-bottom:calc\(180px/);
 assert.doesNotMatch(navClearance,/(pointer-events|z-index|position:fixed|display:none|visibility:hidden|script|url\()/);
});
test('unexpected nav layout or duplicate transform refuses to build',async()=>{
 assert.throws(()=>patchStyle('body { padding-bottom:0; }'));
 const original=await source();
 assert.throws(()=>patchStyle(patchStyle(original)),/already applied/);
});
test('the complete compiled candidate verifies exact asset identity and kept HOLD',async()=>{
 const m=await buildWork51();
 assert.equal(m.decision,'HOLD');
 assert.equal(m.ownerVisualApproved,false);
 assert.equal(m.realJwtIsolationVerified,false);
 assert.equal(m.stagingCloudBackupVerified,false);
});
