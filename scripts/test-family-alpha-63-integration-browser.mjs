import {readFile,writeFile,rm} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {resolve} from 'node:path';import assert from 'node:assert/strict';
let wrapper=await readFile('scripts/test-work43-full-browser.mjs','utf8');wrapper=wrapper.replace("resolve('dist-work43-photo-board-HOLD')","resolve('dist-family-alpha-63-auto-portable-HOLD')");
wrapper=wrapper.replace("const p=join('scripts','.work43-browser-generated.mjs');","if(process.env.W48_CHROMIUM_ONLY==='1')s=s.replace(\"[['Chromium',chromium],['WebKit',webkit]]\",\"[['Chromium',chromium]]\");const p=join('scripts','.work43-browser-generated.mjs');");
const marker="const p=join('scripts','.work43-browser-generated.mjs');";assert.equal(wrapper.split(marker).length,2);
const injected=String.raw`
const hook='   const first=panel.locator';assert.equal(s.split(hook).length,2);
s=s.replace(hook,String.raw\x60
   {
    const article=panel.locator('.alpha29-options article').first();
    await article.getByRole('button',{name:'Review garment fit 1',exact:true}).click();
    for(let k=0;k<3;k++){
     const editor=article.locator('.family-alpha-mask-editor');await editor.waitFor({state:'visible'});
     if(k===0){const cv=editor.locator('canvas');const initial=await cv.evaluate(c=>c.toDataURL());await cv.scrollIntoViewIfNeeded();let box=await cv.boundingBox();const tap=()=>cv.click({position:{x:box.width*.5,y:box.height*.5}});await tap();const erased=await cv.evaluate(c=>c.toDataURL());assert.notEqual(erased,initial);await editor.getByRole('button',{name:'Undo eraser',exact:true}).click();assert.equal(await cv.evaluate(c=>c.toDataURL()),initial);await editor.getByRole('button',{name:'Redo edit',exact:true}).click();assert.equal(await cv.evaluate(c=>c.toDataURL()),erased);await editor.getByLabel('Cutout refinement tool').selectOption('add');await cv.scrollIntoViewIfNeeded();box=await cv.boundingBox();await tap();assert.equal(await cv.evaluate(c=>c.toDataURL()),initial,'Add uses exact original fabric RGB');await editor.getByRole('button',{name:'Reset cutout',exact:true}).click();assert.equal(await cv.evaluate(c=>c.toDataURL()),initial);assert.equal(await editor.getByRole('checkbox',{name:'I checked the actual cutout for mannequin, person, hanger and missing fabric',exact:true}).isChecked(),false);await editor.getByLabel('Cutout refinement tool').selectOption('remove');await cv.scrollIntoViewIfNeeded();box=await cv.boundingBox();await tap();await editor.getByLabel('Cutout refinement tool').selectOption('restore');await tap();assert.equal(await cv.evaluate(c=>c.toDataURL()),initial);}
     await editor.getByRole('checkbox',{name:'I checked the actual cutout for mannequin, person, hanger and missing fabric',exact:true}).check();
     await editor.getByRole('button',{name:'Use cutout',exact:true}).click();
    }
    const fitter=article.locator('.w47-controls');await fitter.waitFor({state:'visible'});
    await fitter.getByLabel('Reviewed garment to fit').selectOption('top');
    const editorCanvas=fitter.locator('canvas');await editorCanvas.scrollIntoViewIfNeeded();
    let rect=await editorCanvas.boundingBox();
    await editorCanvas.click({position:{x:rect.width*.25,y:rect.height*.09}});
    await editorCanvas.click({position:{x:rect.width*.75,y:rect.height*.09}});
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
    const widthControl=fitter.getByLabel('Garment width / length (proportional)',{exact:true});
    await widthControl.fill('1.03');await widthControl.dispatchEvent('input');
    assert.notEqual(await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL()),baseCanvas);
    await widthControl.fill('1');await widthControl.dispatchEvent('input');
    assert.equal(await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL()),baseCanvas);
    const leftAngle=fitter.getByLabel('Left sleeve angle',{exact:true});assert.equal(await leftAngle.isDisabled(),true);
    await fitter.getByRole('button',{name:'Trace left sleeve',exact:true}).click();
    await editorCanvas.scrollIntoViewIfNeeded();rect=await editorCanvas.boundingBox();
    for(const [x,y]of [[.24,.09],[.01,.09],[.01,.35],[.24,.35]])await editorCanvas.click({position:{x:rect.width*x,y:rect.height*y}});
    await fitter.getByRole('button',{name:'Use sleeve outline',exact:true}).click();
    assert.equal(await leftAngle.isEnabled(),true,await fitter.getByRole('status').textContent());
    await leftAngle.fill('-5');await leftAngle.dispatchEvent('input');
    assert.equal(await leftAngle.inputValue(),'-5',await fitter.getByRole('status').textContent());
    assert.equal(await article.locator('[data-part="neck"]').last().getAttribute('mask')!==null,true);
    const newControls=fitter.locator('button,select,input[type="range"]');
    for(let j=0;j<await newControls.count();j++){
     const control=newControls.nth(j);if(!await control.isEnabled())continue;
     await control.scrollIntoViewIfNeeded();
     const reachable=await control.evaluate(e=>{const r=e.getBoundingClientRect(),p=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return p===e||e.contains(p);});
     assert.equal(reachable,true,'New fitting control must remain reachable above navigation');
    }

    // PR365: test a fully opaque, unisolated PNG in the actual browser
    // painter. PNG MIME does not prove that a garment background was removed.
    const unisolated=await page.evaluate(async()=>{
      const {paintGarmentFit}=await import('/__alpha_research/work47/fit.mjs');
      const raw=document.createElement('canvas');raw.width=100;raw.height=120;
      raw.getContext('2d').fillStyle='#adbbca';
      raw.getContext('2d').fillRect(0,0,raw.width,raw.height);
      const photo=new Image();photo.src=raw.toDataURL('image/png');
      await photo.decode();
      const destination=document.createElement('canvas');
      try{
       paintGarmentFit(destination,photo,{slot:'top',anchors:[[.25,.10],[.75,.10]]});
       return {blocked:false};
      }catch(e){
       return {blocked:true,reason:String(e.message||'').slice(0,130),destWidth:destination.width};
      }
    });
    assert.ok(unisolated.blocked&&/Cutout is opaque or rectangular/.test(unisolated.reason),
      'An unisolated fully opaque PNG must be rejected in the protected app');
    // PR364: inject a real browser drawImage exception AFTER partially drawing
    // to the staged canvas; the last accepted Work48 geometry stays intact.
    const savedCanvas=article.locator('canvas[data-work47="top"]');
    const beforeFailure=await savedCanvas.evaluate(c=>{c.dataset.alpha58Original='yes';return c.toDataURL();});
    await page.evaluate(()=>{
      const native=CanvasRenderingContext2D.prototype.drawImage;
      window.__alpha58Restore=()=>{CanvasRenderingContext2D.prototype.drawImage=native;delete window.__alpha58Restore;};
      let injected=false;
      CanvasRenderingContext2D.prototype.drawImage=function(...args){
        const ret=native.apply(this,args);
        if(!injected&&this.canvas.dataset.work47==='top'){
          injected=true;throw Error('SYNTHETIC_PARTIALLY_DRAWN_GARMENT');
        }
        return ret;
      };
    });
    try{
      await fitter.getByRole('button',{name:'↓ Down',exact:true}).click();
      assert.match(await fitter.getByRole('status').textContent(),/Preview unchanged/);
      assert.equal(await article.locator('canvas[data-work47="top"]').evaluate(c=>c.toDataURL()),beforeFailure,
        'A staged failure must not replace visible Work48 garment pixels');
      assert.equal(await article.locator('canvas[data-work47="top"]').getAttribute('data-alpha58-original'),'yes',
        'A staged failure must preserve the previously connected canvas ELEMENT');
      assert.equal(await article.locator('svg[data-humanoid-overlay]').count(),1,
        'Existing foreground anatomy cannot vanish after failed sleeve redraw');
    }finally{await page.evaluate(()=>window.__alpha58Restore?.());}
    const source=await article.locator('img[data-slot="top"]').getAttribute('src');
    assert.equal(await article.locator('img[data-slot="top"]').evaluate(x=>x.hidden),true);
    await fitter.getByRole('button',{name:'↓ Down',exact:true}).click();
    assert.equal(await article.locator('img[data-slot="top"]').getAttribute('src'),source);
    await mkdir('benchmark/work47/integration',{recursive:true});await article.screenshot({path:'benchmark/work47/integration/'+name.toLowerCase()+'-'+width+'-fitted.png'});
    await fitter.getByRole('button',{name:'Reset landmark fit',exact:true}).click();
    assert.equal(await article.locator('canvas[data-work47]').count(),0);
    assert.equal(await article.locator('svg[data-humanoid-overlay]').count(),0,'No foreground overlay after fit reset');
    assert.equal(await article.locator('img[data-slot="top"]').getAttribute('src'),source);
    await editorCanvas.scrollIntoViewIfNeeded();rect=await editorCanvas.boundingBox();
    await editorCanvas.click({position:{x:rect.width*.25,y:rect.height*.09}});
    await editorCanvas.click({position:{x:rect.width*.75,y:rect.height*.09}});
    await fitter.getByRole('button',{name:'Apply landmark fit',exact:true}).click();
    assert.equal(await article.locator('canvas[data-work47]').count(),1);
   }
\x60+hook);
s=s.replace("await first.getByRole('button',{name:'Swap shoes in outfit 1',exact:true}).click();","await first.getByRole('button',{name:'Swap shoes in outfit 1',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#alpha29NewClothes .w47-controls'));");
s=s.replace("textContent.includes('Clothes or account changed')", "textContent.includes('Could not complete this step')");
`;
wrapper=wrapper.replace(marker,injected.replaceAll('\\x60','`')+'\n'+marker);const p='scripts/.work49-integration.mjs';try{await writeFile(p,wrapper);const r=spawnSync(process.execPath,[resolve(p)],{stdio:'inherit',timeout:600000,env:{...process.env,CLOSET_35_OFFLINE:'1',WORK43_LICENSED:'0'}});if(r.error)throw r.error;assert.equal(r.status,0);}finally{await rm(p,{force:true});}
