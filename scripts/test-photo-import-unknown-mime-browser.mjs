import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

for (const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
 const browser=await engine.launch({headless:true});
 try {
  const page=await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({path:'public/photo-import.js'});
  const actual=await page.evaluate(async()=>{
   const files=[
    new File([new Uint8Array([1])],'coat.HEIC',{type:''}),
    new File([new Uint8Array([2])],'shirt.JPG',{type:''}),
    new File([new Uint8Array([3])],'notes.txt',{type:''}),
    new File([new Uint8Array([4])],'photo.jpg.exe',{type:''}),
    new File([new Uint8Array([5])],'camera-roll',{type:'image/jpeg'})
   ];
   const seen=[];
   const result=await readPhotoBatch(files,async file=>{
    seen.push(file.name);
    return 'synthetic-browser-fixture:' + file.name;
   },async()=>true);
   return {added:result.added,statuses:result.results.map(x=>x.status),seen};
  });
  assert.equal(actual.added,3,`${name}: three accepted image candidates`);
  assert.deepEqual(actual.statuses,['added','added','rejected','rejected','added'],`${name}: valid fallback and rejection`);
  assert.deepEqual(actual.seen,['coat.HEIC','shirt.JPG','camera-roll'],`${name}: only candidates decoded`);
  console.log(name + ": real browser File API and original readPhotoBatch classification PASS (synthetic image contents)");
 } finally {await browser.close();}
}
