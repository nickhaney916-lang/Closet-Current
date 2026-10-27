import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertWork51,patchStyle} from '../../scripts/build-family-alpha-51-mobile-nav-hold.mjs';
test('source-pinned mobile CSS and all private owner/photo assets remain guarded HOLD',async()=>{
 const m=await assertWork51();
 assert.equal(m.decision,'HOLD');
 assert.equal(m.deploymentAuthorized,false);
 assert.equal(m.realPhysicalPhoneVerified,false);
 assert.equal(m.realJwtIsolationVerified,false);
 assert.deepEqual(m.changedAssets,['style.css']);
});
test('keyboard focus and real touch event follow the safe existing three-look journey',async()=>{
 const t=await readFile('scripts/test-family-alpha-52-touch-keyboard-browser.mjs','utf8');
 assert.match(t,/page\.keyboard\.press\('Tab'\)/);
 assert.match(t,/keyboard-native-tab-to-shoe-swap/);
 assert.match(t,/visible-keyboard-focus-outline/);
 assert.match(t,/elementFromPoint/);
 assert.match(t,/\.tap\(\)/);
 assert.match(t,/WORK43_LICENSED:'1'/);
 assert.doesNotMatch(t,/mouse\.wheel|window\.scrollBy|scrollBy\(0,200\)|\.click\(\{force:true\}\)/);
 assert.match(t,/dist-family-alpha-51-mobile-nav-HOLD/);
});
test('preserves safe-area aware scroll clearance and no direct source/private account writes',async()=>{
 const css=patchStyle(await readFile('public/style.css','utf8'));
 assert.match(css,/scroll-padding-bottom:calc\(132px \+ env/);
 assert.match(css,/scroll-margin-block-end:calc\(132px \+ env/);
 const source=await readFile('scripts/test-family-alpha-52-touch-keyboard-browser.mjs','utf8');
 assert.doesNotMatch(source,/(service_role|sb_secret_|hlkgymugtfbirlpunsra|https:\/\/fbnplztkbsteuzrmbgib|createUser|signUp\()/);
});
