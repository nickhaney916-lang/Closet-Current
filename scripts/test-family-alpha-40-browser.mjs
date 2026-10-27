/** Extend fully verified #36 real compiled browser workflow with session fit reuse.
 * Synthetic photographs and mocked Auth only, NO real user photos or services.
 */
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
let s=await readFile('scripts/test-family-alpha-36-browser.mjs','utf8');
function change(a,b){
 assert.equal(s.split(a).length,2,'Upstream browser protocol drift '+a.slice(0,80));
 s=s.replace(a,b);
}
const widthField="top:img.style.top,w:img.getBoundingClientRect().width,";
assert.equal(s.split(widthField).length,3,'Both source and edited PNG geometry snapshots required');
s=s.replaceAll(widthField,"top:img.style.top,cssWidth:img.style.width,w:img.getBoundingClientRect().width,");
change("resolve('dist-family-alpha-36-rigid-align-HOLD')",
 "resolve('dist-family-alpha-40-session-fit-HOLD')");
const inserted=`     if(i===1){
      // Second approval of the very same garment source and deliberately
      // repeated alpha eraser strokes must restore the top position.
      const expectedTop=changed.top,expectedWidth=changed.cssWidth;
      await article.getByRole('button',{name:'Review 2D preview 2',exact:true}).click();
      for(let piece=0;piece<3;piece++){
       const cleanup=article.locator('.family-alpha-mask-editor');
       await cleanup.waitFor({state:'visible'});
       await cleanup.getByRole('checkbox',{
        name:'I checked the actual cutout for mannequin, person, hanger and missing fabric',exact:true
       }).check();
       await cleanup.getByRole('button',{name:'Use cutout',exact:true}).click();
      }
      await fitter.waitFor({state:'visible'});
      const returned=await article.locator('.family-alpha-avatar img[data-slot="top"]').evaluate(img=>({
       top:img.style.top,cssWidth:img.style.width,w:img.getBoundingClientRect().width,src:img.src
      }));
      assert.equal(returned.src,changed.src,'Cannot alter garment PNG to restore geometry');
      assert.equal(returned.top,expectedTop,
       'Same-owner/same-JPEG/mask fit alignment must restore after rerender');
      assert.equal(returned.cssWidth,expectedWidth,
       'Restored garment percentage width must be identical regardless of engine layout');

      assert.equal(await article.locator('.alpha36-fit-controls').count(),1);
     }
`;
change("     await fitter.getByRole('button',{name:'Reset'}).click();",
 inserted+"     await fitter.getByRole('button',{name:'Reset'}).click();");
change("'benchmark/family-alpha-36/'","'benchmark/family-alpha-40/'");
change("'.family-alpha-36-review-browser.generated.mjs'",
 "'.family-alpha-40-review-browser.generated.mjs'");
change("FAMILY_ALPHA_36_COMPILED_BROWSER_PASS","FAMILY_ALPHA_40_COMPILED_BROWSER_PASS");
const p=join('scripts','.family-alpha-40-review-browser.generated.mjs');
try{
 await writeFile(p,s);
 const run=spawnSync(process.execPath,[resolve(p)],{stdio:'inherit',
  env:{...process.env,CLOSET_35_OFFLINE:'1'},timeout:240000,maxBuffer:8e6});
 if(run.error)throw run.error;
 if(run.status!==0)throw Error('Current-owner rereview outfit flow failed '+run.status);
 console.log('FAMILY_ALPHA_40_SESSION_FIT_BROWSER_PASS — source-verified active-session rerender');
}finally{await rm(p,{force:true});}
