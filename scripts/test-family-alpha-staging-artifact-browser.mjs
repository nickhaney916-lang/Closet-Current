/** QA only: serve candidate modules from the artifact, never use cloud or real users. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';

const dir=resolve('dist-family-alpha-candidate'),root=resolve('.'),tests=[];
const index=await readFile(dir+'/index.html','utf8');
assert.match(index,/id="familyAlphaLocalPreview" hidden/);
assert.match(index,/family-alpha-preview-boot\.js/);
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
  if(pathname==='/'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
   res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:10px;font:16px system-ui}#avatar{max-width:360px;margin:auto}</style><div id="avatar"></div>');return;
  }
  let file;
  if(pathname==='/__synthetic__/synthetic-garments.mjs')
   file=resolve(root,'research/family-alpha-13/synthetic-garments.mjs');
  else {
   if(!/^\/(?:__alpha_research\/|family-alpha-(?:2d-|preview-))/.test(pathname)||
      !/\.mjs$/.test(pathname))throw Error('Not whitelisted');
   file=resolve(dir,'.'+pathname);
   if(!file.startsWith(dir+sep))throw Error('Traversal outside candidate');
  }
  if(extname(file)!=='.mjs')throw Error('Unexpected asset');
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Missing candidate module');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [name,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({
     viewport:{width,height:840},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'
    }),page=await context.newPage(),errors=[],external=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)missing.push(r.url()+' HTTP '+r.status());});
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(origin+'/')){
      external.push(route.request().url());return route.abort();
     }
     return route.continue();
    });
    try{
     await page.goto(origin+'/');
     const fact=await page.evaluate(async()=>{
      const {syntheticGarment}=await import('/__synthetic__/synthetic-garments.mjs');
      const {prepareReviewedPhotoPresentation}=await import('/__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs');
      const {confirmReviewedPhotoInContainer}=await import('/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs');
      const {mountAlphaBuilderPreview,alphaLocalEnabled}=await import('/family-alpha-preview-controller.mjs');
      const {renderAlphaAuthenticatedBoard}=await import('/family-alpha-2d-auth-preflight.mjs');
      if(typeof confirmReviewedPhotoInContainer!=='function'||
         typeof mountAlphaBuilderPreview!=='function'||
         !alphaLocalEnabled({hostname:'localhost',flag:true})||
         alphaLocalEnabled({hostname:'closet-current.pages.dev',flag:true}))
        throw Error('Wrong candidate module or default host guard');
      const scene=syntheticGarment('Tops');
      const canvas=document.createElement('canvas');canvas.width=scene.frame.width;canvas.height=scene.frame.height;
      canvas.getContext('2d').putImageData(new ImageData(scene.frame.data,canvas.width,canvas.height),0,0);
      const photo=canvas.toDataURL('image/jpeg',.97);
      const ownerId='a1111111-1111-4111-8111-111111111111';
      const item={id:'shirt-one',category:'Tops',image:photo,originalPhoto:{image:photo},
       outfitSourceId:'synthetic-staged-photo'};
      const status=await prepareReviewedPhotoPresentation({
       item,ownerId,getScope:()=>({ownerId,epoch:1}),getItem:()=>item,
       reviewPreview:async detail=>detail.originalImage===photo&&detail.transparentImage.src.startsWith('data:image/png;base64,')
      });
      if(status.status!=='approved-for-staging-preview'||
         !status.presentation.humanPreviewConfirmed||
         !status.presentation.sourcePixelAuditPassed)
       throw Error('Packaged original photo review refused synthetic simple background');
      const avatar=document.querySelector('#avatar');
      const outcome=await renderAlphaAuthenticatedBoard(avatar,{
       auth:{user:{id:ownerId},getAccessToken:async()=> 'synthetic-test-token'},
       database:{name:'closet-current-user-'+ownerId},
       getCloudOwnerId:()=>ownerId,getSessionGeneration:()=>1,
       fetchFn:async()=>({status:200,ok:true,json:async()=>({id:ownerId})}),
       publicKey:'mock-publishable',cryptoProvider:crypto,
       loadScopedWardrobe:async()=>({ownerId,indexedDbName:'closet-current-user-'+ownerId,
        board:{slots:{top:item.id}},items:[item]}),
       preparePresentations:async()=>({[item.id]:status.presentation})
      });
      const layer=avatar.querySelector('img[data-slot="top"]');
      const photoIsActual=layer?.src.startsWith('data:image/png;base64,');
      const rendered=outcome.renderedLayers;
      if(!photoIsActual||rendered!==1)throw Error('Source-backed 2D avatar image missing');
      return {rendered,photoIsActual,sourceRGBVerified:true,
       overflow:document.documentElement.scrollWidth>innerWidth};
     });
     assert.equal(fact.rendered,1);
     assert.equal(fact.photoIsActual,true);
     assert.equal(fact.overflow,false);
     assert.deepEqual(missing,[],'Candidate must not request an unresolved relative import');
     assert.deepEqual(external,[],'No external network');
     assert.deepEqual(errors,[],'No unexpected browser exceptions');
     tests.push({browser:name,width,
       reviewedOriginalJPEG:true,oneActualTransparentPhotoLayer:true,
       missingImports:missing.length,externalRequests:external.length});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(tests.length,6);
 console.log('FAMILY_ALPHA_STAGING_CANDIDATE_PACKAGE_BROWSER_PASS '+JSON.stringify(tests));
}finally{await new Promise(resolve=>server.close(resolve));}
