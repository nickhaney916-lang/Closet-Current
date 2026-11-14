import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!path.startsWith(root+sep))throw Error();res.setHeader('Content-Type',path.endsWith('.mjs')?'text/javascript':'text/plain');res.end(await readFile(path));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const image='data:image/jpeg;base64,'+(await readFile('benchmark/fixtures/commons-0053.jpg')).toString('base64');
try{for(const [engine,kind] of Object.entries({chromium,webkit})){
 const browser=await kind.launch({headless:true});
 try{const page=await browser.newPage();await page.goto(origin+'/README.md');
 const results=await page.evaluate(async({origin,image})=>{
  const {createCatalogCrosswalk}=await import(origin+'/research/p87-catalog-crosswalk/crosswalk.mjs');
  const {digestBytes,jpegBytes}=await import(origin+'/public/native-canonical-photo-source-167.mjs');
  const sha=await digestBytes(jpegBytes(image));
  let token={ownerId:'synthetic-alice',session:'1',database:'alice',revision:'1'};
  let records=[{id:'dress',ownerId:token.ownerId,category:'Dresses',itemType:'Casual dress',confirmedDetails:{category:'Dresses',itemType:'Casual dress'},sourceSHA256:sha,sourceHashVerified:true,singleGarmentVerified:true,originalPhoto:{image,sha256:sha}}];
  const api=createCatalogCrosswalk({lease:()=>token,readSavedItems:async()=>records});
  const row=await api.item('dress');
  const checks={sha:sha==='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',original:row.fallback.image===image,only2D:row.state==='2D_ONLY'&&!row.consumer3D,slot:(await api.query({slot:'top'})).ids[0]==='dress'};
  // Real licensed JPEG source: neither false hash flags nor invented segment
  // digests may preserve a previously approved garment's outfit eligibility.
  records[0].sourceHashVerified=false;
  const noReceipt=await api.item('dress');
  checks.unverifiedOutfitDenied=noReceipt.fallback===null&&noReceipt.slotIds.length===0&&
   Object.keys((await api.board({slots:{top:'dress'}})).slots).length===0;
  records[0].sourceHashVerified=true;
  records[0].singleGarmentVerified=false;
  records[0].outfitSourceId='source-dress';
  records[0].segmentHint={verified:true,ownerReviewedInstance:true,originalSHA256:sha,
   cutoutSHA256:'b'.repeat(64),cutoutImage:image,clipped:false};
  checks.forgedCutoutDenied=(await api.item('dress')).slotIds.length===0&&
   Object.keys((await api.board({slots:{top:'dress'}})).slots).length===0;
  delete records[0].segmentHint;delete records[0].outfitSourceId;
  records[0].singleGarmentVerified=true;
  checks.validSourceRestored=(await api.item('dress')).slotIds.includes('top');
  records[0].sourceRevoked=true;try{await api.item('dress');checks.revoke=false;}catch{checks.revoke=true;}
  records[0].sourceRevoked=false;token={...token,ownerId:'synthetic-bob'};try{await api.query();checks.isolation=false;}catch{checks.isolation=true;}
  return checks;
 },{origin,image});
 assert.ok(Object.values(results).every(Boolean),JSON.stringify(results));console.log(JSON.stringify({engine,checks:results,physicalPhone:false}));
 }finally{await browser.close();}
}}finally{server.close();}
