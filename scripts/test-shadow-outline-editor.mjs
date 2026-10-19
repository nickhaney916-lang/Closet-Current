import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({acceptDownloads:true});
 await page.goto(pathToFileURL(resolve('benchmark/annotate-shadow-polygons.html')).href);
 const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
 for(const match of manifest.cases){
  await page.locator('#photo').setInputFiles('benchmark/photos/'+match.image);
  await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Image loaded')||document.querySelector('#notice').textContent.includes('Cannot load'));
  const loaded=await page.locator('#notice').textContent();
  if(!loaded.includes('Image loaded'))throw Error(match.id+' image load failed: '+loaded);
  await page.locator('#id').selectOption(match.id);
  const box=await page.locator('#view').boundingBox();
  if(!box)throw Error(match.id+' editor canvas absent');
  const point=async(x,y)=>page.locator('#view').dispatchEvent('pointerdown',{clientX:box.x+box.width*x,clientY:box.y+box.height*y});
  await page.locator('#kind').selectOption('garment');
  for(const [x,y] of [[.2,.2],[.7,.2],[.5,.7]])await point(x,y);
  await page.locator('#close').click();
  await page.locator('#kind').selectOption('shadow');
  for(const [x,y] of [[.15,.78],[.8,.78],[.55,.93]])await point(x,y);
  await page.locator('#close').click();
  if(!await page.locator('#export').isEnabled())throw Error(match.id+' export disabled');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  const draft=JSON.parse(await readFile(await download.path(),'utf8'));
  if(draft.reviewStatus!=='draft'||draft.sourceSha256!==match.sourceSha256||draft.imageId!==match.id||draft.regions.garment[0].length!==3||draft.regions.shadow[0].length!==3)throw Error(match.id+' draft schema/checksum mismatch');
  console.log('OUTLINE_EDITOR_SMOKE '+JSON.stringify({id:match.id,draftStatus:draft.reviewStatus,checksumMatched:true}));
 }
}finally{await browser.close();}
