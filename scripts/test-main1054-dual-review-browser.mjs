/** MAIN1054: true native clothingFields plus M1 P875 policy in browser.
 * Generated decoded JPEG fixtures and synthetic owners; NEVER real customer
 * data, hosted cloud, model inference, physical phones or deploy.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const root=resolve('public'),out=resolve('benchmark/main1054-dual-policy-browser');
await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const jpeg=await sharp({create:{width:164,height:220,channels:3,background:'#4163ac'}}).jpeg({quality:90}).toBuffer();
const photo='data:image/jpeg;base64,'+jpeg.toString('base64'),sourceSHA=sha(jpeg);
const app=await readFile(resolve(root,'app.js'),'utf8');
const start=app.indexOf('function node('),end=app.indexOf('function cropClothingPhoto(');
assert.ok(start>0&&end>start,'true native clothingFields source boundaries absent');
const nativeFields=app.slice(start,end);
assert.match(nativeFields,/function clothingFields\(/);
const taxonomy=await readFile(resolve(root,'taxonomy.js'),'utf8');
const details=await readFile(resolve(root,'clothing-details.js'),'utf8');
const served={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.json':'application/json','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html'});return res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M4 M1 native owner-review test</title><body></body></html>');}
  const p=decodeURIComponent(url.pathname);
  if(req.method!=='GET'||p.includes('\\')||p.includes('\0')||p.split('/').includes('..'))throw Error('bad resource');
  const file=resolve(root,'.'+p);if(!file.startsWith(root+'/'))throw Error('outside');
  const b=await readFile(file);res.writeHead(200,{'content-type':served[extname(file)]||'application/octet-stream'});res.end(b);
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const boot=`
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
${taxonomy}
${details}
${nativeFields}
window.writes1054=0;
window.stage1054=async({hash=true,segmented=false,owned=false,owner='owner-A',mode='joint',onHold=false}={})=>{
 for(const p of document.querySelectorAll('dialog')){p.close();p.remove();}
 window.owner1054={id:owner};window.auth1054={user:window.owner1054};window.db1054={name:'closet-current-user-'+owner};
 window.epoch1054='test-epoch-'+crypto.randomUUID();window.writes1054=0;
 window.mode1054=mode;window.hold1054=onHold;window.requests1054=0;window.effects1054=0;
 const raw=${JSON.stringify(photo)},sha=${JSON.stringify(sourceSHA)};
 const item={
  id:'owner-photo-1',ownerId:owner,image:raw,
  originalPhoto:{image:raw,sha256:sha},sourceSHA256:hash?sha:'f'.repeat(64),
  sourceHashVerified:hash,category:'Bottoms',itemType:'Unknown',
  color:'Blue',colorSource:'user',userAdjusted:true,
  sleeveLength:'Not applicable',seasons:[],notes:''
 };
 if(segmented){item.segmentHint={clipped:true};item.outfitSourceId='different-photo';}
 window.item1054=item;window.items1054=owned?[item]:[];window.batch1054=owned?[]:[item];
 const dialog=document.createElement('dialog'),form=document.createElement('form');
 window.dialog1054=dialog;window.form1054=form;window.draft1054=structuredClone(item);
 clothingFields(form,window.draft1054);
 const ownerAck=document.createElement('input');ownerAck.type='checkbox';ownerAck.setAttribute('aria-label','I verified the garment photo before saving');form.append(ownerAck);window.ack1054=ownerAck;
 dialog.append(form);document.body.append(dialog);dialog.showModal();
 const {mountMission4DualReview1054}=await import('/m4-dual-review-1054.mjs');
 const {VERSION82,MODEL_ASSETS82}=await import('/dual-core-82.mjs');
 const {localCandidates}=await import('/local-catalog.mjs');
 const {observation81}=await import('/model-arbitration-81.mjs');
 const request=async(r,{signal})=>{
  window.requests1054++;
  while(window.hold1054&&!signal.aborted)await new Promise(resolve=>setTimeout(resolve,12));
  if(signal.aborted)throw Error('revoked');
  const observations=['fashionclip','fashionSiglip'].map((modelKey,i)=>
   observation81({modelKey,binding:r.binding,workerSourceSha256:r.sourceCodeSha256,
    vectorSha256:MODEL_ASSETS82[modelKey].vectorsSha256,latencyMs:3,
    scores:localCandidates.map((c,j)=>{
     const k=c.itemType;let score=j/1000;
     if(window.mode1054==='conflict')score=k===(i?'Casual dress':'Shorts')?1:score;
     else if(window.mode1054==='tied')score=k==='Shorts'||k==='Skirt'?1:score;
     else if(window.mode1054==='one-sided'&&i)score=k==='Skirt'?1:k==='Jeans'?.96:k==='Trousers'?.95:k==='Leggings'?.94:k==='Joggers'?.93:score;
     else score=k===(i?'Skirt':'Shorts')?1:k===(i?'Shorts':'Skirt')?.96:score;
     return {label:c.label,score};
    })}));
  return {schema:VERSION82,assets:MODEL_ASSETS82,requestId:r.requestId,
   createdAt:Date.now(),sourceCodeSha256:r.sourceCodeSha256,observations};
 };
 try{
  window.mounted1054=await mountMission4DualReview1054({
   form,dialog,item,draft:window.draft1054,
   editorSession:{current:()=>window.auth1054?.user===window.owner1054},
   getItems:()=>window.items1054,getBatch:()=>window.batch1054,
   getDb:()=>window.db1054,getEpoch:()=>window.epoch1054,
   getAuth:()=>window.auth1054,getSchema:()=>clothingSchema,
   saving:()=>false,request,supported:true
  });
  window.error1054=null;
 }catch(e){window.error1054=String(e.message||e);window.mounted1054=null;}
 return {mounted:!!window.mounted1054,error:window.error1054};
};
window.revoke1054=kind=>{
 if(kind==='owner')window.auth1054={user:{id:'owner-B'}};
 if(kind==='relogin')window.epoch1054='replacement-epoch';
 if(kind==='source')window.item1054.sourceSHA256='0'.repeat(64);
 if(kind==='lock')window.dispatchEvent(new Event('closet:session-locked'));
};
window.result1054=()=>({
 writes:window.writes1054,requests:window.requests1054,
 item:window.item1054.itemType,draft:window.draft1054.itemType,
 ack:window.ack1054.checked,photo:window.item1054.originalPhoto.image,
 panel:!!document.querySelector('[data-dual82]'),
 valid:window.mounted1054?.active()||false
});
`;
const results=[],screens=[],errors=[];
try{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:920},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    try{
     await ctx.route('**/*',route=>{
      if(route.request().url().startsWith(host+'/'))return route.continue();
      return route.abort(); // never call external network, model weights, cloud
     });
     const page=await ctx.newPage();
     page.on('pageerror',e=>errors.push({engineName,width,error:e.message}));
     await page.goto(host+'/');
     await page.addScriptTag({content:boot});
     // Valid owner source + no automatic model call or owner approval.
     let f=await page.evaluate(()=>window.stage1054());
     assert.equal(f.mounted,true,JSON.stringify({engineName,width,f}));
     assert.equal(await page.locator('[data-dual82]').count(),1);
     assert.equal((await page.evaluate(()=>window.result1054())).requests,0);
     const proof=await page.evaluate(()=>window.result1054());
     assert.equal(proof.ack,false);assert.equal(proof.writes,0);
     const imageFile=engineName+'-'+width+'-research-panel.png';
     await page.locator('dialog').screenshot({path:out+'/'+imageFile,animations:'disabled'});
     screens.push({image:imageFile,sha256:sha(await readFile(out+'/'+imageFile))});
     results.push({engine:engineName,width,case:'native clothingFields research panel mounts without writing',pass:true});
     // A request requires BOTH separate explicit owner declarations.
     await page.getByRole('button',{name:'Compare with two models'}).click();
     assert.equal((await page.evaluate(()=>window.result1054())).requests,0);
     await page.getByRole('checkbox',{name:/I consent to a local two-model/}).check();
     await page.getByRole('checkbox',{name:/One garment is isolated/}).check();
     await page.getByRole('button',{name:'Compare with two models'}).click();
     await page.getByRole('button',{name:/Use Shorts/}).waitFor({timeout:12000});
     await page.getByRole('button',{name:/Use Shorts/}).click();
     assert.equal((await page.evaluate(()=>window.result1054())).draft,'Unknown');
     await page.getByRole('checkbox',{name:/I compared the original photo/}).check();
     await page.getByRole('button',{name:/Use Shorts/}).click();
     const accepted=await page.evaluate(()=>window.result1054());
     assert.equal(accepted.draft,'Shorts');assert.equal(accepted.item,'Unknown');
     assert.equal(accepted.ack,false);assert.equal(accepted.writes,0);
     assert.equal(accepted.photo,photo);
     results.push({engine:engineName,width,case:'two explicit consents + review acknowledgement allow UNSAVED subtype only',pass:true});
     // Different broad categories must never offer an actionable Use button.
     f=await page.evaluate(()=>window.stage1054({mode:'conflict'}));assert.equal(f.mounted,true);
     await page.getByRole('checkbox',{name:/I consent to a local two-model/}).check();
     await page.getByRole('checkbox',{name:/One garment is isolated/}).check();
     await page.getByRole('button',{name:'Compare with two models'}).click();
     await page.getByText(/models disagree about the main clothing category/).waitFor({timeout:12000});
     assert.equal(await page.getByRole('button',{name:/^Use /}).count(),0);
     assert.equal((await page.evaluate(()=>window.result1054())).draft,'Unknown');
     results.push({engine:engineName,width,case:'cross-category disagreement abstains, no write',pass:true});
     // A source SHA mismatch, a segmented garment or already-saved record
     // cannot mount the dual-model runner.
     for(const [label,opt] of [['forged-original',{hash:false}],['segmented',{segmented:true}],['saved',{owned:true}]]){
      const refusal=await page.evaluate(x=>window.stage1054(x),opt);
      assert.equal(refusal.mounted,false,engineName+' '+label);
      assert.match(refusal.error,/MAIN1054_DUAL/);
      assert.equal(await page.locator('[data-dual82]').count(),0);
      results.push({engine:engineName,width,case:label+' blocked before model request',pass:true});
     }
     // Sign-out must immediately remove model detail from a still-open dialog.
     f=await page.evaluate(()=>window.stage1054());assert.equal(f.mounted,true);
     await page.evaluate(()=>window.revoke1054('lock'));
     assert.equal(await page.locator('[data-dual82]').count(),0);
     assert.equal((await page.evaluate(()=>window.result1054())).writes,0);
     results.push({engine:engineName,width,case:'native session-lock clears research model panel',pass:true});
     await page.close();
    }finally{await ctx.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
 assert.equal(results.length,42); // six 7-scenario sets
 assert.equal(screens.length,6);
 await writeFile(out+'/results.json',JSON.stringify({status:'PASS',total:results.length,results,screens,
  genuineModelsRun:false,modelBytesInstalled:false,realClothingPhotos:false,
  physicalPhones:false,hostedCloud:false,autoSaved:false,releaseAuthorized:false,
  familyAlpha:'HOLD'},null,2));
 console.log('MAIN1054 M4 42/42 synthetic native-editor two-model policy cases passed; 6 research panel screenshots; NO model inference or deploy');
}catch(e){console.error('MAIN1054 M4 browser gate failed',String(e),JSON.stringify(errors));process.exitCode=1;}
finally{await new Promise(done=>server.close(done));}
