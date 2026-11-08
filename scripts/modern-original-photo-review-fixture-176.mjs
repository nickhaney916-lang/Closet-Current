/**
 * P176 CI-only adapter for OLD original licensed-photo browser harnesses.
 * Current real app requires actual owner category/type/color review plus
 * single-garment source checkbox; old test scripts never clicked them.
 * Simulate a genuine UI choice, never bypass app review/security.
 * Does not modify public app or original SHA/owner verification.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const files=[
 'scripts/test-native-index-live-07-browser.mjs',
 'scripts/test-native-photo-readiness-08-browser.mjs'
];
const needle="  await editor.locator('button.primary').filter({hasText:'Save changes'}).click();";
const action=[
 '  // Current P167/P120 requires explicit owner review of original photo.',
 "  const reviewedDetails=editor.getByRole('checkbox',{name:'I verified the category, clothing type and color'});",
 "  const reviewedSource=editor.getByRole('checkbox',{name:'I confirmed this photo shows one garment'});",
 "  assert.equal(await reviewedDetails.isVisible(),true,'P176 category/type/color review checkbox absent');",
 "  assert.equal(await reviewedSource.isVisible(),true,'P176 single-original-garment checkbox absent');",
 '  await reviewedDetails.check();',
 '  await reviewedSource.check();',
 '  assert.equal(await reviewedDetails.isChecked(),true);',
 '  assert.equal(await reviewedSource.isChecked(),true);',
 needle
].join('\n');
for(const path of files){
 const original=await readFile(path,'utf8');
 assert.equal(original.split(needle).length,2,
  'P176 old original source consumer save action changed: '+path);
 assert.ok(original.includes("photos['commons-0002'].sha256"));
 assert.ok(original.includes('selectOption(\'Tops\')'));
 assert.ok(original.includes('selectOption(\'T-shirt\')'));
 assert.ok(original.includes("await editor.locator('input[aria-label=\"Color\"]').fill('Red');"));
 await writeFile(path,original.replace(needle,action));
}
console.log(JSON.stringify({priority:176,CIOnlyHarnessAdapted:files,
 existingMandatoryReviewPreserved:true,originalSourceSHAAndOwnerAttested:true,
 appAndPublicSourceUntouched:true,productionDeployed:false,familyAlpha:'HOLD'}));
