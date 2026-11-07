import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,normalize} from 'node:path';
import {chromium,webkit} from 'playwright';
import axe from 'axe-core';

const root=resolve('public'),out=resolve(process.env.ARTIFACT_DIR||'artifacts/family-alpha-mobile-ux-132');
await import('node:fs/promises').then(({mkdir})=>mkdir(out,{recursive:true}));
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path==='/')path='/index.html';const file=resolve(root,'.'+normalize(path));if(!file.startsWith(root))throw Error('bad path');const body=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end('not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port,failures=[],results=[];
const fixtureImage='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300"><rect width="240" height="300" fill="#8d6bb0"/><path d="M50 35h140l35 70-35 25v130H50V130l-35-25z" fill="#d8c5ec"/></svg>');
const wardrobe=[
 {id:'family-top-a',name:'Lilac T-shirt',category:'Tops',itemType:'T-shirt',color:'Lilac',pattern:'Solid',seasons:['All seasons'],image:fixtureImage,savedAt:'2026-11-07T06:00:00Z'},
 {id:'family-top-b',name:'Blue blouse',category:'Tops',itemType:'Blouse',color:'Blue',pattern:'Solid',seasons:['All seasons'],image:fixtureImage,savedAt:'2026-11-07T06:01:00Z'},
 {id:'family-bottom-a',name:'Dark jeans',category:'Bottoms',itemType:'Jeans',color:'Blue',pattern:'Solid',seasons:['All seasons'],image:fixtureImage,savedAt:'2026-11-07T06:02:00Z'},
 {id:'family-bottom-b',name:'Black pants',category:'Bottoms',itemType:'Trousers',color:'Black',pattern:'Solid',seasons:['All seasons'],image:fixtureImage,savedAt:'2026-11-07T06:03:00Z'},
 {id:'family-shoes',name:'White sneakers',category:'Shoes',itemType:'Sneakers',color:'White',pattern:'Solid',seasons:['All seasons'],image:fixtureImage,savedAt:'2026-11-07T06:04:00Z'}
];
async function audit(page,label){
 if(!await page.evaluate(()=>Boolean(window.axe)))await page.addScriptTag({content:axe.source});
 const report=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
 await import('node:fs/promises').then(({writeFile})=>writeFile(resolve(out,label.replace(/[^a-z0-9-]/gi,'-')+'-axe.json'),JSON.stringify({violations:report.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))},null,2)));
 assert.equal(report.violations.length,0,label+' axe violations: '+report.violations.map(v=>v.id).join(', '));
}
async function open(browser,width,height){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/auth.js',route=>route.fulfill({contentType:'text/javascript',body:"window.closetAuth={user:{id:'family-alpha-mobile-ux-fixture'},ready:Promise.resolve(),assertCurrent(){return true}};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 await page.route('**/raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json*',route=>route.fulfill({path:resolve('public/trend-data.json'),contentType:'application/json'}));
 await page.goto(base);await page.evaluate(()=>closetReady);await page.evaluate(()=>outfitBoardReady);
 return {context,page,errors};
}
async function screenshot(page,name){await page.screenshot({path:resolve(out,name+'.png'),fullPage:true});}
try{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  let browser;try{browser=await engine.launch({headless:true});}catch(e){failures.push({engine:engineName,error:'Browser launch unavailable: '+e.message});continue;}
  try{
   for(const width of [320,390,430]){
    const {context,page,errors,setTrendOffline}=await open(browser,width,844),tag=engineName+'-'+width;
    const checkLayout=async label=>{
     const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,main:document.querySelector('main').scrollWidth,nav:[...document.querySelectorAll('.main-nav>*')].filter(el=>getComputedStyle(el).display!=='none').map(el=>({h:Math.round(el.getBoundingClientRect().height),w:Math.round(el.getBoundingClientRect().width)}))}));
     assert.ok(dims.scroll<=dims.width,label+' horizontal overflow '+JSON.stringify(dims));assert.ok(dims.nav.every(x=>x.h>=44),label+' navigation target <44px');
     return dims;
    };
    await checkLayout(tag+' home');
    assert.equal(await page.locator('.main-nav').getByRole('button',{name:'My Closet',exact:true}).count(),1);
    assert.equal(await page.locator('.main-nav').getByRole('button',{name:'Add Clothes',exact:true}).count(),1);
    assert.equal(await page.locator('.main-nav').getByRole('button',{name:'Style My New Clothes',exact:true}).count(),1);
    await audit(page,tag+'-home');await screenshot(page,tag+'-home');
    await page.keyboard.press('Tab');const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineStyle,width:getComputedStyle(document.activeElement).outlineWidth}));
    assert.notEqual(focus.outline,'none',tag+' keyboard focus indicator missing');
    await page.locator('.main-nav').getByRole('button',{name:'My Closet',exact:true}).click();await checkLayout(tag+' closet');await screenshot(page,tag+'-closet-empty');
    assert.match(await page.locator('#closetCategories').innerText(),/Shirts|Dresses|Shoes|Your/);
    await page.locator('.main-nav').getByRole('button',{name:'Add Clothes',exact:true}).click();await page.getByRole('heading',{name:'Add clothes'}).waitFor();await screenshot(page,tag+'-camera');
    if(width===320){
     await context.grantPermissions([], {origin:base});
     await page.getByRole('button',{name:'Take photos',exact:true}).click();
     await page.waitForFunction(()=>/permission|could not|camera|device not found/i.test(document.querySelector('#message').textContent),null,{timeout:10000});
     await audit(page,tag+'-camera-denied');await screenshot(page,tag+'-camera-denied');

    }
    await page.locator('.main-nav').getByRole('button',{name:'Style My New Clothes',exact:true}).click();
    await page.getByRole('button',{name:'Create my outfits',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('#stylistStatus').textContent.startsWith('Matching your clothes'),null,{timeout:20000});
    assert.match(await page.locator('#stylistStatus').innerText(),/Add clothing photos|No suitable combination/);

    await audit(page,tag+'-style-empty');await screenshot(page,tag+'-style-empty');
    if(width!==320){
     await page.evaluate(async rows=>{await writeAll(rows);items=rows.map(normalizeClothing);render();renderHomePieces();},wardrobe);await page.locator('.main-nav').getByRole('button',{name:'My Closet',exact:true}).click();await checkLayout(tag+' closet filled');await audit(page,tag+'-closet-filled');await screenshot(page,tag+'-closet-filled');await page.locator('.main-nav').getByRole('button',{name:'Style My New Clothes',exact:true}).click();
     await page.getByRole('button',{name:'Create my outfits',exact:true}).click();
     await page.waitForFunction(()=>document.querySelectorAll('#styledCollectionResults .styled-outfit').length===3,null,{timeout:20000});
     await audit(page,tag+'-recommendations');await screenshot(page,tag+'-recommendations');
     await page.locator('#styledCollectionResults .styled-outfit').first().getByRole('button',{name:'Save outfit'}).click();
     await page.locator('#styledCollectionResults .styled-outfit').first().getByText(/Saved\. Find it/).waitFor();
     await page.locator('#moreMenu>summary').click();await page.locator('#moreMenu [data-view="builder"]').click();
     await page.evaluate(()=>outfitBoardReady);await page.locator('#boardSlots .board-slot-top').click();
     const beforeBottom=await page.locator('#boardSlots .board-slot-bottom').getAttribute('aria-label');
     await page.locator('#boardPickerItems .board-pick').nth(1).click();
     const afterBottom=await page.locator('#boardSlots .board-slot-bottom').getAttribute('aria-label');assert.equal(afterBottom,beforeBottom,'Replacing top cleared other outfit selections');
     await page.getByRole('button',{name:'Save outfit',exact:true}).last().click();
     await page.waitForFunction(()=>/Outfit saved/.test(document.querySelector('#boardSaveStatus').textContent));
     await page.locator('#savedBoards button').first().click();await screenshot(page,tag+'-saved-outfit');await audit(page,tag+'-saved-outfit');
     const portrait=await checkLayout(tag+' saved');await page.setViewportSize({width:844,height:390});await checkLayout(tag+' landscape');await page.setViewportSize({width,height:844});
     await page.locator('#moreMenu>summary').click();await page.locator('#moreMenu [data-view="review"]').click();await screenshot(page,tag+'-review');
     results.push({engine:engineName,width,portrait:true,landscape:true,syntheticThreeOutfits:true,swapPreservesOtherSelections:true,savedAndReopened:true,navTargets:portrait.nav,errors});
    }else results.push({engine:engineName,width,portrait:true,permissionDenied:true,navTargets:(await checkLayout(tag+' end')).nav,errors});
    assert.deepEqual(errors,[],tag+' uncaught page errors');await context.close();
   }
  }finally{await browser.close();}
 }
 const summary={baseline:'P130 5ce8f51ebbf65d275197a21bdaa7818801b4b49b',familyAlpha:'HOLD',backend:'synthetic local IndexedDB fixture; no live account/cloud requests',physicalDevices:'not tested',engines:results,failures};
 await import('node:fs/promises').then(({writeFile})=>writeFile(resolve(out,'results.json'),JSON.stringify(summary,null,2)));
 console.log(JSON.stringify(summary,null,2));if(process.env.REQUIRE_WEBKIT==='1')assert.equal(failures.length,0,'Required browser engines must launch');assert.ok(results.length>0,'At least one browser engine must complete');if(process.env.REQUIRE_WEBKIT==='1')assert.equal(results.length,6,'Expected complete Chromium and WebKit viewport matrices');
}finally{await new Promise(resolve=>server.close(resolve));}
