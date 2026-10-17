import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+resolve('benchmark/annotate-garment.html'));
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=40;c.height=30;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,40,30);x.fillStyle='red';x.fillRect(10,4,20,20);return c.toDataURL('image/png').split(',')[1];});
 await page.locator('#photo').setInputFiles({name:'review-case.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.locator('#status').getByText(/initial mask is blank/).waitFor();
 await assert.doesNotReject(async()=>await page.locator('#canvas').waitFor({state:'visible'}));
 await page.locator('#reviewer').fill('First Reviewer');
 await page.locator('#canvas').scrollIntoViewIfNeeded();
 const bounds=await page.locator('#canvas').boundingBox();assert.ok(bounds);
 await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.5);
 await page.mouse.down();await page.mouse.up();
 const debug=await page.evaluate(()=>({loaded:!!source,maskPixels:mask?.reduce((a,b)=>a+b,0),strokes,tool:tool.value,mode:mode.value,canExport:canExport(),errors:document.querySelector('#status').textContent}));
 assert.equal(await page.locator('#download').isDisabled(),false,'Initial brush did not activate export: '+JSON.stringify(debug));
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#download').click();
 const download=await downloadPromise;
 const fs=await import('node:fs/promises');
 const draft=JSON.parse(await fs.readFile(await download.path(),'utf8'));
 assert.equal(draft.reviewStatus,'draft');
 assert.equal(draft.reviewer,'First Reviewer');
 assert.match(draft.sourceSha256,/^[a-f0-9]{64}$/);
 assert.equal(draft.width,40);assert.equal(draft.height,30);
 assert.ok(draft.runs.length>1);
 await page.locator('#resume').setInputFiles({name:'review-case.mask.draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))});
 await page.locator('#status').getByText(/Draft restored/).waitFor();
 await page.locator('#resume').setInputFiles({name:'wrong.mask.draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...draft,image:'other.png'}))});
 await page.locator('#status').getByText(/mismatch/).waitFor();
 assert.equal(await page.locator('#download').isDisabled(),false);
 const seed={image:'review-case.png',sourceSha256:draft.sourceSha256,width:40,height:30,runs:[200,200,800],model:'test-model'};
 await page.locator('#prediction').setInputFiles({name:'prediction.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(seed))});
 await page.locator('#status').getByText(/AI starting mask loaded/).waitFor();
 // AI suggestions must be manually corrected before export.
 await page.locator('#canvas').scrollIntoViewIfNeeded();
 const seededBounds=await page.locator('#canvas').boundingBox();
 await page.mouse.move(seededBounds.x+seededBounds.width*.3,seededBounds.y+seededBounds.height*.3);
 await page.mouse.down();await page.mouse.up();
 assert.equal(await page.locator('#download').isDisabled(),false);
 const seededDownload=page.waitForEvent('download');
 await page.locator('#download').click();
 const seeded=JSON.parse(await fs.readFile(await(await seededDownload).path(),'utf8'));
 assert.equal(seeded.reviewStatus,'draft');
 assert.equal(seeded.seedModel,'test-model');
 assert.equal(seeded.reviewer,'First Reviewer');
 await page.locator('#prediction').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...seed,image:'wrong.png'}))});
 await page.locator('#status').getByText(/mismatch/).waitFor();

 // Trace four polygon corners on an internal synthetic image. Filling makes a
 // new human-edited draft; undo must fully restore the previous pixels.
 await page.locator('#photo').setInputFiles({name:'review-case.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.locator('#status').getByText(/initial mask is blank/).waitFor();
 await page.locator('#tool').selectOption('polygon');
 await page.locator('#canvas').scrollIntoViewIfNeeded();
 const at=async(x,y)=>{await page.locator('#canvas').scrollIntoViewIfNeeded();const box=await page.locator('#canvas').boundingBox();return {x:box.x+(x+.5)*box.width/40,y:box.y+(y+.5)*box.height/30};};
 for(const [x,y] of [[10,5],[30,5],[30,25],[10,25]]){
  const p=await at(x,y);await page.mouse.click(p.x,p.y);
 }
 assert.equal(await page.locator('#applyPolygon').isDisabled(),false);
 assert.equal(await page.locator('#download').isDisabled(),true,'Unapplied points are not garment pixels');
 await page.locator('#applyPolygon').click();
 assert.equal(await page.locator('#download').isDisabled(),false);
 const polyDownload=page.waitForEvent('download');
 await page.locator('#download').click();
 const polygonDraft=JSON.parse(await fs.readFile(await(await polyDownload).path(),'utf8'));
 const decode=(data)=>{const pixels=[];let bit=0;for(const count of data.runs){for(let i=0;i<count;i++)pixels.push(bit);bit=1-bit;}return pixels;};
 const pixels=decode(polygonDraft);
 assert.equal(pixels[15*40+20],1,'filled polygon contains its center');
 assert.equal(pixels[1*40+1],0,'outer background stays excluded');
 await page.locator('#undo').click();
 assert.equal(await page.locator('#download').isDisabled(),true,'Undo to blank must not export');
 await page.locator('#redo').click();
 assert.equal(await page.locator('#download').isDisabled(),false,'Redo recovers the human-drawn mask');
 await page.locator('#tool').selectOption('brush');
 await page.locator('#mode').selectOption('0');
 await page.locator('#radius').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const mid=await at(20,15);
 await page.mouse.click(mid.x,mid.y);
 assert.equal(await page.locator('#undo').isDisabled(),false);
 await page.locator('#undo').click();
 const restoredExport=page.waitForEvent('download');
 await page.locator('#download').click();
 const restored=JSON.parse(await fs.readFile(await(await restoredExport).path(),'utf8'));
 assert.deepEqual(restored.runs,polygonDraft.runs,'Undo restores previously reviewed outline exactly');

 // AI predictions must be edited. A stale Resume file selection or a
 // no-op tap on an already-masked pixel must never authorize untouched AI.
 await page.locator('#prediction').setInputFiles({name:'seed.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(seed))});
 await page.locator('#status').getByText(/AI starting mask loaded/).waitFor();
 assert.equal(await page.locator('#download').isDisabled(),true);
 await page.locator('#mode').selectOption('1');
 await page.locator('#radius').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const inSeed=await at(5,6);
 await page.mouse.click(inSeed.x,inSeed.y);
 assert.equal(await page.locator('#download').isDisabled(),true,'A no-op brush tap cannot validate a model mask');
 await page.locator('#mode').selectOption('0');
 const eraseSeed=await at(5,6);await page.mouse.click(eraseSeed.x,eraseSeed.y);
 assert.equal(await page.locator('#download').isDisabled(),false);
 await page.locator('#undo').click();
 assert.equal(await page.locator('#download').isDisabled(),true,'Undo back to untouched model suggestion must require review');

 assert.deepEqual(errors,[]);
 console.log('ANNOTATION_EDITOR_SMOKE '+JSON.stringify({status:'passed',width:draft.width,height:draft.height,runs:draft.runs.length,reviewStatus:draft.reviewStatus,pageErrors:errors.length}));
}finally{await browser.close();}
