import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {approvedReferenceMask} from '../benchmark/garment-mask-metrics.mjs';

// Generated art is used solely for workflow testing. It is not a real
// clothing annotation, is never saved as benchmark ground truth and does not
// contribute to model accuracy or mask-quality claims.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto('file://'+resolve('benchmark/approve-garment-mask.html'));
 const base64=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=40;canvas.height=30;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,40,30);
  ctx.fillStyle='#ec4455';ctx.fillRect(8,6,21,19);
  return canvas.toDataURL('image/png').split(',')[1];
 });
 const bytes=Buffer.from(base64,'base64');
 const sourceSha256=createHash('sha256').update(bytes).digest('hex');
 const valid={schemaVersion:1,image:'illustrative-review.png',sourceSha256,
  reviewStatus:'draft',width:40,height:30,runs:[100,100,1000],
  reviewer:'Reviewer One',seedModel:null};
 const load=async data=>{
  await page.locator('#draft').setInputFiles({name:'illustrative-review.mask.draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 };
 await page.locator('#photo').setInputFiles({name:valid.image,mimeType:'image/png',buffer:bytes});
 await load({...valid,sourceSha256:'wrong'});
 await page.getByRole('status').getByText(/checksum mismatch/).waitFor();
 assert.equal(await page.locator('#approve').isDisabled(),true);
 await load({...valid,reviewStatus:'approved'});
 await page.getByRole('status').getByText(/non-draft/).waitFor();
 assert.equal(await page.locator('#approve').isDisabled(),true);
 await load({...valid,reviewer:''});
 await page.getByRole('status').getByText(/First reviewer is missing/).waitFor();
 assert.equal(await page.locator('#approve').isDisabled(),true);
 await load(valid);
 await page.getByRole('status').getByText(/Source verified/).waitFor();
 assert.equal(await page.locator('#approve').isDisabled(),true);
 await page.locator('#approver').fill('Reviewer One');
 await page.locator('#verified').check();
 assert.equal(await page.locator('#approve').isDisabled(),true,'first reviewer cannot self-approve');
 await page.locator('#approver').fill('reviewer one');
 assert.equal(await page.locator('#approve').isDisabled(),true,'capitalization cannot bypass independent review');
 await page.locator('#approver').fill('Reviewer Two');
 assert.equal(await page.locator('#approve').isDisabled(),false);
 await page.locator('#reject').click();
 assert.equal(await page.locator('#approve').isDisabled(),true,'rejected annotation cannot remain approved');
 await page.locator('#verified').check();
 const downloading=page.waitForEvent('download');
 await page.locator('#approve').click();
 const file=await downloading;
 const approved=JSON.parse(await readFile(await file.path(),'utf8'));
 assert.equal(approved.reviewStatus,'approved');
 assert.equal(approved.reviewer,'Reviewer One');
 assert.equal(approved.approvedBy,'Reviewer Two');
 assert.match(approved.reviewedAt,/^\d{4}-\d{2}-\d{2}T/);
 assert.deepEqual([...approvedReferenceMask(approved,{image:valid.image,sourceSha256})],
  [...approvedReferenceMask({...approved}, {image:valid.image,sourceSha256})]);
 assert.equal(approved.sourceSha256,sourceSha256);
 assert.deepEqual(errors,[]);
 console.log('INDEPENDENT_MASK_REVIEW '+JSON.stringify({status:'passed',
   sourcedByChecksum:true,reviewersDistinct:true,
   approvalStatus:approved.reviewStatus,syntheticFixtureOnly:true,pageErrors:errors.length}));
}finally{await browser.close();}
