/** Reuse exact #74 full protected Work54 journey against #75 fit-pack overlay. */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
async function packBrowserSnippet(){
 const fitterPack=fitter.getByRole('button',{name:'Download all reviewed outfit fits',exact:true});
 const beforePack=await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL());
 const downloadPackEvent=page.waitForEvent('download');
 await fitterPack.click();
 const downloadedPack=await downloadPackEvent;
 assert.equal(downloadedPack.suggestedFilename(),'closet-current-all-outfit-fits.json');
 const packText=await readFile(await downloadedPack.path(),'utf8');
 const packData=JSON.parse(packText);
 assert.equal(packData.decision,'HOLD');assert.equal(packData.ownerApproved,false);
 assert.equal(packData.automaticallySaved,false);
 assert.equal(packData.recipes.length,1);
 assert.doesNotMatch(packText,/data:image|password|accessToken|accountId|email/i);
 const packWidth=fitter.getByLabel('Garment width / length (proportional)',{exact:true});
 await packWidth.fill('1.06');await packWidth.dispatchEvent('input');
 assert.notEqual(await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL()),beforePack);
 const packInput=fitter.getByLabel('Restore all reviewed outfit fits JSON',{exact:true});
 await packInput.setInputFiles({name:'outfit-pack.json',mimeType:'application/json',buffer:Buffer.from(packText)});
 await page.waitForFunction(()=>document.querySelector('.w47-controls [role="status"]')?.textContent.includes('All fit geometry restored'));
 assert.equal(await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL()),beforePack,'Exact outfit cutout pixels restored');
 const fakePack={...packData,ownerApproved:true};
 await packInput.setInputFiles({name:'forged-pack.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fakePack))});
 await page.waitForFunction(()=>document.querySelector('.w47-controls [role="status"]')?.textContent.includes('pack invalid'));
 assert.equal(await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL()),beforePack,'Forged outfit pack did not alter preview');
}
let source=await readFile('scripts/test-work54-integration-browser.mjs','utf8');
const anchor="     const widthControl=fitter.getByLabel('Garment width / length (proportional)',{exact:true});";
assert.equal(source.split(anchor).length,2,'Work54 protected browser anchor changed');
const snippet=packBrowserSnippet.toString().replace(/^async function packBrowserSnippet\(\)\s*\{/,'').replace(/\}\s*$/,'');
source=source.replace(anchor,snippet+'\n'+anchor);
let wrapper=await readFile('scripts/test-family-alpha-74-work54-integrated-browser.mjs','utf8');
const previous="const source=await readFile('scripts/test-work54-integration-browser.mjs','utf8');";
const target="const replacement=\"resolve('dist-family-alpha-74-work54-phone-HOLD')\";";
assert.equal(wrapper.split(previous).length,2,'Verified source runner changed');
assert.equal(wrapper.split(target).length,2,'Verified compiled target changed');
wrapper=wrapper.replace(previous,'const source='+JSON.stringify(source)+';')
 .replace(target,"const replacement=\"resolve('dist-family-alpha-75-outfit-fit-pack-HOLD')\";")
 .replace("scripts/.family-alpha-74-work54-integrated-generated.mjs","scripts/.family-alpha-75-work54-pack-generated.mjs")
 .replace("FAMILY_ALPHA_74_WORK54_PROTECTED_INTEGRATION_PASS","FAMILY_ALPHA_75_OUTFIT_PACK_PROTECTED_INTEGRATION_PASS");
const filename='scripts/.family-alpha-75-fit-pack-wrapper.mjs';
await writeFile(filename,wrapper);
try{
 const result=spawnSync(process.execPath,[resolve(filename)],{
  encoding:'utf8',timeout:700000,env:{...process.env,W48_CHROMIUM_ONLY:'1'}
 });
 if(result.stdout)process.stdout.write(result.stdout);
 if(result.stderr)process.stderr.write(result.stderr);
 if(result.error)throw result.error;
 assert.equal(result.status,0,'Full protected main app outfit pack restore/fit/privacy browser must pass');
 console.log('FAMILY_ALPHA_75_OUTFIT_FIT_PACK_BROWSER_PASS');
}finally{await rm(filename,{force:true});}
