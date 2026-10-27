// Run the entire VERIFIED Work #34 compiled wardrobe/styling/storage browser
// regression against the new local-only visual-repair output, with explicit
// simulated human taps for mask cleanup. No real personal photos/accounts.
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
const source='scripts/test-family-alpha-34-browser.mjs';
let s=await readFile(source,'utf8');
function replaceOnce(a,b){
 assert.equal(s.split(a).length,2,'Upstream full-journey browser contract changed: '+a.slice(0,65));
 s=s.replace(a,b);
}
replaceOnce("resolve('dist-family-alpha-34-storage-HOLD')","resolve('dist-family-alpha-36-rigid-align-HOLD')");
replaceOnce("for(let piece=0;piece<3;piece++){await article.getByRole('button',{name:'Use cutout',exact:true}).click();}",
 `for(let piece=0;piece<3;piece++){
      const cleanup=article.locator('.family-alpha-mask-editor');
      await cleanup.waitFor({state:'visible'});
      const verify=cleanup.getByRole('checkbox',{
       name:'I checked the actual cutout for mannequin, person, hanger and missing fabric',exact:true
      });
      if(i===0&&piece===0){
       // On first synthetic photo, exercise REAL user pointer erase & undo
       // before final deliberate approval. Nothing auto-removes mannequin.
       const board=cleanup.locator('canvas');
       await board.click({position:{x:35,y:35}});
       await cleanup.getByRole('button',{name:'Undo eraser',exact:true}).click();
       await board.click({position:{x:65,y:70}});
       // The user can also trace a contiguous mannequin-like region
       // along an inside collar rather than making uncontrolled brush holes.
       await cleanup.getByRole('button',{name:'Outline unwanted area',exact:true}).click();
       for(const pos of [{x:46,y:28},{x:75,y:28},{x:73,y:55},{x:49,y:55}])
        await board.click({position:pos});
       await cleanup.getByRole('button',{name:'Apply outline',exact:true}).click();
       assert.match(await cleanup.locator('[role="status"]').innerText(),/manual erase areas/);
      }
      await verify.check();
      await cleanup.getByRole('button',{name:'Use cutout',exact:true}).click();
     }`);
replaceOnce("assert.equal(await article.locator('.family-alpha-avatar img').count(),3);",
 `assert.equal(await article.locator('.family-alpha-avatar img').count(),3);
     const fitter=article.locator('.alpha36-fit-controls');
     await fitter.waitFor({state:'visible'});
     await fitter.getByLabel('Garment to align').selectOption('top');
     const before=await article.locator('.family-alpha-avatar img[data-slot="top"]').evaluate(img=>({
      left:img.style.left,top:img.style.top,w:img.getBoundingClientRect().width,
      h:img.getBoundingClientRect().height,src:img.src
     }));
     await fitter.getByRole('button',{name:'↑ Up'}).click();
     await fitter.getByRole('button',{name:'+ Larger'}).click();
     const changed=await article.locator('.family-alpha-avatar img[data-slot="top"]').evaluate(img=>({
      left:img.style.left,top:img.style.top,w:img.getBoundingClientRect().width,
      h:img.getBoundingClientRect().height,src:img.src
     }));
     assert.notEqual(changed.top,before.top);
     assert.ok(changed.w>before.w);
     assert.ok(Math.abs(changed.w/changed.h-before.w/before.h)<.001,
      'Rigid fit cannot stretch photo');
     assert.equal(changed.src,before.src,'Photo pixels or source changed');
     await fitter.getByRole('button',{name:'Reset'}).click();
     assert.equal(await article.locator('.family-alpha-avatar img[data-slot="top"]').evaluate(img=>img.style.top),before.top);
     await fitter.getByLabel('Garment to align').selectOption('bottom');
     await fitter.getByRole('button',{name:'↑ Up'}).click();
     assert.match(await fitter.locator('[role="status"]').innerText(),/preview only/);
     const footwearReference=article.locator('.family-alpha-avatar img[data-slot="shoes"]');`);

 `assert.equal(await article.locator('.family-alpha-avatar img').count(),3);
     assert.equal(await footwearReference.count(),1);
     assert.equal(await footwearReference.getAttribute('data-display-mode'),
      'footwear-photo-reference','Never make a single or unverified shoe appear worn by two feet');
     assert.match(await footwearReference.getAttribute('alt'),/reference photograph/);
     const footwearNote=article.locator('.family-alpha-avatar [data-footwear-note="reference-not-worn"]');
     assert.equal(await footwearNote.count(),1,'Single-source footwear needs a visible not-worn caption');
     assert.match(await footwearNote.innerText(),/not worn/);`);
replaceOnce("'benchmark/family-alpha-34/'","'benchmark/family-alpha-35/'");
// Screenshot directory was already replaced above in every path occurrence.
const generated=join('scripts','.family-alpha-35-review-browser.generated.mjs');
try{
 await writeFile(generated,s);
 const p=spawnSync(process.execPath,[resolve(generated)],{stdio:'inherit',
  env:{...process.env,CLOSET_35_OFFLINE:'1'},timeout:240000,maxBuffer:8e6});
 if(p.error)throw p.error;
 if(p.status!==0)throw Error('Compiled synthetic browser full-journey FAIL '+p.status);
 console.log('FAMILY_ALPHA_35_COMPILED_BROWSER_PASS — mock originals, human eraser, reference footwear, outfit swap and atomic save');
}finally{await rm(generated,{force:true});}
