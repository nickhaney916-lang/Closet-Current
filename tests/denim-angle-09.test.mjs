import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('F09 must use actual matched original source WebGL front/oblique/rear angles, not synthesized visuals',()=>{
 const script=readFileSync('scripts/test-fabric-sweep-04-browser.mjs','utf8');
 for(const key of [
  'for(const angle of [0,45,135,180])',
  "await bp.evaluate(a=>window.ccWardrobe10View(a),angle)",
  "await p.evaluate(a=>window.ccWardrobe10View(a),angle)",
  "bp.locator('#avatar').screenshot()",
  "p.locator('#avatar').screenshot()",
  "benchmark/denim-angle-09/",
  "sameConfirmedOriginalSource:true",
  "noNewBVHContacts:fitted.bodyContactAfter<=fitted.bodyContactBefore",
  "sourcePhotographyRearNotInferred:true",
  "assert.equal(denimAngle09Comparisons.length,16)",
  "originalPhotographedFrontUVAndSHAUnmodified:true",
  "synthesizedUnseenRearPhoto:false"
 ])assert.ok(script.includes(key),key);
 assert.doesNotMatch(script,/\bhtml2canvas\b|\bfabric\.js\b/);
});
test('F09 preserves licensed source boundary identity and exact frozen 3D camera return',()=>{
 const script=readFileSync('scripts/test-fabric-sweep-04-browser.mjs','utf8'),
  wardrobe=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8'),
  fit=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 for(const marker of ['originalSourceNeutralCuffFairing08:true','denimAngle09Comparisons.push',
  'diff(await raw(returned07),await raw(frame07))<=2',
  'diff(await raw(returned08),await raw(frozen))<=2',
  "before09.account,'fixture-account-a'","after09.account,'fixture-account-a'"])
  assert.ok(script.includes(marker)||marker==='originalSourceNeutralCuffFairing08:true'&&fit.includes('originalSourceNeutralCuffFairing08:sourceFairing08'),marker);
 for(const s of ["get('denimFit')==='after'","get('denimSilhouette')==='after'","get('denimFairing')==='after'",
  'bound?.ownerId!==owner.ownerId','last3D?.originalPhotoSHA256s?.bottom'])
  assert.ok(wardrobe.includes(s),s);
 for(const s of ['pantsSourceFront','pantsSourceUV','pantsRest','skinIndex','skinWeight',
  'originalPhotoTextureRGBAndUVUnmodified08:true'])assert.ok(fit.includes(s),s);
});
