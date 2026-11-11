/**
 * P774 browser-only workflow proof. All image pixels, reviewer clicks and
 * source authorizations here are synthetic CI fixtures. ZERO real humans,
 * real garment ground truth or photo rights are asserted.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,generateKeyPairSync,sign as edSign} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
import {authorManualSourceLabel774} from '../research/mission1-reviewer-774/offline-human-polygon-receipt.mjs';

const engines=process.env.M1_REVIEWER_BROWSER||'chromium,webkit';
const names=engines.split(',').map(x=>x.trim()).filter(Boolean);
assert.ok(names.length>=1&&names.every(x=>['chromium','webkit'].includes(x)));
const out='benchmark/m1-human-reviewer-ui-774';
await mkdir(out,{recursive:true});
const hashes=[];
const width=64,height=64;
const rgba=Buffer.alloc(width*height*3,255);
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const i=(y*width+x)*3;
 if(x<26&&y<30){rgba[i]=40;rgba[i+1]=90;rgba[i+2]=220;}
 if(x>30&&y>24){rgba[i]=130;rgba[i+1]=65;rgba[i+2]=45;}
}
const photo=await sharp(rgba,{raw:{width,height,channels:3}}).jpeg({quality:95}).toBuffer();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const canonical=x=>{
 if(x===null||typeof x==='boolean'||typeof x==='string')return JSON.stringify(x);
 if(typeof x==='number'&&Number.isFinite(x))return JSON.stringify(x);
 if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
 if(!x||typeof x!=='object')throw Error('invalid test source seal body');
 const keys=Object.keys(x).sort();
 return '{'+keys.map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
};
const sourceSHA=sha(photo),photoId='hold-synthetic-browser-fixture';
// ONLY ephemeral fabricated signing keys and synthetic photos are used in CI;
// these signatures never represent an independent real coordinator or human.
const members=['coordinator','reviewerA','reviewerB','adjudicator'];
const pairs=Object.fromEntries(members.map(k=>[k,generateKeyPairSync('ed25519')]));
const reviewerRegistry=Object.fromEntries(members.map(k=>
 [k,pairs[k].publicKey.export({format:'pem',type:'spki'})]));
const sealBody={schema:'closet-current-prospective-holdout/v1',
 reviewerRegistrySHA256:sha(Buffer.from(canonical(reviewerRegistry))),
 photos:[{id:photoId,image:'synthetic-fixture.jpg',sha256:sourceSHA,width,height}]};
const seal={...sealBody,sealSHA256:sha(Buffer.from(canonical(sealBody)))};
const signedPayload={purpose:'register-before-inference',sealSHA256:seal.sealSHA256};
const signedMessage=Buffer.from('closet-current-M1-v1:'+sha(Buffer.from(canonical(signedPayload))));
const registrationWitness={signerId:'coordinator',
 signature:edSign(null,signedMessage,pairs.coordinator.privateKey).toString('base64')};
for(const engine of names){
 const browser=await ({chromium,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  for(const screenWidth of [320,390]){
   const context=await browser.newContext({
    viewport:{width:screenWidth,height:844},isMobile:true,hasTouch:true,
    serviceWorkers:'block',acceptDownloads:true
   });
   try{
    const page=await context.newPage(),external=[];
    page.on('request',request=>{
     if(/^https?:/i.test(request.url()))external.push(request.url());
    });
    await page.goto(pathToFileURL(resolve('research/mission1-reviewer-774/offline-photo-polygon-review.html')).href);
    await page.locator('#cohort').setInputFiles({
     name:'sealed-fixture-only.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify(seal))
    });
    assert.equal(await page.locator('#original').isDisabled(),true,
      'cohort checksum alone must never allow JPEG annotation');
    await page.locator('#reviewerRegistry812').setInputFiles({
     name:'synthetic-public-key-registry.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify(reviewerRegistry))
    });
    const flipped=registrationWitness.signature.slice(0,-4)+'AAAA';
    await page.locator('#registrationWitness812').setInputFiles({
     name:'invalid-synthetic-coordinator-witness.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify({...registrationWitness,signature:flipped}))
    });
    await page.locator('#verifyRegistration812').click();
    await page.waitForFunction(()=>
     document.querySelector('#registrationProof812')?.textContent?.includes('REJECTED'));
    assert.equal(await page.locator('#original').isDisabled(),true);
    assert.equal(await page.locator('#export').isDisabled(),true);
    await page.locator('#registrationWitness812').setInputFiles({
     name:'valid-synthetic-coordinator-witness.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify(registrationWitness))
    });
    await page.locator('#verifyRegistration812').click();
    await page.waitForFunction(()=>
     document.querySelector('#registrationProof812')?.textContent?.includes('signature VERIFIED'));
    assert.equal(await page.locator('#original').isEnabled(),true);
    await page.locator('#original').setInputFiles({
     name:'synthetic-fixture.jpg',mimeType:'image/jpeg',buffer:photo
    });
    await page.locator('#verify').click();
    await page.getByText(/Exact original JPEG SHA-256 and dimensions VERIFIED/).waitFor();
    assert.equal(await page.locator('#export').isDisabled(),true);
    const draw=async pts=>{
     const canvas=page.locator('#drawing');
     await canvas.scrollIntoViewIfNeeded();
     for(const [i,point] of pts.entries()){
      const [x,y]=point,rect=await canvas.boundingBox();
      assert.ok(rect);
      // Locator click scrolls to the canvas even when a 320px phone has the
      // entire fieldset below the viewport; raw page.mouse.click does not.
      await canvas.click({position:{x:rect.width*x/64,y:rect.height*y/64}});
      assert.match(await page.locator('#points').textContent(),
       new RegExp('^'+(i+1)+' unfinished points'));
     }
     await page.locator('#finish').click();
    };
    await draw([[3,3],[22,3],[22,25],[3,25]]);
    assert.equal(await page.locator('#holeMode').isEnabled(),true);
    await page.locator('#holeMode').click();
    assert.equal(await page.locator('#holeMode').getAttribute('aria-pressed'),'true');
    await draw([[9,9],[15,9],[15,16],[9,16]]);
    assert.match(await page.locator('#points').textContent(),/1 inner holes/);
    await page.locator('#outerMode').click();
    assert.equal(await page.locator('#outerMode').getAttribute('aria-pressed'),'true');
    await page.locator('#category').selectOption('Tops');
    await page.locator('#subtype').selectOption('Blouse');
    await page.locator('#color').selectOption('Blue');
    await page.locator('#add').click();
    await draw([[33,31],[59,31],[59,58],[33,58]]);
    await page.locator('#category').selectOption('Bottoms');
    await page.locator('#subtype').selectOption('Jeans');
    await page.locator('#color').selectOption('Brown');
    await page.locator('#add').click();
    assert.equal(await page.locator('#regions li').count(),2);
    assert.equal(await page.locator('#export').isEnabled(),true);
    const screenshot=out+'/'+engine+'-'+screenWidth+'-synthetic-human-annotation-ui.png';
    await page.screenshot({path:screenshot,fullPage:true});
    const rendered=await readFile(screenshot);
    hashes.push({engine,width:screenWidth,sha256:sha(rendered),syntheticOnly:true});
    const wait=page.waitForEvent('download');
    await page.locator('#export').click();
    const download=await wait;
    const stream=await download.createReadStream();
    const chunks=[];for await(const chunk of stream)chunks.push(chunk);
    const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    assert.equal(result.sourceId,photoId);
    assert.equal(result.sourceSHA256,sourceSHA);
    assert.deepEqual(result.regions.map(r=>[r.category,r.subtype,r.primaryColor]),
     [['Tops','Blouse','Blue'],['Bottoms','Jeans','Brown']]);
    assert.equal(result.regions.length,2);
    assert.ok(result.regions.every(r=>r.polygons.length===1&&r.polygons[0].length===4));
    assert.equal(result.regions[0].holes.length,1);
    assert.equal(result.regions[0].holes[0].length,4);
    assert.deepEqual(result.regions[1].holes,[]);
    const truthful=authorManualSourceLabel774({photo:{width,height,sha256:sourceSHA},regions:[result.regions[0]]});
    const rle=truthful.instances[0].rle;
    const selectedAt=(x,y)=>{const pixel=y*width+x;let cursor=0,mask=0;
     for(const run of rle){if(pixel<cursor+run)return mask;cursor+=run;mask=1-mask;}throw Error('invalid RLE');};
    assert.equal(selectedAt(6,6),1,'retained human outer polygon fabric');
    assert.equal(selectedAt(12,12),0,'human hole pixels excluded from signed original-source RLE');
    assert.equal(result.explicitNoGarments,false);
    assert.deepEqual(external,[]);
    await page.locator('#original').setInputFiles({
     name:'tampered-source.jpg',mimeType:'image/jpeg',
     buffer:Buffer.concat([photo.subarray(0,20),Buffer.from([9]),photo.subarray(21)])
    });
    await page.locator('#verify').click();
    // SHA-256 uses asynchronous WebCrypto; wait for the actual computed
    // refusal rather than reading the preceding successful export status.
    await page.waitForFunction(()=>
     document.getElementById('status')?.textContent?.includes('differs from the immutable registered source SHA'));
    assert.equal(await page.locator('#export').isDisabled(),true);
    // Deterministic stale promise: after cryptographic SHA, freeze decode,
    // switch to another selected JPEG, then release the OLD image decode.
    await page.locator('#original').setInputFiles({
     name:'source-before-race.jpg',mimeType:'image/jpeg',buffer:photo
    });
    await page.evaluate(()=>{
     const originalDecode=HTMLImageElement.prototype.decode;
     const originalRevoke=URL.revokeObjectURL.bind(URL);
     window.__m1Source810={release:null,done:false,revoked:[]};
     URL.revokeObjectURL=url=>{
      window.__m1Source810.revoked.push(url);
      originalRevoke(url);
     };
     HTMLImageElement.prototype.decode=function(){
      const that=this;
      return new Promise((resolve,reject)=>{
       window.__m1Source810.release=()=>{
        originalDecode.call(that).then(()=>{
         window.__m1Source810.done=true;resolve();
        },reject);
       };
      });
     };
    });
    await page.locator('#verify').click();
    await page.waitForFunction(()=>typeof window.__m1Source810?.release==='function');
    await page.locator('#original').setInputFiles({
     name:'source-selected-after-race.jpg',mimeType:'image/jpeg',
     buffer:Buffer.concat([photo.subarray(0,20),Buffer.from([8]),photo.subarray(21)])
    });
    await page.evaluate(()=>window.__m1Source810.release());
    await page.waitForFunction(()=>window.__m1Source810?.done&&window.__m1Source810.revoked.length>=1);
    assert.equal(await page.locator('#export').isDisabled(),true,'stale photo cannot re-enable export');
    assert.equal(await page.locator('#add').isDisabled(),true);
    assert.equal(await page.locator('#holeMode').isDisabled(),true);
    assert.equal(await page.locator('#proof').textContent(),'No image verified.');
    assert.deepEqual(external,[],'offline source race must not fetch remotely');
    const raced=out+'/'+engine+'-'+screenWidth+'-source-race-stale-rejected.png';
    await page.screenshot({path:raced,fullPage:true});
    hashes.push({engine,width:screenWidth,sha256:sha(await readFile(raced)),
     syntheticOnly:true,kind:'stale-source-rejected'});
    console.log('P810_STALE_SOURCE_DECODE_DISCARDED_AND_BLOB_REVOKED',engine,screenWidth);
    // P811: a seal whose source dimensions have changed without re-sealing
    // is never accepted as an independent pre-inference registration.
    const tamperedSeal={...seal,photos:[{...seal.photos[0],width:65}]};
    await page.locator('#cohort').setInputFiles({
     name:'tampered-prospective-seal.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify(tamperedSeal))
    });
    await page.waitForFunction(()=>
     document.getElementById('status')?.textContent?.includes('Prospective seal SHA-256 mismatch'));
    assert.equal(await page.locator('#photoId').isDisabled(),true);
    assert.equal(await page.locator('#original').isDisabled(),true);
    assert.equal(await page.locator('#verify').isDisabled(),true);
    assert.equal(await page.locator('#export').isDisabled(),true);
    assert.equal(await page.locator('#proof').textContent(),'No image verified.');
    assert.deepEqual(external,[]);
    const tamperedPath=out+'/'+engine+'-'+screenWidth+'-tampered-seal-refused.png';
    await page.screenshot({path:tamperedPath,fullPage:true});
    hashes.push({engine,width:screenWidth,sha256:sha(await readFile(tamperedPath)),
     syntheticOnly:true,kind:'tampered-seal-rejected'});
    console.log('P811_TAMPERED_SEAL_SHA_REJECTED_BEFORE_OFFLINE_REVIEW',engine,screenWidth);
    // Even a re-computed valid checksum cannot authorize an image that
    // violates the signer adapter's minimum 32x32 source-pixel bounds.
    const undersizedBody={...sealBody,photos:[{...seal.photos[0],width:31}]};
    const undersizedSeal={...undersizedBody,sealSHA256:sha(Buffer.from(canonical(undersizedBody)))};
    await page.locator('#cohort').setInputFiles({
     name:'undersized-original-seal.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify(undersizedSeal))
    });
    await page.waitForFunction(()=>document.getElementById('status')?.textContent?.
     includes('Invalid or duplicated registered original JPEG identity'));
    assert.equal(await page.locator('#original').isDisabled(),true);
    assert.equal(await page.locator('#export').isDisabled(),true);
    console.log('P811_VALID_CHECKSUM_BUT_INVALID_SIGNER_SOURCE_DIMENSIONS_REJECTED',engine,screenWidth);
    // P812: importing a clean cohort alone does not restore registration.
    // A forged coordinator witness is refused before original JPEG review.
    await page.locator('#cohort').setInputFiles({
     name:'reloaded-valid-synthetic-seal.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify(seal))
    });
    await page.waitForFunction(()=>!document.getElementById('verifyRegistration812').disabled);
    assert.equal(await page.locator('#original').isDisabled(),true);
    await page.locator('#registrationWitness812').setInputFiles({
     name:'forged-coordinator-witness.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify({...registrationWitness,signature:flipped}))
    });
    await page.locator('#verifyRegistration812').click();
    await page.waitForFunction(()=>document.querySelector('#registrationProof812')?.
      textContent?.includes('REJECTED'));
    assert.equal(await page.locator('#original').isDisabled(),true);
    assert.equal(await page.locator('#export').isDisabled(),true);
    assert.deepEqual(external,[]);
    const witnessScreenshot=out+'/'+engine+'-'+screenWidth+'-invalid-witness-refused.png';
    await page.screenshot({path:witnessScreenshot,fullPage:true});
    hashes.push({engine,width:screenWidth,sha256:sha(await readFile(witnessScreenshot)),
     syntheticOnly:true,kind:'invalid-witness-rejected'});
    console.log('P812_FABRICATED_WITNESS_REFUSED_BEFORE_ANY_JPEG_REVIEW',engine,screenWidth);
    console.log('P809_HUMAN_OUTER_MINUS_HOLE_SYNTHETIC_BROWSER_RECEIPT_NO_EXTERNAL_REQUEST',engine,screenWidth,
     screenshot,sha(rendered));
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
await writeFile(out+'/synthetic-only-screenshot-receipts.json',
 JSON.stringify({testedBrowserEngines:names,widths:[320,390],sourceSHA256:sourceSHA,
  screenshotReceipts:hashes,actualIndependentHumanReviewers:0,
  realPhotoOwnerPermissionVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'},null,2)+'\n');
