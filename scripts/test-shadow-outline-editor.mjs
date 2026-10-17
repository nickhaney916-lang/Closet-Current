import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({acceptDownloads:true});
 await page.goto(pathToFileURL(resolve('benchmark/annotate-shadow-polygons.html')).href);
 await page.locator('#photo').setInputFiles('benchmark/photos/commons-0035.jpg');
 await page.locator('#id').selectOption('commons-0035');
 await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Image loaded')||document.querySelector('#notice').textContent.includes('Cannot load'),{timeout:10000});
 const loaded=await page.locator('#notice').textContent();
 if(!loaded.includes('Image loaded'))throw Error('Image load failed: '+loaded);
 const box=await page.locator('#view').boundingBox();
 if(!box)throw Error('Editor canvas absent');
 const point=async(x,y)=>{await page.locator('#view').dispatchEvent('pointerdown',{clientX:box.x+box.width*x,clientY:box.y+box.height*y});};
 for(const [x,y] of [[.2,.2],[.7,.2],[.5,.7]])await point(x,y);
 await page.locator('#close').click();
 await page.locator('#kind').selectOption('shadow');
 for(const [x,y] of [[.15,.78],[.8,.78],[.55,.93]])await point(x,y);
 await page.locator('#close').click();
 if(!await page.locator('#export').isEnabled())throw Error('Draft export not enabled');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
 const file=await download.path();const draft=JSON.parse(await readFile(file,'utf8'));
 const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
 const match=manifest.cases.find(x=>x.id==='commons-0035');
 if(draft.reviewStatus!=='draft'||draft.sourceSha256!==match.sourceSha256||draft.regions.garment[0].length!==3||draft.regions.shadow[0].length!==3)throw Error('Draft schema/checksum mismatch');
 console.log('OUTLINE_EDITOR_SMOKE '+JSON.stringify({draftStatus:draft.reviewStatus,garmentPolygons:draft.regions.garment.length,shadowPolygons:draft.regions.shadow.length,checksumMatched:true}));
}finally{await browser.close();}
