import {readFile,writeFile,rm} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {resolve} from 'node:path';import assert from 'node:assert/strict';
let wrapper=await readFile('scripts/test-work43-full-browser.mjs','utf8');wrapper=wrapper.replace("resolve('dist-work43-photo-board-HOLD')","resolve('dist-work47-garment-fit-HOLD')");
const marker="const p=join('scripts','.work43-browser-generated.mjs');";assert.equal(wrapper.split(marker).length,2);
const injected=String.raw`
const hook='   const first=panel.locator';assert.equal(s.split(hook).length,2);
s=s.replace(hook,String.raw\x60
   {
    const article=panel.locator('.alpha29-options article').first();
    await article.getByRole('button',{name:'Review garment fit 1',exact:true}).click();
    for(let k=0;k<3;k++){
     const editor=article.locator('.family-alpha-mask-editor');await editor.waitFor({state:'visible'});
     await editor.getByRole('checkbox',{name:'I checked the actual cutout for mannequin, person, hanger and missing fabric',exact:true}).check();
     await editor.getByRole('button',{name:'Use cutout',exact:true}).click();
    }
    const fitter=article.locator('.w47-controls');await fitter.waitFor({state:'visible'});
    await fitter.getByLabel('Reviewed garment to fit').selectOption('top');
    const editorCanvas=fitter.locator('canvas');await editorCanvas.scrollIntoViewIfNeeded();
    let rect=await editorCanvas.boundingBox();
    await editorCanvas.click({position:{x:rect.width*.25,y:rect.height*.2}});
    await editorCanvas.click({position:{x:rect.width*.75,y:rect.height*.2}});
    await fitter.getByRole('button',{name:'Apply landmark fit',exact:true}).click();
    await article.locator('canvas[data-work47="top"]').waitFor();
    const anatomy=article.locator('svg[data-humanoid-overlay="reviewed-anatomy-v1"]');
    await anatomy.waitFor({state:'attached'});
    const anatomyParts=await anatomy.locator('[data-part]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-part')));
    for(const required of ['neck','left-ear','right-ear','head','left-hand','right-hand','left-fingers','right-fingers'])
     assert.ok(anatomyParts.includes(required),'Missing refined real anatomy '+required);
    for(const covered of ['torso','left-arm','right-arm','left-leg','right-leg','left-foot','right-foot'])
     assert.ok(!anatomyParts.includes(covered),'Covered humanoid body must stay behind garment '+covered);
    assert.equal(await article.locator('.family-alpha-avatar svg[data-humanoid="articulated-2d-v1"]').count(),1,
      'Existing humanoid remains behind real photographed clothing');
    const edgeToggle=fitter.getByRole('checkbox',{name:/Soften translucent cutout halo/});
    assert.equal(await edgeToggle.isEnabled(),true);
    assert.equal(await edgeToggle.isChecked(),false,'Unreviewed edge cleanup must default OFF');
    const baseCanvas=await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL());
    await edgeToggle.check();
    assert.equal(await edgeToggle.isChecked(),true,'Explicit toggle must remain checked');
    const cleanupStatus=await fitter.getByRole('status').textContent();
    assert.match(cleanupStatus,/Fringe attenuated|No translucent border detected/);
    await edgeToggle.uncheck();
    assert.equal(await edgeToggle.isChecked(),false);
    assert.equal(await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL()),baseCanvas,
      'Returning to OFF must restore exact original garment fit pixels');
    const source=await article.locator('img[data-slot="top"]').getAttribute('src');
    assert.equal(await article.locator('img[data-slot="top"]').evaluate(x=>x.hidden),true);
    // Prove a REAL browser canvas failure after partial draw never replaces
    // the current real garment-on-avatar canvas or leaks the source image.
    const beforeDrawFailure=await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL());
    const preFailureElement=await article.locator('canvas[data-work47="top"]').evaluate(c=>{
     c.dataset.alpha56Original='yes';return true;
    });
    await page.evaluate(()=>{
     const original=CanvasRenderingContext2D.prototype.drawImage;
     window.__alpha56Restore=()=>{CanvasRenderingContext2D.prototype.drawImage=original;delete window.__alpha56Restore;};
     let thrown=false;
     CanvasRenderingContext2D.prototype.drawImage=function(...args){
      const result=original.apply(this,args);
      if(!thrown&&this.canvas.dataset.work47==='top'){
       thrown=true;throw Error('SIMULATED_PARTIAL_GARMENT_RENDER_FAILURE');
      }
      return result;
     };
    });
    try{
     await fitter.getByRole('button',{name:'↓ Down',exact:true}).click();
     assert.match(await fitter.getByRole('status').textContent(),/Preview unchanged/);
     assert.equal(await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL()),beforeDrawFailure,
       'A partial failed redraw must not erase previously rendered real clothing');
     assert.equal(await article.locator('canvas[data-work47="top"]').getAttribute('data-alpha56-original'),'yes',
       'The prior canvas ELEMENT must survive failure, not just be redrawn after');
     assert.equal(await article.locator('img[data-slot="top"]').getAttribute('src'),source,
       'Private reviewed photo source must not change under failed redraw');
     assert.equal(await article.locator('svg[data-humanoid-overlay]').count(),1,
       'Previously selected genuine humanoid foreground stays visible');
    }finally{
     await page.evaluate(()=>window.__alpha56Restore?.());
    }
    await fitter.getByRole('button',{name:'↓ Down',exact:true}).click();
    assert.equal(await article.locator('img[data-slot="top"]').getAttribute('src'),source);
    await mkdir('benchmark/work47/integration',{recursive:true});await article.screenshot({path:'benchmark/work47/integration/'+name.toLowerCase()+'-'+width+'-fitted.png'});
    await fitter.getByRole('button',{name:'Reset landmark fit',exact:true}).click();
    assert.equal(await article.locator('canvas[data-work47]').count(),0);
    assert.equal(await article.locator('svg[data-humanoid-overlay]').count(),0,'No foreground overlay after fit reset');
    assert.equal(await article.locator('img[data-slot="top"]').getAttribute('src'),source);
   }
\x60+hook);
s=s.replace("textContent.includes('Clothes or account changed')", "textContent.includes('Could not complete this step')");
`;
wrapper=wrapper.replace(marker,injected.replaceAll('\\x60','`')+'\n'+marker);const p='scripts/.work47-integration.mjs';try{await writeFile(p,wrapper);const r=spawnSync(process.execPath,[resolve(p)],{stdio:'inherit',timeout:600000,env:{...process.env,CLOSET_35_OFFLINE:'1',WORK43_LICENSED:'0'}});if(r.error)throw r.error;assert.equal(r.status,0);}finally{await rm(p,{force:true});}
