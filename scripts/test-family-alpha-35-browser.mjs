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
replaceOnce("resolve('dist-family-alpha-34-storage-HOLD')","resolve('dist-family-alpha-35-visual-repair-HOLD')");
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
      }
      await verify.check();
      await cleanup.getByRole('button',{name:'Use cutout',exact:true}).click();
     }`);
replaceOnce("assert.equal(await article.locator('.family-alpha-avatar img').count(),3);",
 `assert.equal(await article.locator('.family-alpha-avatar img').count(),3);
     const footwearReference=article.locator('.family-alpha-avatar img[data-slot="shoes"]');
     assert.equal(await footwearReference.count(),1);
     assert.equal(await footwearReference.getAttribute('data-display-mode'),
      'footwear-photo-reference','Never make a single or unverified shoe appear worn by two feet');
     assert.match(await footwearReference.getAttribute('alt'),/reference photograph/);`);
replaceOnce("'benchmark/family-alpha-34/'","'benchmark/family-alpha-35/'");
replaceOnce("await mkdir('benchmark/family-alpha-34'","await mkdir('benchmark/family-alpha-35'");
const generated=join('scripts','.family-alpha-35-review-browser.generated.mjs');
try{
 await writeFile(generated,s);
 const p=spawnSync(process.execPath,[resolve(generated)],{stdio:'inherit',
  env:{...process.env,CLOSET_35_OFFLINE:'1'},timeout:240000,maxBuffer:8e6});
 if(p.error)throw p.error;
 if(p.status!==0)throw Error('Compiled synthetic browser full-journey FAIL '+p.status);
 console.log('FAMILY_ALPHA_35_COMPILED_BROWSER_PASS — mock originals, human eraser, reference footwear, outfit swap and atomic save');
}finally{await rm(generated,{force:true});}
